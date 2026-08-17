"use client";

import { Suspense, useEffect, useId, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type Exercise } from "@/features/exercises/exercises.api";
import { useExercise, useExercises, useExerciseFilterOptions } from "@/features/exercises/exercises.hooks";
import { T, CAT_COLOR, CAT_LABEL, FmBadge, FmBtn, FmPageLoader, AppHeader, Icon, FmStyles } from "@/components/fm";
import { useLang, useT } from "@/lib/lang-context";
import { useSettings } from "@/lib/settings-context";
import { transliterate, hasCyrillic } from "@/lib/transliterate";
import s from "./page.module.css";
import ExerciseCard from "@/components/ui/ExerciseCard";
import ExerciseGif from "@/components/ui/ExerciseGif";
import ExerciseLottie from "@/components/ui/ExerciseLottie";
import { hasLocalGif, localLottieUrl } from "@/utils";

const CATEGORIES = ["STRENGTH", "CARDIO", "FLEXIBILITY", "MOBILITY"] as const;

function humanizeFilterValue(value: string, labels: Record<string, string>): string {
  const normalized = value.toLowerCase();
  return labels[normalized] ?? normalized.replace(/[_-]+/g, " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

type FilterOption = {
  value: string;
  label: string;
  activeColor?: string;
};

function FilterPillGroup({
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  label: string;
  allLabel: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className={s.filterGroup}>
      <legend className={s.filterLabel}>{label}</legend>
      <div className={s.pills}>
        <button
          type="button"
          aria-pressed={!value}
          className={`${s.pill} ${!value ? s.pillActive : ""}`}
          onClick={() => onChange("")}
        >
          {allLabel}
        </button>
        {options.map((option) => {
          const active = value === option.value;
          const usesCategoryColor = active && !!option.activeColor;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              className={`${s.pill} ${active && !option.activeColor ? s.pillActive : ""} ${usesCategoryColor ? s.pillCategoryActive : ""}`}
              onClick={() => onChange(active ? "" : option.value)}
              style={usesCategoryColor
                ? { "--pill-active-color": option.activeColor } as React.CSSProperties
                : undefined}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function FilterSelect({
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  label: string;
  allLabel: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className={s.selectFilter}>
      <span className={s.filterLabel}>{label}</span>
      <span className={s.selectWrap}>
        <select
          className={`${s.select} ${value ? s.selectActive : ""}`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{allLabel}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={s.selectChevron} aria-hidden="true">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </span>
    </label>
  );
}

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
  const titleId = useId();
  const demonstrationTitleId = useId();
  const displayName = lang === "ru" ? (ex.nameRu ?? ex.name) : ex.name;
  const t = useT();
  const catColor = CAT_COLOR[ex.category] ?? T.textSub;
  const lottieSource = localLottieUrl(ex.name);
  const hasExerciseAnimation = !!lottieSource || !!ex.gifUrl || hasLocalGif(ex.name);
  return (
    <>
      <div className={s.backdrop} onClick={onClose} aria-hidden="true" />
      <div className={s.panel} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={s.panelHandle}>
          <div className={s.panelHandleBar} />
        </div>
        <div className={s.panelHeader}>
          <div className={s.panelHeaderInfo}>
            <p id={titleId} className={s.panelTitle}>{displayName}</p>
            <div className={s.panelBadges}>
              <FmBadge cat={ex.category} />
              {ex.equipment && (
                <span className={s.panelEquipBadge}>🏋️ {ex.equipment}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className={s.panelClose}
            onClick={onClose}
            aria-label={lang === "ru" ? "Закрыть описание упражнения" : "Close exercise details"}
          >
            <CloseIcon size={16} />
          </button>
        </div>
        <div className={s.panelBody}>
          {hasExerciseAnimation && (
            <section className={s.panelAnimation} aria-labelledby={demonstrationTitleId}>
              <p id={demonstrationTitleId} className={s.sectionLabel}>
                {t.exercises.demonstration}
              </p>
              <div className={s.panelAnimationMedia}>
                {lottieSource ? (
                  <ExerciseLottie
                    className={s.panelAnimationPlayer}
                    src={lottieSource}
                    label={`${displayName}: ${t.exercises.demonstration}`}
                  />
                ) : (
                  <ExerciseGif
                    className={s.panelAnimationPlayer}
                    src={ex.gifUrl}
                    alt={`${displayName}: ${t.exercises.demonstration}`}
                    name={ex.name}
                    objectFit="contain"
                  />
                )}
              </div>
            </section>
          )}
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
function ExercisesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkedExerciseId = searchParams.get("exerciseId") ?? "";
  const { lang } = useLang();
  const t = useT();
  const { open: openSettings } = useSettings();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [equipment, setEquipment] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [muscleGroup, setMuscleGroup] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Exercise | null>(null);

  const { data: linkedExercise } = useExercise(linkedExerciseId);

  useEffect(() => {
    if (!linkedExerciseId) {
      setSelected(null);
      return;
    }

    if (linkedExercise?.id === linkedExerciseId) {
      setSelected(linkedExercise);
    }
  }, [linkedExerciseId, linkedExercise]);

  const openExercise = (exercise: Exercise) => {
    setSelected(exercise);
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set("exerciseId", exercise.id);
    router.replace(`/exercises?${nextSearchParams.toString()}`, { scroll: false });
  };

  const closeExercise = () => {
    setSelected(null);
    if (!linkedExerciseId) return;

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("exerciseId");
    const queryString = nextSearchParams.toString();
    router.replace(queryString ? `/exercises?${queryString}` : "/exercises", {
      scroll: false,
    });
  };

  const isCyr = hasCyrillic(search);
  const apiSearch = useMemo(() => {
    if (!search) return undefined;
    return lang === "ru" ? transliterate(search) : search;
  }, [search, lang]);

  const { data: filterOptions } = useExerciseFilterOptions();

  const { data, isLoading } = useExercises({
    search: apiSearch,
    category: category || undefined,
    equipment: equipment || undefined,
    difficulty: difficulty || undefined,
    muscleGroup: muscleGroup || undefined,
    page,
    limit: 20,
    lang,
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

        {/* Exercise filters */}
        <div className={s.filterGroups}>
          <FilterPillGroup
            label={t.exercises.category}
            allLabel={t.exercises.all}
            value={category}
            options={CATEGORIES.map((categoryValue) => ({
              value: categoryValue,
              label: CAT_LABEL[categoryValue],
              activeColor: CAT_COLOR[categoryValue],
            }))}
            onChange={(nextCategory) => {
              setCategory(nextCategory);
              setPage(1);
            }}
          />

          {!!filterOptions?.difficulties.length && (
            <FilterPillGroup
              label={t.exercises.difficulty}
              allLabel={t.exercises.all}
              value={difficulty}
              options={filterOptions.difficulties.map((difficultyValue) => ({
                value: difficultyValue,
                label: humanizeFilterValue(difficultyValue, t.exercises.difficultyLabels),
              }))}
              onChange={(nextDifficulty) => {
                setDifficulty(nextDifficulty);
                setPage(1);
              }}
            />
          )}

          {(!!filterOptions?.equipment.length || !!filterOptions?.muscleGroups.length) && (
            <div className={s.selectFilters}>
              {!!filterOptions?.equipment.length && (
                <FilterSelect
                  label={t.exercises.equipment}
                  allLabel={t.exercises.allEquipment}
                  value={equipment}
                  options={filterOptions.equipment.map((equipmentValue) => ({
                    value: equipmentValue,
                    label: humanizeFilterValue(equipmentValue, {}),
                  }))}
                  onChange={(nextEquipment) => {
                    setEquipment(nextEquipment);
                    setPage(1);
                  }}
                />
              )}

              {!!filterOptions?.muscleGroups.length && (
                <FilterSelect
                  label={t.exercises.muscleGroups}
                  allLabel={t.exercises.allMuscleGroups}
                  value={muscleGroup}
                  options={filterOptions.muscleGroups.map((muscleGroupValue) => ({
                    value: muscleGroupValue,
                    label: humanizeFilterValue(muscleGroupValue, t.exercises.muscleGroupLabels),
                  }))}
                  onChange={(nextMuscleGroup) => {
                    setMuscleGroup(nextMuscleGroup);
                    setPage(1);
                  }}
                />
              )}
            </div>
          )}
        </div>

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
              <ExerciseCard key={ex.id} ex={ex} lang={lang} onClick={() => openExercise(ex)} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ExerciseDetail ex={selected} lang={lang} onClose={closeExercise} />
      )}
    </div>
  );
}

export default function ExercisesPage() {
  return (
    <Suspense fallback={<FmPageLoader />}>
      <ExercisesPageContent />
    </Suspense>
  );
}
