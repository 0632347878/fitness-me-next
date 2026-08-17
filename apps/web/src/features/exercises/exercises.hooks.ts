import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getExercises,
  getExercise,
  getEquipmentList,
  getExerciseFilterOptions,
  getAlternatives,
  createExercise,
  updateExercise,
  deleteExercise,
  setAlternatives,
  type ExercisesQuery,
  type CreateExercisePayload,
} from "./exercises.api";

// ─── Query keys ───────────────────────────────────────────────────────────────

const EX_LIST = (q: ExercisesQuery) => ["exercises", q] as const;
const EX_ONE  = (id: string)         => ["exercises", id] as const;
const EX_ALT  = (id: string, eq: string) => ["exercises", id, "alternatives", eq] as const;
const EQ_LIST = ["exercises", "equipment"] as const;
const FILTER_OPTIONS = ["exercises", "filter-options"] as const;

// ─── Public hooks ─────────────────────────────────────────────────────────────

export function useExercises(query: ExercisesQuery = {}) {
  return useQuery({
    queryKey: EX_LIST(query),
    queryFn: () => getExercises(query),
    placeholderData: (prev) => prev,
    staleTime: 5 * 60_000,
  });
}

/** Fetch ALL exercises (no pagination) — used for exercise picker in plan builder */
export function useAllExercises() {
  return useQuery({
    queryKey: ["exercises", "all"],
    queryFn: () => getExercises({ limit: 1000 }),
    staleTime: 10 * 60_000,
    select: (data) => data.items,
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: EX_ONE(id),
    queryFn: () => getExercise(id),
    enabled: !!id,
    staleTime: 10 * 60_000,
  });
}

export function useEquipmentList() {
  return useQuery({
    queryKey: EQ_LIST,
    queryFn: getEquipmentList,
    staleTime: Infinity,
  });
}

export function useExerciseFilterOptions() {
  return useQuery({
    queryKey: FILTER_OPTIONS,
    queryFn: getExerciseFilterOptions,
    staleTime: 10 * 60_000,
  });
}

export function useAlternatives(exerciseId: string, equipment: string) {
  return useQuery({
    queryKey: EX_ALT(exerciseId, equipment),
    queryFn: () => getAlternatives(exerciseId, equipment),
    enabled: !!exerciseId && !!equipment,
    staleTime: 24 * 60 * 60_000,
  });
}

// ─── Admin mutations ──────────────────────────────────────────────────────────

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExercisePayload) => createExercise(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

export function useUpdateExercise(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateExercisePayload>) => updateExercise(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exercises"] });
      qc.invalidateQueries({ queryKey: EX_ONE(id) });
    },
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

export function useSetAlternatives(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alternativeIds: string[]) => setAlternatives(id, alternativeIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: EX_ONE(id) }),
  });
}

// ─── Sync hooks ───────────────────────────────────────────────────────────────
