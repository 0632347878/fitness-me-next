# Caching Strategy — Redis + HTTP Headers

> Статус: план реализации  
> Цель: снизить нагрузку на WorkoutX API и БД за счёт двухуровневого кеширования — Redis на бэкенде и HTTP-заголовки на фронтенде.

---

## 1. Почему это нужно

- **WorkoutX API лимиты**: 500 req/мес на free tier. Даже при стратегии «один раз загрузить в БД» крон-синхронизация и запросы alternatives могут исчерпать квоту при активной разработке.
- **VPS слабый**: 1 CPU / 2GB RAM — без кеша повторные тяжёлые запросы (program generation, exercise list) будут каждый раз идти в Postgres.
- **Vercel cold starts**: SSR-запросы к API без кеша дают заметную задержку на первом рендере.

---

## 2. Архитектура двухуровневого кеширования

```
Клиент (браузер / Expo)
  │  Cache-Control / ETag / stale-while-revalidate
  ▼
Next.js (Vercel)
  │  fetch() cache + revalidate (Next.js Data Cache)
  ▼
NestJS API (VPS)
  │  Redis cache-aside
  ▼
PostgreSQL / WorkoutX API
```

**Уровень 1 — HTTP-заголовки** (браузер + Vercel CDN):  
Статичные или редко меняющиеся данные кешируются прямо в браузере и на Vercel Edge. Без запроса к API вообще.

**Уровень 2 — Redis** (на VPS, тот же Docker Compose):  
Защищает Postgres от повторных тяжёлых запросов. Cache-aside паттерн: сначала Redis, при miss — БД, результат пишем в Redis с TTL.

---

## 3. Redis — инфраструктура

### 3.1 Docker Compose (добавить в `docker-compose.prod.yml`)

```yaml
services:
  # ... существующие api, db

  redis:
    image: redis:7-alpine
    container_name: fitness_redis
    restart: unless-stopped
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru --save ""
    volumes:
      - redis_data:/data
    networks:
      - app_network
    # не пробрасываем порт наружу — только внутри Docker network

volumes:
  redis_data:
```

`--maxmemory 256mb` — резервируем 256MB из 2GB RAM VPS. `allkeys-lru` — при нехватке памяти вытесняем наименее используемые ключи. `--save ""` — отключаем persistence (кеш, не хранилище).

### 3.2 NestJS — подключение

```bash
pnpm add @nestjs/cache-manager cache-manager cache-manager-ioredis ioredis
```

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        store: redisStore,
        host: 'redis',        // имя сервиса в docker-compose
        port: 6379,
        ttl: 60 * 60,         // дефолт: 1 час
      }),
    }),
    // ...
  ],
})
```

### 3.3 `.env` добавить

```
REDIS_HOST=redis
REDIS_PORT=6379
```

---

## 4. Redis — что и как долго кешируем

| Ключ | Данные | TTL | Инвалидация |
|---|---|---|---|
| `exercises:all` | Весь список упражнений из БД | 24h | При крон-синхронизации |
| `exercises:{id}` | Одно упражнение | 24h | При обновлении записи |
| `exercises:{id}:alternatives` | Гантельные замены | 24h | При обновлении связей |
| `program-templates:all` | Каталог методологий | 7d | При изменении seed |
| `program-templates:{level}` | Шаблоны по уровню | 7d | При изменении seed |
| `programs:{userId}:current` | Текущая программа пользователя | 1h | При regenerate / update |
| `workouts:{userId}:today` | Сегодняшняя тренировка | 30min | При логировании сета |

### 4.1 Cache-aside в сервисе (пример для exercises)

```typescript
// exercises.service.ts
@Injectable()
export class ExercisesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async findAll(): Promise<Exercise[]> {
    const key = 'exercises:all';
    const cached = await this.cache.get<Exercise[]>(key);
    if (cached) return cached;

    const exercises = await this.prisma.exercise.findMany();
    await this.cache.set(key, exercises, 60 * 60 * 24); // 24h
    return exercises;
  }

  async findAlternatives(id: string, equipment: Equipment[]): Promise<Exercise[]> {
    const key = `exercises:${id}:alternatives:${equipment.sort().join(',')}`;
    const cached = await this.cache.get<Exercise[]>(key);
    if (cached) return cached;

    const result = await this.prisma.exercise.findMany({ /* ... */ });
    await this.cache.set(key, result, 60 * 60 * 24);
    return result;
  }

  // Инвалидация при обновлении
  async invalidateExerciseCache(id: string) {
    await this.cache.del('exercises:all');
    await this.cache.del(`exercises:${id}`);
    // alternatives инвалидируем паттерном через ioredis напрямую если нужно
  }
}
```

### 4.2 Декоратор `@CacheKey` для простых случаев

```typescript
@Get('templates')
@CacheKey('program-templates:all')
@CacheTTL(60 * 60 * 24 * 7) // 7 дней
async getProgramTemplates(@Query('level') level?: ExperienceLevel) {
  return this.programsService.getTemplates(level);
}
```

---

## 5. HTTP-заголовки — фронтенд

### 5.1 Next.js Server Components — `fetch()` cache

Next.js 15 кеширует `fetch()` в Server Components нативно. Настраиваем `next.revalidate` под каждый тип данных:

```typescript
// features/exercises/api.ts

