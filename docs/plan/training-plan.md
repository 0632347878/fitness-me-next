# Training Program Selection — Plan реализации
> Фича: подбор персонализированной тренировочной программы с автоматической заменой тренажёрных упражнений на гантельные варианты + выбор методологии, телосложения и структуры.
> Контекст: Repwise — sport-specific periodized prep app (ski / snowboard / kite / cycling). Стек: NestJS + Prisma + Next.js 15 + Expo.

> **⚡ MVP-режим:** цель — запустить быстро и привлечь первых пользователей.
> Всё что не нужно прямо сейчас вынесено в `## POST-MVP` в конце документа.
> Туда идут: Redis, HTTP-кеширование, multi-schema БД для упражнений, крон-синхронизация.

---

## 1. Контекст и цель

Пользователь приходит в зал и не находит нужный тренажёр (занят, не работает, временно убран).
Приложение должно **в один тап** предложить гантельную альтернативу того же упражнения на те же мышцы — с сохранением прогрессии периодизации «к дате».

Дополнительно: система учитывает **injury-aware** фильтрацию при выборе как основных упражнений, так и гантельных замен.

Пользователь выбирает **методологию** (Менцер, 5×5, PPL и др.), **тип телосложения** и **структуру** (Full Body / Split). Выбор разблокируется в зависимости от уровня тренированности — новичку лишние параметры не показываются.

---

## 2. Источник данных об упражнениях (MVP-решение)

**WorkoutX API → один раз импортировать → хранить в основной Postgres. Всё.**

```typescript
// packages/database/prisma/seed-exercises.ts
async function seedFromWorkoutX() {
  const res = await fetch('https://api.workoutxapp.com/v1/exercises?limit=1500', {
    headers: { 'x-api-key': process.env.WORKOUTX_API_KEY },
  });
  const exercises = await res.json();

  await prisma.exercise.createMany({
    data: exercises.map(mapWorkoutXToPrisma),
    skipDuplicates: true,
  });

  console.log(`Seeded ${exercises.length} exercises`);
}
```

Запускается один раз: `pnpm db:seed`. После этого WorkoutX не дёргается вообще — 500 запросов в месяц не тратятся. GIF-ссылки берём напрямую с CDN WorkoutX (их хостинг, не наш) — на MVP это нормально.

---

## 3. Модель данных (BE — Prisma)

### Exercise

```prisma
model Exercise {
  id               String          @id @default(cuid())
  externalId       String?         @unique  // WorkoutX ID (для будущей синхронизации)
  name             String
  nameRu           String?
  muscleGroups     MuscleGroup[]
  secondaryMuscles MuscleGroup[]
  equipment        Equipment[]
  mechanics        Mechanics?
  force            ForceDirection?
  difficulty       ExperienceLevel?
  caloriesPerMin   Float?
  instructions     String[]
  gifUrl           String?
  injuryFlags      InjuryTag[]
  alternatives     Exercise[]      @relation("ExerciseAlternatives")
  alternativeFor   Exercise[]      @relation("ExerciseAlternatives")
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
}

enum Equipment { BARBELL DUMBBELL CABLE MACHINE SMITH_MACHINE KETTLEBELL BODYWEIGHT RESISTANCE_BAND PULL_UP_BAR }
enum Mechanics { COMPOUND ISOLATION }
enum ForceDirection { PUSH PULL STATIC }
enum InjuryTag { LUMBAR_HERNIATION CERVICAL_ISSUE SHOULDER_IMPINGEMENT KNEE_PAIN WRIST_PAIN HIP_ISSUE }
```

### WorkoutSet — флаг замены

```prisma
model WorkoutSet {
  // ... существующие поля
  isAlternative  Boolean  @default(false)
  substituteFor  String?
}
```

### ExperienceLevel, Somatotype, ProgramTemplate

