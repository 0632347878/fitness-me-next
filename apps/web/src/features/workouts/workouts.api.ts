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

export type WorkoutSession = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  notes: string | null;
  sets: WorkoutSet[];
};

export type CreateSetInput = {
  exerciseId: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  duration?: number;
  rpe?: number;
};

export async function startWorkout(notes?: string): Promise<WorkoutSession> {
  const res = await apiClient.post<WorkoutSession>("/workouts", { notes });
  return res.data;
}

export async function getWorkouts(): Promise<WorkoutSession[]> {
  const res = await apiClient.get<WorkoutSession[]>("/workouts");
  return res.data;
}

export async function getWorkout(id: string): Promise<WorkoutSession> {
  const res = await apiClient.get<WorkoutSession>(`/workouts/${id}`);
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

