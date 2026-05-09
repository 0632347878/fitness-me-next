"use client";

import { useState } from "react";
import { format } from "date-fns";
import { T, CAT_COLOR, Icon, FmBadge } from "@/components/fm";
import { useLang } from "@/lib/lang-context";
import type { WorkoutSession } from "../workouts.api";
import { groupSetsByExercise, calcDurationMinutes, type ExerciseGroup } from "../workouts.utils";
import styles from "./WorkoutHistoryCard.module.css";


// ─── Component ─────────────────────────────────────────────────────────────────

interface WorkoutHistoryCardProps {
  session: WorkoutSession;
}

export function WorkoutHistoryCard({ session }: WorkoutHistoryCardProps) {
  const { lang } = useLang();
  const [expanded, setExpanded] = useState(false);

  const duration = calcDurationMinutes(session.startedAt, session.finishedAt);
  const exerciseGroups = groupSetsByExercise(session.sets);
  const primaryCategory = exerciseGroups[0]?.category ?? "";
  const accentColor = CAT_COLOR[primaryCategory] ?? T.accent;
  const setsLabel = lang === "ru" ? "подх." : "sets";

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader} onClick={() => setExpanded((v) => !v)}>
        {/* Icon — background color is dynamic per category */}
        <div className={styles.iconWrap} style={{ background: accentColor + "15" }}>
          <Icon.Dumbbell s={17} c={accentColor} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.titleRow}>
            <span className={styles.dateLabel}>
              {format(new Date(session.startedAt), "EEE, MMM d")}
            </span>
            {duration != null && (
              <span className={styles.durationLabel}>
                <Icon.Timer s={11} c={T.textMuted} />
                {duration}m
              </span>
            )}
          </div>
          <div className={styles.badgesRow}>
            {exerciseGroups.slice(0, 2).map((g) => (
              <FmBadge key={g.exerciseId} cat={g.category} label={g.exerciseName.slice(0, 14)} />
            ))}
            {exerciseGroups.length > 2 && (
              <span className={styles.moreBadge}>
                +{exerciseGroups.length - 2} more
              </span>
            )}
          </div>
        </div>

        <div className={styles.setCountWrap}>
          <span className={styles.setCountNum}>{session.sets.length}</span>
          <span className={styles.setCountLabel}>{setsLabel}</span>
        </div>

        <Icon.ChevDown s={14} c={T.textMuted} />
      </div>

      {expanded && (
        <div className={styles.body}>
          {session.notes && (
            <div className={styles.note}>
              <span className={styles.noteLabel}>{lang === "ru" ? "Заметка" : "Note"}</span>
              <p className={styles.noteText}>{session.notes}</p>
            </div>
          )}

          {exerciseGroups.map((group) => (
            <ExerciseGroupBlock key={group.exerciseId} group={group} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Exercise group block ──────────────────────────────────────────────────────

function ExerciseGroupBlock({ group, lang }: { group: ExerciseGroup; lang: string }) {
  const catColor = CAT_COLOR[group.category] ?? T.accent;
  const kgLabel = lang === "ru" ? "кг" : "kg";
  const repsLabel = lang === "ru" ? "раз" : "reps";

  return (
    <div className={styles.exGroup}>
      <div className={styles.exGroupHeader}>
        {/* Dot color is dynamic per category */}
        <div className={styles.exGroupDot} style={{ background: catColor }} />
        <span className={styles.exGroupName} style={{ color: catColor }}>{group.exerciseName}</span>
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
