# 💾 Backup Strategy - Agent Mary

## Overview

This document outlines the backup and disaster recovery strategy for the Agent Mary application.

---

## Backup Components

### 1. Database (Supabase Postgres)

**What to Backup:**
- All tables: `guides`, `posts`, `access_keys`, `app_settings`, `rate_limit_logs`, `cost_tracking`
- Database schema and functions
- RLS policies

**Backup Methods:**

#### Automatic Backups (Supabase Pro Required)

Supabase Pro provides:
- Daily automated backups
- Point-in-time recovery (PITR)
- 7-day retention (or more)

**Setup:**
1. Upgrade to Supabase Pro plan
2. Go to Database → Backups
3. Enable automatic backups
4. Configure retention period (30 days recommended)

#### Manual Export (Free Tier)

For free tier or additional safety:

```bash
# Export all tables
pg_dump -h db.PROJECT.supabase.co \
  -U postgres \
  -d postgres \
  --clean \
  --if-exists \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use Supabase CLI
supabase db dump --local > backup.sql
```

**Automation Script:**
```bash
#!/bin/bash
# Save as: scripts/backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/agent-mary-db-$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Export database
pg_dump -h $SUPABASE_DB_HOST \
  -U $SUPABASE_DB_USER \
  -d $SUPABASE_DB_NAME \
  --clean \
  --if-exists \
  > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload to cloud storage (example: AWS S3)
# aws s3 cp $BACKUP_FILE.gz s3://agent-mary-backups/database/

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Schedule (using cron):**
```cron
# Run daily at 2 AM
0 2 * * * /path/to/scripts/backup-database.sh >> /var/log/backup.log 2>&1
```

---

### 2. Storage (Supabase Storage)

**What to Backup:**
- All uploaded images in `agent-mary` bucket
- Generated AI-styled images

**Backup Methods:**

#### Using Supabase CLI

```bash
# List all files
supabase storage list agent-mary

# Download all files
supabase storage download agent-mary \
  --recursive \
  --destination ./backups/storage/
```

#### Using Script

```bash
#!/bin/bash
# Save as: scripts/backup-storage.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/storage/$DATE"

mkdir -p $BACKUP_DIR

# List and download all files from bucket
supabase storage list agent-mary --recursive | \
  while read file; do
    supabase storage download agent-mary/$file \
      --destination $BACKUP_DIR/$file
  done

# Compress
tar -czf "$BACKUP_DIR.tar.gz" -C ./backups/storage $DATE

# Upload to cloud storage
# aws s3 cp "$BACKUP_DIR.tar.gz" s3://agent-mary-backups/storage/

# Cleanup
rm -rf $BACKUP_DIR

echo "Storage backup completed: $BACKUP_DIR.tar.gz"
```

**Schedule:**
```cron
# Run weekly on Sunday at 3 AM
0 3 * * 0 /path/to/scripts/backup-storage.sh >> /var/log/backup.log 2>&1
```

---

### 3. Environment Configuration

**What to Backup:**
- Environment variables
- Vercel configuration
- Deployment settings

**Backup Method:**

```bash
#!/bin/bash
# Save as: scripts/backup-config.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/config"
BACKUP_FILE="$BACKUP_DIR/config-$DATE.json"

mkdir -p $BACKUP_DIR

# Export Vercel environment variables
vercel env pull .env.production

# Save as JSON
cat .env.production > $BACKUP_FILE

# Encrypt sensitive data
gpg --encrypt --recipient your-email@example.com $BACKUP_FILE

# Upload encrypted file
# aws s3 cp $BACKUP_FILE.gpg s3://agent-mary-backups/config/

echo "Config backup completed: $BACKUP_FILE.gpg"
```

---

## Backup Schedule

| Component | Frequency | Retention | Method |
|-----------|-----------|-----------|--------|
| Database | Daily | 30 days | Auto (Supabase Pro) or Manual Script |
| Storage | Weekly | 60 days | Manual Script |
| Configuration | On Change | Indefinite | Manual Script |
| Code | Continuous | Indefinite | Git (GitHub) |

---

## Storage Locations

### Primary Backups

- **Database:** Supabase automatic backups (if Pro)
- **Storage:** Local + Cloud (S3/GCS recommended)
- **Code:** GitHub repository

### Secondary Backups (Recommended)

- **Off-site:** AWS S3 / Google Cloud Storage / Azure Blob
- **Local:** External hard drive (encrypted)
- **Geographic:** Multiple regions

**Example S3 Structure:**
```
s3://agent-mary-backups/
├── database/
│   ├── agent-mary-db-20260119_020000.sql.gz
│   ├── agent-mary-db-20260118_020000.sql.gz
│   └── ...
├── storage/
│   ├── storage-20260119_030000.tar.gz
│   ├── storage-20260112_030000.tar.gz
│   └── ...
└── config/
    ├── config-20260119_120000.json.gpg
    └── ...
