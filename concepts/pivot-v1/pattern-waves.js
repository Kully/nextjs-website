import { Renderer, Program, Mesh, Triangle, RenderTarget, Texture } from 'https://unpkg.com/ogl@1.0.11/src/index.js';
import { passVertex, fieldFragment, rippleFragment, markFragment } from './pattern-waves-shaders.js';

const SURFACE_PRESETS = {
  silk: {
    pattern: 'dot', wave: 'silk', spacing: 9, markSize: 0.95, depth: 0.95, light: 0,
    shine: 0.8, contrast: 1.2, speed: 0.35, scale: 1, direction: 20,
  },
  ocean: {
    pattern: 'dot', wave: 'swell', spacing: 10, markSize: 0.9, depth: 0.42, light: 0,
    shine: 1, contrast: 1.2, speed: 0.5, scale: 1, direction: 100,
  },
  pond: {
    pattern: 'dot', wave: 'ripple', spacing: 10, markSize: 0.9, depth: 0.55, light: 0,
    shine: 1.2, contrast: 1.2, speed: 0.5, scale: 1, direction: 35,
  },
  lines: {
    pattern: 'line', wave: 'silk', spacing: 12, markSize: 0.42, depth: 0.9, light: 0,
    shine: 0.6, contrast: 1.2, speed: 0.3, scale: 1, direction: 20,
  },
  terminal: {
    pattern: 'glyph', wave: 'ripple', spacing: 13, markSize: 0.95, depth: 0.75, light: 0,
    shine: 0.9, contrast: 1.4, speed: 0.3, scale: 1.1, direction: 200,
  },
  mesh: {
    pattern: 'plus', wave: 'silk', spacing: 14, markSize: 0.8, depth: 0.95, light: 0,
    shine: 1, contrast: 1.45, speed: 0.4, scale: 1.1, direction: 325,
  },
};

const DEFAULT_OPTIONS = {
  preset: 'silk',
  color: '#ffffff',
  backgroundColor: '#000000',
  opacity: 1,
  fade: 'edges',
  fadeSize: 0.5,
  characters: '.:-=+*#%@',
  interactive: true,
  cursorSize: 50,
  cursorStrength: 0.6,
  intro: true,
  paused: false,
};

const PRESET_KEYS = Object.keys(SURFACE_PRESETS.silk);
const PATTERNS = { dot: 0, square: 1, plus: 2, line: 3, glyph: 4 };
const WAVES = { silk: 0, swell: 1, ripple: 2 };
const FADES = { none: 0, edges: 1, center: 2, bottom: 3, top: 4 };
const GLYPH_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const ATLAS_TILE = 128;
const WAVE_UNIT = 520;
const RIPPLE_CELL = 8;
const RIPPLE_RATE = 30;
const PIXEL_BUDGET = 4.5e6;
const INTRO_SECONDS = 2;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const luminance = (rgba) => 0.2126 * rgba[0] + 0.7152 * rgba[1] + 0.0722 * rgba[2];

