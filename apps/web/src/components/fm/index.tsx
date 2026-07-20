"use client";

import React, { useState, type CSSProperties } from "react";
import clsx from "clsx";
import { smartMatch, hasCyrillic } from "@/lib/transliterate";
import s from "./fm.module.css";

// ─── Design Tokens ────────────────────────────────────────────────────────────
export const T = {
  bg:          "var(--fm-bg)",
  bgCard:      "var(--fm-bg-card)",
  bgInput:     "var(--fm-bg-input)",
  bgCardAlt:   "var(--fm-bg-card-alt)",
  border:      "var(--fm-border)",
  borderLight: "var(--fm-border-light)",
  accent:      "var(--fm-accent)",
  accentRaw:   "var(--fm-accent-raw)",
  accentDim:   "var(--fm-accent-dim)",
  accentMid:   "var(--fm-accent-mid)",
  strength:    "var(--fm-strength)",
  cardio:      "var(--fm-cardio)",
  flexibility: "var(--fm-flexibility)",
  mobility:    "var(--fm-mobility)",
  textPrimary: "var(--fm-text-primary)",
  textSub:     "var(--fm-text-sub)",
  textMuted:   "var(--fm-text-muted)",
  danger:      "var(--fm-danger)",
  success:     "var(--fm-success)",
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
  Pencil: ({ s = 16, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Check: ({ s = 14, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ChevLeft: ({ s = 16, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevRight: ({ s = 14, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  PlusCircle: ({ s = 15, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  Calendar: ({ s = 15, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
};

// ─── FmBadge ──────────────────────────────────────────────────────────────────
export function FmBadge({ cat, label }: { cat: string; label?: string }) {
  const color = CAT_COLOR[cat] ?? T.textSub;
  return (
    <span className={s.badge} style={{ "--badge-color": color } as CSSProperties}>
      {label ?? (CAT_LABEL[cat] ?? (cat.charAt(0) + cat.slice(1).toLowerCase()))}
    </span>
  );
}

// ─── FmBtn ────────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "ghost" | "danger" | "muted";
type BtnSize    = "sm" | "md" | "lg";

const BTN_SIZE_CLASS: Record<BtnSize, string> = { sm: s.btnSm, md: s.btnMd, lg: s.btnLg };
const BTN_VARIANT_CLASS: Record<BtnVariant, string> = {
  primary: s.btnPrimary, ghost: s.btnGhost, danger: s.btnDanger, muted: s.btnMuted,
};

export function FmBtn({
  children, onClick, variant = "primary", size = "md",
  disabled, loading, className, style: extStyle, type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  size?: BtnSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(s.btn, BTN_SIZE_CLASS[size], BTN_VARIANT_CLASS[variant], className)}
      style={extStyle}
    >
      {loading ? <span className={s.spinner} /> : children}
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
    <div className={s.header}>
      <div className={s.headerLeft}>
        <div className={s.logoDot}>
          <Icon.Bolt s={14} c="#0d0d12" />
        </div>
        <span className={s.title}>{title}</span>
      </div>
      <div className={s.headerRight}>
        {right}
        {onAccountClick && (
          <button onClick={onAccountClick} className={s.avatarBtn}>
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
    <div className={s.loaderWrap}>
      <span className={s.pageLoaderSpinner} />
    </div>
  );
}

// ─── EmptyState (dark) ───────────────────────────────────────────────────────
export function FmEmpty({ icon: IconComp, title, body, action }: {
  icon: React.ComponentType<IconProps>;
  title: string; body: string; action?: React.ReactNode;
}) {
  return (
    <div className={s.emptyWrap}>
      <div className={s.emptyIconWrap}>
        <IconComp s={28} c={T.textMuted} />
      </div>
      <div className={s.emptyTextWrap}>
        <p className={s.emptyTitle}>{title}</p>
        <p className={s.emptyBody}>{body}</p>
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
    <span className={s.bucketChip}>
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
    const isSelected = ex.id === value;
    return (
      <button
        key={ex.id}
        type="button"
        onClick={() => { onChange(ex.id); setOpen(false); setSearch(""); setCatFilter(null); }}
        className={clsx(s.exRow, isSelected && s.selected)}
      >
        <span className={clsx(s.exName, isSelected && s.selected)}>{ex.name}</span>
        <div className={s.exMeta}>
          <MuscleChip bucket={bucket} />
          <FmBadge cat={ex.category} />
        </div>
      </button>
    );
  }

  return (
    <div className={s.pickerWrap}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(s.trigger, open && s.open)}
      >
        <span className={clsx(s.triggerLabel, selected && s.selected)}>
          {selected ? selected.name : "Select exercise…"}
        </span>
        <Icon.ChevDown s={14} c={T.textSub} />
      </button>

      {open && (
        <div className={s.dropdown}>
          {/* Search */}
          <div className={s.searchWrap}>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search… (ru/en)"
              className={clsx(s.searchInput, isCyr && s.cyr)}
            />
            {isCyr && <span className={s.ruBadge}>RU</span>}
          </div>

          {/* Category filter pills */}
          <div className={s.catRow}>
            <button
              type="button"
              onClick={() => setCatFilter(null)}
              className={clsx(s.catPill, catFilter === null && s.active)}
            >All</button>
            {ALL_CATS.map((cat) => {
              const col = CAT_COLOR[cat];
              const active = catFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatFilter(active ? null : cat)}
                  data-active={active}
                  style={{ "--cat-color": col } as CSSProperties}
                  className={s.catPill}
                >{CAT_LABEL[cat]}</button>
              );
            })}
          </div>

          {/* Exercise list */}
          <div className={s.list}>
            {/* Recent section */}
            {recentExs.length > 0 && (
              <>
                <div className={s.sectionLabel}>Recent</div>
                {recentExs.map(renderExRow)}
              </>
            )}

            {/* Grouped sections */}
            {search ? (
              <>
                {filtered.map(renderExRow)}
                {filtered.length === 0 && (
                  <div className={s.noResults}>
                    {isCyr ? "Ничего не найдено" : "No results"}
                  </div>
                )}
              </>
            ) : (
              groupKeys.length === 0 && recentExs.length === 0 ? (
                <div className={s.noResults}>No results</div>
              ) : groupKeys.map((bucket) => (
                <React.Fragment key={bucket}>
                  <div className={clsx(s.sectionLabel, s.sectionLabelBucket)}>
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
      @keyframes fm-slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
      @keyframes rw-flip    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
    `}</style>
  );
}

