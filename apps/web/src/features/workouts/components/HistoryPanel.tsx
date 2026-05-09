"use client";

import { format } from "date-fns";
import { Icon } from "@/components/fm";
import { useLang } from "@/lib/lang-context";
import type { WorkoutSession } from "../workouts.api";
import styles from "./HistoryPanel.module.css";

interface HistoryPanelProps {
  exerciseId: string;
  exerciseName: string;
  allSessions: WorkoutSession[];
  onClose: () => void;
}

export function HistoryPanel({ exerciseId, exerciseName, allSessions, onClose }: HistoryPanelProps) {
  const { lang } = useLang();

  const history = allSessions
    .filter((s) => s.finishedAt && s.sets.some((st) => st.exercise.id === exerciseId))
    .slice(0, 10);

  const kgLabel = lang === "ru" ? "кг" : "kg";
  const volLabel = lang === "ru" ? "кг объём" : "kg vol";
  const setsLabel = lang === "ru" ? "подх." : "sets";

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <Icon.ChevLeft s={16} />
        </button>
        <div>
          <p className={styles.headerMeta}>{lang === "ru" ? "История" : "History"}</p>
          <p className={styles.headerTitle}>{exerciseName}</p>
        </div>
      </div>

      <div className={styles.body}>
        {history.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>{lang === "ru" ? "Нет истории" : "No history"}</p>
            <p className={styles.emptyBody}>
              {lang === "ru" ? "Это будет ваш первый подход" : "This will be your first set"}
            </p>
          </div>
        ) : (
          history.map((session) => {
            const exSets = session.sets.filter((s) => s.exercise.id === exerciseId);
            const vol = exSets.reduce((a, s) => a + (s.weight ?? 0) * (s.reps ?? 0), 0);

            return (
              <div key={session.id} className={styles.sessionCard}>
                <div className={styles.sessionCardHeader}>
                  <span className={styles.sessionDate}>
                    {format(new Date(session.startedAt), "EEE, MMM d")}
                  </span>
                  <span className={styles.sessionVol}>
                    {vol > 0 ? `${vol} ${volLabel}` : `${exSets.length} ${setsLabel}`}
                  </span>
                </div>

                {exSets.map((s, j) => (
                  <div key={s.id} className={styles.setRow}>
                    <span className={styles.setNum}>{j + 1}</span>
                    <span className={styles.setWeight}>
                      {(s.weight ?? 0) > 0 ? `${s.weight} ${kgLabel}` : "BW"}
                    </span>
                    <div className={styles.setDivider} />
                    <span className={styles.setReps}>
                      {s.reps ?? "—"} {lang === "ru" ? "раз" : "reps"}
                    </span>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

