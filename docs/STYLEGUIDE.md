# FitMe – Frontend Styleguide

## Styling Rules

### 1. CSS Modules for static styles, inline only for runtime values

Every component gets a co-located `.module.css` file. Static styles — layout, spacing, typography, colors that come from CSS variables — go into the module. Inline `style={{}}` is reserved exclusively for values computed at runtime (e.g. a color that depends on exercise category).

**✅ Correct**
```tsx
// WorkoutHistoryCard.module.css
.iconWrap {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background: var(--fm-bg-card); /* static — belongs in CSS */
}

// WorkoutHistoryCard.tsx
<div className={styles.iconWrap} style={{ background: accentColor + "15" }}>
  {/* accentColor is computed from exercise category at runtime → inline is correct */}
</div>
```

**❌ Wrong — static object in JS**
```tsx
const S = {
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 11,
    background: T.bgCard,   // static value disguised as "dynamic"
  } as React.CSSProperties,
};
<div style={S.iconWrap} />
```

**❌ Wrong — scattered inline**
```tsx
<div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
```

### 2. Design tokens via CSS variables

All design tokens are available as CSS custom properties (defined in `globals.css`). Use them in `.module.css` files directly — do **not** import `T.*` into CSS modules.

| JS token (`T.*`) | CSS variable |
|---|---|
| `T.bg` | `var(--fm-bg)` |
| `T.bgCard` | `var(--fm-bg-card)` |
| `T.bgInput` | `var(--fm-bg-input)` |
| `T.border` | `var(--fm-border)` |
| `T.accent` | `var(--fm-accent)` |
| `T.success` | `var(--fm-success)` |
| `T.textPrimary` | `var(--fm-text-primary)` |
| `T.textSub` | `var(--fm-text-sub)` |
| `T.textMuted` | `var(--fm-text-muted)` |

Use `T.*` in TSX only when passing a color to an Icon or a truly dynamic inline style.

### 3. Icons — always use `Icon.*` from `@/components/fm`

Never write raw `<svg>` tags in component files. Add missing icons to `fm/index.tsx` first, then use them.

**Available icons:** `Home`, `Dumbbell`, `Search`, `Chart`, `Plus`, `PlusCircle`, `Flame`, `Timer`, `ChevDown`, `ChevLeft`, `ChevRight`, `Bolt`, `User`, `Pencil`, `Check`, `Calendar`

```tsx
// ✅
<Icon.ChevLeft s={16} c={T.textSub} />

// ❌
<svg width="16" height="16" viewBox="0 0 24 24" ...><polyline points="15 18 9 12 15 6" /></svg>
```

### 4. Typography

| Role | Font | Class pattern |
|---|---|---|
| Headings, labels, numbers | `Barlow Condensed` | `var(--font-barlow-condensed)` |
| Body, UI text | `DM Sans` | `var(--font-dm-sans)` |

### 5. Component file structure

```
features/<name>/components/
  MyComponent.tsx          ← logic + JSX
  MyComponent.module.css   ← all static styles
```

The page file (`app/(app)/<route>/page.tsx`) contains only routing logic and layout composition — no component definitions, no inline style blocks.

### 6. Shared logic — where to put it

| Scope | Location |
|---|---|
| Используется только внутри одной фичи | `features/<name>/<name>.utils.ts` |
| Используется в двух и более фичах | `lib/<domain>-utils.ts` |
| Универсальная (даты, строки, математика) | `lib/utils.ts` |

**Пример — внутри фичи:**
```
features/workouts/
  workouts.api.ts       ← types + API calls
  workouts.utils.ts     ← groupSetsByExercise, calcDurationMinutes, ExerciseGroup
  components/
    SetLogger.tsx
    WorkoutHistoryCard.tsx
```

```ts
// workouts.utils.ts
export type ExerciseGroup = { ... };
export function groupSetsByExercise(sets: WorkoutSet[]): ExerciseGroup[] { ... }

// SetLogger.tsx / WorkoutHistoryCard.tsx
import { groupSetsByExercise, type ExerciseGroup } from "../workouts.utils";
```

**Пример — между фичами:**
```ts
// lib/workout-utils.ts  ← если нужно и в workouts, и в dashboard
export function calcVolume(...) { ... }
```

Никогда не дублируй функцию в двух файлах — найди нужный уровень и вынеси.
