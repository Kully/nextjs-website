# Hero image carousel (archived)

Replaced on the landing page by the hero video reel (see scripts/build-hero-video.mjs).

To restore:
1. In index.html, replace the `<figure class="hero__visual hero__reel">` block with the contents of `carousel.html`.
2. Append `carousel.css` to css/styles.css (it relies on the existing `.hero__visual` rule), and re-add the reduced-motion rules:
   `.carousel__progress { display: none; }` and `.carousel__slide { transition: none; }` inside `@media (prefers-reduced-motion: reduce)`.
3. Move `hero-carousel.js` back to js/ and replace the `js/hero-reel.js` script tag with `js/hero-carousel.js`.
4. Slide images still live in public/images/portfolio/ (hero-*.png, nyc-app.png, a-covid-app.png, admin-app.png).
