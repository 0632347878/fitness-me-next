"use client";

import { useState } from "react";
import { format } from "date-fns";
import { T, CAT_COLOR, Icon, FmBadge } from "@/components/fm";
import { useLang } from "@/lib/lang-context";
import type { WorkoutSession } from "../workouts.api";
import { groupSetsByExercise, calcDurationMinutes } from "../workouts.utils";
import { ExerciseGroupBlock } from "./ExerciseGroupBlock";
import styles from "./WorkoutHistoryCard.module.css";


// ─── Component ─────────────────────────────────────────────────────────────────

interface WorkoutHistoryCardProps {
  session: WorkoutSession;
  /** When true the date label is hidden — used when a parent already shows the day header */
  hideDate?: boolean;
}

export function WorkoutHistoryCard({ session, hideDate = false }: WorkoutHistoryCardProps) {
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
            {!hideDate && (
              <span className={styles.dateLabel}>
                {format(new Date(session.startedAt), "EEE, MMM d")}
              </span>
            )}
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
