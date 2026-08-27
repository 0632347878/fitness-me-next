import * as SecureStore from "expo-secure-store";
import type { AuthTokens } from "@fitness-me/shared/auth";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";
let refreshPromise: Promise<string | null> | null = null;
let onUnauthorized: (() => void) | undefined;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export async function saveTokens(tokens: Pick<AuthTokens, "accessToken" | "refreshToken">) {
  await Promise.all([
    SecureStore.setItemAsync("accessToken", tokens.accessToken),
    SecureStore.setItemAsync("refreshToken", tokens.refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync("accessToken"),
    SecureStore.deleteItemAsync("refreshToken"),
  ]);
}

async function refreshAccessToken() {
  const refreshToken = await SecureStore.getItemAsync("refreshToken");
  if (!refreshToken) return null;
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) return null;
  const tokens = (await response.json()) as Pick<AuthTokens, "accessToken" | "refreshToken">;
  await saveTokens(tokens);
  return tokens.accessToken;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = await SecureStore.getItemAsync("accessToken");
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    refreshPromise ??= refreshAccessToken().finally(() => { refreshPromise = null; });
    const nextToken = await refreshPromise;
    if (nextToken) return api<T>(path, init, false);
    await clearTokens();
    onUnauthorized?.();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
    throw new Error(message ?? `Request failed (${response.status})`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
