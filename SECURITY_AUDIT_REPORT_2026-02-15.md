# SiteSpector - Security Remediation + Re-Audit Report (2026-02-15)

This document summarizes:

- the original Hetzner/NFO abuse report context,
- the remediation work performed (repo + VPS + runtime),
- what was intentionally not done (and why),
- the status of each identified vulnerability (confirmed closed),
- verification that the production application is running correctly,
- and a documentation completeness check for `.context7/`.

No secrets (API keys, JWT secrets, Supabase service keys, passwords) are included here.

---

## 1) Original Abuse Report (Context)

Source: `/Users/dawid/Downloads/Abuse Message 112ED461D.txt`

Key facts from the report:

- **Source IP**: `46.225.134.48`
- **Traffic**: UDP flood, short burst style (intended to evade notice)
- **Estimated peak**: ~63 Mbps from our host during the coordinated event
- **Assessment**: not spoofed; consistent with a compromised host participating in a botnet
- **General likely vectors** (report’s list): weak SSH passwords, exposed admin panels, vulnerable services, etc.

What matters operationally:

- A compromised host can generate **outbound UDP floods** even if the application code is clean.
- Mitigation must therefore include **host-level hardening + outbound traffic controls**, not just app fixes.

---

## 2) Environment (Production)

- **Provider**: Hetzner Cloud
- **VPS IP**: `46.225.134.48`
- **OS**: Ubuntu 24.04 LTS
- **App path**: `/opt/sitespector`
- **Runtime**: Docker + Docker Compose
- **Edge**: nginx container terminates SSL + routes traffic

---

## 3) What Was Done

### 3.1 Repo / Application Security Changes (Release branch)

Goal: remove public attack surface and prevent sensitive data exposure.

- **Removed public log viewer exposure**
  - `/logs` (Dozzle) is no longer exposed via nginx.
- **Protected monitoring endpoints**
  - `/api/logs/worker`, `/api/logs/backend`, `/api/system/status` require `X-Admin-Token` (server-side dependency in FastAPI).
- **Disabled FastAPI docs in production**
  - Swagger/OpenAPI/ReDoc disabled when `ENVIRONMENT=production`.
- **Docker socket mounted read-only**
  - `docker.sock` mounts set to `:ro` (worker + backend + dozzle).
- **Pinned third-party image**
  - Dozzle pinned (no `:latest`).
- **Network segmentation in compose**
  - Split into internal + external networks.
- **Nginx hardening**
  - security headers + request rate limiting.
- **Moved credentials to `.env`**
  - Removed hardcoded DB credentials from compose; `.env.example` updated accordingly.

References:

- `docker/nginx/nginx.conf`
- `backend/app/main.py`
- `backend/app/config.py`
- `docker-compose.prod.yml`
- `.env.example`
- `SECURITY_HARDENING_PLAN.md`
- `.context7/decisions/DECISIONS_LOG.md` (ADR-031, ADR-032)
- `.context7/decisions/BUGS_AND_FIXES.md` (BUG-032)

### 3.2 VPS Hardening (Host-Level)

Goal: prevent re-compromise via obvious vectors and **block outbound UDP floods** even in worst case.

- **SSH hardened**
  - root SSH login disabled
  - password auth disabled (key-only)
  - only `deploy` user allowed
  - MaxAuthTries reduced
- **Firewall (UFW) hardened**
  - default deny incoming
  - default deny outgoing (**critical anti-DDoS**)
  - allow inbound only: `22/tcp`, `80/tcp`, `443/tcp`
  - allow outbound only: `80/tcp`, `443/tcp`, `53/udp`, `53/tcp`
  - result: outbound UDP floods are blocked (except DNS)
- **fail2ban enabled**
  - SSH brute-force protection active (confirmed banning hostile IPs)
- **Let’s Encrypt SSL**
  - Certificate issued for `sitespector.app` + `www.sitespector.app`
  - Auto-renewal via systemd timer plus a cron fallback
- **Security monitoring**
  - `/opt/sitespector/security-check.sh` scheduled every 5 minutes
  - checks: suspicious process names, executable `/tmp` files, extra SSH keys, Docker TCP exposure, unexpected open ports
  - log rotation configured for `/var/log/sitespector-security.log`

### 3.3 Production Deployment

- Repo cloned to `/opt/sitespector` on the VPS, branch `release`
- Images built with `docker compose ... build --no-cache`
- Services started: all expected containers running
- `.env` created on VPS with strong random DB/admin secrets (stored only on VPS)
- Supabase service role key was added to VPS `.env` (required for backend runtime)

---

## 4) What Was Not Done (And Why)

These were intentionally not implemented during this remediation because they either:

- increase complexity/risk during incident response,
- require additional design decisions and testing,
- or are post-stabilization tasks (Phase 2 in the plan).

- **Docker Socket Proxy (Phase 2)**
  - Not implemented yet to avoid disrupting worker functionality during emergency stabilization.
  - Current mitigation: socket is `:ro`, endpoints locked down, networks segmented, UFW outbound restricted.
