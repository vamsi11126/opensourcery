# OpenSourcery — Build Prompt for AI Coding Agent

You are an expert full-stack developer. You will build **OpenSourcery** — a web-only, community-curated catalog of open-source projects with semantic search. Read `README.md` for the full product vision.

---

## Rules of the Build

1. **Strict TypeScript everywhere.** No `any` types. Every API route, every component, every utility is typed.
2. **App Router only.** No Pages Router. Use Next.js 14 with `app/` directory.
3. **Server components by default.** Only `'use client'` when you need interactivity (forms, filters, live search).
4. **Tailwind CSS + shadcn/ui** for all UI. Install via `npx shadcn-ui@latest init` with default config. Use the `slate` color scheme.
5. **Prisma** for database. Use the schema below exactly. Generate the client after every schema change.
6. **NextAuth v5** (next-auth@beta). Configure with **Credentials provider only** (email + password via bcrypt). GitHub OAuth can be added later.
7. **PostgreSQL + pgvector.** The database provider in schema.prisma must be `postgresql`. The `embedding` field on Project uses `Unsupported("vector(1536)")` — handle with Prisma raw queries for vector search.
8. **Error handling:** Every API route returns `{ data: ... } | { error: string }` — never throw unhandled exceptions.
9. **Loading states:** Every page has a `loading.tsx` skeleton. Every form has a submitting state.
10. **No mock data** — wire everything to the real database from the first endpoint.
11. **API routes** at `/api/*` — no server actions for mutations (keep it RESTful).
12. **Accessibility:** semantic HTML, labels on every input, focus management.
13. **SEO:** Every public page has `generateMetadata` with title + description.
14. **Responsive:** Works on mobile (375px) through desktop (1440px). Test with `responsive` classes.
15. **Rate limiting** on submit and auth endpoints (use a simple in-memory map per IP, 10 req/min).

---

## Directory Structure

