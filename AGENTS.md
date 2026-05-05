# FitMe Next – Agent Guide

> For deeper context see `apps/web/AGENTS.md` (frontend-specific rules, design tokens, screen status).

## Architecture Overview

**Monorepo** (pnpm + Turborepo): `apps/web/` is the only app today.  
**Backend** lives in a separate repo `fitness-app-backend/` (NestJS + Prisma + Postgres), running on `http://localhost:3001` by default (`NEXT_PUBLIC_API_URL`).  
Full architecture: `docs/ARCHITECTURE.md` · Roadmap: `docs/PLAN.md`

```
fitness-me-next/
  apps/web/          ← Next.js 16 App Router (React 19, Tailwind 4)
  docs/              ← architecture, design specs, roadmap
  src/index.ts       ← monorepo root stub (not the app entry)
```

## Developer Workflows

All commands run from `apps/web/` unless noted:

```bash
# Development
pnpm dev            # starts Next.js on :3000

# Build
pnpm build          # next build

# No test runner is configured yet – check docs/PLAN.md before adding one
```

## Frontend Structure (`apps/web/src/`)

| Directory | Purpose |
|-----------|---------|
| `app/(auth)/` | Public routes: `/login`, `/register` |
| `app/(app)/` | Authenticated shell with client-side auth guard (`layout.tsx` → redirects to `/login` if no `sessionStorage.accessToken`) |
| `features/<name>/` | Feature slice: owns `<name>.api.ts`, `components/`, `hooks/`, `index.ts` |
| `components/fm/` | **Primary** design-system primitives (`FmBtn`, `FmBadge`, `AppHeader`, `Icon.*`, `FmStyles`, `T.*` tokens) |
| `components/ui/` | Legacy generic UI – prefer `fm/` for new screens |
| `lib/api-client.ts` | Axios instance; auto-injects `Bearer` token from `sessionStorage.accessToken` |
| `lib/providers.tsx` | TanStack Query (`staleTime: 60_000, retry: 1`) + `LangProvider` |
| `lib/lang-context.tsx` | EN/RU language toggle; persisted via `PATCH /users/me { lang }` |

## Key Conventions

**API calls**: always go through `apiClient` from `lib/api-client.ts`. Types live in the feature's `*.api.ts` file alongside the fetch functions.

```ts
// Pattern: typed axios call in feature api file
export async function getWorkouts(): Promise<WorkoutSession[]> {
  const res = await apiClient.get<WorkoutSession[]>("/workouts");
  return res.data;
}
```

**Auth**: tokens stored in `sessionStorage` (`accessToken`, `refreshToken`). No NextAuth session is used for API calls – the custom axios interceptor handles it. `next-auth` is present but scoped to OAuth flows.

**Styling**: Tailwind 4 + inline style for design tokens (`T.*` from `components/fm/index.tsx`). Use `T.bg`, `T.accent`, `T.textPrimary`, etc. directly — do **not** invent new colour values.  
Fonts: `Barlow Condensed` (headings, uppercase) via `--font-barlow-condensed`, `DM Sans` (body) via `--font-dm-sans`.

**Forms**: `react-hook-form` + `@hookform/resolvers/zod`. Schema definitions in `features/<name>/<name>.schemas.ts`.

## Design Specs

Always consult the relevant spec before building or styling a screen:
- `docs/design/Auth Screens.md`
- `docs/design/FitMe Dashboard.html`
- `docs/design/FitMe Exercise Logger.html`
- `docs/design/DESIGN.md`

## Screens Status

| Screen | Status |
|--------|--------|
| Login / Register | ✅ complete |
| Dashboard / Workouts | ✅ complete |
| Exercises | ✅ complete |
| Metrics | ✅ complete |
| Account / Settings popup | ✅ complete (`features/settings/`) |
