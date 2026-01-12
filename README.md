# Agent Mary Demo

An interactive demonstration system for tourism content creation, enabling tourists to upload photos and authentic reviews which tour guides can approve and publish.

## Overview

Agent Mary is a demo application showcasing an end-to-end content creation flow:
- **Tourists** share experiences via personal guide links (public access)
- **Guides** review and approve tourist-generated content (secret dashboard access)
- **Ministry of Tourism** views aggregated content across all guides (secret dashboard access)
- **Admin** configures the system and manages access (secret dashboard access)

### Key Features

- Real image uploads and storage (Supabase)
- "Holy Land Edition" posts with biblical verses
- Simulated social media publishing (no real APIs)
- Mobile-first, premium UI design
- Secret-link based access control (no login required)

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (Postgres + Storage)
- **Deployment**: Vercel-ready
- **UI Components**: Custom design system with Lucide React icons

## Project Structure

```
tayarot/
├── src/app/
│   ├── g/[guideSlug]/           # Tourist-facing routes
│   │   ├── page.tsx              # Landing page
│   │   ├── create/page.tsx       # Create post flow
│   │   └── post/[postId]/page.tsx # Post preview
│   ├── d/                        # Dashboard routes (protected)
│   │   ├── guide/[guideSlug]/page.tsx
│   │   ├── tourism/page.tsx
│   │   └── admin/page.tsx
│   ├── actions/                  # Server Actions
│   │   ├── createPost.ts
│   │   ├── updatePostStatus.ts
│   │   └── adminActions.ts
│   └── layout.tsx
├── components/
│   ├── ui/                       # Design system components
│   │   ├── AppHeader.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Chip.tsx
│   │   └── Toast.tsx
│   ├── ImageUploader.tsx
│   ├── PostPreview.tsx
│   ├── ShareModal.tsx
│   ├── LoadingState.tsx
│   └── EmptyState.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── access.ts
│   ├── constants.ts
│   ├── types.ts
│   └── utils.ts
└── migrations/
    └── 001_init.sql
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- npm or yarn package manager

### 2. Clone and Install

```bash
cd tayarot
npm install
```

### 3. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database provisioning

### 4. Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Copy the contents of `migrations/001_init.sql`
3. Paste and run the SQL
4. Verify tables were created in **Table Editor**

### 5. Create Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Create a new bucket named `agent-mary`
3. Set the bucket to **Public**
4. Set policies to allow INSERT, SELECT, and DELETE for all users

### 6. Configure Environment Variables

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon/public key**
3. Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 7. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Initial Setup & Demo Data

### Option 1: Auto-Seed Demo Data

1. You need an admin access key first. Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO access_keys (key, role, guide_id, active, label)
VALUES ('ak_demo_admin_key_12345', 'admin', NULL, true, 'Initial Admin Access');
```

2. Visit [http://localhost:3000/d/admin?k=ak_demo_admin_key_12345](http://localhost:3000/d/admin?k=ak_demo_admin_key_12345)
3. Go to **Seed Data** tab
4. Click **Seed Demo Data**
5. This creates:
   - 2 guides: Sarah Cohen, David Levi
   - 4 access keys (guide keys for each + tourism + admin)
   - 4 sample posts with images

### Option 2: Manual Setup

1. Use the admin panel to create guides manually
2. Generate access keys for each role
3. Use tourist flow to create posts

## Usage

### Tourist Flow

1. Navigate to `/g/{guide-slug}` (e.g., `/g/sarah`)
2. Click "Start Sharing"
3. Fill in the form:
   - Name (optional)
   - Location (dropdown)
   - Upload 1-5 photos
   - Write experience text
   - Choose style (Regular or Holy Land Edition)
4. Submit and view post preview
5. "Publish to Guide Page" (simulated)
6. "Share on My Page" (simulated modal)

### Guide Dashboard

1. Copy guide dashboard link from Admin → Access Keys
2. Format: `/d/guide/{slug}?k={access-key}`
3. View KPIs and post list
4. Approve drafts or mark as published
5. Filter by status or location

### Tourism Dashboard

1. Copy tourism dashboard link from Admin → Access Keys
2. Format: `/d/tourism?k={access-key}`
3. View aggregated stats
4. Browse gallery of posts
5. Filter by guide, location, or status
6. Click images to view full post details

### Admin Dashboard

1. Use admin access key
2. Format: `/d/admin?k={access-key}`
3. **Guides Tab**: Create/edit guides
4. **Access Keys Tab**: Generate access keys, copy links
5. **Settings Tab**: Configure hashtags, verse mode, image limits
6. **Seed Data Tab**: Quick demo setup or clear all data

## Access Control

This demo uses **secret URL keys** instead of traditional authentication:
- Keys are generated in Admin dashboard
- Keys are linked to roles (guide/tourism/admin)
- Guide keys are additionally linked to specific guides
- Access validation happens server-side

**Security Note**: This is a DEMO system. For production, implement proper authentication (e.g., NextAuth, Clerk, Supabase Auth).

## Design Tokens

The app uses a consistent color palette:

```css
Primary: #FC002F (headers, CTAs, primary actions)
Secondary: #006BB9 (links, highlights, secondary actions)
Accent: #03A63C (success states, positive actions)
Light: #EBB877 (warm backgrounds, highlights)
Warm: #FF0175 (Holy Land Edition, special features)
```

## Deployment to Vercel

### Deploy via Vercel Dashboard

1. Push code to GitHub
2. Connect repo in [vercel.com](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Deploy via CLI

```bash
npm install -g vercel
vercel
```

Follow prompts and add env vars when asked.

## Key Implementation Notes

### Image Upload
- Currently uses base64 data URLs for demo simplicity
- For production: upload to Supabase Storage bucket via `supabase.storage.from('agent-mary').upload()`
- Update `ImageUploader.tsx` to implement real uploads

### Biblical Verses
- Predefined in `lib/constants.ts`
- Mapped to locations
- Auto-added for "Holy Land Edition" posts

### Simulated Actions
- "Publish to Guide Page": Updates post status to `published`
- "Share on Social": Opens modal with copy/share UI (no real API calls)

### Post Statuses
- **draft**: Initial state after tourist creates post
- **approved**: Guide approves the post
- **published**: Post is marked as published (simulated)

## Troubleshooting

### Build Errors

**Issue**: TypeScript errors about missing types
```bash
npm install --save-dev @types/node @types/react @types/react-dom
```

**Issue**: Tailwind classes not applying
- Ensure `globals.css` is imported in `layout.tsx`
- Check Tailwind v4 syntax in `postcss.config.mjs`

### Supabase Issues

**Issue**: "Failed to fetch" errors
- Verify `.env.local` has correct values
- Check Supabase project is not paused
- Ensure RLS policies are set (current schema allows all)

**Issue**: Images not loading
- Verify storage bucket `agent-mary` exists
- Ensure bucket is set to Public
- Check bucket policies allow SELECT

### Access Key Issues

**Issue**: "Access Denied" on dashboards
- Verify the key exists in `access_keys` table
- Check `active` is `true`
- Ensure role matches the dashboard (guide/tourism/admin)
- For guide dashboards, verify guide_id and slug match

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Future Enhancements (Not Implemented)

- Real Supabase Storage upload in `ImageUploader`
- Actual Facebook/Instagram API integration
- User authentication system
- Real-time updates with Supabase Realtime
- Image optimization and CDN
- Analytics dashboard
- Email notifications
- Multi-language support

## License

This is a demonstration project for presentation purposes.

## Support

For issues or questions, refer to the following documentation:
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
