import type { WorkoutSet, WorkoutHistory } from "./workouts.api";

export type ExerciseGroup = {
  exerciseId: string;
  exerciseName: string;
  category: string;
  sets: WorkoutSet[];
};

export type DayGroup = {
  /** startedAt of the first session in the group — used as React key */
  key: string;
  sessions: WorkoutHistory[];
};

export function groupSetsByExercise(sets: WorkoutSet[]): ExerciseGroup[] {
  const map = new Map<string, ExerciseGroup>();
  for (const set of sets) {
    const { id, name, category } = set.exercise;
    if (!map.has(id)) map.set(id, { exerciseId: id, exerciseName: name, category, sets: [] });
    map.get(id)!.sets.push(set);
  }
  return Array.from(map.values());
}

export function calcDurationMinutes(startedAt: string, finishedAt: string | null): number | null {
  if (!finishedAt) return null;
  return Math.round((new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 60_000);
}

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

/**
 * Groups finished sessions into "workout windows": consecutive sessions
 * whose startedAt values are within 8 hours of each other are considered
 * one training block. Groups are returned newest-first.
 */
export function groupByWorkoutWindow(sessions: WorkoutHistory[]): DayGroup[] {
  if (!sessions.length) return [];

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
  );

  const groups: DayGroup[] = [];
  let current: WorkoutHistory[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].startedAt).getTime();
    const curr = new Date(sorted[i].startedAt).getTime();
    if (curr - prev <= EIGHT_HOURS_MS) {
      current.push(sorted[i]);
    } else {
      groups.push({ key: current[0].startedAt, sessions: current });
      current = [sorted[i]];
    }
  }
  groups.push({ key: current[0].startedAt, sessions: current });

  return groups.reverse();
}
