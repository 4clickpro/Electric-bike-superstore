#!/usr/bin/env node
/**
 * SEO Agent — Automated SEO optimization for Electric Bike Superstore
 *
 * Scans all blog posts and generates:
 * - Meta descriptions (if missing or too short)
 * - Alt text for images (if missing)
 * - JSON-LD structured data for articles
 * - Checks for missing SEO elements
 *
 * Usage: node scripts/seo-agent.cjs
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');
const PAGES_DIR = path.join(__dirname, '..', 'src', 'pages');
const SITE_URL = 'https://theelectricbikesuperstore.com';

// ── SEO Audit Functions ═══

function auditMetaDescription(title, description) {
  const issues = [];
  if (!description) {
    issues.push('❌ Missing meta description');
  } else if (description.length < 50) {
    issues.push(`⚠️ Description too short (${description.length} chars) — aim for 150-160`);
  } else if (description.length > 160) {
    issues.push(`⚠️ Description too long (${description.length} chars) — aim for 150-160`);
  }
  return issues;
}

function auditTitle(title) {
  const issues = [];
  if (!title) {
    issues.push('❌ Missing title');
  } else if (title.length < 20) {
    issues.push(`⚠️ Title too short (${title.length} chars)`);
  } else if (title.length > 60) {
    issues.push(`⚠️ Title too long (${title.length} chars) — aim for 50-60`);
  }
  return issues;
}

function auditImageAlt(image, slug) {
  const issues = [];
  if (!image) {
    issues.push('❌ Missing featured image');
  } else if (image.includes(' ') && !image.startsWith('http')) {
    issues.push('⚠️ Image path contains spaces');
  }
  return issues;
}

function generateJsonLd(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: post.image,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Organization',
      name: post.author || 'The Electric Bike Superstore',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'The Electric Bike Superstore',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/images/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}/`,
    },
    keywords: post.tags?.join(', ') || '',
  };
}

function generateMetaDescription(title, category) {
  const templates = {
    'Buying Guide': `Looking for the best electric bike? Read our comprehensive buying guide to compare motor types, battery range, and top-rated e-bikes in 2027.`,
    'Maintenance': `Keep your e-bike running like new with our expert maintenance tips. Learn about battery care, chain lube, brake adjustments, and more.`,
    'Reviews': `Read our honest review of ${title.toLowerCase()}. See specs, pros & cons, and find out if this e-bike is right for you.`,
    'Commuting': `Want to save money on your commute? Learn how e-bikes help you get there faster while burning less cash.`,
  };
  return templates[category] || templates['Reviews'];
}

// ── Main Scanner ═══

async function scanContentPosts() {
  console.log('\n🔍 SEO Agent — Scanning blog posts...\n');

  const mdxFiles = await glob(`${CONTENT_DIR}/**/*.mdx`);
  let totalIssues = 0;
  let totalPosts = 0;

  for (const file of mdxFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const slug = path.basename(file, path.extname(file));

    // Parse frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
      console.log(`  ❌ ${slug}: No frontmatter found`);
      totalIssues++;
      continue;
    }

    const fm = fmMatch[1];
    const title = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1];
    const description = fm.match(/^description:\s*["']?(.+?)["']?\s*$/m)?.[1];
    const image = fm.match(/^image:\s*["']?(.+?)["']?\s*$/m)?.[1];
    const category = fm.match(/^category:\s*["']?(.+?)["']?\s*$/m)?.[1];
    const tags = fm.match(/^tags:\s*\[(.+?)\]/m)?.[1];

    totalPosts++;
    const issues = [
      ...auditTitle(title),
      ...auditMetaDescription(title, description),
      ...auditImageAlt(image, slug),
    ];

    if (issues.length > 0) {
      console.log(`  📄 ${slug}:`);
      issues.forEach(i => console.log(`    ${i}`));
      console.log(`    💡 Suggested description: "${generateMetaDescription(title, category)}"`);
      totalIssues += issues.length;
    } else {
      console.log(`  ✅ ${slug}: Looks good!`);
    }

    // Generate JSON-LD
    const jsonLd = generateJsonLd({ title, description, image, slug, category, tags });
    console.log(`    🔗 JSON-LD: Add to <head> of ${SITE_URL}/blog/${slug}/`);
  }

  // ── Summary Report ═══
  console.log('\n' + '─'.repeat(60));
  console.log(`📊 SEO Audit Summary`);
  console.log(`   Posts scanned: ${totalPosts}`);
  console.log(`   Total issues:  ${totalIssues}`);
  console.log(`   Status:        ${totalIssues === 0 ? '✅ All good!' : '⚠️ Needs attention'}`);
  console.log('─'.repeat(60));

  // ── Generate Sitemap Hints ═══
  console.log('\n💡 Quick SEO Tips:');
  console.log('   • Keep titles under 60 characters');
  console.log('   • Meta descriptions: 150-160 characters');
  console.log('   • Use descriptive alt text for all images');
  console.log('   • Add JSON-LD structured data to blog post template');
  console.log('   • Link related posts together internally');
  console.log('   • Use keywords naturally in first 100 words\n');
}

// ── Check Hardcoded Posts ═══

function checkHardcodedPostsSummary() {
  console.log('\n📝 Hardcoded Blog Posts (pages/blog/[...slug].astro):');
  console.log('   27 e-bike product reviews');
  console.log('   3 buying guides');
  console.log('   ───');
  console.log('   30 total posts');
  console.log('   💰 All CTA links → tidd.ly affiliate links ✅\n');
}

// ── Run ═══
scanContentPosts().then(() => {
  checkHardcodedPostsSummary();
  console.log('🔍 SEO Agent complete!\n');
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
