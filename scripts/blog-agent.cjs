#!/usr/bin/env node
/**
 * Blogging Agent — Generates real e-bike review content from product data
 *
 * Reads from src/data/products.json and creates MDX blog posts with:
 * - Real product specs, images, and affiliate links
 * - EBR-style review content (motor, battery, build quality, ride quality)
 * - Proper Awin affiliate CTAs
 * - Star ratings, pros/cons, specs tables
 *
 * Usage:
 *   node scripts/blog-agent.cjs                    # Generate all missing posts
 *   node scripts/blog-agent.cjs --slug burchda-y3-awd  # Generate specific product
 *   node scripts/blog-agent.cjs --all              # Regenerate all (overwrite)
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');
const PRODUCTS_FILE = path.join(__dirname, '..', 'src', 'data', 'products.json');

// ── Load product data ═══
let products = [];
try {
  products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
} catch (e) {
  console.error('❌ Could not load products.json:', e.message);
  process.exit(1);
}

// ── Review content generator ═══
function generateReview(post) {
  const p = post.product;
  if (!p) return generateGuideContent(post);

  const specs = p.specs || {};
  const specsList = Object.entries(specs).map(([k, v]) => `| ${k} | ${v} |`).join('\n');
  const prosList = (p.pros || []).map(pro => `- ✓ ${pro}`).join('\n');
  const consList = (p.cons || []).map(con => `- ✗ ${con}`).join('\n');
  const galleryImages = (p.gallery || []).slice(1).map((img, i) =>
    `<div class="gallery-item"><img src="${img}" alt="${p.shortTitle} - Photo ${i + 2}" loading="lazy" /></div>`
  ).join('\n');

  const oldPriceLine = p.oldPrice ? `~~${p.oldPrice}~~ ` : '';
  const ratingStars = '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating));

  return `---
title: "${p.title} — Full Review 2026"
description: "${p.excerpt}"
date: "${new Date().toISOString().split('T')[0]}"
author: "The Electric Bike Superstore"
category: "${p.category}"
tags: ["ebike", "review", "${p.category.toLowerCase()}", "${p.store.toLowerCase().replace(/\s+/g, '-')}"]
image: "${p.image}"
slug: "${p.slug}"
---

<p class="lead">${p.excerpt}</p>

## Quick Overview

| Spec | Detail |
|------|--------|
${specsList}

**Price:** ${oldPriceLine}**${p.price}** at ${p.store}
**Rating:** ${ratingStars} ${p.rating}/5 (${p.reviews} reviews)

<div style="text-align:center; margin: 32px 0;">
  <a href="${p.affiliateUrl}" class="btn btn-primary" style="font-size:1.15rem;padding:14px 40px;display:inline-block;text-decoration:none;border-radius:8px;" target="_blank" rel="noopener noreferrer">Check Best Price at ${p.store} →</a>
</div>

## Motor & Performance

${p.body.match(/## Motor & Performance[\s\S]*?##/)?.[0]?.replace('## Motor & Performance', '')?.replace(/##$/, '')?.trim() || `The ${p.shortTitle} is powered by ${specs['Motor'] || 'a powerful motor'} that delivers strong performance across all riding conditions. With a top speed of ${specs['Top Speed'] || 'up to 28 mph'}, this e-bike handles everything from steep hills to flat commutes with ease.`}

## Battery & Range

${p.body.match(/## Battery & Range[\s\S]*?##/)?.[0]?.replace('## Battery & Range', '')?.replace(/##$/, '')?.trim() || `The ${specs['Battery'] || 'high-capacity battery'} provides ${specs['Range'] || 'impressive range'} on a single charge. This is more than enough for daily commuting and weekend adventures.`}

## Build Quality & Components

${p.body.match(/## Build Quality[\s\S]*?##/)?.[0]?.replace('## Build Quality', '')?.replace(/##$/, '')?.trim() || `Built with a ${specs['Frame'] || 'quality aluminum'} frame, the ${p.shortTitle} feels solid and well-constructed. The ${specs['Brakes'] || 'disc brakes'} provide reliable stopping power, and the ${specs['Suspension'] || 'suspension system'} keeps rides comfortable on rough terrain.`}

## Ride Quality

${p.body.match(/## Ride Quality[\s\S]*?##/)?.[0]?.replace('## Ride Quality', '')?.replace(/##$/, '')?.trim() || `On the road (and trail), the ${p.shortTitle} delivers a confident, comfortable ride. The ${specs['Tires'] || 'tires'} provide excellent grip on various surfaces, and the motor assistance feels smooth and natural.`}

## Pros & Cons

### 👍 What We Like
${prosList || '- Solid build quality\n- Good value for money\n- Reliable performance'}

### 👎 What Could Be Better
${consList || '- Heavier than non-electric bikes\n- Could use more premium components'}

## Who Is This E-Bike For?

${p.body.match(/## Who Is This[\s\S]*?##/)?.[0]?.replace(/## Who Is This[\s\S]*?\n/, '')?.replace(/##$/, '')?.trim() || `The ${p.shortTitle} is ideal for riders who want a capable, reliable e-bike without breaking the bank. Whether you're commuting to work, running errands, or exploring trails on weekends, this bike delivers.`}

## Verdict

${p.body.match(/## Verdict[\s\S]*?$/)?.[0]?.replace('## Verdict', '')?.trim() || `The ${p.shortTitle} at ${p.price} represents excellent value in the electric bike market. With solid specs, reliable performance, and ${p.store}'s warranty and support, it's easy to recommend.`}

<div style="text-align:center; margin: 40px 0; padding: 28px; background: #e8f5e9; border: 2px solid #2d8a4e; border-radius: 12px;">
  <h3 style="margin-bottom: 8px; color: #2d8a4e;">Ready to Buy the ${p.shortTitle}?</h3>
  <p style="color: #4a5568; margin-bottom: 16px;">Get the best price at ${p.store} with free shipping and 2-year warranty.</p>
  <a href="${p.affiliateUrl}" class="btn btn-primary" style="font-size:1.15rem;padding:14px 40px;display:inline-block;text-decoration:none;border-radius:8px;" target="_blank" rel="noopener noreferrer">Buy Now at ${p.store} →</a>
</div>

${galleryImages ? `## Product Gallery\n\n<div class="product-gallery">\n${galleryImages}\n</div>` : ''}

*As an affiliate partner of ${p.store}, we may earn a small commission on qualifying purchases. This does not affect our reviews — we test and recommend products independently.*`;
}

// ── Guide content generator ═══
function generateGuideContent(post) {
  return `---
title: "${post.title}"
description: "${post.excerpt}"
date: "${new Date().toISOString().split('T')[0]}"
author: "The Electric Bike Superstore"
category: "${post.category}"
tags: ${JSON.stringify(post.tags || ['ebike', 'guide'])}
image: "${post.image}"
slug: "${post.slug}"
---

${post.body || `<p class="lead">${post.excerpt}</p>`}

<div style="text-align:center; margin: 40px 0;">
  <a href="${post.affiliateUrl || 'https://www.awin1.com/cread.php?awinmid=123118&awinaffid=2915733'}" class="btn btn-primary" style="font-size:1.15rem;padding:14px 40px;display:inline-block;text-decoration:none;border-radius:8px;" target="_blank" rel="noopener noreferrer">Shop E-Bikes →</a>
</div>

*As an affiliate partner, we may earn a small commission on qualifying purchases. This does not affect our recommendations.*`;
}

// ── Main ═══
async function main() {
  const args = process.argv.slice(2);
  const slugArg = args.indexOf('--slug');
  const allArg = args.includes('--all');
  const specificSlug = slugArg >= 0 ? args[slugArg + 1] : null;

  // Ensure content directory exists
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }

  let created = 0;
  let skipped = 0;

  for (const post of products) {
    // If specific slug requested, skip others
    if (specificSlug && post.slug !== specificSlug) continue;

    const filePath = path.join(CONTENT_DIR, `${post.slug}.mdx`);

    if (fs.existsSync(filePath) && !allArg) {
      skipped++;
      continue;
    }

    const content = post.product ? generateReview(post) : generateGuideContent(post);
    fs.writeFileSync(filePath, content.trim() + '\n');
    console.log(`  ✅ ${allArg ? 'Overwrote' : 'Created'}: ${post.slug}.mdx (${post.title.substring(0, 50)}...)`);
    created++;
  }

  console.log(`\n📊 Blogging Agent Summary:`);
  console.log(`   Created/Updated: ${created}`);
  console.log(`   Skipped (exist): ${skipped}`);
  console.log(`   Total products:  ${products.length}`);
  console.log(`\n   Run \`npm run build\` to publish.\n`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
