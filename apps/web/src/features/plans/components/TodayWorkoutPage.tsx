"use client";

import React, { useState } from "react";
import clsx from "clsx";
import Link from "next/link";
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
  const [gifFailed, setGifFailed] = useState(false);

  const displayName = overrideEx ? (overrideEx.nameRu ?? overrideEx.name) : ex.name;
  const displayExerciseId = overrideEx?.id ?? ex.exerciseId;
  const displayMuscles = overrideEx ? overrideEx.muscleGroups : ex.muscleGroups;
  const isSubstituted = !!overrideEx;
  const gifUrl = overrideEx?.gifUrl ?? ex.gifUrl;
  const showGif = !!gifUrl && !gifFailed;

  const handleSelect = (alt: Exercise) => {
    setOverrideEx(alt);
  };

  return (
    <>
      <div className={clsx(s.row, isSubstituted && s.substituted)}>
        {/*
          Media slot — always the same 48×48 box with the same ordinal badge,
          whether or not a GIF exists. Previously a missing GIF swapped in a
          smaller numbered bubble, so rows in one list didn't line up.
        */}
        <div className={s.media}>
          {showGif ? (
            <img
              src={gifUrl!}
              alt={displayName}
              className={s.thumb}
              onError={() => setGifFailed(true)}
            />
          ) : (
            <span className={s.mediaFallback} aria-hidden="true">
              🏋️
            </span>
          )}
          <span className={s.mediaIndex}>{index + 1}</span>
        </div>

        {/* Info */}
        <div className={s.info}>
          <div className={s.nameRow}>
            <Link
              href={`/exercises?exerciseId=${encodeURIComponent(displayExerciseId)}`}
              className={s.name}
            >
              {displayName}
            </Link>
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
            {ex.prescribed.targetWeight ? ` @ ${ex.prescribed.targetWeight}kg` : ""}
          </p>
          <p className={s.rpeRest}>
            {rpe ? `RPE ${rpe}` : ""}{rpe && restSec ? " · " : ""}{restSec ? `${restSec}s` : ""}
          </p>
          {/* Swap — opens same-pattern alternatives for the equipment you have */}
          <button onClick={() => setDrawerOpen(true)} className={s.swapBtn}>
            ⇄ Swap
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
