/**
 * Plays a case study card's preview video while the card is hovered or
 * focused, fading it in over the static image. Cards without a video are
 * left alone.
 */
(() => {
  const PLAYING_CLASS = 'case-study__video--playing';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /**
   * Wires hover and focus handlers for one card.
   * @param {HTMLElement} card Case study card element.
   */
  const bindCard = (card) => {
    const video = card.querySelector('.case-study__video');
    if (!video) return;
    let active = false;

    const start = () => {
      if (reducedMotion.matches) return;
      active = true;
      video.play().catch((error) => {
        if (error.name !== 'AbortError') console.error('Case study preview failed:', error);
      });
    };

    const stop = () => {
      active = false;
      video.pause();
      video.classList.remove(PLAYING_CLASS);
      video.currentTime = 0;
    };

    // Wait for real playback so the image stays visible while the file loads.
    video.addEventListener('playing', () => {
      if (active) video.classList.add(PLAYING_CLASS);
    });
    card.addEventListener('mouseenter', start);
    card.addEventListener('mouseleave', stop);
    card.addEventListener('focusin', start);
    card.addEventListener('focusout', stop);
  };

  document.querySelectorAll('.case-study').forEach(bindCard);
})();
