# 3-Phase System - Deployment & Testing Checklist

## Pre-Deployment

### 1. Code Review
- [ ] All backend files have no syntax errors
- [ ] All frontend files have no syntax errors  
- [ ] All imports are correct
- [ ] TypeScript types are consistent

### 2. Local Verification (Optional)
If you have a local dev environment:
- [ ] Run backend tests: `cd backend && pytest`
- [ ] Check migration syntax: `docker exec sitespector-backend alembic check`
- [ ] Build frontend: `cd frontend && npm run build`

---

## Deployment Steps (VPS)

### Step 1: Backup Current State

```bash
# SSH to VPS
ssh root@77.42.79.46

# Backup database
docker exec sitespector-postgres pg_dump -U sitespector_user sitespector_db > /opt/backups/sitespector_$(date +%Y%m%d_%H%M%S).sql

# Backup code
cd /opt
tar -czf sitespector_backup_$(date +%Y%m%d_%H%M%S).tar.gz sitespector/
```

### Step 2: Pull New Code

```bash
cd /opt/sitespector
git pull origin release
```

### Step 3: Apply Database Migration

```bash
# Apply migration
docker exec sitespector-backend alembic upgrade head

# Verify migration applied
docker exec sitespector-postgres psql -U sitespector_user -d sitespector_db -c "SELECT * FROM alembic_version;"

# Check new table exists
docker exec sitespector-postgres psql -U sitespector_user -d sitespector_db -c "\d audit_tasks"
```

Expected output:
```
                                  Table "public.audit_tasks"
     Column      |           Type           | Collation | Nullable |      Default       
-----------------+--------------------------+-----------+----------+--------------------
 id              | uuid                     |           | not null | 
 audit_id        | uuid                     |           | not null | 
 module          | character varying(50)    |           | not null | 
 title           | character varying(500)   |           | not null | 
 description     | text                     |           | not null | 
 ...
```

### Step 4: Restart Services

```bash
docker compose restart backend worker frontend
```

### Step 5: Verify Services

```bash
# Check all containers running
docker ps

# Check backend logs
docker logs sitespector-backend --tail 50

# Check worker logs
docker logs sitespector-worker --tail 50

# Check for errors
docker logs sitespector-backend --tail 100 | grep -i error
docker logs sitespector-worker --tail 100 | grep -i error
```

---

## Testing Checklist

### Test 1: Create Audit with Full Pipeline ✅

1. Go to `https://sitespector.pl/dashboard`
2. Click "Nowy Audyt"
3. Enter URL: `https://test-site.com`
4. Verify both toggles are checked:
   - ✅ Uruchom analizę AI automatycznie
   - ✅ Wygeneruj plan wykonania automatycznie
5. Click "Rozpocznij Audyt"
6. Expected: Redirects to audit detail page

### Test 2: Monitor Phase 3 Execution ✅

```bash
# Watch worker logs in real-time
docker logs sitespector-worker -f

# Look for Phase 3 logs:
# - "execution_plan:start"
# - "Synthesized X tasks (Y quick wins)"
# - "execution_plan:done"
# - "Phase 3 completed for audit {id}: X tasks"
```

### Test 3: Verify Tasks in Database ✅

```sql
-- Connect to database
docker exec -it sitespector-postgres psql -U sitespector_user -d sitespector_db

-- Check tasks created
SELECT audit_id, module, COUNT(*) as task_count,
       SUM(CASE WHEN is_quick_win THEN 1 ELSE 0 END) as quick_wins
FROM audit_tasks
GROUP BY audit_id, module
ORDER BY audit_id, module;

-- Check task details
SELECT id, module, title, priority, impact, effort, is_quick_win, status
FROM audit_tasks
WHERE audit_id = 'YOUR_AUDIT_ID_HERE'
LIMIT 10;

-- Check quick wins
SELECT module, title, priority, impact, effort
FROM audit_tasks
WHERE audit_id = 'YOUR_AUDIT_ID_HERE' AND is_quick_win = true;
```

