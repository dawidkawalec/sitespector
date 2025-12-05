#!/bin/bash
#
# Lighthouse audit wrapper script
#
# Usage: ./audit.sh <url> <device> <output_dir>
#

set -e

URL=$1
DEVICE=${2:-desktop}
OUTPUT_DIR=${3:-/tmp/lighthouse}

if [ -z "$URL" ]; then
    echo "Usage: $0 <url> [device] [output_dir]"
    echo "  device: desktop or mobile (default: desktop)"
    exit 1
fi

echo "💡 Running Lighthouse audit"
echo "🌐 URL: $URL"
echo "📱 Device: $DEVICE"
echo "📁 Output: $OUTPUT_DIR"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Set device emulation
if [ "$DEVICE" = "mobile" ]; then
    PRESET="--preset=perf --emulated-form-factor=mobile"
else
    PRESET="--preset=perf --emulated-form-factor=desktop"
fi

# Run Lighthouse
FILENAME="lighthouse_${DEVICE}_$(date +%s).json"

lighthouse "$URL" \
    $PRESET \
    --output=json \
    --output-path="$OUTPUT_DIR/$FILENAME" \
    --chrome-flags="--headless --no-sandbox --disable-gpu" \
    --quiet

echo "✅ Audit complete: $OUTPUT_DIR/$FILENAME"

# Extract and display key metrics
cat "$OUTPUT_DIR/$FILENAME" | jq -r '
  "Performance: \(.categories.performance.score * 100)",
  "Accessibility: \(.categories.accessibility.score * 100)",
  "Best Practices: \(.categories["best-practices"].score * 100)",
  "SEO: \(.categories.seo.score * 100)",
  "LCP: \(.audits["largest-contentful-paint"].numericValue)ms",
  "CLS: \(.audits["cumulative-layout-shift"].numericValue)",
  "FCP: \(.audits["first-contentful-paint"].numericValue)ms"
'

