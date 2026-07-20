"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { FmStyles } from "@/components/fm";
import { useLogin } from "../hooks/useLogin";
import { loginSchema, type LoginInput } from "../auth.schemas";
import { Logo, FInput, FButton } from "./AuthPrimitives";
import s from "./LoginForm.module.css";

export function LoginForm() {
  const { mutate, isPending, error } = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const apiError = error?.response?.data?.message ?? (error ? "Login failed" : null);

  return (
    <>
      <FmStyles />

      <div className={s.page}>
        {/* Hero */}
        <div className={s.hero}>
          <Logo />
          <div className={s.heroText}>
            <div className={s.heroSpacer} />
            <h1 className={s.heroTitle}>Welcome back</h1>
            <p className={s.heroBody}>Log in to continue your streak</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit((v) => mutate(v))} noValidate className={s.form}>
          {apiError && <div className={s.apiError}>{apiError}</div>}
          <FInput id="email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} registration={register("email")} />
          <FInput id="password" label="Password" type="password" autoComplete="current-password" placeholder="••••••••" error={errors.password?.message} registration={register("password")} />
          <FButton loading={isPending} loadingLabel="SIGNING IN…">LOG IN</FButton>
        </form>
      </div>

      {/* Footer */}
      <div className={s.footer}>
        <span className={s.footerText}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className={s.footerLink}>
            Sign up
          </Link>
        </span>
      </div>
    </>
  );
}
