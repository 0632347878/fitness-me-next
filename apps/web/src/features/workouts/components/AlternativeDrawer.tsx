"use client";

import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { FmPageLoader } from "@/components/fm";
import { useAlternatives } from "@/features/exercises/exercises.hooks";
import { useUserProfile } from "@/features/programs/hooks/usePrograms";
import type { Exercise } from "@/features/exercises/exercises.api";
import s from "./AlternativeDrawer.module.css";

const EQUIPMENT_LABELS: Record<string, string> = {
  BODYWEIGHT: "Bodyweight",
  RESISTANCE_BAND: "Band",
  PULL_UP_BAR: "Pull-up bar",
  DUMBBELL: "Dumbbell",
  KETTLEBELL: "Kettlebell",
  BARBELL: "Barbell",
  CABLE: "Cable",
  MACHINE: "Machine",
  SMITH_MACHINE: "Smith machine",
};

const label = (eq: string) => EQUIPMENT_LABELS[eq] ?? eq;

interface Props {
  exerciseId: string;
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function AlternativeDrawer({ exerciseId, open, onClose, onSelect }: Props) {
  const { data: profile } = useUserProfile();

  // Bodyweight first — it's the "I have nothing today" case the button promises.
  const options = useMemo(() => {
    const owned = (profile?.availableEquipment ?? []).filter((e) => e !== "BODYWEIGHT");
    return ["BODYWEIGHT", ...owned];
  }, [profile?.availableEquipment]);

  const [equipment, setEquipment] = useState("BODYWEIGHT");

  // Reset to bodyweight whenever the drawer is reopened for another exercise.
  useEffect(() => {
    if (open) setEquipment("BODYWEIGHT");
  }, [open, exerciseId]);

  const { data: alternatives = [], isLoading } = useAlternatives(exerciseId, equipment);
  const injuryCount = profile?.injuryFlags?.length ?? 0;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className={s.backdrop} />

      {/* Sheet */}
      <div className={s.sheet}>
        {/* Handle */}
        <div className={s.handleWrap}>
          <div className={s.handle} />
        </div>

        {/* Header */}
        <div className={s.header}>
          <p className={s.headerEyebrow}>Swap this exercise</p>
          <p className={s.headerTitle}>{label(equipment)} alternatives</p>

          {options.length > 1 && (
            <div className={s.chips}>
              {options.map((eq) => (
                <button
                  key={eq}
                  onClick={() => setEquipment(eq)}
                  className={clsx(s.chip, eq === equipment && s.chipActive)}
                >
                  {label(eq)}
                </button>
              ))}
            </div>
          )}

          {injuryCount > 0 && (
            <p className={s.injuryNote}>
              Filtered around {injuryCount} flagged condition{injuryCount > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* List */}
        <div className={s.list}>
          {isLoading ? (
            <div className={s.loadingWrap}><FmPageLoader /></div>
          ) : alternatives.length === 0 ? (
            <div className={s.emptyState}>
              No {label(equipment).toLowerCase()} substitute matches this movement.
              {options.length > 1 && " Try another equipment option above."}
            </div>
          ) : (
            alternatives.map((alt) => (
              <button
                key={alt.id}
                onClick={() => { onSelect(alt); onClose(); }}
                className={s.altRow}
              >
                {/* GIF thumbnail */}
                {alt.gifUrl ? (
                  <img src={alt.gifUrl} alt={alt.name} className={s.thumb} />
                ) : (
                  <div className={s.thumbPlaceholder}>
                    <span>🏋️</span>
                  </div>
                )}

                {/* Info */}
                <div className={s.info}>
                  <p className={s.altName}>
                    {alt.nameRu ?? alt.name}
                  </p>
                  <p className={s.altMuscles}>
                    {alt.muscleGroups.slice(0, 2).join(" · ")}
                  </p>
                  {alt.mechanic && (
                    <span className={s.altMechanic}>
                      {alt.mechanic}
                    </span>
                  )}
                </div>

                {/* Arrow */}
                <span className={s.arrow}>›</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
