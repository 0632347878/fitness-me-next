import { apiClient } from "@/lib/api-client";
import type { AuthTokens, LoginInput } from "./auth.schemas";

export async function registerApi(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthTokens> {
  const res = await apiClient.post<AuthTokens>("/auth/register", data);
  return res.data;
}

export async function loginApi(data: LoginInput): Promise<AuthTokens> {
  const res = await apiClient.post<AuthTokens>("/auth/login", data);
  return res.data;
}

export async function getMeApi(): Promise<AuthTokens["user"]> {
  const res = await apiClient.get<AuthTokens["user"]>("/auth/me");
  return res.data;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post("/auth/logout");
}

