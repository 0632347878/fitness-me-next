# fitness-me — Realisation Plan (revised)

> **Two-repo architecture.**  
> `fitness-me-next` — FE monorepo (Next.js web + React Native mobile + shared packages)  
> `fitness-app-backend` — BE repo (NestJS/Fastify + Prisma + PostgreSQL)  
>
> Each phase produces a working, deployable increment.

---

## Repositories at a glance

| Repo | Path | Deploys to |
|------|------|-----------|
| `fitness-me-next` | `/Users/mac/work/fitness-me-next` | Vercel (web) · Expo EAS (mobile) |
| `fitness-app-backend` | `/Users/mac/work/fitness-app-backend` | VPS — Docker Compose (API + DB) |

> **Why separate repos?**  
> – Independent CI/CD: a mobile-only UI change never triggers a backend pipeline.  
> – Different runtime targets: Vercel can't run NestJS; VPS doesn't need Next.js build artifacts.  
> – Separate team permissions/secrets possible in the future.  
> – Monorepo tooling (Turborepo) still used *inside each repo* for packages.

---

## Iteration order (feature-by-feature)

Каждая итерация = вертикальный срез: **DB → API → Web → Mobile**.  
Закончил фичу на всех слоях → переходишь к следующей.

| # | Feature | BE | Web | Mobile | Status |
|---|---------|----|----|--------|--------|
| 0 | Repo + DB bootstrap | ✅ | ✅ | — | done |
| 1 | **Auth** — register / login / refresh / me | ✅ | ✅ | ✅ | **done** |
| 2 | **Exercises** — browse + CRUD | — | — | — | 👈 next |
| 3 | **Workout sessions** — log sets in real time | — | — | — | — |
| 4 | **Body metrics** — weight / body fat charts | — | — | — | — |
| 5 | **Dashboard** — summary across features | — | — | — | — |
| 6 | **Nutrition log** — daily macros | — | — | — | — |
| 7 | CI/CD · deploy | — | — | — | — |
| 8 | **AI Coach** — chat-агент поверх Exercises/Workouts/Plans/Metrics | — | — | — | — |

---

## Phase 0 — Backend repo bootstrap (`fitness-app-backend`)

**Goal:** Clean NestJS/Fastify + Prisma repo with Docker-based local Postgres.

| # | Task |
|---|---|
| 0.1 | `mkdir -p /Users/mac/work/fitness-app-backend && cd $_` |
| 0.2 | `pnpm init`; add `"packageManager": "pnpm@9"`; `corepack enable` |
| 0.3 | Install root dev deps: `turbo typescript eslint prettier` |
| 0.4 | Add `pnpm-workspace.yaml` → `packages/*` |
| 0.5 | Add `turbo.json` pipeline: `build dev lint test db:generate db:migrate db:seed` |
| 0.6 | Add `tsconfig.base.json` with shared options (`strict`, `moduleResolution: bundler`) |
| 0.7 | Add `docker-compose.yml` with `postgres:16` service (port 5432, named volume `pgdata`) |
| 0.8 | Add `.env.example` → `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT` |
| 0.9 | Add `.gitignore`, root ESLint + Prettier config |
| 0.10 | `git init && git commit -m "chore: bootstrap fitness-app-backend"` |

**Done when:** `docker compose up -d` starts Postgres without errors.

---

## Phase 1 — Database package (`fitness-app-backend/packages/database`)

**Goal:** Prisma schema, migrations, and seed data against local Postgres.

| # | Task |
|---|---|
| 1.1 | `pnpm add prisma @prisma/client` in `packages/database`; `prisma init` |
| 1.2 | `datasource db { provider = "postgresql"; url = env("DATABASE_URL") }` |
| 1.3 | **User** — id (cuid2), email (unique), passwordHash, name, avatarUrl, role, createdAt, updatedAt |
| 1.4 | **Exercise** — id, name, category (enum), muscleGroups (String[]), equipment, instructions, isPublic, userId? FK |
| 1.5 | **WorkoutSession** — id, userId FK, startedAt, finishedAt?, notes |
| 1.6 | **WorkoutSet** — id, sessionId FK, exerciseId FK, setNumber, reps?, weight?, duration?, rpe? |
| 1.7 | **BodyMetric** — id, userId FK, date, weight?, bodyFat?, muscleMass?, notes |
| 1.8 | **NutritionLog** — id, userId FK, date, calories?, protein?, carbs?, fat?, notes? |
| 1.9 | `docker compose up -d` → `prisma migrate dev --name init` |
| 1.10 | `prisma/seed.ts` — ~60 exercises across Strength, Cardio, Flexibility, Mobility |
| 1.11 | Export `PrismaClient` singleton from `src/index.ts` (global guard for hot-reload) |
| 1.12 | Scripts: `db:generate db:migrate db:seed db:studio db:reset` |

