import { apiClient } from "@/lib/api-client";

export type ScienceLevel = "STRONG" | "MODERATE" | "ANECDOTAL";
export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type ProgramStructure =
  | "FULL_BODY"
  | "UPPER_LOWER"
  | "PUSH_PULL_LEGS"
  | "PUSH_PULL"
  | "BRO_SPLIT"
  | "CUSTOM";

export type ProgramTemplate = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  author: string | null;
  description: string;
  structure: ProgramStructure;
  minLevel: ExperienceLevel;
  daysPerWeek: number[];
  pros: string[];
  cons: string[];
  bestFor: string[];
  notFor: string[];
  scienceBacking: ScienceLevel;
  isActive: boolean;
};

export type RecReason = "LEVEL_MATCH" | "LEVEL_OK" | "DAYS_EXACT" | "DAYS_RANGE" | "SPORT_FIT";
export type RecommendedProgram = ProgramTemplate & { _score: number; _levelRank: number; _reasons: RecReason[] };

export type RecommendParams = {
  experienceLevel: ExperienceLevel;
  daysPerWeek?: number;
  sport?: string;
};

export type UserProfile = {
  id: string;
  userId: string;
  experienceLevel: ExperienceLevel;
  somatotype: string | null;
  injuryFlags: string[];
  availableEquipment: string[];
  preferDumbbell: boolean;
  sport: string | null;
  targetDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  programTemplate: ProgramTemplate | null;
};

export type UpdateProfileInput = Partial<{
  experienceLevel: ExperienceLevel;
  sport: string;
  availableEquipment: string[];
  injuryFlags: string[];
  preferDumbbell: boolean;
  targetDate: string;
  heightCm: number;
  weightKg: number;
}>;

// ─── Programs ─────────────────────────────────────────────────────────────────

export async function getPrograms(): Promise<ProgramTemplate[]> {
  const res = await apiClient.get<ProgramTemplate[]>("/programs");
  return res.data;
}

export async function getRecommendedPrograms(
  params: RecommendParams
): Promise<RecommendedProgram[]> {
  const res = await apiClient.get<RecommendedProgram[]>("/programs/recommend", { params });
  return res.data;
}

export async function getMyProgram(): Promise<ProgramTemplate | null> {
  const res = await apiClient.get<ProgramTemplate | null>("/programs/me");
  return res.data;
}

export async function assignProgram(templateId: string): Promise<void> {
  await apiClient.post("/programs/me", { templateId });
}

export async function getProgram(idOrSlug: string): Promise<ProgramTemplate> {
  const res = await apiClient.get<ProgramTemplate>(`/programs/${idOrSlug}`);
  return res.data;
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function getUserProfile(): Promise<UserProfile | null> {
  const res = await apiClient.get<UserProfile | null>("/users/me/profile");
  return res.data;
}

export async function updateUserProfile(data: UpdateProfileInput): Promise<UserProfile> {
  const res = await apiClient.patch<UserProfile>("/users/me/profile", data);
  return res.data;
}
