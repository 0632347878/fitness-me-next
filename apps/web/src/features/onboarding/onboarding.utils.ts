import type { UserProfile } from "@/features/programs/programs.api";

/**
 * Single source of truth for "has the user finished onboarding".
 *
 * Onboarding writes the training profile and then assigns a program template.
 * We treat it as complete only when the three fields the plan generator actually
 * needs are present: sport (drives muscle emphasis), experienceLevel (drives
 * sets/RPE), and an assigned programTemplate (generate() throws without it).
 *
 * Equipment and injuryFlags are intentionally NOT required — an empty list is a
 * valid answer ("I train bodyweight", "no injuries"), and forcing them would
 * trap users who legitimately have nothing to select.
 */
export function isOnboardingComplete(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(profile.sport && profile.experienceLevel && profile.programTemplate);
}
