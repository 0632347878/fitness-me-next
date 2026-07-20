"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getExercises, getEquipmentList, type Exercise } from "@/features/exercises/exercises.api";
import { T, CAT_COLOR, CAT_LABEL, FmBadge, FmBtn, FmPageLoader, AppHeader, Icon, FmStyles } from "@/components/fm";
import { useLang, useT } from "@/lib/lang-context";
import { useSettings } from "@/lib/settings-context";
import { transliterate, hasCyrillic } from "@/lib/transliterate";
import s from "./page.module.css";
import ExerciseCard from "@/components/ui/ExerciseCard";
import gifUrl  from "@/utils";

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
function CloseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function ExerciseDetail({ ex, lang, onClose }: { ex: Exercise; lang: string; onClose: () => void }) {
  const displayName = lang === "ru" ? (ex.nameRu ?? ex.name) : ex.name;
  const t = useT();
  const catColor = CAT_COLOR[ex.category] ?? T.textSub;
  return (
    <>
      <div className={s.backdrop} onClick={onClose} />
      <div className={s.panel}>
        <div className={s.panelHandle}>
          <div className={s.panelHandleBar} />
        </div>
        <div className={s.panelHeader}>
          <div className={s.panelHeaderInfo}>
            <p className={s.panelTitle}>{displayName}</p>
            <div className={s.panelBadges}>
              <FmBadge cat={ex.category} />
              {ex.equipment && (
                <span className={s.panelEquipBadge}>🏋️ {ex.equipment}</span>
              )}
            </div>
          </div>
          <button className={s.panelClose} onClick={onClose}>
            <CloseIcon size={16} />
          </button>
        </div>
        <div className={s.panelBody}>
          {/* Muscles */}
          <div>
            <div className="delimiter">
              <p className={s.sectionLabel}>{t.exercises.muscleGroups}</p>
              <div className={s.musclesList}>
                {ex.muscleGroups.map((m) => (
                    <span
                        key={m}
                        className={s.muscleTag}
                        style={{ "--cat-color": catColor } as React.CSSProperties}
                    >
                  {m}
                </span>
                ))}
              </div>
            </div>
            <div className="delimiter">
              <p className={s.sectionLabel}>{t.exercises.difficulty}</p>
              <span style={{ "--cat-color": catColor } as React.CSSProperties} className={s.muscleTag}>{ex.difficulty}</span>
            </div>
          </div>
          {/* Instructions */}
          {ex.instructions && (
            <div>
              <p className={s.sectionLabel}>{t.exercises.instructions}</p>
              <p className={s.instructions}>{ex.instructions}</p>
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
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className={s.page}>
      <FmStyles />
      <AppHeader title={t.exercises.title} onAccountClick={openSettings} />

      <div className={s.content}>

        {/* Search */}
        <div className={s.searchWrap}>
          <span className={`${s.searchIcon} ${isCyr ? s.searchIconCyr : ""}`}>
            <SearchIcon />
          </span>
          <input
            className={`${s.searchInput} ${isCyr ? s.searchInputCyr : ""}`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t.exercises.searchPlaceholder}
          />
          {search && (
            <button className={s.searchClear} onClick={() => { setSearch(""); setPage(1); }}>
              <CloseIcon size={14} />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className={s.pills}>
          <button
            className={`${s.pill} ${!category ? s.pillActive : ""}`}
            onClick={() => { setCategory(""); setPage(1); }}
          >
            {t.exercises.all}
          </button>
          {CATEGORIES.map((c) => {
            const col = CAT_COLOR[c];
            const active = category === c;
            return (
              <button
                key={c}
                className={s.pill}
                onClick={() => { setCategory(active ? "" : c); setPage(1); }}
                style={active ? { borderColor: col, background: col + "22", color: col } : undefined}
              >
                {CAT_LABEL[c]}
              </button>
            );
          })}
        </div>

        {/* Equipment filter */}
        {equipmentList.length > 0 && (
          <div className={s.selectWrap}>
            <select
              className={`${s.select} ${equipment ? s.selectActive : ""}`}
              value={equipment}
              onChange={(e) => { setEquipment(e.target.value); setPage(1); }}
            >
              <option value="">{t.exercises.allEquipment}</option>
              {equipmentList.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
            </select>
            <span className={s.selectChevron}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
        )}

        {/* Count + pagination */}
        {data && (
          <div className={s.meta}>
            <span className={s.count}>{t.exercises.count(data.total)}</span>
            {data.pages > 1 && (
              <div className={s.pagination}>
                <FmBtn size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t.exercises.previous}</FmBtn>
                <span className={s.pageLabel}>{t.exercises.page(page, data.pages)}</span>
                <FmBtn size="sm" variant="ghost" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>{t.exercises.next}</FmBtn>
              </div>
            )}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <FmPageLoader />
        ) : !data?.items.length ? (
          <div className={s.empty}>
            <Icon.Search s={32} c={T.textMuted} />
            <p className={s.emptyTitle}>{t.exercises.noResults}</p>
            <p className={s.emptyBody}>{t.exercises.noResultsBody}</p>
          </div>
        ) : (
          <div className={s.grid}>
            {data.items.map((ex) => (
              <ExerciseCard key={ex.id} ex={ex} lang={lang} onClick={() => setSelected(ex)} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ExerciseDetail ex={selected} lang={lang} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
