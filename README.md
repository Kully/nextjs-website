# Zyphr website

Static site: plain HTML, CSS and JavaScript, plus a small build step that generates the case study cards and pages from markdown.

- `index.html` is the home page.
- `case-studies/*.md` are the case studies (see below).
- `scripts/build-case-studies.mjs` generates the cards on `index.html` and one page per case study at `case-studies/<page-url>/index.html`. Those generated pages are gitignored; Vercel builds them on deploy.
- `css/` and `js/` hold the styles and scripts.
- `public/images/` holds logos, icons, client logos and project screenshots.

## Adding or editing a case study

Create or edit a file in `case-studies/`:

```
---
title: Heading shown on the card and the page
text-preview: Short text shown on the card
image-preview: public/images/portfolio/my-cover.png
page-url: my-case-study
year: 2026
---
The body is regular markdown and appears on the page the card links to.
```

- `title`, `text-preview`, `image-preview` and `page-url` are required. `year` is optional and shows as a badge.
- `page-url` becomes the address `/case-studies/<page-url>/` (lowercase letters, digits and hyphens).
- Cards are sorted by `year`, newest first.

## Build and preview

```bash
npm install
npm run build
python3 -m http.server 8000
```

Then open http://localhost:8000. Re-run `npm run build` after changing any case study. The build rewrites the card section of `index.html` between the `case-studies:start` and `case-studies:end` comments, so commit that change.