```

---

## Recovery Procedures

### Database Recovery

#### From Supabase Automatic Backup (Pro)

1. Go to Supabase Dashboard → Database → Backups
2. Select restore point
3. Click "Restore to a new project" or "Restore in-place"
4. Wait for restoration (5-30 minutes)
5. Verify data integrity

#### From Manual Backup

```bash
# Download backup
aws s3 cp s3://agent-mary-backups/database/backup.sql.gz ./

# Decompress
gunzip backup.sql.gz

# Restore
psql -h db.PROJECT.supabase.co \
  -U postgres \
  -d postgres \
  < backup.sql

# Verify
psql -h db.PROJECT.supabase.co \
  -U postgres \
  -d postgres \
  -c "SELECT COUNT(*) FROM posts;"
```

**Estimated Recovery Time:** 10-30 minutes depending on database size

---

### Storage Recovery

```bash
# Download backup
aws s3 cp s3://agent-mary-backups/storage/storage-latest.tar.gz ./

# Extract
tar -xzf storage-latest.tar.gz

# Upload to Supabase
for file in $(find ./storage -type f); do
  supabase storage upload agent-mary $file
done
```

**Estimated Recovery Time:** 30-60 minutes depending on file count

---

### Application Recovery (Vercel)

#### Rollback to Previous Deployment

```bash
# List recent deployments
vercel ls

# Rollback
vercel rollback [deployment-url]
```

**Estimated Recovery Time:** 2-5 minutes

#### Redeploy from Git

```bash
# Checkout last known good commit
git checkout [commit-hash]

# Deploy
vercel --prod

# Or trigger deployment from GitHub
# Push to main branch or create release
```

**Estimated Recovery Time:** 5-10 minutes

---

## Testing Backups

### Monthly Backup Test

Perform the following test monthly:

1. **Database:**
   - Restore latest backup to test environment
   - Verify all tables present
   - Check row counts match production
   - Run sample queries

2. **Storage:**
   - Download random sample of files
   - Verify files are not corrupted
   - Check file sizes match

3. **Full Recovery Drill (Quarterly):**
   - Restore complete system to staging
   - Test all user flows
   - Verify data integrity
   - Document any issues

**Test Checklist:**
```markdown
- [ ] Database backup downloaded successfully
- [ ] Database restored without errors
- [ ] All tables present
- [ ] Row counts verified
- [ ] Storage files accessible
- [ ] Sample files not corrupted
- [ ] Environment config backed up
- [ ] Recovery time within SLA
- [ ] Issues documented
```

---

## Disaster Recovery Plan

### Scenario 1: Database Corruption

**Detection:**
- Health check fails
- Query errors in logs
- Data inconsistencies reported

**Response:**
1. Stop write operations (if possible)
2. Assess extent of corruption
3. Restore from latest backup
4. Verify integrity
5. Resume operations
6. Investigate cause

**RTO:** 30 minutes
**RPO:** 24 hours (daily backups)

---

### Scenario 2: Accidental Data Deletion

**Detection:**
- User reports missing data
- Audit logs show deletion

**Response:**
1. Identify what was deleted
2. Find backup containing data
3. Extract specific data
4. Restore to production
5. Verify with user

**RTO:** 1 hour
**RPO:** 24 hours

---

### Scenario 3: Complete Data Center Failure

**Detection:**
- Supabase region outage
- Total service unavailability

**Response:**
1. Activate DR plan
2. Spin up new Supabase project in different region
3. Restore database from S3 backup
4. Restore storage files
5. Update Vercel environment variables
6. Redeploy application
7. Update DNS (if needed)

**RTO:** 4 hours
**RPO:** 24 hours

---

## Monitoring & Alerts

### Backup Success Monitoring

- [ ] Set up alerts for backup failures
- [ ] Monitor backup file sizes
- [ ] Track backup duration
- [ ] Verify backup integrity

**Example Alert (Slack/Email):**
```
⚠️ Database backup failed!
Date: 2026-01-19 02:00:00
Error: Connection timeout
Action: Manual intervention required
```

---

## Compliance & Security

### Encryption

- [ ] Encrypt backups at rest
- [ ] Encrypt during transfer (SSL/TLS)
- [ ] Use strong encryption keys (AES-256)
- [ ] Rotate encryption keys annually

### Access Control

- [ ] Limit backup access to authorized personnel
- [ ] Use IAM roles (not access keys)
- [ ] Enable MFA for backup systems
- [ ] Audit backup access logs

### Retention Policy

- Database: 30 days
- Storage: 60 days
- Configuration: Indefinite (encrypted)
- Audit Logs: 90 days

---

## Cost Estimation

| Service | Cost | Notes |
|---------|------|-------|
| Supabase Pro (with backups) | ~$25/month | Includes PITR |
| AWS S3 Storage (100GB) | ~$2-3/month | Off-site backups |
| Backup automation scripts | Free | Self-hosted |

**Total Estimated Cost:** ~$30/month

---

## Contacts

**Backup Administrator:** [Your Name]
**Email:** [email@example.com]
**Phone:** [+972-XXX-XXXXX]

**Backup Repository:** s3://agent-mary-backups/
**Monitoring Dashboard:** [URL]

---

**Last Updated:** January 2026
**Next Review:** April 2026
