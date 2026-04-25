# fitness-me — Architecture

> Current date: April 2026  
> Deployment targets: **Vercel** (web) · **Expo EAS** (mobile) · **VPS Docker Compose** (API + DB)

---

## 1. Two-repo overview

```
fitness-me-next/            ← FE monorepo  (this repo)
fitness-app-backend/        ← BE repo       /Users/mac/work/fitness-app-backend
```

Repos share nothing at runtime — they communicate over HTTPS (REST API).  
Both use Turborepo + pnpm workspaces *internally* for their own packages.

---

## 2. `fitness-me-next` — Frontend Monorepo

```
fitness-me-next/
├── turbo.json                      ← pipeline: build dev lint test
├── pnpm-workspace.yaml             ← apps/* packages/*
├── package.json                    ← private: true
├── tsconfig.base.json
├── docs/
│   ├── ARCHITECTURE.md             ← this file
│   └── PLAN.md
│
├── apps/
│   ├── web/                        ← Next.js 15 App Router  → Vercel
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/         ← /login  /register
│   │       │   └── (app)/
│   │       │       ├── dashboard/
│   │       │       ├── workouts/
│   │       │       ├── exercises/
│   │       │       ├── metrics/
│   │       │       ├── nutrition/
│   │       │       └── settings/
│   │       ├── features/           ← feature modules (components + hooks + api.ts)
│   │       │   ├── auth/
│   │       │   ├── workouts/
│   │       │   ├── exercises/
│   │       │   ├── metrics/
│   │       │   └── nutrition/
│   │       └── lib/
│   │           ├── api-client.ts   ← typed fetch wrapper (NEXT_PUBLIC_API_URL + Bearer)
│   │           └── auth.ts         ← NextAuth v5 config
│   │
│   └── mobile/                     ← Expo SDK 52 React Native  → EAS Build
│       └── app/                    ← Expo Router file-based routing
│           ├── (auth)/             ← login.tsx  register.tsx
│           └── (tabs)/
│               ├── index.tsx       ← Dashboard
│               ├── workouts/
│               ├── exercises/
│               └── metrics/
│
└── packages/
    ├── shared/                     ← Zod schemas + inferred TS types (shared by web + mobile)
    │   └── src/
    │       ├── schemas/            ← auth  workout  metric  nutrition
    │       └── types/
    │
    └── ui/                         ← shadcn/ui components + Tailwind preset (web only)
        └── src/
            └── components/         ← Button Card Input DataTable StatCard LineChart PageHeader
```

### Web: Feature-based structure rationale

Instead of a flat `components/` / `hooks/` / `services/` split, each feature owns everything it needs:

```
features/workouts/
├── components/   WorkoutList  WorkoutCard  SetLogger  SetRow
├── hooks/        useWorkoutSessions  useCreateSet
├── api.ts        typed wrappers around api-client
└── index.ts      barrel re-export
```

This keeps related code co-located, makes deletion safe, and scales to a larger team.

### Mobile: Expo Router + NativeWind

- `expo-secure-store` — JWT tokens (never `AsyncStorage` for secrets)
- `@tanstack/react-query` — same caching strategy as web
- `@fitness-me/shared` — same Zod schemas → one validation source
- Metro `resolver.unstable_enablePackageExports: true` → resolves pnpm workspace packages

---

## 3. `fitness-app-backend` — Backend Repo

```
fitness-app-backend/
├── turbo.json
├── pnpm-workspace.yaml             ← packages/*
├── docker-compose.yml              ← postgres:16 for local dev
├── docker-compose.prod.yml         ← api + db for VPS
├── .env.example
│
└── packages/
    ├── database/                   ← Prisma schema + migrations + seed
    │   ├── prisma/
    │   │   ├── schema.prisma
    │   │   ├── migrations/
    │   │   └── seed.ts
    │   └── src/index.ts            ← PrismaClient singleton
    │
    └── api/                        ← NestJS + Fastify adapter  → Docker → VPS
        └── src/
            ├── auth/               ← register  login  refresh  me  logout
            ├── users/
            ├── exercises/
            ├── workouts/           ← sessions + nested sets
            ├── metrics/
            ├── nutrition/
            ├── common/             ← guards  filters  pipes  decorators
            ├── app.module.ts
            └── main.ts             ← FastifyAdapter, CORS, Helmet, rate-limit, Swagger
```

