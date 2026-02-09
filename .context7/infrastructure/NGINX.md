# SiteSpector - Nginx Configuration

## Overview

Nginx acts as reverse proxy and SSL termination for SiteSpector.

**Config file**: `docker/nginx/nginx.conf`

**Container**: `sitespector-nginx`

**Ports**: 80 (HTTP), 443 (HTTPS)

---

## Configuration Structure

### Global Settings

```nginx
events {
    worker_connections 1024;  # Max connections per worker
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript 
               application/xml+rss application/rss+xml 
               font/truetype font/opentype 
               application/vnd.ms-fontobject 
               image/svg+xml;
}
```

---

## Upstream Servers

```nginx
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:3000;
}
```

**Purpose**: Define backend services for load balancing (future)

---

## HTTP Server (Port 80)

```nginx
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}
```

**Purpose**: Redirect all HTTP to HTTPS

---

## HTTPS Server (Port 443)

### SSL Configuration

```nginx
server {
    listen 443 ssl;
    server_name _;

    # SSL certificates
    ssl_certificate /etc/nginx/ssl/selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/selfsigned.key;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Max upload size (for PDF reports)
    client_max_body_size 20M;
}
```

**SSL**: Self-signed certificate (development grade)

**TLS versions**: 1.2, 1.3 only (secure)

---

### API Routes

```nginx
location /api/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # Timeouts for long-running audits
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}
```

**Routing**: `/api/*` → `backend:8000`

**Timeouts**: 5 minutes (300s) for PDF generation

---

### Health Check Endpoint

```nginx
location /health {
    proxy_pass http://backend/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

**Routing**: `/health` → `backend:8000/health`

**Purpose**: Backend health check (no `/api` prefix)

---

### Frontend Routes

```nginx
location / {
    proxy_pass http://frontend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

**Routing**: Everything else → `frontend:3000`

**WebSocket support**: Yes (upgrade header)

---

### Next.js Static Files

```nginx
location /_next/static {
    proxy_pass http://frontend;
    proxy_cache_valid 200 60m;
    add_header Cache-Control "public, max-age=3600, immutable";
}
```

**Caching**: 60 minutes for static assets

**Purpose**: Optimize Next.js asset delivery

---

## SSL Certificate

### Current: Let's Encrypt

**Location**: `/etc/letsencrypt/live/sitespector.app/`

**Files**:
- `fullchain.pem` - Certificate
- `privkey.pem` - Private key

**Generate**:
```bash
certbot certonly --standalone -d sitespector.app -d www.sitespector.app
```

**Nginx Volume**:
```yaml
volumes:
  - /etc/letsencrypt/live/sitespector.app:/etc/nginx/ssl:ro
```

---

## Request Flow Examples

### Frontend Page Load

```
Browser
  ↓ HTTPS request: https://sitespector.app/
Nginx (443)
  ↓ proxy_pass / → frontend:3000
Frontend Container (Next.js)
  ↓ Server-side render
HTML Response
  ↓
Browser (renders page)
```

### API Request

```
Browser
  ↓ POST https://sitespector.app/api/audits (Bearer token)
Nginx (443)
  ↓ proxy_pass /api/* → backend:8000
Backend Container (FastAPI)
  ↓ Process request
JSON Response
  ↓
Nginx
  ↓
Browser (React Query updates)
```

---

## Logging

**Access log**: `/var/log/nginx/access.log`  
**Error log**: `/var/log/nginx/error.log`

**View logs**:
```bash
docker logs sitespector-nginx --tail 100
```

---

## Common Issues

### 502 Bad Gateway

**Cause**: Backend/frontend container not running

**Fix**:
```bash
docker ps  # Check if backend/frontend running
docker compose -f docker-compose.prod.yml restart backend frontend
```

### SSL Certificate Warning

**Cause**: If using IP only with self-signed cert, browser shows warning.

**Fix**: Use https://sitespector.app (Let's Encrypt – no warning). For IP-only, accept browser warning.

### 413 Payload Too Large

**Cause**: File upload exceeds `client_max_body_size`

**Fix**: Increase limit in nginx.conf
```nginx
client_max_body_size 50M;
```

---

## Performance Tuning

### Enable HTTP/2

```nginx
listen 443 ssl http2;
```

### Increase Worker Processes

```nginx
worker_processes auto;  # Use all CPU cores
```

### Optimize Gzip Compression

```nginx
gzip_comp_level 6;  # Compression level (1-9)
gzip_buffers 16 8k;
```

---

## Testing Configuration

### Test config syntax

```bash
docker exec sitespector-nginx nginx -t
```

### Reload without downtime

```bash
docker exec sitespector-nginx nginx -s reload
```

---

**Last Updated**: 2026-02-09  
**Version**: Nginx 1.25 (Alpine)  
**SSL**: Let's Encrypt (sitespector.app)  
**Status**: Production-ready
