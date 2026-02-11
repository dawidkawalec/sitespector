#!/bin/bash
set -e

# Start Xvfb
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
export DISPLAY=:99

# Setup License if env vars provided
# Env vars are passed from docker-compose
if [ ! -z "$SCREAMING_FROG_USER" ] && [ ! -z "$SCREAMING_FROG_KEY" ]; then
    # Redirect to stderr to not pollute CSV output
    echo "Setting up Screaming Frog license for user: $SCREAMING_FROG_USER" >&2
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
    echo "Usage: crawl.sh <url>" >&2
    exit 1
fi

# Redirect status to stderr so only CSV goes to stdout
echo "Starting Screaming Frog crawl for $URL..." >&2

# Run crawl
# Using CSV format as JSON is not supported in CLI for this version
# NOTE: --crawl-depth does NOT exist in SF CLI - removed to prevent FATAL error
screamingfrogseospider --crawl "$URL" --headless --output-folder /tmp/crawls --export-tabs "Internal:All,Response Codes:All,Page Titles:All,Meta Description:All,H1:All,H2:All,Images:All,Canonicals:All,Directives:All,Hreflang:All" --export-format "csv" --overwrite > /dev/null

# Find output
# Output all CSVs as JSON object with tab names as keys
python3 /usr/local/bin/merge_csvs.py /tmp/crawls/

