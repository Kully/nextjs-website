/**
 * Builds the landing page hero reel by splicing clips from the case study
 * videos. Edit CLIPS / OUTPUT below, then run: npm run build:hero-video
 *
 * Requires ffmpeg on PATH. Outputs (committed, not built on Vercel):
 *   public/images/portfolio/hero-reel.mp4
 *   public/images/portfolio/hero-reel.webm
 *   public/images/portfolio/hero-reel-poster.jpg
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MEDIA_DIR = join(ROOT, 'public', 'images', 'portfolio');

/**
 * Clips in playback order.
 * seconds: how much of the start of the source to use; omit for the full length.
 * fit: 'cover' crops to fill the frame (top aligned, like the case study
 *      cards); 'contain' letterboxes onto the background colour.
 */
const CLIPS = [
  { file: 'solar-app.mp4', seconds: 2, fit: 'cover' },
  { file: 'gmet-app.mp4', seconds: 2, fit: 'cover' },
  { file: 'covid-app-cut.mp4', seconds: 2, fit: 'cover' },
  { file: 'ucsd-web.mp4', fit: 'contain' },
];

const OUTPUT = {
  name: 'hero-reel',
  width: 1280,
  height: 720,
  fps: 30,
  background: '0x101317',
  posterSeconds: 0.5,
};

/**
 * Builds the ffmpeg filter for one clip so every segment shares size, fps and format.
 * @param {{fit: string}} clip
 * @param {number} index
 * @returns {string}
 */
function segmentFilter(clip, index) {
  const { width, height, fps, background } = OUTPUT;
  const fitFilter = clip.fit === 'contain'
    ? `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${background}`
    : `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}:(iw-ow)/2:0`;
  return `[${index}:v]${fitFilter},fps=${fps},setsar=1,format=yuv420p[v${index}]`;
}

/**
 * Builds the full filter_complex graph that concatenates all segments.
 * @returns {string}
 */
function filterGraph() {
  const segments = CLIPS.map(segmentFilter);
  const labels = CLIPS.map((_, i) => `[v${i}]`).join('');
  return `${segments.join(';')};${labels}concat=n=${CLIPS.length}:v=1:a=0[out]`;
}

/**
 * Input arguments, trimming each clip to its configured length.
 * @returns {string[]}
 */
function inputArgs() {
  return CLIPS.flatMap((clip) => [
    ...(clip.seconds ? ['-t', String(clip.seconds)] : []),
    '-i',
    join(MEDIA_DIR, clip.file),
  ]);
}

/**
 * Runs ffmpeg with the shared graph and the given encoder arguments.
 * @param {string[]} outputArgs
 */
function runFfmpeg(outputArgs) {
  execFileSync(
    'ffmpeg',
    ['-y', '-loglevel', 'error', ...inputArgs(), '-filter_complex', filterGraph(), '-map', '[out]', '-an', ...outputArgs],
    { stdio: 'inherit' },
  );
}

const base = join(MEDIA_DIR, OUTPUT.name);

runFfmpeg(['-c:v', 'libx264', '-crf', '28', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${base}.mp4`]);
runFfmpeg(['-c:v', 'libvpx-vp9', '-crf', '35', '-b:v', '0', '-row-mt', '1', `${base}.webm`]);
execFileSync(
  'ffmpeg',
  ['-y', '-loglevel', 'error', '-ss', String(OUTPUT.posterSeconds), '-i', `${base}.mp4`, '-frames:v', '1', '-q:v', '3', `${base}-poster.jpg`],
  { stdio: 'inherit' },
);
