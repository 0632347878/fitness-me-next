import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignProgram,
  getMyProgram,
  getPrograms,
  getRecommendedPrograms,
  getUserProfile,
  updateUserProfile,
  type RecommendParams,
  type UpdateProfileInput,
} from "../programs.api";

export const PROGRAMS_KEY = ["programs"] as const;
export const MY_PROGRAM_KEY = ["programs", "me"] as const;
export const USER_PROFILE_KEY = ["users", "me", "profile"] as const;

/** All available program templates */
export function usePrograms() {
  return useQuery({
    queryKey: PROGRAMS_KEY,
    queryFn: getPrograms,
    staleTime: 5 * 60_000,
  });
}

/** Recommendations ranked by score */
export function useRecommendedPrograms(params: RecommendParams | null) {
  return useQuery({
    queryKey: ["programs", "recommend", params],
    queryFn: () => getRecommendedPrograms(params!),
    enabled: !!params,
    staleTime: 60_000,
  });
}

/** Current user's assigned program */
export function useMyProgram() {
  return useQuery({
    queryKey: MY_PROGRAM_KEY,
    queryFn: getMyProgram,
  });
}

/**
 * Assign program mutation.
 * Switching the program invalidates the generated plan on the backend too
 * (see plans/generate), so /dashboard and /workouts/:id must drop their
 * cached plan — not just the program itself — or they keep rendering the
 * previous program's plan until an unrelated refetch happens to occur.
 */
export function useAssignProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => assignProgram(templateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_PROGRAM_KEY });
      qc.invalidateQueries({ queryKey: USER_PROFILE_KEY });
      // Broad "plans" prefix covers both plans.me and plans.me.today.
      qc.invalidateQueries({ queryKey: ["plans"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

/** User training profile (level, sport, equipment…) */
export function useUserProfile() {
  return useQuery({
    queryKey: USER_PROFILE_KEY,
    queryFn: getUserProfile,
  });
}

/** Update user training profile */
export function useUpdateUserProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileInput) => updateUserProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USER_PROFILE_KEY });
      qc.invalidateQueries({ queryKey: MY_PROGRAM_KEY });
    },
  });
}
