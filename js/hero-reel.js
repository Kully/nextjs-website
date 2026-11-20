/**
 * Stops the hero reel for visitors who prefer reduced motion; the poster
 * frame stays visible instead.
 */
(() => {
  const video = document.querySelector('.hero__reel-video');
  if (video && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.removeAttribute('autoplay');
    video.pause();
  }
})();
