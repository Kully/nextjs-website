import { createPatternWaves } from './pattern-waves.js';

const container = document.querySelector('.hero__waves');

if (container) {
  createPatternWaves(container, {
    color: getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim(),
    backgroundColor: 'transparent',
    preset: 'silk',
    fade: 'bottom',
    fadeSize: 0.6,
    opacity: 0.45,
  });
}
