const PILL_NAV_ACTIVE_LINE = 0.4;
const PILL_NAV_LOGO_SPIN_MS = 900;
const PILL_NAV_BOUNCE = 0.6;
const PILL_NAV_STRETCH = 0.5;
const PILL_NAV_INTRO_PILL_DELAY_MS = 420;
const PILL_NAV_SCROLL_SETTLE_MS = 150;
const PILL_NAV_EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Creates an element with a class name and optional attributes.
 * @param {string} tag - Tag name.
 * @param {string} className - Space separated class names.
 * @param {Object<string, string>} [attrs] - Attributes to set.
 * @returns {HTMLElement} The new element.
 */
const makeEl = (tag, className, attrs = {}) => {
  const node = document.createElement(tag);
  node.className = className;
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
};

/**
 * Builds the pill navigation from the plain anchors inside the root and
 * returns the pieces the behaviour code needs.
 * @param {HTMLElement} root - The nav element holding plain anchors.
 * @returns {Object} References to the generated elements and item data.
 */
const buildPillNav = (root) => {
  const items = [...root.querySelectorAll(':scope > a')].map((a) => ({
    label: a.textContent.trim(),
    href: a.getAttribute('href'),
  }));
  root.textContent = '';
  root.classList.add('pill-nav');
  root.dataset.items = 'plain';

  const logo = makeEl('span', 'pill-nav__logo pill-nav__surface');
  const logoLink = makeEl('a', 'pill-nav__logo-link', {
    href: root.dataset.logoHref,
    'aria-label': root.dataset.logoAlt,
  });
  const mark = makeEl('span', 'pill-nav__mark');
  const img = makeEl('img', '', { src: root.dataset.logoSrc, alt: '', draggable: 'false' });
  mark.append(img);
  logoLink.append(mark);
  logo.append(logoLink, makeEl('span', 'pill-nav__rim'));

  const bar = makeEl('div', 'pill-nav__bar pill-nav__surface');
  const track = makeEl('div', 'pill-nav__track');
  const list = makeEl('ul', 'pill-nav__list');
  const slots = items.map((item) => {
    const slot = makeEl('li', 'pill-nav__slot');
    const link = makeEl('a', 'pill-nav__item', { href: item.href });
    link.textContent = item.label;
    slot.append(link);
    list.append(slot);
    return slot;
  });
  const glide = makeEl('span', 'pill-nav__glide', { 'aria-hidden': 'true' });
  const ink = makeEl('div', 'pill-nav__ink', { 'aria-hidden': 'true' });
  items.forEach((item) => {
    const span = makeEl('span', 'pill-nav__ink-item');
    span.textContent = item.label;
    ink.append(span);
  });
  track.append(list, glide, ink);
  bar.append(track, makeEl('span', 'pill-nav__rim'));

  const toggle = makeEl('button', 'pill-nav__toggle pill-nav__surface', {
    type: 'button',
    'aria-expanded': 'false',
    'aria-label': 'Open menu',
    'aria-controls': 'pill-nav-panel',
    hidden: '',
  });
  toggle.innerHTML = '<span class="pill-nav__burger" aria-hidden="true"><span class="pill-nav__line pill-nav__line--top"></span><span class="pill-nav__line pill-nav__line--bottom"></span></span><span class="pill-nav__rim"></span>';

  const panel = makeEl('div', 'pill-nav__panel pill-nav__surface', { id: 'pill-nav-panel' });
  const menu = makeEl('ul', 'pill-nav__menu');
  const rows = items.map((item) => {
    const li = makeEl('li', '');
    const row = makeEl('a', 'pill-nav__row', { href: item.href, tabindex: '-1' });
    row.textContent = item.label;
    li.append(row);
    menu.append(li);
    return row;
  });
  panel.append(menu, makeEl('span', 'pill-nav__rim'));

  const measure = makeEl('div', 'pill-nav__measure', { 'aria-hidden': 'true' });
  const measureList = makeEl('div', 'pill-nav__list');
  items.forEach((item) => {
    const span = makeEl('span', 'pill-nav__measure-item');
    span.textContent = item.label;
    measureList.append(span);
  });
  measure.append(measureList);

  root.append(logo, bar, toggle, panel, measure);
  return { items, logo, mark, bar, track, slots, glide, ink, toggle, panel, rows, measureList };
};

const cssPx = (el, name) => parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;

/**
 * Wires the gliding highlight pill, scroll tracking, collapse to a
 * menu and the logo spin.
 * @param {HTMLElement} root - The nav element.
 */
