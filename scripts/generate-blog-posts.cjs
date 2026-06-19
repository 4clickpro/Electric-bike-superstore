#!/usr/bin/env node
/**
 * Blog Post Generator for The Electric Bike Superstore
 * Generates 5 SEO-optimized blog posts per day using OpenRouter API.
 *
 * Usage: node scripts/generate-blog-posts.js
 * Requires: OPENROUTER_API_KEY environment variable or .env.local file
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load .env.local if it exists
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  });
}

const API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = 'https://theelectricbikesuperstore.com';
const BLOG_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');

// Ensure blog directory exists
if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

// E-bike blog post topics — varied and SEO-targeted
const TOPIC_SEEDS = [
  { category: 'Buying Guide', topics: [
    'How to Choose the Best Electric Bike for Your Commute in 2027',
    'Electric Bike Classes Explained: Class 1 vs Class 2 vs Class 3 — Which Is Right for You?',
    'The Complete Electric Bike Battery Guide: Range, Charging, and Longevity',
    'Fat Tire vs Thin Tire E-Bikes: Which Is Better for Your Riding Style?',
    'Electric Bike Motor Types: Hub Drive vs Mid-Drive — Pros, Cons, and Best Use Cases',
    'How Much Should You Spend on an E-Bike? A Budget Breakdown for Every Rider',
    'Best Electric Bikes for Seniors: Comfort, Safety, and Ease of Use',
    'Electric Bike Weight Limits: What You Need to Know Before Buying',
    'Foldable Electric Bikes: Are They Worth It? A Complete Analysis',
    'Electric Bike Range Anxiety: How to Maximize Your Battery Life',
  ]},
  { category: 'Maintenance', topics: [
    'E-Bike Chain Maintenance: How to Keep Your Drivetrain Running Smoothly',
    'Electric Bike Tire Pressure Guide: Optimal PSI for Every Terrain',
    'How to Winterize Your Electric Bike: Cold Weather Storage and Care',
    'E-Bike Brake Adjustment: When to Replace Pads and How to Do It',
    'Electric Battery Care: 10 Tips to Extend Your E-Bike Battery Life',
    'How to Clean Your Electric Bike Without Damaging Electronics',
    'E-Bike Software Updates: Why They Matter and How to Do Them',
    'When to Replace Your E-Bike Battery: Signs and Cost Analysis',
    'Electric Bike Spoke Tension: How to True Your Wheels',
    'E-Bike Suspension Setup: Dial In Your Ride for Maximum Comfort',
  ]},
  { category: 'Commuting', topics: [
    'E-Bike Commuting in the Rain: Gear, Tips, and Safety',
    'How to Combine E-Bike and Public Transit for the Ultimate Commute',
    'Best E-Bike Accessories for Daily Commuters in 2027',
    'E-Bike Commuter Safety: Lights, Helmets, and Visibility Gear',
    'How to Lock Your Electric Bike: Best Locks and Theft Prevention',
    'E-Bike Commuting with Kids: Child Seats, Trailers, and Safety',
    'Building an E-Bike Commuter Kit: Everything You Need for Year-Round Riding',
    'E-Bike Commute Workout: How Much Exercise Are You Actually Getting?',
    'Navigating Traffic on an E-Bike: Rules, Rights, and Best Practices',
    'E-Bike Commuting in Hot Weather: Staying Cool and Hydrated',
  ]},
  { category: 'Reviews', topics: [
    'Top 10 Electric Bikes Under $1,500 in 2027',
    'Best Electric Mountain Bikes of 2027: Trail-Tested Reviews',
    'Best Electric Cargo Bikes for Families: 2027 Buyer\'s Guide',
    'Electric Bike Speed Comparison: Which E-Bikes Are the Fastest?',
    'Best Folding Electric Bikes for Apartment Dwellers',
    'Electric Cruiser Bikes: The Most Comfortable E-Bikes You Can Buy',
    'Best Electric Bikes for Heavy Riders: High Weight Capacity Picks',
    'Electric Bike Conversion Kits: Turn Any Bike Electric in 2027',
    'Best Electric Bikes for Off-Road Adventures',
    'Electric Scooter vs E-Bike: Which Is Better for Getting Around?',
  ]},
  { category: 'Lifestyle', topics: [
    'E-Bike Touring: How to Plan Your First Electric Bike Road Trip',
    'The Environmental Impact of E-Bikes: By the Numbers',
    'E-Bike Group Riding: How to Organize and Enjoy Community Rides',
    'Electric Bikes and Mental Health: Why Riding Makes You Happier',
    'E-Bike Camping: The Ultimate Guide to Bikepacking with an Electric Bike',
    'How E-Bikes Are Changing Cities Around the World',
    'E-Bike Racing: A Beginner\'s Guide to Electric Bike Competitions',
    'The History of Electric Bikes: From 1895 to 2027',
    'E-Bike Photography: How to Document Your Rides Like a Pro',
    'Starting an E-Bike Delivery Side Hustle: What You Need to Know',
  ]},
];

function pickTopics(count = 5) {
  const allTopics = [];
  TOPIC_SEEDS.forEach(cat => {
    cat.topics.forEach(t => allTopics.push({ topic: t, category: cat.category }));
  });

  // Shuffle and pick
  const shuffled = allTopics.sort(() => Math.random() - 0.5);
  const today = new Date();
  const existingSlugs = fs.readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.mdx'))
    .map(f => f.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace('.mdx', ''));

  const picked = [];
  for (const item of shuffled) {
    if (picked.length >= count) break;
    const slug = item.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!existingSlugs.includes(slug)) {
      picked.push({ ...item, slug });
    }
  }
  return picked;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function callOpenRouter(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'openrouter/auto',
      messages: [
        {
          role: 'system',
          content: `You are an expert e-bike content writer for The Electric Bike Superstore blog. Write engaging, informative, SEO-optimized blog posts about electric bikes. Use a conversational but authoritative tone. Include practical tips, data, and actionable advice. Use markdown formatting with headings (##), bullet points, and short paragraphs.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.choices && json.choices[0]) {
            resolve(json.choices[0].message.content);
          } else if (json.error) {
            reject(new Error(`API error: ${JSON.stringify(json.error)}`));
          } else {
            reject(new Error(`Unexpected response: ${body.substring(0, 200)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function generatePost(topic, category, slug) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const filename = `${dateStr}-${slug}.mdx}`;
  const filepath = path.join(BLOG_DIR, filename);

  // Skip if already exists
  if (fs.existsSync(filepath)) {
    console.log(`Skipping (exists): ${filename}`);
    return null;
  }

  const prompt = `Write a comprehensive, SEO-optimized blog post titled "${topic}" for The Electric Bike Superstore blog (theelectricbikesuperstore.com).

Requirements:
- 1000-1500 words
- Category: ${category}
- Include an engaging introduction that hooks the reader
- Use ## headings for major sections
- Include bullet points and numbered lists where appropriate
- Write in a conversational, authoritative tone
- Include practical tips and actionable advice
- End with a compelling call-to-action section titled "🏪 Shop By Store" that includes links to three affiliate partners: Burchda Bikes (https://www.awin1.com/cread.php?awinmid=123118&awinaffid=2915733), King Bull Bike (https://www.awin1.com/cread.php?awinmid=124136&awinaffid=2915733), and Vivi Bikes (https://www.awin1.com/cread.php?awinmid=98557&awinaffid=2915733)
- Do NOT include frontmatter — just the article body in markdown
- Include 2-3 internal links to other blog posts where natural
- Add a "Key Takeaways" section at the end with 3-5 bullet points

Write the full article now:`;

  console.log(`Generating: ${topic}...`);
  const content = await callOpenRouter(prompt);

  // Build frontmatter
  const description = content.split('\n').find(l => l.length > 50 && !l.startsWith('#'))?.substring(0, 160) || `Expert guide: ${topic}. Read our comprehensive coverage at The Electric Bike Superstore.`;
  const tags = [category.toLowerCase().replace(/\s+/g, '-'), 'electric-bike', 'ebike', 'guide'];

  const frontmatter = `---
title: "${topic}"
description: "${description.replace(/"/g, '\\"')}"
date: "${dateStr}"
author: "The Electric Bike Superstore"
category: "${category}"
tags: ${JSON.stringify(tags)}
image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&q=80"
slug: "${slug}"
---

${content}
`;

  fs.writeFileSync(filepath, frontmatter);
  console.log(`Created: ${filename}`);
  return filename;
}

async function main() {
  if (!API_KEY) {
    console.error('ERROR: OPENROUTER_API_KEY not set.');
    console.error('Set it via environment variable or add to .env.local file:');
    console.error('  OPENROUTER_API_KEY=sk-or-v1-...');
    process.exit(1);
  }

  console.log(`\n🚴 Electric Bike Superstore — Blog Post Generator`);
  console.log(`📅 ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
  console.log(`📝 Generating 5 blog posts...\n`);

  const topics = pickTopics(5);
  const results = [];

  for (const t of topics) {
    try {
      const result = await generatePost(t.topic, t.category, t.slug);
      if (result) results.push(result);
      // Small delay between requests
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`Failed to generate "${t.topic}": ${err.message}`);
    }
  }

  console.log(`\n✅ Generated ${results.length} blog posts:`);
  results.forEach(r => console.log(`  - ${r}`));

  // Update the blog [...slug].astro to include new posts
  console.log('\n📋 New posts are in src/content/blog/ — they will be picked up by the blog pages.');
  console.log('   Run `npm run build` and push to deploy.\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
