"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { FmStyles, FmPageLoader } from "@/components/fm";
import { useLang } from "@/lib/lang-context";
import {
  useUpdateUserProfile,
  useAssignProgram,
  getRecommendedPrograms,
  type ExperienceLevel,
} from "@/features/programs";
import { useGeneratePlan } from "@/features/plans";
import {
  SPORTS, LEVELS, EQUIPMENT, INJURIES, DAYS_PER_WEEK, type Localized,
} from "../onboarding.constants";
import s from "./OnboardingWizard.module.css";

type StepId = "sport" | "level" | "body" | "days" | "equipment" | "injuries" | "date" | "program";
const STEPS: StepId[] = ["sport", "level", "body", "days", "equipment", "injuries", "date", "program"];

// Draft holds everything collected before we start persisting on each step.
type Draft = {
  sport: string | null;
  experienceLevel: ExperienceLevel | null;
  heightCm: number | null;
  weightKg: number | null;
  daysPerWeek: number | null;
  availableEquipment: string[];
  injuryFlags: string[];
  targetDate: string | null;
};

const EMPTY: Draft = {
  sport: null,
  experienceLevel: null,
  heightCm: null,
  weightKg: null,
  daysPerWeek: null,
  availableEquipment: [],
  injuryFlags: [],
  targetDate: null,
};

// Localised "why this program" chip for a recommendation reason code.
function reasonLabel(code: string, lang: string, days: number | null): string {
  const ru = lang === "ru";
  switch (code) {
    case "LEVEL_MATCH": return ru ? "Твой уровень" : "Your level";
    case "LEVEL_OK":    return ru ? "Подходит по уровню" : "Suits your level";
    case "DAYS_EXACT":  return days ? (ru ? `${days} дней/нед` : `${days} days/wk`) : (ru ? "По дням" : "Days match");
    case "DAYS_RANGE":  return ru ? "Подходит по дням" : "Days fit";
    case "SPORT_FIT":   return ru ? "Для твоего спорта" : "For your sport";
    default:            return code;
  }
}