```prisma
enum ExperienceLevel { BEGINNER INTERMEDIATE ADVANCED }
enum Somatotype { ECTOMORPH MESOMORPH ENDOMORPH }
enum ProgramStructure { FULL_BODY UPPER_LOWER PUSH_PULL_LEGS PUSH_PULL BRO_SPLIT CUSTOM }
enum ScienceLevel { STRONG MODERATE ANECDOTAL }

model ProgramTemplate {
  id             String           @id @default(cuid())
  slug           String           @unique
  name           String
  shortName      String
  author         String?
  structure      ProgramStructure
  minLevel       ExperienceLevel
  daysPerWeek    Int[]
  pros           String[]
  cons           String[]
  bestFor        String[]
  notFor         String[]
  scienceBacking ScienceLevel
  description    String
  isActive       Boolean          @default(true)
}
```

### UserProfile

```prisma
model UserProfile {
  // ... существующие поля
  injuryFlags       InjuryTag[]
  preferDumbbell    Boolean           @default(false)
  experienceLevel   ExperienceLevel   @default(BEGINNER)
  somatotype        Somatotype?
  programTemplateId String?
  programStructure  ProgramStructure?
}
```

**Миграции:**
```bash
prisma migrate dev --name add-exercise-fields-alternatives
prisma migrate dev --name add-experience-somatotype-program-template
```

---

## 4. Сид: гантельные альтернативы

| Тренажёр / штанга | Гантельная альтернатива | Мышцы |
|---|---|---|
| Leg Press | Goblet Squat / DB Split Squat | Квадрицепс, ягодицы |
| Seated Leg Curl | DB Romanian Deadlift | Бицепс бедра |
| Lat Pulldown | DB Single-Arm Row | Широчайшая |
| Cable Row | DB Bent-Over Row | Широчайшая, ромбовидная |
| Chest Press Machine | DB Bench Press | Грудь, трицепс |
| Cable Flye | DB Flye | Грудь |
| Shoulder Press Machine | DB Overhead Press | Дельта |
| Cable Lateral Raise | DB Lateral Raise | Средняя дельта |
| Cable Tricep Pushdown | DB Overhead Tricep Ext | Трицепс |
| Preacher Curl | DB Incline Curl | Бицепс |
| Back Extension Machine | DB Superman / DB RDL | Разгибатели спины |
| Leg Abductor Machine | DB Side Lunge | Отводящие |

---

## 5. Сид: каталог методологий

| slug | Название | minLevel | Структура | Наука |
|---|---|---|---|---|
| `beginner-fullbody` | Базовая программа новичка | BEGINNER | FULL_BODY | STRONG |
| `stronglifts-5x5` | StrongLifts 5×5 | BEGINNER | FULL_BODY | STRONG |
| `upper-lower-4day` | Upper/Lower 4 дня | INTERMEDIATE | UPPER_LOWER | STRONG |
| `mentzer-hit` | HIT Майка Менцера | ADVANCED | BRO_SPLIT | ANECDOTAL |
| `ppl-6day` | Push/Pull/Legs 6 дней | INTERMEDIATE | PUSH_PULL_LEGS | MODERATE |
| `nsca-periodized` | Линейная периодизация NSCA | INTERMEDIATE | UPPER_LOWER | STRONG |
| `action-sports-base` | Repwise Action Sports Base | BEGINNER | FULL_BODY | MODERATE |

---

## 6. Уровень тренированности → что открывается

```
Как давно тренируешься?
  ◉ < 6 мес / начинаю сначала  → BEGINNER
  ◯ 6 мес — 2 года              → INTERMEDIATE
  ◯ > 2 лет, работаю с RPE     → ADVANCED
```

| | BEGINNER | INTERMEDIATE | ADVANCED |
|---|---|---|---|
| Структура | Full Body 3x (авто) | Full Body или Upper/Lower | Любая |
| Выбор методологии | ❌ | ✅ ограниченный список | ✅ все |
| RPE в UI | ❌ | ✅ | ✅ |

---

## 7. Тип телосложения

Визуальный выбор 3 силуэтов. Влияет на объём (±10–20% сетов) и кардио-блок. Рекомендательный, не жёсткий.

---

## 8. API-эндпоинты (NestJS)

