import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthTokens, AuthUser, LoginInput, RegisterInput } from "@fitness-me/shared/auth";
import { api, clearTokens, saveTokens, setUnauthorizedHandler } from "./api-client";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    SecureStore.getItemAsync("accessToken")
      .then((token) => token ? api<AuthUser>("/auth/me") : null)
      .then(setUser)
      .catch(clearTokens)
      .finally(() => setReady(true));
  }, []);

  async function accept(tokens: AuthTokens) {
    await saveTokens(tokens);
    setUser(tokens.user);
  }

  const value = useMemo<AuthContextValue>(() => ({
    user,
    ready,
    login: async (input) => accept(await api<AuthTokens>("/auth/login", { method: "POST", body: JSON.stringify(input) })),
    register: async ({ confirmPassword: _, ...input }) => accept(await api<AuthTokens>("/auth/register", { method: "POST", body: JSON.stringify(input) })),
    logout: async () => {
      await api<void>("/auth/logout", { method: "POST" }).catch(() => undefined);
      await clearTokens();
      setUser(null);
    },
  }), [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