### Why NestJS + Fastify instead of Express?

- Fastify is ~2× faster than Express for JSON throughput
- NestJS provides DI, module system, and Guards that match the app's complexity
- `@nestjs/swagger` generates OpenAPI 3.1 with zero extra annotations when combined with `nestjs-zod`

---

## 4. Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Web framework | Next.js 15 App Router | RSC + Server Actions where appropriate |
| Mobile | Expo SDK 52 + Expo Router | iOS + Android from one codebase |
| API server | NestJS 10 + Fastify adapter | Modular, typed, fast |
| ORM | Prisma 5 | Type-safe queries, migration tooling |
| Database | PostgreSQL 16 | JSON columns, full-text search, ACID |
| Auth | NextAuth v5 (web) + JWT (mobile) | CredentialsProvider → API `/auth/login` |
| Validation | Zod (shared) + `nestjs-zod` | Single schema → TS types + runtime validation |
| State / data | TanStack Query v5 | Web + mobile, optimistic updates |
| Styling (web) | Tailwind CSS + shadcn/ui | Component variants via `cva` |
| Styling (mobile) | NativeWind v4 | Same Tailwind class names |
| Charts | Recharts (web) · Victory Native (mobile) | |
| CI/CD | GitHub Actions + Turborepo remote cache | |
| Deployment | Vercel (web) · EAS Build (mobile) · VPS Docker (API+DB) | |

---

## 5. Data Flow

```
Mobile app  ──────────────────────────────────────┐
                                                   ▼
                                         api.yourdomain.com
Web app  ──── NEXT_PUBLIC_API_URL ──────► NestJS/Fastify API
                                               │  (JWT auth)
                                               ▼
                                        Prisma ORM
                                               │
                                               ▼
                                       PostgreSQL 16
                                      (Docker volume, VPS)
```

### Auth flow (both clients)

1. `POST /auth/login` → API validates credentials, returns `{ accessToken, refreshToken }`
2. **Web:** NextAuth session stores tokens; `api-client.ts` attaches `Authorization: Bearer <accessToken>`
3. **Mobile:** `expo-secure-store` stores tokens; same `api-client.ts` pattern
4. Access token expires in 15 min → `POST /auth/refresh` → rotate token pair

---

## 6. Deployment Architecture

```
GitHub (fitness-me-next)          GitHub (fitness-app-backend)
        │                                     │
  push to main                          push to main
        │                                     │
   ┌────▼────┐                        ┌───────▼──────┐
   │ Vercel  │                        │ GHCR (image) │
   │ Next.js │                        └───────┬──────┘
   └─────────┘                                │ SSH
                                      ┌───────▼──────┐
 apps/mobile → EAS Build              │     VPS      │
     │                                │  Docker      │
     ▼                                │  ├─ api:3001 │
 App Store / Play Store               │  └─ db:5432  │
                                      └──────────────┘
                                      Caddy: api.domain.com → :3001
```

---

## 7. Local Development

```bash
# Terminal 1 — start Postgres
cd /Users/mac/work/fitness-app-backend
docker compose up -d
pnpm db:migrate && pnpm db:seed
pnpm turbo run dev --filter=api          # localhost:3001

# Terminal 2 — Next.js web
cd /Users/mac/work/fitness-me-next
pnpm turbo run dev --filter=web          # localhost:3000

# Terminal 3 — Expo mobile
cd /Users/mac/work/fitness-me-next
pnpm turbo run dev --filter=mobile       # Expo DevTools
```

`.env` in `fitness-me-next/apps/web`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<dev-secret>
```

`.env` in `fitness-app-backend`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fitnessme
JWT_SECRET=<dev-secret>
JWT_REFRESH_SECRET=<dev-refresh-secret>
PORT=3001
```
