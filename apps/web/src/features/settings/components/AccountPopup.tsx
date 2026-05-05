"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { T, FmBtn } from "@/components/fm";
import { useLang, useT } from "@/lib/lang-context";
import { useSettings } from "@/lib/settings-context";
import { deleteAllWorkouts } from "@/features/workouts/workouts.api";

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

type ResetState = "idle" | "confirm" | "loading" | "done";

interface AccountPopupProps {
  onLogout: () => void;
}

export function AccountPopup({ onLogout }: AccountPopupProps) {
  const { isOpen, close } = useSettings();
  const { lang, setLang, loading: langLoading } = useLang();
  const t = useT();
  const qc = useQueryClient();

  const [resetState, setResetState] = useState<ResetState>("idle");

  if (!isOpen) return null;

  async function handleReset() {
    setResetState("loading");
    try {
      await deleteAllWorkouts();
      // invalidate all affected queries with correct keys
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["workouts"] }),
        qc.invalidateQueries({ queryKey: ["dashboard-stats"] }),
        qc.invalidateQueries({ queryKey: ["me"] }),
      ]);
      setResetState("done");
      setTimeout(() => {
        setResetState("idle");
        close();
      }, 1800);
    } catch {
      setResetState("idle");
    }
  }

  const s = t.settings;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(360px, 100vw)",
          zIndex: 201,
          background: T.bgCard,
          borderLeft: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column",
          boxShadow: "-12px 0 40px rgba(0,0,0,0.5)",
          animation: "fm-slideInRight 0.22s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "18px 20px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${T.border}`,
        }}>
          <span style={{
            fontFamily: "var(--font-barlow-condensed, sans-serif)",
            fontSize: 20, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.06em", color: T.textPrimary,
          }}>
            {s.title}
          </span>
          <button
            onClick={close}
            style={{
              background: T.bgInput, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: 6, cursor: "pointer",
              color: T.textSub, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 28 }}>

          {/* ── Language ── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionLabel>{s.language}</SectionLabel>
            <div style={{
              display: "flex", gap: 8,
              background: T.bgInput, borderRadius: 12, padding: 4,
              border: `1px solid ${T.border}`,
            }}>
              {(["en", "ru"] as const).map((l) => {
                const active = lang === l;
                return (
                  <button
                    key={l}
                    onClick={() => !langLoading && setLang(l)}
                    disabled={langLoading}
                    style={{
                      flex: 1, padding: "9px 0",
                      borderRadius: 9, border: "none",
                      background: active ? T.accent : "transparent",
                      color: active ? "#0d0d12" : T.textSub,
                      fontFamily: "var(--font-barlow-condensed, sans-serif)",
                      fontSize: 14, fontWeight: 800, letterSpacing: "0.08em",
                      textTransform: "uppercase", cursor: langLoading ? "wait" : "pointer",
                      opacity: langLoading ? 0.5 : 1,
                      transition: "all 0.15s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>{l === "en" ? "🇬🇧" : "🇷🇺"}</span>
                    {l.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Danger Zone ── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionLabel danger>{s.dangerZone}</SectionLabel>
            <div style={{
              background: T.bg, borderRadius: 14, padding: 16,
              border: `1px solid ${T.danger}22`,
            }}>
              <p style={{
                fontFamily: "var(--font-barlow-condensed, sans-serif)",
                fontSize: 15, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.04em", color: T.textPrimary, marginBottom: 6,
              }}>
                {s.resetHistory}
              </p>
              <p style={{
                fontFamily: "var(--font-dm-sans, sans-serif)",
                fontSize: 13, color: T.textSub, lineHeight: 1.5, marginBottom: 14,
              }}>
                {s.resetHistoryDesc}
              </p>

              {resetState === "done" ? (
                <div style={{
                  padding: "10px 14px", borderRadius: 10,
                  background: "oklch(0.70 0.14 150 / 0.12)",
                  border: "1px solid oklch(0.70 0.14 150 / 0.3)",
                  color: T.success,
                  fontFamily: "var(--font-barlow-condensed, sans-serif)",
                  fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
                  textAlign: "center",
                }}>
                  ✓ {s.resetDone}
                </div>
              ) : resetState === "confirm" ? (
                <div style={{
                  background: `${T.danger}11`, borderRadius: 10,
                  border: `1px solid ${T.danger}44`, padding: 14,
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <p style={{
                    fontFamily: "var(--font-barlow-condensed, sans-serif)",
                    fontSize: 14, fontWeight: 700, textTransform: "uppercase",
                    color: T.danger, letterSpacing: "0.04em",
                  }}>
                    {s.resetConfirmTitle}
                  </p>
                  <p style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 12, color: T.textSub, lineHeight: 1.5 }}>
                    {s.resetConfirmDesc}
                  </p>
                  <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                    <FmBtn variant="ghost" size="sm" style={{ flex: 1 }} onClick={() => setResetState("idle")}>
                      {s.cancelReset}
                    </FmBtn>
                    <FmBtn variant="danger" size="sm" style={{ flex: 1 }} onClick={handleReset}>
                      <TrashIcon /> {s.confirmReset}
                    </FmBtn>
                  </div>
                </div>
              ) : (
                <FmBtn
                  variant="ghost"
                  size="sm"
                  loading={resetState === "loading"}
                  onClick={() => setResetState("confirm")}
                  style={{ borderColor: `${T.danger}44`, color: T.danger }}
                >
                  <TrashIcon /> {s.resetHistory}
                </FmBtn>
              )}
            </div>
          </section>
        </div>

        {/* Footer – Logout */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.border}` }}>
          <button
            onClick={() => { close(); onLogout(); }}
            style={{
              width: "100%", padding: "13px 20px",
              background: "transparent", border: `1.5px solid ${T.border}`,
              borderRadius: 12, cursor: "pointer",
              color: T.textSub,
              fontFamily: "var(--font-barlow-condensed, sans-serif)",
              fontSize: 15, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = T.danger;
              e.currentTarget.style.color = T.danger;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.color = T.textSub;
            }}
          >
            <LogoutIcon /> {s.logout}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fm-slideInRight {
          from { transform: translateX(100%); opacity: 0.6; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

function SectionLabel({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <span style={{
      fontFamily: "var(--font-barlow-condensed, sans-serif)",
      fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: danger ? T.danger : T.textMuted,
    }}>
      {children}
    </span>
  );
}
