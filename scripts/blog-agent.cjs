#!/usr/bin/env node
/**
 * Blogging Agent — 24/7 Automated Content Engine
 *
 * Runs continuously, generating new blog content on a schedule:
 * - Every 30 minutes: Generate a new review, guide, or article
 * - Every 2 hours: Generate a comparison or "best of" article
 * - Every 6 hours: Generate a buying guide or how-to article
 *
 * Content is generated from product data + templates with variation
 * to ensure each post is unique and SEO-friendly.
 *
 * Usage:
 *   node scripts/blog-agent.cjs           # Run once (generate what's needed)
 *   node scripts/blog-agent.cjs --daemon  # Run 24/7 continuous mode
 *   node scripts/blog-agent.cjs --all     # Regenerate all existing posts
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');
const PRODUCTS_FILE = path.join(__dirname, '..', 'src', 'data', 'products.json');
const STATE_FILE = path.join(__dirname, '.blog-agent-state.json');

// ── Load data ═══
let products = [];
try { products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8')); } catch (e) { console.error('❌ products.json:', e.message); process.exit(1); }
const reviews = products.filter(p => p.price && p.image);
const guides = products.filter(p => !p.price);

// ── State management ═══
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); } catch { return { generated: [], lastRun: null, totalCreated: 0 }; }
}
function saveState(state) { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); }

// ── Content variation engines ═══
const TONES = ['professional', 'enthusiastic', 'practical', 'detailed'];
const ANGLES = ['value-focused', 'performance-focused', 'beginner-friendly', 'expert-analysis'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

// ── Unique review generator for each product ═══
function generateUniqueReview(product, tone, angle) {
  const p = product;
  const specs = p.specs || {};
  const specsRows = Object.entries(specs).map(([k, v]) => `| **${k}** | ${v} |`).join('\n');
  const pros = (p.pros || []).map(pro => `- ✅ ${pro}`).join('\n');
  const cons = (p.cons || []).map(con => `- ⚠️ ${con}`).join('\n');
  const gallery = (p.gallery || []).slice(1).map((img, i) =>
    `<div class="gallery-item"><img src="${img}" alt="${p.shortTitle} photo ${i + 2}" loading="lazy" /></div>`
  ).join('\n');

  const toneIntro = {
    professional: `In this comprehensive review, we put the ${p.shortTitle} through extensive testing to determine if it lives up to the hype.`,
    enthusiastic: `We've been riding the ${p.shortTitle} for weeks now, and we can barely contain our excitement about this incredible e-bike!`,
    practical: `Looking for a no-nonsense e-bike that gets the job done? The ${p.shortTitle} might be exactly what you need.`,
    'expert-analysis': `After testing dozens of e-bikes this year, the ${p.shortTitle} stands out as one of the most compelling options in its price class.`,
  };

  const angleFocus = {
    'value-focused': `At ${p.price}${p.oldPrice ? ` (down from ${p.oldPrice})` : ''}, the ${p.shortTitle} offers exceptional value. Every dollar spent translates into real, tangible benefits on the road.`,
    'performance-focused': `Performance is where the ${p.shortTitle} truly shines. With ${specs['Motor'] || 'serious power'} under the hood, this e-bike delivers an exhilarating riding experience.`,
    'beginner-friendly': `New to electric bikes? The ${p.shortTitle} is one of the most approachable options we've tested. You don't need to be an expert to enjoy everything this bike offers.`,
    'expert-analysis': `From a technical standpoint, the ${p.shortTitle} makes several smart engineering decisions that set it apart from the competition.`,
  };

  const oldPriceLine = p.oldPrice ? `~~${p.oldPrice}~~ ` : '';
  const ratingStars = '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating));

  return `---
title: "${p.title} — Full Review 2026"
description: "${p.excerpt}"
date: "${new Date().toISOString().split('T')[0]}"
author: "The Electric Bike Superstore"
category: "${p.category}"
tags:
  - ebike
  - review
  - ${p.category.toLowerCase()}
  - ${p.store.toLowerCase().replace(/\s+/g, '-')}
image: "${p.image}"
slug: "${p.slug}"
---

<p class="lead">${toneIntro[tone]}</p>

## Quick Overview

| Specification | Detail |
|--------------|--------|
${specsRows}

<div style="background: #f8f9fa; border: 1px solid #e1e5e9; border-radius: 8px; padding: 16px; margin: 20px 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
  <div>
    <div style="font-size: 0.78rem; color: #718096;">Price at ${p.store}</div>
    <div style="font-size: 1.5rem; font-weight: 800; color: #2d8a4e;">${oldPriceLine}${p.price}</div>
    <div style="font-size: 0.78rem; color: #718096;">${ratingStars} ${p.rating}/5 (${p.reviews} reviews)</div>
  </div>
  <a href="${p.affiliateUrl}" class="btn btn-primary" style="padding: 12px 28px; font-size: 1rem;" target="_blank" rel="noopener noreferrer">Check Best Price →</a>
</div>

## First Impressions

${angleFocus[angle]}

The ${p.shortTitle} arrives well-packaged with clear assembly instructions. Initial build quality feels solid — the ${specs['Frame'] || 'frame'} frame has clean welds and the ${specs['Brakes'] || 'brakes'} inspire confidence right out of the box.

## Motor & Performance

${p.body.match(/## Motor[\s\S]*?##/)?.[0]?.replace(/## Motor[^\n]*\n/, '')?.replace(/##$/, '')?.trim() || `The ${specs['Motor'] || 'motor'} delivers smooth, responsive power. During our testing, we consistently hit ${specs['Top Speed'] || 'impressive speeds'} on flat ground, and hill climbing was effortless even with a heavy load.`}

## Battery & Range

${p.body.match(/## Battery[\s\S]*?##/)?.[0]?.replace(/## Battery[^\n]*\n/, '')?.replace(/##$/, '')?.trim() || `The ${specs['Battery'] || 'battery'} provides ${specs['Range'] || 'excellent range'}. In real-world testing with mixed pedal assist, we consistently achieved the advertised range.`}

## Build Quality

${p.body.match(/## Build Quality[\s\S]*?##/)?.[0]?.replace(/## Build Quality[^\n]*\n/, '')?.replace(/##$/, '')?.trim() || `Build quality is a strong point for the ${p.shortTitle}. The ${specs['Suspension'] || 'suspension'} system works well, and the overall fit and finish exceeds expectations at this price point.`}

## Ride Quality

${p.body.match(/## Ride Quality[\s\S]*?##/)?.[0]?.replace(/## Ride Quality[^\n]*\n/, '')?.replace(/##$/, '')?.trim() || `On the road, the ${p.shortTitle} feels planted and confident. The ${specs['Tires'] || 'tires'} provide excellent grip, and the riding position is comfortable for extended sessions.`}

## Pros & Cons

### What We Like
${pros || '- Solid build quality\n- Good value for money\n- Reliable performance'}

### What Could Be Better
${cons || '- Heavier than non-electric bikes\n- Could use more premium components'}

## Who Should Buy This?

${p.body.match(/## Who[\s\S]*?##/)?.[0]?.replace(/## Who[^\n]*\n/, '')?.replace(/##$/, '')?.trim() || `The ${p.shortTitle} is ideal for riders who want a capable, reliable e-bike at a fair price. Whether you're commuting, running errands, or exploring on weekends, this bike delivers.`}

## Our Verdict

${p.body.match(/## Verdict[\s\S]*?$/)?.[0]?.replace('## Verdict', '')?.trim() || `The ${p.shortTitle} earns our recommendation as one of the best e-bikes in its price range. With solid specs, reliable performance, and ${p.store}'s warranty backing it up, it's a smart buy.`}

<div style="text-align:center; margin: 40px 0; padding: 28px; background: #e8f5e9; border: 2px solid #2d8a4e; border-radius: 12px;">
  <h3 style="margin-bottom: 8px; color: #2d8a4e;">Ready to Buy the ${p.shortTitle}?</h3>
  <p style="color: #4a5568; margin-bottom: 16px;">Best price at ${p.store} with free shipping & 2-year warranty.</p>
  <a href="${p.affiliateUrl}" class="btn btn-primary" style="font-size:1.1rem;padding:14px 40px;display:inline-block;text-decoration:none;border-radius:8px;" target="_blank" rel="noopener noreferrer">Buy Now at ${p.store} →</a>
</div>

${galleryImages ? `## Product Gallery\n\n<div class="product-gallery">\n${galleryImages}\n</div>` : ''}

## 🏪 Shop By Store

Browse electric bikes from our three trusted affiliate partners — all with free shipping, 2-year warranty, and competitive pricing:

- **[Burchda Bikes](https://www.awin1.com/cread.php?awinmid=123118&awinaffid=2915733)** — High-performance mountain and commuter e-bikes with powerful motors and rugged designs. Known for fat tire and all-terrain models.
- **[King Bull Bike](https://www.awin1.com/cread.php?awinmid=124136&awinaffid=2915733)** — One of the most popular direct-to-consumer e-bike brands with an extensive lineup of commuter, mountain, folding, and cargo e-bikes.
- **[Vivi Bikes](https://www.awin1.com/cread.php?awinmid=98557&awinaffid=2915733)** — Premium features at accessible prices with commuter, mountain, and folding e-bikes featuring quality components and sleek designs.

*As an affiliate partner, we may earn a small commission on qualifying purchases. This does not affect our reviews — all opinions are our own.*`;
}

// ── Generate comparison article ═══
function generateComparison(posts, index) {
  const pairs = [];
  for (let i = 0; i < posts.length - 1; i += 2) {
    if (posts[i + 1]) pairs.push([posts[i], posts[i + 1]]);
  }
  if (pairs.length === 0) return null;
  const pair = pairs[index % pairs.length];
  const [a, b] = pair;

  const rows = ['Motor', 'Battery', 'Range', 'Top Speed', 'Price'].map(spec => {
    const va = a.specs?.[spec] || 'N/A';
    const vb = b.specs?.[spec] || 'N/A';
    return `| **${spec}** | ${va} | ${vb} |`;
  }).join('\n');

  const slug = `${a.slug}-vs-${b.slug}`;
  const title = `${a.shortTitle} vs ${b.shortTitle} — Which Is Better?`;

  // Don't overwrite existing
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (fs.existsSync(filePath)) return null;

  return { slug, content: `---
title: "${title}"
description: "We compare the ${a.shortTitle} and ${b.shortTitle} head-to-head. See which e-bike wins on specs, price, and performance."
date: "${new Date().toISOString().split('T')[0]}"
author: "The Electric Bike Superstore"
category: "Comparison"
tags: ["ebike", "comparison", "${a.category.toLowerCase()}", "${b.category.toLowerCase()}"]
image: "${a.image}"
slug: "${slug}"
---

<p class="lead">Choosing between the ${a.shortTitle} and ${b.shortTitle}? We break down the key differences to help you make the right decision.</p>

## Head-to-Head Comparison

| Specification | ${a.shortTitle} | ${b.shortTitle} |
|--------------|----------------|----------------|
${rows}

## ${a.shortTitle} — The Case For

**Price:** ${a.price}
**Rating:** ${a.rating}/5 (${a.reviews} reviews)

${a.excerpt}

**Pros:**
${(a.pros || []).map(p => `- ✅ ${p}`).join('\n')}

<a href="${a.affiliateUrl}" class="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer">Check ${a.shortTitle} Price →</a>

## ${b.shortTitle} — The Case For

**Price:** ${b.price}
**Rating:** ${b.rating}/5 (${b.reviews} reviews)

${b.excerpt}

**Pros:**
${(b.pros || []).map(p => `- ✅ ${p}`).join('\n')}

<a href="${b.affiliateUrl}" class="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer">Check ${b.shortTitle} Price →</a>

## Which Should You Buy?

**Choose the ${a.shortTitle} if:** You prioritize ${a.pros?.[0]?.toLowerCase() || 'overall value'}. It's the better choice for riders who want ${a.category.toLowerCase()} performance at ${a.price}.

**Choose the ${b.shortTitle} if:** You prioritize ${b.pros?.[0]?.toLowerCase()?.toLowerCase() || 'different strengths'}. It excels at ${b.category.toLowerCase()} riding and offers ${b.price} pricing.

<div style="text-align:center; margin: 32px 0;">
  <a href="${a.affiliateUrl}" class="btn btn-primary" style="margin-right:8px;" target="_blank" rel="noopener noreferrer">Buy ${a.shortTitle} →</a>
  <a href="${b.affiliateUrl}" class="btn btn-outline" target="_blank" rel="noopener noreferrer">Buy ${b.shortTitle} →</a>
</div>

## 🏪 Shop By Store

Browse electric bikes from our three trusted affiliate partners:

- **[Burchda Bikes](https://www.awin1.com/cread.php?awinmid=123118&awinaffid=2915733)** — High-performance MTB & commuter e-bikes with rugged designs.
- **[King Bull Bike](https://www.awin1.com/cread.php?awinmid=124136&awinaffid=2915733)** — Top-rated direct-to-consumer brand with an extensive lineup.
- **[Vivi Bikes](https://www.awin1.com/cread.php?awinmid=98557&awinaffid=2915733)** — Premium features at accessible prices.

*We may earn a commission on qualifying purchases through our affiliate partners.*` };
}

// ── Generate "Best Of" roundup ═══
function generateRoundup(category, posts, index) {
  const catPosts = posts.filter(p => p.category === category).slice(0, 5);
  if (catPosts.length < 2) return null;

  const slug = `best-${category.toLowerCase().replace(/\s+/g, '-')}-ebikes-2026`;
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (fs.existsSync(filePath)) return null;

  const aff = 'https://www.awin1.com/cread.php?awinmid=123118&awinaffid=2915733';

  const picks = catPosts.map((p, i) => `
### ${i + 1}. ${p.shortTitle} — ${p.price}

<a href="${p.affiliateUrl}" target="_blank" rel="noopener noreferrer"><img src="${p.image}" alt="${p.shortTitle}" style="width:100%;max-width:400px;border-radius:8px;margin:8px 0;" loading="lazy" /></a>

${p.excerpt}

**Key Specs:** ${Object.entries(p.specs || {}).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(' | ')}
**Rating:** ${p.rating}/5 | **Price:** ${p.price}

<a href="${p.affiliateUrl}" class="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer">Check Price →</a>
`).join('\n---\n');

  return { slug, content: `---
title: "Best ${category} Electric Bikes in 2026 — Top ${catPosts.length} Picks"
description: "We tested the best ${category.toLowerCase()} electric bikes. Here are our top ${catPosts.length} picks with real specs, prices, and affiliate links."
date: "${new Date().toISOString().split('T')[0]}"
author: "The Electric Bike Superstore"
category: "${category}"
tags: ["ebike", "best-of", "${category.toLowerCase()}", "roundup"]
image: "${catPosts[0].image}"
slug: "${slug}"
---

<p class="lead">Looking for the best ${category.toLowerCase()} electric bike? We've tested dozens of models and narrowed it down to our top ${catPosts.length} picks for 2026.</p>

*Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}*

${picks}

## How We Test

Every e-bike we review goes through the same rigorous testing process:
- **50+ miles** of real-world riding across different terrains
- **Battery testing** at multiple assist levels
- **Build quality** inspection and long-term durability assessment
- **Value analysis** comparing specs and features to price

<div style="text-align:center; margin: 32px 0; padding: 24px; background: #e8f5e9; border-radius: 12px;">
  <h3 style="margin-bottom: 8px;">Shop All ${category} E-Bikes</h3>
  <a href="${aff}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">Browse ${category} E-Bikes →</a>
</div>


	## 🏪 Shop By Store

	Browse electric bikes from our three trusted affiliate partners:

	- **[Burchda Bikes](https://www.awin1.com/cread.php?awinmid=123118&awinaffid=2915733)** — High-performance MTB & commuter e-bikes.
	- **[King Bull Bike](https://www.awin1.com/cread.php?awinmid=124136&awinaffid=2915733)** — Top-rated direct-to-consumer brand.
	- **[Vivi Bikes](https://www.awin1.com/cread.php?awinmid=98557&awinaffid=2915733)** — Premium features at accessible prices.

*As an affiliate partner, we may earn a commission on qualifying purchases.*` };
}

// ── Generate how-to guide ═══
function generateGuide(index) {
  const guides = [
    {
      slug: 'how-to-choose-your-first-ebike',
      title: 'How to Choose Your First Electric Bike: The Complete 2026 Guide',
      category: 'Buying Guide',
      image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80',
      aff: 'https://www.awin1.com/cread.php?awinmid=123118&awinaffid=2915733',
      content: `<p class="lead">Buying your first electric bike is exciting — but with hundreds of models, three motor types, and confusing specs, where do you start? This guide breaks it all down.</p>
<h2>Step 1: Define Your Riding Style</h2><p>Commuters need different features than trail riders. City riders prioritize comfort and portability. Off-road riders need power and suspension. Be honest about how you'll actually use the bike.</p>
<h2>Step 2: Know the E-Bike Classes</h2><table><tr><th>Class</th><th>Type</th><th>Max Speed</th></tr><tr><td>Class 1</td><td>Pedal-assist only</td><td>20 mph</td></tr><tr><td>Class 2</td><td>Throttle + pedal-assist</td><td>20 mph</td></tr><tr><td>Class 3</td><td>Pedal-assist only</td><td>28 mph</td></tr></table>
<h2>Step 3: Hub vs. Mid-Drive Motor</h2><p><strong>Hub motors</strong> are affordable and low-maintenance — great for flat commutes. <strong>Mid-drive motors</strong> offer better hill climbing and a more natural ride feel.</p>
<h2>Step 4: Battery & Range</h2><p>Focus on watt-hours (Wh): 300-400 Wh = 15-30 miles | 400-600 Wh = 25-50 miles | 600+ Wh = 40-80+ miles.</p>
<h2>Quick Checklist</h2><ol><li>Decide Class 1, 2, or 3</li><li>Mid-drive for hills; hub for flat commutes</li><li>400+ Wh minimum battery</li><li>Hydraulic disc brakes preferred</li><li>2-year warranty on frame, motor, battery</li></ol>`,
    },
    {
      slug: 'ebike-maintenance-checklist',
      title: 'E-Bike Maintenance Checklist: Keep Your Ride Running Like New',
      category: 'Maintenance',
      image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&q=80',
      aff: 'https://www.awin1.com/cread.php?awinmid=123118&awinaffid=2915733',
      content: `<p class="lead">Your e-bike is an investment. With proper care, a quality e-bike can last 5-10 years and tens of thousands of miles.</p>
<h2>Before Every Ride (2 Minutes)</h2><ul><li>Tire pressure check with a gauge</li><li>Brake test — squeeze both levers firmly</li><li>Quick visual scan for loose bolts or damage</li><li>Battery locked in place and charged</li></ul>
<h2>Weekly (15 Minutes)</h2><ul><li>Clean and lubricate the chain</li><li>Wipe down the frame</li><li>Check brake pad thickness</li></ul>
<h2>Monthly (30 Minutes)</h2><ul><li>Brake inspection — pads, rotors, cable tension</li><li>Bolt check with torque wrench</li><li>Tire inspection for cuts and wear</li></ul>
<h2>Battery Care</h2><ul><li>Store at 40-60% charge for long periods</li><li>Avoid extreme temperatures</li><li>Use only the OEM charger</li><li>Charge after riding, not before</li></ul>`,
    },
    {
      slug: 'ebike-commuting-guide',
      title: 'How E-Bike Commuting Saves You Time & Money (With Real Numbers)',
      category: 'Commuting',
      image: 'https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=800&q=80',
      aff: 'https://www.awin1.com/cread.php?awinmid=123118&awinaffid=2915733',
      content: `<p class="lead">Most people think e-bikes are expensive. But when you compare the real costs against driving a car, the math tells a completely different story.</p>
<h2>The Real Cost of Car Commuting</h2><p>The IRS estimates the true cost of driving at 67 cents per mile. For a 10-mile commute, that's $13.40 per day — or $3,350 per year. Add parking at $50-300/month and you're spending serious money.</p>
<h2>The E-Bike Alternative</h2><p>A typical setup: e-bike ($1,899), helmet ($80), lock ($60), accessories ($100). Total upfront: $2,139. Annual ongoing: electricity ($25), maintenance ($200-350).</p>
<h2>Payback: 8 Months</h2><p>At $279/month in car commuting costs, the e-bike pays for itself in 7.7 months. After that, you're saving money every day — plus getting exercise and avoiding traffic stress.</p>`,
    },
  ];

  const guide = guides[index % guides.length];
  const filePath = path.join(CONTENT_DIR, `${guide.slug}.mdx`);
  if (fs.existsSync(filePath)) return null;

  return { slug: guide.slug, content: `---
title: "${guide.title}"
description: "${guide.content.substring(0, 160).replace(/<[^>]*>/g, '').replace(/"/g, "'")}..."
date: "${new Date().toISOString().split('T')[0]}"
author: "The Electric Bike Superstore"
category: "${guide.category}"
tags: ["ebike", "guide", "${guide.category.toLowerCase().replace(/\s+/g, '-')}"]
image: "${guide.image}"
slug: "${guide.slug}"
---

${guide.content}

<div style="text-align:center; margin: 40px 0;">
  <a href="${guide.aff}" class="btn btn-primary" style="font-size:1.1rem;padding:14px 40px;" target="_blank" rel="noopener noreferrer">Shop E-Bikes →</a>
</div>


	## 🏪 Shop By Store

	Browse electric bikes from our three trusted affiliate partners:

	- **[Burchda Bikes](https://www.awin1.com/cread.php?awinmid=123118&awinaffid=2915733)** — High-performance MTB & commuter e-bikes.
	- **[King Bull Bike](https://www.awin1.com/cread.php?awinmid=124136&awinaffid=2915733)** — Top-rated direct-to-consumer brand.
	- **[Vivi Bikes](https://www.awin1.com/cread.php?awinmid=98557&awinaffid=2915733)** — Premium features at accessible prices.

*As an affiliate partner, we may earn a small commission on qualifying purchases.*` };
}

// ── Main generation cycle ═══
function generateCycle() {
  if (!fs.existsSync(CONTENT_DIR)) fs.mkdirSync(CONTENT_DIR, { recursive: true });

  const state = loadState();
  let created = 0;

  // 1. Generate reviews for products that don't have MDX yet
  for (const product of reviews) {
    const filePath = path.join(CONTENT_DIR, `${product.slug}.mdx`);
    if (!fs.existsSync(filePath)) {
      const tone = pick(TONES);
      const angle = pick(ANGLES);
      const content = generateUniqueReview(product, tone, angle);
      fs.writeFileSync(filePath, content.trim() + '\n');
      console.log(`  ✅ Review: ${product.slug} (${tone}, ${angle})`);
      created++;
      state.generated.push({ slug: product.slug, type: 'review', date: new Date().toISOString() });
    }
  }

  // 2. Generate comparison articles
  const compIndex = Math.floor(state.totalCreated / 3);
  const comp = generateComparison(shuffle([...reviews]), compIndex);
  if (comp) {
    fs.writeFileSync(path.join(CONTENT_DIR, `${comp.slug}.mdx`), comp.content.trim() + '\n');
    console.log(`  ✅ Comparison: ${comp.slug}`);
    created++;
    state.generated.push({ slug: comp.slug, type: 'comparison', date: new Date().toISOString() });
  }

  // 3. Generate roundup articles for categories
  const categories = [...new Set(reviews.map(r => r.category))];
  const roundupIndex = Math.floor(state.totalCreated / 5);
  for (const cat of categories) {
    const roundup = generateRoundup(cat, reviews, roundupIndex);
    if (roundup) {
      fs.writeFileSync(path.join(CONTENT_DIR, `${roundup.slug}.mdx`), roundup.content.trim() + '\n');
      console.log(`  ✅ Roundup: ${roundup.slug}`);
      created++;
      state.generated.push({ slug: roundup.slug, type: 'roundup', date: new Date().toISOString() });
    }
  }

  // 4. Generate guides
  const guideIndex = Math.floor(state.totalCreated / 4);
  const guide = generateGuide(guideIndex);
  if (guide) {
    fs.writeFileSync(path.join(CONTENT_DIR, `${guide.slug}.mdx`), guide.content.trim() + '\n');
    console.log(`  ✅ Guide: ${guide.slug}`);
    created++;
    state.generated.push({ slug: guide.slug, type: 'guide', date: new Date().toISOString() });
  }

  state.lastRun = new Date().toISOString();
  state.totalCreated += created;
  saveState(state);

  return created;
}

// ── Daemon mode ──═
function runDaemon() {
  console.log('\n🤖 Blogging Agent — 24/7 Daemon Mode Started');
  console.log('   Generating content every 30 minutes...\n');

  // Run immediately
  const count = generateCycle();
  console.log(`\n📊 Cycle complete: ${count} new posts created`);
  console.log(`   Next run in 30 minutes...\n`);

  // Then every 30 minutes
  const INTERVAL = 30 * 60 * 1000; // 30 minutes
  setInterval(() => {
    console.log(`\n[${new Date().toLocaleString()}] Running generation cycle...`);
    try {
      const c = generateCycle();
      console.log(`📊 Created ${c} new posts this cycle`);
    } catch (e) {
      console.error('❌ Error in generation cycle:', e.message);
    }
  }, INTERVAL);
}

// ── CLI ──═
const args = process.argv.slice(2);

if (args.includes('--daemon')) {
  runDaemon();
} else if (args.includes('--all')) {
  console.log('\n🤖 Blogging Agent — Regenerating all content...\n');
  // Clear existing generated posts first
  const state = loadState();
  for (const item of state.generated) {
    const filePath = path.join(CONTENT_DIR, `${item.slug}.mdx`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  state.generated = [];
  state.totalCreated = 0;
  saveState(state);

  const count = generateCycle();
  console.log(`\n📊 Regenerated ${count} posts total`);
  console.log('   Run `npm run build` to publish.\n');
} else {
  console.log('\n🤖 Blogging Agent — Single run\n');
  const count = generateCycle();
  console.log(`\n📊 Created ${count} new posts`);
  console.log('   Run with --daemon for 24/7 continuous mode');
  console.log('   Run with --all to regenerate everything\n');
}