const parseColor = (value, fallback) => {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return fallback;
  ctx.fillStyle = '#000000';
  ctx.fillStyle = value;
  const resolved = ctx.fillStyle;
  if (resolved.startsWith('#')) {
    const n = parseInt(resolved.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
  }
  const parts = resolved.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return fallback;
  return [Number(parts[0]) / 255, Number(parts[1]) / 255, Number(parts[2]) / 255, parts[3] ? Number(parts[3]) : 1];
};

const resolveSettings = (options) => {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  const base = SURFACE_PRESETS[merged.preset] || SURFACE_PRESETS.silk;
  const surface = Object.fromEntries(PRESET_KEYS.map((key) => [key, options[key] ?? base[key]]));
  return {
    ...merged,
    ...surface,
    color: parseColor(merged.color, [1, 1, 1, 1]),
    background: parseColor(merged.backgroundColor, [0, 0, 0, 1]),
  };
};

const buildAtlas = (characters) => {
  const glyphs = Array.from(characters && characters.length ? characters : DEFAULT_OPTIONS.characters);
  const columns = Math.ceil(Math.sqrt(glyphs.length));
  const lines = Math.ceil(glyphs.length / columns);
  const canvas = document.createElement('canvas');
  canvas.width = columns * ATLAS_TILE;
  canvas.height = lines * ATLAS_TILE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `500 ${Math.round(ATLAS_TILE * 0.86)}px ${GLYPH_FONT}`;
  glyphs.forEach((glyph, index) => {
    const x = (index % columns) * ATLAS_TILE + ATLAS_TILE / 2;
    const y = Math.floor(index / columns) * ATLAS_TILE + ATLAS_TILE / 2;
    ctx.fillText(glyph, x, y);
  });
  return { canvas, columns, lines, count: glyphs.length };
};

/**
 * Renders an animated, cursor-reactive WebGL pattern surface into a container.
 * Port of the React Bits PatternWaves component.
 * @param {HTMLElement} container - Element the canvas is appended to; it sizes the surface.
 * @param {object} [initialOptions] - Same props as the React component (preset, color, fade, ...).
 * @returns {{update: function(object): void, destroy: function(): void}|null} Controls, or null
 *   when WebGL2 is unavailable.
 */
export const createPatternWaves = (container, initialOptions = {}) => {
  const renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  const { gl } = renderer;
  if (!renderer.isWebgl2) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }
  gl.clearColor(0, 0, 0, 0);
  const canvas = gl.canvas;
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  let options = { ...initialOptions };
  let settings = resolveSettings(options);

  const geometry = new Triangle(gl);
  const blank = new Texture(gl);
  const floatTargets = !!gl.getExtension('EXT_color_buffer_float');

  const dispose = (target) => {
    gl.deleteFramebuffer(target.buffer);
    gl.deleteTexture(target.texture.texture);
  };

  const fieldTargetFor = (w, h) =>
    new RenderTarget(gl, { width: w, height: h, depth: false, minFilter: gl.NEAREST, magFilter: gl.NEAREST });

  const rippleTargetFor = (w, h) =>
    new RenderTarget(gl, {
      width: w,
      height: h,
      depth: false,
      type: gl.HALF_FLOAT,
      format: gl.RGBA,
      internalFormat: gl.RGBA16F,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
    });

  const passProgram = (fragment, uniforms) =>
    new Program(gl, { vertex: passVertex, fragment, uniforms, depthTest: false, depthWrite: false });

  let fieldTarget = fieldTargetFor(1, 1);
  let ripple = null;

  const atlasTexture = new Texture(gl, {
    generateMipmaps: true,
    minFilter: gl.LINEAR_MIPMAP_LINEAR,
    magFilter: gl.LINEAR,
    flipY: false,
  });

  const fieldUniforms = {
    uSize: { value: [1, 1] },
    uDpr: { value: 1 },
    uOrigin: { value: [0, 0] },
    uPitch: { value: [1, 1] },
    uWave: { value: 0 },
    uTime: { value: 0 },
    uUnit: { value: WAVE_UNIT },
    uHeading: { value: [1, 0] },
    uAmp: { value: 0 },
    uDepth: { value: 0.5 },
    uLight: { value: [0, 0, 1] },
    uShine: { value: 0.8 },
    uContrast: { value: 1 },
    uInk: { value: 0 },
    uOpacity: { value: 1 },
    uFade: { value: 0 },
    uFadeSize: { value: 0.5 },
    uAppear: { value: 0 },
    tRipple: { value: blank },
    uRipple: { value: 0 },
  };
  const fieldMesh = new Mesh(gl, { geometry, program: passProgram(fieldFragment, fieldUniforms) });

  const rippleUniforms = {
    tState: { value: blank },
    uTexel: { value: [1, 1] },
    uSize: { value: [1, 1] },
    uFrom: { value: [0, 0] },
    uTo: { value: [0, 0] },
    uRadius: { value: 40 },
    uImpulse: { value: 0 },
    uDamping: { value: 0.975 },
  };
  const rippleMesh = new Mesh(gl, { geometry, program: passProgram(rippleFragment, rippleUniforms) });

  const markUniforms = {
    tField: { value: fieldTarget.texture },
    tAtlas: { value: atlasTexture },
    uOrigin: { value: [0, 0] },
    uPitch: { value: [1, 1] },
    uGrid: { value: [1, 1] },
    uPattern: { value: 0 },
    uMarkSize: { value: 0.9 },
    uStroke: { value: 2 },
    uColor: { value: [1, 1, 1] },
    uAccent: { value: [1, 1, 1] },
    uBackground: { value: [0, 0, 0, 1] },
    uAtlas: { value: [1, 1, 0] },
  };
  const markMesh = new Mesh(gl, { geometry, program: passProgram(markFragment, markUniforms) });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = 1;
  let height = 1;
  let raf = 0;
  let last = performance.now();
  let time = 0;
  let introClock = 0;
  let visible = true;
  let alive = true;
  let dirty = true;
  let rippleUntil = 0;
  let rippleLive = false;
  let rippleClock = 0;
  let atlasKey = '';
  const pointer = { x: 0, y: 0, inside: false, placed: false, lastX: 0, lastY: 0, burst: 0 };

  const buildRipple = () => {
    if (!floatTargets) return;
    const w = clamp(Math.ceil(width / RIPPLE_CELL), 4, 512);
    const h = clamp(Math.ceil(height / RIPPLE_CELL), 4, 512);
    if (ripple && ripple.width === w && ripple.height === h) return;
    if (ripple) {
      dispose(ripple.read);
      dispose(ripple.write);
    }
    ripple = { width: w, height: h, read: rippleTargetFor(w, h), write: rippleTargetFor(w, h) };
    rippleLive = false;
  };

  const clearRipple = () => {
    if (!ripple) return;
    [ripple.read, ripple.write].forEach((target) => {
      renderer.bindFramebuffer(target);
      gl.viewport(0, 0, target.width, target.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
    });
    renderer.bindFramebuffer();
  };

  const refreshAtlas = (s) => {
    if (s.characters === atlasKey) return;
    atlasKey = s.characters;
    const built = buildAtlas(s.characters);
    if (!built) return;
    atlasTexture.image = built.canvas;
    markUniforms.uAtlas.value = [built.columns, built.lines, built.count];
  };

  const stepRipple = (field, s, dt) => {
    rippleClock = Math.min(rippleClock + dt * RIPPLE_RATE, 4);
    const strength = clamp(s.cursorStrength, 0, 1);
    const moved = Math.hypot(pointer.x - pointer.lastX, pointer.y - pointer.lastY);
    let impulse = (pointer.inside ? Math.min(moved / 14, 1) * 0.35 * strength : 0) + pointer.burst * strength;
    pointer.burst = 0;
    rippleUniforms.uTexel.value = [1 / field.width, 1 / field.height];
    rippleUniforms.uSize.value = [width, height];
    rippleUniforms.uFrom.value = [pointer.lastX, height - pointer.lastY];
    rippleUniforms.uTo.value = [pointer.x, height - pointer.y];
    rippleUniforms.uRadius.value = clamp(s.cursorSize, 8, 400);
    while (rippleClock >= 1) {
      rippleClock -= 1;
      rippleUniforms.tState.value = field.read.texture;
      rippleUniforms.uImpulse.value = impulse;
      renderer.render({ scene: rippleMesh, target: field.write, clear: false });
      const next = field.read;
      field.read = field.write;
      field.write = next;
      impulse = 0;
    }
    pointer.lastX = pointer.x;
    pointer.lastY = pointer.y;
  };

  const frame = (now) => {
    raf = 0;
    if (!alive) return;
    const s = settings;
    const dt = Math.min(0.05, Math.max(1 / 240, (now - last) / 1000));
    last = now;

    const moving = !s.paused && !reducedMotion && s.speed !== 0;
    if (moving) time += dt * s.speed;
    introClock = s.intro && !reducedMotion ? Math.min(1, introClock + dt / INTRO_SECONDS) : 1;
    const appear = 1 - (1 - clamp(introClock / 0.75, 0, 1)) ** 3;
    const rise = clamp((introClock - 0.1) / 0.9, 0, 1);
    const amp = rise * rise * (3 - 2 * rise);

    const rippling = s.interactive && !reducedMotion && !!ripple && s.cursorStrength > 0;
    if (rippling && pointer.inside && !pointer.placed) {
      pointer.lastX = pointer.x;
      pointer.lastY = pointer.y;
      pointer.placed = true;
    }
    if (rippling && (pointer.inside || pointer.burst > 0)) rippleUntil = now + 5000;
    const rippleActive = rippling && now < rippleUntil;
    if (rippleActive && ripple) {
      stepRipple(ripple, s, dt);
      rippleLive = true;
    } else if (rippleLive) {
      clearRipple();
      rippleLive = false;
    }

    const patternIndex = PATTERNS[s.pattern] ?? 0;
    if (patternIndex === 4) refreshAtlas(s);

    const canvasW = gl.canvas.width;
    const canvasH = gl.canvas.height;
    const dpr = canvasW / width;
    const pitchY = Math.max(4, Math.round(clamp(s.spacing, 4, 120) * dpr));
    const pitchX = patternIndex === 3 ? Math.max(2, Math.round(pitchY / 4)) : pitchY;
    const cols = Math.min(4096, Math.ceil(canvasW / pitchX) + 1);
    const rows = Math.min(4096, Math.ceil(canvasH / pitchY) + 2);
    const origin = [Math.floor((canvasW - cols * pitchX) / 2), Math.floor((canvasH - rows * pitchY) / 2)];
    if (fieldTarget.width !== cols || fieldTarget.height !== rows) {
      dispose(fieldTarget);
      fieldTarget = fieldTargetFor(cols, rows);
      markUniforms.tField.value = fieldTarget.texture;
    }
    const heading = (s.direction * Math.PI) / 180;
    const lightAngle = ((s.direction + 180 + clamp(s.light, -90, 90)) * Math.PI) / 180;
    const { background } = s;
    const ink = background[3] > 0.02 ? luminance(s.color) < luminance(background) : luminance(s.color) < 0.5;

    fieldUniforms.uSize.value = [width, height];
    fieldUniforms.uDpr.value = dpr;
    fieldUniforms.uOrigin.value = origin;
    fieldUniforms.uPitch.value = [pitchX, pitchY];
    fieldUniforms.uWave.value = WAVES[s.wave] ?? 0;
    fieldUniforms.uTime.value = time;
    fieldUniforms.uUnit.value = WAVE_UNIT * clamp(s.scale, 0.2, 5);
    fieldUniforms.uHeading.value = [Math.cos(heading), Math.sin(heading)];
    fieldUniforms.uAmp.value = amp;
    fieldUniforms.uDepth.value = clamp(s.depth, 0, 1.5);
    fieldUniforms.uLight.value = [Math.cos(lightAngle) * 0.78, Math.sin(lightAngle) * 0.78, 0.62];
    fieldUniforms.uShine.value = clamp(s.shine, 0, 2);
    fieldUniforms.uContrast.value = clamp(s.contrast, 0.3, 3);
    fieldUniforms.uInk.value = ink ? 1 : 0;
    fieldUniforms.uOpacity.value = clamp(s.opacity, 0, 1);
    fieldUniforms.uFade.value = FADES[s.fade] ?? 0;
    fieldUniforms.uFadeSize.value = clamp(s.fadeSize, 0.05, 1);
    fieldUniforms.uAppear.value = appear;
    fieldUniforms.tRipple.value = ripple && rippleLive ? ripple.read.texture : blank;
    fieldUniforms.uRipple.value = rippleLive ? 0.32 : 0;
    renderer.render({ scene: fieldMesh, target: fieldTarget });

    markUniforms.uOrigin.value = origin;
    markUniforms.uPitch.value = [pitchX, pitchY];
    markUniforms.uGrid.value = [cols, rows];
    markUniforms.uPattern.value = patternIndex;
    markUniforms.uMarkSize.value = clamp(s.markSize, 0.05, 1);
    markUniforms.uStroke.value = patternIndex === 3 ? 0.9 * dpr : Math.max(1.1 * dpr, pitchY * 0.08);
    const tint = ink ? 0 : 1;
    const blend = ink ? 0.35 : 0.55;
    markUniforms.uColor.value = s.color.slice(0, 3);
    markUniforms.uAccent.value = s.color.slice(0, 3).map((channel) => channel + (tint - channel) * blend);
    markUniforms.uBackground.value = background;
    renderer.render({ scene: markMesh });
    dirty = false;

    if (visible && (moving || introClock < 1 || rippleActive || dirty)) raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (raf || !visible || !alive) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    renderer.dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / (width * height)));
    renderer.setSize(width, height);
    buildRipple();
    dirty = true;
    start();
  };

  const locate = (e) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height };
  };

  const onPointerMove = (e) => {
    const spot = locate(e);
    pointer.x = spot.x;
    pointer.y = spot.y;
    if (spot.inside !== pointer.inside) pointer.placed = false;
    pointer.inside = spot.inside;
    if (spot.inside) start();
  };

  const onPointerDown = (e) => {
    const spot = locate(e);
    if (!spot.inside) return;
    pointer.x = spot.x;
    pointer.y = spot.y;
    if (!pointer.inside) {
      pointer.lastX = spot.x;
      pointer.lastY = spot.y;
    }
    pointer.burst = 1.2;
    start();
  };

  const onPointerLeave = () => {
    pointer.inside = false;
    pointer.placed = false;
    start();
  };

  const onPointerOut = (e) => {
    if (!e.relatedTarget) onPointerLeave();
  };

  const onPointerUp = (e) => {
    if (e.pointerType === 'touch') onPointerLeave();
  };

  const onVisibility = () => {
    if (!document.hidden) start();
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointerout', onPointerOut, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('blur', onPointerLeave);
  document.addEventListener('visibilitychange', onVisibility);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    start();
  });
  intersectionObserver.observe(container);
  resize();

  return {
    update(nextOptions) {
      options = { ...options, ...nextOptions };
      settings = resolveSettings(options);
      dirty = true;
      start();
    },
    destroy() {
      alive = false;
      visible = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerout', onPointerOut);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('blur', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      if (ripple) {
        dispose(ripple.read);
        dispose(ripple.write);
      }
      dispose(fieldTarget);
      gl.deleteTexture(atlasTexture.texture);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    },
  };
};