- **Hide nginx version (`server_tokens off`)**
  - Not implemented in repo config yet; considered low risk compared to the resolved critical items.
  - Can be added in the next infra update (no functional impact expected).
- **SSH allowlist by office/home IP**
  - Not enabled by default to avoid operator lockout during emergency setup and travel / dynamic IP scenarios.
  - Can be enabled later for additional defense-in-depth.
- **Automated database backups**
  - Not enabled yet; requires confirming backup retention and secure storage target.

---

## 5) Vulnerabilities - Status & Closure Evidence

This table maps the previously identified issues to their closure state.

| Vulnerability / Risk | Status | How Closed / Evidence |
|---|---:|---|
| Public log viewer `/logs` (Dozzle) exposed | CLOSED | `https://sitespector.app/logs` returns `404` |
| Monitoring endpoints public without auth | CLOSED | Without token -> `422`; with `X-Admin-Token` -> `200` |
| Swagger/OpenAPI exposed in production | CLOSED | `https://sitespector.app/api/docs` -> `404` and backend `/docs` -> `404` |
| Docker socket mounted read-write | CLOSED | `docker.sock` mounts use `:ro` |
| Unpinned third-party image (`:latest`) | CLOSED | Dozzle pinned to a specific version |
| No egress controls (UDP flood possible) | CLOSED | UFW default deny outgoing; only DNS UDP allowed |
| Docker daemon exposed on TCP (2375) | CLOSED | No listener on `2375` |
| Excess open ports on host | CLOSED | Only `22`, `80`, `443` listening externally |

Notes:

- `https://sitespector.app/docs` being **200** is expected: that route belongs to the **landing app** (public content). Swagger is verified via `/api/docs` and backend container `/docs`.

---

## 6) Verification - Application Works

### 6.1 Container Health

- `sitespector-backend`: healthy
- `sitespector-worker`: healthy
- `sitespector-postgres`: healthy
- `sitespector-nginx`: up and serving traffic
- `landing`, `frontend`, `dozzle`, `screaming-frog`, `lighthouse`: up

### 6.2 Endpoint Checks (Expected Results)

- `GET https://sitespector.app/health` -> `200`
- `GET https://sitespector.app/api/docs` -> `404`
- `GET https://sitespector.app/api/openapi.json` -> `404`
- `GET https://sitespector.app/api/logs/worker` (no token) -> `422`
- `GET https://sitespector.app/api/logs/worker` (with `X-Admin-Token`) -> `200`
- `GET https://sitespector.app/logs` -> `404`

### 6.3 SSL Verification

- Certificate subject: `CN = sitespector.app`
- Issuer: Let’s Encrypt
- Validity: `2026-02-15` to `2026-05-16`

---

## 7) Documentation (Context7) Completeness Check

### 7.1 `.context7` index reviewed

Reviewed: `.context7/INDEX.md`

### 7.2 Files updated to reflect real production state

These files were updated to match the hardened production setup:

- `.context7/project/DEPLOYMENT.md` (security baseline, UFW deny outgoing, monitoring, Docker safety)
- `.context7/project/OPERATIONS.md` (UFW rules corrected, renewal + monitoring added)
- `.context7/infrastructure/DOCKER.md` (9 services, networks internal/external, `:ro` socket, Dozzle non-public)
- `.context7/infrastructure/NGINX.md` (Let’s Encrypt paths, landing `/docs` clarification, hardening notes)
- `.context7/decisions/BUGS_AND_FIXES.md` (BUG-032 verification corrected: `/api/docs` vs landing `/docs`)
- `.context7/decisions/DECISIONS_LOG.md` (ADR-032: hardened VPS deployment)

---

## 8) Appendix - Re-Audit Snapshot (Redacted)

This is a condensed snapshot from the re-audit performed on `2026-02-15` (UTC).

### SSH effective config (selected)

```
permitrootlogin no
passwordauthentication no
pubkeyauthentication yes
allowusers deploy
maxauthtries 3
logingracetime 30
```

### UFW summary

```
Default: deny (incoming), deny (outgoing)
Inbound allow: 22/tcp, 80/tcp, 443/tcp
Outbound allow: 80/tcp, 443/tcp, 53/udp, 53/tcp
```

### Host listening ports (external)

```
22/tcp (sshd)
80/tcp (docker-proxy -> nginx)
443/tcp (docker-proxy -> nginx)
```

### API surface checks (selected)

```
/api/docs => 404
/api/openapi.json => 404
/api/logs/worker => 422 (no token)
/api/logs/worker => 200 (with X-Admin-Token)
/logs => 404
/health => 200
```

---

## 9) Next Steps (Recommended)

- Add `server_tokens off;` to `docker/nginx/nginx.conf` and redeploy (minor info-leak reduction).
- Decide on Phase 2 hardening: Docker socket proxy vs current `:ro` approach.
- Enable automated database backups (define retention + secure storage).

