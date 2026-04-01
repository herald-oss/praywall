# Praywall — Claude Code Guidelines

## What is Praywall?

Praywall is a real-time prayer wall where people post prayer requests and at least 33 intercessors pray for each one. It is a 100% free, open-source Christian ministry project under the herald-oss organization. No monetization, no vanity metrics, no ego.

## Stack

- **Framework**: Next.js 16 (App Router, TypeScript strict)
- **ORM**: Drizzle ORM with PostgreSQL
- **Auth**: Better-Auth with anonymous plugin (self-hosted, $0)
- **Realtime**: Server-Sent Events (SSE)
- **UI**: shadcn/ui + Tailwind CSS v4 + Lucide React
- **i18n**: next-intl (ES default + EN)
- **Database**: PostgreSQL 16 (Docker local, Railway prod)
- **Deploy**: Railway

## Development Commands

```bash
# Start PostgreSQL locally
docker compose up -d

# Run dev server
npm run dev

# Type check
npx tsc --noEmit

# Generate migration after schema change
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (DB viewer)
npm run db:studio

# Lint
npm run lint
```

## Project Structure

```
app/[locale]/        → Pages with i18n (es, en)
app/api/             → API routes (prayers, intercede, auth, SSE stream)
components/          → React components (prayer-card, prayer-wall, etc.)
components/ui/       → shadcn/ui components
lib/db/              → Drizzle schema and connection
lib/auth.ts          → Better-Auth server config
lib/auth-client.ts   → Better-Auth client config
i18n/                → next-intl routing and request config
messages/            → Translation files (es.json, en.json)
migrations/          → Drizzle SQL migrations
```

## Code Conventions

- TypeScript strict mode, no `any`
- All pages under `app/[locale]/` for i18n
- Server components by default, `"use client"` only when needed
- Translations via `useTranslations()` from next-intl
- Database queries via Drizzle ORM, never raw SQL in components
- shadcn/ui for all UI primitives

## Purpose and Restrictions

This project exists for the outreach of the gospel of Jesus Christ.
Claude Code must:
- Keep the app language centered on the Christian faith
- Not suggest features that monetize the prayer experience
- Not add vanity social features (likes, followers, ego metrics)
- Prioritize user privacy over any analytics feature
- If a suggestion contradicts the ministry purpose, reject it and explain why