```
opensourcery/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx (root layout with Navbar + Footer + SessionProvider)
│   │   ├── page.tsx (landing page — search hero + featured projects)
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx (browse + search + filters)
│   │   │   ├── loading.tsx
│   │   │   └── [slug]/
│   │   │       ├── page.tsx (project detail page)
│   │   │       └── loading.tsx
│   │   ├── submit/
│   │   │   ├── page.tsx (submit form — URL field + optional manual fields)
│   │   │   └── loading.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx (saved projects for logged-in user)
│   │   │   └── loading.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx (moderation queue — list pending projects)
│   │   │   ├── loading.tsx
│   │   │   └── layout.tsx (check role=admin/moderator)
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── projects/
│   │       │   ├── route.ts (GET list/search, POST create)
│   │       │   └── [id]/
│   │       │       └── route.ts (GET, PATCH, DELETE)
│   │       ├── search/
│   │       │   └── route.ts (POST — semantic search + keyword fallback)
│   │       ├── submit/
│   │       │   └── route.ts (POST — validate, enrich via LLM if URL provided)
│   │       ├── bookmarks/
│   │       │   └── route.ts (GET, POST, DELETE)
│   │       ├── admin/
│   │       │   └── projects/
│   │       │       └── [id]/
│   │       │           └── approve/
│   │       │               └── route.ts (PATCH — approve/reject/flag)
│   │       └── enrich/
│   │           └── route.ts (POST — LLM agent fetches + enriches project metadata)
│   ├── components/
│   │   ├── ui/ (shadcn components go here)
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectList.tsx
│   │   ├── SearchBar.tsx
│   │   ├── FilterSidebar.tsx
│   │   ├── SubmitForm.tsx
│   │   ├── BookmarkButton.tsx
│   │   ├── ModerationQueue.tsx
│   │   └── providers/
│   │       └── SessionProvider.tsx
│   ├── lib/
│   │   ├── db.ts (Prisma client singleton)
│   │   ├── auth.ts (NextAuth config)
│   │   ├── embeddings.ts (OpenAI embedding call)
│   │   ├── vector-search.ts (pgvector raw query)
│   │   ├── llm-enrich.ts (LLM agent — scrape + extract metadata)
│   │   ├── moderation.ts (spam + illegal content check)
│   │   ├── dedup.ts (normalize URL, check existing)
│   │   ├── rate-limit.ts
│   │   └── utils.ts (cn(), slugify, etc.)
│   └── types/
│       └── index.ts (shared TypeScript types/interfaces)
├── public/
│   ├── favicon.ico
│   └── og-image.png (placeholder)
├── .env.local (see below)
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}

enum ProjectStatus {
  PENDING
  APPROVED
  REJECTED
  FLAGGED
}

enum UserRole {
  USER
  MODERATOR
  ADMIN
}

model Project {
  id              String        @id @default(cuid())
  title           String
  slug            String        @unique
  shortDescription String       @db.VarChar(280)
  longDescription  String?       @db.Text
  sourceUrl       String        @unique
  homepageUrl     String?
  license         String?
  language        String[]
  tags            String[]
  category        String?
  starsCount      Int           @default(0)
  lastCommitDate  DateTime?
  embedding       Unsupported("vector(1536)")?
  status          ProjectStatus @default(PENDING)
  moderationFlags String[]
  submittedById   String?
  submittedBy     User?         @relation(fields: [submittedById], references: [id])
  submittedAt     DateTime      @default(now())
  approvedAt      DateTime?
  approvedById    String?
  approvedBy      User?         @relation("ApprovedProjects", fields: [approvedById], references: [id])
  savedBy         UserSavedProject[]

  @@index([status])
  @@index([category])
  @@index([slug])
  @@index([sourceUrl])
}

model User {
  id                String             @id @default(cuid())
  name              String?
  email             String?            @unique
  emailVerified     DateTime?
  image             String?
  passwordHash      String?
  githubId          String?            @unique
  role              UserRole           @default(USER)
  savedProjects     UserSavedProject[]
  submittedProjects Project[]
  approvedProjects  Project[]          @relation("ApprovedProjects")
  accounts          Account[]
  sessions          Session[]
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
}

model UserSavedProject {
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  savedAt   DateTime @default(now())

  @@id([userId, projectId])
}

// NextAuth required models

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

---

## Environment Variables (`.env.local`)

```env
DATABASE_URL="postgresql://neondb_owner:npg_tw4IoXLU5hDG@ep-wild-flower-azdhi1bh-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
AUTH_SECRET="_rpIowLBW778LfU85stx81yKymxP3MIkBQo_rKB5CzNS-No6ZpOhEmHOgF80qrUWpoFqaEpbl-IHfF8kalVQeA"
OPENAI_API_KEY="sk-RkfbvBOe6wY2AhE534xftUBXWfl1DS5XhuxrWfRFTyE99FZTv6Yhyr14fRCTeCHu"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Important:** Before running the project, enable the pgvector extension in your Neon database. Open the Neon SQL Editor and run: `CREATE EXTENSION IF NOT EXISTS vector;`

---

## Environment File (`.env.example`)

Copy exactly:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."
OPENAI_API_KEY="sk-..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Phase 1 — Foundation

Build this first. Do NOT move to Phase 2 until I confirm.

### Step 1.1 — Project scaffolding

```bash
npx create-next-app@latest opensourcery --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd opensourcery
```

Then:

1. Install dependencies:
```bash
npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter bcryptjs openai @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-slot @radix-ui/react-toast lucide-react class-variance-authority clsx tailwind-merge
npm install -D @types/bcryptjs
npx prisma init
```

2. Initialize shadcn/ui:
```bash
npx shadcn-ui@latest init
```
When prompted: use `slate` color, use `@/components/ui` for components, use tailwind-merge for cn.

3. Add shadcn components as you need them:
```bash
npx shadcn-ui@latest add button input card badge select dialog dropdown-menu toast sheet skeleton separator
```

