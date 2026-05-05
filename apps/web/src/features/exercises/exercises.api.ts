import { apiClient } from "@/lib/api-client";

export type Exercise = {
  id: string;
  name: string;
  nameRu: string | null;
  category: "STRENGTH" | "CARDIO" | "FLEXIBILITY" | "MOBILITY";
  muscleGroups: string[];
  equipment: string | null;
  instructions: string | null;
};

export type ExercisesPage = {
  items: Exercise[];
  total: number;
  page: number;
  pages: number;
};

export async function getExercises(params: {
  search?: string;
  category?: string;
  equipment?: string;
  page?: number;
  limit?: number;
  lang?: string;
}): Promise<ExercisesPage> {
  const res = await apiClient.get<ExercisesPage>("/exercises", { params });
  return res.data;
}

export async function getEquipmentList(): Promise<string[]> {
  const res = await apiClient.get<string[]>("/exercises/equipment");
  return res.data;
}
