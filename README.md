# OpenSourcery

> A discovery-first catalog of open-source projects. Search by *what you want to build*, not by name. Community-curated, semantically searchable, and completely free.

## Why This Exists

Open-source projects are scattered across GitHub, GitLab, npm, PyPI — finding the right one today means either knowing its name already or wading through dozens of projects page by page. There's no search engine for *intent* ("I need an OCR library for a React app that handles Indian languages").

OpenSourcery solves that. You describe the problem, it finds the tools.

## Who It's For

| Persona | Need |
|---|---|
| Individual developer | Find the right library/tool quickly |
| Student | Discover projects they didn't know existed |
| Maintainer | Get their project discovered and used |

Searchers bring traffic. Maintainers follow. A healthy supply-demand flywheel for open source.

## Core Features

- **Semantic search** — natural-language queries powered by embeddings (pgvector)
- **Filters** — category, license, language, last-updated, stars
- **Project pages** — description, tags, license, source URL, stars, last commit
- **User accounts** — GitHub OAuth + email/password via NextAuth
- **Save/bookmark** — personal project dashboard
- **Submit projects** — paste URL (agent auto-enriches) or fill manually
- **Moderation queue** — spam detection + illegal content filtering
- **Scheduled scraping** — LLM agent selects 5 trusted sources and enriches entries
- **Dedup engine** — normalize URLs so no duplicate entries for the same project

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + pgvector |
| ORM | Prisma |
| Auth | NextAuth.js (GitHub OAuth + Credentials) |
| Embeddings | OpenAI `text-embedding-3-small` |
| Search | pgvector (IVFFlat index, cosine distance) |
| Deployment | Vercel (free tier) |
| Styling | Tailwind CSS + shadcn/ui |
| Background Jobs | Inngest / Vercel Cron |
| Moderation | AI classifier + regex blocklist |

## Data Model (Abridged)

```
Project: title, slug, description, sourceUrl, license, language[],
         tags[], category, starsCount, lastCommitDate, embedding,
         status (pending/approved/rejected/flagged)

User: name, email, githubId, role (user/moderator/admin),
      savedProjects[], submittedProjects[]

Tag: name, category
```

Full schema is in `prisma/schema.prisma`.

## Phases

### Phase 1 — Foundation
Browseable project catalog, user accounts, manual submit + moderation.

### Phase 2 — Semantic Search
Embedding generation, pgvector search, natural-language queries, filters, bookmarks.

### Phase 3 — Scraping Engine
LLM agent selects 5 trusted sources, scheduled scraping, dedup, auto-enrichment.

### Phase 4 — Community & Growth
Public profiles, similar projects, comparison tool, SEO, social sharing.

---

Built as a pure community project. No monetization. Open source.