### Step 1.2 — Database setup

1. Copy the Prisma schema above into `prisma/schema.prisma`
2. Run `npx prisma generate` and `npx prisma db push`
3. Create `src/lib/db.ts` — Prisma client singleton
4. Create `src/lib/utils.ts` with `cn()` function and `slugify()` helper

### Step 1.3 — Auth setup

1. Create `src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { compare } from "bcryptjs"
import { db } from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user || !user.passwordHash) return null
        const valid = await compare(credentials.password as string, user.passwordHash)
        if (!valid) return null
        return { id: user.id, name: user.name, email: user.email, image: user.image }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.id = user.id }
      return token
    },
    session({ session, token }) {
      if (session.user) { session.user.id = token.id as string }
      return session
    },
  },
})
```

2. Create `src/app/api/auth/[...nextauth]/route.ts` — export GET/POST from handlers
3. Create `src/components/providers/SessionProvider.tsx` — wrap with SessionProvider
4. Add SessionProvider to root `layout.tsx`
5. Create login page at `src/app/(auth)/login/page.tsx` — email/password form
6. Create register page at `src/app/(auth)/register/page.tsx` — name/email/password form, hash with bcryptjs, create user, redirect to login

### Step 1.4 — Browse page

1. `src/app/projects/page.tsx` — Server component that fetches `prisma.project.findMany({ where: { status: "APPROVED" }, orderBy: { starsCount: "desc" }, take: 50 })`
2. Display as a grid of `ProjectCard` components (title, shortDescription, tags, license, stars, language badge)
3. Pagination with "Load More" button (cursor-based, pass `skip`/`take`)

### Step 1.5 — Project detail page

1. `src/app/projects/[slug]/page.tsx` — fetch by slug, show full detail
2. Include: title, full description, source URL link, homepage link, license, languages, tags, stars, last commit date, category
3. If user is logged in, show BookmarkButton
4. 404 page if slug not found

### Step 1.6 — Submit form

1. `src/app/submit/page.tsx` — form with:
   - **Source URL** (required) — validated as a URL
   - **Title** (auto-filled if URL provided via LLM enrichment, editable)
   - **Short description** (auto-filled, editable, max 280 chars)
   - **Tags** (comma separated, auto-filled, editable)
   - **License** (auto-filled, editable, free-text or select)
   - Submit button
2. On submit: POST to `/api/submit`
3. The submit endpoint:
   - Validates the URL is unique (check `dedup.ts` — normalize URL, strip trailing slash, resolve redirects)
   - If URL is provided and enrichment hasn't been done, call `/api/enrich` to fetch metadata via LLM (but don't block — return immediately with a "processing" status and enrich async)
   - Create the project with `status: PENDING`
   - Run moderation check (`moderation.ts` — AI classifier + regex blocklist on description)
   - If flagged, set status to `FLAGGED` and notify admin

### Step 1.7 — Moderation queue

1. Create `src/app/admin/page.tsx` — protected layout that checks `session.user.role === "ADMIN" || "MODERATOR"`
2. Lists all projects where `status === "PENDING"` or `"FLAGGED"`
3. Each item has Approve / Reject / Flag buttons
4. POST to `/api/admin/projects/[id]/approve` with `{ action: "approve" | "reject" | "flag" }`
5. On approve: set `status: APPROVED`, `approvedById`, `approvedAt`

### Step 1.8 — Navbar + Footer

1. Navbar: Logo (text: "OpenSourcery"), Browse, Submit, Auth links. If logged in: Dashboard, user avatar dropdown with Sign Out. If admin: Admin link.
2. Footer: simple copyright + GitHub link to the project repo

### Step 1.9 — Dashboard

1. `src/app/dashboard/page.tsx` — protected page
2. Shows list of projects the user has bookmarked (`userSavedProjects`)
3. Shows list of projects the user has submitted

---

