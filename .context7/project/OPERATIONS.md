# SiteSpector - Operations & Admin Runbooks

Last updated: 2026-02-15

## Production Topology (Current)

- **Provider**: Hetzner Cloud
- **Domain**: `sitespector.app` (+ `www.sitespector.app`)
- **VPS (current IP)**: `46.225.134.48`
- **OS**: Ubuntu 24.04 LTS
- **Runtime**: Docker + Docker Compose plugin
- **App directory**: `/opt/sitespector`
- **Branch**: `release`
- **Services** (Docker): `nginx`, `frontend`, `landing`, `backend`, `worker`, `postgres`, `screaming-frog`, `lighthouse`, `dozzle`

## Access & Security Baseline

### SSH Login (Required)

- **Root SSH login is disabled**.
- **PasswordAuthentication is disabled** (SSH keys only).
- Use the `deploy` user:

```bash
ssh -i ~/.ssh/hetzner_sitespector_2026 deploy@46.225.134.48
```

Notes:
- If your key filename is different, replace the `-i ...` path.
- If you regenerate keys, update `~deploy/.ssh/authorized_keys` on the VPS.

### Workstation Setup (New Laptop / New Key)

1) Generate a new keypair (Mac/Linux):
```bash
ssh-keygen -t ed25519 -a 100 -f ~/.ssh/hetzner_sitespector_YYYY -C "sitespector-YYYY"
```

2) Add the public key to Hetzner (or to the VPS `authorized_keys`):
```bash
pbcopy < ~/.ssh/hetzner_sitespector_YYYY.pub
```

3) Connect:
```bash
ssh -i ~/.ssh/hetzner_sitespector_YYYY deploy@46.225.134.48
```

Optional: create `~/.ssh/config` entry:
```text
Host sitespector-vps
  HostName 46.225.134.48
  User deploy
  IdentityFile ~/.ssh/hetzner_sitespector_2026
  IdentitiesOnly yes
```
Then:
```bash
ssh sitespector-vps
```

### Common SSH Issues

- **"Host key verification failed"**:
  - Happens after reinstall/new VPS or IP reuse.
  - Fix (remove old key for that host):
```bash
ssh-keygen -R 46.225.134.48
```
- **"Permission denied (publickey)"**:
  - You're using the wrong key, or the key was not installed on the server.
  - Use explicit key path with `-i ...` and ensure the public key is in `~deploy/.ssh/authorized_keys`.

### Privileged Commands (sudo)

`deploy` can run administrative commands via `sudo`:

```bash
sudo ufw status
sudo systemctl status fail2ban
sudo journalctl -u ssh --no-pager | tail
```

### Firewall (UFW)

Baseline rules:
- Inbound allowed: `22/tcp`, `80/tcp`, `443/tcp`
- Default inbound: deny
- Default outbound: **deny**
- Outbound allowed: `80/tcp`, `443/tcp`, `53/udp`, `53/tcp` (DNS only)
- Defense-in-depth: **block all outbound UDP except DNS** (prevents UDP flood DDoS)

Check:
```bash
sudo ufw status numbered
```

Optional (recommended): restrict SSH to your IP only:
```bash
sudo ufw delete allow 22/tcp
sudo ufw allow from YOUR_PUBLIC_IP to any port 22 proto tcp
sudo ufw status numbered
```

### Fail2ban

Fail2ban is enabled for SSH brute-force protection.

Check:
```bash
sudo fail2ban-client status sshd
```

### SSL Auto-Renewal (Let's Encrypt)

Certbot is installed on the host and renewal is handled by:

- systemd timer (primary): `certbot.timer`
- cron backup: `/etc/cron.d/certbot-renew` (stops nginx container, runs renew, starts nginx)

### Security Monitoring (Host)

A lightweight security check runs every 5 minutes:

- Script: `/opt/sitespector/security-check.sh`
- Cron: `/etc/cron.d/security-check`
- Log: `/var/log/sitespector-security.log` (rotated via `/etc/logrotate.d/sitespector-security`)

## 🚀 Admin Tasks

## Deployment (Routine)

### 1) Update Code

```bash
ssh -i ~/.ssh/hetzner_sitespector_2026 deploy@46.225.134.48
cd /opt/sitespector
git fetch origin
git checkout release
git pull origin release
```

### 2) Rebuild + Restart

```bash
cd /opt/sitespector
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

### 3) Apply DB migrations (VPS Postgres container)

```bash
docker exec sitespector-backend alembic upgrade head
```

### 4) Quick Health Checks

From the VPS host:
```bash
curl -sk https://127.0.0.1/health
docker logs sitespector-backend --tail 50
docker logs sitespector-worker --tail 50
```

### Manually Upgrading User to Pro
Subscription is **per workspace**. To upgrade a user manually:

1. Access Supabase SQL Editor.
2. Run the following SQL (replace email):

```sql
UPDATE public.subscriptions
SET plan = 'pro', audit_limit = 50, status = 'active', updated_at = NOW()
WHERE workspace_id = (
  SELECT w.id FROM public.workspaces w
  JOIN auth.users u ON u.id = w.owner_id
  WHERE u.email = 'user@example.com' LIMIT 1
);
```

### Database Maintenance
- **Backups**: If/when enabled, store in `/opt/backups/` (cron recommended).
- **Migrations**: Use Alembic for VPS PostgreSQL changes.

## 🛠️ Troubleshooting

### Issue: DNS points to old IP / Certbot fails

Symptoms:
- `certbot certonly --standalone ...` fails with HTTP-01 timeout

Cause:
- `sitespector.app` / `www.sitespector.app` still resolves to an old IP (DNS propagation not finished), or port 80 inbound blocked.

Fix:
1) Confirm DNS:
```bash
dig +short sitespector.app
dig +short www.sitespector.app
```
2) Confirm inbound port 80 open:
```bash
sudo ufw status
```
3) Then re-run certbot:
```bash
sudo certbot certonly --standalone -d sitespector.app -d www.sitespector.app --agree-tos --register-unsafely-without-email --non-interactive
docker restart sitespector-nginx
```

### Issue: Audits Stuck in PROCESSING
- **Check**: Worker logs (`docker logs sitespector-worker`).
- **Fix**: Restart worker container (`docker compose restart worker`).

### Issue: 502 Bad Gateway after backend recreate (nginx upstream stale)
Symptoms:
- `curl -sk https://127.0.0.1/health` returns `502 Bad Gateway`
- Nginx error log contains `connect() failed (111: Connection refused) while connecting to upstream`

Cause:
- Docker service DNS for `backend` can resolve to an old container IP after `backend` is recreated.
- Nginx keeps the old resolved IP in memory until reload/restart.

Fix:
```bash
cd /opt/sitespector
docker compose -f docker-compose.prod.yml restart nginx
curl -sk https://127.0.0.1/health
```

### Issue: SSL Certificate Expired
- **Fix**: Run `certbot renew` on VPS host and restart nginx.

## Secrets & Environment Variables

Production secrets live on the VPS only:
- `/opt/sitespector/.env`

Rules:
- Never commit real `.env` values to git.
- Rotate keys immediately after any suspected host compromise (JWT secret, API keys, Supabase service role key, etc.).
