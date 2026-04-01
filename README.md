# Praywall

[![License: Herald-OSS v1.0](https://img.shields.io/badge/license-Herald--OSS%20v1.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://typescriptlang.org)

> *"Bearing one another's burdens, and so fulfill the law of Christ."* — Galatians 6:2

**Praywall** is a real-time prayer wall where people post prayer requests and at least **33 intercessors** pray for each one.

100% free. Open source. Built for the church.

## Features

- Real-time prayer wall with Server-Sent Events
- Anonymous posting (no account required)
- 33-intercessor goal with progress tracking
- Bilingual: Spanish (default) and English
- Dark warm theme inspired by prayer candles
- Self-hosted auth via Better-Auth
- PostgreSQL with Drizzle ORM
- Deployable to Railway for ~$5/month

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/herald-oss/praywall.git
cd praywall
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 4. Run migrations

```bash
npm run db:migrate
```

### 5. Start dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM |
| Auth | Better-Auth + anonymous plugin |
| Realtime | Server-Sent Events |
| UI | shadcn/ui + Tailwind CSS v4 |
| Icons | Lucide React |
| i18n | next-intl (ES + EN) |
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

If this project blesses your church or community, consider supporting continued development:

[Buy Me a Coffee — Herald-OSS](https://buymeacoffee.com/heraldoss)

## License

[Herald-OSS License v1.0](LICENSE) — Free for churches and non-profits. Not for commercial use.

---

Built with prayer by [StrykerUX](https://github.com/StrykerUX) & Aurora33 for [Herald-OSS](https://github.com/herald-oss).
