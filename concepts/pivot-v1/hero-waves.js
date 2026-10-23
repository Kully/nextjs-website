import { createPatternWaves } from './pattern-waves.js';

const container = document.querySelector('.hero__waves');
const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');

const themeOptions = () => ({
  color: getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim(),
  backgroundColor: 'transparent',
});

if (container) {
  const waves = createPatternWaves(container, {
    ...themeOptions(),
    preset: 'silk',
    fade: 'bottom',
    fadeSize: 0.6,
    opacity: 0.45,
  });
  if (waves) {
    colorScheme.addEventListener('change', () => waves.update(themeOptions()));
  }
}
