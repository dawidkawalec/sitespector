FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
# Added WeasyPrint dependencies: 
# libpango-1.0-0, libpangoft2-1.0-0, libjpeg-dev, libopenjp2-7-dev, libffi-dev
# PLUS: libglib2.0-0, libcairo2 (required for gobject-2.0-0 error)
# PLUS: fonts-liberation, fonts-dejavu (for PDF generation)
# PLUS: docker.io (client for controlling sibling containers)
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    curl \
    unzip \
    fontconfig \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libjpeg-dev \
    libopenjp2-7-dev \
    libffi-dev \
    libglib2.0-0 \
    libcairo2 \
    fonts-liberation \
    fonts-dejavu \
    docker.io \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Download Inter font from GitHub (with fallback to Liberation Sans if unreachable)
RUN mkdir -p /usr/share/fonts/truetype/inter && \
    curl -L --max-time 60 \
    "https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip" \
    -o /tmp/inter.zip && \
    unzip -j /tmp/inter.zip \
    "Inter Desktop/Inter-Regular.ttf" \
    "Inter Desktop/Inter-Medium.ttf" \
    "Inter Desktop/Inter-SemiBold.ttf" \
    "Inter Desktop/Inter-Bold.ttf" \
    "Inter Desktop/Inter-ExtraBold.ttf" \
    -d /usr/share/fonts/truetype/inter/ && \
    rm -f /tmp/inter.zip && \
    fc-cache -fv || echo "Inter font download failed, using Liberation Sans fallback"

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for PDFs and logs
RUN mkdir -p /tmp/audits /app/logs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
