# SiteSpector - Security Rotation Checklist (Post-Incident)

Created: 2026-02-13  
New VPS IP: `46.225.134.48`

## Rotate Now (Critical)

- `JWT_SECRET` (force new sessions/logins).
- `GEMINI_API_KEY` (revoke old key, issue a new key).
- `SUPABASE_SERVICE_ROLE_KEY` (generate new service role key in Supabase).
- Any database passwords used by backend workers or scripts.
- Any SMTP/email provider API keys used by backend.
- Any payment/webhook secrets (Stripe/other), if present.

## Rotate Server Access

- Generate new SSH keypair for admin access.
- Disable password SSH auth on the new server.
- Disable root SSH login (`PermitRootLogin no`) after `deploy` user is verified.
- Rotate/remove any old CI/CD or deployment tokens previously used on the compromised VPS.

## Screaming Frog License Credentials

- `SCREAMING_FROG_USER`, `SCREAMING_FROG_KEY`, `SCREAMING_FROG_EMAIL` should be treated as exposed.
- If vendor panel allows: deauthorize old host and rebind license to new VPS.
- If full reset is not possible: keep key only on new server, never in repo, and protect egress with firewall allowlist.

## Environment Safety Rules

- Keep real secrets only in server-side `.env` (outside git).
- Keep repo `.env.example` with placeholders only.
- Set production flags on new server:
  - `ENVIRONMENT=production`
  - `DEBUG=false`
  - `LOG_LEVEL=WARNING` (or `INFO` if needed)

## Supabase Decision

- Do **not** create a new empty Supabase project by default.
- Keep current Supabase project, but rotate critical keys/secrets.
- Create a new Supabase project only if audit logs show real compromise of data/auth.

## Verification After Rotation

- App login works with new JWT secret.
- Backend works with new API keys.
- Worker jobs run correctly.
- No unexpected outbound traffic in Hetzner graphs.
- UFW/fail2ban active on the new VPS.
