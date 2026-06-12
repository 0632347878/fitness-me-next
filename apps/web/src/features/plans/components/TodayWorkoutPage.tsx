"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { T, FmBtn, FmPageLoader, AppHeader } from "@/components/fm";
import { useTodayWorkout, useGeneratePlan, useStartTodayWorkout } from "../hooks/usePlans";
import { useMyProgram } from "@/features/programs/hooks/usePrograms";
import { AlternativeDrawer } from "@/features/workouts/components/AlternativeDrawer";
import type { PrescribedExercise } from "../plans.api";
import type { Exercise } from "@/features/exercises/exercises.api";

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
      <div style={{ padding: compact ? "16px" : "40px 16px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h2 style={{ fontFamily: "var(--font-barlow-condensed)", fontSize: 26, fontWeight: 800, color: T.textPrimary, textTransform: "uppercase", margin: "0 0 12px" }}>
          No workout plan yet
        </h2>
        {myProgram ? (
          <>
            <p style={{ color: T.textSub, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              You have <strong style={{ color: T.accent }}>{myProgram.name}</strong> selected.
              Generate your personalized plan to get started.
            </p>
            <FmBtn onClick={handleGenerate} disabled={generatePlan.isPending} size="lg">
              {generatePlan.isPending ? "Generating…" : "Generate my plan"}
            </FmBtn>
          </>
        ) : (
          <>
            <p style={{ color: T.textSub, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
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
    <div style={{ padding: compact ? "14px 16px" : "24px 16px", maxWidth: compact ? "none" : 560, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ margin: "0 0 4px", fontSize: 12, color: T.textMuted, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.8 }}>
          {today.plan.templateName}
        </p>
        <h1 style={{ fontFamily: "var(--font-barlow-condensed)", fontSize: 28, fontWeight: 900, textTransform: "uppercase", color: T.textPrimary, margin: 0 }}>
          {today.dayLabel}
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: T.textSub }}>
          Week {today.currentWeek} · Day {today.currentDay} · {today.exercises.length} exercises
        </p>
      </div>

      {/* Exercise list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {today.exercises.map((ex, i) => (
          <ExerciseRow key={ex.planExerciseId} ex={ex} index={i} />
        ))}
      </div>

      {/* CTA */}
      {today.alreadyStarted ? (
        <FmBtn size="lg" onClick={() => router.push(`/workouts/${today.sessionId}`)} style={{ width: "100%" }}>
          Continue workout →
        </FmBtn>
      ) : (
        <FmBtn size="lg" onClick={handleStart} disabled={startToday.isPending} style={{ width: "100%" }}>
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
      <div style={{
        background: T.bgCard,
        border: `1px solid ${isSubstituted ? T.accent + "60" : T.border}`,
        borderRadius: 14, padding: "14px 16px",
        display: "flex", gap: 14, alignItems: "center",
        position: "relative",
      }}>
        {/* GIF thumbnail if available */}
        {(overrideEx?.gifUrl ?? ex.gifUrl) && (
          <img
            src={overrideEx?.gifUrl ?? ex.gifUrl!}
            alt={displayName}
            style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
          />
        )}

        {/* Index bubble (shown when no gif) */}
        {!(overrideEx?.gifUrl ?? ex.gifUrl) && (
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: T.accentDim,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>{index + 1}</span>
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayName}
            </p>
            {isSubstituted && (
              <span style={{ fontSize: 9, fontFamily: "var(--font-barlow-condensed)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.accent, background: T.accentDim, padding: "2px 6px", borderRadius: 6, flexShrink: 0 }}>
                swap
              </span>
            )}
          </div>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: T.textMuted }}>
            {displayMuscles.slice(0, 2).join(" · ")}
          </p>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.textPrimary }}>
            {sets} × {repsMin === repsMax ? repsMin : `${repsMin}–${repsMax}`}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: T.textMuted }}>
            {rpe ? `RPE ${rpe}` : ""}{rpe && restSec ? " · " : ""}{restSec ? `${restSec}s` : ""}
          </p>
          {/* No equipment button */}
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              fontSize: 10, fontFamily: "var(--font-barlow-condensed)", fontWeight: 700,
              letterSpacing: "0.06em", textTransform: "uppercase",
              color: T.textMuted, background: "transparent", border: `1px solid ${T.border}`,
              borderRadius: 6, padding: "2px 8px", cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = T.accent;
              e.currentTarget.style.borderColor = T.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = T.textMuted;
              e.currentTarget.style.borderColor = T.border;
            }}
          >
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
