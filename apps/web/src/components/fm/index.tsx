"use client";

import React, { useState } from "react";
import { smartMatch, hasCyrillic } from "@/lib/transliterate";

// ─── Design Tokens ────────────────────────────────────────────────────────────
export const T = {
  bg:          "#0d0d12",
  bgCard:      "#16161f",
  bgInput:     "#1e1e2a",
  bgCardAlt:   "#1a1a26",
  border:      "#2a2a38",
  borderLight: "#222230",
  accent:      "oklch(0.72 0.18 35)",
  accentRaw:   "#e8854a",
  accentDim:   "oklch(0.72 0.18 35 / 0.12)",
  accentMid:   "oklch(0.72 0.18 35 / 0.3)",
  strength:    "oklch(0.68 0.16 290)",
  cardio:      "oklch(0.65 0.18 20)",
  flexibility: "oklch(0.70 0.14 150)",
  mobility:    "oklch(0.68 0.14 220)",
  textPrimary: "#f0ede8",
  textSub:     "#8a8898",
  textMuted:   "#4a4a5c",
  danger:      "#ef4444",
  success:     "#22c55e",
} as const;

export const CAT_COLOR: Record<string, string> = {
  STRENGTH:    "oklch(0.60 0.18 270)",   // blue-purple
  CARDIO:      "oklch(0.65 0.18 40)",    // orange
  FLEXIBILITY: "oklch(0.68 0.16 155)",   // green
  MOBILITY:    "oklch(0.68 0.16 155)",   // green (same family)
};

export const CAT_LABEL: Record<string, string> = {
  STRENGTH:    "Strength",
  CARDIO:      "Cardio",
  FLEXIBILITY: "Flexibility",
  MOBILITY:    "Mobility",
};

// Muscle group → display bucket
const MG_BUCKET: Record<string, string> = {
  chest: "Push", shoulders: "Push", triceps: "Push",
  back: "Pull", biceps: "Pull", lats: "Pull",
  quads: "Legs", hamstrings: "Legs", glutes: "Legs", calves: "Legs",
  core: "Core", abs: "Core", obliques: "Core",
};
function bucketOf(muscleGroups: string[]): string {
  for (const mg of muscleGroups) {
    const b = MG_BUCKET[mg.toLowerCase()];
    if (b) return b;
  }
  return "Other";
}

const BUCKET_ORDER = ["Push", "Pull", "Legs", "Core", "Other"];

// ─── Icons ────────────────────────────────────────────────────────────────────
type IconProps = { s?: number; c?: string };

