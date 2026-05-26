"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorkouts, startWorkout,
  type WorkoutSession,
  type WorkoutHistory,
} from "@/features/workouts/workouts.api";
import { getExercises } from "@/features/exercises/exercises.api";
import { T, Icon, FmBtn, FmPageLoader, FmEmpty, FmExercisePicker, AppHeader } from "@/components/fm";
import { WorkoutHistoryCard } from "@/features/workouts/components/WorkoutHistoryCard";
import { groupByWorkoutWindow } from "@/features/workouts/workouts.utils";
import { SetLogger } from "@/features/workouts/components/SetLogger";
import { useLang, useT } from "@/lib/lang-context";
import { useSettings } from "@/lib/settings-context";

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function WorkoutsPage() {
  const qc = useQueryClient();
  const [pickingExercise, setPickingExercise] = useState(false);
  const [startExerciseId, setStartExerciseId] = useState("");
  const lastStartExerciseId = useRef("");
  const { lang } = useLang();
  const t = useT();
  const { open: openSettings } = useSettings();

  const { data: workoutsData, isLoading, isFetching } = useQuery({
    queryKey: ["workouts"],
    queryFn: getWorkouts,
  });
  const workouts: WorkoutSession[] = workoutsData ?? [];

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

  if (isLoading) return <FmPageLoader />;

  const ongoing: WorkoutSession | undefined = workouts.find((w) => !w.finishedAt);
  const history: WorkoutHistory[] = workouts
    .filter((w): w is WorkoutHistory => !!w.finishedAt)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return (
    <div style={{ background: T.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <AppHeader
        title={t.workouts.title}
        onAccountClick={openSettings}
        right={!ongoing ? (
          <FmBtn size="sm" loading={starting || isFetching} onClick={() => setPickingExercise(true)}>
            <Icon.Plus s={14} c="#0d0d12" /> {t.workouts.start}
          </FmBtn>
        ) : undefined}
      />

      {/* Start modal */}
      {pickingExercise && !ongoing && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "start", justifyContent: "center", padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) { setPickingExercise(false); setStartExerciseId(""); } }}
        >
          <div style={{ background: T.bgCard, borderRadius: 18, border: `1px solid ${T.border}`, padding: 24, width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <p style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 22, fontWeight: 900, textTransform: "uppercase", color: T.textPrimary, marginBottom: 4 }}>{t.workouts.newWorkout}</p>
              <p style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 13, color: T.textSub }}>{t.workouts.newWorkoutBody}</p>
            </div>
            <FmExercisePicker value={startExerciseId} onChange={setStartExerciseId} exercises={exercises} />
            <div style={{ display: "flex", gap: 10 }}>
              <FmBtn variant="ghost" style={{ flex: 1 }} onClick={() => { setPickingExercise(false); setStartExerciseId(""); }}>{t.workouts.cancel}</FmBtn>
              <FmBtn style={{ flex: 1 }} disabled={!startExerciseId} loading={starting} onClick={() => start()}>{t.workouts.start}</FmBtn>
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textSub }}>{t.workouts.history}</span>
              <span style={{ fontSize: 11, color: T.textMuted }}>{history.length} {t.workouts.sessions}</span>
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
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: T.textSub, letterSpacing: "0.08em" }}>{label}</span>
                    {isMulti && (
                      <span style={{ fontSize: 11, color: T.textMuted, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 6, padding: "1px 6px" }}>
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
