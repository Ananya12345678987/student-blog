# StudentBlog

A secure blogging platform for students. Register, write posts in Markdown with images, publish, comment, follow other writers — built as a real (small) production app, not a CRUD demo.

🔗 **Live:** [student-blog-nu.vercel.app](https://student-blog-nu.vercel.app)

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend + API | Next.js 16 (App Router) + TypeScript | One deployable app, server components for data fetching, API routes for mutations |
| Database | MongoDB Atlas (free tier) | No migrations to manage under a deadline |
| ODM | Mongoose | Schema validation + typed models on top of MongoDB |
| Auth | Auth.js (NextAuth v5), Credentials provider | No third-party auth cost, full control over password hashing |
| Passwords | bcryptjs, cost factor 12 | Industry-standard hashing, no native build step needed for free hosting |
| Validation | Zod | Every mutating API route re-validates input server-side |
| Content | Markdown stored raw, sanitized at render via rehype-sanitize | Prevents stored XSS through post content |
| Images | Cloudinary | Upload from device or URL, on-the-fly optimization (`f_auto`, `q_auto`, smart cropping) |
| Email | Resend | Account verification (currently limited to the sender's own address on the free tier — see below) |
| Styling | Tailwind CSS v4 | Custom design tokens, no extra cost |
| Hosting | Vercel (frontend) + MongoDB Atlas (DB) | Both have real free tiers |

## Getting started

```bash
npm install
cp .env.example .env.local
# fill in MONGODB_URI, AUTH_SECRET, CLOUDINARY_*, and RESEND_API_KEY
npm run dev
```

Open http://localhost:3000.

## Setting up MongoDB Atlas (free)

1. Create a free account at https://www.mongodb.com/cloud/atlas/register
2. Create a free M0 cluster
3. Database Access -> add a database user with a strong password
4. Network Access -> allow access from anywhere (0.0.0.0/0) for dev; tighten before any real production launch
5. Connect -> Drivers -> copy the connection string into `MONGODB_URI`, and make sure you add your database name in the path (e.g. `.../student-blog?...`) — a connection string without a database name silently connects to a default `test` database instead

## What's implemented

- Register / login / logout (hashed passwords, JWT session in httpOnly cookie)
- Create / edit / delete / publish / draft posts, with cover images and inline images (device upload via Cloudinary, or by URL)
- Server-side ownership checks on every mutation — a user can't edit another user's post even by calling the API directly
- Public feed with category filtering, full-text-ish search (title/excerpt/content/author name), pagination, and a trending section
- Individual post pages with SEO-friendly slugs, Open Graph metadata, read-time estimates, and related posts
- Clickable tags, including Instagram-style inline `#hashtags` typed directly into post content
- Comments with threaded replies, deletion, and reporting
- Likes and bookmarks ("save for later"), with a dedicated saved-posts page
- Follow system with follower/following lists and a personalized "Following" feed
- In-app notifications (likes, comments, follows)
- Admin dashboard: view/delete any post, review user reports
- RSS feed at `/rss.xml`

## Known limitations

Cut for scope or blocked by free-tier constraints, not forgotten:

- **Password reset is currently disabled** (routes renamed to `.disabled`, not deleted) — the flow works end-to-end but is being reworked
- **Resend's free tier only delivers to the account owner's own email** until a custom domain is verified — real users won't receive verification emails until that's set up
- No rate limiting yet on `/api/auth/register`, `/api/auth/[...nextauth]`, or comment/like endpoints — worth adding (`@upstash/ratelimit` + Upstash Redis) before any real public launch
- No automated tests
- Admin role is granted manually via direct database edit, not through the UI

## Security notes

- Passwords are never stored or logged in plaintext; `passwordHash` is `select: false` on the User model so it's excluded from queries by default
- Every post/comment mutation route re-checks the session server-side and verifies resource ownership — the frontend hiding an "Edit" button is never the actual security boundary
- Post content is sanitized at render time (allowlist-based via `rehype-sanitize`), not just "trusted because the editor is a textarea"
- Login and registration return intentionally vague error messages so the API can't be used to enumerate registered emails
- `.env.local` is gitignored; `.env.example` documents required variables without real values

## Project structure

```
src/
  app/
    page.tsx                       public feed
    blog/[slug]/                   single post
    tag/[tag]/                     posts by tag
    feed/                          following feed
    profile/, profile/[username]/  own + public profiles, followers/following lists
    login/, register/              auth pages
    dashboard/                     authenticated area (protected by proxy.ts)
    admin/                         moderation (posts, reports)
    api/
      auth/register/               registration endpoint
      auth/[...nextauth]/          Auth.js handler
      auth/verify-email/           email verification
      posts/                       post CRUD, likes, bookmarks, comments
      comments/[id]/               comment deletion
      users/[username]/follow/     follow/unfollow
      notifications/               in-app notifications
      reports/                     content reports
      upload/                      Cloudinary image upload
  models/                          Mongoose schemas
  lib/                             db connection, validation, slug/cloudinary utils
  components/                      shared UI
  auth.ts                          Auth.js configuration
  proxy.ts                         protects /dashboard/*
```