export const Icon = {
  Home: ({ s = 22, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Dumbbell: ({ s = 22, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v16M18 4v16M6 9h12M6 15h12M4 6h2M4 18h2M18 6h2M18 18h2" />
    </svg>
  ),
  Search: ({ s = 22, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Chart: ({ s = 22, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Plus: ({ s = 20, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Flame: ({ s = 16, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
      <path d="M12 2c0 0-5 5-5 11a5 5 0 0010 0c0-3.5-2-6-2-6s-1 3-3 3c0 0 1-5 0-8z" opacity=".8" />
      <path d="M12 14c-1.1 0-2-.9-2-2 0-1.5 2-4 2-4s2 2.5 2 4c0 1.1-.9 2-2 2z" />
    </svg>
  ),
  Timer: ({ s = 14, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" />
    </svg>
  ),
  ChevDown: ({ s = 14, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Bolt: ({ s = 18, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
      <path d="M13 2L4.09 12.69A1 1 0 005 14h6v8l8.91-10.69A1 1 0 0019 10h-6V2z" />
    </svg>
  ),
  User: ({ s = 22, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

// ─── FmBadge ──────────────────────────────────────────────────────────────────
export function FmBadge({ cat, label }: { cat: string; label?: string }) {
  const color = CAT_COLOR[cat] ?? T.textSub;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 100,
      fontSize: 10, fontWeight: 600,
      fontFamily: "var(--font-barlow-condensed, sans-serif)",
      letterSpacing: "0.06em", textTransform: "uppercase",
      background: color + "1a", color,
    }}>
      {label ?? (CAT_LABEL[cat] ?? (cat.charAt(0) + cat.slice(1).toLowerCase()))}
    </span>
  );
}

// ─── FmBtn ────────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "ghost" | "danger" | "muted";
type BtnSize    = "sm" | "md" | "lg";

export function FmBtn({
  children, onClick, variant = "primary", size = "md",
  disabled, loading, style: extStyle, type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  size?: BtnSize;
  disabled?: boolean;
  loading?: boolean;
  style?: React.CSSProperties;
  type?: "button" | "submit";
}) {
  const pad = size === "sm" ? "7px 14px" : size === "lg" ? "15px 24px" : "11px 20px";
  const fs  = size === "sm" ? 13 : size === "lg" ? 17 : 15;
  const bg =
    variant === "primary" ? T.accent :
    variant === "danger"  ? T.danger :
    variant === "muted"   ? T.bgInput :
    "transparent";
  const border = variant === "ghost" ? `1.5px solid ${T.border}` : "none";
  const color  = variant === "primary" ? "#0d0d12" : T.textPrimary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: pad, borderRadius: 12, border, background: bg, color,
        fontFamily: "var(--font-barlow-condensed, sans-serif)",
        fontSize: fs, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "opacity 0.15s, transform 0.1s",
        ...extStyle,
      }}
      onMouseDown={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
      onMouseUp={(e)   => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
    >
      {loading
        ? <span style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: variant === "primary" ? "#0d0d12" : T.textPrimary, borderRadius: "50%", animation: "fm-spin 0.7s linear infinite", display: "inline-block" }} />
        : children}
    </button>
  );
}

// ─── AppHeader ────────────────────────────────────────────────────────────────
export function AppHeader({
  title, right, onAccountClick,
}: {
  title: string;
  right?: React.ReactNode;
  onAccountClick?: () => void;
}) {
  return (
    <div style={{
      padding: "14px 20px 10px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: T.bg, borderBottom: `1px solid ${T.borderLight}`, flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon.Bolt s={14} c="#0d0d12" />
        </div>
        <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 20, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: T.textPrimary }}>
          {title}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {right}
        {onAccountClick && (
          <button
            onClick={onAccountClick}
            style={{
              width: 34, height: 34, borderRadius: "50%",
              background: `linear-gradient(135deg, ${T.accent} 0%, oklch(0.62 0.22 50) 100%)`,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 0 2px ${T.bg}, 0 0 0 3.5px ${T.accentMid}`,
              flexShrink: 0,
            }}
          >
            <Icon.User s={16} c="#0d0d12" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PageLoader (dark) ────────────────────────────────────────────────────────
export function FmPageLoader() {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}>
      <span style={{ width: 32, height: 32, border: `3px solid ${T.border}`, borderTopColor: T.accentRaw, borderRadius: "50%", animation: "fm-spin 0.7s linear infinite", display: "inline-block" }} />
    </div>
  );
}

// ─── EmptyState (dark) ───────────────────────────────────────────────────────
export function FmEmpty({ icon: IconComp, title, body, action }: {
  icon: React.ComponentType<IconProps>;
  title: string; body: string; action?: React.ReactNode;
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, paddingTop: 60 }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: T.bgCard, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <IconComp s={28} c={T.textMuted} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 22, fontWeight: 800, textTransform: "uppercase", color: T.textPrimary, marginBottom: 6 }}>{title}</p>
        <p style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 13, color: T.textSub }}>{body}</p>
      </div>
      {action}
    </div>
  );
}

// ─── MuscleChip ───────────────────────────────────────────────────────────────
function MuscleChip({ bucket }: { bucket: string }) {
  const icons: Record<string, React.ReactNode> = {
    Push: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2C8 2 5 6 5 10c0 3 2 5 4 6v4h6v-4c2-1 4-3 4-6 0-4-3-8-7-8z"/></svg>,
    Pull: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h10M4 18h7"/></svg>,
    Legs: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 3v10l-2 8M14 3v10l2 8"/></svg>,
    Core: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>,
    Other:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/></svg>,
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 100, fontSize: 10, fontWeight: 600, fontFamily: "var(--font-barlow-condensed, sans-serif)", letterSpacing: "0.05em", background: T.bgInput, color: T.textSub, border: `1px solid ${T.border}` }}>
      {icons[bucket] ?? icons.Other}
      {bucket}
    </span>
  );
}

// ─── FmExercisePicker ─────────────────────────────────────────────────────────
const ALL_CATS = ["STRENGTH", "CARDIO", "MOBILITY", "FLEXIBILITY"] as const;

export function FmExercisePicker({
  value, onChange, exercises, recentIds = [],
}: {
  value: string;
  onChange: (id: string) => void;
  exercises: { id: string; name: string; category: string; muscleGroups?: string[] }[];
  recentIds?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const selected = exercises.find((e) => e.id === value);
  const isCyr = hasCyrillic(search);

  const base = catFilter ? exercises.filter((e) => e.category === catFilter) : exercises;
  const filtered = search ? base.filter((e) => smartMatch(search, e.name)) : base;

  // Build display: recent section + grouped sections
  const recentExs = !search ? filtered.filter((e) => recentIds.includes(e.id)) : [];
  const nonRecent = !search ? filtered.filter((e) => !recentIds.includes(e.id)) : filtered;

  // group by muscle bucket
  const grouped: Record<string, typeof exercises> = {};
  for (const ex of nonRecent) {
    const b = bucketOf(ex.muscleGroups ?? []);
    (grouped[b] = grouped[b] ?? []).push(ex);
  }
  const groupKeys = BUCKET_ORDER.filter((k) => grouped[k]?.length);

  function renderExRow(ex: typeof exercises[0]) {
    const bucket = bucketOf(ex.muscleGroups ?? []);
    return (
      <button
        key={ex.id}
        type="button"
        onClick={() => { onChange(ex.id); setOpen(false); setSearch(""); setCatFilter(null); }}
        style={{
          width: "100%", padding: "9px 14px",
          background: ex.id === value ? T.accentDim : "transparent",
          border: "none", borderBottom: `1px solid ${T.borderLight}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <span style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 13, color: ex.id === value ? T.accent : T.textPrimary, textAlign: "left", flex: 1, marginRight: 8 }}>{ex.name}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <MuscleChip bucket={bucket} />
          <FmBadge cat={ex.category} />
        </div>
      </button>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 10,
          background: T.bgInput, border: `1.5px solid ${open ? T.accent : T.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", transition: "border-color 0.15s",
        }}
      >
        <span style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 14, color: selected ? T.textPrimary : T.textMuted }}>
          {selected ? selected.name : "Select exercise…"}
        </span>
        <Icon.ChevDown s={14} c={T.textSub} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: T.bgCard, border: `1.5px solid ${T.border}`, borderRadius: 10,
          marginTop: 4, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {/* Search */}
          <div style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, position: "relative" }}>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search… (ru/en)"
              style={{ width: "100%", background: T.bgInput, border: `1.5px solid ${isCyr ? T.accent : T.border}`, borderRadius: 8, padding: "7px 32px 7px 10px", color: T.textPrimary, fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 13, outline: "none", transition: "border-color 0.15s" }}
            />
            {isCyr && (
              <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: T.accent, fontFamily: "var(--font-dm-sans, sans-serif)", fontWeight: 600, pointerEvents: "none", lineHeight: 1 }}>
                RU
              </span>
            )}
          </div>

          {/* Category filter pills */}
          <div style={{ display: "flex", gap: 6, padding: "8px 10px", borderBottom: `1px solid ${T.border}`, overflowX: "auto" }}>
            <button
              type="button"
              onClick={() => setCatFilter(null)}
              style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 100, border: `1.5px solid ${catFilter === null ? T.accent : T.border}`, background: catFilter === null ? T.accentDim : "transparent", color: catFilter === null ? T.accent : T.textSub, fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", cursor: "pointer" }}
            >All</button>
            {ALL_CATS.map((cat) => {
              const col = CAT_COLOR[cat];
              const active = catFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatFilter(active ? null : cat)}
                  style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 100, border: `1.5px solid ${active ? col : T.border}`, background: active ? col + "25" : "transparent", color: active ? col : T.textSub, fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", cursor: "pointer", transition: "all 0.15s" }}
                >{CAT_LABEL[cat]}</button>
              );
            })}
          </div>

          {/* Exercise list */}
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {/* Recent section */}
            {recentExs.length > 0 && (
              <>
                <div style={{ padding: "7px 14px 4px", fontSize: 10, fontFamily: "var(--font-barlow-condensed, sans-serif)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textMuted }}>Recent</div>
                {recentExs.map(renderExRow)}
              </>
            )}

            {/* Grouped sections */}
            {search ? (
              <>
                {filtered.map(renderExRow)}
                {filtered.length === 0 && (
                  <div style={{ padding: "12px 14px", fontSize: 13, color: T.textMuted, fontFamily: "var(--font-dm-sans, sans-serif)" }}>
                    {isCyr ? "Ничего не найдено" : "No results"}
                  </div>
                )}
              </>
            ) : (
              groupKeys.length === 0 && recentExs.length === 0 ? (
                <div style={{ padding: "12px 14px", fontSize: 13, color: T.textMuted, fontFamily: "var(--font-dm-sans, sans-serif)" }}>No results</div>
              ) : groupKeys.map((bucket) => (
                <React.Fragment key={bucket}>
                  <div style={{ padding: "7px 14px 4px", fontSize: 10, fontFamily: "var(--font-barlow-condensed, sans-serif)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textMuted, display: "flex", alignItems: "center", gap: 5 }}>
                    <MuscleChip bucket={bucket} />
                  </div>
                  {grouped[bucket].map(renderExRow)}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Global keyframes (injected once) ────────────────────────────────────────
export function FmStyles() {
  return (
    <style>{`
      @keyframes fm-spin    { to { transform: rotate(360deg); } }
      @keyframes fm-pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
      @keyframes fm-barGrow { from{transform:scaleY(0)} to{transform:scaleY(1)} }
      @keyframes fm-fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
    `}</style>
  );
}

