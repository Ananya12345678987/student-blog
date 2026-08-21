# StudentBlog

A minimal, secure blogging platform for students. Register, write posts in
Markdown, publish, comment — built as a real (small) production app, not a
CRUD demo.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend + API | Next.js 15 (App Router) + TypeScript | One deployable app, server components for data fetching, API routes for mutations |
| Database | MongoDB Atlas (free tier) | You're already familiar with it; no migrations to manage under a deadline |
| ODM | Mongoose | Schema validation + typed models on top of MongoDB |
| Auth | Auth.js (NextAuth v5), Credentials provider | No third-party auth cost, full control over password hashing |
| Passwords | bcryptjs, cost factor 12 | Industry-standard hashing, no native build step needed for free hosting |
| Validation | Zod | Every mutating API route re-validates input server-side |
| Content | Markdown stored raw, sanitized at render via rehype-sanitize | Prevents stored XSS through post content |
| Styling | Tailwind CSS | Fast to build with, no extra cost |
| Hosting | Vercel (frontend) + MongoDB Atlas (DB) | Both have real free tiers |

## Getting started

```bash
npm install
cp .env.example .env.local
# fill in MONGODB_URI (from Atlas) and AUTH_SECRET (openssl rand -base64 32)
npm run dev
```

Open http://localhost:3000.

### Setting up MongoDB Atlas (free)

1. Create a free account at https://www.mongodb.com/cloud/atlas/register
2. Create a free M0 cluster
3. Database Access -> add a database user with a strong password
4. Network Access -> allow access from anywhere (0.0.0.0/0) for dev; for
   production, prefer Vercel's fixed IPs or Atlas's Vercel integration
5. Connect -> Drivers -> copy the connection string into MONGODB_URI

## What's implemented (MVP)

- Register / login / logout (hashed passwords, JWT session in httpOnly cookie)
- Create / edit / delete / publish / draft posts, server-side ownership
  checks on every mutation (a user can't edit another user's post even by
  calling the API directly)
- Public feed of published posts, individual post pages with SEO-friendly
  slugs
- Comments (plain text, rendered without dangerouslySetInnerHTML)
- Markdown editor with sanitized rendering (no raw HTML/script execution
  from post content)

## What's deliberately NOT in this version

Cut to make the deadline, not forgotten. Natural next additions, roughly
in priority order:

- Admin panel / moderation / reports
- Follow system, bookmarks, likes
- Email verification, password reset
- Rate limiting (important before any real public launch, see below)
- Image upload (Cloudinary), currently no image support in posts
- Automated tests

## Security notes

- Passwords are never stored or logged in plaintext; passwordHash is
  select: false on the User model so it's excluded from queries by default.
- Every post/comment mutation route re-checks the session server-side and
  verifies resource ownership. The frontend hiding an "Edit" button is
  never the actual security boundary.
- Post content is sanitized at render time (allowlist-based), not just
  "trusted because the editor is a textarea", so this holds even if bad
  content somehow reaches the database.
- Login and registration return intentionally vague error messages so the
  API can't be used to enumerate registered emails.
- .env.local is gitignored; .env.example documents required variables
  without real values.

Before any real/public launch, add at minimum: rate limiting on
/api/auth/register, /api/auth/[...nextauth], and /api/posts/[id]/comments
(the current build has none, a bot can currently hammer these endpoints).
A simple option on Vercel is @upstash/ratelimit with Upstash Redis
(also has a free tier).

## Project structure

```
src/
  app/
    page.tsx                   public feed
    blog/[slug]/page.tsx       single post
    login/, register/          auth pages
    dashboard/                 authenticated area (protected by middleware.ts)
    api/
      auth/register/           registration endpoint
      auth/[...nextauth]/      Auth.js handler
      posts/                   post CRUD
      posts/[id]/comments/     comments
  models/                      Mongoose schemas
  lib/                         db connection, validation, slug util
  components/                  shared UI
  auth.ts                      Auth.js configuration
  middleware.ts                protects /dashboard/*
```