**Done when:** `pnpm db:seed` populates exercises; Prisma Studio shows all tables.

---

## Phase 2 — Backend API (`fitness-app-backend/packages/api`)

**Goal:** NestJS app with Fastify adapter, JWT auth, all resource modules, OpenAPI docs, Docker image.

### 2.1 — Scaffold

| # | Task |
|---|---|
| 2.1.1 | `nest new api --package-manager pnpm` inside `packages/`; extend root tsconfig |
| 2.1.2 | Replace Express with Fastify: `@nestjs/platform-fastify fastify` |
| 2.1.3 | Install: `@nestjs/jwt @nestjs/passport passport-jwt bcrypt @nestjs/swagger @nestjs/config nestjs-zod class-transformer` |
| 2.1.4 | Install internal dep: `@fitness-app/database` (workspace) |
| 2.1.5 | `ConfigModule.forRoot({ isGlobal: true })` + `PrismaModule` globally |
| 2.1.6 | Apply `ZodValidationPipe` globally |
| 2.1.7 | Enable Fastify CORS (`origin: [NEXT_PUBLIC_URL, APP_SCHEME]`), Helmet, rate-limit |

### 2.2 — Auth module

| Endpoint | Description |
|----------|-------------|
| `POST /auth/register` | bcrypt (rounds 12), create User, return token pair |
| `POST /auth/login` | verify credentials, issue access (15 min) + refresh (7 days) |
| `POST /auth/refresh` | rotate refresh token |
| `GET /auth/me` | return current user (JwtGuard) |
| `POST /auth/logout` | invalidate refresh token |

### 2.3 — Resource modules

| Module | Key endpoints |
|--------|--------------|
| **Users** | `GET/PATCH /users/me`, avatar upload URL |
| **Exercises** | CRUD + `?category&muscleGroup&search&page&limit` |
| **WorkoutSessions** | CRUD + nested sets sub-resource |
| **BodyMetrics** | list by date range, create, delete |
| **NutritionLogs** | list by date range, create, delete *(Phase 4 full feature)* |

### 2.4 — Finishing the API

| # | Task |
|---|---|
| 2.4.1 | `SwaggerModule.setup('docs', ...)` — OpenAPI 3.1 |
| 2.4.2 | Global Prisma exception filter (P2002 → 409, P2025 → 404) |
| 2.4.3 | Multi-stage `Dockerfile`: `builder` (compile TS) → `runner` (node:22-alpine, non-root) |
| 2.4.4 | `GET /health` endpoint for Docker health check & VPS deploy hooks |
| 2.4.5 | `docker-compose.prod.yml` with `api` + `db` services, restart policies, volume for Postgres data |

**Done when:** Swagger UI at `localhost:3001/docs`; all endpoints work; Docker image builds.

---

---

## Iteration 2 — Exercises 👈

> Упражнения — фундамент всего приложения. Workouts, Dashboard и seed-данные зависят от этой фичи.  
> Порядок: DB (уже есть в схеме) → API → Web → Mobile.

### BE: `packages/api/src/exercises/`

| # | Task |
|---|---|
| 2-BE-1 | Создать `ExercisesModule` — `exercises.module.ts controller service` |
| 2-BE-2 | `GET /exercises` — пагинация (`page`, `limit`), фильтры `category`, `muscleGroup`, `search` (icontains по name) |
| 2-BE-3 | `GET /exercises/:id` — одно упражнение |
| 2-BE-4 | `POST /exercises` — создать пользовательское упражнение (`isPublic: false`, `userId` из JWT) |
| 2-BE-5 | `PATCH /exercises/:id` — обновить (только владелец или admin) |
| 2-BE-6 | `DELETE /exercises/:id` — удалить (только владелец или admin) |
| 2-BE-7 | Zod DTO: `CreateExerciseSchema`, `UpdateExerciseSchema`, `ExerciseFiltersSchema` — в `packages/database` или shared |
| 2-BE-8 | Seed: заполнить ~60 упражнений (`prisma/seed.ts`) — `Strength Cardio Flexibility Mobility` |
| 2-BE-9 | Swagger-теги и примеры ответов |

