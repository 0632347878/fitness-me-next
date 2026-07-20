"use client";

import React, { type CSSProperties } from "react";
import clsx from "clsx";
import { T } from "@/components/fm";
import type { ProgramTemplate, ScienceLevel } from "../programs.api";
import s from "./ProgramCard.module.css";

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
  locked?: boolean;          // gated behind Pro — visible but not selectable
  onChoose: (id: string) => void;
  onLockedClick?: (p: ProgramTemplate) => void; // hook for future paywall
  showScore?: boolean;
};

export function ProgramCard({ program: p, isCurrent, isSaving, locked, onChoose, onLockedClick, showScore }: Props) {
  const isLocked = !!locked && !isCurrent;

  return (
    <div className={clsx(s.card, isCurrent && s.current)}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <div className={s.titleRow}>
            <span className={s.name}>
              {p.shortName}
            </span>
            {isCurrent && (
              <span className={clsx(s.pill, s.pillCurrent)}>
                Current
              </span>
            )}
            {isLocked && (
              <span className={clsx(s.pill, s.pillLocked)}>
                🔒 Pro
              </span>
            )}
            {!isCurrent && showScore && p._score !== undefined && p._score > 0 && (
              <span className={clsx(s.pill, s.pillMatch)}>
                Match {p._score}
              </span>
            )}
          </div>
          <p className={s.byline}>
            {p.author ? `by ${p.author}` : STRUCTURE_LABEL[p.structure]}
          </p>
        </div>

        <span className={s.levelBadge} style={{ "--level-color": LEVEL_COLOR[p.minLevel] } as CSSProperties}>
          {LEVEL_LABEL[p.minLevel]}
        </span>
      </div>

      <p className={s.description}>
        {p.description}
      </p>

      <div className={s.tagRow}>
        <Tag label={`${p.daysPerWeek.join(" / ")} d/week`} />
        <Tag label={STRUCTURE_LABEL[p.structure]} />
        <Tag label={SCIENCE_LABEL[p.scienceBacking]} color={SCIENCE_COLOR[p.scienceBacking]} />
      </div>

      {/* Pros / Cons */}
      <div className={s.prosConsGrid}>
        <div>
          <SectionTitle label="Pros" color="oklch(0.65 0.18 155)" />
          <ul className={s.list}>
            {p.pros.slice(0, 4).map((pro, i) => (
              <li key={i}>{pro}</li>
            ))}
          </ul>
        </div>
        <div>
          <SectionTitle label="Cons" color="oklch(0.62 0.18 20)" />
          <ul className={s.list}>
            {p.cons.slice(0, 4).map((con, i) => (
              <li key={i}>{con}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Best for */}
      <div>
        <SectionTitle label="Best for" color={T.accent} />
        <div className={s.bestForRow}>
          {p.bestFor.map((b, i) => (
            <span key={i} className={s.bestForPill}>{b}</span>
          ))}
        </div>
      </div>

      {/* Action button */}
      {isLocked ? (
        // Gated: visible but inactive — transparent grey. Tap → future paywall.
        <button
          onClick={() => onLockedClick?.(p)}
          className={clsx(s.actionBtn, s.locked, onLockedClick && s.clickable)}
        >
          <span className={s.lockIcon}>🔒</span> Unlock program choice
        </button>
      ) : (
        <button
          onClick={() => !isCurrent && !isSaving && onChoose(p.id)}
          disabled={isCurrent || isSaving}
          className={clsx(s.actionBtn, isCurrent && s.current, isSaving && s.saving)}
        >
          {isCurrent ? "✓ Your current program" : isSaving ? "Saving…" : "Choose this program"}
        </button>
      )}
    </div>
  );
}

function Tag({ label, color }: { label: string; color?: string }) {
  const c = color ?? T.textMuted;
  return (
    <span className={s.tag} style={{ "--tag-color": c } as CSSProperties}>
      {label}
    </span>
  );
}

function SectionTitle({ label, color }: { label: string; color: string }) {
  return (
    <span className={s.sectionTitle} style={{ "--tag-color": color } as CSSProperties}>
      {label}
    </span>
  );
}
