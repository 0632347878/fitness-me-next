"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRegister } from "../hooks/useRegister";
import { registerSchema, type RegisterInput } from "../auth.schemas";

// ── Logo ─────────────────────────────────────────────────────────────────────
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
        style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", color: "var(--fm-text-primary)" }}
      >
        FITME
      </span>
    </div>
  );
}

// ── FInput ───────────────────────────────────────────────────────────────────
function FInput({
  id, label, type = "text", placeholder, error, autoComplete, registration,
}: {
  id: string; label: string; type?: string; placeholder?: string;
  error?: string; autoComplete?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
          style={{ color: "var(--fm-text-sub)" }}
        >
          {label}
        </label>
      )}
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
      {error && <p className="mt-1 text-xs" style={{ color: "#e05252" }}>{error}</p>}
    </div>
  );
}

// ── FButton ───────────────────────────────────────────────────────────────────
function FButton({ children, loading, onClick, type = "submit" }: {
  children: React.ReactNode; loading?: boolean;
  onClick?: () => void; type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      disabled={loading}
      onClick={onClick}
      className="w-full rounded-xl py-3 text-sm font-bold uppercase tracking-widest transition disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: "var(--fm-accent)", color: "#0d0d12", fontFamily: "var(--font-barlow-condensed, sans-serif)" }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          CREATING…
        </span>
      ) : children}
    </button>
  );
}

// ── GhostButton ───────────────────────────────────────────────────────────────
function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl py-3 text-sm font-semibold transition"
      style={{
        background: "transparent",
        border: "1px solid var(--fm-border)",
        color: "var(--fm-text-sub)",
        fontFamily: "var(--font-dm-sans, sans-serif)",
      }}
    >
      {children}
    </button>
  );
}

// ── PasswordStrength ──────────────────────────────────────────────────────────
function getStrength(pw: string) {
  const hasLen = pw.length >= 8;
  const hasNum = /\d/.test(pw);
  const hasLetter = /[a-zA-Z]/.test(pw);
  const score = [hasLen, hasNum, hasLetter].filter(Boolean).length;
  return { score, hasLen, hasNum, hasLetter };
}

const STRENGTH_COLORS = ["#e05252", "oklch(0.72 0.18 35)", "#4ade80"] as const;
const STRENGTH_LABELS = ["Weak", "Fair", "Strong"] as const;

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const { score, hasLen, hasNum, hasLetter } = getStrength(password);
  const color = STRENGTH_COLORS[score - 1] ?? "#4a4a5c";
  const label = STRENGTH_LABELS[score - 1] ?? "";

  return (
    <div className="mt-2 space-y-2">
      {/* bars */}
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? color : "var(--fm-border)" }}
          />
        ))}
      </div>
      {label && (
        <p className="text-xs font-medium" style={{ color }}>{label}</p>
      )}
      {/* checklist */}
      <ul className="space-y-0.5">
        {[
          { ok: hasLen, text: "At least 8 characters" },
          { ok: hasLetter, text: "Contains a letter" },
          { ok: hasNum, text: "Contains a number" },
        ].map(({ ok, text }) => (
          <li key={text} className="flex items-center gap-1.5 text-xs" style={{ color: ok ? "#4ade80" : "var(--fm-text-muted)" }}>
            <span>{ok ? "✓" : "○"}</span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2].map((s) => (
        <span
          key={s}
          className="rounded-full transition-all duration-300"
          style={{
            width: s === step ? "20px" : "8px",
            height: "8px",
            background: s === step ? "var(--fm-accent)" : "var(--fm-border)",
          }}
        />
      ))}
    </div>
  );
}

// ── RegisterForm ──────────────────────────────────────────────────────────────
export function RegisterForm() {
  const { mutate, isPending, error } = useRegister();
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const password = watch("password") ?? "";

  async function goToStep2() {
    const ok = await trigger(["name", "email"]);
    if (ok) setStep(2);
  }

  function onSubmit(values: RegisterInput) {
    const { confirmPassword, ...rest } = values;
    void confirmPassword;
    mutate(rest);
  }

  const apiError =
    error?.response?.data?.message ?? (error ? "Registration failed" : null);

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ background: "var(--fm-bg)", fontFamily: "var(--font-dm-sans, sans-serif)" }}
    >
      <div className="w-full max-w-sm">
        <Logo />

        <div
          className="rounded-2xl p-8"
          style={{ background: "var(--fm-bg-card)", border: "1px solid var(--fm-border)" }}
        >
          <StepDots step={step} />

          {step === 1 ? (
            <>
              <h1
                className="text-3xl font-black uppercase tracking-wider mb-1"
                style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", color: "var(--fm-text-primary)" }}
              >
                Create account
              </h1>
              <p className="text-sm mb-6" style={{ color: "var(--fm-text-sub)" }}>
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold transition hover:opacity-80"
                  style={{ color: "var(--fm-accent)" }}
                >
                  Sign in
                </Link>
              </p>

              <div className="space-y-4">
                <FInput
                  id="name"
                  label="Full name (optional)"
                  placeholder="John Doe"
                  autoComplete="name"
                  error={errors.name?.message}
                  registration={register("name")}
                />
                <FInput
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  error={errors.email?.message}
                  registration={register("email")}
                />
                <div className="pt-1">
                  <FButton type="button" onClick={goToStep2}>
                    CONTINUE →
                  </FButton>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1
                className="text-3xl font-black uppercase tracking-wider mb-1"
                style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", color: "var(--fm-text-primary)" }}
              >
                Set password
              </h1>
              <p className="text-sm mb-6" style={{ color: "var(--fm-text-sub)" }}>
                Almost there — just set your password.
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

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div>
                  <FInput
                    id="password"
                    label="Password"
                    type="password"
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    error={errors.password?.message}
                    registration={register("password")}
                  />
                  <PasswordStrength password={password} />
                </div>

                <FInput
                  id="confirmPassword"
                  label="Confirm password"
                  type="password"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  registration={register("confirmPassword")}
                />

                <div className="space-y-2 pt-1">
                  <FButton loading={isPending}>CREATE ACCOUNT</FButton>
                  <GhostButton onClick={() => setStep(1)}>← Back</GhostButton>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--fm-text-muted)" }}>
          By signing up, you agree to our{" "}
          <span className="underline cursor-pointer">Terms</span> and{" "}
          <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
