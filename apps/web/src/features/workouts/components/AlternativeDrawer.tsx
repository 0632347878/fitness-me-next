"use client";

import React from "react";
import { FmPageLoader } from "@/components/fm";
import { useAlternatives } from "@/features/exercises/exercises.hooks";
import type { Exercise } from "@/features/exercises/exercises.api";
import s from "./AlternativeDrawer.module.css";

interface Props {
  exerciseId: string;
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function AlternativeDrawer({ exerciseId, open, onClose, onSelect }: Props) {
  const { data: alternatives = [], isLoading } = useAlternatives(exerciseId, "DUMBBELL");

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
          <p className={s.headerEyebrow}>No equipment?</p>
          <p className={s.headerTitle}>Dumbbell alternatives</p>
        </div>

        {/* List */}
        <div className={s.list}>
          {isLoading ? (
            <div className={s.loadingWrap}><FmPageLoader /></div>
          ) : alternatives.length === 0 ? (
            <div className={s.emptyState}>
              No alternatives found
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
