"use client";

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
      <div className={styles.exGroupHeader}>
        <div className={styles.exGroupDot} style={{ background: catColor }} />
        <span className={styles.exGroupName} style={{ color: catColor }}>
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

