"use client";

import type { CSSProperties } from "react";
import { T, CAT_COLOR, FmBadge } from "@/components/fm";
import type { ExerciseGroup } from "../workouts.utils";
import styles from "./ExerciseGroupBlock.module.css";

interface ExerciseGroupBlockProps {
  group: ExerciseGroup;
  lang: string;
}

export function ExerciseGroupBlock({ group, lang }: ExerciseGroupBlockProps) {
  const catColor = CAT_COLOR[group.category] ?? T.accent;
  const kgLabel = lang === "ru" ? "кг" : "kg";
  const repsLabel = lang === "ru" ? "раз" : "reps";

  return (
    <div className={styles.exGroup}>
      <div className={styles.exGroupHeader} style={{ "--cat-color": catColor } as CSSProperties}>
        <div className={styles.exGroupDot} />
        <span className={styles.exGroupName}>
          {group.exerciseName}
        </span>
        <FmBadge cat={group.category} label={group.category} />
      </div>

      <div className={styles.setsList}>
        {group.sets.map((set, idx) => (
          <div key={set.id} className={styles.setRow}>
            <span className={styles.setNum}>{idx + 1}</span>
            <span className={styles.setWeight}>
              {(set.weight ?? 0) > 0 ? `${set.weight} ${kgLabel}` : "BW"}
            </span>
            <div className={styles.setDivider} />
            <span className={styles.setReps}>
              {set.reps ?? "—"} {repsLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

