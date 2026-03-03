# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Agent Mary** — a Next.js tourism content creation platform. Tourists share experiences via guide-specific URLs, guides approve content through protected dashboards, and AI generates styled images with text overlays.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run generate-keys # Generate access keys (tsx scripts/generate-access-keys.ts)
```

No test framework is configured.

## Tech Stack

- **Next.js 16** (App Router) + React 19 + TypeScript 5
- **Tailwind CSS v4** (PostCSS plugin, NOT v3 config format)
- **Supabase** (Postgres + Storage) — client in `src/lib/supabase/`
- **OpenAI** (GPT-5-Nano for chat) + **Google Gemini** (image generation)
- **Upstash Redis** (optional rate limiting)
- Path alias: `@/*` → `./src/*`

## Architecture

### Route Structure

- `/g/[guideSlug]/` — Public tourist-facing pages (landing, create post, post preview)
- `/d/guide/[guideSlug]/`, `/d/tourism/`, `/d/admin/` — Protected dashboards accessed via `?k=access_key` query param
- `/api/health` — Health check endpoint

### Server Actions (`src/app/actions/`)

All data mutations use Next.js Server Actions (not API routes). Each action integrates rate limiting, cost tracking, and structured logging:

- `createPost.ts` — Post creation with image storage
- `generateImage.ts` — Gemini image editing (crop + text overlay)
- `chat.ts` — OpenAI chat (Mary persona)
- `updatePostStatus.ts` — Guide approval workflow
- `uploadGeneratedImage.ts` — Store generated images in Supabase
- `adminActions.ts` — Admin operations

### Access Control

URL-based secret keys instead of authentication. Keys stored in `access_keys` table with roles (`guide`, `tourism`, `admin`). Guide keys are scoped to a specific `guide_id`. Validation is server-side via `src/lib/supabase/access.ts`.

### Key Types (`src/lib/types.ts`)

- `PostStyle`: `'regular' | 'holy_land'`
- `PostStatus`: `'draft' | 'approved' | 'published'`
- `AccessRole`: `'guide' | 'tourism' | 'admin'`

### Core Libraries (`src/lib/`)

- `env.ts` — Startup env var validation (fails fast if missing)
- `logger.ts` — Structured logging (JSON in prod, readable in dev)
- `rateLimiter.ts` — Per-IP rate limiting (Redis or in-memory fallback)
- `costTracker.ts` — API cost tracking with daily/weekly budget limits
- `constants.ts` — Color palette, locations, biblical verses

### Components

- `src/components/ui/` — Design system (Button, Card, Chip, Toast, AppHeader)
- `src/components/` — Feature components (ImageUploader, PostPreview, ShareModal)

### Database

Migrations in `migrations/` (001-004). Core tables: `guides`, `posts`, `access_keys`, `app_settings`. Monitoring tables: `rate_limit_logs`, `cost_tracking`.

## Environment Variables

**Required:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`

**Optional:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `VERCEL_URL`, `ALLOWED_ORIGIN`

## Key Patterns

- Server Actions body size limit is 10MB (configured in `next.config.ts`) for image uploads
- Images are currently stored as base64 data URLs in the `images[]` array on posts
- Client-side image compression via `browser-image-compression` (max 2MB, 2000px)
- Gemini image generation enforces 1:1 square crop with text overlay — prompt explicitly prevents image regeneration
- Social sharing is simulated (no real API calls)
- Tailwind v4 design tokens defined as CSS variables in `src/app/globals.css`