### Test 4: Quick Wins Page ✅

1. Navigate to `/audits/{audit_id}/quick-wins`
2. Verify:
   - [ ] Page loads without errors
   - [ ] Quick wins are displayed grouped by module
   - [ ] Task count badge shows correct number
   - [ ] Can toggle task status (pending ↔ done)
   - [ ] Can expand task to see details
   - [ ] Can add and save notes

### Test 5: API Endpoints ✅

```bash
# Get audit with execution_plan_status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://sitespector.pl/api/audits/AUDIT_ID

# Get tasks
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://sitespector.pl/api/audits/AUDIT_ID/tasks"

# Get tasks filtered by module
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://sitespector.pl/api/audits/AUDIT_ID/tasks?module=seo"

# Get task summary
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://sitespector.pl/api/audits/AUDIT_ID/tasks/summary"

# Update task
curl -X PATCH -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "done", "notes": "Test note"}' \
  https://sitespector.pl/api/audits/AUDIT_ID/tasks/TASK_ID
```

### Test 6: On-Demand Execution Plan ✅

1. Create audit with `run_execution_plan: false`
2. Wait for Phase 1 and Phase 2 to complete
3. Call `POST /api/audits/{id}/run-execution-plan`
4. Verify Phase 3 runs independently
5. Check tasks are created

---

## Rollback Plan (If Issues Occur)

### Option 1: Rollback Migration Only

```bash
# Rollback to previous migration
docker exec sitespector-backend alembic downgrade -1

# Restart services
docker compose restart backend worker
```

### Option 2: Full Rollback

```bash
cd /opt/sitespector

# Restore previous code
git reset --hard HEAD~1  # Or specific commit
git pull origin release

# Restore database
docker exec -i sitespector-postgres psql -U sitespector_user -d sitespector_db < /opt/backups/sitespector_TIMESTAMP.sql

# Restart all services
docker compose restart
```

---

## Troubleshooting

### Issue: Migration Fails

**Symptom:** `alembic upgrade head` returns error

**Solutions:**
1. Check if enums already exist: `\dT` in psql
2. If exists, drop manually: `DROP TYPE taskstatus CASCADE; DROP TYPE taskpriority CASCADE;`
3. Re-run migration

### Issue: Worker Phase 3 Fails

**Symptom:** `execution_plan_status = "failed"` in database

**Check:**
1. Worker logs: `docker logs sitespector-worker --tail 200`
2. Look for AI API errors (quota, timeout)
3. Check if ai_contexts exist in results (Phase 2 must succeed first)

**Solutions:**
- If AI quota issue: Add fallback API key or wait for quota reset
- If timeout: Increase timeout in ai_client.py
- If missing data: Ensure Phase 2 completed successfully

### Issue: Tasks Not Appearing in Frontend

**Check:**
1. Verify tasks in DB: `SELECT COUNT(*) FROM audit_tasks WHERE audit_id = 'X';`
2. Check browser console for API errors
3. Check network tab for failed requests
4. Verify audit has `execution_plan_status = 'completed'`

**Solutions:**
- If 404 on /tasks endpoint: Restart backend (`docker compose restart backend`)
- If 403 forbidden: Check workspace access permissions
- If empty response: Check Phase 3 completed successfully

### Issue: Module Pages Not Showing Mode Switcher

**Reason:** Module pages haven't been refactored yet (expected)

**Solution:** Follow `IMPLEMENTATION_GUIDE_3_PHASE.md` to refactor each module

---

## Performance Monitoring

### Database Queries

