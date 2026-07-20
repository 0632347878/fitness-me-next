"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FmBtn } from "@/components/fm";
import { useT } from "@/lib/lang-context";
import { deleteAllWorkouts } from "@/features/workouts/workouts.api";
import s from "./DangerZone.module.css";

type ResetState = "idle" | "confirm" | "loading" | "done";

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

interface DangerZoneProps {
  onReset?: () => void;
}

export function DangerZone({ onReset }: DangerZoneProps) {
  const t = useT();
  const qc = useQueryClient();
  const [state, setState] = useState<ResetState>("idle");
  const s_ = t.settings;

  async function handleReset() {
    setState("loading");
    try {
      await deleteAllWorkouts();
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["workouts"] }),
        qc.invalidateQueries({ queryKey: ["dashboard-stats"] }),
        qc.invalidateQueries({ queryKey: ["me"] }),
      ]);
      setState("done");
      setTimeout(() => {
        setState("idle");
        onReset?.();
      }, 1800);
    } catch {
      setState("idle");
    }
  }

  return (
    <div className={s.dangerBox}>
      <p className={s.dangerTitle}>{s_.resetHistory}</p>
      <p className={s.dangerDesc}>{s_.resetHistoryDesc}</p>

      {state === "done" ? (
        <div className={s.doneMsg}>✓ {s_.resetDone}</div>

      ) : state === "confirm" ? (
        <div className={s.confirmBox}>
          <p className={s.confirmTitle}>{s_.resetConfirmTitle}</p>
          <p className={s.confirmDesc}>{s_.resetConfirmDesc}</p>
          <div className={s.confirmActions}>
            <FmBtn variant="ghost" size="sm" onClick={() => setState("idle")}>
              {s_.cancelReset}
            </FmBtn>
            <FmBtn variant="danger" size="sm" onClick={handleReset}>
              <TrashIcon /> {s_.confirmReset}
            </FmBtn>
          </div>
        </div>

      ) : (
        <FmBtn
          variant="ghost"
          size="sm"
          loading={state === "loading"}
          onClick={() => setState("confirm")}
          className={s.dangerGhostBtn}
        >
          <TrashIcon /> {s_.resetHistory}
        </FmBtn>
      )}
    </div>
  );
}

