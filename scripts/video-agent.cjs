#!/usr/bin/env node
/**
 * Video Agent — 24/7 Automated Video Generation
 *
 * Runs continuously, generating product promo videos via Remotion:
 * - Renders product promo videos for products missing them
 * - Re-renders existing videos periodically with fresh templates
 * - Outputs MP4 to public/videos/ directory
 *
 * Usage:
 *   node scripts/video-agent.cjs           # Render missing videos once
 *   node scripts/video-agent.cjs --daemon  # Run 24/7 (every 2 hours)
 *   node scripts/video-agent.cjs --all     # Re-render all videos
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '..', 'src', 'data', 'products.json');
const VIDEOS_DIR = path.join(__dirname, '..', 'public', 'videos');
const REMOTION_DIR = '/home/ubuntu/remotion-studio';
const STATE_FILE = path.join(__dirname, '.video-agent-state.json');

// ── State ═══
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); }
  catch { return { runs: 0, lastRun: null, rendered: [], failed: 0 }; }
}
function saveState(state) { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); }

// ── Load products ═══
let products = [];
try {
  const raw = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
  products = raw.filter(p => p.price && p.image);
} catch (e) {
  console.error('❌ Could not load products.json:', e.message);
  process.exit(1);
}

// ── Render a single video ═══
function renderVideo(product) {
  return new Promise((resolve, reject) => {
    const outputFile = path.join(VIDEOS_DIR, `${product.slug}-promo.mp4`);

    const props = {
      title: product.title,
      shortTitle: product.shortTitle,
      price: product.price,
      oldPrice: product.oldPrice || '',
      rating: product.rating,
      reviews: product.reviews,
      image: product.image,
      specs: product.specs || {},
      store: product.store,
      affiliateUrl: product.affiliateUrl,
    };

    console.log(`  🎬 Rendering: ${product.shortTitle}`);

    const proc = spawn('npx', [
      'remotion', 'render',
      'src/index.ts',
      'ProductPromo',
      outputFile,
      '--props', JSON.stringify(props),
    ], {
      cwd: REMOTION_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium-browser' },
    });

    let stderr = '';
    proc.stdout.on('data', (d) => { const t = d.toString(); if (t.includes('Rendered') || t.includes('%')) process.stdout.write(`    ${t.trim()}\n`); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        const size = fs.existsSync(outputFile) ? (fs.statSync(outputFile).size / 1024 / 1024).toFixed(1) + ' MB' : '?';
        console.log(`  ✅ Done: ${product.shortTitle} (${size})`);
        resolve({ slug: product.slug, size });
      } else {
        console.error(`  ❌ Failed: ${product.shortTitle}`);
        reject(new Error(`Exit code ${code}: ${stderr.substring(0, 200)}`));
      }
    });
  });
}

// ── Main render cycle ═══
async function renderMissing() {
  if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

  const missing = products.filter(p => !fs.existsSync(path.join(VIDEOS_DIR, `${p.slug}-promo.mp4`)));

  if (missing.length === 0) {
    console.log('  ✅ All product videos already rendered.');
    return { rendered: 0, failed: 0 };
  }

  console.log(`\n🎬 Video Agent — Rendering ${missing.length} missing video(s)...\n`);

  let success = 0, failed = 0;
  for (const product of missing) {
    try {
      await renderVideo(product);
      success++;
    } catch (e) { failed++; }
  }

  const state = loadState();
  state.runs++;
  state.lastRun = new Date().toISOString();
  state.rendered.push(...missing.map(p => p.slug));
  state.failed += failed;
  saveState(state);

  console.log(`\n📊 Video render complete: ${success} success, ${failed} failed\n`);
  return { rendered: success, failed };
}

// ── Daemon Mode ═══
function runDaemon() {
  console.log('\n🎬 Video Agent — 24/7 Daemon Mode Started');
  console.log('   Rendering missing videos every 2 hours...\n');

  renderMissing().catch(e => console.error('❌ Error:', e.message));

  setInterval(() => {
    console.log(`\n[${new Date().toLocaleString()}] Running video render cycle...`);
    renderMissing().catch(e => console.error('❌ Error:', e.message));
  }, 2 * 60 * 60 * 1000);
}

// ── CLI ──═
const args = process.argv.slice(2);
if (args.includes('--daemon')) {
  runDaemon();
} else if (args.includes('--all')) {
  // Re-render all
  for (const p of products) {
    const f = path.join(VIDEOS_DIR, `${p.slug}-promo.mp4`);
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  renderMissing().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
} else {
  renderMissing().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
}
