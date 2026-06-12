import { apiClient } from "@/lib/api-client";

export type PrescribedExercise = {
  planExerciseId: string;
  exerciseId: string;
  name: string;
  nameRu: string | null;
  muscleGroups: string[];
  equipment: string[];
  gifUrl: string | null;
  instructions: string | null;
  prescribed: {
    sets: number;
    repsMin: number;
    repsMax: number;
    rpe: number | null;
    restSec: number;
  };
  notes: string | null;
  alternatives: { id: string; name: string; nameRu: string | null; equipment: string[] }[];
};

export type TodayWorkout = {
  plan: { id: string; templateName: string; weeks: number; startDate: string };
  currentWeek: number;
  currentDay: number;
  dayLabel: string;
  dayId: string;
  alreadyStarted: boolean;
  sessionId: string | null;
  exercises: PrescribedExercise[];
};

export type WorkoutPlan = {
  id: string;
  templateId: string;
  template: { name: string; shortName: string };
  status: string;
  startDate: string;
  weeks: number;
  days: {
    id: string;
    weekNum: number;
    dayNum: number;
    label: string;
    exercises: {
      id: string;
      order: number;
      sets: number;
      repsMin: number;
      repsMax: number;
      rpe: number | null;
      restSec: number;
      notes: string | null;
      exercise: { id: string; name: string; nameRu: string | null; muscleGroups: string[] };
    }[];
  }[];
};

export async function generatePlan(): Promise<WorkoutPlan> {
  const res = await apiClient.post<WorkoutPlan>("/plans/generate");
  return res.data;
}

export async function getMyPlan(): Promise<WorkoutPlan | null> {
  const res = await apiClient.get<WorkoutPlan | null>("/plans/me");
  return res.data;
}

export async function getTodayWorkout(): Promise<TodayWorkout | null> {
  const res = await apiClient.get<TodayWorkout | null>("/plans/me/today");
  return res.data;
}

export async function startTodayWorkout(): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>("/plans/me/start-today");
  return res.data;
}
