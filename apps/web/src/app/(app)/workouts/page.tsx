"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  getWorkouts, startWorkout, finishWorkout, logSets, updateSessionNotes,
  type WorkoutSession,
} from "@/features/workouts/workouts.api";
import { getExercises } from "@/features/exercises/exercises.api";
import { T, CAT_COLOR, Icon, FmBadge, FmBtn, FmPageLoader, FmEmpty, FmExercisePicker, AppHeader } from "@/components/fm";
import { useLang, useT } from "@/lib/lang-context";
import { useSettings } from "@/lib/settings-context";

// ─── Elapsed timer ─────────────────────────────────────────────────────────────
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
type RowState = { id: number; setNumber: number; weight: number | null; reps: number | null; done: boolean };

function SetRow({ row, index, onChange, onRemove, isNew }: {
  row: RowState; index: number;
  onChange: (r: RowState) => void;
  onRemove: () => void;
  isNew?: boolean;
}) {
  const { lang } = useLang();
  const kgLabel = lang === "ru" ? "кг" : "kg";
  const repsLabel = lang === "ru" ? "раз" : "reps";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "0 14px", height: 56,
      background: row.done ? "rgba(61,214,140,0.06)" : T.bgCard,
      borderRadius: 14, marginBottom: 6,
      border: `1px solid ${row.done ? "rgba(61,214,140,0.25)" : T.border}`,
      transition: "background 0.2s, border-color 0.2s",
      animation: isNew ? "fm-fadeUp 0.2s ease both" : "none",
    }}>
      <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 13, fontWeight: 700, color: T.textMuted, width: 18, textAlign: "center", flexShrink: 0 }}>
        {index + 1}
      </span>
      <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 4 }}>
        <input
          type="number" min={0} step={2.5}
          value={row.weight ?? ""}
          placeholder="0"
          onChange={(e) => onChange({ ...row, weight: e.target.value === "" ? null : +e.target.value, done: false })}
          style={{ background: "none", border: "none", outline: "none", fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 24, fontWeight: 800, color: row.weight != null ? T.textPrimary : T.textMuted, width: 68, textAlign: "left" }}
        />
        <span style={{ fontSize: 12, color: T.textMuted }}>{kgLabel}</span>
      </div>
      <div style={{ width: 1, height: 28, background: T.border, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 4, paddingLeft: 10 }}>
        <input
          type="number" min={0}
          value={row.reps ?? ""}
          placeholder="0"
          onChange={(e) => onChange({ ...row, reps: e.target.value === "" ? null : +e.target.value, done: false })}
          style={{ background: "none", border: "none", outline: "none", fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 24, fontWeight: 800, color: row.reps != null ? T.textPrimary : T.textMuted, width: 52, textAlign: "left" }}
        />
        <span style={{ fontSize: 12, color: T.textMuted }}>{repsLabel}</span>
      </div>
      {row.done ? (
        <button onClick={onRemove} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", flexShrink: 0, background: "rgba(61,214,140,0.15)", color: "#3dd68c", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
      ) : (
        <button
          onClick={() => { if (row.weight != null || row.reps != null) onChange({ ...row, done: true }); else onRemove(); }}
          style={{ width: 34, height: 34, borderRadius: "50%", border: "none", flexShrink: 0, background: T.bgInput, color: T.textMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
        >—</button>
      )}
    </div>
  );
}