**Response shape:**
```ts
// GET /exercises
{
  data: Exercise[],
  meta: { page: number, limit: number, total: number, totalPages: number }
}
```

**Done when:** `curl localhost:3001/exercises?search=squat` возвращает список; seed заполнен.

---

### Web: `apps/web/src/features/exercises/`

| # | Task |
|---|---|
| 2-WEB-1 | `api.ts` — `getExercises(filters)`, `createExercise(dto)`, `updateExercise(id, dto)`, `deleteExercise(id)` |
| 2-WEB-2 | `hooks/useExercises.ts` — TanStack Query `useQuery` + `useInfiniteQuery` для пагинации |
| 2-WEB-3 | `hooks/useMutateExercise.ts` — `useMutation` create/update/delete с `invalidateQueries` |
| 2-WEB-4 | `components/ExerciseFilters.tsx` — search input + category tabs + muscleGroup multi-select |
| 2-WEB-5 | `components/ExerciseTable.tsx` — shadcn `DataTable`, колонки: name, category, muscles, actions |
| 2-WEB-6 | `components/ExerciseModal.tsx` — shadcn `Dialog` с `react-hook-form` + Zod для create/edit |
| 2-WEB-7 | `ExercisesPage.tsx` — компонент страницы: фильтры + таблица + кнопка «Add exercise» |
| 2-WEB-8 | `app/(app)/exercises/page.tsx` — 2 строки: import + `<ExercisesPage />` |

**Done when:** Страница `/exercises` загружает список, поиск фильтрует без перезагрузки, модалка создаёт упражнение.

---

### Mobile: `apps/mobile/app/(tabs)/exercises/`

| # | Task |
|---|---|
| 2-MOB-1 | `features/exercises/api.ts` — те же вызовы, что и web (переиспользуй через `@fitness-me/shared` если вынесено) |
| 2-MOB-2 | `hooks/useExercises.ts` — TanStack Query (идентично web) |
| 2-MOB-3 | `components/ExerciseCard.tsx` — NativeWind карточка: name, category badge, muscles |
| 2-MOB-4 | `components/ExerciseFilters.tsx` — горизонтальный `ScrollView` с фильтрами по категории |
| 2-MOB-5 | `ExercisesScreen.tsx` — `FlatList` + фильтры + FAB «+» для создания |
| 2-MOB-6 | `app/(tabs)/exercises/index.tsx` — монтирует `ExercisesScreen` |
| 2-MOB-7 | `app/(tabs)/exercises/new.tsx` — форма создания (Expo Router modal) |

**Done when:** Список упражнений отображается на устройстве; pull-to-refresh работает; создание через модал сохраняется.

---

### Checklist перехода к итерации 3

- [ ] `GET /exercises` возвращает пагинацию с seed-данными
- [ ] Фильтры `search`, `category`, `muscleGroup` работают на API
- [ ] Web: таблица, поиск, create/edit/delete через модалку
- [ ] Mobile: FlatList, фильтры по категории, создание через экран
- [ ] Zod-схемы лежат в `@fitness-me/shared` и используются и на фронте, и на беке

---

## Phase 3 — Frontend monorepo bootstrap (`fitness-me-next`)

**Goal:** Turborepo + pnpm workspace containing `apps/web`, `apps/mobile`, `packages/shared`, `packages/ui`.

| # | Task |
|---|---|
| 3.1 | Replace root `package.json`: `"packageManager": "pnpm@9"`, workspaces, devDeps: `turbo typescript eslint prettier` |
| 3.2 | `pnpm-workspace.yaml` → `apps/* packages/*` |
| 3.3 | `turbo.json` pipeline: `build dev lint test` |
| 3.4 | `tsconfig.base.json` with shared options |
| 3.5 | Scaffold `packages/shared` — Zod schemas + inferred types (auth, workout, metric, nutrition) |
| 3.6 | Scaffold `packages/ui` — shadcn base + Tailwind preset |
| 3.7 | `pnpm install` — verify workspace graph; commit `chore: bootstrap fitness-me-next monorepo` |

---

## Phase 4 — Next.js Web App (`apps/web`)

**Goal:** Feature-based Next.js 15 App Router with auth, all tracker pages, charts.

