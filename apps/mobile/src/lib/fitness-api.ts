import type { BodyMetric, CreateSetInput, DashboardStats, Exercise, WorkoutSession, WorkoutSet } from "@fitness-me/shared/api";
import { api } from "./api-client";

export type ExercisesPage = { items: Exercise[]; total: number; page: number; limit: number; pages: number };
export const fitnessApi = {
  dashboard: () => api<DashboardStats>("/dashboard/stats"),
  workouts: () => api<WorkoutSession[]>("/workouts"),
  workout: (id: string) => api<WorkoutSession>(`/workouts/${id}`),
  startWorkout: () => api<WorkoutSession>("/workouts", { method: "POST", body: "{}" }),
  finishWorkout: (id: string) => api<WorkoutSession>(`/workouts/${id}/finish`, { method: "PATCH", body: "{}" }),
  logSets: (id: string, sets: CreateSetInput[]) => api<WorkoutSet[]>(`/workouts/${id}/sets`, { method: "POST", body: JSON.stringify({ sets }) }),
  exercises: (search = "", category = "") => api<ExercisesPage>(`/exercises?limit=100&search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`),
  metrics: () => api<BodyMetric[]>("/metrics"),
  logMetric: (input: { date: string; weight?: number; bodyFat?: number }) => api<BodyMetric>("/metrics", { method: "POST", body: JSON.stringify(input) }),
};
