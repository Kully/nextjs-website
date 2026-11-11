const PILL_NAV_ACTIVE_LINE = 0.4;
const PILL_NAV_LOGO_SPIN_MS = 900;

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

const faceHtml = (label) => `<span class="pill-nav__face">${label}</span><span class="pill-nav__face-alt" aria-hidden="true">${label}</span>`;

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
    link.innerHTML = `<span class="pill-nav__fill" aria-hidden="true"></span>${faceHtml(item.label)}`;
    slot.append(link);
    list.append(slot);
    return slot;
  });
  const dot = makeEl('span', 'pill-nav__dot', { 'aria-hidden': 'true' });
  track.append(list, dot);
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
  return { items, logo, mark, bar, track, slots, dot, toggle, panel, rows, measureList };
};

const cssPx = (el, name) => parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;

/**
 * Wires hover fill, the sliding active dot, scroll tracking, collapse to a
 * menu and the logo spin.
 * @param {HTMLElement} root - The nav element.
 */
const initPillNav = (root) => {
  const parts = buildPillNav(root);
  const { items, slots, rows, dot, track, bar, toggle } = parts;
  let activeIndex = -1;
  let collapsed = false;
  let dotPlaced = false;

  const setHover = (index) => {
    slots.forEach((slot, i) => slot.toggleAttribute('data-hover', i === index));
    root.toggleAttribute('data-dot-lit', index >= 0 && index === activeIndex);
  };

  const placeDot = () => {
    const slot = slots[activeIndex];
    if (!slot || collapsed) {
      dot.style.opacity = '0';
      dotPlaced = false;
      return;
    }
    const x = slot.offsetLeft + slot.offsetWidth / 2;
    if (!dotPlaced) {
      dot.style.transition = 'none';
      dot.style.transform = `translate3d(${x}px, 0, 0)`;
      void dot.offsetWidth;
      dot.style.transition = '';
      dotPlaced = true;
    }
    dot.style.transform = `translate3d(${x}px, 0, 0)`;
    dot.style.opacity = '1';
  };

  const measureFills = () => {
    slots.forEach((slot) => {
      const reach = Math.ceil(2 * Math.sqrt((slot.offsetWidth / 2) ** 2 + slot.offsetHeight ** 2)) + 2;
      slot.style.setProperty('--pn-fill', `${reach}px`);
    });
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
    placeDot();
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
    measureFills();
    dotPlaced = false;
    placeDot();
  };

  const evaluate = () => {
    const available = root.parentElement.clientWidth;
    const need = cssPx(root, '--pn-h') + cssPx(root, '--pn-gap') + parts.measureList.offsetWidth + cssPx(root, '--pn-pad') * 2;
    setCollapsed(need > available + 0.5);
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
    slot.addEventListener('focusin', (event) => {
      if (event.target.matches(':focus-visible')) setHover(i);
    });
    slot.addEventListener('focusout', () => setHover(-1));
  });
  track.addEventListener('pointerleave', () => setHover(-1));

  toggle.addEventListener('click', () => setOpen(!root.hasAttribute('data-open')));
  rows.forEach((row) => row.addEventListener('click', () => setOpen(false)));
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

  const observer = new ResizeObserver(() => {
    evaluate();
    measureFills();
    dotPlaced = false;
    placeDot();
  });
  observer.observe(root.parentElement);
  observer.observe(parts.measureList);
  document.fonts?.ready.then(evaluate);

  window.addEventListener('scroll', updateActiveFromScroll, { passive: true });
  evaluate();
  measureFills();
  updateActiveFromScroll();
};

const pillNavRoot = document.getElementById('pill-nav');
if (pillNavRoot) initPillNav(pillNavRoot);
