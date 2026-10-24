const ROTATOR_PHRASES = [
  'create report templates that get investors to fund your projects',
  'explore your large datasets to gain key business insights',
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
