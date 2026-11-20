/**
 * Hero reel behavior: pauses the video for visitors who prefer reduced
 * motion (the poster frame stays visible) and tilts the card toward the
 * pointer on hover-capable devices.
 */
(() => {
  const MAX_TILT_DEG = 8;
  const PERSPECTIVE_PX = 1200;

  const reel = document.querySelector('.hero__reel');
  const video = document.querySelector('.hero__reel-video');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (video && reduceMotion) {
    video.removeAttribute('autoplay');
    video.pause();
  }

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!reel || reduceMotion || !canHover) return;

  const setTilt = (rotateX, rotateY) => {
    reel.style.transform = `perspective(${PERSPECTIVE_PX}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  reel.addEventListener('pointermove', (event) => {
    const rect = reel.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt(-y * 2 * MAX_TILT_DEG, x * 2 * MAX_TILT_DEG);
  });

  reel.addEventListener('pointerleave', () => setTilt(0, 0));
})();
