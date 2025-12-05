FROM openjdk:11-jre-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Download and install Screaming Frog SEO Spider CLI
# Note: This requires a valid license for production use
# For development, you can use the free version with limitations

WORKDIR /opt

# Create directory for crawl outputs
RUN mkdir -p /tmp/crawls

# Placeholder for Screaming Frog installation
# TODO: Add actual Screaming Frog CLI installation
# The actual implementation will require:
# 1. Download Screaming Frog CLI from official source
# 2. Configure license (if using paid version)
# 3. Create wrapper script for crawling

# Copy wrapper script
COPY crawl.sh /opt/crawl.sh
RUN chmod +x /opt/crawl.sh

# Set entry point
ENTRYPOINT ["/opt/crawl.sh"]

# Default command
CMD ["--help"]

