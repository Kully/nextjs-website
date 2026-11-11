const PILL_GLIDE_BASE_STIFFNESS = 520;
const PILL_GLIDE_STEP_S = 1 / 240;

const pillClamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Spring engine that slides one highlight pill between nav items. The front
 * and back edges chase the target at different stiffness so the pill
 * stretches, and a clipped copy of the labels keeps text legible on it.
 * @param {Object} opts - Engine options.
 * @param {HTMLElement} opts.track - Element the pill and slots are laid out in.
 * @param {HTMLElement} opts.glide - The moving pill element.
 * @param {HTMLElement} opts.ink - Layer of highlight-colored labels clipped to the pill.
 * @param {HTMLElement[]} opts.slots - Item slots the pill can land on.
 * @param {function(): number} opts.targetIndex - Returns the slot index to chase, or -1 to hide.
 * @param {number} opts.bounce - Overshoot amount from 0 to 1.
 * @param {number} opts.stretch - Edge stretch amount from 0 to 1.
 * @returns {{wake: function, refresh: function, press: function, release: function}} Controls.
 */
const createPillGlide = ({ track, glide, ink, slots, targetIndex, bounce, stretch }) => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = { x0: 0, x1: 0, v0: 0, v1: 0, alpha: 0, pop: 1, press: 1, pressVelocity: 0, sliding: false, pressing: false };
  let rects = [];
  let trackWidth = 0;
  let trackHeight = 0;
  let raf = 0;
  let last = 0;

  const measure = () => {
    trackWidth = track.offsetWidth;
    trackHeight = track.offsetHeight;
    rects = slots.map((slot) => ({ left: slot.offsetLeft, width: slot.offsetWidth }));
  };

  const render = () => {
    const width = Math.max(0, state.x1 - state.x0);
    const scale = state.press * state.pop;
    const target = rects[targetIndex()];
    const squash = target ? 1 - pillClamp((width / Math.max(target.width, 1) - 1) * 0.3, 0, 0.14) : 1;
    glide.style.width = `${width}px`;
    glide.style.transform = `translate3d(${state.x0}px, 0, 0) scale(${scale}, ${scale * squash})`;
    glide.style.opacity = `${state.alpha}`;
    const half = (width * scale) / 2;
    const center = (state.x0 + state.x1) / 2;
    const inset = (trackHeight * (1 - scale * squash)) / 2;
    ink.style.clipPath = `inset(${inset}px ${trackWidth - center - half}px ${inset}px ${center - half}px round ${trackHeight / 2}px)`;
    ink.style.opacity = `${state.alpha}`;
  };

  const chase = (target, dt) => {
    const t0 = target.left;
    const t1 = target.left + target.width;
    if (state.alpha < 0.02 && !state.sliding) {
      Object.assign(state, { x0: t0, x1: t1, v0: 0, v1: 0, pop: 0.9 });
    }
    if (reduce) {
      Object.assign(state, { x0: t0, x1: t1, v0: 0, v1: 0 });
      return;
    }
    const zeta = 1 - 0.55 * bounce;
    const direction = Math.sign((t0 + t1) / 2 - (state.x0 + state.x1) / 2);
    const lead = PILL_GLIDE_BASE_STIFFNESS * (1 + 0.9 * stretch);
    const trail = PILL_GLIDE_BASE_STIFFNESS * (1 - 0.5 * stretch);
    const k0 = direction < 0 ? lead : direction > 0 ? trail : PILL_GLIDE_BASE_STIFFNESS;
    const k1 = direction > 0 ? lead : direction < 0 ? trail : PILL_GLIDE_BASE_STIFFNESS;
    const steps = Math.ceil(dt / PILL_GLIDE_STEP_S);
    const h = dt / steps;
    for (let i = 0; i < steps; i += 1) {
      state.v0 += (-k0 * (state.x0 - t0) - 2 * zeta * Math.sqrt(k0) * state.v0) * h;
      state.x0 += state.v0 * h;
      state.v1 += (-k1 * (state.x1 - t1) - 2 * zeta * Math.sqrt(k1) * state.v1) * h;
      state.x1 += state.v1 * h;
    }
  };

  const tick = (now) => {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const target = rects[targetIndex()];
    let busy = false;

    if (target) {
      chase(target, dt);
      state.alpha += (1 - state.alpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.06));
      busy = Math.abs(state.x0 - target.left) > 0.05
        || Math.abs(state.x1 - target.left - target.width) > 0.05
        || Math.abs(state.v0) > 0.5
        || Math.abs(state.v1) > 0.5
        || state.alpha < 0.999;
      if (!busy) state.sliding = false;
    } else {
      state.alpha += (0 - state.alpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.07));
      if (state.alpha > 0.002) busy = true;
      else state.alpha = 0;
    }

    state.pop += (1 - state.pop) * (reduce ? 1 : 1 - Math.exp(-dt / 0.09));
    if (Math.abs(1 - state.pop) > 0.001) busy = true;

    const pressTarget = state.pressing ? 0.95 : 1;
    if (reduce) {
      state.press = pressTarget;
      state.pressVelocity = 0;
    } else {
      state.pressVelocity += (-700 * (state.press - pressTarget) - 30 * state.pressVelocity) * dt;
      state.press += state.pressVelocity * dt;
    }
    if (Math.abs(state.press - pressTarget) > 0.0005 || Math.abs(state.pressVelocity) > 0.01) busy = true;

    render();
    if (busy) raf = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (raf) return;
    last = 0;
    raf = requestAnimationFrame(tick);
  };

  measure();
  render();

  return {
    wake,
    refresh: () => {
      measure();
      render();
      wake();
    },
    press: (event) => {
      if (event && event.button > 0) return;
      state.pressing = true;
      wake();
    },
    release: () => {
      if (!state.pressing) return;
      state.pressing = false;
      wake();
    },
  };
};