### 4.1 — Scaffold

| # | Task |
|---|---|
| 4.1.1 | `pnpm create next-app@latest web --typescript --tailwind --app --src-dir` inside `apps/` |
| 4.1.2 | `npx shadcn@latest init` — neutral palette; output to `packages/ui/src/components` |
| 4.1.3 | Install: `@tanstack/react-query next-auth@beta zod react-hook-form @hookform/resolvers recharts` |
| 4.1.4 | Workspace deps: `@fitness-me/ui @fitness-me/shared` |
| 4.1.5 | `src/lib/api-client.ts` — typed fetch wrapper using `NEXT_PUBLIC_API_URL` + Bearer token |

### 4.2 — Feature-based directory structure

`app/` содержит **только роутинг** (Next.js требует этого по соглашению).  
`features/` содержит **всю логику** — компоненты, хуки, API-вызовы.  
Страница — тонкая оболочка, которая просто рендерит фичу.

```
apps/web/src/
│
├── app/                           ← РОУТИНГ (только Next.js-файлы)
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx           ← 3 строки: import + <LoginPage />
│   │   └── register/
│   │       └── page.tsx
│   ├── (app)/
│   │   ├── layout.tsx             ← защищённый layout (проверка сессии)
│   │   ├── dashboard/
│   │   │   └── page.tsx           ← import { DashboardPage } from '@/features/dashboard'
│   │   ├── workouts/
│   │   │   ├── page.tsx           ← import { WorkoutsPage } from '@/features/workouts'
│   │   │   └── [id]/
│   │   │       └── page.tsx       ← import { WorkoutDetailPage } from '@/features/workouts'
│   │   ├── exercises/
│   │   │   └── page.tsx
│   │   ├── metrics/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   └── api/
│       └── auth/[...nextauth]/
│           └── route.ts
│
└── features/                      ← ВСЯ ЛОГИКА (компоненты, хуки, типы, API)
    ├── auth/
    │   ├── components/            ← LoginForm  RegisterForm
    │   ├── hooks/                 ← useLogin  useRegister
    │   ├── api.ts                 ← POST /auth/login, POST /auth/register
    │   └── index.ts               ← barrel: export { LoginPage, RegisterPage }
    ├── dashboard/
    │   ├── components/            ← StatCard  RecentWorkouts  WeeklyChart
    │   ├── hooks/                 ← useDashboardSummary
    │   ├── api.ts
    │   └── index.ts
    ├── workouts/
    │   ├── components/            ← WorkoutList  WorkoutCard  SetLogger  SetRow
    │   ├── hooks/                 ← useWorkoutSessions  useCreateSet
    │   ├── api.ts                 ← GET/POST /workout-sessions, POST /sets
    │   └── index.ts               ← export { WorkoutsPage, WorkoutDetailPage }
    ├── exercises/
    ├── metrics/
    └── nutrition/
```

**Почему не класть логику прямо в `app/`?**

| `app/` (роутинг) | `features/` (логика) |
|---|---|
| Диктуется Next.js — файлы `page.tsx`, `layout.tsx`, `loading.tsx` | Свободная структура, удобная для разработчика |
| Нельзя переименовать папку без изменения URL | Можно рефакторить без влияния на роуты |
| Нельзя напрямую переиспользовать между страницами | Компонент `WorkoutCard` можно использовать и в dashboard, и в workouts |
| Сложно тестировать — Next.js окружение, RSC, cookies | Обычные React-компоненты — тестируются через Vitest + Testing Library |

### 4.3 — Pages

| Page | Key features |
|------|-------------|
| **Dashboard** | Summary cards, sparkline charts, quick-log shortcut |
| **Exercises** | Searchable/filterable table, add/edit modal |
| **Workouts** | Session list, session detail with set-by-set logger, optimistic updates |
| **Metrics** | Body weight + body fat line charts (Recharts), date range picker |
| **Nutrition** | Daily macro log, calorie ring *(Phase 6 full)* |
| **Settings** | Profile, change password |

### 4.4 — Shared UI (`packages/ui`)

Components: `Button Input Label Card Badge DataTable StatCard LineChart PageHeader`

**Done when:** All pages render; auth redirect works; full workout log flow works end-to-end.

---

## Phase 5 — React Native Mobile App (`apps/mobile`)

**Goal:** Expo (SDK 52+) React Native app sharing Zod schemas and types from `packages/shared`.

