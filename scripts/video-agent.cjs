#!/usr/bin/env node
/**
 * Short Video Agent — Generates 2-second bike video clips from inventory images
 *
 * Takes product images and creates short animated previews:
 * - Downloads/copies product images
 * - Creates 2-second MP4/GIF clips with Ken Burns zoom effect
 * - Outputs to public/videos/ directory
 *
 * Requirements: ffmpeg installed (apt install ffmpeg)
 *
 * Usage: node scripts/video-agent.cjs [--all] [--slug shop-ebike-boys-fat-tire-1200w]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const VIDEOS_DIR = path.join(PUBLIC_DIR, 'videos');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'videos', 'thumbs');

// Product images from the blog posts (subset of best images)
const INVENTORY = [
  {
    slug: 'ebike-boys-1200w',
    images: [
      'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/Scd3bd33467fa4043becc18698a4f408ff_21bc8384-e2bc-4bc5-9928-07b4419888f5.webp?v=1773797188',
      'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/S1401583e5f3a459ea81d9ccfc247e244q_9881836d-feb6-45bb-b932-0d51d3a24221.webp?v=1773797188',
    ],
  },
  {
    slug: 'ebike-boys-750w',
    images: [
      'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/S160a8b1f441d484ba123af10f1c343fd2_7b3a2c11-73eb-45ba-8293-a6e94f23d66c.webp?v=1773797167',
      'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/Sd631b56bb63b4648bf99ba681dd12368V_b7c8d594-daff-4082-ba5a-9f9ce94eaf38.webp?v=1773797167',
    ],
  },
  {
    slug: 'terrosor-folding',
    images: [
      'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/S4783b0c9be314445952f8bd90d26f625i.webp?v=1773797167',
      'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/S87acc45f0d7c4c71aee0ff1685d178b4T.webp?v=1773797168',
    ],
  },
  {
    slug: 'aniioki-a9',
    images: [
      'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/Aniioki_a9_awd_25_15_Black_d96624aa-3493-43d1-b7bb-c5aaeee27aa9.webp?v=1773797008',
      'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/Aniioki_a9_awd_25_14_Gray_b6ebbcc6-65cd-4421-955d-f59f4b8f3ce0.webp?v=1773797007',
    ],
  },
  {
    slug: 'quietkat-apex',
    images: [
      'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/QuietKat_HD_Grey_098_1024x1024_ed1a10c2-4b32-4b25-b9b6-58c0b3dcb653.webp?v=1773796933',
      'https://cdn.shopify.com/s/files/1/0981/0703/1918/files/QuietKat_HD_Green_114_1024x1024_c6748c96-7645-408d-9408-1a845168034f.webp?v=1773796934',
    ],
  },
];

// ── Utility Functions ═══

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadImage(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Download failed: ${response.statusCode} for ${url}`));
      }
      const file = fs.createWriteStream(destPath);
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', reject);
  });
}

function createKenBurnsVideo(inputImage, outputPath, duration = 2) {
  // Ken Burns effect: slow zoom + pan using ffmpeg
  const cmd = `ffmpeg -y -loop 1 -i "${inputImage}" -vf "zoompan=z='min(zoom+0.0015,1.2)':d=${duration * 25}:s=640x480" -t ${duration} -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${outputPath}" 2>&1`;
  try {
    execSync(cmd, { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

function createGifPreview(inputImage, outputPath, duration = 2) {
  // Create animated GIF as fallback
  const cmd = `ffmpeg -y -loop 1 -i "${inputImage}" -vf "scale=480:-1,fps=25" -t "${duration}" "${outputPath}" 2>&1`;
  try {
    execSync(cmd, { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

// ── Main ═══

async function main() {
  const args = process.argv.slice(2);
  const doAll = args.includes('--all');
  const slugArg = args.indexOf('--slug');
  const targetSlug = slugArg >= 0 ? args[slugArg + 1] : null;

  console.log('\n🎬 Video Agent — Generating 2-second bike video clips...\n');

  // Check ffmpeg
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
  } catch {
    console.log('  ❌ ffmpeg not found. Install it: sudo apt install ffmpeg\n');
    process.exit(1);
  }

  // Ensure output dirs
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const items = doAll ? INVENTORY : targetSlug ? INVENTORY.filter(i => i.slug === targetSlug) : INVENTORY.slice(0, 2);

  if (items.length === 0) {
    console.log('  ⚠️  No matching products found.\n');
    process.exit(0);
  }

  let created = 0;
  for (const item of items) {
    for (let idx = 0; idx < item.images.length; idx++) {
      const url = item.images[idx];
      const imgFile = path.join(IMAGES_DIR, `${item.slug}-${idx}.jpg`);
      const mp4File = path.join(VIDEOS_DIR, `${item.slug}-${idx}.mp4`);
      const gifFile = path.join(VIDEOS_DIR, `${item.slug}-${idx}.gif`);

      // Skip if already exists
      if (fs.existsSync(mp4File)) {
        console.log(`  ⏭️  ${item.slug}-${idx}.mp4 exists — skipping`);
        continue;
      }

      try {
        // Download image
        process.stdout.write(`  📥 Downloading ${item.slug}-${idx}... `);
        await downloadImage(url, imgFile);
        console.log('✓');

        // Create MP4 video
        process.stdout.write(`  🎥 Creating ${item.slug}-${idx}.mp4... `);
        const ok = createKenBurnsVideo(imgFile, mp4File);
        if (ok) {
          console.log('✓');
          created++;
        } else {
          // Fallback to GIF
          console.log('falling back to GIF...');
          createGifPreview(imgFile, gifFile);
          console.log(`  🎞️  Created GIF: ${gifFile}`);
          created++;
        }
      } catch (err) {
        console.log(`\n  ❌ Error: ${err.message}`);
      }
    }
  }

  console.log(`\n📊 Summary: ${created} video clip(s) created in public/videos/`);
  console.log('   Use in blog posts:');
  console.log('   <video autoplay muted loop playsinline src="/videos/ebike-boys-1200w-0.mp4" style="width:100%;border-radius:8px;">\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
