"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useLogin } from "../hooks/useLogin";
import { loginSchema, type LoginInput } from "../auth.schemas";

const T = {
  bgInput: "#1e1e2a",
  border: "#3e3e52",
  accent: "oklch(0.72 0.18 35)",
  textPrimary: "#f0ede8",
  textSub: "#8a8898",
  textMuted: "#4a4a5c",
  danger: "#ef4444",
};

// ── tiny Logo component ──────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 52, height: 52, borderRadius: 14, background: T.accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, color: "#0d0d12", fontWeight: 900,
        }}
      >
        ⚡
      </div>
      <span
        style={{
          fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
          fontSize: 26, fontWeight: 800, letterSpacing: "0.08em",
          textTransform: "uppercase", color: T.textPrimary,
        }}
      >
        REPWISE
      </span>
    </div>
  );
}

// ── reusable FInput ──────────────────────────────────────────────────────────
function FInput({ id, label, type = "text", placeholder, error, autoComplete, registration }: {
  id: string; label: string; type?: string; placeholder?: string;
  error?: string; autoComplete?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textSub }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={isPassword ? (show ? "text" : "password") : type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          style={{
            width: "100%", background: T.bgInput,
            border: `1.5px solid ${error ? T.danger : T.border}`,
            borderRadius: 10,
            padding: isPassword ? "14px 44px 14px 14px" : "14px",
            fontSize: 15, color: T.textPrimary,
            fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
            outline: "none", transition: "border-color 0.15s", boxSizing: "border-box",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = T.accent; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = error ? T.danger : T.border; }}
          {...registration}
        />
        {isPassword && (
          <button type="button" tabIndex={-1} onClick={() => setShow((s) => !s)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textSub, fontSize: 16, lineHeight: 1, padding: 0 }}>
            {show ? "○" : "●"}
          </button>
        )}
      </div>
      {/* always reserve space so layout doesn't shift */}
      <p style={{ fontSize: 11, color: T.danger, fontFamily: "var(--font-dm-sans, sans-serif)", minHeight: 16 }}>
        {error ?? ""}
      </p>
    </div>
  );
}

// ── FButton ──────────────────────────────────────────────────────────────────
function FButton({ children, loading }: { children: React.ReactNode; loading?: boolean }) {
  return (
    <button
      type="submit" disabled={loading}
      onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = "scale(0.98)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      style={{
        width: "100%", padding: "15px 20px", borderRadius: 12,
        background: T.accent, color: "#0d0d12", border: "none",
        fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)",
        fontSize: 17, fontWeight: 700, letterSpacing: "0.06em",
        textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.45 : 1, transition: "opacity 0.15s, transform 0.1s",
      }}
    >
      {loading
        ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ width: 16, height: 16, border: "2px solid #0d0d12", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "fm-spin 0.7s linear infinite" }} />
            SIGNING IN…
          </span>
        : children}
    </button>
  );
}

// ── LoginForm ────────────────────────────────────────────────────────────────
export function LoginForm() {
  const { mutate, isPending, error } = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const apiError = error?.response?.data?.message ?? (error ? "Login failed" : null);

  return (
    <>
      <style>{`@keyframes fm-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 40, paddingTop: 8 }}>
        {/* Hero */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          <Logo />
          <div style={{ textAlign: "center" }}>
            {/* spacer = "Step 1 of 2" line height on register, prevents layout jump on page switch */}
            <div style={{ height: 22 }} />
            <h1 style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 40, fontWeight: 900, color: T.textPrimary, letterSpacing: "-0.01em", lineHeight: 1.05, textTransform: "uppercase", margin: 0 }}>
              Welcome back
            </h1>
            <p style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 14, color: T.textSub, marginTop: 6 }}>
              Log in to continue your streak
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit((v) => mutate(v))} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {apiError && (
            <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: T.danger, fontFamily: "var(--font-dm-sans, sans-serif)" }}>
              {apiError}
            </div>
          )}
          <FInput id="email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} registration={register("email")} />
          <FInput id="password" label="Password" type="password" autoComplete="current-password" placeholder="••••••••" error={errors.password?.message} registration={register("password")} />
          <FButton loading={isPending}>LOG IN</FButton>
        </form>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", paddingTop: 16 }}>
        <span style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 13, color: T.textSub }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: T.accent, fontWeight: 600, textDecoration: "none" }}>
            Sign up
          </Link>
        </span>
      </div>
    </>
  );
}
