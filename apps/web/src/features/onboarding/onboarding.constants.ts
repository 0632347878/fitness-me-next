/**
 * Option catalogs for the onboarding steps.
 *
 * Every `value` here MUST be an exact Prisma enum member. The backend validates
 * with @IsEnum(..., { each: true }); a mismatched string (e.g. "home" instead of
 * "BODYWEIGHT") passes the form but 400s at PATCH and silently breaks the
 * injury/equipment filters downstream. Labels are display-only.
 */

import type { ExperienceLevel } from "@/features/programs/programs.api";

export type Localized = { en: string; ru: string };

// ── Sport ──────────────────────────────────────────────────────────────────────
// Launch scope per positioning: ski + snowboard primary. Others kept so existing
// users aren't excluded, but the copy leads with the winter set.
export const SPORTS: { value: string; label: Localized; emoji: string }[] = [
  { value: "ski",         label: { en: "Skiing",       ru: "Лыжи" },        emoji: "⛷️" },
  { value: "snowboard",   label: { en: "Snowboarding", ru: "Сноуборд" },    emoji: "🏂" },
  { value: "gym",         label: { en: "Gym",          ru: "Зал" },         emoji: "🏋️" },
  { value: "kitesurf",    label: { en: "Kitesurfing",  ru: "Кайтсёрфинг" }, emoji: "🪁" },
];

// ── Experience ───────────────────────────────────────────────────────────────
export const LEVELS: { value: ExperienceLevel; label: Localized; hint: Localized }[] = [
  { value: "BEGINNER",     label: { en: "Beginner",     ru: "Новичок" },      hint: { en: "< 6 months",       ru: "< 6 месяцев" } },
  { value: "INTERMEDIATE", label: { en: "Intermediate", ru: "Средний" },      hint: { en: "6 mo – 2 years",   ru: "6 мес – 2 года" } },
  { value: "ADVANCED",     label: { en: "Advanced",     ru: "Продвинутый" },  hint: { en: "2+ years, RPE",    ru: "2+ года, RPE" } },
];

// ── Equipment (multi) ────────────────────────────────────────────────────────
export const EQUIPMENT: { value: string; label: Localized }[] = [
  { value: "BODYWEIGHT",      label: { en: "Bodyweight",      ru: "Свой вес" } },
  { value: "DUMBBELL",        label: { en: "Dumbbells",       ru: "Гантели" } },
  { value: "BARBELL",         label: { en: "Barbell",         ru: "Штанга" } },
  { value: "KETTLEBELL",      label: { en: "Kettlebell",      ru: "Гиря" } },
  { value: "RESISTANCE_BAND", label: { en: "Bands",           ru: "Резина" } },
  { value: "PULL_UP_BAR",     label: { en: "Pull-up bar",     ru: "Турник" } },
  { value: "CABLE",           label: { en: "Cable",           ru: "Блок" } },
  { value: "MACHINE",         label: { en: "Machines",        ru: "Тренажёры" } },
  { value: "SMITH_MACHINE",   label: { en: "Smith machine",   ru: "Смит" } },
];

// ── Injuries (multi) ─────────────────────────────────────────────────────────
export const INJURIES: { value: string; label: Localized }[] = [
  { value: "LUMBAR_HERNIATION",   label: { en: "Lower back / herniation", ru: "Поясница / грыжа" } },
  { value: "CERVICAL_ISSUE",      label: { en: "Neck",                    ru: "Шея" } },
  { value: "SHOULDER_IMPINGEMENT",label: { en: "Shoulder",                ru: "Плечо" } },
  { value: "KNEE_PAIN",           label: { en: "Knee",                    ru: "Колено" } },
  { value: "WRIST_PAIN",          label: { en: "Wrist",                   ru: "Запястье" } },
  { value: "HIP_ISSUE",           label: { en: "Hip",                     ru: "Таз / бедро" } },
];

// Days-per-week options for program recommendation.
export const DAYS_PER_WEEK = [3, 4, 5, 6] as const;
