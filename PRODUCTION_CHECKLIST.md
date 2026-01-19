# ✅ Production Deployment Checklist

## Pre-Launch Checklist

Use this checklist before deploying Agent Mary to production.

---

## 1. Environment Configuration

### Vercel Environment Variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set to production Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set to production anon key
- [ ] `OPENAI_API_KEY` - Valid OpenAI API key with sufficient quota
- [ ] `GEMINI_API_KEY` - Valid Google Gemini API key with sufficient quota
- [ ] `UPSTASH_REDIS_REST_URL` - (Optional) For rate limiting
- [ ] `UPSTASH_REDIS_REST_TOKEN` - (Optional) For rate limiting

**Verification:**
```bash
# Check all env vars are set
vercel env ls

# Test locally with production env
vercel env pull .env.local
npm run build
```

---

## 2. Supabase Configuration

### Database

- [ ] Production Supabase project created
- [ ] All migrations run successfully:
  - `001_init.sql` - Core schema
  - `002_rate_limiting.sql` - Rate limiting tables
  - `003_cost_tracking.sql` - Cost tracking tables
- [ ] Indexes created and verified
- [ ] RLS policies enabled and tested
- [ ] Connection pooler configured
- [ ] Backup schedule enabled (daily recommended)

**Verification:**
```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should return: access_keys, app_settings, cost_tracking, guides, posts, rate_limit_logs
```

### Storage

- [ ] `agent-mary` bucket created
- [ ] Bucket set to PUBLIC
- [ ] Storage policies configured:
  - Allow INSERT for all
  - Allow SELECT for all
  - Allow DELETE for all
- [ ] File size limits set (50MB recommended)
- [ ] MIME types restricted to images only

**Verification:**
```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE name = 'agent-mary';

-- Test upload (via UI or API)
```

### Demo Data Removal

- [ ] Demo guides removed or replaced with real guides
- [ ] Demo access keys regenerated with secure random values
- [ ] Test posts removed
- [ ] App settings updated with production values

**SQL Script:**
```sql
-- Remove demo data
DELETE FROM posts WHERE guide_id IN (SELECT id FROM guides WHERE slug IN ('sarah', 'david'));
DELETE FROM access_keys WHERE key LIKE 'ak_demo%' OR key LIKE 'ak_sarah%' OR key LIKE 'ak_david%';
DELETE FROM guides WHERE slug IN ('sarah', 'david');

-- Verify cleanup
SELECT COUNT(*) FROM posts; -- Should be 0 or real posts only
SELECT COUNT(*) FROM guides; -- Should be 0 or real guides only
```

---

## 3. Next.js / Vercel Configuration

### Build & Deploy

- [ ] Production build passes without errors
- [ ] TypeScript compilation successful
- [ ] All linter errors resolved
- [ ] No console.log statements in production code (use logger instead)
- [ ] Bundle size reasonable (< 500KB for main bundle)

**Verification:**
```bash
npm run build
npm run lint
```

### Vercel Project Settings

- [ ] Project name set correctly
- [ ] Custom domain configured (if applicable)
- [ ] HTTPS enforced
- [ ] Auto-assign domains disabled (if using custom domain)
- [ ] Environment variables set for Production environment
- [ ] Deployment protection enabled (optional)

### Security Headers

- [ ] Security headers configured in `next.config.ts`
- [ ] Test headers: https://securityheaders.com
- [ ] Expected headers:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
  - Strict-Transport-Security
  - Permissions-Policy

---

## 4. AI APIs Configuration

### OpenAI

- [ ] Production API key generated
- [ ] Usage limits configured
- [ ] Billing alerts set up
- [ ] Rate limits understood (10 RPM for free tier)
- [ ] Test API key works:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Google Gemini

- [ ] Production API key generated
- [ ] Project quota verified
- [ ] Billing enabled (if needed)
- [ ] Test API key works:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
```

### Cost Monitoring

- [ ] Daily budget limits set in `src/lib/costTracker.ts`
- [ ] Budget alerts configured
- [ ] Cost tracking table verified:

```sql
SELECT * FROM get_cost_summary('1 day'::interval);
```

---

## 5. Rate Limiting (Optional but Recommended)

### Upstash Redis

- [ ] Upstash account created
- [ ] Redis database provisioned
- [ ] REST URL and token copied to Vercel
- [ ] Test connection:

```bash
curl $UPSTASH_REDIS_REST_URL/ping \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

### Rate Limit Configuration

- [ ] Rate limits configured in `src/lib/rateLimiter.ts`
- [ ] Limits tested with multiple requests
- [ ] Rate limit logs table working:

```sql
SELECT * FROM rate_limit_logs ORDER BY timestamp DESC LIMIT 10;
```

---

## 6. Monitoring & Analytics

### Vercel Analytics

- [ ] Vercel Analytics enabled (free tier available)
- [ ] Web Vitals tracking active
- [ ] Check: Vercel Dashboard → Analytics

### Health Check

- [ ] Health check endpoint accessible: `/api/health`
- [ ] Returns 200 when all services healthy
- [ ] Test:

```bash
curl https://tayarot.vercel.app/api/health
```

### Logging

- [ ] Structured logging implemented
- [ ] Logs viewable in Vercel Dashboard → Logs
- [ ] Error logging working
- [ ] Test by triggering an error

---

## 7. SEO & Discoverability

### SEO Basics

