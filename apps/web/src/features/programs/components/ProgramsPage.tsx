"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { FmBtn, FmPageLoader } from "@/components/fm";
import {
  usePrograms,
  useRecommendedPrograms,
  useMyProgram,
  useAssignProgram,
} from "../hooks/usePrograms";
import { ProgramCard } from "./ProgramCard";
import type { ExperienceLevel } from "../programs.api";
import s from "./ProgramsPage.module.css";

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
    <div className={clsx(s.page, justSavedId && s.savedPrompt)}>
      {/* Header */}
      <div className={s.header}>
        <h1 className={s.title}>
          Training Programs
        </h1>
        <p className={s.subtitle}>
          {myProgram
            ? <>Current: <span className={s.current}>{myProgram.shortName}</span></>
            : "Choose a program to start training"}
        </p>
      </div>

      {/* Tabs */}
      <div className={s.tabRow}>
        {(["recommended", "all"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(s.pillBtn, tab === t && s.active)}
          >
            {t === "recommended" ? "For me" : "All programs"}
          </button>
        ))}
      </div>

      {/* "All" tab — level filter */}
      {tab === "all" && (
        <div className={s.filterRow}>
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
        <div className={s.filterPanel}>
          <div>
            <Label>Your level</Label>
            <div className={s.filterGroupRow}>
              {LEVELS.map((l) => (
                <Chip key={l.value} active={level === l.value} onClick={() => setLevel(l.value)}>{l.label}</Chip>
              ))}
            </div>
          </div>
          <div>
            <Label>Days per week</Label>
            <div className={s.filterGroupRow}>
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
              className={s.sportInput}
            />
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <FmPageLoader />
      ) : (
        <div className={s.list}>
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
            <p className={s.emptyMsg}>
              No programs found
            </p>
          )}
        </div>
      )}

      {/* Saved → prompt to generate plan */}
      {justSavedId && (
        <div className={s.savedToast}>
          <span className={s.savedToastText}>
            ✓ Program saved — your plan has been updated
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
    <span className={s.label}>
      {children}
    </span>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={clsx(s.chip, active && s.active)}>
      {children}
    </button>
  );
}
