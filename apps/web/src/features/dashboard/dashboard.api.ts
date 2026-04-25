import { apiClient } from "@/lib/api-client";

export type DashboardStats = {
  workoutsThisWeek: number;
  totalWorkouts: number;
  totalSets: number;
  currentWeight: number | null;
  streak: number;
  recentWorkouts: RecentWorkout[];
};

export type RecentWorkout = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  notes: string | null;
  sets: {
    id: string;
    setNumber: number;
    reps: number | null;
    weight: number | null;
    duration: number | null;
    exercise: { id: string; name: string; category: string };
  }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await apiClient.get<DashboardStats>("/dashboard/stats");
  return res.data;
}

