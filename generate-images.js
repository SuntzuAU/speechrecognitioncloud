/**
 * generate-images.js
 * VRA Gateway Sites - shared image generation script
 *
 * MANUAL TRIGGER ONLY. Never runs on push.
 *
 * Phase 1: site images (hero, feat1, feat2)
 * Phase 2: blog post images (heroImage, breakImage1, breakImage2)
 *
 * R2 key format: images/<site>/<role>-<shortid>.jpg
 *
 * Usage:
 *   node generate-images.js            run both phases
 *   node generate-images.js site       site images only
 *   node generate-images.js blog       all blog posts
 *   node generate-images.js post:filename.md   single post
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const WORKER_URL = process.env.IMAGE_WORKER_URL ||
  'https://master-image-generator.speech-recognition-cloud.workers.dev/generate';
const WORKER_TOKEN = process.env.ADMIN_TOKEN || '';
const SITE = process.env.SITE_ID || 'default';

// Aspect ratios per role. Values MUST be in Gemini 3 Pro Image's supported set:
// "1:1","1:4","1:8","2:3","3:2","3:4","4:1","4:3","4:5","5:4","8:1","9:16","16:9","21:9"
// Break strips map to 21:9 (cinema scope, ~2.33:1) - closest supported ratio to the
// IMAGE-STANDARDS.md 3:1 cinematic spec. The Astro layout crops breaks to 3.3:1 anyway,
// so 21:9 fits better than 3:1 ever would have.
const DEFAULT_ASPECT_RATIOS = {
  hero: '16:9',
  break1: '21:9',
  break2: '21:9',
  feat1: '16:9',
  feat2: '16:9',
};

// Image resolution - passed through to Gemini's imageConfig.imageSize. 2K is a meaningful
// quality bump over the 1K default at modest extra cost. Values: "512", "1K", "2K", "4K".
const DEFAULT_IMAGE_SIZE = '2K';

const cwd = process.cwd();
const dataDir = path.join(cwd, 'src', 'data');
const manifestPath = path.join(dataDir, 'image-manifest.json');
const promptsPath = path.join(cwd, 'src', 'image.prompts.json');
const libraryPath = path.join(cwd, 'src', 'image-prompt-library.json');
const CONTENT_DIR = process.env.CONTENT_DIR || 'news';
const newsDir = path.join(cwd, 'src', 'content', CONTENT_DIR);

fs.mkdirSync(dataDir, { recursive: true });

let manifest = {};
if (fs.existsSync(manifestPath)) {
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { manifest = {}; }
}

let library = { scenes: {}, suffix: '', heroSuffix: '', breakSuffix: '' };
if (fs.existsSync(libraryPath)) {
  try { library = JSON.parse(fs.readFileSync(libraryPath, 'utf8')); } catch {}
}

function shortId() { return crypto.randomBytes(4).toString('hex'); }

function resolvePrompt(entry, fallbackType = 'hero') {
  const type = (entry.type || fallbackType).toLowerCase();
  const isHero = type === 'hero';
  if (entry.prompt) {
    const sfx = isHero ? library.heroSuffix : library.breakSuffix;
    return `${entry.prompt} ${library.suffix} ${sfx}`.trim();
  }
  const sceneName = entry.scene;
  if (!sceneName) return null;
  const scene = library.scenes?.[sceneName];
  if (!scene) { console.warn(`  Scene '${sceneName}' not found.`); return null; }
  const base = isHero ? scene.hero : scene.break;
  const sfx = isHero ? library.heroSuffix : library.breakSuffix;
  return `${base} ${library.suffix} ${sfx}`.trim();
}

function resolveAltText(entry, sceneName, type) {
  if (entry.altText) return entry.altText;
  const scene = library.scenes?.[sceneName];
  if (!scene) return '';
  return (type === 'hero' ? scene.altHero : scene.altBreak) || '';
}

async function callWorker(prompt, r2Key, aspectRatio, imageSize) {
  const headers = { 'Content-Type': 'application/json' };
  if (WORKER_TOKEN) headers['Authorization'] = `Bearer ${WORKER_TOKEN}`;
  const payload = { prompt, name: r2Key, site: SITE };
  if (aspectRatio) payload.aspectRatio = aspectRatio;
  if (imageSize) payload.imageSize = imageSize;
  const res = await fetch(WORKER_URL, {
    method: 'POST', headers,
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) throw new Error(`Worker error ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

async function phase1() {
  if (!fs.existsSync(promptsPath)) { console.warn('WARNING: src/image.prompts.json not found.'); return; }
  const config = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
  if (!config?.images?.length) { console.log('No images defined.'); return; }
  let count = 0;
  for (const img of config.images) {
    const { key, role } = img;
    if (!key) continue;
    if (manifest[key]?.r2Key) { console.log(`Skip (exists): ${key}`); continue; }
    const type = img.type || 'hero';
    const prompt = resolvePrompt(img, type);
    if (!prompt) { console.warn(`Skip ${key}: no prompt.`); continue; }
    const r2Key = `images/${SITE}/${role || key}-${shortId()}.jpg`;
    const altText = resolveAltText(img, img.scene, type);
    const aspectRatio = img.aspectRatio || DEFAULT_ASPECT_RATIOS[role] || DEFAULT_ASPECT_RATIOS[type] || '16:9';
    const imageSize = img.imageSize || DEFAULT_IMAGE_SIZE;
    console.log(`Generating: ${key} -> ${r2Key} (${aspectRatio}, ${imageSize})`);
    try {
      const result = await callWorker(prompt, r2Key, aspectRatio, imageSize);
      manifest[key] = { key, r2Key: result.r2?.key || r2Key, altText, scene: img.scene || 'custom', aspectRatio, imageSize, generatedAt: new Date().toISOString(), site: SITE };
      count++;
    } catch (e) { console.error(`  FAILED: ${e.message}`); }
  }
  console.log(`Phase 1 done. Generated: ${count}`);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([\w]+):\s*"?([^"\n]*)"?$/);
    if (m) fm[m[1]] = m[2].trim();
  }
  return fm;
}

function setFrontmatterField(content, field, value) {
  const re = new RegExp(`^(${field}:)[ \\t]*.*$`, 'm');
  if (re.test(content)) return content.replace(re, `${field}: "${value}"`);
  return content.replace(/^(metaDescription:[ \t]*.*)$/m, `$1\n${field}: "${value}"`);
}

function resolvePostPrompt(fm, role) {
  const isHero = role === 'hero';
  const promptField = isHero ? 'heroPrompt' : (role === 'break1' ? 'breakPrompt1' : 'breakPrompt2');
  const sceneField = isHero ? 'heroScene' : (role === 'break1' ? 'breakScene1' : 'breakScene2');
  const altField = isHero ? 'heroImageAlt' : (role === 'break1' ? 'breakImage1Alt' : 'breakImage2Alt');
  if (fm[promptField]) {
    const sfx = isHero ? library.heroSuffix : library.breakSuffix;
    // Optional per-article override of the global subject suffix. Used when an
    // article's subject matter legitimately falls outside the network default
    // (e.g. school content that must show children). Falls back to library.suffix.
    const baseSuffix = fm.promptSuffixOverride || library.suffix;
    return { prompt: `${fm[promptField]} ${baseSuffix} ${sfx}`.trim(), altText: fm[altField] || '' };
  }
  if (fm[sceneField]) {
    const scene = library.scenes?.[fm[sceneField]];
    if (!scene) return null;
    const base = isHero ? scene.hero : scene.break;
    const sfx = isHero ? library.heroSuffix : library.breakSuffix;
    return { prompt: `${base} ${library.suffix} ${sfx}`.trim(), altText: fm[altField] || (isHero ? scene.altHero : scene.altBreak) || '' };
  }
  return null;
}

function resolvePostAspectRatio(fm, role) {
  // Per-role frontmatter override: heroAspectRatio, breakAspectRatio1, breakAspectRatio2
  const frontmatterField = role === 'hero' ? 'heroAspectRatio'
    : role === 'break1' ? 'breakAspectRatio1'
    : 'breakAspectRatio2';
  if (fm[frontmatterField]) return fm[frontmatterField];
  return DEFAULT_ASPECT_RATIOS[role] || '16:9';
}

function resolvePostImageSize(fm, role) {
  // Per-role frontmatter override: heroImageSize, breakImageSize1, breakImageSize2
  const frontmatterField = role === 'hero' ? 'heroImageSize'
    : role === 'break1' ? 'breakImageSize1'
    : 'breakImageSize2';
  if (fm[frontmatterField]) return fm[frontmatterField];
  return DEFAULT_IMAGE_SIZE;
}

async function processPost(file) {
  const filePath = path.join(newsDir, file);
  if (!fs.existsSync(filePath)) { console.error(`Not found: ${filePath}`); return 0; }
  const content = fs.readFileSync(filePath, 'utf8');
  const fm = parseFrontmatter(content);
  const slug = file.replace(/\.mdx?$/, '');
  const hasHero = fm.heroImage && !fm.heroImage.startsWith('default/');
  const hasB1 = fm.breakImage1 && !fm.breakImage1.startsWith('default/');
  const hasB2 = fm.breakImage2 && !fm.breakImage2.startsWith('default/');
  if (hasHero && hasB1 && hasB2) { console.log(`Skip (done): ${file}`); return 0; }
  if (!(fm.heroPrompt || fm.heroScene) && !(fm.breakPrompt1 || fm.breakScene1) && !(fm.breakPrompt2 || fm.breakScene2)) {
    console.log(`  ACTION NEEDED: ${file} - add prompt/scene fields to frontmatter`);
    return 0;
  }
  let updated = content, count = 0;
  for (const { field, altField, role, needs } of [
    { field: 'heroImage', altField: 'heroImageAlt', role: 'hero', needs: !hasHero },
    { field: 'breakImage1', altField: 'breakImage1Alt', role: 'break1', needs: !hasB1 },
    { field: 'breakImage2', altField: 'breakImage2Alt', role: 'break2', needs: !hasB2 },
  ]) {
    if (!needs) continue;
    const resolved = resolvePostPrompt(fm, role);
    if (!resolved) continue;
    const aspectRatio = resolvePostAspectRatio(fm, role);
    const imageSize = resolvePostImageSize(fm, role);
    const r2Key = `images/${SITE}/${slug}-${role}-${shortId()}.jpg`;
    console.log(`  Generating ${role} (${aspectRatio}, ${imageSize}) -> ${r2Key}`);
    try {
      const result = await callWorker(resolved.prompt, r2Key, aspectRatio, imageSize);
      const finalKey = result.r2?.key || r2Key;
      updated = setFrontmatterField(updated, field, finalKey);
      if (resolved.altText) updated = setFrontmatterField(updated, altField, resolved.altText);
      count++;
    } catch (e) { console.error(`  [${role}] FAILED: ${e.message}`); }
  }
  fs.writeFileSync(filePath, updated, 'utf8');
  return count;
}

async function phase2() {
  if (!fs.existsSync(newsDir)) { console.log('No news dir.'); return; }
  const files = fs.readdirSync(newsDir).filter(f => !f.startsWith('_') && (f.endsWith('.md') || f.endsWith('.mdx')));
  let total = 0;
  for (const file of files) total += await processPost(file);
  console.log(`Phase 2 done. Generated: ${total}`);
}

async function main() {
  const mode = process.argv[2] || 'all';
  if (mode === 'site' || mode === 'all') { console.log('=== Phase 1: Site images ==='); await phase1(); }
  if (mode === 'blog' || mode === 'all') { console.log('\n=== Phase 2: Blog images ==='); await phase2(); }
  if (mode.startsWith('post:')) { await processPost(mode.replace('post:', '')); }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('\nDone. Manifest saved.');
}

main().catch(err => { console.error(err); process.exit(1); });
