#!/bin/bash
# Video Agent Keep-Alive Script
AGENT_PID=$(pgrep -f "video-agent.cjs --daemon")
if [ -z "$AGENT_PID" ]; then
    echo "[$(date)] Video agent not running. Starting..."
    cd /home/ubuntu/Electric-bike-superstore
    nohup node scripts/video-agent.cjs --daemon >> video-agent.log 2>&1 &
    echo "[$(date)] Started with PID: $!"
else
    echo "[$(date)] Video agent running (PID: $AGENT_PID)"
fi
