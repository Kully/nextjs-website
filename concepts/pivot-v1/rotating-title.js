const ROTATOR_PHRASES = [
  'create report templates that get investors to fund your projects',
  'explore your large datasets to gain key business insights',
  'visualize your architecture portfolio to start sparking interest',
  'create a VFX plugin for your favourite workflow',
];
const ROTATOR_INTERVAL_MS = 3500;
const ROTATOR_FADE_MS = 400;

/**
 * Swaps the services title phrase on a timer with a fade between phrases.
 */
(() => {
  const el = document.querySelector('.rotator__text');
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let index = 0;
  setInterval(() => {
    el.classList.add('is-hidden');
    setTimeout(() => {
      index = (index + 1) % ROTATOR_PHRASES.length;
      el.textContent = ROTATOR_PHRASES[index];
      el.classList.remove('is-hidden');
    }, ROTATOR_FADE_MS);
  }, ROTATOR_INTERVAL_MS);
})();
