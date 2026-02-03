# SiteSpector - Worker Process

## Overview

The **Worker** is a background Python process that polls for pending audits and processes them asynchronously.

**Location**: `backend/worker.py`

**Container**: `sitespector-worker` (shares backend codebase)

**Command**: `python worker.py`

---

## Worker Architecture

### Main Loop

```python
async def worker_loop():
    """Main worker loop that polls for pending audits every 10 seconds."""
    
    processing_audits = set()  # Track currently processing audit IDs
    
    while True:
        # 1. Fetch PENDING audits (max 3)
        pending_audits = await get_pending_audits(limit=3)
        
        # 2. Process each in parallel (asyncio.gather)
        for audit in pending_audits:
            if audit.id not in processing_audits:
                processing_audits.add(audit.id)
                asyncio.create_task(
                    process_audit_with_cleanup(audit.id, processing_audits)
                )
        
        # 3. Check for timeout audits (> 30 minutes processing)
        timeout_audits = await get_timeout_audits()
        for audit in timeout_audits:
            await mark_audit_failed(audit.id, "Audit timed out")
        
        # 4. Sleep before next poll
        await asyncio.sleep(10)  # Poll interval: 10 seconds
```

---

## Audit Processing Flow

### Step-by-Step Process

**Function**: `async def process_audit(audit_id: str)`

#### 1. Update Status to PROCESSING

```python
audit.status = AuditStatus.PROCESSING
audit.started_at = datetime.utcnow()
await db.commit()
```

#### 2. Screaming Frog Crawl (10-30 seconds)

```python
crawl_data = await screaming_frog.crawl_url(audit.url)

# Returns:
{
  "title": "...",
  "meta_description": "...",
  "h1_tags": ["..."],
  "total_images": 12,
  "images_without_alt": 2,
  "word_count": 850,
  # ... more fields
}
```

**Execution**: Docker exec to `sitespector-screaming-frog` container

**Fallback**: If Screaming Frog fails (license, timeout), use HTTP crawler

#### 3. Lighthouse Audits (20-40 seconds)

```python
lighthouse_data = await lighthouse.audit_both(audit.url)

# Returns:
{
  "desktop": {
    "performance_score": 85,
    "accessibility_score": 92,
    "ttfb": 450,
    "lcp": 2100,
    # ... more metrics
  },
  "mobile": {
    "performance_score": 78,
    # ... more metrics
  }
}
```

**Execution**: 2 parallel Docker execs (desktop + mobile)

**Strategies**: Desktop emulation + Mobile emulation

#### 4. Process Competitors (Parallel)

```python
competitors = await db.get_competitors(audit_id)

if competitors:
    competitor_tasks = [
        process_competitor(comp, db) 
        for comp in competitors
    ]
    await asyncio.gather(*competitor_tasks, return_exceptions=True)
```

**Per competitor**:
- Lighthouse audit (desktop only)
- Save results to `competitor.results`

#### 5. AI Analysis (10-20 seconds)

```python
# 4 parallel Gemini API calls
content_analysis = await ai_analysis.analyze_content(crawl_data)
local_seo_analysis = await ai_analysis.analyze_local_seo(crawl_data)
performance_analysis = await ai_analysis.analyze_performance(lighthouse_data)

# Competitive analysis (uses competitor results)
competitor_data = [c.results for c in competitors if c.results]
competitive_analysis = await ai_analysis.analyze_competitive(
    {"crawl": crawl_data, "lighthouse": lighthouse_data},
    competitor_data
)
```

**Each function returns**:
- Recommendations (list of strings)
- Scores (quality_score, etc.)
- Issues (list of problems detected)

#### 6. Calculate Scores

```python
# SEO Score (0-100)
seo_score = calculate_seo_score(crawl_data, lighthouse_data['desktop'])

# Performance Score (0-100)
performance_score = lighthouse_data['desktop']['performance_score']

# Content Score (0-100)
content_score = content_analysis['quality_score']

# Overall Score (average)
overall_score = (seo_score + performance_score + content_score) / 3
```

