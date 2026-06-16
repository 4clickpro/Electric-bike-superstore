#!/bin/bash
# SEO Agent Keep-Alive Script
AGENT_PID=$(pgrep -f "seo-agent.cjs --daemon")
if [ -z "$AGENT_PID" ]; then
    echo "[$(date)] SEO agent not running. Starting..."
    cd /home/ubuntu/Electric-bike-superstore
    nohup node scripts/seo-agent.cjs --daemon >> seo-agent.log 2>&1 &
    echo "[$(date)] Started with PID: $!"
else
    echo "[$(date)] SEO agent running (PID: $AGENT_PID)"
fi
