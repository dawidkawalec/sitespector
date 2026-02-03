# SiteSpector SaaS Deployment Guide

Complete guide for deploying SiteSpector with Supabase, Stripe, and custom domain.

---

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] Supabase project created and configured (see `supabase/README.md`)
- [ ] Stripe account created with products/prices
- [ ] Domain DNS configured (A records pointing to VPS)
- [ ] All environment variables ready

---

## Step 1: Update VPS Environment Variables

SSH to VPS and edit `.env`:

```bash
ssh root@77.42.79.46
cd /opt/sitespector
nano .env
```

Add/update these variables:

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# Stripe
STRIPE_SECRET_KEY=sk_live_...  # Use live keys for production
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...

# Frontend URL
FRONTEND_URL=https://sitespector.app

# CORS (update for new domain)
CORS_ORIGINS=["https://sitespector.app","https://www.sitespector.app"]

# Keep existing vars:
DATABASE_URL=postgresql+asyncpg://sitespector_user:sitespector_password@postgres:5432/sitespector_db
JWT_SECRET=...
GEMINI_API_KEY=...
SCREAMING_FROG_USER=...
SCREAMING_FROG_KEY=...
SCREAMING_FROG_EMAIL=...
```

Save and exit (`Ctrl+X`, `Y`, `Enter`).

---

## Step 2: Run VPS Database Migration

Add `workspace_id` column to audits table:

```bash
# Access PostgreSQL
docker exec -it sitespector-postgres psql -U sitespector_user -d sitespector_db

# Run migration
ALTER TABLE audits ADD COLUMN IF NOT EXISTS workspace_id UUID;
CREATE INDEX IF NOT EXISTS idx_audits_workspace ON audits(workspace_id);
ALTER TABLE audits ALTER COLUMN user_id DROP NOT NULL;

# Verify
\d audits

# Exit
\q
```

---

## Step 3: Update Docker Compose for New Domain

Edit `docker-compose.prod.yml`:

```bash
nano docker-compose.prod.yml
```

Update frontend build args:

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
    args:
      - NEXT_PUBLIC_API_URL=https://sitespector.app
      - NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
  environment:
    - NEXT_PUBLIC_API_URL=https://sitespector.app
    - NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
    - NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Update nginx volumes to include Let's Encrypt certs:

```yaml
nginx:
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt:ro
    - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
```

---

## Step 4: Configure Domain DNS

At your domain registrar (where you bought sitespector.app):

### Add DNS Records

```
Type: A
Name: @
Value: 77.42.79.46
TTL: 3600

Type: A
Name: www
Value: 77.42.79.46
TTL: 3600
```

### Verify DNS Propagation

Wait 10 minutes to 48 hours, then test:

```bash
dig sitespector.app
dig www.sitespector.app

# Should return: 77.42.79.46
```

---

## Step 5: Obtain Let's Encrypt SSL Certificate

### Stop Nginx

```bash
docker compose -f docker-compose.prod.yml stop nginx
```

### Install Certbot

```bash
apt update
apt install -y certbot python3-certbot-nginx
```

### Obtain Certificate

```bash
certbot certonly --standalone \
  -d sitespector.app \
  -d www.sitespector.app \
  --non-interactive \
  --agree-tos \
  -m your-email@example.com
```

**Expected output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/sitespector.app/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/sitespector.app/privkey.pem
```

### Setup Auto-Renewal

Test renewal:
```bash
certbot renew --dry-run
```

Add cron job:
```bash
crontab -e

# Add this line:
0 3 * * * certbot renew --quiet && docker compose -f /opt/sitespector/docker-compose.prod.yml restart nginx
```

---

## Step 6: Update Nginx Configuration

Edit nginx config:

```bash
nano docker/nginx/nginx.conf
```

Replace contents with:

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name sitespector.app www.sitespector.app;
    
    # Redirect all HTTP to HTTPS
    return 301 https://sitespector.app$request_uri;
}