**SEO Scoring Logic** (`calculate_seo_score()`):

```python
score = 100.0

# Title tag (20 points)
if not title:
    score -= 20
elif title_length < 30 or title_length > 70:
    score -= 10

# Meta description (15 points)
if not meta_description:
    score -= 15
elif meta_length < 120 or meta_length > 170:
    score -= 8

# H1 tag (15 points)
if h1_count == 0:
    score -= 15
elif h1_count > 1:
    score -= 10

# Images with ALT (10 points)
if total_images > 0 and images_without_alt > 0:
    penalty = min(10, (images_without_alt / total_images) * 10)
    score -= penalty

# Sitemap (10 points)
if not has_sitemap:
    score -= 10

# Lighthouse SEO score (30 points)
score = (score * 0.7) + (lighthouse_seo_score * 0.3)

return max(0.0, min(100.0, score))
```

#### 7. Save Results to Database

```python
audit.status = AuditStatus.COMPLETED
audit.overall_score = overall_score
audit.seo_score = seo_score
audit.performance_score = performance_score
audit.content_score = content_score
audit.is_local_business = local_seo_analysis['is_local_business']
audit.results = {
    "crawl": crawl_data,
    "lighthouse": lighthouse_data,
    "content_analysis": content_analysis,
    "local_seo": local_seo_analysis,
    "performance_analysis": performance_analysis,
    "competitive_analysis": competitive_analysis,
}
audit.completed_at = datetime.utcnow()

await db.commit()
```

---

## Worker Configuration

**Location**: `backend/app/config.py`

```python
# Worker settings
WORKER_POLL_INTERVAL = 10  # seconds
WORKER_MAX_CONCURRENT_AUDITS = 3  # max parallel audits
AUDIT_TIMEOUT_MINUTES = 10  # mark as failed after 10 minutes
```

---

## Concurrency Strategy

### Parallel Processing

**3 audits at once**:
- Worker fetches max 3 PENDING audits
- Each processed in separate asyncio task
- Tasks run concurrently (non-blocking I/O)

**Within each audit**:
- Desktop + Mobile Lighthouse: Parallel
- Competitors: Parallel
- AI calls: Sequential (Gemini rate limit)

**Why 3?** - Balance between throughput and VPS resources (8GB RAM)

---

## Error Handling

### Audit-Level Errors

If any step fails (Screaming Frog, Lighthouse, AI):

```python
try:
    await process_audit(audit_id)
except Exception as e:
    logger.error(f"❌ Error processing audit {audit_id}: {e}")
    
    audit.status = AuditStatus.FAILED
    audit.error_message = str(e)
    audit.completed_at = datetime.utcnow()
    await db.commit()
```

**Result**: Audit marked as FAILED, error message stored

### Competitor-Level Errors

```python
# In process_competitor()
try:
    lighthouse_data = await lighthouse.audit_url(competitor.url, "desktop")
    competitor.results = {"lighthouse": lighthouse_data}
    competitor.status = CompetitorStatus.COMPLETED
except Exception as e:
    logger.error(f"❌ Error processing competitor {competitor.url}: {e}")
    competitor.status = CompetitorStatus.FAILED
    
await db.commit()
```

**Result**: Competitor marked as FAILED, main audit continues

### Timeout Handling

```python
# In worker_loop()
timeout_threshold = datetime.utcnow() - timedelta(minutes=10)

timeout_audits = await db.execute(
    select(Audit)
    .where(Audit.status == AuditStatus.PROCESSING)
    .where(Audit.started_at < timeout_threshold)
)

for audit in timeout_audits:
    audit.status = AuditStatus.FAILED
    audit.error_message = "Audit timed out"
    audit.completed_at = datetime.utcnow()

await db.commit()
```

**Why 10 minutes?** - Worst case: large site + 3 competitors + slow responses

---

## Logging

**Level**: INFO (production), DEBUG (development)

