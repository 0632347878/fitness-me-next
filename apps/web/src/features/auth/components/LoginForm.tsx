"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useLogin } from "../hooks/useLogin";
import { loginSchema, type LoginInput } from "../auth.schemas";

// ── tiny Logo component ──────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      <span
        className="flex items-center justify-center w-9 h-9 rounded-lg text-[#0d0d12] font-black text-xl select-none"
        style={{ background: "var(--fm-accent)" }}
      >
        ⚡
      </span>
      <span
        className="text-3xl font-black uppercase tracking-widest"
        style={{
          fontFamily: "var(--font-barlow-condensed, sans-serif)",
          color: "var(--fm-text-primary)",
        }}
      >
        FITME
      </span>
    </div>
  );
}

// ── reusable FInput ──────────────────────────────────────────────────────────
function FInput({
  id,
  label,
  type = "text",
  placeholder,
  error,
  autoComplete,
  registration,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
        style={{ color: "var(--fm-text-sub)" }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
          style={{
            background: "var(--fm-bg-input)",
            border: `1px solid ${error ? "#e05252" : "var(--fm-border)"}`,
            color: "var(--fm-text-primary)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--fm-accent)";
            e.currentTarget.style.boxShadow = "0 0 0 2px color-mix(in oklch, var(--fm-accent) 25%, transparent)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? "#e05252" : "var(--fm-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
          {...registration}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs select-none"
            style={{ color: "var(--fm-text-sub)" }}
            tabIndex={-1}
          >
            {show ? "HIDE" : "SHOW"}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs" style={{ color: "#e05252" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── FButton ──────────────────────────────────────────────────────────────────
function FButton({
  children,
  loading,
  type = "submit",
}: {
  children: React.ReactNode;
  loading?: boolean;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      disabled={loading}
      className="w-full rounded-xl py-3 text-sm font-bold uppercase tracking-widest transition disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: "var(--fm-accent)",
        color: "#0d0d12",
        fontFamily: "var(--font-barlow-condensed, sans-serif)",
      }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          SIGNING IN…
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// ── Divider ──────────────────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <span className="flex-1 h-px" style={{ background: "var(--fm-border)" }} />
      <span className="text-xs" style={{ color: "var(--fm-text-muted)" }}>
        {label}
      </span>
      <span className="flex-1 h-px" style={{ background: "var(--fm-border)" }} />
    </div>
  );
}

// ── SocialButton ─────────────────────────────────────────────────────────────
function SocialButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition hover:opacity-80"
      style={{
        background: "var(--fm-bg-input)",
        border: "1px solid var(--fm-border)",
        color: "var(--fm-text-primary)",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ── LoginForm ────────────────────────────────────────────────────────────────
export function LoginForm() {
  const { mutate, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const apiError =
    error?.response?.data?.message ?? (error ? "Login failed" : null);

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ background: "var(--fm-bg)", fontFamily: "var(--font-dm-sans, sans-serif)" }}
    >
      <div className="w-full max-w-sm">
        <Logo />

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "var(--fm-bg-card)",
            border: "1px solid var(--fm-border)",
          }}
        >
          <h1
            className="text-3xl font-black uppercase tracking-wider mb-1"
            style={{
              fontFamily: "var(--font-barlow-condensed, sans-serif)",
              color: "var(--fm-text-primary)",
            }}
          >
            Welcome back
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--fm-text-sub)" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold transition hover:opacity-80"
              style={{ color: "var(--fm-accent)" }}
            >
              Sign up
            </Link>
          </p>

          {apiError && (
            <div
              className="mb-5 rounded-xl px-4 py-3 text-sm"
              style={{
                background: "rgba(224,82,82,0.12)",
                border: "1px solid rgba(224,82,82,0.4)",
                color: "#e05252",
              }}
            >
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit((v) => mutate(v))} className="space-y-4" noValidate>
            <FInput
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              registration={register("email")}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--fm-text-sub)" }}
                >
                  Password
                </label>
                <span
                  className="text-xs cursor-pointer transition hover:opacity-80"
                  style={{ color: "var(--fm-accent)" }}
                >
                  Forgot password?
                </span>
              </div>
              <FInput
                id="password"
                label=""
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                registration={register("password")}
              />
            </div>

            <div className="pt-1">
              <FButton loading={isPending}>SIGN IN</FButton>
            </div>
          </form>

          <Divider label="or continue with" />

          <div className="flex gap-3">
            <SocialButton icon="G" label="Google" />
            <SocialButton icon="🍎" label="Apple" />
          </div>
        </div>
      </div>
    </div>
  );
}
