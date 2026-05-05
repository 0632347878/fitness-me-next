<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Project Context

- **Stack**: Next.js 15 App Router, TanStack Query v5, Zod, pnpm monorepo (Turborepo)
- **Repos**: FE → `fitness-me-next/` · BE → `fitness-app-backend/` (NestJS + Prisma + Postgres)
- **Full architecture**: `docs/ARCHITECTURE.md`
- **Roadmap / iteration status**: `docs/PLAN.md`

---

## Frontend Structure (`apps/web/src/`)

```
app/
  (auth)/         → /login  /register
  (app)/          → authenticated shell, bottom tab bar, auth guard
    dashboard/
    workouts/
    exercises/
    metrics/
features/         ← feature-based: each owns components/ hooks/ api.ts index.ts
  auth/
  workouts/
  exercises/
  metrics/
  dashboard/
components/
  fm/             ← shared FitMe design-system primitives (index.tsx)
  ui/             ← legacy generic UI (Button Card Badge Input Feedback)
lib/
  api-client.ts   ← typed fetch wrapper, attaches Bearer token
  providers.tsx   ← TanStack Query + NextAuth providers
```

---

## Design System (`src/components/fm/index.tsx`)

Tokens (`T.*`):
- `T.bg` `#0d0d12` · `T.bgCard` `#16161f` · `T.bgInput` `#1e1e2a` · `T.border` `#2a2a38`
- `T.accent` `oklch(0.72 0.18 35)` (amber-orange) · `T.accentRaw` `#e8854a`
- `T.textPrimary` `#f0ede8` · `T.textSub` `#8a8898` · `T.textMuted` `#4a4a5c`
- Category colors: `T.strength` (purple) · `T.cardio` (red-orange) · `T.flexibility` (green) · `T.mobility` (blue)

Primitives: `FmBtn` · `FmBadge` · `FmPageLoader` · `FmEmpty` · `FmExercisePicker` · `AppHeader` · `Icon.*` · `FmStyles`

Fonts: `Barlow Condensed` (headings, 700/900, uppercase) · `DM Sans` (body, 300–600)  
CSS vars: `--font-barlow-condensed` · `--font-dm-sans`

---

## Auth

- Tokens stored in `sessionStorage` (`accessToken`, `refreshToken`)
- Client-side guard in `(app)/layout.tsx` — redirects to `/login` if no token
- `features/auth/auth.schemas.ts` — Zod schemas for login/register

---

## Screens implemented

| Screen | File | Status |
|--------|------|--------|
| Login | `(auth)/login/page.tsx` + `features/auth/components/LoginForm.tsx` | ✅ FitMe dark design |
| Register | `(auth)/register/page.tsx` + `features/auth/components/RegisterForm.tsx` | ✅ 2-step + strength meter |
| Dashboard | `(app)/dashboard/page.tsx` | ✅ FitMe dark design |
| Workouts | `(app)/workouts/page.tsx` | ✅ FitMe dark design |
| Exercises | `(app)/exercises/page.tsx` | ✅ FitMe dark design |
| Metrics | `(app)/metrics/page.tsx` | ✅ FitMe dark design |
| Account popup | `features/settings/components/AccountPopup.tsx` | ✅ slide-in panel |

---

## Design specs location

- Auth screens: `docs/design/Auth Screens.md`
- Dashboard + Workouts: `docs/design/FitMe Dashboard.html`
- General design system: `docs/design/DESIGN.md`

**Always check the relevant spec file before styling or building a new screen.**
