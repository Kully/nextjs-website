import { createPatternWaves } from './pattern-waves.js';

const sharedOptions = {
  color: getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim(),
  backgroundColor: 'transparent',
  preset: 'silk',
  opacity: 0.45,
};

const heroContainer = document.querySelector('.hero__waves');
if (heroContainer) {
  createPatternWaves(heroContainer, { ...sharedOptions, fade: 'bottom', fadeSize: 0.6 });
}

const storyContainer = document.querySelector('.story-waves');
if (storyContainer) {
  createPatternWaves(storyContainer, {
    ...sharedOptions,
    fade: 'both',
    opacity: 0.2,
    depth: 0.15,
    fadeSize: 0.35,
    paused: true,
    interactive: false,
    intro: false,
  });

  const revealObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    storyContainer.classList.add('is-visible');
    revealObserver.disconnect();
  }, { threshold: 0.15 });
  revealObserver.observe(storyContainer);
}
