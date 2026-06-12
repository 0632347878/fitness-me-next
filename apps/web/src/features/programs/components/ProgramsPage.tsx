"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { T, FmBtn, FmPageLoader } from "@/components/fm";
import {
  usePrograms,
  useRecommendedPrograms,
  useMyProgram,
  useAssignProgram,
} from "../hooks/usePrograms";
import { ProgramCard } from "./ProgramCard";
import type { ExperienceLevel } from "../programs.api";

const LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];
const DAYS_OPTIONS = [3, 4, 5, 6];
const LEVEL_ORDER: ExperienceLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

type Tab = "all" | "recommended";

export function ProgramsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("recommended");
  const [level, setLevel] = useState<ExperienceLevel>("INTERMEDIATE");
  const [allLevel, setAllLevel] = useState<ExperienceLevel | "ALL">("ALL");
  const [days, setDays] = useState<number>(4);
  const [sport, setSport] = useState("");
  const [justSavedId, setJustSavedId] = useState<string | null>(null);

  const { data: allPrograms, isLoading: allLoading } = usePrograms();
  const { data: recommended, isLoading: recLoading } = useRecommendedPrograms(
    tab === "recommended" ? { experienceLevel: level, daysPerWeek: days, sport: sport || undefined } : null
  );
  const { data: myProgram } = useMyProgram();
  const assign = useAssignProgram();

  const isLoading = tab === "all" ? allLoading : recLoading;

  const filteredAll = allPrograms
    ? [...allPrograms]
        .sort((a, b) => LEVEL_ORDER.indexOf(a.minLevel) - LEVEL_ORDER.indexOf(b.minLevel))
        .filter((p) => allLevel === "ALL" || p.minLevel === allLevel)
    : [];

  const programs = tab === "all" ? filteredAll : recommended;

  const handleChoose = async (id: string) => {
    await assign.mutateAsync(id);
    setJustSavedId(id);
  };

  const savingId = assign.isPending ? assign.variables : null;

  return (
    <div style={{ padding: "24px 16px", maxWidth: 680, margin: "0 auto", paddingBottom: justSavedId ? 100 : 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-barlow-condensed)", fontSize: 30, fontWeight: 900, textTransform: "uppercase", color: T.textPrimary, margin: 0 }}>
          Training Programs
        </h1>
        <p style={{ fontSize: 13, color: T.textSub, marginTop: 6 }}>
          {myProgram
            ? <>Current: <span style={{ color: T.accent, fontWeight: 600 }}>{myProgram.shortName}</span></>
            : "Choose a program to start training"}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["recommended", "all"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: tab === t ? T.accent : T.bgInput,
              color: tab === t ? "#0d0d12" : T.textSub,
              transition: "background 0.15s",
            }}
          >
            {t === "recommended" ? "For me" : "All programs"}
          </button>
        ))}
      </div>

      {/* "All" tab — level filter */}
      {tab === "all" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <Chip active={allLevel === "ALL"} onClick={() => setAllLevel("ALL")}>All levels</Chip>
          {LEVELS.map((l) => (
            <Chip key={l.value} active={allLevel === l.value} onClick={() => setAllLevel(l.value)}>
              {l.label}
            </Chip>
          ))}
        </div>
      )}

      {/* "Recommended" tab — profile filters */}
      {tab === "recommended" && (
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, marginBottom: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <Label>Your level</Label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {LEVELS.map((l) => (
                <Chip key={l.value} active={level === l.value} onClick={() => setLevel(l.value)}>{l.label}</Chip>
              ))}
            </div>
          </div>
          <div>
            <Label>Days per week</Label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {DAYS_OPTIONS.map((d) => (
                <Chip key={d} active={days === d} onClick={() => setDays(d)}>{d}×</Chip>
              ))}
            </div>
          </div>
          <div>
            <Label>Sport (optional)</Label>
            <input
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              placeholder="ski, snowboard, kite…"
              style={{
                marginTop: 6, width: "100%", padding: "8px 12px", borderRadius: 10,
                border: `1px solid ${T.border}`, background: T.bgInput, color: T.textPrimary, fontSize: 13,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <FmPageLoader />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {programs?.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              isCurrent={myProgram?.id === p.id}
              isSaving={savingId === p.id}
              onChoose={handleChoose}
              showScore={tab === "recommended"}
            />
          ))}
          {programs?.length === 0 && (
            <p style={{ color: T.textMuted, textAlign: "center", padding: "40px 0" }}>
              No programs found
            </p>
          )}
        </div>
      )}

      {/* Saved → prompt to generate plan */}
      {justSavedId && (
        <div style={{
          position: "fixed", bottom: 72, left: "50%", transform: "translateX(-50%)",
          background: T.bgCard, border: `1px solid ${T.accent}`,
          borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 50, width: "calc(100% - 32px)", maxWidth: 480,
        }}>
          <span style={{ fontSize: 13, color: T.textPrimary, fontWeight: 600, flex: 1 }}>
            ✓ Program saved. Generate your plan?
          </span>
          <FmBtn size="sm" onClick={() => router.push("/dashboard")}>
            Go to plan →
          </FmBtn>
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>
      {children}
    </span>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
        background: active ? T.accent : T.bgInput,
        color: active ? "#0d0d12" : T.textSub,
        transition: "background 0.15s",
      }}
    >
      {children}
    </button>
  );
}