### 5.1 — Scaffold

| # | Task |
|---|---|
| 5.1.1 | `pnpm create expo-app mobile --template blank-typescript` inside `apps/` |
| 5.1.2 | Install: `expo-router nativewind react-native-reanimated @tanstack/react-query react-hook-form zod expo-secure-store` |
| 5.1.3 | Workspace dep: `@fitness-me/shared` |
| 5.1.4 | Configure Metro bundler to resolve workspace packages (`resolver.unstable_enablePackageExports`) |

### 5.2 — Mobile screens (Expo Router file-based)

```
apps/mobile/app/
├── (auth)/         → login.tsx  register.tsx
├── (tabs)/
│   ├── index.tsx   → Dashboard
│   ├── workouts/
│   ├── exercises/
│   └── metrics/
└── _layout.tsx
```

### 5.3 — Key mobile features

- `expo-secure-store` for JWT storage (no `localStorage`)
- Same `@fitness-me/shared` Zod schemas as web — single source of truth for validation
- Push notifications via `expo-notifications` (workout reminders) — Phase 6
- Offline-first log (AsyncStorage queue) — Phase 6

**Done when:** App boots on iOS Simulator/Android Emulator; login → log workout → view history works.

---

## Phase 6 — Integration & Testing

| # | Task |
|---|---|
| 6.1 | **`packages/shared` tests** — Vitest: each schema parses valid + rejects invalid fixtures |
| 6.2 | **API unit tests** — Jest + `jest-mock-extended`: each service with mocked PrismaClient |
| 6.3 | **API e2e tests** — `@nestjs/testing` + `supertest` against test Postgres container |
| 6.4 | **Web component tests** — Vitest + Testing Library: forms, optimistic UI, auth redirect |
| 6.5 | **Nutrition module** — full CRUD in API + web `/nutrition` page + mobile screen |
| 6.6 | Mobile offline queue + push notification setup |
| 6.7 | Manual QA: register → login → log workout → add metric → view charts → logout (web + mobile) |

---

## Phase 7 — CI/CD & Deployment

### Repo 1: `fitness-app-backend` → VPS

```
.github/workflows/
├── ci.yml              ← PR gate: lint + test + build
└── deploy-vps.yml      ← main push → Docker build → GHCR → SSH deploy + prisma migrate deploy
```

**`deploy-vps.yml` skeleton:**
```yaml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run build --filter=api
      - name: Build & push image
        run: |
          echo "${{ secrets.GHCR_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker build -t ghcr.io/${{ github.repository_owner }}/fitness-app-api:latest packages/api
          docker push ghcr.io/${{ github.repository_owner }}/fitness-app-api:latest
      - name: SSH deploy
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/fitness-app
            docker compose pull api
            docker compose up -d --no-deps api
            docker compose exec api npx prisma migrate deploy
```

### Repo 2: `fitness-me-next` → Vercel (web) + Expo EAS (mobile)

```
.github/workflows/
├── ci.yml              ← PR gate
├── deploy-web.yml      ← paths: apps/web/** packages/ui/** packages/shared/**
│                          → Vercel CLI --filter=web
└── deploy-mobile.yml   ← paths: apps/mobile/** packages/shared/**
                           → eas build --platform all --non-interactive
```

**Vercel project settings:**

| Setting | Value |
|---------|-------|
| Root Directory | `apps/web` |
| Build Command | `cd ../.. && pnpm turbo run build --filter=web` |
| Output Directory | `.next` |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` |

### VPS first-time setup (Ubuntu 22.04+)

```bash
curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER
sudo mkdir -p /opt/fitness-app
# create .env with: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, JWT_SECRET, JWT_REFRESH_SECRET
# upload docker-compose.prod.yml
cd /opt/fitness-app && docker compose up -d db
# add GitHub Actions deploy key to ~/.ssh/authorized_keys
sudo apt install -y caddy
# Caddyfile: api.yourdomain.com { reverse_proxy localhost:3001 }
# prisma seed once:
docker compose exec api npx prisma db seed
```

### Secrets

**`fitness-app-backend` repo secrets:**
```
VPS_HOST · VPS_USER · VPS_SSH_KEY · GHCR_TOKEN
DATABASE_URL · JWT_SECRET · JWT_REFRESH_SECRET
```

**`fitness-me-next` repo secrets:**
```
VERCEL_TOKEN · VERCEL_ORG_ID · VERCEL_PROJECT_ID
EXPO_TOKEN (for EAS)
NEXTAUTH_SECRET
```

### Production checklist
- [ ] VPS: `docker compose up -d db` running, seed executed
- [ ] `NEXT_PUBLIC_API_URL` → `https://api.yourdomain.com` in Vercel env
- [ ] `NEXTAUTH_URL` → `https://yourdomain.com` in Vercel env
- [ ] Caddy TLS for `api.yourdomain.com`
- [ ] CORS origin in `apps/api/src/main.ts` = `https://yourdomain.com`
- [ ] End-to-end smoke test: register → login → log workout → view chart (web + mobile)

