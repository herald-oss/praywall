# Praywall

[![License: Herald-OSS v1.0](https://img.shields.io/badge/license-Herald--OSS%20v1.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://typescriptlang.org)

> *"Bearing one another's burdens, and so fulfill the law of Christ."* — Galatians 6:2

**Praywall** is a real-time prayer wall where people post prayer requests and at least **33 intercessors** pray for each one.

100% free. Open source. Built for the church.

## Features

- Real-time prayer wall (Server-Sent Events) that reconnects on its own
- Anonymous posting by default — no account required
- A trustworthy 33-intercessor goal: one intercession per person (per account across devices), the author can't count toward their own request, and abuse limits that still work for a whole church on one Wi-Fi
- Optional account: see who you've prayed for, mark answers with a private testimony, share your requests
- Bilingual: Spanish (default) and English, with a language switcher
- Privacy first: no analytics, no ads, no third-party scripts; personal prayer pages are never indexed by search engines
- Self-hosted auth via Better-Auth (username + password, no email)
- PostgreSQL with Drizzle ORM; deployable to Railway for ~$5/month

## Setup

```bash
git clone https://github.com/herald-oss/praywall.git
cd praywall
npm install
docker compose up -d            # PostgreSQL on localhost:5437
cp .env.example .env            # then set BETTER_AUTH_SECRET
npm run db:migrate
npm run dev                     # http://localhost:3000
```

Optional: `npm run db:seed` loads 20 sample prayers.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (standalone server + static assets) |
| `npm start` | Runs the standalone server with a 256 MB heap cap |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run test:unit` | Vitest unit tests |
| `npm run test:e2e` | Playwright API + browser tests (builds the app; needs a `praywall_test` database, see `playwright.config.ts`) |
| `npm run db:generate` | New migration after a schema change |
| `npm run db:migrate` | Apply migrations (drizzle-kit, development) |
| `npm run db:migrate:prod` | Apply migrations with production dependencies only |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit and Playwright tests on every pull request.

## Deploy (Railway)

Set these in the service settings (not in a config file):

- **Build command:** `npm run build`
- **Pre-deploy command:** `npm run db:migrate:prod`
- **Start command:** `node --max-old-space-size=256 .next/standalone/server.js` (call node directly — `npm start` would keep an extra ~60 MB npm process alive)
- **Healthcheck path:** `/api/health`
- **Variables:** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_TRUSTED_ORIGINS` (all production domains), `HOSTNAME=0.0.0.0`

The standalone server runs as a single Node process (no `npm` wrapper) with a capped heap; locally under load this cut peak memory from ~525 MB to ~240 MB. Set `LOG_MEMORY=1` to log memory usage and compare it with Railway's metric.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM |
| Auth | Better-Auth (username + password) |
| Realtime | Server-Sent Events |
| UI | shadcn/ui + Tailwind CSS v4 |
| Icons | Lucide React |
| i18n | next-intl (ES + EN) |
| Tests | Vitest + Playwright |
| Deploy | Railway |

## Domains

- **praywall.fyi** — English
- **unosporotros.com** — Spanish

## Contributing

This is a ministry project. Before contributing:

1. Read the [CLAUDE.md](CLAUDE.md) for code guidelines
2. Ensure your feature aligns with the ministry purpose
3. No monetization features, no vanity metrics, privacy first
4. All UI text must be bilingual (ES + EN)

## Support

If this project blesses your church or community, you can support its hosting and continued development — entirely optional, and never tied to the prayers:

[Ko-fi — Herald-OSS](https://ko-fi.com/heraldoss)

## License

[Herald-OSS License v1.0](LICENSE) — Free for churches and non-profits. Not for commercial use.

---

Built with prayer by [StrykerUX](https://github.com/StrykerUX) & Aurora33 for [Herald-OSS](https://github.com/herald-oss).
