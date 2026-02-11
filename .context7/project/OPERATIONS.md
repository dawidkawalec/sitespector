# SiteSpector - Operations & Admin Runbooks

## 🚀 Admin Tasks

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
- **Backups**: Daily backups are stored in `/opt/backups/`.
- **Migrations**: Use Alembic for VPS PostgreSQL changes.

## 🛠️ Troubleshooting

### Issue: Audits Stuck in PROCESSING
- **Check**: Worker logs (`docker logs sitespector-worker`).
- **Fix**: Restart worker container (`docker compose restart worker`).

### Issue: SSL Certificate Expired
- **Fix**: Run `certbot renew` on VPS host and restart nginx.