const initPillNav = (root) => {
  const parts = buildPillNav(root);
  const { items, slots, rows, track, bar, toggle } = parts;
  let activeIndex = -1;
  let collapsed = false;
  let hoverIndex = -1;
  let introDone = reducedMotion;
  let scrollLocked = false;
  let settleTimer = 0;

  const glide = createPillGlide({
    track,
    glide: parts.glide,
    ink: parts.ink,
    slots,
    targetIndex: () => {
      if (collapsed || !introDone) return -1;
      return hoverIndex >= 0 ? hoverIndex : activeIndex;
    },
    bounce: PILL_NAV_BOUNCE,
    stretch: PILL_NAV_STRETCH,
  });

  const setHover = (index, focusVisible = false) => {
    hoverIndex = index;
    slots.forEach((slot, i) => slot.toggleAttribute('data-lit', i === index));
    root.toggleAttribute('data-focus', focusVisible && index >= 0);
    glide.wake();
  };

  const setActive = (index) => {
    activeIndex = index;
    slots.forEach((slot, i) => {
      const attr = i === index ? 'page' : null;
      [slot.firstElementChild, rows[i]].forEach((link) => {
        if (attr) link.setAttribute('aria-current', attr);
        else link.removeAttribute('aria-current');
      });
    });
    glide.wake();
  };

  const setOpen = (open) => {
    root.toggleAttribute('data-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    rows.forEach((row) => row.setAttribute('tabindex', open ? '0' : '-1'));
  };

  const setCollapsed = (next) => {
    if (next === collapsed) return;
    collapsed = next;
    root.toggleAttribute('data-collapsed', next);
    bar.hidden = next;
    toggle.hidden = !next;
    if (!next) setOpen(false);
    glide.refresh();
  };

  const evaluate = () => {
    const available = root.parentElement.clientWidth;
    const need = cssPx(root, '--pn-h') + cssPx(root, '--pn-gap') + parts.measureList.offsetWidth + cssPx(root, '--pn-pad') * 2;
    setCollapsed(need > available + 0.5);
  };

  const playIntro = () => {
    if (reducedMotion) return;
    const pop = (el, delay) => el.animate(
      [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }],
      { duration: 700, delay, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'backwards' },
    );
    pop(parts.logo, 0);
    if (collapsed) {
      pop(toggle, 120);
      introDone = true;
      return;
    }
    const height = bar.offsetHeight;
    const width = bar.offsetWidth;
    bar.animate(
      [
        { clipPath: `inset(0px ${Math.max(0, width - height)}px 0px 0px round ${height / 2}px)` },
        { clipPath: `inset(0px 0px 0px 0px round ${height / 2}px)` },
      ],
      { duration: 760, delay: 90, easing: PILL_NAV_EASE_OUT, fill: 'backwards' },
    );
    slots.forEach((slot, i) => slot.animate(
      [{ opacity: 0, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'translateX(0)' }],
      { duration: 560, delay: 200 + i * 50, easing: PILL_NAV_EASE_OUT, fill: 'backwards' },
    ));
    window.setTimeout(() => {
      introDone = true;
      glide.wake();
    }, PILL_NAV_INTRO_PILL_DELAY_MS);
  };

  const unlockScroll = () => {
    scrollLocked = false;
    updateActiveFromScroll();
  };

  const holdActive = (index) => {
    scrollLocked = true;
    setActive(index);
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(unlockScroll, PILL_NAV_SCROLL_SETTLE_MS * 2);
  };

  const onScroll = () => {
    if (!scrollLocked) {
      updateActiveFromScroll();
      return;
    }
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(unlockScroll, PILL_NAV_SCROLL_SETTLE_MS);
  };

  const updateActiveFromScroll = () => {
    const line = window.innerHeight * PILL_NAV_ACTIVE_LINE;
    let found = -1;
    items.forEach((item, i) => {
      const section = document.querySelector(item.href);
      if (section && section.getBoundingClientRect().top <= line) found = i;
    });
    if (found !== activeIndex) setActive(found);
  };

  slots.forEach((slot, i) => {
    slot.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'touch') setHover(i);
    });
    slot.addEventListener('pointerdown', glide.press);
    slot.addEventListener('click', () => holdActive(i));
    slot.addEventListener('focusin', (event) => {
      if (event.target.matches(':focus-visible')) setHover(i, true);
    });
    slot.addEventListener('focusout', () => setHover(-1));
  });
  track.addEventListener('pointerleave', () => setHover(-1));

  toggle.addEventListener('click', () => setOpen(!root.hasAttribute('data-open')));
  rows.forEach((row, i) => row.addEventListener('click', () => {
    holdActive(i);
    setOpen(false);
  }));
  document.addEventListener('pointerdown', (event) => {
    if (root.hasAttribute('data-open') && !root.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !root.hasAttribute('data-open')) return;
    setOpen(false);
    toggle.focus();
  });

  if (!reducedMotion) {
    parts.logo.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch' || parts.mark.getAnimations().length) return;
      parts.mark.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], {
        duration: PILL_NAV_LOGO_SPIN_MS,
        easing: 'cubic-bezier(0.65, 0, 0.25, 1)',
      });
    });
  }

  window.addEventListener('pointerup', glide.release);
  window.addEventListener('pointercancel', glide.release);

  const observer = new ResizeObserver(() => {
    evaluate();
    glide.refresh();
  });
  observer.observe(root.parentElement);
  observer.observe(parts.measureList);
  document.fonts?.ready.then(() => {
    evaluate();
    glide.refresh();
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  evaluate();
  glide.refresh();
  updateActiveFromScroll();
  playIntro();
};

const pillNavRoot = document.getElementById('pill-nav');
if (pillNavRoot) initPillNav(pillNavRoot);
