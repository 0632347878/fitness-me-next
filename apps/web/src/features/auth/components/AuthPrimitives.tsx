"use client";

import { useState } from "react";
import clsx from "clsx";
import s from "./AuthPrimitives.module.css";

export function Logo() {
  return (
    <div className={s.logo}>
      <div className={s.logoIcon}>⚡</div>
      <span className={s.logoText}>REPWISE</span>
    </div>
  );
}

export function FInput({ id, label, type = "text", placeholder, error, autoComplete, registration }: {
  id: string; label?: string; type?: string; placeholder?: string;
  error?: string; autoComplete?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={s.fieldWrap}>
      {label && <label htmlFor={id} className={s.label}>{label}</label>}
      <div className={s.inputWrap}>
        <input
          id={id}
          type={isPassword ? (show ? "text" : "password") : type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={clsx(s.input, isPassword && s.password, error && s.error)}
          {...registration}
        />
        {isPassword && (
          <button type="button" tabIndex={-1} onClick={() => setShow((v) => !v)} className={s.toggleVisibility}>
            {show ? "○" : "●"}
          </button>
        )}
      </div>
      {/* always reserve space so layout doesn't shift */}
      <p className={s.errorText}>{error ?? ""}</p>
    </div>
  );
}

export function FButton({ children, loading, type = "submit", onClick, loadingLabel = "" }: {
  children: React.ReactNode; loading?: boolean; type?: "submit" | "button"; onClick?: () => void;
  loadingLabel?: string;
}) {
  return (
    <button type={type} disabled={loading} onClick={onClick} className={s.btn}>
      {loading
        ? <span className={s.btnLoading}>
            <span className={s.btnSpinner} />
            {loadingLabel}
          </span>
        : children}
    </button>
  );
}

export function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={s.ghostBtn}>
      {children}
    </button>
  );
}