## Phase 2 — Semantic Search

Build this after Phase 1 is complete and deployed to Vercel.

### Step 2.1 — Embeddings utility

1. `src/lib/embeddings.ts`:
   - Calls OpenAI `text-embedding-3-small` (dimensions: 1536)
   - Caches embeddings in DB to avoid re-computation
   - Input: text string (title + description + tags concatenated)
   - Returns: number[]

### Step 2.2 — Vector search

1. `src/lib/vector-search.ts`:
   - Accepts: embedding (number[]), optional filters (category, license, language, minStars, tags)
   - Runs raw Prisma query using `SELECT *, embedding <-> $1 AS distance FROM "Project" WHERE status = 'APPROVED' ORDER BY distance LIMIT 20`
   - Filters: add `AND` clauses for category, license (array contains for language)

### Step 2.3 — Search API

1. `POST /api/search` — accepts `{ query: string, filters?: {...} }`
   - If query is empty: return recent approved projects
   - If query is provided: generate embedding, run vector search
   - Fallback: if OpenAI is unavailable, do ILIKE search on title + description

### Step 2.4 — Search UI

1. **Landing page hero section:** Large search bar with placeholder "Describe what you're trying to build..."
2. **Browse page:** Search bar at top + FilterSidebar on the left
3. FilterSidebar controls:
   - Category (dropdown)
   - License (dropdown)
   - Language (multi-select, type to add)
   - Min stars (number input)
   - Tags (comma-separated)
4. Results update as user types/filters (debounced 300ms for search, instant for filters)
5. Show "no results" state with suggestion to try different terms

### Step 2.5 — LLM Enrichment

