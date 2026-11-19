/**
 * Builds the case study cards on index.html and one detail page per
 * markdown file in case-studies/.
 *
 * Usage: node scripts/build-case-studies.mjs
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'case-studies');
const INDEX_PATH = path.join(ROOT, 'index.html');
const REQUIRED_KEYS = ['title', 'text-preview', 'image-preview', 'page-url'];
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CARDS_START = '<!-- case-studies:start -->';
const CARDS_END = '<!-- case-studies:end -->';

/**
 * Escapes text for use in HTML content or attribute values.
 * @param {string} value Raw text.
 * @returns {string} Escaped text.
 */
const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

/**
 * Makes a site-relative path root-absolute so it works from any page depth.
 * @param {string} value Path such as public/images/a.png.
 * @returns {string} Root-absolute path, or the input if already absolute.
 */
const toRootPath = (value) => (/^(\/|https?:)/.test(value) ? value : `/${value}`);

/**
 * Splits a markdown file into frontmatter fields and body.
 * @param {string} text File contents.
 * @param {string} fileName Name used in error messages.
 * @returns {{fields: Record<string, string>, body: string}} Parsed file.
 * @throws {Error} If the frontmatter block is missing or malformed.
 */
const parseFrontmatter = (text, fileName) => {
  const match = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${fileName}: missing frontmatter block delimited by ---`);

  const fields = {};
  match[1].split('\n').filter((line) => line.trim()).forEach((line) => {
    const separator = line.indexOf(':');
    if (separator < 1) throw new Error(`${fileName}: invalid frontmatter line "${line}"`);
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
    fields[key] = value;
  });
  return { fields, body: match[2].trim() };
};

/**
 * Validates required keys and the page-url slug.
 * @param {Record<string, string>} fields Parsed frontmatter.
 * @param {string} fileName Name used in error messages.
 * @throws {Error} If a key is missing or the slug is invalid.
 */
const validateFields = (fields, fileName) => {
  REQUIRED_KEYS.forEach((key) => {
    if (!fields[key]) throw new Error(`${fileName}: missing required key "${key}"`);
  });
  if (!SLUG_PATTERN.test(fields['page-url'])) {
    throw new Error(`${fileName}: page-url "${fields['page-url']}" must be lowercase letters, digits and hyphens`);
  }
};

/**
 * Reads every markdown file in case-studies/ into case study records.
 * @returns {Promise<Array<object>>} Case studies sorted newest year first.
 */
const loadCaseStudies = async () => {
  const names = (await readdir(SOURCE_DIR)).filter((name) => name.endsWith('.md')).sort();
  const studies = [];
  const seenSlugs = new Map();

  for (const name of names) {
    const { fields, body } = parseFrontmatter(await readFile(path.join(SOURCE_DIR, name), 'utf8'), name);
    validateFields(fields, name);
    const slug = fields['page-url'];
    if (seenSlugs.has(slug)) throw new Error(`${name}: page-url "${slug}" already used by ${seenSlugs.get(slug)}`);
    seenSlugs.set(slug, name);
    studies.push({
      slug,
      title: fields.title,
      preview: fields['text-preview'],
      image: toRootPath(fields['image-preview']),
      video: fields['video-preview'] ? toRootPath(fields['video-preview']) : '',
      year: fields.year ?? '',
      body,
    });
  }
  return studies.sort((a, b) => b.year.localeCompare(a.year));
};

/**
 * Renders one card for the home page grid.
 * @param {object} study Case study record.
 * @returns {string} Card HTML.
 */
const renderCard = (study) => {
  const year = study.year ? `\n            <span class="case-study__year">${escapeHtml(study.year)}</span>` : '';
  const video = study.video
    ? `\n              <video class="case-study__video" src="${escapeHtml(study.video)}" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video>`
    : '';
  return `          <a class="case-study" href="/case-studies/${study.slug}/">${year}
            <div class="case-study__media">
              <img class="case-study__image" src="${escapeHtml(study.image)}" alt="" width="1600" height="685" loading="lazy">${video}
            </div>
            <div class="case-study__body">
              <h3 class="case-study__title">${escapeHtml(study.title)}</h3>
              <p>${escapeHtml(study.preview)}</p>
            </div>
          </a>`;
};

/**
 * Replaces the generated card region of index.html.
 * @param {string} indexHtml Current index.html contents.
 * @param {Array<object>} studies Case study records.
 * @returns {string} Updated index.html contents.
 * @throws {Error} If the marker comments are missing.
 */
const injectCards = (indexHtml, studies) => {
  const start = indexHtml.indexOf(CARDS_START);
  const end = indexHtml.indexOf(CARDS_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`index.html: missing ${CARDS_START} / ${CARDS_END} markers`);
  }
  const cards = studies.map(renderCard).join('\n');
  return `${indexHtml.slice(0, start + CARDS_START.length)}\n${cards}\n          ${indexHtml.slice(end)}`;
};

/**
 * Extracts an element block from index.html and makes its links work from
 * a page one directory deep.
 * @param {string} indexHtml index.html contents.
 * @param {RegExp} pattern Matches the block.
 * @returns {string} Block HTML with root-absolute links.
 * @throws {Error} If the block is not found.
 */
const extractShared = (indexHtml, pattern) => {
  const match = indexHtml.match(pattern);
  if (!match) throw new Error(`index.html: could not find shared block ${pattern}`);
  return match[0]
    .replace(/data-logo-href="#top"/, 'data-logo-href="/"')
    .replace(/(?<![\w-])(href|src|data-logo-src)="#([^"]*)"/g, '$1="/#$2"')
    .replace(/(?<![\w-])(href|src|data-logo-src)="(?!https?:|mailto:|\/|#)([^"]+)"/g, '$1="/$2"');
};

/**
 * Renders a full detail page for a case study.
 * @param {object} study Case study record.
 * @param {{header: string, footer: string}} shared Shared page chrome.
 * @returns {string} Page HTML.
 */
const renderPage = (study, shared) => `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(study.title)} | Zyphr</title>
  <meta name="description" content="${escapeHtml(study.preview)}">
  <meta name="color-scheme" content="dark">
  <link rel="icon" href="/public/images/favicons/favicon.ico" sizes="48x48">
  <link rel="icon" type="image/png" sizes="32x32" href="/public/images/favicons/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/public/images/favicons/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/public/images/favicons/apple-touch-icon.png">
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/border-glow.css">
  <link rel="stylesheet" href="/css/pill-nav.css">
