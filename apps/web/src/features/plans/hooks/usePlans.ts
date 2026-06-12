import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  generatePlan,
  getMyPlan,
  getTodayWorkout,
  startTodayWorkout,
} from "../plans.api";

export const MY_PLAN_KEY = ["plans", "me"] as const;
export const TODAY_KEY = ["plans", "me", "today"] as const;

export function useMyPlan() {
  return useQuery({
    queryKey: MY_PLAN_KEY,
    queryFn: getMyPlan,
  });
}

export function useTodayWorkout() {
  return useQuery({
    queryKey: TODAY_KEY,
    queryFn: getTodayWorkout,
    staleTime: 5 * 60_000,
  });
}

export function useGeneratePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: generatePlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_PLAN_KEY });
      qc.invalidateQueries({ queryKey: TODAY_KEY });
    },
  });
}

export function useStartTodayWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: startTodayWorkout,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TODAY_KEY });
    },
  });
}
