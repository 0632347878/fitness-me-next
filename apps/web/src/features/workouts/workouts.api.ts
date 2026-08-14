import { apiClient } from "@/lib/api-client";
import type { Exercise } from "../exercises/exercises.api";

export type WorkoutSet = {
  id: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  duration: number | null;
  rpe: number | null;
  exercise: Pick<Exercise, "id" | "name" | "category">;
};

export type WorkoutKind = "guided" | "freestyle";

export type WorkoutSession = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  notes: string | null;
  kind: WorkoutKind;
  planDayId: string | null;
  sets: WorkoutSet[];
};

/** A finished (historical) workout session. finishedAt is guaranteed non-null. */
export type WorkoutHistory = WorkoutSession & { finishedAt: string };

/** One prescribed slot from the plan day (guided sessions only). */
export type PrescribedSlot = {
  exerciseId: string;
  name: string;
  nameRu: string | null;
  category: string;
  muscleGroups: string[];
  order: number;
  sets: number;
  repsMin: number;
  repsMax: number;
  rpe: number | null;
  restSec: number;
  targetWeight: number | null;
  notes: string | null;
};

/** Single-session fetch: carries the guided extras the list endpoint omits. */
export type WorkoutSessionDetail = WorkoutSession & {
  planLabel: string | null;
  prescribed: PrescribedSlot[];
};

export type CreateSetInput = {
  exerciseId: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  duration?: number;
  rpe?: number;
  isAlternative?: boolean;
  substituteFor?: string;
};

/**
 * Start a session. Pass planDayId to begin the guided workout for that plan day;
 * omit it for a freestyle (off-plan) session. The backend is idempotent for a
 * guided day already started today — it returns the existing session.
 */
export async function startWorkout(opts?: { notes?: string; planDayId?: string }): Promise<WorkoutSession> {
  const res = await apiClient.post<WorkoutSession>("/workouts", {
    notes: opts?.notes,
    planDayId: opts?.planDayId,
  });
  return res.data;
}

export async function getWorkouts(): Promise<WorkoutSession[]> {
  const res = await apiClient.get<WorkoutSession[]>("/workouts");
  return res.data;
}

export type ActiveWorkout = {
  id: string;
  startedAt: string;
  kind: WorkoutKind;
  planDayLabel: string | null;
  setsLogged: number;
};

/** The current unfinished session, if any — null when nothing is in progress. */
export async function getActiveWorkout(): Promise<ActiveWorkout | null> {
  const res = await apiClient.get<ActiveWorkout | null>("/workouts/active");
  return res.data;
}

export async function getWorkout(id: string): Promise<WorkoutSessionDetail> {
  const res = await apiClient.get<WorkoutSessionDetail>(`/workouts/${id}`);
  return res.data;
}

export async function finishWorkout(id: string, notes?: string): Promise<WorkoutSession> {
  const res = await apiClient.patch<WorkoutSession>(`/workouts/${id}/finish`, { notes });
  return res.data;
}

export async function deleteAllWorkouts(): Promise<void> {
  await apiClient.delete("/workouts");
}

export async function updateSessionNotes(id: string, notes: string): Promise<void> {
  await apiClient.patch(`/workouts/${id}/notes`, { notes });
}

export async function logSets(sessionId: string, sets: CreateSetInput[]): Promise<WorkoutSet[]> {
  const res = await apiClient.post<WorkoutSet[]>(`/workouts/${sessionId}/sets`, { sets });
  return res.data;
}

