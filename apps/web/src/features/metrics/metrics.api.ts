import { apiClient } from "@/lib/api-client";

export type BodyMetric = {
  id: string;
  date: string;
  weight: number | null;
  bodyFat: number | null;
  muscleMass: number | null;
  notes: string | null;
};

export async function getMetrics(): Promise<BodyMetric[]> {
  const res = await apiClient.get<BodyMetric[]>("/metrics");
  return res.data;
}

export async function logMetric(data: {
  date: string;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  notes?: string;
}): Promise<BodyMetric> {
  const res = await apiClient.post<BodyMetric>("/metrics", data);
  return res.data;
}

