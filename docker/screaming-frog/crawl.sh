#!/bin/bash
set -e

# Start Xvfb (Virtual Framebuffer) to allow GUI app to run headless
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
export DISPLAY=:99

# Screaming Frog CLI command structure
# screamingfrogseospider --crawl <url> --headless --save-crawl --output-folder /tmp/crawls --export-tabs "Internal:All,Response Codes:All"

URL=$1

if [ -z "$URL" ]; then
    echo "Usage: crawl.sh <url>"
    exit 1
fi

echo "Starting Screaming Frog crawl for $URL..."

# Check if license is provided (mounted volume or env var)
# Free version limit: 500 URLs

screamingfrogseospider --crawl "$URL" --headless --save-crawl --output-folder /tmp/crawls --export-tabs "Internal:All" --export-format "json" > /dev/null

# The output will be in /tmp/crawls/internal_all.json (or similar based on export tabs)
# We need to find the latest export
LATEST_EXPORT=$(ls -t /tmp/crawls/*.json | head -n 1)

if [ -f "$LATEST_EXPORT" ]; then
    cat "$LATEST_EXPORT"
else
    echo '{"error": "No crawl data generated"}'
fi