---

## Iteration 8 — AI Coach 👈

> Агент поверх уже существующих доменов (Exercises, Workouts, Plans, Programs, Metrics).
> Никакой отдельной «AI-базы данных» — Claude вызывает те же сервисы через tool use.
> Порядок: DB (новые таблицы диалога) → API (ai module) → Web (чат) → Mobile.

### Почему после Nutrition, а не раньше

Агенту есть смысл рассуждать только когда у него есть за что зацепиться: план тренировок (`plans`), история сетов (`workouts`), метрики тела (`metrics`), дневник питания (`nutrition`). Итерации 2–6 как раз производят эти данные — AI Coach их читает, а не создаёт с нуля.

### DB: `fitness-app-backend/packages/database`

| # | Task |
|---|---|
| 8-DB-1 | `AiConversation` — id, userId FK, title?, createdAt, updatedAt |
| 8-DB-2 | `AiMessage` — id, conversationId FK, role (`user` \| `assistant` \| `tool`), content (text/JSON), createdAt |
| 8-DB-3 | `AiToolCall` — id, messageId FK, toolName, input (Json), output (Json), status (`ok` \| `error` \| `needs_confirmation`), createdAt |
| 8-DB-4 | Индекс `AiMessage(conversationId, createdAt)` для быстрой подгрузки истории |
| 8-DB-5 | `prisma migrate dev --name ai_coach` |

**Done when:** таблицы созданы, `prisma studio` показывает связи `User → AiConversation → AiMessage → AiToolCall`.

---

### BE: `packages/api/src/ai/`

| # | Task |
|---|---|
| 8-BE-1 | `AiModule` — `ai.module.ts controller service` + `AiToolsService` (реестр инструментов) |
| 8-BE-2 | `POST /ai/conversations` — создать диалог; `GET /ai/conversations` — список; `GET /ai/conversations/:id` — история |
| 8-BE-3 | `POST /ai/conversations/:id/messages` — SSE-стрим ответа Claude (Anthropic SDK, `stream: true`) |
| 8-BE-4 | Системный промпт собирается динамически: `UserProfile` + текущий `WorkoutPlan` (`PlansService.getMyPlan`) + последние 5 `BodyMetric` + `TodayWorkout` |
| 8-BE-5 | Регистрация read-only tools (выполняются без подтверждения): `search_exercises` → `ExercisesService.findAll`, `get_alternatives` → `ExercisesService.getAlternatives`, `get_metrics_history` → `MetricsService.getMetrics`, `get_today_workout` → `PlansService.getTodayWorkout`, `recommend_programs` → `ProgramsService.getRecommendedPrograms` |
| 8-BE-6 | Регистрация write tools (требуют `needs_confirmation` от фронта перед реальным вызовом): `log_set` → `WorkoutsService.logSets`, `log_metric` → `MetricsService.logMetric`, `assign_program` → `ProgramsService.assignProgram` |
| 8-BE-7 | Guard: white-list токенов на деструктивные операции (`deleteAllWorkouts`, `updateSessionNotes` и т.п.) — эти tools в реестр вообще не попадают |
| 8-BE-8 | Rate-limit на `/ai/conversations/:id/messages` (Fastify rate-limit, отдельный лимит от общего API) |
| 8-BE-9 | Промпт-guard: контент из `notes` (WorkoutSession) и произвольного ввода пользователя явно маркируется как data, не instructions, при сборке system-промпта |
| 8-BE-10 | Swagger-теги для `/ai/*` |

**Response shape (SSE event):**
```ts
// text delta
{ type: "text", delta: string }
// модель хочет вызвать write tool — ждёт подтверждения фронта
{ type: "tool_confirm", toolCallId: string, toolName: string, input: unknown }
// tool выполнен (read-only или подтверждённый write)
{ type: "tool_result", toolCallId: string, output: unknown }
```

