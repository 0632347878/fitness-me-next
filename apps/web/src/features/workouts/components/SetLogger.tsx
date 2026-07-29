"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExercises } from "@/features/exercises/exercises.api";
import { T, Icon, FmBtn, FmBadge, FmExercisePicker } from "@/components/fm";
import { useLang, useT } from "@/lib/lang-context";
import { logSets, finishWorkout, type WorkoutSession, type WorkoutSet, type PrescribedSlot } from "../workouts.api";
import { groupSetsByExercise, type ExerciseGroup } from "../workouts.utils";
import { NoteModal } from "./NoteModal";
import { HistoryPanel } from "./HistoryPanel";
import styles from "./SetLogger.module.css";

// ─── Types ─────────────────────────────────────────────────────────────────────

type RowState = {
  id: number;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  done: boolean;
};


// ─── Helpers ───────────────────────────────────────────────────────────────────

function useElapsed(startedAt: string) {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  );
  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}


// ─── SetRow ────────────────────────────────────────────────────────────────────

function SetRow({ row, index, onChange, onRemove, isNew }: {
  row: RowState;
  index: number;
  onChange: (r: RowState) => void;
  onRemove: () => void;
  isNew?: boolean;
}) {
  const { lang } = useLang();
  const kgLabel = lang === "ru" ? "кг" : "kg";
  const repsLabel = lang === "ru" ? "раз" : "reps";

  const rowClass = [
    styles.setRow,
    row.done ? styles.done : "",
    isNew ? styles.isNew : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={rowClass}>
      <span className={styles.setIndex}>{index + 1}</span>

      <div className={styles.inputGroup}>
        <input
          type="number" min={0} step={2.5}
          value={row.weight ?? ""}
          placeholder="0"
          onChange={(e) => onChange({ ...row, weight: e.target.value === "" ? null : +e.target.value, done: false })}
          className={`${styles.numInput} ${styles.weightInput} ${row.weight != null ? styles.hasValue : ""}`}
        />
        <span className={styles.inputUnit}>{kgLabel}</span>
      </div>

      <div className={styles.divider} />

      <div className={`${styles.inputGroup} ${styles.reps}`}>
        <input
          type="number" min={0}
          value={row.reps ?? ""}
          placeholder="0"
          onChange={(e) => onChange({ ...row, reps: e.target.value === "" ? null : +e.target.value, done: false })}
          className={`${styles.numInput} ${styles.repsInput} ${row.reps != null ? styles.hasValue : ""}`}
        />
        <span className={styles.inputUnit}>{repsLabel}</span>
      </div>

      {row.done ? (
        <button className={`${styles.actionBtn} ${styles.undoBtn}`} onClick={onRemove}>
          <Icon.Check s={14} c={T.success} />
        </button>
      ) : (
        <button
          className={`${styles.actionBtn} ${styles.removeBtn}`}
          onClick={() => {
            if (row.weight != null || row.reps != null) onChange({ ...row, done: true });
            else onRemove();
          }}
        >—</button>
      )}
    </div>
  );
}

// ─── SetLogger ─────────────────────────────────────────────────────────────────

interface SetLoggerProps {
  // Accepts both the list shape (freestyle inline) and the detail shape
  // (guided, from /workouts/[id]). prescribed/kind are read defensively.
  session: WorkoutSession & { planLabel?: string | null; prescribed?: PrescribedSlot[] };
  allSessions: WorkoutSession[];
  initialExerciseId?: string;
  onDone: () => void;
}

