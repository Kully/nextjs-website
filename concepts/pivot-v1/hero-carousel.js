/**
 * Cycles the hero screenshots. Each slide runs for the duration of the
 * progress bar animation (4s); the next slide fades in when it ends.
 */
(() => {
  const root = document.querySelector('.carousel');
  if (!root) return;

  const slides = [...root.querySelectorAll('.carousel__slide')];
  const bar = root.querySelector('.carousel__bar');
  if (slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let current = 0;

  const restartBar = () => {
    bar.classList.remove('is-running');
    void bar.offsetWidth;
    bar.classList.add('is-running');
  };

  const show = (index) => {
    slides[current].classList.remove('is-active');
    current = index;
    slides[current].classList.add('is-active');
    restartBar();
  };

  bar.addEventListener('animationend', () => show((current + 1) % slides.length));
  restartBar();
})();
