#!/usr/bin/env node
/**
 * Video Agent — 24/7 Automated Video Production
 *
 * Creates new video content on schedule:
 * - Daily: Renders missing product promo videos
 * - Every 2 days: Creates "Best of [Category]" roundup videos
 * - Weekly: Creates comparison videos (Product A vs Product B)
 *
 * All videos rendered headlessly via Remotion + Chromium + ffmpeg.
 *
 * Usage:
 *   node scripts/video-agent.cjs           # Run once
 *   node scripts/video-agent.cjs --daemon  # Run 24/7
 *   node scripts/video-agent.cjs --all     # Re-render everything
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '..', 'src', 'data', 'products.json');
const VIDEOS_DIR = path.join(__dirname, '..', 'public', 'videos');
const REMOTION_DIR = '/home/ubuntu/remotion-studio';
const STATE_FILE = path.join(__dirname, '.video-agent-state.json');

const AFF_URL = 'https://www.awin1.com/cread.php?awinmid=123118&awinaffid=2915733';

// ── State ═══
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); }
  catch { return { runs: 0, lastRun: null, rendered: [], failed: 0, roundups: 0 }; }
}
function saveState(state) { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); }

// ── Load products ═══
let products = [];
try {
  const raw = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
  products = raw.filter(p => p.price && p.image);
} catch (e) { console.error('❌ products.json:', e.message); process.exit(1); }

// ── Render a single video via Remotion ═══
function renderVideo(outputFile, props) {
  return new Promise((resolve, reject) => {
    const args = [
      'npx', 'remotion', 'render',
      'src/index.ts', 'ProductPromo', outputFile,
      '--props', JSON.stringify(props),
    ];
    const proc = spawn(args[0], args.slice(1), {
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
        resolve({ file: outputFile, size });
      } else {
        reject(new Error(`Exit ${code}: ${stderr.substring(0, 200)}`));
      }
    });
  });
}

// ── Product promo video ═══
function getPromoProps(product) {
  return {
    title: product.title,
    shortTitle: product.shortTitle,
    price: product.price,
    oldPrice: product.oldPrice || '',
    rating: product.rating,
    reviews: product.reviews,
    image: product.image,
    specs: product.specs || {},
    store: product.store,
    affiliateUrl: AFF_URL,
  };
}

// ── Roundup video (best of category) ═══
function getRoundupProps(category, posts) {
  const top3 = posts.slice(0, 3);
  return {
    title: `Best ${category} Electric Bikes in 2026`,
    shortTitle: `Best ${category} E-Bikes`,
    price: top3[0]?.price || '$999',
    oldPrice: '',
    rating: top3[0]?.rating || 4.5,
    reviews: top3[0]?.reviews || 40,
    image: top3[0]?.image || products[0]?.image,
    specs: {
      'Pick #1': top3[0]?.shortTitle || 'N/A',
      'Pick #2': top3[1]?.shortTitle || 'N/A',
      'Pick #3': top3[2]?.shortTitle || 'N/A',
    },
    store: 'Our Top Picks',
    affiliateUrl: AFF_URL,
  };
}

// ── Render cycle ═══
async function renderCycle() {
  if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

  const state = loadState();
  let rendered = 0, failed = 0;

  // 1. Render missing product promos
  const missing = products.filter(p => !fs.existsSync(path.join(VIDEOS_DIR, `${p.slug}-promo.mp4`)));

  if (missing.length > 0) {
    console.log(`\n🎬 Rendering ${missing.length} missing product promo video(s)...\n`);
    for (const product of missing) {
      try {
        const out = path.join(VIDEOS_DIR, `${product.slug}-promo.mp4`);
        const r = await renderVideo(out, getPromoProps(product));
        console.log(`  ✅ ${product.shortTitle} (${r.size})`);
        state.rendered.push(product.slug);
        rendered++;
      } catch (e) {
        console.error(`  ❌ ${product.shortTitle}: ${e.message}`);
        failed++;
      }
    }
  }

  // 2. Render roundup videos for categories (every 2nd run)
  if (state.runs % 2 === 0) {
    const categories = [...new Set(products.map(p => p.category))];
    for (const cat of categories) {
      const catProducts = products.filter(p => p.category === cat);
      if (catProducts.length < 2) continue;

      const slug = `best-${cat.toLowerCase().replace(/\s+/g, '-')}-ebikes-2026`;
      const out = path.join(VIDEOS_DIR, `${slug}.mp4`);

      if (!fs.existsSync(out)) {
        try {
          console.log(`\n🎬 Rendering roundup: Best ${cat} E-Bikes...`);
          const r = await renderVideo(out, getRoundupProps(cat, catProducts));
          console.log(`  ✅ Roundup: ${cat} (${r.size})`);
          state.roundups++;
          rendered++;
        } catch (e) {
          console.error(`  ❌ Roundup ${cat}: ${e.message}`);
          failed++;
        }
      }
    }
  }

  // 3. Render comparison videos (every 3rd run)
  if (state.runs % 3 === 0 && products.length >= 2) {
    const pairs = [];
    for (let i = 0; i < products.length - 1; i += 2) {
      if (products[i + 1]) pairs.push([products[i], products[i + 1]]);
    }
    for (const [a, b] of pairs) {
      const slug = `${a.slug}-vs-${b.slug}`;
      const out = path.join(VIDEOS_DIR, `${slug}.mp4`);
      if (!fs.existsSync(out)) {
        try {
          console.log(`\n🎬 Rendering comparison: ${a.shortTitle} vs ${b.shortTitle}...`);
          const props = getPromoProps(a);
          props.shortTitle = `${a.shortTitle} vs ${b.shortTitle}`;
          props.title = `${a.shortTitle} vs ${b.shortTitle} — Which Is Better?`;
          props.specs = {
            [a.shortTitle]: a.price,
            [b.shortTitle]: b.price,
            'Winner': 'Both Great!',
          };
          const r = await renderVideo(out, props);
          console.log(`  ✅ Comparison: ${a.shortTitle} vs ${b.shortTitle} (${r.size})`);
          rendered++;
        } catch (e) {
          console.error(`  ❌ Comparison failed: ${e.message}`);
          failed++;
        }
      }
    }
  }

  state.runs++;
  state.lastRun = new Date().toISOString();
  state.failed += failed;
  saveState(state);

  console.log(`\n📊 Video Agent Summary:`);
  console.log(`   Rendered: ${rendered}`);
  console.log(`   Failed:   ${failed}`);
  console.log(`   Total videos: ${fs.readdirSync(VIDEOS_DIR).filter(f => f.endsWith('.mp4')).length}`);
  console.log(`   Roundups created: ${state.roundups}\n`);

  return { rendered, failed };
}

// ── Daemon Mode ═══
function runDaemon() {
  console.log('\n🎬 Video Agent — 24/7 Daemon Mode Started');
  console.log('   Rendering missing videos every 2 hours...\n');

  renderCycle().catch(e => console.error('❌ Error:', e.message));

  setInterval(() => {
    console.log(`\n[${new Date().toLocaleString()}] Running video production cycle...`);
    renderCycle().catch(e => console.error('❌ Error:', e.message));
  }, 2 * 60 * 60 * 1000);
}

// ── CLI ──═
const args = process.argv.slice(2);
if (args.includes('--daemon')) {
  runDaemon();
} else if (args.includes('--all')) {
  // Clear and re-render all
  for (const f of fs.readdirSync(VIDEOS_DIR).filter(f => f.endsWith('.mp4'))) {
    fs.unlinkSync(path.join(VIDEOS_DIR, f));
  }
  renderCycle().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
} else {
  renderCycle().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
}
