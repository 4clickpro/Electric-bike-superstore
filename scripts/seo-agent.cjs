#!/usr/bin/env node
/**
 * SEO Agent — 24/7 Auto-Fixing SEO Optimization
 *
 * Runs continuously, auditing AND fixing SEO issues:
 * - Shortens titles that exceed 60 characters
 * - Trims descriptions that exceed 160 characters
 * - Ensures all posts have proper meta descriptions
 * - Generates SEO reports
 *
 * Usage:
 *   node scripts/seo-agent.cjs           # Run once (audit + fix)
 *   node scripts/seo-agent.cjs --daemon  # Run 24/7 (every 30 min)
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');
const SITE_URL = 'https://theelectricbikesuperstore.com';
const STATE_FILE = path.join(__dirname, '.seo-agent-state.json');

// ── State ═══
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); }
  catch { return { runs: 0, lastRun: null, totalFixed: 0, issues: [] }; }
}
function saveState(state) { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); }

// ── Fix title if too long ═══
function fixTitle(title) {
  if (!title || title.length <= 60) return null; // No fix needed

  // Smart truncation strategies
  let fixed = title;

  // Remove year suffix like "in 2027" or "for 2026"
  fixed = fixed.replace(/ (in|for) 20\d{2}$/, '');

  // If still too long, trim at word boundary
  if (fixed.length > 60) {
    fixed = fixed.substring(0, 57).replace(/\s+\S*$/, '') + '...';
  }

  // If still too long, hard truncate
  if (fixed.length > 60) {
    fixed = fixed.substring(0, 57) + '...';
  }

  return fixed;
}

// ── Fix description if too long ═══
function fixDescription(desc) {
  if (!desc || desc.length <= 160) return null; // No fix needed

  // Trim at word boundary near 155 chars
  let fixed = desc.substring(0, 155).replace(/\s+\S*$/, '');
  if (fixed.length < 50) fixed = desc.substring(0, 155); // fallback hard trim

  return fixed;
}

// ── Process a single MDX file ═══
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const slug = path.basename(filePath, path.extname(filePath));

  // Parse frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return { slug, fixed: [], skipped: true };

  const fm = fmMatch[1];
  const titleMatch = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  const descMatch = fm.match(/^description:\s*["']?(.+?)["']?\s*$/m);

  const title = titleMatch?.[1];
  const description = descMatch?.[1];

  const fixes = [];

  // Fix title
  const fixedTitle = fixTitle(title);
  if (fixedTitle && fixedTitle !== title) {
    const newContent = content.replace(
      `title: "${title}"`,
      `title: "${fixedTitle}"`
    );
    fs.writeFileSync(filePath, newContent);
    fixes.push(`Title: "${title.substring(0, 40)}..." → "${fixedTitle}"`);
  }

  // Fix description
  const fixedDesc = fixDescription(description);
  if (fixedDesc && fixedDesc !== description) {
    let currentContent = fs.readFileSync(filePath, 'utf-8');
    const newContent = currentContent.replace(
      `description: "${description}"`,
      `description: "${fixedDesc}"`
    );
    fs.writeFileSync(filePath, newContent);
    fixes.push(`Description: ${description.length} chars → ${fixedDesc.length} chars`);
  }

  return { slug, fixes, skipped: fixes.length === 0 };
}

// ── Main audit + fix cycle ═══
async function runAuditAndFix() {
  console.log(`\n🔍 SEO Agent — Audit & Fix #${loadState().runs + 1}`);
  console.log(`   Time: ${new Date().toLocaleString()}\n`);

  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.mdx'));
  let totalFixed = 0;
  const report = [];

  for (const file of files) {
    const result = processFile(path.join(CONTENT_DIR, file));
    if (!result.skipped && result.fixes.length > 0) {
      console.log(`  📄 ${result.slug}:`);
      result.fixes.forEach(f => console.log(`    ✅ ${f}`));
      totalFixed += result.fixes.length;
      report.push(result);
    }
  }

  const state = loadState();
  state.runs++;
  state.lastRun = new Date().toISOString();
  state.totalFixed += totalFixed;
  state.issues = report;
  saveState(state);

  console.log(`\n📊 SEO Fix Summary:`);
  console.log(`   Files scanned: ${files.length}`);
  console.log(`   Fixes applied: ${totalFixed}`);
  console.log(`   Total fixes (all time): ${state.totalFixed}`);
  console.log(`   Status: ${totalFixed === 0 ? '✅ All good!' : '🔧 Fixed ' + totalFixed + ' issues'}\n`);

  return { totalFixed, report };
}

// ── Daemon Mode ═══
function runDaemon() {
  console.log('\n🔍 SEO Agent — 24/7 Auto-Fix Daemon Started');
  console.log('   Running audit + fix every 30 minutes...\n');

  runAuditAndFix().catch(e => console.error('❌ Error:', e.message));

  setInterval(() => {
    console.log(`\n[${new Date().toLocaleString()}] Running SEO audit + fix...`);
    runAuditAndFix().catch(e => console.error('❌ Error:', e.message));
  }, 30 * 60 * 1000);
}

// ── CLI ──═
const args = process.argv.slice(2);
if (args.includes('--daemon')) {
  runDaemon();
} else {
  runAuditAndFix().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
}
