"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  getWorkouts, startWorkout,
  type WorkoutSession,
  type WorkoutHistory,
} from "@/features/workouts/workouts.api";
import { getExercises } from "@/features/exercises/exercises.api";
import { useTodayWorkout, useStartTodayWorkout } from "@/features/plans/hooks/usePlans";
import { Icon, FmBtn, FmPageLoader, FmEmpty, FmExercisePicker, AppHeader } from "@/components/fm";
import { WorkoutHistoryCard } from "@/features/workouts/components/WorkoutHistoryCard";
import { groupByWorkoutWindow } from "@/features/workouts/workouts.utils";
import { SetLogger } from "@/features/workouts/components/SetLogger";
import { useLang, useT } from "@/lib/lang-context";
import { useSettings } from "@/lib/settings-context";
import s from "./page.module.css";

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function WorkoutsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [pickingExercise, setPickingExercise] = useState(false);
  const [startExerciseId, setStartExerciseId] = useState("");
  const lastStartExerciseId = useRef("");
  const { lang } = useLang();
  const t = useT();
  const { open: openSettings } = useSettings();

  const { data: workoutsData, isLoading } = useQuery({
    queryKey: ["workouts"],
    queryFn: getWorkouts,
  });
  const workouts: WorkoutSession[] = workoutsData ?? [];

  // Guided flow is primary: if there's a plan for today, offer it first.
  const { data: today } = useTodayWorkout();
  const startToday = useStartTodayWorkout();

  const { data: exData } = useQuery({
    queryKey: ["exercises-all", lang],
    queryFn: () => getExercises({ limit: 100, lang }),
    staleTime: Infinity,
    enabled: pickingExercise,
  });
  const exercises = (exData?.items ?? []).map((ex) => ({
    ...ex,
    name: lang === "ru" ? (ex.nameRu ?? ex.name) : ex.name,
  }));

  const { mutate: start, isPending: starting } = useMutation({
    mutationFn: () => startWorkout(),
    onSuccess: () => {
      lastStartExerciseId.current = startExerciseId;
      setPickingExercise(false);
      setStartExerciseId("");
      qc.invalidateQueries({ queryKey: ["workouts"] });
    },
  });

  async function handleStartGuided() {
    const session = await startToday.mutateAsync();
    router.push(`/workouts/${session.id}`);
  }

  if (isLoading) return <FmPageLoader />;

  const ongoing: WorkoutSession | undefined = workouts.find((w) => !w.finishedAt);
  const history: WorkoutHistory[] = workouts
    .filter((w): w is WorkoutHistory => !!w.finishedAt)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return (
    <div className={s.page}>
      <AppHeader
        title={t.workouts.title}
        onAccountClick={openSettings}
      />

      {/* Start modal */}
      {pickingExercise && !ongoing && (
        <div
          className={s.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) { setPickingExercise(false); setStartExerciseId(""); } }}
        >
          <div className={s.modalCard}>
            <div>
              <p className={s.modalTitle}>{t.workouts.newWorkout}</p>
              <p className={s.modalBody}>{t.workouts.newWorkoutBody}</p>
            </div>
            <FmExercisePicker value={startExerciseId} onChange={setStartExerciseId} exercises={exercises} />
            <div className={s.modalActions}>
              <FmBtn variant="ghost" className="flex-1" onClick={() => { setPickingExercise(false); setStartExerciseId(""); }}>{t.workouts.cancel}</FmBtn>
              <FmBtn className="flex-1" disabled={!startExerciseId} loading={starting} onClick={() => start()}>{t.workouts.start}</FmBtn>
            </div>
          </div>
        </div>
      )}

      <div className={s.content}>
        {/* Guided is primary: today's plan gets the prominent CTA */}
        {!ongoing && today && !today.alreadyStarted && (
          <button className={s.guidedCta} onClick={handleStartGuided} disabled={startToday.isPending}>
            <div className={s.guidedCtaMain}>
              <span className={s.guidedCtaEyebrow}>
                {lang === "ru" ? `Неделя ${today.currentWeek} · по плану` : `Week ${today.currentWeek} · on plan`}
              </span>
              <span className={s.guidedCtaTitle}>{today.dayLabel}</span>
              <span className={s.guidedCtaMeta}>
                {today.exercises.length} {lang === "ru" ? "упражнений" : "exercises"}
              </span>
            </div>
            <span className={s.guidedCtaGo}>
              {startToday.isPending ? "…" : <Icon.Bolt s={16} c="#0d0d12" />}
            </span>
          </button>
        )}

        {/* Freestyle is the secondary, off-plan option */}
        {!ongoing && (
          <button className={s.freestyleCta} onClick={() => setPickingExercise(true)}>
            <Icon.Plus s={15} c={"currentColor"} />
            <span>
              {today && !today.alreadyStarted
                ? (lang === "ru" ? "Тренировка вне плана" : "Off-plan workout")
                : (lang === "ru" ? "Свободная тренировка" : "Freestyle workout")}
            </span>
          </button>
        )}

        {ongoing && (
          <SetLogger
            key={ongoing.id}
            session={ongoing}
            allSessions={workouts}
            initialExerciseId={lastStartExerciseId.current || undefined}
            onDone={() => qc.invalidateQueries({ queryKey: ["workouts"] })}
          />
        )}

        {!ongoing && history.length === 0 ? (
          <FmEmpty
            icon={Icon.Dumbbell}
            title={t.workouts.noWorkouts}
            body={t.workouts.noWorkoutsBody}
            action={
              <FmBtn size="lg" loading={starting || isFetching} onClick={() => setPickingExercise(true)}>
                <Icon.Plus s={18} c="#0d0d12" /> {t.workouts.startFirstWorkout}
              </FmBtn>
            }
          />
        ) : history.length > 0 ? (
          <>
            <div className={s.historyHeader}>
              <span className={s.historyTitle}>{t.workouts.history}</span>
              <span className={s.historyCount}>{history.length} {t.workouts.sessions}</span>
            </div>
            {groupByWorkoutWindow(history).map(({ key, sessions: grouped }) => {
              const validSessions = grouped.filter((w) => w.sets.length > 0);
              if (!validSessions.length) return null;
              const first = new Date(validSessions[0].startedAt);
              const label = first.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
                weekday: "short", month: "short", day: "numeric",
              });
              const isMulti = validSessions.length > 1;
              return (
                <div key={key} className={s.historyGroup}>
                  <div className={s.historyGroupHead}>
                    <span className={s.historyGroupLabel}>{label}</span>
                    {isMulti && (
                      <span className={s.multiBadge}>
                        {validSessions.length} {lang === "ru" ? "тренировки" : "sessions"}
                      </span>
                    )}
                  </div>
                  {validSessions.map((w) => (
                    <WorkoutHistoryCard key={w.id} session={w} hideDate />
                  ))}
                </div>
              );
            })}
          </>
        ) : null}
      </div>
    </div>
  );
}