export function SetLogger({ session, allSessions, initialExerciseId, onDone }: SetLoggerProps) {
  const qc = useQueryClient();
  const elapsed = useElapsed(session.startedAt);
  const { lang } = useLang();
  const t = useT();
  const nextId = useRef(100);

  const prescribed = session.prescribed ?? [];
  const isGuided = session.kind === "guided" && prescribed.length > 0;

  const [exerciseId, setExerciseId] = useState(initialExerciseId ?? "");
  const [exerciseName, setExerciseName] = useState("");
  // Which prescribed slot is being logged right now (guided only). Holds the
  // original prescribed exerciseId, so a swap can record substituteFor.
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [rows, setRows] = useState<RowState[]>([
    { id: 1, setNumber: 1, weight: null, reps: null, done: false },
  ]);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data: exData } = useQuery({
    queryKey: ["exercises-all", lang],
    queryFn: () => getExercises({ limit: 100, lang }),
    staleTime: Infinity,
  });
  const exercises = (exData?.items ?? []).map((ex) => ({
    ...ex,
    name: lang === "ru" ? (ex.nameRu ?? ex.name) : ex.name,
  }));

  const recentIds = [...new Map(
    allSessions
      .filter((s) => s.finishedAt)
      .flatMap((s) => s.sets.map((st) => st.exercise.id))
      .map((id) => [id, id])
  ).keys()].slice(0, 5);

  useEffect(() => {
    if (exerciseId && !exerciseName && exercises.length > 0) {
      const ex = exercises.find((e) => e.id === exerciseId);
      if (ex) {
        setExerciseName(ex.name);
        setRows([{ id: nextId.current++, setNumber: 1, weight: null, reps: null, done: false }]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises.length]);

  function handleExerciseChange(id: string) {
    setExerciseId(id);
    setActiveSlotId(null);
    const ex = exercises.find((e) => e.id === id);
    setExerciseName(ex?.name ?? "");
    const existingCount = session.sets.filter((s) => s.exercise.id === id).length;
    setRows([{ id: nextId.current++, setNumber: existingCount + 1, weight: null, reps: null, done: false }]);
    setNote("");
  }

  // Guided: tap a prescribed slot → seed one row per prescribed set, reps
  // pre-filled to the target so the user only fills weight and confirms.
  function handleSelectPrescribed(slot: PrescribedSlot) {
    setExerciseId(slot.exerciseId);
    setActiveSlotId(slot.exerciseId);
    setExerciseName(lang === "ru" ? (slot.nameRu ?? slot.name) : slot.name);
    const existingCount = session.sets.filter((s) => s.exercise.id === slot.exerciseId).length;
    const seeded: RowState[] = Array.from({ length: Math.max(1, slot.sets) }, (_, i) => ({
      id: nextId.current++,
      setNumber: existingCount + i + 1,
      weight: slot.targetWeight ?? null,
      reps: slot.repsMin,
      done: false,
    }));
    setRows(seeded);
    setNote("");
  }

  // How many sets already logged per prescribed exercise — drives the progress
  // pips in the guided list.
  const loggedCountByExercise = new Map<string, number>();
  for (const st of session.sets) {
    loggedCountByExercise.set(st.exercise.id, (loggedCountByExercise.get(st.exercise.id) ?? 0) + 1);
  }

  const { mutate: logSet, isPending: logging } = useMutation({
    mutationFn: () => logSets(
      session.id,
      rows
        .filter((r) => r.done || r.weight != null || r.reps != null)
        .map((r) => ({
          setNumber: r.setNumber,
          reps: r.reps ?? undefined,
          weight: r.weight ?? undefined,
          exerciseId,
          // Guided + logging a different exercise than the slot = a swap.
          ...(activeSlotId && activeSlotId !== exerciseId
            ? { isAlternative: true, substituteFor: activeSlotId }
            : {}),
        }))
    ),
    onSuccess: (data) => {
      const maxSet = data.length > 0 ? Math.max(...data.map((s) => s.setNumber)) : rows.length;
      setRows([{ id: nextId.current++, setNumber: maxSet + 1, weight: null, reps: null, done: false }]);
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });

  const { mutate: finish, isPending: finishing } = useMutation({
    mutationFn: () => finishWorkout(session.id, note || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      onDone();
    },
  });

  function addRow() {
    const last = rows[rows.length - 1];
    const existingCount = session.sets.filter((s) => s.exercise.id === exerciseId).length;
    setRows((r) => [...r, {
      id: nextId.current++,
      setNumber: existingCount + r.length + 1,
      weight: last?.weight ?? null,
      reps: last?.reps ?? null,
      done: false,
    }]);
  }

  const doneSets = rows.filter((r) => r.done);
  const totalVol = doneSets.reduce((a, r) => a + (r.weight ?? 0) * (r.reps ?? 0), 0);
  const canLog = !!exerciseId && (doneSets.length > 0 || rows.some((r) => r.weight != null || r.reps != null));
  const loggedGroups = groupSetsByExercise(session.sets);

  return (
    <div className={styles.logger}>
      {/* Session header */}
      <div className={styles.sessionHeader}>
        <div>
          <div className={styles.activeBadge}>
            <div className={styles.activeDot} />
            <span className={styles.activeLabel}>{t.workouts.active}</span>
          </div>
          <span className={styles.elapsed}>{elapsed}</span>
        </div>
        <FmBtn variant="danger" size="sm" loading={finishing} onClick={() => finish()}>
          {t.workouts.finish}
        </FmBtn>
      </div>

      <div className={styles.body}>
        {isGuided ? (
          <>
            {/* Guided: the plan day's prescribed exercises */}
            {session.planLabel && (
              <div className={styles.guidedHeader}>
                <Icon.Chart s={14} c={T.accent} />
                <span className={styles.guidedLabel}>{session.planLabel}</span>
              </div>
            )}
            <div className={styles.slotList}>
              {prescribed.map((slot) => {
                const logged = loggedCountByExercise.get(slot.exerciseId) ?? 0;
                const active = activeSlotId === slot.exerciseId;
                const complete = logged >= slot.sets;
                return (
                  <button
                    key={slot.exerciseId}
                    type="button"
                    onClick={() => handleSelectPrescribed(slot)}
                    className={[
                      styles.slot,
                      active ? styles.slotActive : "",
                      complete ? styles.slotComplete : "",
                    ].filter(Boolean).join(" ")}
                  >
                    <div className={styles.slotMain}>
                      <span className={styles.slotName}>
                        {lang === "ru" ? (slot.nameRu ?? slot.name) : slot.name}
                      </span>
                      <span className={styles.slotRx}>
                        {slot.sets} × {slot.repsMin === slot.repsMax ? slot.repsMin : `${slot.repsMin}–${slot.repsMax}`}
                        {slot.targetWeight ? ` @ ${slot.targetWeight}${lang === "ru" ? " кг" : " kg"}` : ""}
                        {slot.rpe ? ` · RPE ${slot.rpe}` : ""}
                      </span>
                    </div>
                    <span className={styles.slotProgress}>
                      {complete ? <Icon.Check s={15} c={T.success} /> : `${logged}/${slot.sets}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <FmExercisePicker value={exerciseId} onChange={handleExerciseChange} exercises={exercises} recentIds={recentIds} />
        )}

        {exerciseId && (
          <>
            {rows.map((row, i) => (
              <SetRow
                key={row.id}
                row={row}
                index={i}
                onChange={(updated) => setRows((r) => r.map((x, idx) => idx === i ? updated : x))}
                onRemove={() => setRows((r) => r.filter((_, idx) => idx !== i))}
                isNew={i === rows.length - 1 && rows.length > 1}
              />
            ))}

            {/* Note / Add set */}
            <div className={styles.actionRow}>
              <button
                className={`${styles.actionRowBtn} ${note ? styles.hasNote : ""}`}
                onClick={() => setShowNote(true)}
              >
                <Icon.Pencil s={13} c={note ? T.accent : T.textSub} />
                {lang === "ru" ? "Заметка" : "Note"}{note ? " ·" : ""}
              </button>
              <button className={styles.actionRowBtn} onClick={addRow}>
                <Icon.PlusCircle s={15} c={T.textSub} />
                {t.workouts.addSet}
              </button>
            </div>

            {/* History button */}
            <button className={styles.historyBtn} onClick={() => setShowHistory(true)}>
              <Icon.Calendar s={15} c={T.textSub} />
              <span className={styles.historyBtnLabel}>
                {lang === "ru" ? "История выполнений" : "Exercise history"}
              </span>
              <Icon.ChevRight s={14} c={T.textMuted} />
            </button>

            {/* Volume summary */}
            {doneSets.length > 0 && (
              <div className={styles.volumeSummary}>
                <span className={styles.volumeLabel}>
                  {doneSets.length} {lang === "ru"
                    ? `подход${doneSets.length > 1 ? "а" : ""} выполнено`
                    : `set${doneSets.length > 1 ? "s" : ""} done`}
                </span>
                {totalVol > 0 && (
                  <span className={styles.volumeValue}>
                    {totalVol} {lang === "ru" ? "кг" : "kg"}
                  </span>
                )}
              </div>
            )}

            <FmBtn onClick={() => logSet()} disabled={!canLog} loading={logging} className="w-full">
              {t.workouts.logSets}
            </FmBtn>
          </>
        )}

        {/* Logged this session */}
        {session.sets.length > 0 && (
          <div className={styles.loggedSection}>
            <span className={styles.loggedLabel}>
              {t.workouts.logged} · {session.sets.length}
            </span>
            <div className={styles.loggedList}>
              {loggedGroups.map((group) => (
                <div key={group.exerciseId} className={styles.loggedGroup}>
                  <div className={styles.loggedGroupBadge}>
                    <FmBadge cat={group.category} label={group.exerciseName} />
                  </div>
                  {group.sets.map((s, idx) => (
                    <div key={s.id} className={styles.loggedSetRow}>
                      <span className={styles.loggedSetNum}>{idx + 1}</span>
                      {s.weight != null && <span>{s.weight} {lang === "ru" ? "кг" : "kg"}</span>}
                      {s.reps   != null && <span>· {s.reps} {lang === "ru" ? "раз" : "reps"}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showNote && (
        <NoteModal sessionId={session.id} value={note} onChange={setNote} onClose={() => setShowNote(false)} />
      )}
      {showHistory && (
        <HistoryPanel exerciseId={exerciseId} exerciseName={exerciseName} allSessions={allSessions} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}

