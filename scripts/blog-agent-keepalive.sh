#!/bin/bash
# Blog Agent Keep-Alive Script
# Ensures the blogging agent daemon is always running
# Run via cron every 5 minutes

AGENT_PID=$(pgrep -f "blog-agent.cjs --daemon")

if [ -z "$AGENT_PID" ]; then
    echo "[$(date)] Blog agent not running. Starting..."
    cd /home/ubuntu/Electric-bike-superstore
    nohup node scripts/blog-agent.cjs --daemon >> blog-agent.log 2>&1 &
    echo "[$(date)] Started with PID: $!"
else
    echo "[$(date)] Blog agent running (PID: $AGENT_PID)"
fi
