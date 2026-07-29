"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { registerApi } from "../auth.api";
import type { AuthTokens } from "../auth.schemas";
import type { AxiosError } from "axios";

export function useRegister() {
  const router = useRouter();

  return useMutation<
    AuthTokens,
    AxiosError<{ message: string }>,
    { email: string; password: string; name?: string }
  >({
    mutationFn: registerApi,
    onSuccess: (data) => {
      // Persist tokens client-side
      sessionStorage.setItem("accessToken", data.accessToken);
      sessionStorage.setItem("refreshToken", data.refreshToken);
      // New account has no profile yet — onboarding collects it before the app.
      router.push("/onboarding");
    },
  });
}