```
GET  /exercises/:id/alternatives   — гантельные замены (фильтр по equipment + injuryFlags)
GET  /program-templates            — каталог методологий (фильтр по level, поле locked)
GET  /programs/generate            — генерация программы
PATCH /workout-sessions/:id/sets/:setId/substitute  — заменить упражнение в сете
```

---

## 9. Frontend (Next.js 15)

**Онбординг:** ExperienceLevel → Somatotype → Оборудование → Травмы → Структура* → Методология* → Спорт+дата  
(\* только INTERMEDIATE+)

**ProgramSelector:** карточки с pros/cons/scienceBacking, заблокированные — серые с тултипом.

**ExerciseSetCard:** кнопка «⚡ Нет тренажёра» → AlternativeDrawer с GIF-превью замен.

---

## 10. Mobile (Expo)

BottomSheetModal с альтернативами, MMKV офлайн-кеш для текущей тренировки.

---

## 11. MVP — план задач

| # | Задача | Слой | Приоритет |
|---|---|---|---|
| T1 | Prisma: Exercise (новые поля + alternatives M2M) | BE | 🔴 P0 |
| T2 | Prisma: ExperienceLevel, Somatotype, ProgramTemplate, UserProfile | BE | 🔴 P0 |
| T3 | `seed-exercises.ts` — один раз скачать из WorkoutX в Postgres | BE | 🔴 P0 |
| T4 | Seed: 12+ пар гантельных замен | BE | 🔴 P0 |
| T5 | Seed: 7 методологий | BE | 🔴 P0 |
| T6 | `GET /exercises/:id/alternatives` | BE | 🔴 P0 |
| T7 | `PATCH /workout-sessions/.../substitute` | BE | 🔴 P0 |
| T8 | `GET /program-templates` | BE | 🟠 P1 |
| T9 | Onboarding шаги 1–4 (level, somatotype, equipment, injuries) | Web | 🟠 P1 |
| T10 | Onboarding шаги 5–6 (структура + методология, INTERMEDIATE+) | Web | 🟠 P1 |
| T11 | AlternativeDrawer + кнопка «Нет тренажёра» | Web | 🟠 P1 |
| T12 | Profile: injury + experience settings | Web | 🟠 P1 |
| T13 | Алгоритм генерации (level + somatotype + equipment + injuries) | BE | 🟡 P2 |
| T14 | Mobile: BottomSheet альтернативы + MMKV кеш | Mobile | 🟡 P2 |
| T15 | Mobile: ProgramSelector на онбординге | Mobile | 🟡 P2 |

**Спринт 1:** T1 → T2 → T3 → T4 → T5 → T6 → T7  
**Спринт 2:** T8 → T9 → T10 → T11 → T12  
**Спринт 3:** T13 → T14 → T15

---

## POST-MVP (не трогать до первых денег)

### Кеширование WorkoutX API — отдельная схема в Postgres
Упражнения вынести в отдельную Postgres-схему `exercises` (Prisma multi-schema).
Плюс: изоляция, отдельный бэкап, чистая основная схема.
Документ: `docs/plan/exercises-schema.md` *(создать когда придёт время)*

### Redis + HTTP-заголовки
Двухуровневое кеширование для снижения нагрузки на Postgres при росте пользователей.
Документ: `docs/plan/caching-strategy.md`

### Крон-синхронизация упражнений
Ежемесячный батч-запрос к WorkoutX для получения новых упражнений.
Добавить после того как появится бюджет на Starter план ($9.99/мес).

### GIF на своём хостинге
Скачать GIF в DigitalOcean Spaces (~750MB). Сейчас — прямые ссылки на CDN WorkoutX, MVP это устраивает.

---

## 12. Связанные документы

- `docs/ARCHITECTURE.md`, `docs/PLAN.md`
- `docs/plan/caching-strategy.md` — Redis + HTTP-заголовки (post-MVP)
- Obsidian: `My purposes/FitnessApp/Exercise API Research.md`
- Obsidian: `My purposes/FitnessApp/Caching Strategy.md`
