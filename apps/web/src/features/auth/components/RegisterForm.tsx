"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRegister } from "../hooks/useRegister";
import { registerSchema, type RegisterInput } from "../auth.schemas";

const T = {
  bgInput: "#1e1e2a",
  border: "#3e3e52",
  accent: "oklch(0.72 0.18 35)",
  textPrimary: "#f0ede8",
  textSub: "#8a8898",
  textMuted: "#4a4a5c",
  danger: "#ef4444",
};

// ── Logo ─────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "#0d0d12", fontWeight: 900 }}>
        ⚡
      </div>
      <span style={{ fontFamily: "var(--font-barlow-condensed, 'Barlow Condensed', sans-serif)", fontSize: 26, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: T.textPrimary }}>
        REPWISE
      </span>
    </div>
  );
}

// ── FInput ───────────────────────────────────────────────────────────────────
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
      {label && (
        <label htmlFor={id} style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textSub }}>
          {label}
        </label>
      )}
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
      <p style={{ fontSize: 11, color: T.danger, fontFamily: "var(--font-dm-sans, sans-serif)", minHeight: 16 }}>
        {error ?? ""}
      </p>
    </div>
  );
}

// ── FButton ───────────────────────────────────────────────────────────────────
function FButton({ children, loading, type = "submit", onClick }: {
  children: React.ReactNode; loading?: boolean; type?: "submit" | "button"; onClick?: () => void;
}) {
  return (
    <button
      type={type} disabled={loading} onClick={onClick}
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
            CREATING…
          </span>
        : children}
    </button>
  );
}

// ── GhostButton ───────────────────────────────────────────────────────────────
function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        width: "100%", padding: "13px 20px", borderRadius: 12,
        background: "transparent", border: `1.5px solid ${T.border}`,
        color: T.textSub, fontFamily: "var(--font-dm-sans, sans-serif)",
        fontSize: 15, cursor: "pointer", transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#5a5a6a"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; }}
    >
      {children}
    </button>
  );
}

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pw: string) {
  const hasLen = pw.length >= 8;
  const hasNum = /\d/.test(pw);
  const hasLetter = /[a-zA-Z]/.test(pw);
  const score = [hasLen, hasNum, hasLetter].filter(Boolean).length;
  return { score, hasLen, hasNum, hasLetter };
}
const STRENGTH_COLORS = ["#ef4444", "oklch(0.72 0.18 35)", "#4ade80"] as const;
const STRENGTH_LABELS = ["Weak", "Fair", "Strong"] as const;

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const { score, hasLen, hasNum, hasLetter } = getStrength(password);
  const color = STRENGTH_COLORS[score - 1] ?? T.border;
  const label = STRENGTH_LABELS[score - 1] ?? "";
  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 5 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 4, background: i < score ? color : T.border, transition: "background 0.3s" }} />
        ))}
      </div>
      {label && <p style={{ fontSize: 11, color, fontFamily: "var(--font-dm-sans, sans-serif)", fontWeight: 500 }}>{label}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {[
          { ok: hasLen, text: "At least 8 characters" },
          { ok: hasLetter, text: "Contains a letter" },
          { ok: hasNum, text: "Contains a number" },
        ].map(({ ok, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", border: `1.5px solid ${ok ? "#4ade80" : T.textMuted}`, background: ok ? "#4ade80" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#0d0d12", flexShrink: 0, transition: "all 0.2s" }}>
              {ok ? "✓" : ""}
            </div>
            <span style={{ fontSize: 12, color: ok ? T.textSub : T.textMuted, fontFamily: "var(--font-dm-sans, sans-serif)" }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step dots ─────────────────────────────────────────────────────────────────
function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
      {[1, 2].map((s) => (
        <div key={s} style={{ height: 4, borderRadius: 4, background: s <= step ? T.accent : T.border, width: s === step ? 24 : 8, transition: "all 0.3s" }} />
      ))}
    </div>
  );
}

// ── RegisterForm ──────────────────────────────────────────────────────────────
export function RegisterForm() {
  const { mutate, isPending, error } = useRegister();
  const [step, setStep] = useState<1 | 2>(1);

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm<RegisterInput>({
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

  const apiError = error?.response?.data?.message ?? (error ? "Registration failed" : null);

  return (
    <>
      <style>{`@keyframes fm-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: step === 1 ? 32 : 28, paddingTop: 8 }}>
        {/* Back button on step 2 */}
        {step === 2 && (
          <button type="button" onClick={() => setStep(1)}
            style={{ background: "none", border: "none", color: T.textSub, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 13 }}>
            ← Back
          </button>
        )}

        {/* Hero */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: step === 1 ? "center" : "flex-start", gap: step === 1 ? 28 : 16 }}>
          {step === 1 && <Logo />}
          <div style={{ textAlign: step === 1 ? "center" : "left" }}>
            {step === 2 && <StepDots step={2} />}
            <p style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 12, color: T.textSub, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
              {step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
            </p>
            <h1 style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 40, fontWeight: 900, color: T.textPrimary, letterSpacing: "-0.01em", lineHeight: 1.05, textTransform: "uppercase", margin: 0 }}>
              {step === 1 ? "Create account" : "Set password"}
            </h1>
            <p style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 14, color: T.textSub, marginTop: 5 }}>
              {step === 1 ? "Start your fitness journey today." : "Almost there — choose a secure password."}
            </p>
          </div>
        </div>

        {/* Step 1 form */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <FInput id="name" label="Full name (optional)" placeholder="John Doe" autoComplete="name" error={errors.name?.message} registration={register("name")} />
            <FInput id="email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" error={errors.email?.message} registration={register("email")} />
            <FButton type="button" onClick={goToStep2}>CONTINUE →</FButton>
          </div>
        )}

        {/* Step 2 form */}
        {step === 2 && (
          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {apiError && (
              <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: T.danger, fontFamily: "var(--font-dm-sans, sans-serif)" }}>
                {apiError}
              </div>
            )}
            <div>
              <FInput id="password" label="Password" type="password" placeholder="Min. 8 characters" autoComplete="new-password" error={errors.password?.message} registration={register("password")} />
              <PasswordStrength password={password} />
            </div>
            <FInput id="confirmPassword" label="Confirm password" type="password" placeholder="Repeat your password" autoComplete="new-password" error={errors.confirmPassword?.message} registration={register("confirmPassword")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <FButton loading={isPending}>CREATE ACCOUNT</FButton>
              <GhostButton onClick={() => setStep(1)}>← Back</GhostButton>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", paddingTop: 14 }}>
        <span style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 13, color: T.textSub }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: T.accent, fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </span>
      </div>
    </>
  );
}
