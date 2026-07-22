# Intasela — Codebase Review

## Overview

**Intasela** is a social media / creator-economy platform with monetization, spaces (communities), ads, polls, and a short-video feature ("Orbit"). The stack is:

| Layer | Tech |
|---|---|
| **Backend** | NestJS 11, Prisma 6 (PostgreSQL), BullMQ/Redis, JWT auth, S3 uploads, FFmpeg |
| **Frontend** | Next.js 16, React 19, Tailwind 4, Zustand, Radix UI / shadcn, Framer Motion |
| **Admin Frontend** | Next.js 16, React 19, Tailwind 3, Prisma (direct DB), `jose` JWT, Recharts |

---

## Architecture

```mermaid
graph LR
  FE["Frontend (Next.js 16)"] -->|REST / JWT| BE["Backend (NestJS 11)"]
  ADMIN["Admin Frontend"] -->|REST + direct DB| BE
  ADMIN -->|Prisma Client| DB["PostgreSQL"]
  BE -->|Prisma| DB
  BE -->|BullMQ| REDIS["Redis"]
  BE -->|S3 SDK| S3["AWS S3"]
```

The backend exposes a REST API consumed by both frontends. The admin panel also has its own Prisma client that talks directly to the same database — a notable architectural choice.

---

## What's Done Well

