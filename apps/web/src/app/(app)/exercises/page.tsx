"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getExercises, getEquipmentList, type Exercise } from "@/features/exercises/exercises.api";
import { T, CAT_COLOR, CAT_LABEL, FmBadge, FmBtn, FmPageLoader, AppHeader, Icon, FmStyles } from "@/components/fm";
import { useLang, useT } from "@/lib/lang-context";
import { useSettings } from "@/lib/settings-context";
import { transliterate, hasCyrillic } from "@/lib/transliterate";

const CATEGORIES = ["STRENGTH", "CARDIO", "FLEXIBILITY", "MOBILITY"] as const;

// ─── Search icon ──────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ─── Close icon ───────────────────────────────────────────────────────────────
function CloseIcon({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Muscle chip ──────────────────────────────────────────────────────────────
function MuscleChip({ label }: { label: string }) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 100,
      fontSize: 10, fontWeight: 600,
      fontFamily: "var(--font-barlow-condensed, sans-serif)",
      letterSpacing: "0.06em", textTransform: "uppercase" as const,
      background: T.bgInput, color: T.textSub,
      border: `1px solid ${T.border}`,
    }}>
      {label}
    </span>
  );
}

// ─── Exercise card ────────────────────────────────────────────────────────────
function ExerciseCard({ ex, lang, onClick }: { ex: Exercise; lang: string; onClick: () => void }) {
  const displayName = lang === "ru" ? (ex.nameRu ?? ex.name) : ex.name;
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", textAlign: "left",
        background: hovered ? T.bgCardAlt : T.bgCard,
        border: `1px solid ${hovered ? T.border : T.borderLight}`,
        borderRadius: 14, padding: "14px 16px",
        cursor: "pointer", transition: "all 0.15s",
        display: "flex", flexDirection: "column", gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <span style={{
          fontFamily: "var(--font-dm-sans, sans-serif)",
          fontSize: 14, fontWeight: 600,
          color: T.textPrimary, lineHeight: 1.35, flex: 1,
        }}>
          {displayName}
        </span>
        <FmBadge cat={ex.category} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
        {ex.muscleGroups.slice(0, 3).map((m) => <MuscleChip key={m} label={m} />)}
        {ex.muscleGroups.length > 3 && (
          <span style={{ fontSize: 10, color: T.textMuted, alignSelf: "center" }}>+{ex.muscleGroups.length - 3}</span>
        )}
      </div>
      {ex.equipment && (
        <span style={{ fontSize: 12, color: T.textMuted, fontFamily: "var(--font-dm-sans, sans-serif)" }}>
          🏋️ {ex.equipment}
        </span>
      )}
    </button>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function ExerciseDetail({ ex, lang, onClose }: { ex: Exercise; lang: string; onClose: () => void }) {
  const displayName = lang === "ru" ? (ex.nameRu ?? ex.name) : ex.name;
  const t = useT();
  const catColor = CAT_COLOR[ex.category] ?? T.textSub;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, backdropFilter: "blur(2px)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201,
        background: T.bgCard, borderRadius: "20px 20px 0 0",
        border: `1px solid ${T.border}`, padding: "0 0 32px",
        animation: "fm-slideUp 0.22s cubic-bezier(0.22,1,0.36,1)",
        maxHeight: "80dvh", overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        {/* handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }} />
        </div>
        {/* header */}
        <div style={{
          padding: "0 20px 14px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontFamily: "var(--font-barlow-condensed, sans-serif)",
              fontSize: 22, fontWeight: 900, textTransform: "uppercase" as const,
              letterSpacing: "0.02em", color: T.textPrimary, lineHeight: 1.1, marginBottom: 8,
            }}>
              {displayName}
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, alignItems: "center" }}>
              <FmBadge cat={ex.category} />
              {ex.equipment && (
                <span style={{
                  padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 600,
                  fontFamily: "var(--font-barlow-condensed, sans-serif)", letterSpacing: "0.06em",
                  textTransform: "uppercase" as const, background: T.bgInput, color: T.textSub,
                  border: `1px solid ${T.border}`,
                }}>
                  🏋️ {ex.equipment}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: T.bgInput, border: `1px solid ${T.border}`,
            borderRadius: 10, padding: 8, cursor: "pointer",
            color: T.textSub, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <CloseIcon s={16} />
          </button>
        </div>
        {/* body */}
        <div style={{ overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Muscles */}
          <div>
            <p style={{
              fontFamily: "var(--font-barlow-condensed, sans-serif)",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase" as const, color: T.textMuted, marginBottom: 8,
            }}>
              {t.exercises.muscleGroups}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
              {ex.muscleGroups.map((m) => (
                <span key={m} style={{
                  padding: "5px 12px", borderRadius: 100,
                  fontSize: 12, fontWeight: 600,
                  fontFamily: "var(--font-barlow-condensed, sans-serif)",
                  letterSpacing: "0.06em", textTransform: "uppercase" as const,
                  background: catColor + "15", color: catColor,
                  border: `1px solid ${catColor}30`,
                }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
          {/* Instructions */}
          {ex.instructions && (
            <div>
              <p style={{
                fontFamily: "var(--font-barlow-condensed, sans-serif)",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase" as const, color: T.textMuted, marginBottom: 8,
              }}>
                {t.exercises.instructions}
              </p>
              <p style={{
                fontFamily: "var(--font-dm-sans, sans-serif)",
                fontSize: 14, color: T.textSub, lineHeight: 1.65,
              }}>
                {ex.instructions}
              </p>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes fm-slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ExercisesPage() {
  const { lang } = useLang();
  const t = useT();
  const { open: openSettings } = useSettings();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [equipment, setEquipment] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Exercise | null>(null);

  const isCyr = hasCyrillic(search);
  const apiSearch = useMemo(() => {
    if (!search) return undefined;
    return lang === "ru" ? transliterate(search) : search;
  }, [search, lang]);

  const { data: equipmentList = [] } = useQuery({
    queryKey: ["equipment-list"],
    queryFn: getEquipmentList,
    staleTime: Infinity,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["exercises", apiSearch, category, equipment, page, lang],
    queryFn: () => getExercises({ search: apiSearch, category: category || undefined, equipment: equipment || undefined, page, limit: 20, lang }),
    placeholderData: (prev) => prev,
  });

  return (
    <div style={{ background: T.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <FmStyles />
      <AppHeader title={t.exercises.title} onAccountClick={openSettings} />

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: isCyr ? T.accentRaw : T.textMuted, pointerEvents: "none" }}>
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t.exercises.searchPlaceholder}
            style={{
              width: "100%", padding: "10px 40px 10px 38px",
              background: T.bgInput, border: `1.5px solid ${isCyr ? T.accent : T.border}`,
              borderRadius: 12, color: T.textPrimary,
              fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 14,
              outline: "none", transition: "border-color 0.15s",
            }}
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(1); }} style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: T.textMuted,
              display: "flex", alignItems: "center", padding: 2,
            }}>
              <CloseIcon s={14} />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          <button
            onClick={() => { setCategory(""); setPage(1); }}
            style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 100,
              border: `1.5px solid ${!category ? T.accent : T.border}`,
              background: !category ? T.accentDim : "transparent",
              color: !category ? T.accentRaw : T.textSub,
              fontFamily: "var(--font-barlow-condensed, sans-serif)",
              fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
              textTransform: "uppercase" as const, cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {t.exercises.all}
          </button>
          {CATEGORIES.map((c) => {
            const col = CAT_COLOR[c];
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => { setCategory(active ? "" : c); setPage(1); }}
                style={{
                  flexShrink: 0, padding: "6px 14px", borderRadius: 100,
                  border: `1.5px solid ${active ? col : T.border}`,
                  background: active ? col + "22" : "transparent",
                  color: active ? col : T.textSub,
                  fontFamily: "var(--font-barlow-condensed, sans-serif)",
                  fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
                  textTransform: "uppercase" as const, cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {CAT_LABEL[c]}
              </button>
            );
          })}
        </div>

        {/* Equipment filter */}
        {equipmentList.length > 0 && (
          <div style={{ position: "relative" }}>
            <select
              value={equipment}
              onChange={(e) => { setEquipment(e.target.value); setPage(1); }}
              style={{
                width: "100%", padding: "9px 32px 9px 12px",
                background: T.bgInput, border: `1.5px solid ${equipment ? T.accent : T.border}`,
                borderRadius: 10, color: equipment ? T.textPrimary : T.textSub,
                fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 13,
                outline: "none", cursor: "pointer", appearance: "none" as const,
                transition: "border-color 0.15s",
              }}
            >
              <option value="">{t.exercises.allEquipment}</option>
              {equipmentList.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: T.textMuted, pointerEvents: "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
            </span>
          </div>
        )}

        {/* Count + pagination */}
        {data && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: T.textMuted }}>
              {t.exercises.count(data.total)}
            </span>
            {data.pages > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FmBtn size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t.exercises.previous}</FmBtn>
                <span style={{ fontSize: 12, color: T.textSub, fontFamily: "var(--font-dm-sans, sans-serif)" }}>{t.exercises.page(page, data.pages)}</span>
                <FmBtn size="sm" variant="ghost" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>{t.exercises.next}</FmBtn>
              </div>
            )}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <FmPageLoader />
        ) : !data?.items.length ? (
          <div style={{ paddingTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Icon.Search s={32} c={T.textMuted} />
            <p style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 18, fontWeight: 800, textTransform: "uppercase" as const, color: T.textSub }}>{t.exercises.noResults}</p>
            <p style={{ fontSize: 13, color: T.textMuted, fontFamily: "var(--font-dm-sans, sans-serif)" }}>{t.exercises.noResultsBody}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
            {data.items.map((ex) => (
              <ExerciseCard key={ex.id} ex={ex} lang={lang} onClick={() => setSelected(ex)} />
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <ExerciseDetail ex={selected} lang={lang} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