// Список упражнений — обновляется раз в сутки
export async function getExercises() {
  const res = await fetch(`${API_URL}/exercises`, {
    next: { revalidate: 86400 }, // 24h, Vercel CDN кеширует
  });
  return res.json();
}

// Каталог методологий — стабильные данные
export async function getProgramTemplates() {
  const res = await fetch(`${API_URL}/program-templates`, {
    next: { revalidate: 604800 }, // 7 дней
  });
  return res.json();
}

// Текущая тренировка — персональные данные, не кешируем на CDN
export async function getTodayWorkout(userId: string) {
  const res = await fetch(`${API_URL}/workouts/today`, {
    cache: 'no-store', // всегда свежие данные
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
```

### 5.2 NestJS — выставлять Cache-Control в ответах

```typescript
// exercises.controller.ts
@Get()
@Header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600')
async findAll(@Res({ passthrough: true }) res: Response) {
  return this.exercisesService.findAll();
}

@Get('templates')
@Header('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400')
async getTemplates() {
  return this.programsService.getTemplates();
}

// Персональные данные — никогда не кешировать на CDN
@Get('workouts/today')
@Header('Cache-Control', 'private, no-store')
async getTodayWorkout(@CurrentUser() user: User) {
  return this.workoutsService.getToday(user.id);
}
```

**`stale-while-revalidate`**: браузер отдаёт устаревший кеш мгновенно, фоново обновляет — пользователь не ждёт.

### 5.3 ETag для условных запросов

```typescript
// exercises.controller.ts
@Get(':id')
async findOne(@Param('id') id: string, @Req() req, @Res({ passthrough: true }) res) {
  const exercise = await this.exercisesService.findOne(id);
  const etag = `"${exercise.updatedAt.getTime()}"`;

  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'public, max-age=86400');

  if (req.headers['if-none-match'] === etag) {
    res.status(304).send(); // Not Modified — тело не передаём
    return;
  }

  return exercise;
}
```

### 5.4 TanStack Query — клиентский кеш

TanStack Query v5 уже в стеке. Настраиваем `staleTime` под тип данных:

```typescript
// lib/query-client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 мин по умолчанию
      gcTime: 10 * 60 * 1000,       // 10 мин в памяти
    },
  },
});

// features/exercises/hooks.ts
export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: fetchExercises,
    staleTime: 24 * 60 * 60 * 1000, // 24h — список меняется редко
  });
}

export function useAlternatives(exerciseId: string) {
  return useQuery({
    queryKey: ['alternatives', exerciseId],
    queryFn: () => fetchAlternatives(exerciseId),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useTodayWorkout() {
  return useQuery({
    queryKey: ['workouts', 'today'],
    queryFn: fetchTodayWorkout,
    staleTime: 0, // всегда актуально
    refetchOnWindowFocus: true,
  });
}
```

---

## 6. Что НЕ кешируем

- `POST / PATCH / DELETE` — любая мутация, всегда идёт напрямую
- Данные логов тренировок пользователя — персональные, `private, no-store`
- Auth endpoints (`/auth/login`, `/auth/refresh`) — очевидно
- Прогресс и PR пользователя — персональные, `private, no-store`

---

## 7. Локальная разработка

Redis поднимается вместе с Postgres через `docker-compose.yml`:

```yaml
# docker-compose.yml (dev)
services:
  db:
    image: postgres:16-alpine
    # ...

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"   # пробрасываем только в dev для отладки
    command: redis-server --save ""
```

Просмотр кеша в dev:
```bash
docker exec -it fitness_redis redis-cli
> KEYS *
> GET exercises:all
> TTL exercises:all
```

---

## 8. План задач

| # | Задача | Слой | Приоритет |
|---|---|---|---|
| C1 | Добавить Redis в `docker-compose.prod.yml` и `docker-compose.yml` | Infra | 🔴 P0 |
| C2 | Подключить `CacheModule` с Redis store в NestJS `app.module.ts` | BE | 🔴 P0 |
| C3 | Cache-aside в `ExercisesService` (findAll, findOne, findAlternatives) | BE | 🔴 P0 |
| C4 | `Cache-Control` заголовки в controllers (exercises, program-templates) | BE | 🔴 P0 |
| C5 | Cache-aside в `ProgramTemplatesService` | BE | 🟠 P1 |
| C6 | Cache-aside в `ProgramsService` (текущая программа пользователя) | BE | 🟠 P1 |
| C7 | ETag для `GET /exercises/:id` | BE | 🟠 P1 |
| C8 | `fetch()` с `next.revalidate` в Server Components (exercises, templates) | Web | 🟠 P1 |
| C9 | `staleTime` настройка в `queryClient` и хуках по типу данных | Web | 🟠 P1 |
| C10 | Инвалидация кеша при крон-синхронизации WorkoutX | BE | 🟡 P2 |
| C11 | `Cache-Control: private, no-store` для персональных эндпоинтов | BE | 🟡 P2 |
| C12 | Redis в `docker-compose.yml` (dev) + документация в README | Infra | 🟡 P2 |

---

## 9. Связанные документы

- `docs/plan/training-plan.md` → раздел 2 (WorkoutX API лимиты)
- `docs/ARCHITECTURE.md` → секция deployment (VPS specs)
- Obsidian: `My purposes/FitnessApp/Stack.md`
- Obsidian: `My purposes/FitnessApp/Caching Strategy.md`
