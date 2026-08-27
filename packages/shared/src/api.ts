export type ExerciseCategory = "STRENGTH" | "CARDIO" | "FLEXIBILITY" | "MOBILITY";

export type Exercise = {
  id: string;
  name: string;
  nameRu: string | null;
  category: ExerciseCategory;
  muscleGroups: string[];
  equipment: string[];
};

export type WorkoutSet = {
  id: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  duration: number | null;
  rpe: number | null;
  exercise: Pick<Exercise, "id" | "name" | "category">;
};

export type WorkoutSession = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  notes: string | null;
  kind: "guided" | "freestyle";
  planDayId: string | null;
  sets: WorkoutSet[];
};

export type CreateSetInput = {
  exerciseId: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  duration?: number;
  rpe?: number;
};

export type BodyMetric = {
  id: string;
  date: string;
  weight: number | null;
  bodyFat: number | null;
  muscleMass: number | null;
  notes: string | null;
};

export type DashboardStats = {
  workoutsThisWeek: number;
  totalWorkouts: number;
  totalSets: number;
  currentWeight: number | null;
  streak: number;
  recentWorkouts: WorkoutSession[];
};
