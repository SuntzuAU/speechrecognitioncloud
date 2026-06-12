#!/usr/bin/env node
/**
 * generate-images.js
 * Reads Astro news posts with imagesPending: true, calls the master-image-generator
 * Cloudflare Worker for each empty image slot, and writes R2 URLs back into frontmatter.
 *
 * Usage (GitHub Actions): node generate-images.js post:filename.md
 * Env vars: SITE_ID, ADMIN_TOKEN, R2_PUBLIC_BASE
 */

const fs = require('fs');
const path = require('path');

const WORKER_URL = 'https://master-image-generator.speech-recognition-cloud.workers.dev/generate';
const SITE_ID    = process.env.SITE_ID        || 'speechrecognitioncloud';
const TOKEN      = process.env.ADMIN_TOKEN     || '';
const R2_BASE    = process.env.R2_PUBLIC_BASE  || 'https://pub-c7a09e1ddb7c45e6a38fcdca1e4b6897.r2.dev';
const POLL_MS    = 28000; // 28 s between sequential Worker calls

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---- Frontmatter parser (handles our known field types only) ----
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const ci = line.indexOf(':');
    if (ci < 1) continue;
    const k = line.slice(0, ci).trim();
    let v  = line.slice(ci + 1).trim();
    if (/^["']/.test(v) && v.endsWith(v[0])) v = v.slice(1, -1);
    if (v === 'true')  v = true;
    if (v === 'false') v = false;
    fm[k] = v;
  }
  return { fm, body: m[2] };
}

function serialiseFrontmatter(fm) {
  const lines = [];
  for (const [k, v] of Object.entries(fm)) {
    if (typeof v === 'boolean') { lines.push(`${k}: ${v}`); continue; }
    const s = String(v ?? '');
    const needsQ = /[:#{}[\],&*!|>'"@`%]|^\s|\s$/.test(s) || s === '';
    lines.push(needsQ ? `${k}: "${s.replace(/"/g, '\\"')}"` : `${k}: ${s}`);
  }
  return lines.join('\n');
}

// ---- Worker call ----
async function callWorker(prompt, name, aspectRatio, imageSize) {
  const hdrs = { 'Content-Type': 'application/json' };
  if (TOKEN) hdrs['Authorization'] = `Bearer ${TOKEN}`;

  const res = await fetch(WORKER_URL, {
    method : 'POST',
    headers: hdrs,
    body   : JSON.stringify({ prompt, name, aspectRatio, imageSize, sitePrefix: SITE_ID })
  });
  const data = await res.json();
  if (!data.ok) throw new Error(JSON.stringify(data));
  return data;
}

// ---- Process a single post ----
async function processPost(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = parseFrontmatter(raw);
  if (!parsed) { console.log(`SKIP ${file}: no frontmatter`); return false; }

  const { fm, body } = parsed;
  if (!fm.imagesPending) { console.log(`SKIP ${file}: imagesPending not true`); return false; }

  const slots = [
    { img: 'heroImage',   alt: 'heroImageAlt',   prompt: 'heroPrompt',   aspect: 'heroAspectRatio',   size: 'heroImageSize',   defaultAspect: '16:9', tag: 'hero'   },
    { img: 'breakImage1', alt: 'breakImage1Alt',  prompt: 'breakPrompt1', aspect: 'breakAspectRatio1', size: 'breakImageSize1', defaultAspect: '21:9', tag: 'break1' },
    { img: 'breakImage2', alt: 'breakImage2Alt',  prompt: 'breakPrompt2', aspect: 'breakAspectRatio2', size: 'breakImageSize2', defaultAspect: '21:9', tag: 'break2' },
  ];

  let generated = false;

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const prompt = fm[s.prompt];
    if (!prompt || fm[s.img]) continue; // no prompt or already has image

    const slug     = path.basename(file, '.md');
    const seoName  = `${slug}-${s.tag}`.slice(0, 60);
    const aspect   = String(fm[s.aspect]  || s.defaultAspect);
    const imgSize  = String(fm[s.size]    || '2K');

    console.log(`\nGenerating ${s.img} for "${slug}"`);
    console.log(`  name    : ${seoName}`);
    console.log(`  aspect  : ${aspect}  size: ${imgSize}`);
    console.log(`  prompt  : ${String(prompt).slice(0, 100)}...`);

    try {
      const result = await callWorker(String(prompt), seoName, aspect, imgSize);
      fm[s.img] = `${R2_BASE}/${result.r2.key}`;
      console.log(`  -> ${result.r2.key}`);
      generated = true;
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }

    if (i < slots.length - 1 && slots.slice(i + 1).some(t => !fm[t.img] && fm[t.prompt])) {
      console.log(`  Waiting ${POLL_MS / 1000}s...`);
      await sleep(POLL_MS);
    }
  }

  if (generated) {
    fm.imagesPending = false;
    const updated = `---\n${serialiseFrontmatter(fm)}\n---\n${body}`;
    fs.writeFileSync(file, updated, 'utf8');
    console.log(`\nWrote updated frontmatter -> ${file}`);
  }

  return generated;
}

// ---- Main ----
(async () => {
  const posts = process.argv.slice(2).filter(a => a.startsWith('post:')).slice(0, 3);
  if (!posts.length) { console.error('Usage: node generate-images.js post:filename.md'); process.exit(1); }

  let count = 0;
  for (const p of posts) {
    const file = path.join('src', 'content', 'news', p.replace('post:', ''));
    if (!fs.existsSync(file)) { console.log(`NOT FOUND: ${file}`); continue; }
    if (await processPost(file)) count++;
  }
  console.log(`\nDone. Generated images for ${count}/${posts.length} post(s).`);
})().catch(err => { console.error('Fatal:', err); process.exit(1); });
