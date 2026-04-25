"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  getWorkouts, startWorkout, finishWorkout, logSets,
  type WorkoutSession, type CreateSetInput,
} from "@/features/workouts/workouts.api";
import { getExercises } from "@/features/exercises/exercises.api";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageLoader, EmptyState } from "@/components/ui/Feedback";

const CAT = { STRENGTH: "strength", CARDIO: "cardio", FLEXIBILITY: "flexibility", MOBILITY: "mobility" } as const;

// ─── Set Logger ──────────────────────────────────────────────────────────────
function SetLogger({ session, onDone }: { session: WorkoutSession; onDone: () => void }) {
  const qc = useQueryClient();

  const [exerciseId, setExerciseId] = useState("");
  const [rows, setRows] = useState<Omit<CreateSetInput, "exerciseId">[]>([
    { setNumber: 1, reps: undefined, weight: undefined },
  ]);

  const { data: exData } = useQuery({
    queryKey: ["exercises-all"],
    queryFn: () => getExercises({ limit: 100 }),
    staleTime: Infinity,
  });

  // When user picks a different exercise, reset rows starting from the
  // correct next set number based on what's already logged for that exercise.
  function handleExerciseChange(id: string) {
    setExerciseId(id);
    const existing = session.sets.filter((s) => s.exercise.id === id).length;
    setRows([{ setNumber: existing + 1, reps: undefined, weight: undefined }]);
  }

  const { mutate: log, isPending: logging } = useMutation({
    mutationFn: () => logSets(session.id, rows.map((r) => ({ ...r, exerciseId }))),
    onSuccess: (data) => {
      // Use the server-confirmed max setNumber as the source of truth.
      // Avoids the stale-closure bug (rows.length was always 1 after reset).
      const maxSet = data.length > 0 ? Math.max(...data.map((s) => s.setNumber)) : rows.length;
      setRows([{ setNumber: maxSet + 1, reps: undefined, weight: undefined }]);
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });

  const { mutate: finish, isPending: finishing } = useMutation({
    mutationFn: () => finishWorkout(session.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      onDone();
    },
  });

  function addRow() {
    const existing = session.sets.filter((s) => s.exercise.id === exerciseId).length;
    setRows((r) => [...r, { setNumber: existing + r.length + 1, reps: undefined, weight: undefined }]);
  }

  function updateRow(i: number, key: "reps" | "weight", val: string) {
    setRows((r) => r.map((row, idx) =>
      idx === i ? { ...row, [key]: val === "" ? undefined : Number(val) } : row
    ));
  }

  const canLog = !!exerciseId && rows.some((r) => r.reps != null || r.weight != null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Active workout</p>
            <p className="text-xs text-gray-400">{format(new Date(session.startedAt), "MMM d, HH:mm")}</p>
          </div>
          <Button variant="danger" size="sm" loading={finishing} onClick={() => finish()}>
            Finish workout
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Exercise picker */}
        <select
          value={exerciseId}
          onChange={(e) => handleExerciseChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">Select exercise…</option>
          {exData?.items.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>

        {/* Set rows */}
        <div>
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 mb-1 px-1">
            <span>Set</span><span>Reps</span><span>kg</span>
          </div>
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 mb-2">
              <div className="flex items-center justify-center bg-gray-100 rounded-lg text-sm font-semibold text-gray-600 py-2">
                {row.setNumber}
              </div>
              <input
                type="number" min={0} placeholder="—"
                value={row.reps ?? ""}
                onChange={(e) => updateRow(i, "reps", e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number" min={0} step={0.5} placeholder="—"
                value={row.weight ?? ""}
                onChange={(e) => updateRow(i, "weight", e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
          <button
            onClick={addRow}
            disabled={!exerciseId}
            className="text-sm text-indigo-600 hover:underline disabled:opacity-40 disabled:cursor-not-allowed mt-1"
          >
            + Add set
          </button>
        </div>

        <Button className="w-full" disabled={!canLog} loading={logging} onClick={() => log()}>
          Log sets
        </Button>

        {/* Already logged this session */}
        {session.sets.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-xs text-gray-400 mb-2">
              Logged — {session.sets.length} set{session.sets.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-1">
              {session.sets.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <Badge variant={CAT[s.exercise.category as keyof typeof CAT] ?? "default"}>
                    {s.exercise.name}
                  </Badge>
                  <span className="text-gray-500">
                    #{s.setNumber}
                    {s.reps   != null ? ` · ${s.reps} reps`   : ""}
                    {s.weight != null ? ` · ${s.weight} kg`   : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── History card ─────────────────────────────────────────────────────────────
function HistoryCard({ w }: { w: WorkoutSession }) {
  const [open, setOpen] = useState(false);
  const duration = w.finishedAt
    ? Math.round((new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60_000)
    : null;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between cursor-pointer" onClick={() => setOpen((o) => !o)}>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900">{format(new Date(w.startedAt), "EEE, MMM d")}</span>
              <Badge variant={w.finishedAt ? "done" : "active"}>{w.finishedAt ? "Done" : "Active"}</Badge>
              {duration != null && <span className="text-xs text-gray-400">{duration} min</span>}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {w.sets.length} set{w.sets.length !== 1 ? "s" : ""} ·{" "}
              {formatDistanceToNow(new Date(w.startedAt), { addSuffix: true })}
            </p>
          </div>
          <span className="text-gray-400">{open ? "▲" : "▼"}</span>
        </div>

        {open && w.sets.length > 0 && (
          <div className="mt-3 border-t pt-3 space-y-1">
            {w.sets.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-sm text-gray-700">
                <Badge variant={CAT[s.exercise.category as keyof typeof CAT] ?? "default"}>
                  {s.exercise.name}
                </Badge>
                #{s.setNumber}
                {s.reps   != null ? ` · ${s.reps} reps`   : ""}
                {s.weight != null ? ` · ${s.weight} kg`   : ""}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WorkoutsPage() {
  const qc = useQueryClient();

  const { data: workoutsData, isLoading, isFetching } = useQuery({
    queryKey: ["workouts"],
    queryFn: getWorkouts,
  });
  const workouts: WorkoutSession[] = workoutsData ?? [];

  const { mutate: start, isPending: starting } = useMutation({
    mutationFn: () => startWorkout(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts"] }),
  });

  if (isLoading) return <PageLoader />;

  const ongoing = workouts.find((w) => !w.finishedAt);
  const history  = workouts.filter((w) => !!w.finishedAt);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
        {!ongoing && (
          <Button size="sm" loading={starting || isFetching} onClick={() => start()}>
            + Start workout
          </Button>
        )}
      </div>

      {/* key=session.id ensures SetLogger remounts when session changes,
          but NOT on every background refetch (id stays the same). */}
      {ongoing && (
        <SetLogger
          key={ongoing.id}
          session={ongoing}
          onDone={() => qc.invalidateQueries({ queryKey: ["workouts"] })}
        />
      )}

      {history.length === 0 && !ongoing ? (
        <EmptyState
          title="No workouts yet"
          body="Hit '+ Start workout' to log your first session."
          action={
            <Button size="sm" loading={starting || isFetching} onClick={() => start()}>
              Start first workout
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">History</h2>
          {history.map((w) => <HistoryCard key={w.id} w={w} />)}
        </div>
      )}
    </div>
  );
}