```sql
-- Check task counts per audit
SELECT COUNT(*) FROM audit_tasks;

-- Check quick win distribution
SELECT is_quick_win, COUNT(*) 
FROM audit_tasks 
GROUP BY is_quick_win;

-- Check task status distribution
SELECT status, COUNT(*) 
FROM audit_tasks 
GROUP BY status;

-- Check slow queries (if any)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%audit_tasks%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### API Response Times

Monitor `/api/audits/{id}/tasks` endpoint:
- **Expected:** < 100ms for typical audit (30-80 tasks)
- **Acceptable:** < 500ms for large audit (100+ tasks)
- **Alert if:** > 1000ms

### Worker Phase 3 Duration

Monitor execution_plan step duration in processing_logs:
- **Expected:** 30-60 seconds (8 AI calls in parallel)
- **Acceptable:** Up to 90 seconds
- **Alert if:** > 120 seconds

---

## Success Criteria

### Backend
- [x] Migration applies without errors
- [x] audit_tasks table exists with correct schema
- [x] Phase 3 runs and persists tasks
- [x] All task endpoints return correct data
- [x] Quick wins auto-tagged correctly

### Frontend
- [x] ModeSwitcher component renders correctly
- [x] AnalysisView shows AI insights
- [x] TaskListView displays and filters tasks
- [x] TaskCard allows status/notes updates
- [x] Quick Wins page shows filtered tasks
- [x] Audit creation form has both toggles

### Integration
- [ ] Full audit (Phase 1 → 2 → 3) completes successfully
- [ ] Tasks appear in Quick Wins page
- [ ] Task status updates persist to database
- [ ] On-demand execution plan trigger works

### Module Refactoring (To Be Completed)
- [ ] SEO module has 3 modes
- [ ] Performance module has 3 modes
- [ ] Visibility module has 3 modes
- [ ] AI Overviews module has 3 modes
- [ ] Links module has 3 modes
- [ ] Images module has 3 modes
- [ ] UX module has 3 modes
- [ ] Security module has 3 modes

---

## Post-Deployment Tasks

### Immediate

1. **Test Phase 3 generation**
   - Create 2-3 test audits
   - Verify tasks are generated correctly
   - Check quick wins are tagged
   - Test task interactions

2. **Monitor for errors**
   - Watch worker logs for 1-2 hours
   - Check for AI failures or timeouts
   - Verify database performance

3. **Update Context7 docs**
   - Document Phase 3 in `.context7/backend/WORKER.md`
   - Document tasks in `.context7/backend/MODELS.md`
   - Add decision to `.context7/decisions/DECISIONS_LOG.md`

### Within 1 Week

1. **Complete module refactoring** (8-12 hours)
   - Follow `IMPLEMENTATION_GUIDE_3_PHASE.md`
   - Test each module after refactoring
   - Deploy incrementally

2. **User feedback**
   - Gather feedback on task quality
   - Adjust AI prompts if needed
   - Fine-tune priority/quick win logic

3. **Performance tuning**
   - Monitor query performance
   - Add indexes if needed
   - Optimize AI token usage

---

## Support & Maintenance

### Monitoring Commands

```bash
# Check audit_tasks table size
docker exec sitespector-postgres psql -U sitespector_user -d sitespector_db -c "SELECT pg_size_pretty(pg_total_relation_size('audit_tasks'));"

# Check recent execution plans
docker exec sitespector-postgres psql -U sitespector_user -d sitespector_db -c "SELECT id, url, execution_plan_status, (SELECT COUNT(*) FROM audit_tasks WHERE audit_id = audits.id) FROM audits WHERE execution_plan_status IS NOT NULL ORDER BY created_at DESC LIMIT 10;"

# Check Phase 3 errors
docker logs sitespector-worker --since 1h | grep "execution_plan" | grep -i error
```

### Regular Maintenance

- **Weekly:** Check task counts and quick win distribution
- **Monthly:** Review AI prompt quality based on user feedback
- **Quarterly:** Analyze task completion rates and adjust priorities

---

**Deployment Owner:** Dawid  
**Created:** 2026-02-14  
**Last Updated:** 2026-02-14
