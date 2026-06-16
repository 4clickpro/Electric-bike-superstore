#!/usr/bin/env node
/**
 * Render Video Script — Generates product promo videos from product data
 *
 * Reads product data from src/data/products.json and renders MP4 videos
 * using Remotion headless (server-side, no browser UI).
 *
 * Usage:
 *   node scripts/render-video.cjs --slug burchda-y3-awd
 *   node scripts/render-video.cjs --missing    # Render all missing videos
 *   node scripts/render-video.cjs --all        # Re-render all videos
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '..', 'src', 'data', 'products.json');
const VIDEOS_DIR = path.join(__dirname, '..', 'public', 'videos');
const REMOTION_DIR = '/home/ubuntu/remotion-studio';

// ── Load product data ═══
let products = [];
try {
  const raw = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
  products = raw.filter(p => p.price && p.image); // Only products with price + image
} catch (e) {
  console.error('❌ Could not load products.json:', e.message);
  process.exit(1);
}

// ── Ensure output directory ═══
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// ── Render a single product video ═══
function renderVideo(product) {
  return new Promise((resolve, reject) => {
    const outputFile = path.join(VIDEOS_DIR, `${product.slug}-promo.mp4`);

    // Build props JSON
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

    console.log(`  🎬 Rendering: ${product.shortTitle} → ${path.basename(outputFile)}`);

    // Use Remotion CLI to render — entry point is src/index.ts (Root.tsx re-export)
    const args = [
      'npx', 'remotion', 'render',
      'src/index.ts',  // entry point
      'ProductPromo',  // composition name
      outputFile,
      '--props', JSON.stringify(props),
    ];

    const proc = spawn(args[0], args.slice(1), {
      cwd: REMOTION_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium-browser',
      },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      // Show progress lines
      if (text.includes('Rendered') || text.includes('Progress') || text.includes('%')) {
        process.stdout.write(`    ${text.trim()}\n`);
      }
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        const size = fs.existsSync(outputFile) ? (fs.statSync(outputFile).size / 1024 / 1024).toFixed(1) + ' MB' : 'unknown';
        console.log(`  ✅ Done: ${product.shortTitle} (${size})`);
        resolve({ slug: product.slug, file: outputFile, size });
      } else {
        console.error(`  ❌ Failed: ${product.shortTitle} (exit code ${code})`);
        if (stderr) console.error(`    ${stderr.substring(0, 200)}`);
        reject(new Error(`Render failed for ${product.slug}`));
      }
    });
  });
}

// ── Main ═══
async function main() {
  const args = process.argv.slice(2);
  const slugArg = args.indexOf('--slug');
  const missingOnly = args.includes('--missing');
  const allMode = args.includes('--all');

  let toRender = [];

  if (slugArg >= 0 && args[slugArg + 1]) {
    const product = products.find(p => p.slug === args[slugArg + 1]);
    if (!product) {
      console.error(`❌ Product not found: ${args[slugArg + 1]}`);
      process.exit(1);
    }
    toRender = [product];
  } else if (missingOnly) {
    toRender = products.filter(p => {
      const outputFile = path.join(VIDEOS_DIR, `${p.slug}-promo.mp4`);
      return !fs.existsSync(outputFile);
    });
    console.log(`\n🎬 Rendering ${toRender.length} missing videos...\n`);
  } else if (allMode) {
    toRender = products;
    console.log(`\n🎬 Re-rendering all ${toRender.length} videos...\n`);
  } else {
    console.log('\n🎬 Remotion Video Renderer\n');
    console.log('Usage:');
    console.log('  node scripts/render-video.cjs --slug <product-slug>');
    console.log('  node scripts/render-video.cjs --missing     # Render missing only');
    console.log('  node scripts/render-video.cjs --all         # Re-render all');
    console.log(`\nAvailable products: ${products.length}`);
    products.forEach(p => {
      const exists = fs.existsSync(path.join(VIDEOS_DIR, `${p.slug}-promo.mp4`));
      console.log(`  ${exists ? '✅' : '⬜'} ${p.slug} — ${p.shortTitle} (${p.price})`);
    });
    console.log('');
    return;
  }

  if (toRender.length === 0) {
    console.log('✅ All videos already rendered. Nothing to do.');
    return;
  }

  let success = 0;
  let failed = 0;

  for (const product of toRender) {
    try {
      await renderVideo(product);
      success++;
    } catch (e) {
      failed++;
    }
  }

  console.log(`\n📊 Render complete: ${success} success, ${failed} failed\n`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
