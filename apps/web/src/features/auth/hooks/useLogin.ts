"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { loginApi } from "../auth.api";
import type { AuthTokens, LoginInput } from "../auth.schemas";
import type { AxiosError } from "axios";

export function useLogin() {
  const router = useRouter();

  return useMutation<AuthTokens, AxiosError<{ message: string }>, LoginInput>({
    mutationFn: loginApi,
    onSuccess: (data) => {
      sessionStorage.setItem("accessToken", data.accessToken);
      sessionStorage.setItem("refreshToken", data.refreshToken);
      router.push("/dashboard");
    },
  });
}

