import type { WorkoutSet } from "./workouts.api";

export type ExerciseGroup = {
  exerciseId: string;
  exerciseName: string;
  category: string;
  sets: WorkoutSet[];
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