export function OnboardingWizard() {
  const router = useRouter();
  const { lang } = useLang();
  const L = (o: Localized) => (lang === "ru" ? o.ru : o.en);

  const [stepIdx, setStepIdx] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useUpdateUserProfile();
  const assignProgram = useAssignProgram();
  const generatePlan = useGeneratePlan();

  const step = STEPS[stepIdx];
  const isLast = step === "program";

  // Program recommendations, fetched only once we reach the program step and
  // have the inputs the recommender needs.
  const canRecommend = step === "program" && !!draft.sport && !!draft.experienceLevel;
  const { data: recommended, isLoading: loadingRecs } = useQuery({
    queryKey: ["programs", "recommend", draft.experienceLevel, draft.sport, draft.daysPerWeek],
    queryFn: () =>
      getRecommendedPrograms({
        experienceLevel: draft.experienceLevel!,
        sport: draft.sport ?? undefined,
        daysPerWeek: draft.daysPerWeek ?? undefined,
      }),
    enabled: canRecommend,
  });

  function patch(p: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...p }));
  }
  function toggle(list: keyof Pick<Draft, "availableEquipment" | "injuryFlags">, value: string) {
    setDraft((d) => {
      const cur = d[list];
      return { ...d, [list]: cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value] };
    });
  }

  // Can the current step advance?
  const canAdvance = (() => {
    switch (step) {
      case "sport":     return !!draft.sport;
      case "level":     return !!draft.experienceLevel;
      case "body":      return true; // optional — no weight just means no suggested load
      case "days":      return !!draft.daysPerWeek;
      case "equipment": return draft.availableEquipment.length > 0;
      case "injuries":  return true; // "none" is valid
      case "date":      return true; // optional
      case "program":   return !!selectedProgram;
    }
  })();

  async function next() {
    setError(null);
    if (isLast) return finish();
    setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  }
  function back() {
    setError(null);
    setStepIdx((i) => Math.max(i - 1, 0));
  }

  // Persist the whole profile, assign the program, generate the plan, go home.
  async function finish() {
    if (!selectedProgram || !draft.sport || !draft.experienceLevel) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateProfile.mutateAsync({
        sport: draft.sport,
        experienceLevel: draft.experienceLevel,
        availableEquipment: draft.availableEquipment,
        injuryFlags: draft.injuryFlags,
        ...(draft.heightCm ? { heightCm: draft.heightCm } : {}),
        ...(draft.weightKg ? { weightKg: draft.weightKg } : {}),
        ...(draft.targetDate ? { targetDate: draft.targetDate } : {}),
      });
      await assignProgram.mutateAsync(selectedProgram);
      await generatePlan.mutateAsync();
      router.replace("/dashboard");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? (lang === "ru" ? "Что-то пошло не так" : "Something went wrong"));
      setSubmitting(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <FmStyles />
      <div className={s.wrap}>
        {/* Progress */}
        <div className={s.progress}>
          {STEPS.map((_, i) => (
            <div key={i} className={clsx(s.progressSeg, i <= stepIdx && s.progressActive)} />
          ))}
        </div>

        <div className={s.stepHead}>
          <span className={s.stepCount}>
            {lang === "ru" ? "Шаг" : "Step"} {stepIdx + 1} / {STEPS.length}
          </span>
          <h1 className={s.stepTitle}>
            {step === "sport"     && (lang === "ru" ? "Твой спорт" : "Your sport")}
            {step === "level"     && (lang === "ru" ? "Уровень подготовки" : "Experience level")}
            {step === "body"      && (lang === "ru" ? "Рост и вес" : "Height & weight")}
            {step === "days"      && (lang === "ru" ? "Дней в неделю" : "Days per week")}
            {step === "equipment" && (lang === "ru" ? "Доступное оборудование" : "Available equipment")}
            {step === "injuries"  && (lang === "ru" ? "Ограничения и травмы" : "Injuries & limitations")}
            {step === "date"      && (lang === "ru" ? "Дата события" : "Target date")}
            {step === "program"   && (lang === "ru" ? "Выбери программу" : "Choose a program")}
          </h1>
        </div>

        <div className={s.body}>
          {/* ── Sport ── */}
          {step === "sport" && (
            <div className={s.grid2}>
              {SPORTS.map((o) => (
                <button
                  key={o.value}
                  className={clsx(s.card, draft.sport === o.value && s.cardActive)}
                  onClick={() => patch({ sport: o.value })}
                >
                  <span className={s.cardEmoji}>{o.emoji}</span>
                  <span className={s.cardLabel}>{L(o.label)}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Level ── */}
          {step === "level" && (
            <div className={s.colList}>
              {LEVELS.map((o) => (
                <button
                  key={o.value}
                  className={clsx(s.rowCard, draft.experienceLevel === o.value && s.cardActive)}
                  onClick={() => patch({ experienceLevel: o.value })}
                >
                  <span className={s.rowCardLabel}>{L(o.label)}</span>
                  <span className={s.rowCardHint}>{L(o.hint)}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Body (height/weight) ── */}
          {step === "body" && (
            <div className={s.dateWrap}>
              <p className={s.dateHint}>
                {lang === "ru"
                  ? "Нужны, чтобы подобрать стартовые веса. Можно пропустить — тогда вес подберёшь сам."
                  : "Used to suggest your starting weights. You can skip — you'll just set weights yourself."}
              </p>
              <div className={s.bodyRow}>
                <label className={s.bodyField}>
                  <span className={s.bodyLabel}>{lang === "ru" ? "Рост, см" : "Height, cm"}</span>
                  <input
                    type="number" min={100} max={250} inputMode="numeric"
                    value={draft.heightCm ?? ""}
                    onChange={(e) => patch({ heightCm: e.target.value ? +e.target.value : null })}
                    className={s.dateInput}
                    placeholder="178"
                  />
                </label>
                <label className={s.bodyField}>
                  <span className={s.bodyLabel}>{lang === "ru" ? "Вес, кг" : "Weight, kg"}</span>
                  <input
                    type="number" min={30} max={300} step={0.5} inputMode="decimal"
                    value={draft.weightKg ?? ""}
                    onChange={(e) => patch({ weightKg: e.target.value ? +e.target.value : null })}
                    className={s.dateInput}
                    placeholder="75"
                  />
                </label>
              </div>
            </div>
          )}

          {/* ── Days ── */}
          {step === "days" && (
            <div className={s.grid2}>
              {DAYS_PER_WEEK.map((d) => (
                <button
                  key={d}
                  className={clsx(s.card, draft.daysPerWeek === d && s.cardActive)}
                  onClick={() => patch({ daysPerWeek: d })}
                >
                  <span className={s.cardBig}>{d}</span>
                  <span className={s.cardLabel}>{lang === "ru" ? "дней" : "days"}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Equipment (multi) ── */}
          {step === "equipment" && (
            <div className={s.chips}>
              {EQUIPMENT.map((o) => (
                <button
                  key={o.value}
                  className={clsx(s.chip, draft.availableEquipment.includes(o.value) && s.chipActive)}
                  onClick={() => toggle("availableEquipment", o.value)}
                >
                  {L(o.label)}
                </button>
              ))}
            </div>
          )}

          {/* ── Injuries (multi) ── */}
          {step === "injuries" && (
            <>
              <div className={s.chips}>
                {INJURIES.map((o) => (
                  <button
                    key={o.value}
                    className={clsx(s.chip, draft.injuryFlags.includes(o.value) && s.chipActive)}
                    onClick={() => toggle("injuryFlags", o.value)}
                  >
                    {L(o.label)}
                  </button>
                ))}
              </div>
              <p className={s.disclaimer}>
                {lang === "ru"
                  ? "Приложение адаптирует нагрузку, но не заменяет врача. При травме проконсультируйтесь со специалистом."
                  : "The app adapts your training but is not a substitute for medical advice. Consult a professional about any injury."}
              </p>
            </>
          )}

          {/* ── Target date ── */}
          {step === "date" && (
            <div className={s.dateWrap}>
              <p className={s.dateHint}>
                {lang === "ru"
                  ? "Когда тебе нужно быть готовым? Программа выстроится к этой дате. Можно пропустить."
                  : "When do you need to peak? Your program will build toward this date. You can skip."}
              </p>
              <input
                type="date"
                min={today}
                value={draft.targetDate ?? ""}
                onChange={(e) => patch({ targetDate: e.target.value || null })}
                className={s.dateInput}
              />
            </div>
          )}

          {/* ── Program ── */}
          {step === "program" && (
            loadingRecs ? (
              <FmPageLoader />
            ) : (
              <div className={s.colList}>
                {(recommended ?? []).map((p, i) => {
                  // Badge only for level-appropriate programs (exact match or one
                  // below). A lower-level program can appear in the list — sorted to
                  // the bottom by _levelRank — but never gets a badge.
                  const levelOk =
                    p._reasons.includes("LEVEL_MATCH") || p._reasons.includes("LEVEL_OK");
                  const badge =
                    i < 3 && levelOk
                      ? i === 0
                        ? (lang === "ru" ? "Лучший матч" : "Best match")
                        : (lang === "ru" ? "Рекомендуем" : "Recommended")
                      : null;
                  return (
                    <button
                      key={p.id}
                      className={clsx(s.programCard, selectedProgram === p.id && s.cardActive)}
                      onClick={() => setSelectedProgram(p.id)}
                    >
                      <div className={s.programTop}>
                        <span className={s.programName}>{p.name}</span>
                        <div className={s.programTopRight}>
                          {badge && (
                            <span className={clsx(s.programBadge, i === 0 && s.programBadgeTop)}>
                              {badge}
                            </span>
                          )}
                          {p.author && <span className={s.programAuthor}>{p.author}</span>}
                        </div>
                      </div>
                      <span className={s.programDesc}>{p.description}</span>
                      {p._reasons?.length > 0 && (
                        <div className={s.programReasons}>
                          {p._reasons.map((r) => (
                            <span key={r} className={s.programReason}>
                              {reasonLabel(r, lang, draft.daysPerWeek)}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
                {(recommended ?? []).length === 0 && (
                  <p className={s.dateHint}>
                    {lang === "ru" ? "Нет подходящих программ" : "No matching programs"}
                  </p>
                )}
              </div>
            )
          )}
        </div>

        {error && <div className={s.error}>{error}</div>}

        {/* Nav */}
        <div className={s.nav}>
          {stepIdx > 0 && (
            <button className={s.backBtn} onClick={back} disabled={submitting}>
              {lang === "ru" ? "← Назад" : "← Back"}
            </button>
          )}
          <button
            className={s.nextBtn}
            onClick={next}
            disabled={!canAdvance || submitting}
          >
            {submitting
              ? (lang === "ru" ? "Создаём программу…" : "Building your plan…")
              : isLast
                ? (lang === "ru" ? "Создать программу" : "Create program")
                : (lang === "ru" ? "Далее" : "Next")}
          </button>
        </div>

        {/* Skip on optional steps */}
        {(step === "date" || step === "body") && !submitting && (
          <button className={s.skipBtn} onClick={() => setStepIdx((i) => i + 1)}>
            {lang === "ru" ? "Пропустить" : "Skip"}
          </button>
        )}
      </div>
    </>
  );
}
