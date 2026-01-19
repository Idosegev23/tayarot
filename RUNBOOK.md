# 🚨 Agent Mary - Production Runbook

## Table of Contents
1. [Emergency Contacts](#emergency-contacts)
2. [System Architecture](#system-architecture)
3. [Common Issues](#common-issues)
4. [Incident Response](#incident-response)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Recovery Procedures](#recovery-procedures)

---

## Emergency Contacts

**Team Lead:** [Your Name]
- Email: [email@example.com]
- Phone: [+972-XXX-XXXXX]

**On-Call Engineer:** [Rotating]
- Slack: #agent-mary-alerts

**External Dependencies:**
- Supabase Support: https://supabase.com/support
- Vercel Support: https://vercel.com/support
- OpenAI Status: https://status.openai.com
- Google AI Status: https://cloud.google.com/status

---

## System Architecture

```
┌─────────────┐
│   Vercel    │ ← Next.js App (Frontend + Server Actions)
└──────┬──────┘
       │
       ├─→ Supabase (Database + Storage)
       ├─→ OpenAI API (GPT-5-nano chat)
       ├─→ Gemini API (Image generation)
       └─→ Upstash Redis (Rate limiting - optional)
```

**Critical Components:**
- ✅ Next.js Application (Vercel)
- ✅ Supabase Database
- ✅ Supabase Storage (agent-mary bucket)
- ✅ OpenAI API
- ✅ Gemini API

---

## Common Issues

### 1. Site is Down / 503 Error

**Symptoms:**
- Users see "Service Unavailable"
- Health check endpoint returns 503

**Diagnosis:**
1. Check Vercel status: https://www.vercel-status.com
2. Check health endpoint: `https://tayarot.vercel.app/api/health`
3. Review Vercel logs: `vercel logs`

**Resolution:**
- If Vercel issue: Wait for platform recovery
- If code issue: Rollback to previous deployment
  ```bash
  vercel rollback
  ```
- If database issue: See [Database Connection Failure](#database-connection-failure)

---

### 2. Database Connection Failure

**Symptoms:**
- "Failed to connect to database" errors
- Health check shows database: unhealthy

**Diagnosis:**
1. Check Supabase status: https://status.supabase.com
2. Verify environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Resolution:**
1. Restart Supabase project (if paused):
   - Go to Supabase Dashboard → Project → Pause/Resume
2. Check connection pooler settings
3. Verify RLS policies are not blocking requests

---

### 3. AI API Failures

#### OpenAI Not Responding

**Symptoms:**
- Chat feature returns errors
- "Failed to get response from AI" messages

**Diagnosis:**
1. Check OpenAI status: https://status.openai.com
2. Verify API key: Vercel Dashboard → Environment Variables
3. Check rate limits: OpenAI Dashboard → Usage

**Resolution:**
1. If quota exceeded: Increase quota or wait for reset
2. If API key invalid: Generate new key and update Vercel
3. If service outage: Wait for OpenAI recovery (chat will fail gracefully)

#### Gemini Not Responding

**Symptoms:**
- Image generation fails
- "Failed to generate styled image" errors

**Diagnosis:**
1. Check Google AI status
2. Verify `GEMINI_API_KEY` in Vercel
3. Check quota: https://aistudio.google.com

**Resolution:**
1. If quota exceeded: Request quota increase
2. If rate limited: Wait or implement longer retry delays
3. Users can still create posts without AI-styled images

---

### 4. Storage/Image Upload Failures

**Symptoms:**
- Users can't upload images
- "Failed to upload image" errors

**Diagnosis:**
1. Check Supabase Storage status
2. Verify `agent-mary` bucket exists and is public
3. Check storage quota: Supabase Dashboard → Storage

**Resolution:**
1. Increase storage quota if exceeded
2. Verify bucket policies:
```sql
-- Run in Supabase SQL Editor
SELECT * FROM storage.objects WHERE bucket_id = 'agent-mary' LIMIT 10;
```
3. Re-create bucket if needed (see SETUP_GUIDE.md)

---

### 5. Rate Limiting Blocking Users

**Symptoms:**
- Users get "Too many requests" errors
- Legitimate users can't access features

**Diagnosis:**
1. Check rate limit logs in Supabase:
```sql
SELECT * FROM rate_limit_logs 
WHERE timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC 
LIMIT 100;
```
2. Identify if specific IP is causing issues

**Resolution:**
1. Temporary: Clear rate limits manually in Redis (if using Upstash)
2. Long-term: Adjust rate limits in `src/lib/rateLimiter.ts`
3. Block abusive IPs at Vercel level

---

### 6. High API Costs

**Symptoms:**
- Budget alerts triggered
- Cost tracking shows spike

**Diagnosis:**
1. Check cost tracking:
```sql
SELECT * FROM get_cost_summary('1 day'::interval);
```
2. Check for unusual activity patterns

**Resolution:**
1. Immediate: Lower daily limits in `src/lib/costTracker.ts`
2. Investigate: Check for bot activity or abuse
3. Implement stricter rate limiting

---

## Incident Response

### Severity Levels

**P0 (Critical):** Site down, data loss
- Response time: Immediate
- Escalation: All hands on deck

**P1 (High):** Core features broken, affecting all users
- Response time: < 30 minutes
- Escalation: On-call engineer + team lead

**P2 (Medium):** Some features broken, affecting some users
- Response time: < 2 hours
- Escalation: On-call engineer

**P3 (Low):** Minor issues, workarounds available
- Response time: Next business day
- Escalation: Regular ticket

### Incident Response Steps

1. **Acknowledge**
   - Confirm receipt of alert
   - Post in #agent-mary-alerts

2. **Assess**
   - Check health endpoint
   - Review Vercel logs
   - Check external dependencies

3. **Mitigate**
   - Apply temporary fix if possible
   - Rollback if recent deployment
   - Enable maintenance mode if needed

4. **Communicate**
   - Update status page
   - Notify affected users
   - Keep team informed

5. **Resolve**
   - Apply permanent fix
   - Deploy to production
   - Verify resolution

6. **Document**
   - Write post-mortem
   - Update runbook
   - Implement preventive measures

---

## Monitoring & Alerts

### Key Metrics to Monitor

**Application Health:**
- Health check endpoint status (200 = healthy)
- Response time < 2000ms
- Error rate < 1%

**AI API Usage:**
- OpenAI requests/min
- Gemini image generations/hour
- Daily costs < budget limits

**Database:**
- Connection pool utilization
- Query response time
- Storage usage

**User Activity:**
- Posts created/hour
- Chat messages/hour
- Image uploads/hour

### Setting Up Alerts

**Vercel Monitors:**
1. Go to Vercel Dashboard → Monitoring
2. Add checks for:
   - `https://tayarot.vercel.app` (uptime)
   - `https://tayarot.vercel.app/api/health` (health)

**Supabase Alerts:**
1. Enable email alerts for:
   - Database usage > 80%
   - Storage usage > 80%
   - Query errors

---

## Recovery Procedures

### Rollback to Previous Version

```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]

# Or rollback to previous
vercel rollback
```

### Database Recovery

**From Automatic Backup (Supabase Pro):**
1. Go to Supabase Dashboard → Database → Backups
2. Select backup point
3. Click "Restore"

**From Manual Export:**
1. SSH to backup location
2. Download latest backup file
3. Run restore script:
```bash
psql -h db.PROJECT.supabase.co -U postgres -d postgres < backup.sql
```

### Clear All Rate Limits (Emergency)

If rate limiting is blocking legitimate traffic:

```sql
-- In Supabase SQL Editor
DELETE FROM rate_limit_logs WHERE timestamp > NOW() - INTERVAL '1 hour';
```

Or if using Redis:
```bash
# Flush all rate limit keys
redis-cli --url $UPSTASH_REDIS_REST_URL FLUSHDB
```

### Reset Cost Tracking

If cost tracking is causing false alerts:

```sql
-- View current costs
SELECT * FROM get_cost_summary('1 day'::interval);

-- Reset if needed (use with caution)
DELETE FROM cost_tracking WHERE timestamp > NOW() - INTERVAL '1 day';
```

---

## Quick Reference Commands

```bash
# View Vercel logs
vercel logs --follow

# Check deployment status
vercel inspect [deployment-url]

# Run health check
curl https://tayarot.vercel.app/api/health

# View environment variables
vercel env ls

# Add/update environment variable
vercel env add VARIABLE_NAME

# Redeploy
vercel --prod
```

---

## Post-Incident Checklist

- [ ] Incident resolved and verified
- [ ] Root cause identified
- [ ] Post-mortem written
- [ ] Preventive measures implemented
- [ ] Documentation updated
- [ ] Team debriefed
- [ ] Monitoring adjusted if needed

---

**Last Updated:** January 2026
**Maintained by:** Agent Mary Team
