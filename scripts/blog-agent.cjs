#!/usr/bin/env node
/**
 * Blogging Agent — Auto-generates e-bike blog post drafts
 *
 * Creates MDX blog post files with proper frontmatter.
 * Integrates with the existing generate-blog-posts.cjs system.
 *
 * Usage: node scripts/blog-agent.cjs [--count 5] [--category Reviews]
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');

// ── Content Templates ═══

const TEMPLATES = {
  review: {
    category: 'Reviews',
    template: (title, slug, image) => `---
title: "${title}"
description: "Read our in-depth review of ${title.toLowerCase()}. See specs, pros & cons, real-world performance, and find out if this e-bike is right for you."
date: "${new Date().toISOString().split('T')[0]}"
author: "The Electric Bike Superstore"
category: "Reviews"
tags: ["ebike", "review", "electric bike"]
image: "${image}"
slug: "${slug}"
---

<p class="lead">Looking for a new electric bike? In this review, we take a detailed look at ${title.toLowerCase()}, covering everything from motor performance and battery life to real-world ride quality.</p>

## Overview

Before we dive into the details, let's look at what this e-bike brings to the table.

## Motor & Performance

Every great e-bike starts with a powerful and reliable motor. Here's what you can expect from this model in terms of raw performance.

## Battery & Range

Range anxiety is real — especially for commuters. We tested this e-bike's battery in real-world conditions to give you honest numbers.

## Build Quality

From the frame material to the welds, the finish, and the components — build quality matters for long-term durability.

## Ride Quality

How does it actually feel to ride? We covered hundreds of miles to find out.

## Pros & Cons

**What we liked:**
- Powerful motor with smooth acceleration
- Comfortable riding position
- Solid build quality
- Good range on a single charge

**What could be better:**
- Heavier than non-electric bikes
- Price point may be high for some budgets

## Who Is This E-Bike For?

This bike is ideal for riders who want a reliable, powerful electric bike for daily commuting or weekend adventures.

## Verdict

After extensive testing, we can confidently say this e-bike is worth considering. It delivers solid performance, good range, and reliable build quality at a competitive price.

<div style="text-align:center; margin: 40px 0;">
  <a href="https://tidd.ly/4v411cG" class="btn btn-primary" style="font-size:1.15rem;padding:16px 48px;display:inline-block;text-decoration:none;border-radius:8px;" target="_blank" rel="noopener noreferrer">Buy Now →</a>
</div>

*As an affiliate, we may earn a small commission on qualifying purchases. This does not affect our reviews — we test and recommend products independently.*
`,
  },

  buyingGuide: {
    category: 'Buying Guide',
    template: (title, slug, image) => `---
title: "${title}"
description: "Not sure which e-bike to buy? Our comprehensive buying guide breaks down everything you need to know — motor types, battery range, classes, and top picks."
date: "${new Date().toISOString().split('T')[0]}"
author: "The Electric Bike Superstore"
category: "Buying Guide"
tags: ["ebike", "buying guide", "how to choose"]
image: "${image}"
slug: "${slug}"
---

<p class="lead">Buying an electric bike is a significant investment. With dozens of motor types, battery configurations, and frame styles to choose from, it can be overwhelming. This guide cuts through the noise and helps you make the right choice.</p>

## Step 1: Determine Your Riding Style

The right e-bike depends entirely on how you plan to use it. Commuters need different features than off-road riders.

## Step 2: Know the E-Bike Classes

In the US, electric bikes fall into three legal classes:

| Class | Type | Max Speed |
|-------|------|-----------|
| Class 1 | Pedal-assist only | 20 mph |
| Class 2 | Throttle + pedal-assist | 20 mph |
| Class 3 | Pedal-assist only | 28 mph |

## Step 3: Hub Motor vs. Mid-Drive

**Hub motors** are more affordable and require less maintenance. They're great for flat commutes and casual riders.

**Mid-drive motors** offer superior torque, better hill climbing, and a more natural ride feel. Choose mid-drive if you ride hills or want the best performance.

## Step 4: Battery & Range

Focus on watt-hours (Wh) for an accurate range estimate:

- **300-400 Wh**: 15-30 miles
- **400-600 Wh**: 25-50 miles
- **600+ Wh**: 40-80+ miles

## Our Top Picks

After testing dozens of e-bikes, here are our top recommendations:

<div style="text-align:center; margin: 40px 0;">
  <a href="https://tidd.ly/3Q0WicI" class="btn btn-primary" style="font-size:1.15rem;padding:16px 48px;display:inline-block;text-decoration:none;border-radius:8px;" target="_blank" rel="noopener noreferrer">Browse Top Picks →</a>
</div>

*Have questions? [Contact our team](/contact) for personalized recommendations.*
`,
  },

  maintenance: {
    category: 'Maintenance',
    template: (title, slug, image) => `---
title: "${title}"
description: "Keep your electric bike running like new with our expert maintenance guide. Learn essential tips for battery care, chain maintenance, brakes, and more."
date: "${new Date().toISOString().split('T')[0]}"
author: "The Electric Bike Superstore"
category: "Maintenance"
tags: ["ebike", "maintenance", "bike care", "DIY"]
image: "${image}"
slug: "${slug}"
---

<p class="lead">Your electric bike is an investment worth protecting. With proper maintenance, a quality e-bike can last 5-10 years and tens of thousands of miles. Here's everything you need to know to keep your ride in top shape.</p>

## Before Every Ride (2 Minutes)

- Check tire pressure with a gauge (not just a thumb squeeze)
- Test both brakes firmly
- Quick visual scan for loose bolts or damage
- Confirm battery is locked in place and charged

## Weekly Maintenance (15 Minutes)

- Clean and lubricate the chain
- Wipe down the frame with a damp cloth
- Check brake pad thickness
- Inspect tires for cuts, embedded glass, or wear

## Monthly Maintenance (30 Minutes)

- Inspect brake pads, rotors, and brake cable tension
- Check all bolts with a torque wrench
- Inspect tire sidewalls for cracks
- Clean the drivetrain thoroughly

## Battery Care Tips

- Store at 40-60% charge for long-term storage
- Avoid extreme temperatures (below 32°F or above 113°F)
- Use only the OEM charger
- Charge after riding, not before
- Don't leave the battery on the charger for days

## When to Visit a Shop

While basic maintenance is DIY-friendly, visit a professional for:
- Brake bleeding
- Wheel truing
- Motor or controller issues
- Electrical diagnostics

<div style="text-align:center; margin: 40px 0;">
  <a href="https://tidd.ly/4vQPRYO" class="btn btn-primary" style="font-size:1.15rem;padding:16px 48px;display:inline-block;text-decoration:none;border-radius:8px;" target="_blank" rel="noopener noreferrer">Shop E-Bike Accessories →</a>
</div>
`,
  },
};

// ── Topic Seeds ═══

const TOPIC_SEEDS = {
  review: [
    { title: 'Aventon Level.3 Commuter E-Bike Review', slug: 'aventon-level3-review', image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80' },
    { title: 'Rad Power RadCity 5 Plus Review', slug: 'rad-power-radcity-5-plus-review', image: 'https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=800&q=80' },
    { title: 'Trek Allant+ 8S Review', slug: 'trek-allant-plus-8s-review', image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&q=80' },
    { title: 'Specialized Turbo Vado 5.0 Review', slug: 'specialized-turbo-vado-5-review', image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80' },
    { title: 'Juiced CrossCurrent X Review', slug: 'juiced-crosscurrent-x-review', image: 'https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=800&q=80' },
  ],
  buyingGuide: [
    { title: 'Best Electric Bikes Under $1,500 in 2027', slug: 'best-ebikes-under-1500', image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80' },
    { title: 'Best Folding E-Bikes for Apartment Living', slug: 'best-folding-ebikes-apartments', image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&q=80' },
    { title: 'Best E-Bikes for Heavy Riders (300+ lbs)', slug: 'best-ebikes-heavy-riders', image: 'https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=800&q=80' },
    { title: 'Electric Bike vs Which Scooter: Which Should You Buy?', slug: 'ebike-vs-scooter', image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80' },
    { title: 'Best Cargo E-Bikes for Families', slug: 'best-cargo-ebikes-families', image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&q=80' },
  ],
  maintenance: [
    { title: 'Winter E-Bike Storage Guide', slug: 'winter-ebike-storage', image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80' },
    { title: 'How to Extend Your E-Bike Battery Life', slug: 'extend-ebike-battery-life', image: 'https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=800&q=80' },
    { title: 'E-Bike Tire Guide: Puncture Prevention', slug: 'ebike-tire-guide', image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&q=80' },
    { title: 'DIY E-Bike Motor Maintenance', slug: 'diy-ebike-motor-maintenance', image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80' },
    { title: 'When to Replace Your E-Bike Chain', slug: 'replace-ebike-chain', image: 'https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=800&q=80' },
  ],
};

// ── Main ═══

async function main() {
  const args = process.argv.slice(2);
  const countArg = args.indexOf('--count');
  const categoryArg = args.indexOf('--category');
  const count = countArg >= 0 ? parseInt(args[countArg + 1]) || 3 : 3;
  const category = categoryArg >= 0 ? args[categoryArg + 1] || 'review' : 'review';

  console.log(`\n✍️  Blogging Agent — Generating ${count} ${category} post drafts...\n`);

  const templateKey = category === 'guide' ? 'buyingGuide' : category === 'maintenance' ? 'maintenance' : 'review';
  const template = TEMPLATES[templateKey];
  const topics = TOPIC_SEEDS[templateKey];

  // Ensure content directory exists
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }

  let created = 0;
  for (let i = 0; i < Math.min(count, topics.length); i++) {
    const topic = topics[i];
    const filePath = path.join(CONTENT_DIR, `${topic.slug}.mdx`);

    if (fs.existsSync(filePath)) {
      console.log(`  ⏭️  ${topic.slug}.mdx already exists — skipping`);
      continue;
    }

    const content = template.template(topic.title, topic.slug, topic.image);
    fs.writeFileSync(filePath, content.trim() + '\n');
    console.log(`  ✅ Created: ${topic.slug}.mdx`);
    created++;
  }

  console.log(`\n📊 Summary: ${created} new draft(s) created in src/content/blog/`);
  console.log('   Edit the drafts, then run `npm run build` to publish.\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