</head>
<body>
  ${shared.header}

  <main>
    <article class="section case-page">
      <div class="container case-page__inner">
        <a class="case-page__back" href="/#case-studies">&larr; Back to case studies</a>
        ${study.year ? `<p class="eyebrow">${escapeHtml(study.year)}</p>` : ''}
        <h1 class="case-page__title">${escapeHtml(study.title)}</h1>
        <img class="case-page__hero" src="${escapeHtml(study.image)}" alt="">
        <div class="case-page__body">
${marked.parse(study.body)}
        </div>
      </div>
    </article>
  </main>

  ${shared.footer}

  <script src="/js/pill-glide.js"></script>
  <script src="/js/pill-nav.js"></script>
  <script src="/js/border-glow.js"></script>
</body>
</html>
`;

/**
 * Removes generated page directories so deleted case studies disappear.
 */
const cleanGeneratedPages = async () => {
  const entries = await readdir(SOURCE_DIR, { withFileTypes: true });
  await Promise.all(entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => rm(path.join(SOURCE_DIR, entry.name), { recursive: true })));
};

const main = async () => {
  const studies = await loadCaseStudies();
  const indexHtml = await readFile(INDEX_PATH, 'utf8');
  const shared = {
    header: extractShared(indexHtml, /<header class="site-header">[\s\S]*?<\/header>/),
    footer: extractShared(indexHtml, /<footer class="site-footer">[\s\S]*?<\/footer>/),
  };

  await cleanGeneratedPages();
  for (const study of studies) {
    const dir = path.join(SOURCE_DIR, study.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), renderPage(study, shared));
  }
  await writeFile(INDEX_PATH, injectCards(indexHtml, studies));
  process.stdout.write(`Built ${studies.length} case studies\n`);
};

main().catch((error) => {
  process.stderr.write(`Build failed: ${error.message}\n`);
  process.exit(1);
});
