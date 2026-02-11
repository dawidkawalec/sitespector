FROM --platform=linux/amd64 ubuntu:22.04

# Install dependencies including Java Runtime
# Screaming Frog requires Java 11+
RUN apt-get update && apt-get install -y \
    wget \
    gdebi-core \
    python3 \
    openjdk-11-jre-headless \
    xvfb \
    libgtk-3-0 \
    libasound2 \
    libdbus-glib-1-2 \
    libx11-xcb1 \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Download and install Screaming Frog SEO Spider .deb
WORKDIR /tmp
# Using version 19.4 as example, verify link if fails
RUN wget https://download.screamingfrog.co.uk/products/seo-spider/screamingfrogseospider_19.4_all.deb -O sf.deb \
    && gdebi -n sf.deb \
    && rm sf.deb

# Create wrapper script
COPY merge_csvs.py /usr/local/bin/merge_csvs.py
COPY crawl.sh /usr/local/bin/crawl.sh
RUN chmod +x /usr/local/bin/crawl.sh

# Default entrypoint
ENTRYPOINT ["/usr/local/bin/crawl.sh"]
