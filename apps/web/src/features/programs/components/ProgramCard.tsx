"use client";

import React from "react";
import { T } from "@/components/fm";
import type { ProgramTemplate, ScienceLevel } from "../programs.api";

const SCIENCE_LABEL: Record<ScienceLevel, string> = {
  STRONG: "Strong evidence",
  MODERATE: "Moderate evidence",
  ANECDOTAL: "Anecdotal",
};
const SCIENCE_COLOR: Record<ScienceLevel, string> = {
  STRONG: "oklch(0.65 0.18 155)",
  MODERATE: "oklch(0.68 0.18 60)",
  ANECDOTAL: "oklch(0.62 0.18 40)",
};

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};
const LEVEL_COLOR: Record<string, string> = {
  BEGINNER: "oklch(0.65 0.18 155)",
  INTERMEDIATE: "oklch(0.65 0.18 220)",
  ADVANCED: "oklch(0.60 0.22 30)",
};

const STRUCTURE_LABEL: Record<string, string> = {
  FULL_BODY: "Full Body",
  UPPER_LOWER: "Upper / Lower",
  PUSH_PULL_LEGS: "Push Pull Legs",
  PUSH_PULL: "Push Pull",
  BRO_SPLIT: "Bro Split",
  CUSTOM: "Custom",
};

type Props = {
  program: ProgramTemplate & { _score?: number };
  isCurrent?: boolean;       // already the user's active program
  isSaving?: boolean;        // mutation in flight for THIS card
  onChoose: (id: string) => void;
  showScore?: boolean;
};

export function ProgramCard({ program: p, isCurrent, isSaving, onChoose, showScore }: Props) {
  return (
    <div
      style={{
        background: T.bgCard,
        border: `2px solid ${isCurrent ? T.accent : T.border}`,
        borderRadius: 16,
        padding: "20px",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: isCurrent ? `0 0 0 3px ${T.accentDim}` : "none",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-barlow-condensed)", fontSize: 20, fontWeight: 700, color: T.textPrimary, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {p.shortName}
            </span>
            {isCurrent && (
              <span style={{ fontSize: 11, background: T.accent, color: "#0d0d12", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                Current
              </span>
            )}
            {!isCurrent && showScore && p._score !== undefined && p._score > 0 && (
              <span style={{ fontSize: 11, background: T.accentDim, color: T.accent, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                Match {p._score}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: T.textSub, margin: "4px 0 0", lineHeight: 1.4 }}>
            {p.author ? `by ${p.author}` : STRUCTURE_LABEL[p.structure]}
          </p>
        </div>

        <span style={{
          fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
          background: LEVEL_COLOR[p.minLevel] + "20",
          color: LEVEL_COLOR[p.minLevel],
          whiteSpace: "nowrap",
        }}>
          {LEVEL_LABEL[p.minLevel]}
        </span>
      </div>

      <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.5, margin: 0 }}>
        {p.description}
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Tag label={`${p.daysPerWeek.join(" / ")} d/week`} />
        <Tag label={STRUCTURE_LABEL[p.structure]} />
        <Tag label={SCIENCE_LABEL[p.scienceBacking]} color={SCIENCE_COLOR[p.scienceBacking]} />
      </div>

      {/* Pros / Cons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <SectionTitle label="Pros" color="oklch(0.65 0.18 155)" />
          <ul style={{ margin: "6px 0 0", padding: "0 0 0 16px" }}>
            {p.pros.slice(0, 4).map((pro, i) => (
              <li key={i} style={{ fontSize: 12, color: T.textSub, marginBottom: 2 }}>{pro}</li>
            ))}
          </ul>
        </div>
        <div>
          <SectionTitle label="Cons" color="oklch(0.62 0.18 20)" />
          <ul style={{ margin: "6px 0 0", padding: "0 0 0 16px" }}>
            {p.cons.slice(0, 4).map((con, i) => (
              <li key={i} style={{ fontSize: 12, color: T.textSub, marginBottom: 2 }}>{con}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Best for */}
      <div>
        <SectionTitle label="Best for" color={T.accent} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
          {p.bestFor.map((b, i) => (
            <span key={i} style={{ fontSize: 11, background: T.bgInput, color: T.textSub, padding: "3px 10px", borderRadius: 20 }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Action button — direct choose */}
      <button
        onClick={() => !isCurrent && !isSaving && onChoose(p.id)}
        disabled={isCurrent || isSaving}
        style={{
          marginTop: 4,
          padding: "12px 0",
          borderRadius: 10,
          border: "none",
          cursor: isCurrent ? "default" : isSaving ? "wait" : "pointer",
          fontSize: 14,
          fontWeight: 700,
          background: isCurrent ? T.bgInput : T.accent,
          color: isCurrent ? T.textMuted : "#0d0d12",
          transition: "background 0.15s, color 0.15s",
        }}
      >
        {isCurrent ? "✓ Your current program" : isSaving ? "Saving…" : "Choose this program"}
      </button>
    </div>
  );
}

function Tag({ label, color }: { label: string; color?: string }) {
  const c = color ?? T.textMuted;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
      background: c + "18", color: c, border: `1px solid ${c}30`,
    }}>
      {label}
    </span>
  );
}

function SectionTitle({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.8 }}>
      {label}
    </span>
  );
}
