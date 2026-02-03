#!/bin/bash
set -e

# Start Xvfb
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
export DISPLAY=:99

# Setup License if env vars provided
# Env vars are passed from docker-compose
if [ ! -z "$SCREAMING_FROG_USER" ] && [ ! -z "$SCREAMING_FROG_KEY" ]; then
    echo "Setting up Screaming Frog license for user: $SCREAMING_FROG_USER"
    mkdir -p /root/.ScreamingFrogSEOSpider
    echo "$SCREAMING_FROG_USER" > /root/.ScreamingFrogSEOSpider/licence.txt
    echo "$SCREAMING_FROG_KEY" >> /root/.ScreamingFrogSEOSpider/licence.txt
    
    # Accept EULA - SF expects version number (15 for current version)
    # NOTE: eula.accepted must be a NUMBER, not "true" (causes NumberFormatException)
    cat > /root/.ScreamingFrogSEOSpider/spider.config <<EOF
eula.accepted=15
updates.check=false
updates.automatically.install=false
EOF
fi

URL=$1

if [ -z "$URL" ]; then
    echo "Usage: crawl.sh <url>"
    exit 1
fi

echo "Starting Screaming Frog crawl for $URL..."

# Run crawl
# Using CSV format as JSON is not supported in CLI for this version
# NOTE: --crawl-depth does NOT exist in SF CLI - removed to prevent FATAL error
screamingfrogseospider --crawl "$URL" --headless --output-folder /tmp/crawls --export-tabs "Internal:All" --export-format "csv" --overwrite > /dev/null

# Find output
LATEST_EXPORT=$(ls -t /tmp/crawls/internal_all.csv 2>/dev/null | head -n 1)

if [ -f "$LATEST_EXPORT" ]; then
    # Output ONLY the CSV content to stdout for the worker to capture
    cat "$LATEST_EXPORT"
else
    echo "Error: No CSV generated"
fi
