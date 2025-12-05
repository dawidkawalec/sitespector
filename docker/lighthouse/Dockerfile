FROM node:20-slim

# Install Chromium and dependencies (works on both amd64 and arm64)
RUN apt-get update && apt-get install -y \
    chromium \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libgbm1 \
    libnss3 \
    libxss1 \
    libxtst6 \
    && rm -rf /var/lib/apt/lists/*

# Set Chromium path for Lighthouse
ENV CHROME_PATH=/usr/bin/chromium

# Install Lighthouse globally
RUN npm install -g lighthouse

# Create output directory
RUN mkdir -p /tmp/lighthouse

# Copy wrapper script
COPY audit.sh /opt/audit.sh
RUN chmod +x /opt/audit.sh

WORKDIR /opt

# Set entry point
ENTRYPOINT ["/opt/audit.sh"]

# Default command
CMD ["--help"]