- [ ] `robots.txt` present in `/public`
- [ ] Sitemap generating correctly: `/sitemap.xml`
- [ ] Open Graph metadata configured
- [ ] Favicon and app icons set
- [ ] PWA manifest configured

**Verification:**
```bash
# Check robots.txt
curl https://tayarot.vercel.app/robots.txt

# Check sitemap
curl https://tayarot.vercel.app/sitemap.xml

# Test Open Graph
# Use: https://www.opengraph.xyz/url/https%3A%2F%2Ftayarot.vercel.app
```

### Performance

- [ ] Lighthouse score > 90
- [ ] Core Web Vitals passing
- [ ] Images optimized (WebP/AVIF)
- [ ] Lazy loading enabled

**Run Lighthouse:**
```bash
npx lighthouse https://tayarot.vercel.app --view
```

---

## 8. Security

### Authentication & Access Control

- [ ] Access keys secure and random
- [ ] No default/demo keys in production
- [ ] Access validation working on all dashboards
- [ ] Test with invalid key (should be denied)

### Data Security

- [ ] RLS policies enabled on all tables
- [ ] No sensitive data exposed in client-side code
- [ ] API keys not committed to git
- [ ] `.env.local` in `.gitignore`

### HTTPS & Headers

- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Security headers validated
- [ ] CORS configured correctly

---

## 9. User Acceptance Testing

### Tourist Flow

- [ ] Can access guide page without auth
- [ ] Chat with Mary works
- [ ] Can upload images (with compression)
- [ ] Can create posts with AI styling
- [ ] Sharing buttons work
- [ ] Mobile experience smooth

### Guide Dashboard

- [ ] Can access with valid access key
- [ ] Can view pending posts
- [ ] Can approve/reject posts
- [ ] Can share to Facebook
- [ ] Stats display correctly

### Admin Dashboard

- [ ] Can access with admin key
- [ ] Can view all guides and posts
- [ ] Can manage access keys
- [ ] Can view system settings

### Ministry Dashboard

- [ ] Can access with tourism key
- [ ] Can view all posts (read-only)
- [ ] Cannot modify anything

---

## 10. Performance & Load Testing

### Basic Load Test

- [ ] Test with 10 concurrent users
- [ ] Test image uploads (multiple simultaneously)
- [ ] Test AI generation under load
- [ ] Monitor response times
- [ ] Check for memory leaks

**Simple load test:**
```bash
# Install Apache Bench
brew install apache2  # macOS
sudo apt-get install apache2-utils  # Linux

# Test
ab -n 100 -c 10 https://tayarot.vercel.app/
```

### Database Performance

- [ ] Query response times < 100ms
- [ ] Connection pool not exhausted
- [ ] Indexes being used (check query plans)

---

## 11. Backup & Recovery

### Backup Strategy

- [ ] Supabase automatic backups enabled
- [ ] Backup retention policy set (30 days recommended)
- [ ] Point-in-time recovery available (Supabase Pro)
- [ ] Manual backup process documented

### Recovery Testing

- [ ] Tested database restore from backup
- [ ] Tested rollback to previous Vercel deployment
- [ ] Recovery procedures documented in RUNBOOK.md

---

## 12. Documentation

### Required Documents

- [ ] README.md updated with production info
- [ ] SETUP_GUIDE.md reflects production setup
- [ ] USER_GUIDE.md available for end users
- [ ] RUNBOOK.md created for incident response
- [ ] This PRODUCTION_CHECKLIST.md completed
- [ ] ACCESS_LINKS.md updated with production URLs

### Team Knowledge

- [ ] Team trained on deployment process
- [ ] On-call rotation established
- [ ] Emergency contacts documented
- [ ] Escalation procedures defined

---

## 13. Legal & Compliance

### Terms & Privacy

- [ ] Terms of Service added (if required)
- [ ] Privacy Policy added (if required)
- [ ] Cookie consent (if applicable for region)
- [ ] Data processing agreements signed

### Third-Party Compliance

- [ ] OpenAI Terms accepted
- [ ] Google AI Terms accepted
- [ ] Supabase Terms accepted
- [ ] Vercel Terms accepted

---

## 14. Final Pre-Launch Steps

### 24 Hours Before Launch

- [ ] All checklist items above completed
- [ ] Staging environment tested end-to-end
- [ ] Team briefed on launch plan
- [ ] Rollback plan prepared
- [ ] Monitoring dashboards ready
- [ ] Support channels prepared

### Launch Day

- [ ] Deploy to production during low-traffic hours
- [ ] Monitor for 1 hour post-deployment
- [ ] Check all critical user flows
- [ ] Verify health check passing
- [ ] Announce launch to users
- [ ] Monitor logs and metrics closely

### Post-Launch (First Week)

- [ ] Daily monitoring of key metrics
- [ ] Review error logs daily
- [ ] Check AI costs daily
- [ ] Gather user feedback
- [ ] Address any issues promptly
- [ ] Celebrate with team! 🎉

---

## Emergency Rollback Plan

If critical issues arise post-launch:

1. **Immediate:**
   ```bash
   vercel rollback
   ```

2. **Communicate:**
   - Update status page
   - Notify users
   - Inform team

3. **Investigate:**
   - Check logs
   - Identify root cause
   - Plan fix

4. **Fix & Redeploy:**
   - Apply fix
   - Test thoroughly
   - Redeploy to production

---

## Sign-Off

**Deployment Date:** _________________

**Deployed By:** _________________

**Reviewed By:** _________________

**Approved By:** _________________

---

**Last Updated:** January 2026
**Version:** 1.0
