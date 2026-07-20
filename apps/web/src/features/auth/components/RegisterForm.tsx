"use client";

import { useState, type CSSProperties } from "react";
import clsx from "clsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { FmStyles } from "@/components/fm";
import { useRegister } from "../hooks/useRegister";
import { registerSchema, type RegisterInput } from "../auth.schemas";
import { Logo, FInput, FButton, GhostButton } from "./AuthPrimitives";
import s from "./RegisterForm.module.css";

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
  const color = STRENGTH_COLORS[score - 1] ?? "#3e3e52";
  const label = STRENGTH_LABELS[score - 1] ?? "";
  return (
    <div className={s.strengthWrap} style={{ "--strength-color": color } as CSSProperties}>
      <div className={s.strengthBars}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={clsx(s.strengthBar, i < score && s.filled)} />
        ))}
      </div>
      {label && <p className={s.strengthLabel}>{label}</p>}
      <div className={s.strengthChecks}>
        {[
          { ok: hasLen, text: "At least 8 characters" },
          { ok: hasLetter, text: "Contains a letter" },
          { ok: hasNum, text: "Contains a number" },
        ].map(({ ok, text }) => (
          <div key={text} className={s.strengthCheckRow}>
            <div className={clsx(s.strengthCheckDot, ok && s.ok)}>
              {ok ? "✓" : ""}
            </div>
            <span className={clsx(s.strengthCheckText, ok && s.ok)}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step dots ─────────────────────────────────────────────────────────────────
function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <div className={s.stepDots}>
      {[1, 2].map((n) => (
        <div key={n} className={clsx(s.stepDot, n <= step && s.active)} />
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
      <FmStyles />

      <div className={clsx(s.page, step === 2 && s.step2)}>
        {/* Back button on step 2 */}
        {step === 2 && (
          <button type="button" onClick={() => setStep(1)} className={s.backBtn}>
            ← Back
          </button>
        )}

        {/* Hero */}
        <div className={clsx(s.hero, step === 2 && s.step2)}>
          {step === 1 && <Logo />}
          <div className={clsx(s.heroText, step === 2 && s.step2)}>
            {step === 2 && <StepDots step={2} />}
            <p className={s.stepLabel}>
              {step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
            </p>
            <h1 className={s.heroTitle}>
              {step === 1 ? "Create account" : "Set password"}
            </h1>
            <p className={s.heroBody}>
              {step === 1 ? "Start your fitness journey today." : "Almost there — choose a secure password."}
            </p>
          </div>
        </div>

        {/* Step 1 form */}
        {step === 1 && (
          <div className={s.stepList}>
            <FInput id="name" label="Full name (optional)" placeholder="John Doe" autoComplete="name" error={errors.name?.message} registration={register("name")} />
            <FInput id="email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" error={errors.email?.message} registration={register("email")} />
            <FButton type="button" onClick={goToStep2}>CONTINUE →</FButton>
          </div>
        )}

        {/* Step 2 form */}
        {step === 2 && (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className={s.form}>
            {apiError && <div className={s.apiError}>{apiError}</div>}
            <div>
              <FInput id="password" label="Password" type="password" placeholder="Min. 8 characters" autoComplete="new-password" error={errors.password?.message} registration={register("password")} />
              <PasswordStrength password={password} />
            </div>
            <FInput id="confirmPassword" label="Confirm password" type="password" placeholder="Repeat your password" autoComplete="new-password" error={errors.confirmPassword?.message} registration={register("confirmPassword")} />
            <div className={s.actionsCol}>
              <FButton loading={isPending} loadingLabel="CREATING…">CREATE ACCOUNT</FButton>
              <GhostButton onClick={() => setStep(1)}>← Back</GhostButton>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className={s.footer}>
        <span className={s.footerText}>
          Already have an account?{" "}
          <Link href="/login" className={s.footerLink}>
            Sign in
          </Link>
        </span>
      </div>
    </>
  );
}