**Done when:** `curl -N localhost:3001/ai/conversations/:id/messages` стримит текст; read-only tools выполняются сразу; write tools возвращают `tool_confirm` и ждут `POST /ai/tool-calls/:id/confirm`.

---

### Web: `apps/web/src/features/ai-coach/`

| # | Task |
|---|---|
| 8-WEB-1 | `api.ts` — `createConversation()`, `getConversations()`, `streamMessage(conversationId, text)` (fetch + ReadableStream), `confirmToolCall(id)` |
| 8-WEB-2 | `hooks/useAiChat.ts` — стриминг в состояние, буферизация text-дельт |
| 8-WEB-3 | `components/ChatWindow.tsx` — история сообщений, авто-скролл |
| 8-WEB-4 | `components/ToolConfirmCard.tsx` — карточка «Claude хочет залогировать подход: жим лёжа 3×10×80кг — подтвердить/отменить» |
| 8-WEB-5 | `components/ChatInput.tsx` — текстовый ввод + (опционально) голосовой ввод через Web Speech API |
| 8-WEB-6 | `AiCoachPage.tsx` — страница чата, использует FitMe design-system (`FmBtn`, токены `T.*`) |
| 8-WEB-7 | `app/(app)/ai-coach/page.tsx` — 2 строки: import + `<AiCoachPage />` |
| 8-WEB-8 | Плавающая кнопка чата в `(app)/layout.tsx` — быстрый доступ с любого экрана |

**Done when:** диалог создаётся, текст стримится токен за токеном, read-only tool-вызовы (например, подбор альтернативы упражнения) отображаются инлайн, write tool-вызовы показывают confirm-карточку и не исполняются без клика.

---

### Mobile: `apps/mobile/app/(tabs)/ai-coach/`

| # | Task |
|---|---|
| 8-MOB-1 | `features/ai-coach/api.ts` — те же вызовы, что и web |
| 8-MOB-2 | `hooks/useAiChat.ts` — идентично web, стриминг через `fetch` + `TextDecoder` (RN-совместимо) |
| 8-MOB-3 | `ChatScreen.tsx` — `FlatList` сообщений + NativeWind, confirm-карточки как отдельные bubble-компоненты |
| 8-MOB-4 | `app/(tabs)/ai-coach/index.tsx` — монтирует `ChatScreen` |
| 8-MOB-5 | Голосовой ввод через `expo-speech-recognition` (Phase 6+ фича, опционально) |

**Done when:** экран чата открывается из таб-бара; стрим текста работает на устройстве; confirm-карточки блокируют write-действия до подтверждения.

---

### Checklist перехода к следующей итерации

- [ ] `AiConversation/AiMessage/AiToolCall` в схеме и миграции применены
- [ ] Read-only tools (`search_exercises`, `get_alternatives`, `get_metrics_history`, `get_today_workout`, `recommend_programs`) вызываются моделью и возвращают реальные данные
- [ ] Write tools (`log_set`, `log_metric`, `assign_program`) никогда не исполняются без явного `confirm` от пользователя
- [ ] Деструктивные операции (`deleteAllWorkouts` и т.п.) не зарегистрированы как tools вообще
- [ ] Web: чат стримится, confirm-карточки работают, доступен с любого экрана
- [ ] Mobile: чат-экран работает аналогично web
- [ ] Rate-limit и prompt-guard на `/ai/*` включены

---

## Delivery Summary

| Phase | Output | Est. effort |
|-------|--------|-------------|
| 0 — BE bootstrap | Repo + Docker Postgres | 0.5 day |
| 1 — Database | Prisma schema + migrations + seed | 1 day |
| 2 — API | NestJS/Fastify REST + Swagger + Docker | 3–4 days |
| 3 — FE bootstrap | Turborepo + pnpm workspace | 0.5 day |
| 4 — Web | Next.js feature-based app | 4–5 days |
| 5 — Mobile | Expo React Native app | 3–4 days |
| 6 — Testing | Unit + integration + e2e | 2 days |
| 7 — CI/CD | 4 workflows + VPS + Vercel + EAS | 1 day |
| 8 — AI Coach | ai module (BE) + чат (Web) + чат (Mobile) | 4–5 days |
| **Total** | | **~20–21 days** |
