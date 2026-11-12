/**
 * Vanilla port of the React Bits BorderGlow card. Applies a pointer-driven
 * edge glow to every element matching GLOW_SELECTOR.
 */
(() => {
  const GLOW_SELECTOR = '.card';
  const GLOW_HSL = { h: 24, s: 69, l: 60 };
  const GLOW_COLORS = ['#df8753', '#f2b987', '#c46a35'];
  const GLOW_INTENSITY = 1;
  const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
  const GRADIENT_KEYS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];
  const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];
  const GLOW_OPACITIES = { '': 100, '-60': 60, '-50': 50, '-40': 40, '-30': 30, '-20': 20, '-10': 10 };

  const cards = [...document.querySelectorAll(GLOW_SELECTOR)];
  if (!cards.length) return;

  /**
   * Sets the glow and gradient custom properties on a card.
   * @param {HTMLElement} card
   */
  const setColorVars = (card) => {
    const { h, s, l } = GLOW_HSL;
    Object.entries(GLOW_OPACITIES).forEach(([key, opacity]) => {
      const alpha = Math.min(opacity * GLOW_INTENSITY, 100);
      card.style.setProperty(`--glow-color${key}`, `hsl(${h}deg ${s}% ${l}% / ${alpha}%)`);
    });
    GRADIENT_KEYS.forEach((key, i) => {
      const color = GLOW_COLORS[COLOR_MAP[i]];
      card.style.setProperty(
        `--gradient-${key}`,
        `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${color} 0px, transparent 50%)`,
      );
    });
    card.style.setProperty('--gradient-base', `linear-gradient(${GLOW_COLORS[0]} 0 100%)`);
  };

  /**
   * Updates the edge proximity (0-100) and cursor angle from a pointer event.
   * @param {HTMLElement} card
   * @param {PointerEvent} event
   */
  const handlePointerMove = (card, event) => {
    const rect = card.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = event.clientX - rect.left - cx;
    const dy = event.clientY - rect.top - cy;
    const kx = dx === 0 ? Infinity : cx / Math.abs(dx);
    const ky = dy === 0 ? Infinity : cy / Math.abs(dy);
    const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
    const angle = dx === 0 && dy === 0 ? 0 : (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    card.style.setProperty('--edge-proximity', (edge * 100).toFixed(3));
    card.style.setProperty('--cursor-angle', `${(angle + 360) % 360}deg`);
  };

  cards.forEach((card) => {
    const inner = document.createElement('div');
    inner.className = 'border-glow-inner';
    inner.append(...card.childNodes);
    const edge = document.createElement('span');
    edge.className = 'edge-light';
    card.append(edge, inner);
    card.classList.add('border-glow-card');
    card.style.setProperty('--card-bg', 'var(--color-surface)');
    setColorVars(card);
    card.addEventListener('pointermove', (event) => handlePointerMove(card, event));
  });
})();
