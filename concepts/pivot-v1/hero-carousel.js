/**
 * Cycles the hero screenshots. Each slide runs for the duration of the
 * progress bar animation (8s); the next slide fades in when it ends.
 * Clicking the frame pauses or resumes the progress bar, and so the slideshow.
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

  const frame = root.querySelector('.carousel__frame');
  const togglePaused = () => {
    const paused = root.classList.toggle('is-paused');
    frame.setAttribute('aria-pressed', String(paused));
    frame.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
  };

  frame.addEventListener('click', togglePaused);
  frame.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    togglePaused();
  });

  bar.addEventListener('animationend', () => show((current + 1) % slides.length));
  restartBar();
})();
