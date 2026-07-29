import { apiClient } from "@/lib/api-client";

export type Exercise = {
  id: string;
  name: string;
  nameRu: string | null;
  category: "STRENGTH" | "CARDIO" | "FLEXIBILITY" | "MOBILITY";
  muscleGroups: string[];
  secondaryMuscles: string[];
  equipment: string[];
  injuryFlags: string[];
  instructions: string | null;
  gifUrl: string | null;
  bodyPart: string | null;
  mechanic: string | null;
  force: string | null;
  difficulty: string | null;
  caloriesPerMin: number | null;
  externalId: string | null;
  alternatives?: Exercise[];
};

export type ExercisesPage = {
  items: Exercise[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type ExercisesQuery = {
  search?: string;
  category?: string;
  equipment?: string;
  bodyPart?: string;
  mechanic?: string;
  force?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
  lang?: string;
};

export async function getExercises(params: ExercisesQuery): Promise<ExercisesPage> {
  const res = await apiClient.get<ExercisesPage>("/exercises", { params });
  return res.data;
}

export async function getExercise(id: string): Promise<Exercise> {
  const res = await apiClient.get<Exercise>(`/exercises/${id}`);
  return res.data;
}

export async function getEquipmentList(): Promise<string[]> {
  const res = await apiClient.get<string[]>("/exercises/equipment");
  return res.data;
}

/** `equipment` is required on purpose — a silent default is how "No equipment?"
 *  ended up serving dumbbell exercises. The caller must state what it means. */
export async function getAlternatives(
  id: string,
  equipment: string,
): Promise<Exercise[]> {
  const res = await apiClient.get<Exercise[]>(`/exercises/${id}/alternatives`, {
    params: { equipment },
  });
  return res.data;
}

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export type CreateExercisePayload = {
  name: string;
  nameRu?: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
  injuryFlags?: string[];
  instructions?: string;
  gifUrl?: string;
  bodyPart?: string;
  mechanic?: string;
  force?: string;
  difficulty?: string;
  caloriesPerMin?: number;
};

export async function createExercise(data: CreateExercisePayload): Promise<Exercise> {
  const res = await apiClient.post<Exercise>("/exercises", data);
  return res.data;
}

export async function updateExercise(
  id: string,
  data: Partial<CreateExercisePayload>,
): Promise<Exercise> {
  const res = await apiClient.patch<Exercise>(`/exercises/${id}`, data);
  return res.data;
}

export async function deleteExercise(id: string): Promise<void> {
  await apiClient.delete(`/exercises/${id}`);
}

export async function setAlternatives(
  id: string,
  alternativeIds: string[],
): Promise<Exercise> {
  const res = await apiClient.put<Exercise>(`/exercises/${id}/alternatives`, {
    alternativeIds,
  });
  return res.data;
}

// ─── Admin Sync ───────────────────────────────────────────────────────────────

