"use client";

import React from "react";
import { T, FmPageLoader } from "@/components/fm";
import { useAlternatives } from "@/features/exercises/exercises.hooks";
import type { Exercise } from "@/features/exercises/exercises.api";

interface Props {
  exerciseId: string;
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function AlternativeDrawer({ exerciseId, open, onClose, onSelect }: Props) {
  const { data: alternatives = [], isLoading } = useAlternatives(exerciseId, "DUMBBELL");

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 40,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)",
        }}
      />

      {/* Sheet */}
      <div style={{
        position: "fixed", bottom: 52, left: 0, right: 0, zIndex: 50,
        background: T.bgCard,
        borderRadius: "20px 20px 0 0",
        border: `1px solid ${T.border}`,
        maxHeight: "70vh",
        display: "flex", flexDirection: "column",
        animation: "fm-slideUp 0.22s ease",
      }}>
        {/* Handle */}
        <div style={{ padding: "12px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }} />
        </div>

        {/* Header */}
        <div style={{ padding: "12px 20px 10px", borderBottom: `1px solid ${T.border}` }}>
          <p style={{ margin: 0, fontSize: 11, fontFamily: "var(--font-barlow-condensed)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textMuted }}>
            No equipment?
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 18, fontFamily: "var(--font-barlow-condensed)", fontWeight: 800, textTransform: "uppercase", color: T.textPrimary }}>
            Dumbbell alternatives
          </p>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {isLoading ? (
            <div style={{ padding: 32 }}><FmPageLoader /></div>
          ) : alternatives.length === 0 ? (
            <div style={{ padding: "24px 20px", textAlign: "center", color: T.textMuted, fontSize: 14 }}>
              No alternatives found
            </div>
          ) : (
            alternatives.map((alt) => (
              <button
                key={alt.id}
                onClick={() => { onSelect(alt); onClose(); }}
                style={{
                  width: "100%", padding: "12px 20px",
                  background: "transparent", border: "none",
                  borderBottom: `1px solid ${T.borderLight}`,
                  display: "flex", alignItems: "center", gap: 14,
                  cursor: "pointer", textAlign: "left",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.bgCardAlt)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* GIF thumbnail */}
                {alt.gifUrl ? (
                  <img
                    src={alt.gifUrl}
                    alt={alt.name}
                    style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0, background: T.bgInput }}
                  />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 10, background: T.bgInput, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 24 }}>🏋️</span>
                  </div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {alt.nameRu ?? alt.name}
                  </p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: T.textMuted }}>
                    {alt.muscleGroups.slice(0, 2).join(" · ")}
                  </p>
                  {alt.mechanic && (
                    <span style={{ fontSize: 10, fontFamily: "var(--font-barlow-condensed)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.accent }}>
                      {alt.mechanic}
                    </span>
                  )}
                </div>

                {/* Arrow */}
                <span style={{ color: T.textMuted, fontSize: 18, flexShrink: 0 }}>›</span>
              </button>
            ))
          )}
        </div>
      </div>

      <style>{`@keyframes fm-slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </>
  );
}