# HTTPS - Main application
server {
    listen 443 ssl http2;
    server_name sitespector.app www.sitespector.app;

    # Let's Encrypt SSL certificates
    ssl_certificate /etc/letsencrypt/live/sitespector.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sitespector.app/privkey.pem;

    # SSL optimization
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (Next.js)
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Logs viewer (Dozzle)
    location /logs/ {
        proxy_pass http://dozzle:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Step 7: Deploy Code Changes

### Local (in Cursor):

```bash
# Review changes
git status
git diff

# Commit (will ask before push)
git add .
git commit -m "feat: SaaS transformation - Supabase Auth, Teams, Billing, Stripe"
```

**Wait for agent to ask, then confirm push.**

### VPS Deployment:

```bash
# SSH to VPS
ssh root@77.42.79.46
cd /opt/sitespector

# Pull latest code
git pull origin release

# Rebuild all services (fresh build with new dependencies)
docker compose -f docker-compose.prod.yml build --no-cache

# Stop all services
docker compose -f docker-compose.prod.yml down

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Verify all containers running
docker ps

# Expected containers:
# - sitespector-nginx
# - sitespector-frontend
# - sitespector-backend
# - sitespector-worker
# - sitespector-postgres
# - sitespector-screaming-frog
# - sitespector-lighthouse
# - sitespector-dozzle
```

---

## Step 8: Run User Migration Script

Migrate existing users to Supabase:

```bash
# SSH to VPS (if not already)
ssh root@77.42.79.46
cd /opt/sitespector

# Run migration script
docker exec sitespector-backend python backend/scripts/migrate_users_to_supabase.py

# Follow prompts
# Review output and note any errors
```

**Important**: Migration script will:
1. Create users in Supabase Auth
2. Create personal workspaces
3. Link existing audits to workspaces
4. Generate magic links for password reset

**After migration**: Send password reset emails to all users.

---

## Step 9: Configure Stripe Webhook

### Get Webhook Signing Secret

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://sitespector.app/api/billing/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
5. Copy "Signing secret" (starts with `whsec_`)

### Update Environment

```bash
# SSH to VPS
ssh root@77.42.79.46
cd /opt/sitespector

# Edit .env
nano .env

# Add:
STRIPE_WEBHOOK_SECRET=whsec_...

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

### Test Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click your webhook endpoint
3. Click "Send test webhook"
4. Select event: `checkout.session.completed`
5. Verify success (200 OK)

---

## Step 10: Update Supabase Redirect URLs

In Supabase Dashboard > Authentication > URL Configuration:

### Site URL
```
https://sitespector.app
```

### Redirect URLs
```
https://sitespector.app/auth/callback
https://www.sitespector.app/auth/callback
```

Save changes.

---

## Step 11: Monitor Deployment

### Check Container Logs

```bash
# Backend
docker logs sitespector-backend --tail 100 -f

# Worker
docker logs sitespector-worker --tail 100 -f

# Frontend
docker logs sitespector-frontend --tail 100 -f

# Nginx
docker logs sitespector-nginx --tail 100 -f
```

### Check System Status

```bash
# All containers running?
docker ps

# Any errors?
docker ps -a | grep -v "Up"

# System status API
curl https://sitespector.app/api/system/status

# Health check
curl https://sitespector.app/health
```

---

## Step 12: End-to-End Testing

### Test Authentication

1. Go to https://sitespector.app
2. Click "Sign up"
3. Register with email/password
4. Verify personal workspace created
5. Try Google OAuth (if configured)
6. Try magic link login
7. Test logout

### Test Workspaces

1. Create team workspace
2. Verify in Supabase dashboard (workspaces table)
3. Invite member (copy invite link)
4. Accept invite in incognito window
5. Verify member appears in team settings

### Test Audits

1. Create audit in personal workspace
2. Wait for processing
3. Verify results display
4. Download PDF
5. Download raw data
6. Create audit in team workspace
7. Switch workspace, verify audits isolated

### Test Billing

1. Go to /pricing
2. Click "Get Pro"
3. Complete test checkout (use Stripe test card: 4242 4242 4242 4242)
4. Verify subscription upgraded in Supabase
5. Verify audit limit increased to 50
6. Test audit limit enforcement

---

## Step 13: Final Verification

### Security

- [ ] HTTPS working (no warnings)
- [ ] RLS policies preventing unauthorized access
- [ ] Workspace isolation working
- [ ] Stripe webhook receiving events
- [ ] No console errors in browser

### Performance

- [ ] Page load < 2 seconds
- [ ] Audit processing works
- [ ] No memory leaks (check `docker stats`)
- [ ] Database queries optimized

### Functionality

- [ ] All auth methods work
- [ ] Team creation/invites work
- [ ] Audit CRUD works
- [ ] PDF generation works
- [ ] Billing/subscription works
- [ ] Mobile responsive

---

## Rollback Plan

If deployment fails:

### Quick Rollback

```bash
# SSH to VPS
ssh root@77.42.79.46
cd /opt/sitespector

# Rollback git
git log --oneline -5  # Find previous commit
git reset --hard <previous-commit-hash>

# Rebuild and restart
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Check status
docker ps
docker logs sitespector-backend --tail 100
```

### Database Rollback

```bash
# Restore from backup (if needed)
cat /opt/backups/db_backup.sql | docker exec -i sitespector-postgres psql -U sitespector_user -d sitespector_db
```

---

## Post-Deployment Tasks

### 1. Setup Monitoring

- [ ] Add Sentry for error tracking
- [ ] Setup uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure log aggregation

### 2. Backup Strategy

```bash
# Add daily database backup cron
crontab -e

# Add:
0 2 * * * docker exec sitespector-postgres pg_dump -U sitespector_user sitespector_db > /opt/backups/db_$(date +\%Y\%m\%d).sql
```

### 3. Documentation

- [ ] Update `.context7/` docs with new architecture
- [ ] Update README with new setup instructions
- [ ] Create user documentation
- [ ] Create API documentation (if exposing API)

### 4. Marketing

- [ ] Update landing page
- [ ] Add pricing FAQ
- [ ] Create demo video
- [ ] Setup support email

---

## Troubleshooting

### Issue: OAuth not working

**Symptoms**: OAuth redirects to error page

**Solutions**:
1. Check redirect URLs in Supabase match exactly
2. Verify OAuth credentials (Google/GitHub) configured correctly
3. Check browser console for errors

### Issue: Audits not linking to workspaces

**Symptoms**: Error 403 when creating audits

**Solutions**:
1. Verify migration script ran successfully
2. Check workspace_id column exists: `\d audits` in PostgreSQL
3. Verify user has workspace membership

### Issue: Stripe webhook fails

**Symptoms**: Subscriptions don't activate after payment

**Solutions**:
1. Check webhook signing secret correct
2. Verify endpoint URL correct: https://sitespector.app/api/billing/webhook
3. Check backend logs: `docker logs sitespector-backend --tail 100`
4. Test webhook in Stripe dashboard

### Issue: SSL certificate issues

**Symptoms**: Browser shows "Not secure"

**Solutions**:
1. Verify certbot ran successfully
2. Check nginx config points to correct cert paths
3. Restart nginx: `docker compose restart nginx`
4. Check cert expiry: `certbot certificates`

---

## Maintenance Commands

### View Logs

```bash
# Real-time backend logs
docker logs sitespector-backend -f

# Real-time worker logs
docker logs sitespector-worker -f

# Last 100 lines
docker logs sitespector-backend --tail 100
```

### Restart Services

```bash
# Restart single service
docker compose -f docker-compose.prod.yml restart backend

# Restart all
docker compose -f docker-compose.prod.yml restart

# Full rebuild (if dependencies changed)
docker compose -f docker-compose.prod.yml build --no-cache backend worker
docker compose -f docker-compose.prod.yml up -d
```

### Database Access

```bash
# PostgreSQL shell
docker exec -it sitespector-postgres psql -U sitespector_user -d sitespector_db

# Quick queries
SELECT COUNT(*) FROM audits WHERE workspace_id IS NOT NULL;
SELECT * FROM audits ORDER BY created_at DESC LIMIT 5;
```

### Check Disk Space

```bash
df -h
docker system df

# Clean up if needed
docker system prune -a --volumes
```

---

## Success Indicators

After deployment, verify:

- ✅ Site loads at https://sitespector.app (no SSL warnings)
- ✅ Login with OAuth works
- ✅ Personal workspace auto-created on signup
- ✅ Team creation works
- ✅ Audit creation works in both personal and team workspaces
- ✅ Subscription upgrade works (test mode)
- ✅ Webhook receives and processes events
- ✅ All Docker containers healthy: `docker ps`

---

**Deployment completed**: 2025-02-03  
**Version**: 2.0 (SaaS)  
**Domain**: sitespector.app  
**Status**: Production-ready