// ─── Note Modal ────────────────────────────────────────────────────────────────
function NoteModal({ sessionId, value, onChange, onClose }: {
  sessionId: string; value: string; onChange: (v: string) => void; onClose: () => void;
}) {
  const { lang } = useLang();
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try { await updateSessionNotes(sessionId, value); } catch {}
    setSaving(false);
    onClose();
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: T.bgCard, borderRadius: "18px 18px 0 0", border: `1px solid ${T.border}`, padding: "14px 18px 36px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }} />
        </div>
        <p style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textMuted, marginBottom: 10 }}>
          {lang === "ru" ? "Заметка" : "Note"}
        </p>
        <textarea
          value={value} onChange={(e) => onChange(e.target.value)} autoFocus rows={3}
          placeholder={lang === "ru" ? "Добавьте заметку к упражнению…" : "Add a note to this exercise…"}
          style={{ width: "100%", background: T.bgInput, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", color: T.textPrimary, fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 14, outline: "none", resize: "none" }}
        />
        <button onClick={handleSave} disabled={saving} style={{ width: "100%", marginTop: 10, padding: "13px", borderRadius: 12, background: T.accent, border: "none", color: "#0d0d12", fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 15, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "…" : lang === "ru" ? "Сохранить" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ─── History Panel ─────────────────────────────────────────────────────────────
function HistoryPanel({ exerciseId, exerciseName, allSessions, onClose }: {
  exerciseId: string; exerciseName: string; allSessions: WorkoutSession[]; onClose: () => void;
}) {
  const { lang } = useLang();
  const history = allSessions
    .filter((s) => s.finishedAt && s.sets.some((st) => st.exercise.id === exerciseId))
    .slice(0, 10);

  return (
    <div style={{ position: "fixed", inset: 0, background: T.bg, zIndex: 150, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: T.bgCard, border: "none", color: T.textSub, width: 34, height: 34, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <p style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textMuted }}>
            {lang === "ru" ? "История" : "History"}
          </p>
          <p style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 18, fontWeight: 800, color: T.textPrimary, textTransform: "uppercase" }}>{exerciseName}</p>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
        {history.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <p style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 18, fontWeight: 800, textTransform: "uppercase", color: T.textSub }}>
              {lang === "ru" ? "Нет истории" : "No history"}
            </p>
            <p style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 13, color: T.textMuted, marginTop: 6 }}>
              {lang === "ru" ? "Это будет ваш первый подход" : "This will be your first set"}
            </p>
          </div>
        ) : history.map((session) => {
          const exSets = session.sets.filter((s) => s.exercise.id === exerciseId);
          const vol = exSets.reduce((a, s) => a + (s.weight ?? 0) * (s.reps ?? 0), 0);
          return (
            <div key={session.id} style={{ marginBottom: 14, background: T.bgCard, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px 8px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{format(new Date(session.startedAt), "EEE, MMM d")}</span>
                <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {vol > 0 ? `${vol} ${lang === "ru" ? "кг объём" : "kg vol"}` : `${exSets.length} ${lang === "ru" ? "подх." : "sets"}`}
                </span>
              </div>
              {exSets.map((s, j) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", padding: "9px 14px", borderBottom: j < exSets.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 12, fontWeight: 700, color: T.textMuted, width: 22 }}>{j + 1}</span>
                  <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 20, fontWeight: 800, color: T.textPrimary, flex: 1 }}>
                    {(s.weight ?? 0) > 0 ? `${s.weight} ${lang === "ru" ? "кг" : "kg"}` : "BW"}
                  </span>
                  <div style={{ width: 1, height: 20, background: T.border, margin: "0 12px" }} />
                  <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 20, fontWeight: 800, color: T.textPrimary }}>
                    {s.reps ?? "—"} {lang === "ru" ? "раз" : "reps"}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Set Logger ────────────────────────────────────────────────────────────────
function SetLogger({ session, allSessions, initialExerciseId, onDone }: {
  session: WorkoutSession; allSessions: WorkoutSession[];
  initialExerciseId?: string;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const elapsed = useElapsed(session.startedAt);
  const { lang } = useLang();
  const t = useT();
  const nextId = useRef(100);

  const [exerciseId, setExerciseId] = useState(initialExerciseId ?? "");
  const [exerciseName, setExerciseName] = useState("");
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

  // Recent exercise IDs from past sessions (unique, most recent first)
  const recentIds = [...new Map(
    allSessions
      .filter((s) => s.finishedAt)
      .flatMap((s) => s.sets.map((st) => st.exercise.id))
      .map((id) => [id, id])
  ).keys()].slice(0, 5);

  // Auto-init when exercises load and exerciseId already set (from initialExerciseId)
  useEffect(() => {
    if (exerciseId && !exerciseName && exercises.length > 0) {
      const ex = exercises.find((e) => e.id === exerciseId);
      if (ex) {
        setExerciseName(ex.name);
        const lastSession = allSessions.find((s) => s.finishedAt && s.sets.some((st) => st.exercise.id === exerciseId));
        const lastSets = lastSession?.sets.filter((s) => s.exercise.id === exerciseId) ?? [];
        setRows([{ id: nextId.current++, setNumber: 1, weight: lastSets[0]?.weight ?? null, reps: lastSets[0]?.reps ?? null, done: false }]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises.length]);

  function handleExerciseChange(id: string) {
    setExerciseId(id);
    const ex = exercises.find((e) => e.id === id);
    setExerciseName(ex?.name ?? "");
    const existingCount = session.sets.filter((s) => s.exercise.id === id).length;
    const lastSession = allSessions.find((s) => s.finishedAt && s.sets.some((st) => st.exercise.id === id));
    const lastSets = lastSession?.sets.filter((s) => s.exercise.id === id) ?? [];
    setRows([{ id: nextId.current++, setNumber: existingCount + 1, weight: lastSets[0]?.weight ?? null, reps: lastSets[0]?.reps ?? null, done: false }]);
    setNote("");
  }

  const { mutate: log, isPending: logging } = useMutation({
    mutationFn: () => logSets(session.id,
      rows.filter((r) => r.done || r.weight != null || r.reps != null)
          .map((r) => ({ setNumber: r.setNumber, reps: r.reps ?? undefined, weight: r.weight ?? undefined, exerciseId }))
    ),
    onSuccess: (data) => {
      const maxSet = data.length > 0 ? Math.max(...data.map((s) => s.setNumber)) : rows.length;
      const last = rows[rows.length - 1];
      setRows([{ id: nextId.current++, setNumber: maxSet + 1, weight: last?.weight ?? null, reps: last?.reps ?? null, done: false }]);
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
    setRows((r) => [...r, { id: nextId.current++, setNumber: existingCount + r.length + 1, weight: last?.weight ?? null, reps: last?.reps ?? null, done: false }]);
  }

  const doneSets = rows.filter((r) => r.done);
  const totalVol = doneSets.reduce((a, r) => a + (r.weight ?? 0) * (r.reps ?? 0), 0);
  const canLog = !!exerciseId && (doneSets.length > 0 || rows.some((r) => r.weight != null || r.reps != null));

  return (
    <div style={{ background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}` }}>
      {/* Session header */}
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.success, animation: "fm-pulse 2s infinite" }} />
            <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 13, fontWeight: 700, color: T.success, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t.workouts.active}</span>
          </div>
          <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 26, fontWeight: 900, color: T.textPrimary, letterSpacing: "-0.01em" }}>{elapsed}</span>
        </div>
        <FmBtn variant="danger" size="sm" loading={finishing} onClick={() => finish()}>{t.workouts.finish}</FmBtn>
      </div>

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <FmExercisePicker value={exerciseId} onChange={handleExerciseChange} exercises={exercises} recentIds={recentIds} />

        {exerciseId && (
          <>
            {rows.map((row, i) => (
              <SetRow key={row.id} row={row} index={i}
                onChange={(updated) => setRows((r) => r.map((x, idx) => idx === i ? updated : x))}
                onRemove={() => setRows((r) => r.filter((_, idx) => idx !== i))}
                isNew={i === rows.length - 1 && rows.length > 1}
              />
            ))}

            {/* Action row */}
            <div style={{ display: "flex", borderTop: `1px solid ${T.border}` }}>
              <button onClick={() => setShowNote(true)} style={{ flex: 1, padding: "12px 0", background: "none", border: "none", borderRight: `1px solid ${T.border}`, color: note ? T.accent : T.textSub, fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                ✏️ {lang === "ru" ? "Заметка" : "Note"}{note ? " ·" : ""}
              </button>
              <button onClick={addRow} style={{ flex: 1, padding: "12px 0", background: "none", border: "none", color: T.textSub, fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                + {t.workouts.addSet}
              </button>
            </div>

            {/* History button */}
            <button onClick={() => setShowHistory(true)} style={{ width: "100%", padding: "12px 14px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.textSub} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 13, fontWeight: 500, color: T.textSub, flex: 1, textAlign: "left" }}>
                {lang === "ru" ? "История выполнений" : "Exercise history"}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            {/* Volume summary */}
            {doneSets.length > 0 && (
              <div style={{ padding: "10px 14px", background: "rgba(232,133,74,0.08)", borderRadius: 12, border: "1px solid rgba(232,133,74,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 12, color: T.textSub }}>
                  {doneSets.length} {lang === "ru" ? `подход${doneSets.length > 1 ? "а" : ""}` : `set${doneSets.length > 1 ? "s" : ""}`} {lang === "ru" ? "выполнено" : "done"}
                </span>
                {totalVol > 0 && <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 18, fontWeight: 800, color: T.accent }}>{totalVol} {lang === "ru" ? "кг" : "kg"}</span>}
              </div>
            )}

            <FmBtn onClick={() => log()} disabled={!canLog} loading={logging} style={{ width: "100%" }}>{t.workouts.logSets}</FmBtn>
          </>
        )}

        {/* Logged this session */}
        {session.sets.length > 0 && (
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
            <span style={{ fontSize: 10, fontFamily: "var(--font-barlow-condensed, sans-serif)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textMuted }}>
              {t.workouts.logged} · {session.sets.length}
            </span>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
              {session.sets.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.textSub }}>
                  <FmBadge cat={s.exercise.category} label={s.exercise.name} />
                  <span style={{ color: T.textMuted }}>#{s.setNumber}</span>
                  {s.reps   != null && <span>{s.reps} {lang === "ru" ? "раз" : "reps"}</span>}
                  {s.weight != null && <span>· {s.weight} {lang === "ru" ? "кг" : "kg"}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showNote && <NoteModal sessionId={session.id} value={note} onChange={setNote} onClose={() => setShowNote(false)} />}
      {showHistory && <HistoryPanel exerciseId={exerciseId} exerciseName={exerciseName} allSessions={allSessions} onClose={() => setShowHistory(false)} />}
    </div>
  );
}

// ─── History Card ──────────────────────────────────────────────────────────────
function HistoryCard({ w }: { w: WorkoutSession }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const dur = w.finishedAt
    ? Math.round((new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60_000)
    : null;
  const uniqueEx = [...new Map(w.sets.map((s) => [s.exercise.id, s.exercise])).values()];
  const cats = [...new Set(uniqueEx.map((e) => e.category))];
  const catColor = CAT_COLOR[cats[0]] ?? T.accent;

  return (
    <div style={{ background: T.bgCard, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
      <div onClick={() => setOpen((o) => !o)} style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: catColor + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon.Dumbbell s={17} c={catColor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{format(new Date(w.startedAt), "EEE, MMM d")}</span>
            {dur != null && <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: T.textMuted }}><Icon.Timer s={11} c={T.textMuted} />{dur}m</span>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {uniqueEx.slice(0, 2).map((ex) => <FmBadge key={ex.id} cat={ex.category} label={ex.name.slice(0, 12)} />)}
            {uniqueEx.length > 2 && <span style={{ fontSize: 10, color: T.textMuted, alignSelf: "center" }}>+{uniqueEx.length - 2} more</span>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, marginRight: 4 }}>
          <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 20, fontWeight: 900, color: T.textPrimary }}>{w.sets.length}</span>
          <span style={{ fontSize: 10, color: T.textMuted }}>{lang === "ru" ? "подх." : "sets"}</span>
        </div>
        <Icon.ChevDown s={14} c={T.textMuted} />
      </div>
      {open && (w.sets.length > 0 || w.notes) && (
        <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${T.border}` }}>
          {w.notes && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: T.bgInput, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.textMuted }}>
                {lang === "ru" ? "Заметка" : "Note"}
              </span>
              <p style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 13, color: T.textSub, marginTop: 3 }}>{w.notes}</p>
            </div>
          )}
          <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
            {w.sets.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.textSub }}>
                <FmBadge cat={s.exercise.category} label={s.exercise.name} />
                <span style={{ color: T.textMuted }}>#{s.setNumber}</span>
                {s.reps   != null && <span>{s.reps} {lang === "ru" ? "раз" : "reps"}</span>}
                {s.weight != null && <span>· {s.weight} {lang === "ru" ? "кг" : "kg"}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function WorkoutsPage() {
  const qc = useQueryClient();
  const [pickingExercise, setPickingExercise] = useState(false);
  const [startExerciseId, setStartExerciseId] = useState("");
  const lastStartExerciseId = useRef("");
  const { lang } = useLang();
  const t = useT();
  const { open: openSettings } = useSettings();

  const { data: workoutsData, isLoading, isFetching } = useQuery({
    queryKey: ["workouts"],
    queryFn: getWorkouts,
  });
  const workouts: WorkoutSession[] = workoutsData ?? [];

  const { data: exData } = useQuery({
    queryKey: ["exercises-all", lang],
    queryFn: () => getExercises({ limit: 100, lang }),
    staleTime: Infinity,
    enabled: pickingExercise,
  });
  const exercises = (exData?.items ?? []).map((ex) => ({
    ...ex,
    name: lang === "ru" ? (ex.nameRu ?? ex.name) : ex.name,
  }));

  const { mutate: start, isPending: starting } = useMutation({
    mutationFn: () => startWorkout(),
    onSuccess: () => {
      lastStartExerciseId.current = startExerciseId;
      setPickingExercise(false);
      setStartExerciseId("");
      qc.invalidateQueries({ queryKey: ["workouts"] });
    },
  });

  if (isLoading) return <FmPageLoader />;

  const ongoing = workouts.find((w) => !w.finishedAt);
  const history = workouts.filter((w) => !!w.finishedAt);

  return (
    <div style={{ background: T.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <AppHeader
        title={t.workouts.title}
        onAccountClick={openSettings}
        right={!ongoing ? (
          <FmBtn size="sm" loading={starting || isFetching} onClick={() => setPickingExercise(true)}>
            <Icon.Plus s={14} c="#0d0d12" /> {t.workouts.start}
          </FmBtn>
        ) : undefined}
      />

      {/* Start modal */}
      {pickingExercise && !ongoing && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "start", justifyContent: "center", padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) { setPickingExercise(false); setStartExerciseId(""); } }}
        >
          <div style={{ background: T.bgCard, borderRadius: 18, border: `1px solid ${T.border}`, padding: 24, width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <p style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 22, fontWeight: 900, textTransform: "uppercase", color: T.textPrimary, marginBottom: 4 }}>{t.workouts.newWorkout}</p>
              <p style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 13, color: T.textSub }}>{t.workouts.newWorkoutBody}</p>
            </div>
            <FmExercisePicker value={startExerciseId} onChange={setStartExerciseId} exercises={exercises} />
            <div style={{ display: "flex", gap: 10 }}>
              <FmBtn variant="ghost" style={{ flex: 1 }} onClick={() => { setPickingExercise(false); setStartExerciseId(""); }}>{t.workouts.cancel}</FmBtn>
              <FmBtn style={{ flex: 1 }} disabled={!startExerciseId} loading={starting} onClick={() => start()}>{t.workouts.start}</FmBtn>
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {ongoing && (
          <SetLogger
            key={ongoing.id}
            session={ongoing}
            allSessions={workouts}
            initialExerciseId={lastStartExerciseId.current || undefined}
            onDone={() => qc.invalidateQueries({ queryKey: ["workouts"] })}
          />
        )}

        {!ongoing && history.length === 0 ? (
          <FmEmpty
            icon={Icon.Dumbbell}
            title={t.workouts.noWorkouts}
            body={t.workouts.noWorkoutsBody}
            action={
              <FmBtn size="lg" loading={starting || isFetching} onClick={() => setPickingExercise(true)}>
                <Icon.Plus s={18} c="#0d0d12" /> {t.workouts.startFirstWorkout}
              </FmBtn>
            }
          />
        ) : history.length > 0 ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textSub }}>{t.workouts.history}</span>
              <span style={{ fontSize: 11, color: T.textMuted }}>{history.length} {t.workouts.sessions}</span>
            </div>
            {history.map((w) => <HistoryCard key={w.id} w={w} />)}
          </>
        ) : null}
      </div>
    </div>
  );
}
