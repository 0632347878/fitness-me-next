"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { FmBtn, FmPageLoader } from "@/components/fm";
import { useTodayWorkout, useGeneratePlan, useStartTodayWorkout } from "../hooks/usePlans";
import { useMyProgram } from "@/features/programs/hooks/usePrograms";
import { AlternativeDrawer } from "@/features/workouts/components/AlternativeDrawer";
import type { PrescribedExercise } from "../plans.api";
import type { Exercise } from "@/features/exercises/exercises.api";
import s from "./TodayWorkoutPage.module.css";

export function TodayWorkoutPage({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { data: today, isLoading } = useTodayWorkout();
  const { data: myProgram } = useMyProgram();
  const generatePlan = useGeneratePlan();
  const startToday = useStartTodayWorkout();

  const handleGenerate = async () => {
    await generatePlan.mutateAsync();
  };

  const handleStart = async () => {
    const session = await startToday.mutateAsync();
    router.push(`/workouts/${session.id}`);
  };

  if (isLoading) return <FmPageLoader />;

  if (!today) {
    return (
      <div className={clsx(s.emptyWrap, compact && s.compact)}>
        <div className={s.emptyIcon}>📋</div>
        <h2 className={s.emptyTitle}>
          No workout plan yet
        </h2>
        {myProgram ? (
          <>
            <p className={s.emptyBody}>
              You have <strong>{myProgram.name}</strong> selected.
              Generate your personalized plan to get started.
            </p>
            <FmBtn onClick={handleGenerate} disabled={generatePlan.isPending} size="lg">
              {generatePlan.isPending ? "Generating…" : "Generate my plan"}
            </FmBtn>
          </>
        ) : (
          <>
            <p className={s.emptyBody}>
              First choose a training program, then generate your plan.
            </p>
            <FmBtn onClick={() => router.push("/programs")} size="lg">
              Choose program
            </FmBtn>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={clsx(s.page, compact && s.compact)}>
      {/* Header */}
      <div className={s.header}>
        <p className={s.headerEyebrow}>
          {today.plan.templateName}
        </p>
        <h1 className={s.headerTitle}>
          {today.dayLabel}
        </h1>
        <p className={s.headerMeta}>
          Week {today.currentWeek} · Day {today.currentDay} · {today.exercises.length} exercises
        </p>
      </div>

      {/* Exercise list */}
      <div className={s.exerciseList}>
        {today.exercises.map((ex, i) => (
          <ExerciseRow key={ex.planExerciseId} ex={ex} index={i} />
        ))}
      </div>

      {/* CTA */}
      {today.alreadyStarted ? (
        <FmBtn size="lg" onClick={() => router.push(`/workouts/${today.sessionId}`)} className="w-full">
          Continue workout →
        </FmBtn>
      ) : (
        <FmBtn size="lg" onClick={handleStart} disabled={startToday.isPending} className="w-full">
          {startToday.isPending ? "Starting…" : "Start workout"}
        </FmBtn>
      )}
    </div>
  );
}

// ─── Exercise row with alternative drawer ──────────────────────────────────────

function ExerciseRow({ ex, index }: { ex: PrescribedExercise; index: number }) {
  const { sets, repsMin, repsMax, rpe, restSec } = ex.prescribed;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [overrideEx, setOverrideEx] = useState<Exercise | null>(null);

  const displayName = overrideEx ? (overrideEx.nameRu ?? overrideEx.name) : ex.name;
  const displayMuscles = overrideEx ? overrideEx.muscleGroups : ex.muscleGroups;
  const isSubstituted = !!overrideEx;

  const handleSelect = (alt: Exercise) => {
    setOverrideEx(alt);
  };

  return (
    <>
      <div className={clsx(s.row, isSubstituted && s.substituted)}>
        {/* GIF thumbnail if available */}
        {(overrideEx?.gifUrl ?? ex.gifUrl) && (
          <img
            src={overrideEx?.gifUrl ?? ex.gifUrl!}
            alt={displayName}
            className={s.thumb}
          />
        )}

        {/* Index bubble (shown when no gif) */}
        {!(overrideEx?.gifUrl ?? ex.gifUrl) && (
          <div className={s.indexBubble}>
            <span>{index + 1}</span>
          </div>
        )}

        {/* Info */}
        <div className={s.info}>
          <div className={s.nameRow}>
            <p className={s.name}>
              {displayName}
            </p>
            {isSubstituted && (
              <span className={s.swapBadge}>
                swap
              </span>
            )}
          </div>
          <p className={s.muscles}>
            {displayMuscles.slice(0, 2).join(" · ")}
          </p>
        </div>

        {/* Right side */}
        <div className={s.rightCol}>
          <p className={s.setsReps}>
            {sets} × {repsMin === repsMax ? repsMin : `${repsMin}–${repsMax}`}
          </p>
          <p className={s.rpeRest}>
            {rpe ? `RPE ${rpe}` : ""}{rpe && restSec ? " · " : ""}{restSec ? `${restSec}s` : ""}
          </p>
          {/* No equipment button */}
          <button onClick={() => setDrawerOpen(true)} className={s.noEquipBtn}>
            ⚡ No equip
          </button>
        </div>
      </div>

      <AlternativeDrawer
        exerciseId={ex.exerciseId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelect={handleSelect}
      />
    </>
  );
}
