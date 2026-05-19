#!/bin/bash
# Daily blog post generator for The Electric Bike Superstore
# Runs at 6 AM daily via cron
# Generates 5 blog posts and pushes to GitHub

set -e

SITE_DIR="/home/ubuntu/.openclaw/workspace/Electric-bike-superstore"
BLOG_DIR="$SITE_DIR/src/content/blog"
DATE=$(date +%Y-%m-%d)
LOG_FILE="$SITE_DIR/scripts/blog-gen.log"

echo "===== [$DATE] Daily Blog Generation Started =====" >> "$LOG_FILE"

cd "$SITE_DIR"

# Configure git
git config user.email "techbot@openclaw.ai"
git config user.name "TechBot"

# Generate 5 blog posts using Node.js script
# Requires OPENROUTER_API_KEY in environment or .env.local
if [ -f "$SITE_DIR/.env.local" ]; then
  export $(grep -v '^#' "$SITE_DIR/.env.local" | xargs)
fi

if [ -z "$OPENROUTER_API_KEY" ]; then
  echo "[$DATE] WARNING: OPENROUTER_API_KEY not set. Skipping blog generation." >> "$LOG_FILE"
  echo "[$DATE] Add OPENROUTER_API_KEY to $SITE_DIR/.env.local to enable auto-generation." >> "$LOG_FILE"
  exit 0
fi

# Run the generator
node "$SITE_DIR/scripts/generate-blog-posts.js" >> "$LOG_FILE" 2>&1

# Check if any new posts were created
NEW_POSTS=$(git status --porcelain "$BLOG_DIR" | grep "^??" | wc -l)

if [ "$NEW_POSTS" -gt 0 ]; then
  echo "[$DATE] Generated $NEW_POSTS new blog posts. Building and deploying..." >> "$LOG_FILE"

  # Build the site
  npm run build >> "$LOG_FILE" 2>&1

  # Commit and push
  git add -A
  git commit -m "📝 Auto-generate $NEW_POSTS blog post(s) — $DATE" >> "$LOG_FILE" 2>&1
  git push >> "$LOG_FILE" 2>&1

  echo "[$DATE] ✅ Done. $NEW_POSTS posts published." >> "$LOG_FILE"
else
  echo "[$DATE] No new posts generated." >> "$LOG_FILE"
fi