**Format**: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`

**Key log messages**:
```
INFO: 🚀 Starting SiteSpector worker...
INFO: Processing audit 85d6ee6f... for URL: https://example.com
INFO: [85d6ee6f] Running Screaming Frog crawl...
INFO: [85d6ee6f] Running Lighthouse audits...
INFO: [85d6ee6f] Processing 3 competitors...
INFO: [85d6ee6f] Running AI analysis...
INFO: ✅ Audit 85d6ee6f completed successfully (score: 85.5)
ERROR: ❌ Error processing audit 85d6ee6f: Connection timeout
```

---

## Monitoring

### Check Worker Status

```bash
# Is worker running?
docker ps | grep worker

# View logs
docker logs sitespector-worker --tail 100 -f

# Check for processing audits
docker exec sitespector-worker python -c "from app.models import Audit; print('Worker alive')"
```

### Database Queries

```sql
-- Audits currently processing
SELECT id, url, status, started_at 
FROM audits 
WHERE status = 'processing';

-- Average processing time
SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) AS avg_seconds
FROM audits 
WHERE status = 'completed';

-- Failed audits
SELECT id, url, error_message
FROM audits
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Performance Metrics

**Typical audit timing** (single audit, no competitors):
- Screaming Frog: 10-30s
- Lighthouse (desktop + mobile): 20-40s
- AI analysis: 10-20s
- Score calculation: <1s
- Database save: <1s

**Total**: 40-90 seconds per audit

**With 3 competitors**:
- Main audit: 40-90s
- Each competitor: 20-30s (Lighthouse only)
- Total: 100-180 seconds (1.5-3 minutes)

---

## Docker Integration

### Docker Exec for External Tools

**Screaming Frog**:
```python
cmd = [
    "docker", "exec", "sitespector-screaming-frog",
    "/usr/local/bin/crawl.sh", url
]

process = await asyncio.create_subprocess_exec(
    *cmd,
    stdout=asyncio.subprocess.PIPE,
    stderr=asyncio.subprocess.PIPE
)

stdout, stderr = await process.communicate()
```

**Lighthouse**:
```python
cmd = [
    "docker", "exec", "sitespector-lighthouse",
    "lighthouse", url,
    "--output=json",
    "--emulated-form-factor=desktop"
]

process = await asyncio.create_subprocess_exec(
    *cmd,
    stdout=asyncio.subprocess.PIPE,
    stderr=asyncio.subprocess.PIPE
)

stdout, stderr = await process.communicate()
```

---

## Scaling Considerations

### Current Bottlenecks

1. **Worker concurrency**: Limited to 3 audits (VPS RAM constraint)
2. **Screaming Frog**: CPU-intensive (10-30s per crawl)
3. **Lighthouse**: CPU-intensive (20-40s per audit)
4. **Database polling**: Every 10 seconds (not a bottleneck yet)

### Future Scaling Options

**Horizontal scaling** (not needed for MVP):
- Multiple worker containers
- Redis queue instead of DB polling
- Dedicated Screaming Frog + Lighthouse runners

**Vertical scaling** (easier):
- Upgrade VPS to 16GB RAM → increase concurrency to 6-10 audits
- Faster CPU → reduce Screaming Frog/Lighthouse time

---

## Debugging

### Enable Debug Logging

```bash
# Edit /opt/sitespector/.env
LOG_LEVEL=DEBUG

# Restart worker
docker compose -f docker-compose.prod.yml restart worker
```

### Run Worker Manually

```bash
# Exec into backend container
docker exec -it sitespector-backend bash

# Run worker in foreground
python worker.py
```

### Test Single Audit Processing

```python
# In Python shell
import asyncio
from worker import process_audit

async def test():
    await process_audit("85d6ee6f-8c55-4c98-abd8-60dedfafa9df")

asyncio.run(test())
```

---

**Last Updated**: 2025-02-03  
**Container**: sitespector-worker  
**Poll interval**: 10 seconds  
**Max concurrent**: 3 audits  
**Timeout**: 10 minutes