1. **Clean NestJS modularization** — Each domain (auth, posts, spaces, users, monetization, ads, uploads, notifications) is its own module with controller + service separation.
2. **Thoughtful Prisma schema** — Good use of composite unique constraints (`@@unique`), indexes on hot paths (`[recipientId, createdAt]`), and cascading deletes.
3. **Monetization engine** — The anti-spam layer (hourly caps, duplicate detection, banned words, min character count) is well-thought-out for preventing farming.
4. **Post approval pipeline** — Space moderators can require approval before posts appear, with `FIRST_POST_ONLY` and `ALL_POSTS` modes.
5. **Audit logging** — Global interceptor captures every state-changing request.
6. **Design system** — [design.md](file:///c:/Users/HP/Desktop/intasela/design.md) is detailed and the frontend components follow it closely.

---

## Critical Issues

### 🔴 1. Database credentials committed to git

[.env](file:///c:/Users/HP/Desktop/intasela/backend/.env) contains a real PostgreSQL password in plaintext and is tracked by git (it's not in `.gitignore`).

```
DATABASE_URL="postgresql://postgres:%23%40291Togolise@localhost:5432/intasela"
```

> [!CAUTION]
> If this repo has ever been pushed to a remote, **rotate this password immediately**. Add `.env` to [.gitignore](file:///c:/Users/HP/Desktop/intasela/backend/.gitignore) and use a secrets manager in production.

---

### 🔴 2. Production deploy uses `--accept-data-loss`

In [package.json](file:///c:/Users/HP/Desktop/intasela/backend/package.json#L14):

```json
"start:prod": "npx prisma db push --accept-data-loss && node dist/src/main"
```

`db push --accept-data-loss` can drop columns/tables if the schema has changed. Production should use **Prisma Migrate** (`prisma migrate deploy`) which applies versioned, safe migrations.

---

### 🔴 3. No input validation / DTOs

Controllers accept raw `Record<string, any>` or `any`:

- [auth.controller.ts:L10](file:///c:/Users/HP/Desktop/intasela/backend/src/auth/auth.controller.ts#L10) — `signInDto: Record<string, any>`
- [auth.controller.ts:L20](file:///c:/Users/HP/Desktop/intasela/backend/src/auth/auth.controller.ts#L20) — `registerDto: Record<string, any>`
- [posts.controller.ts:L131](file:///c:/Users/HP/Desktop/intasela/backend/src/posts/posts.controller.ts#L131) — `body: any`

There are **no DTOs, no `class-validator`, no `ValidationPipe`**. Any payload shape is accepted and passed directly to Prisma, which could lead to:
- Mass assignment (e.g., setting `walletBalance` during registration)
- Unexpected fields persisted in JSON columns
- Cryptic Prisma errors instead of 400 responses

---

### 🔴 4. JWT secret not configured

[auth.module.ts](file:///c:/Users/HP/Desktop/intasela/backend/src/auth/auth.module.ts) presumably configures `JwtModule`, but the `.env` file has **no `JWT_SECRET`**. If NestJS falls back to a default or empty string, **all tokens are trivially forgeable**.

---

### 🔴 5. Admin frontend has direct DB access + `.env` committed

[admin-frontend/.env](file:///c:/Users/HP/Desktop/intasela/admin-frontend/.env) is committed (711 bytes) and likely contains the same DB credentials. The admin panel also bundles its own Prisma client — meaning the **Next.js server has direct PostgreSQL access**, bypassing backend authorization logic.

---

## High-Priority Issues

### 🟠 6. Massive "god" components

| Component | Size | Concern |
|---|---|---|
| [PostCard.tsx](file:///c:/Users/HP/Desktop/intasela/frontend/src/components/PostCard.tsx) | **75 KB** | This is a ~2000+ line file — likely renders, engagement logic, modals, menus, and media handling all in one. |
| [CreatePost.tsx](file:///c:/Users/HP/Desktop/intasela/frontend/src/components/CreatePost.tsx) | **38 KB** | Post creation + media upload + poll UI + scheduling in one component. |
| [SidebarNav.tsx](file:///c:/Users/HP/Desktop/intasela/frontend/src/components/SidebarNav.tsx) | **28 KB** | Navigation, user menu, sidebar state — all in one. |

These should be decomposed into smaller, focused components for maintainability and performance.

---

### 🟠 7. Duplicated post-formatting logic

[PostsService.formatPost](file:///c:/Users/HP/Desktop/intasela/backend/src/posts/posts.service.ts#L341-L387) is a private method, but [getPostById](file:///c:/Users/HP/Desktop/intasela/backend/src/posts/posts.service.ts#L426-L460) defines its own inline `formatPost` function that **duplicates the same logic**. Any bug fix must be applied in two places.

---

### 🟠 8. View tracking with cascading try/catch is fragile

[incrementView](file:///c:/Users/HP/Desktop/intasela/backend/src/posts/posts.service.ts#L741-L789) tries to create `VIEW_1`, catches the unique constraint error, then tries `VIEW_2`, catches again. This uses exceptions for control flow and:
- References an undefined `post` variable on line 773 (it's declared inside a block scope higher up and would be `undefined` in the outer catch)
- Limits views to exactly 2 per user with no clear explanation
- Anonymous views are always counted with no rate limiting at all

---

### 🟠 9. No pagination

[getFeed](file:///c:/Users/HP/Desktop/intasela/backend/src/posts/posts.service.ts#L60) uses `take: 20` but has **no cursor or offset parameter**. Users can only ever see the latest 20 posts. [searchPosts](file:///c:/Users/HP/Desktop/intasela/backend/src/posts/posts.service.ts#L1024) does `take: 100` — also unpaginated. Followers/following lists are also unbounded.

---

### 🟠 10. `Float` for monetary values

The schema uses `Float` for [walletBalance](file:///c:/Users/HP/Desktop/intasela/backend/prisma/schema.prisma#L29), [earned](file:///c:/Users/HP/Desktop/intasela/backend/prisma/schema.prisma#L84), [budget](file:///c:/Users/HP/Desktop/intasela/backend/prisma/schema.prisma#L318), etc. Floating-point arithmetic causes rounding errors on financial data. Use `Decimal` (`@db.Decimal(12,2)`) instead.

---

### 🟠 11. Wallet balance can go negative

[processClawback](file:///c:/Users/HP/Desktop/intasela/backend/src/monetization/monetization.service.ts#L296-L342) decrements the user's wallet balance by the full clawback amount without checking if the balance is sufficient. If a user withdrew funds before the clawback, their balance goes negative.

---

### 🟠 12. Tailwind version mismatch between frontends

| App | Tailwind |
|---|---|
| Frontend | `^4` |
| Admin | `^3.4.4` |

Tailwind 4 has a completely different configuration model (CSS-first) vs Tailwind 3 (JS config). This makes sharing components or design tokens across the two impossible without a compatibility layer.

---

## Medium-Priority Issues

### 🟡 13. Unused imports in layout

[layout.tsx](file:///c:/Users/HP/Desktop/intasela/frontend/src/app/layout.tsx#L4-L5) imports `GeistPixelSquare`, `GeistPixelGrid`, `GeistPixelCircle`, `GeistPixelTriangle`, `GeistPixelLine` — none are used. It also imports `useEffect`, `useUserStore`, and `useSystemSettingsStore` which **cannot be used in a Server Component** (the root layout is a server component by default).

---

### 🟡 14. `adminId === 'admin'` hardcoded backdoor

Throughout [spaces.service.ts](file:///c:/Users/HP/Desktop/intasela/backend/src/spaces/spaces.service.ts), admin checks include `adminId === 'admin'` as a literal string comparison:

```typescript
if (adminId !== 'admin') {
  const admin = await this.prisma.systemAdmin.findUnique(...);
}
```

This looks like a dev shortcut that was never removed. If any request can set `x-admin-id: admin`, it bypasses all authorization.

---

### 🟡 15. No rate limiting on auth endpoints

[auth.controller.ts](file:///c:/Users/HP/Desktop/intasela/backend/src/auth/auth.controller.ts) — `/auth/login` and `/auth/register` have **no rate limiting**. Brute-force attacks are trivially easy. Use `@nestjs/throttler` or a Redis-backed rate limiter.

---

### 🟡 16. Scattered scratch/fix scripts

The root of the backend has: `check_rates.js`, `check_tx.js`, `fix-mods.js`, `fix.js`, `fix2.js`, `fix_sequences.js`, `list-users.js`, `scratch_query.js`, `scratch_test.js`, `scratch_test2.js`, `simulate_post.js`, `test.js`, `test_flow.js`, `test-login.js`, `test-login-identifier.js`, `update_rates.js`.

Similarly the frontend has: `add_created_at.js`, `delete_dir.js`, `move_file.js`, `replace_post.js`, `replace_post.py`, `replace_post_2.js`.

These are dev/debug artifacts that shouldn't be committed. They may also contain hardcoded credentials or destructive operations.

---

### 🟡 17. Echo-chamber check is a no-op

In [checkAntiSpam](file:///c:/Users/HP/Desktop/intasela/backend/src/monetization/monetization.service.ts#L116-L146), the echo-chamber limit check (preventing the same pair from farming rewards) has a `TODO` comment and simply returns `true`. The `echoChamberLimit` config exists but is never enforced.

---

### 🟡 18. `@types/multer` in production dependencies

In [backend/package.json](file:///c:/Users/HP/Desktop/intasela/backend/package.json#L33), `@types/multer` is listed under `dependencies` instead of `devDependencies`. Type-only packages should be dev dependencies.

---

## Summary Scorecard

| Category | Grade | Notes |
|---|---|---|
| **Security** | 🔴 D | Committed secrets, no validation, `'admin'` backdoor, no rate limits |
| **Architecture** | 🟡 B- | Clean module separation, but admin panel's direct DB access is risky |
| **Data Integrity** | 🟠 C | Float for money, negative balances, no pagination |
| **Code Quality** | 🟠 C+ | Duplicated logic, 75KB components, `any` types everywhere |
| **DevOps** | 🔴 D | `--accept-data-loss` in prod, no migrations, scratch scripts in repo |
| **Frontend** | 🟡 B | Good design system, but giant components and server/client boundary issues |

---

## Recommended Next Steps (Priority Order)

1. **Rotate credentials**, add `.env` to `.gitignore`, set up a secret manager
2. **Replace `db push` with `prisma migrate`** for production deployments
3. **Add DTOs + `ValidationPipe`** to all controllers — prevent mass assignment
4. **Add rate limiting** to auth endpoints (`@nestjs/throttler`)
5. **Remove the `'admin'` string backdoor** — enforce all admin checks via `SystemAdmin` lookup
6. **Switch monetary fields to `Decimal`** and add balance-floor checks in clawback
7. **Add cursor-based pagination** to feed, search, followers, and all list endpoints
8. **Break up PostCard, CreatePost, and SidebarNav** into smaller sub-components
9. **Clean up scratch scripts** — move to a `scripts/` directory or remove from git
10. **Implement the echo-chamber check** or remove the dead config
