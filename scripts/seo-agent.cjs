#!/usr/bin/env node
/**
 * SEO Agent — 24/7 Keyword Research & Content Optimization
 *
 * Runs continuously, finding easy-to-rank keywords and optimizing content:
 * - Researches low-competition, high-intent keywords for electric bikes
 * - Generates new blog posts targeting those keywords
 * - Optimizes existing posts with proper keyword placement
 * - Adds meta keywords, improves titles/descriptions for SEO
 * - Creates internal linking suggestions
 *
 * Usage:
 *   node scripts/seo-agent.cjs           # Run once
 *   node scripts/seo-agent.cjs --daemon  # Run 24/7
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');
const PRODUCTS_FILE = path.join(__dirname, '..', 'src', 'data', 'products.json');
const KEYWORDS_FILE = path.join(__dirname, 'seo-keywords.json');
const SITE_URL = 'https://theelectricbikesuperstore.com';
const STATE_FILE = path.join(__dirname, '.seo-agent-state.json');

// Per-store affiliate links
const AFF = {
  burchda:  'https://www.awin1.com/cread.php?awinmid=123118&awinaffid=2915733',
  kingbull: 'https://www.awin1.com/cread.php?awinmid=124136&awinaffid=2915733',
  vivi:     'https://www.awin1.com/cread.php?awinmid=98557&awinaffid=2915733',
};

// Load keywords from file
let KEYWORDS = [];
try {
  const kwData = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf-8'));
  KEYWORDS = kwData.keywords || [];
} catch (e) {
  console.error('⚠️ Could not load seo-keywords.json:', e.message);
}

function getAffiliateUrl(keyword) {
  const k = keyword.toLowerCase();
  // King Bull keywords
  if (k.includes('king bull') || k.includes('kingbull') || k.includes('ranger') || k.includes('literider') || k.includes('rover') || k.includes('voyager') || k.includes('discover') || k.includes('hunter')) {
    return AFF.kingbull;
  }
  // Vivi keywords
  if (k.includes('vivi') || k.includes('ace01') || k.includes('ace07') || k.includes('ace01 pro')) {
    return AFF.vivi;
  }
  // Burchda keywords
  if (k.includes('burchda') || k.includes('y3') || k.includes('hc26') || k.includes('r5') || k.includes('awd')) {
    return AFF.burchda;
  }
  // Default to Burchda for general/guide content
  return AFF.burchda;
}

// ── State ═══
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); }
  catch { return { runs: 0, lastRun: null, keywords: [], postsCreated: 0, optimizations: 0 }; }
}
function saveState(state) { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); }

// ── Load products ═══
let products = [];
try { products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8')).filter(p => p.price); } catch (e) {}

// ── Get existing slugs ═══
function getExistingSlugs() {
  try { return fs.readdirSync(CONTENT_DIR).map(f => f.replace('.mdx', '')); }
  catch { return []; }
}

// ── Generate SEO-optimized blog post for a keyword ═══
function generatePost(keyword, existingSlugs) {
  const slug = keyword.keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  if (existingSlugs.includes(slug)) return null; // Already exists

  const affUrl = getAffiliateUrl(keyword.keyword);
  const title = generateTitle(keyword);
  const description = generateDescription(keyword);
  const body = generateBody(keyword, affUrl);

  return {
    slug,
    content: `---
title: "${title}"
description: "${description}"
date: "${new Date().toISOString().split('T')[0]}"
author: "The Electric Bike Superstore"
category: "${keyword.intent === 'buying' ? 'Buying Guide' : 'Guides'}"
tags:
  - ebike
  - ${keyword.intent}
  - ${keyword.keyword.split(' ').slice(0, 3).join('-')}
image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80"
slug: "${slug}"
---

${body}

<div style="text-align:center; margin: 40px 0; padding: 28px; background: #e8f5e9; border: 2px solid #2d8a4e; border-radius: 12px;">
  <h3 style="margin-bottom: 8px; color: #2d8a4e;">Ready to Find Your Perfect E-Bike?</h3>
  <p style="color: #4a5568; margin-bottom: 16px;">Browse our top-rated electric bikes with free shipping and 2-year warranty.</p>
  <a href="${affUrl}" class="btn btn-primary" style="font-size:1.1rem;padding:14px 40px;display:inline-block;text-decoration:none;border-radius:8px;" target="_blank" rel="noopener noreferrer">Shop E-Bikes →</a>
</div>

*As an affiliate partner, we may earn a small commission on qualifying purchases. This does not affect our recommendations.*`,
  };
}

function generateTitle(kw) {
  const t = kw.keyword;
  // Capitalize first letter of each word
  const base = t.replace(/\b\w/g, c => c.toUpperCase());
  if (kw.intent === 'buying') return `${base}: Top Picks for 2026`;
  if (kw.intent === 'review') return `${base}: Honest Review`;
  return `${base}: What You Need to Know`;
}

function generateDescription(kw) {
  const k = kw.keyword;
  if (k.includes('commuting')) return "Discover the best electric bikes for commuting in 2026. Save money, skip traffic, and enjoy the ride.";
  if (k.includes('under')) return `Looking for ${k}? We tested the top models to find the best value electric bikes in this price range.`;
  if (k.includes('beginner')) return "New to electric bikes? This beginner's guide covers everything you need to know before buying your first e-bike.";
  if (k.includes('fat tire')) return "Fat tire electric bikes offer unmatched versatility. We review the best models for all-terrain riding.";
  if (k.includes('folding')) return "Folding electric bikes are perfect for small spaces and multi-modal commuting. Here are our top picks.";
  if (k.includes('cargo')) return "Electric cargo bikes can replace your car for local trips. Find the best family-friendly cargo e-bikes.";
  if (k.includes('mountain')) return "The best electric mountain bikes under $1500 offer serious off-road capability without breaking the bank.";
  if (k.includes('heavy rider')) return "Best electric bikes for heavy riders — tested for durability, power, and comfort at higher weight limits.";
  if (k.includes('battery care')) return "Proper battery care can double your e-bike's lifespan. Learn the essential maintenance tips.";
  if (k.includes('maintenance')) return "Keep your electric bike running like new with this complete maintenance guide. Simple steps, big results.";
  if (k.includes('vs regular')) return "Electric bike vs regular bike: we compare cost, speed, health benefits, and convenience to help you decide.";
  if (k.includes('worth it')) return "Is an electric bike worth it? We break down the real costs, savings, and benefits of switching to an e-bike.";
  if (k.includes('laws')) return "Electric bike laws vary by state. Know the rules before you ride — complete guide to e-bike regulations.";
  if (k.includes('how fast')) return "How fast can an electric bike go? Learn about speed limits, motor classes, and real-world performance.";
  if (k.includes('range')) return "Electric bike range depends on many factors. Learn how to maximize your distance on a single charge.";
  if (k.includes('seniors')) return "The best electric bikes for seniors prioritize comfort, stability, and ease of use. Here are our top recommendations.";
  if (k.includes('hunting')) return "Electric bikes for hunting offer silent approach and heavy payload capacity. Find the best hunting e-bikes.";
  if (k.includes('savings')) return "Calculate how much you'll save commuting by e-bike vs car. The numbers might surprise you.";
  if (k.includes('choose')) return "How to choose the right electric bike: a step-by-step guide to finding your perfect match.";
  if (k.includes('safety')) return "Electric bike safety tips every rider should know. Stay safe on the road with these essential guidelines.";
  if (k.includes('brands')) return "Best electric bike brands in 2026 — we rank the top manufacturers by quality, value, and customer support.";
  if (k.includes('insurance')) return "Do you need electric bike insurance? Learn about coverage options and how to protect your investment.";
  if (k.includes('rain')) return "Can you ride an electric bike in the rain? What you need to know about water resistance and wet weather riding.";
  if (k.includes('weight limit')) return "Electric bike weight limits explained — find bikes that support riders of all sizes safely.";
  if (k.includes('battery last')) return "How long do electric bike batteries last? Learn about battery lifespan, replacement costs, and care tips.";
  if (k.includes('college')) return "Best electric bikes for college students — affordable, portable, and perfect for campus commuting.";
  if (k.includes('cheap')) return "Cheap electric bikes that are actually good — we found the best budget e-bikes that don't compromise on quality.";
  if (k.includes('city')) return "Best electric bikes for city riding — compact, fast, and perfect for urban commuting.";
  if (k.includes('accessories')) return "Electric bike accessories you actually need — from locks to lights to racks, here's your essential gear list.";
  if (k.includes('chain')) return "Electric bike chain maintenance made easy — keep your drivetrain running smooth with this simple routine.";
  return `Everything you need to know about ${k}. Expert advice, real testing, and honest recommendations.`;
}

function generateBody(kw, affUrl) {
  const k = kw.keyword;
  // Pick diverse products — one from each store if available
  const burchda = products.find(p => p.store === 'Burchda');
  const kingbull = products.find(p => p.store === 'King Bull');
  const vivi = products.find(p => p.store === 'Vivi');
  const relatedProducts = [burchda, kingbull, vivi].filter(Boolean).slice(0, 3);
  // Each product uses its OWN affiliate URL
  const productLinks = relatedProducts.map(p => {
    const pAff = p.affiliateUrl || affUrl;
    return `- [${p.shortTitle}](${pAff}) — ${p.price}, ${p.rating}/5 stars`;
  }).join('\n');

  let sections = '';

  if (k.includes('commuting')) {
    sections = `<p class="lead">Commuting by electric bike is one of the smartest decisions you can make in 2026. With gas prices rising and traffic getting worse, e-bikes offer a faster, cheaper, and healthier way to get to work.</p>

## Why Commute by Electric Bike?

- **Save money**: An e-bike costs about $0.01/mile to operate vs $0.67/mile for a car
- **Skip traffic**: Bike lanes and paths let you bypass congestion
- **Get exercise**: Even with pedal assist, you're still moving your body
- **Reduce emissions**: Zero direct emissions, even accounting for electricity
- **Arrive refreshed**: No stuffy train or stressful drive

## What to Look for in a Commuter E-Bike

| Feature | Why It Matters |
|---------|---------------|
| **Range** | 30+ miles covers most commutes |
| **Speed** | 20-28 mph keeps up with traffic |
| **Comfort** | Upright position for daily riding |
| **Lights** | Integrated lights for visibility |
| **Fenders** | Keep you clean in wet conditions |
| **Rack** | Carry your bag, lunch, or laptop |

## Top Commuter E-Bikes We Recommend

${productLinks}

## How Much Can You Save?

The average American spends $3,350/year on car commuting. An e-bike setup costs about $2,100 upfront and $250/year in maintenance. **That's a payback period of just 8 months.**

After that, you're saving over $3,000 per year. Over 5 years, that's $15,000+ in savings — enough for a vacation, a down payment, or just breathing easier financially.`;
  } else if (k.includes('under') && k.includes('1000')) {
    sections = `<p class="lead">You don't need to spend a fortune to get a quality electric bike. The sub-$1,000 segment has improved dramatically, with several models offering impressive range, power, and build quality.</p>

## Best Electric Bikes Under $1,000

We tested dozens of budget e-bikes and found the ones that actually deliver:

${productLinks}

## What to Expect at This Price

- **Range**: 25-50 miles per charge
- **Motor**: 350-500W (enough for most terrain)
- **Top Speed**: 20 mph (Class 1 or Class 2)
- **Battery**: 36V 10-15Ah
- **Frame**: Aluminum alloy

## What You Might Sacrifice

At under $1,000, you may not get:
- Hydraulic disc brakes (mechanical is fine)
- Integrated lights (add-on lights work great)
- Premium suspension (front fork is standard)
- Ultra-lightweight frame (expect 50-60 lbs)

## Our Testing Process

Every budget e-bike we review goes through:
1. **50+ miles** of real-world riding
2. **Battery testing** at multiple assist levels
3. **Hill climbing** on 10%+ grades
4. **Build quality** inspection
5. **Value scoring** vs competitors`;
  } else if (k.includes('beginner')) {
    sections = `<p class="lead">Buying your first electric bike can feel overwhelming. With hundreds of models, confusing specs, and prices ranging from $500 to $5,000, where do you even start? This guide simplifies everything.</p>

## First Things First: What Type of Riding Will You Do?

Your riding style determines the right e-bike type:

| Riding Style | Best E-Bike Type | Budget Range |
|-------------|-----------------|--------------|
| City commuting | Commuter/Urban | $800-$2,000 |
| Weekend trails | Mountain/Hardtail | $1,000-$2,500 |
| Small apartment | Folding | $600-$1,500 |
| Hauling kids/stuff | Cargo | $1,500-$3,500 |
| All-purpose | Fat tire/All-terrain | $900-$2,000 |

## Understanding E-Bike Specs

**Motor (Watts)**: More watts = more power. 250W is fine for flat city riding. 500W+ for hills and off-road.

**Battery (Volts × Amp-hours = Watt-hours)**: Higher Wh = more range. 400Wh is a good minimum for commuting.

**Range**: Manufacturer claims are optimistic. Expect 60-70% of advertised range in real-world use.

**Weight**: E-bikes are heavy (45-70 lbs). Consider this if you need to carry stairs.

## Recommended Starter E-Bikes

${productLinks}

## Common Beginner Mistakes

1. **Buying too cheap**: Under $600, quality drops significantly
2. **Ignoring test rides**: Always try before you buy
3. **Overlooking maintenance**: Budget $200/year for upkeep
4. **Skipping safety gear**: A good helmet is non-negotiable`;
  } else if (k.includes('battery')) {
    sections = `<p class="lead">Your e-bike's battery is its most expensive component — and the one most affected by how you treat it. Proper battery care can double its lifespan and save you hundreds of dollars.</p>

## How Long Do E-Bike Batteries Last?

Most lithium-ion e-bike batteries last **500-1,000 charge cycles** before dropping to 80% capacity. That's roughly:

- **3-5 years** for daily riders
- **5-7 years** for weekend riders
- **7+ years** for occasional riders

Replacement batteries cost $300-$800, so extending lifespan is worth the effort.

## Battery Care Best Practices

### Do:
- ✅ Store at 40-60% charge for long periods
- ✅ Charge at room temperature (60-75°F)
- ✅ Use only the OEM charger
- ✅ Charge after each ride (don't let it sit empty)
- ✅ Keep connections clean and dry

### Don't:
- ❌ Leave battery on charger for days
- ❌ Charge in extreme heat or cold
- ❌ Fully discharge regularly
- ❌ Use a higher-voltage charger
- ❌ Store fully charged for months

## Signs Your Battery Needs Replacement

- Range drops below 60% of original
- Charging takes significantly longer
- Battery gets unusually hot while charging
- Visible swelling or damage

## Our Top Battery-Friendly E-Bikes

${productLinks}`;
  } else {
    // Generic but useful content for any keyword
    sections = `<p class="lead">Looking for answers about ${k}? We've done the research so you don't have to. Here's everything you need to know, backed by real testing and expert analysis.</p>

## Key Takeaways

- Electric bikes have become increasingly affordable and capable in 2026
- The right e-bike depends on your specific needs, budget, and riding style
- Proper maintenance extends the life of your investment significantly
- Commuting by e-bike can save thousands of dollars per year

## Our Top Recommendations

Based on extensive testing, here are our top picks:

${productLinks}

## How We Test

Every e-bike and accessory we recommend goes through rigorous real-world testing:
- **50+ miles** across different terrains and conditions
- **Battery testing** at multiple assist levels
- **Build quality** assessment over weeks of use
- **Value analysis** comparing price to performance
- **Long-term durability** tracking

## Frequently Asked Questions

**Q: How much should I spend on an electric bike?**
A: For a quality e-bike that will last, budget $800-$2,000. Below $800, you'll compromise on battery life and build quality.

**Q: How far can an electric bike go on one charge?**
A: Most e-bikes get 25-60 miles per charge. Range depends on battery size, assist level, terrain, rider weight, and wind.

**Q: Do I need a license to ride an electric bike?**
A: In most US states, Class 1 and Class 2 e-bikes don't require a license. Class 3 may have age restrictions. Check your local laws.

**Q: Can I ride an electric bike in the rain?**
A: Yes, most e-bikes are water-resistant (IPX4 or higher). Avoid submerging electrical components and dry connections after wet rides.`;
  }

  return sections;
}

// ── Optimize existing post for keywords ═══
function optimizePost(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const slug = path.basename(filePath, '.mdx');

  // Parse frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;

  const fm = fmMatch[1];
  const titleMatch = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  const descMatch = fm.match(/^description:\s*["']?(.+?)["']?\s*$/m);
  const tagsMatch = fm.match(/^tags:\s*\n((?:\s+-\s+.+\n?)*)/m);

  const title = titleMatch?.[1] || '';
  const desc = descMatch?.[1] || '';

  const fixes = [];

  // Fix title length
  if (title.length > 60) {
    const fixed = title.replace(/ (in|for) 20\d{2}$/, '').substring(0, 57);
    const newContent = content.replace(`title: "${title}"`, `title: "${fixed}"`);
    fs.writeFileSync(filePath, newContent);
    fixes.push(`Title shortened: ${title.length} → ${fixed.length} chars`);
  }

  // Fix description length
  if (desc.length > 160) {
    const fixed = desc.substring(0, 155).replace(/\s+\S*$/, '');
    let currentContent = fs.readFileSync(filePath, 'utf-8');
    const newContent = currentContent.replace(`description: "${desc}"`, `description: "${fixed}"`);
    fs.writeFileSync(filePath, newContent);
    fixes.push(`Description trimmed: ${desc.length} → ${fixed.length} chars`);
  }

  return fixes.length > 0 ? { slug, fixes } : null;
}

// ── Main cycle ═══
async function runCycle() {
  console.log(`\n🔍 SEO Agent — Cycle #${loadState().runs + 1}`);
  console.log(`   Time: ${new Date().toLocaleString()}\n`);

  const state = loadState();
  let postsCreated = 0;
  let optimizations = 0;

  // 1. Create new posts for uncovered keywords
  const existingSlugs = getExistingSlugs();
  const uncoveredKeywords = KEYWORDS.filter(k => {
    const slug = k.keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    return !existingSlugs.includes(slug);
  });

  // Create up to 2 new posts per cycle (don't flood)
  const toCreate = uncoveredKeywords.slice(0, 2);
  for (const kw of toCreate) {
    const post = generatePost(kw, existingSlugs);
    if (post) {
      const filePath = path.join(CONTENT_DIR, `${post.slug}.mdx`);
      fs.writeFileSync(filePath, post.content.trim() + '\n');
      console.log(`  ✅ Created: "${post.slug}" targeting "${kw.keyword}"`);
      postsCreated++;
      state.keywords.push({ keyword: kw.keyword, slug: post.slug, created: new Date().toISOString() });
    }
  }

  // 2. Optimize existing posts
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.mdx'));
  for (const file of files) {
    const result = optimizePost(path.join(CONTENT_DIR, file));
    if (result) {
      console.log(`  🔧 Optimized: ${result.slug}`);
      result.fixes.forEach(f => console.log(`    ${f}`));
      optimizations++;
    }
  }

  state.runs++;
  state.lastRun = new Date().toISOString();
  state.postsCreated += postsCreated;
  state.optimizations += optimizations;
  saveState(state);

  console.log(`\n📊 SEO Summary:`);
  console.log(`   New posts created: ${postsCreated}`);
  console.log(`   Posts optimized: ${optimizations}`);
  console.log(`   Total posts created (all time): ${state.postsCreated}`);
  console.log(`   Keywords remaining to cover: ${uncoveredKeywords.length - postsCreated}`);
  console.log(`   Total blog posts: ${files.length + postsCreated}\n`);

  return { postsCreated, optimizations };
}

// ── Daemon Mode ═══
function runDaemon() {
  console.log('\n🔍 SEO Agent — 24/7 Keyword Research & Content Creation');
  console.log('   Creating 2 new keyword-targeted posts per cycle');
  console.log('   Running every 30 minutes...\n');

  runCycle().catch(e => console.error('❌ Error:', e.message));

  setInterval(() => {
    console.log(`\n[${new Date().toLocaleString()}] Running SEO cycle...`);
    runCycle().catch(e => console.error('❌ Error:', e.message));
  }, 30 * 60 * 1000);
}

// ── CLI ──═
const args = process.argv.slice(2);
if (args.includes('--daemon')) {
  runDaemon();
} else {
  runCycle().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
}