1. `POST /api/enrich` — used when a project is submitted with a URL
   - Accepts: `{ url: string }`
   - Calls OpenAI (GPT-4o-mini or GPT-4o) with a system prompt instructing it to:
     - Visit the URL (or use GitHub API if it's a GitHub URL)
     - Extract: title, short description (<280 chars), tags, license, category
     - Return JSON
   - Stores the enriched fields on the Project record
   - Generates and stores the embedding
   - Requires API key with web browsing or uses `fetch()` for GitHub API

2. **Rate limit:** One enrichment per unique URL per hour

### Step 2.6 — Bookmark toggle

1. `BookmarkButton` component — heart/bookmark icon
2. Click toggles saved/un-saved
3. POST/DELETE `/api/bookmarks?projectId=xxx`
4. Optimistic UI update

---

## Phase 3 — Scraping Engine

Build after Phase 2 is solid.

### Step 3.1 — Source selection agent

Create a scheduled job (Vercel Cron — `crons.json` or Inngest):

1. Every week, call an LLM with:
   - A list of candidate sources (GitHub Trending per language, awesome-* repos, GitLab Explore, npm top packages, PyPI top packages, SourceForge)
   - Ask it to pick 5 based on: README quality, commit freshness, license clarity, community size, diversity of categories
2. Store the chosen sources in a new model `ScrapedSource { id, name, url, type, lastScrapedAt }`
3. Return the 5 sources as JSON

### Step 3.2 — Scraper

For each selected source:

1. Fetch the list of projects (GitHub API for repos, npm API for packages, etc.)
2. For each project:
   - Normalize URL + check dedup (`dedup.ts`)
   - If not in DB: call enrichment endpoint, set status to PENDING (auto-approved if from trusted source + passes moderation)
   - If already in DB: update starsCount, lastCommitDate (but not the description — preserve community edits)

### Step 3.3 — Dedup Engine

`src/lib/dedup.ts`:

- Normalize GitHub URLs: strip trailing slashes, `tree/main`, `?tab=...`, etc.
- Normalize npm: `https://www.npmjs.com/package/foo` and `https://npmjs.com/package/foo` → canonical
- Check `sourceUrl` unique constraint before insert
- If duplicate found, update existing rather than creating new

### Step 3.4 — Moderation classifier

`src/lib/moderation.ts`:

- Function `checkContent(text: string): Promise<{ isClean: boolean, flags: string[] }>`
- Step 1: Regex blocklist for obviously illegal content (hardcoded patterns)
- Step 2: Call OpenAI moderation endpoint (`text-moderation-latest`)
- Step 3: If flagged, set `status: FLAGGED` and store flags in a new field `moderationFlags: String[]` on Project (add to schema)
- Return result

---

## Phase 4 — Community & Growth

### Step 4.1 — Public user profiles

- `src/app/users/[id]/page.tsx` — shows user's saved projects as "My Stack"
- Shareable link: `opensourcery.dev/users/abc123`

### Step 4.2 — Similar projects

- On project detail page, show "Similar Projects" section
- Use vector distance: find 3 nearest neighbors in pgvector where `status: APPROVED`

### Step 4.3 — SEO

- `generateMetadata` on every public page
- Dynamic Open Graph images (`@vercel/og`)
- Sitemap via `sitemap.ts`
- Structured data (JSON-LD) on project pages

---

## UI/UX Guidelines

### Pages

| Route | Purpose | Access |
|---|---|---|
| `/` | Landing — search hero + featured projects | Public |
| `/projects` | Browse + search + filters | Public |
| `/projects/[slug]` | Project detail | Public |
| `/submit` | Submit a project form | Authenticated |
| `/login` | Sign in | Public |
| `/register` | Create account | Public |
| `/dashboard` | Saved + submitted projects | Authenticated |
| `/admin` | Moderation queue | Admin/Moderator |

### Color Palette (Tailwind + shadcn slate)

- Primary: `slate-900` backgrounds, `slate-50` text
- Accent: `blue-600` for links and CTAs
- Success: `emerald-500` for approved
- Warning: `amber-500` for pending
- Danger: `red-500` for rejected/flagged
- Cards: `white` / `slate-50` with `slate-200` borders

### Key Components

- **ProjectCard:** Title, short description (2 lines truncated), tag badges, language badge, star count, license badge. Click → detail page.
- **SearchBar:** Large input with search icon. On landing: centered. On browse: at top.
- **FilterSidebar:** Category, license, language, min stars. Apply/clear buttons. Collapsible on mobile.
- **SubmitForm:** URL input (auto-enrich), title, description, tags, license. Loading state during enrichment.
- **ModerationQueue:** Table with project title, submitter, date, status, action buttons.

---

## Verification Checklist

After each phase, verify:

- [ ] All pages render without errors
- [ ] Auth flow works (email/password sign in, sign out, register)
- [ ] Project CRUD works
- [ ] Search returns relevant results
- [ ] Filters combine with search correctly
- [ ] Submit with URL auto-enriches
- [ ] Moderation queue shows pending items
- [ ] Approve/Reject changes status
- [ ] Bookmark toggle saves/removes
- [ ] Responsive on mobile (375px)
- [ ] Loading states show during data fetch
- [ ] Error states show when API fails
- [ ] Rate limiting blocks rapid requests
- [ ] SEO metadata on public pages

---

## Notes for the Agent

- The user will provide the `DATABASE_URL`, `AUTH_SECRET`, and `OPENAI_API_KEY` in `.env.local` — DO NOT commit real values to git.
- The user's email is **vamsimanukinda26@gmail.com** — set this email as admin in a seed script.
- Start with **Phase 1 only**. Stop after completing all Step 1.x items. Wait for user confirmation before moving to Phase 2.
- Use `npx prisma db push` during development, `npx prisma migrate dev` when the schema is final.
- Every API route should be well-documented with comments.
- The project will be deployed to Vercel — ensure `next.config.js` is configured for serverless functions (no heavy dependencies, keep cold start fast).
- When stuck: build the simplest version that works, then refactor. Don't over-engineer.
- **Auth is email + password only for now.** GitHub OAuth can be added in a future phase. No GitHub provider in auth config.
