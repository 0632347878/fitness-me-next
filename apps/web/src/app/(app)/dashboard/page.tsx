"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import clsx from "clsx";
import { format } from "date-fns";
import type { CSSProperties } from "react";
import { getDashboardStats } from "@/features/dashboard/dashboard.api";
import { getMeApi } from "@/features/auth";
import { T, CAT_COLOR, Icon, FmBadge, FmBtn, FmPageLoader } from "@/components/fm";
import { useT } from "@/lib/lang-context";
import { useSettings } from "@/lib/settings-context";
import { TodayWorkoutPage } from "@/features/plans";
import s from "./page.module.css";

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ value, label, sub, accent, flex = 1 }: {
  value: string | number; label: string; sub?: string; accent?: string; flex?: number;
}) {
  return (
    <div className={s.statCard} style={{ "--stat-accent": accent, "--stat-flex": flex } as CSSProperties}>
      {sub && <span className={s.statSub}>{sub}</span>}
      <span className={s.statValue}>{value}</span>
      <span className={s.statLabel}>{label}</span>
    </div>
  );
}

// ─── Weekly Bar Chart ──────────────────────────────────────────────────────────
function WeeklyChart({ data }: { data: number[] }) {
  const t = useT();
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const max = Math.max(...data, 1);
  const todayRaw = new Date().getDay();
  const todayIdx = todayRaw === 0 ? 6 : todayRaw - 1;

  return (
    <div className={s.chart}>
      <div className={s.chartTop}>
        <span className={s.chartTitle}>
          {t.dashboard.thisWeek}
        </span>
        <span className={s.chartTotal}>
          {data.reduce((a, b) => a + b, 0)} {t.dashboard.sets}
        </span>
      </div>
      <div className={s.chartBars}>
        {data.map((v, i) => {
          const isToday = i === todayIdx;
          const h = max > 0 ? Math.max((v / max) * 52, v > 0 ? 6 : 0) : 0;
          return (
            <div key={i} className={s.chartBarCol}>
              <div className={s.chartBarTrack}>
                <div
                  className={clsx(s.chartBar, isToday ? s.today : v > 0 && s.filled, v > 0 && s.grow)}
                  style={{ height: h || 0, animationDelay: `${i * 0.06}s` }}
                />
              </div>
              <span className={clsx(s.chartBarDay, isToday && s.chartBarDayToday)}>
                {days[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Workout Row ───────────────────────────────────────────────────────────────
type RecentWorkout = {
  id: string;
  startedAt: string;
  finishedAt?: string | null;
  sets: { id: string; setNumber: number; reps?: number | null; weight?: number | null; exercise: { id: string; name: string; category: string } }[];
};

function WorkoutRow({ w }: { w: RecentWorkout }) {
  const uniqueEx = [...new Map(w.sets.map((s) => [s.exercise.id, s.exercise])).values()];
  const dur = w.finishedAt
    ? Math.round((new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60_000)
    : null;
  const cats = [...new Set(uniqueEx.map((e) => e.category))];
  const catColor = CAT_COLOR[cats[0]] ?? T.accent;

  return (
    <div className={s.workoutRow}>
      <div className={s.workoutIcon} style={{ "--cat-color": catColor } as CSSProperties}>
        <Icon.Dumbbell s={16} c="currentColor" />
      </div>
      <div className={s.workoutMeta}>
        <div className={s.workoutDateRow}>
          <span className={s.workoutDate}>
            {format(new Date(w.startedAt), "EEE, MMM d")}
          </span>
          {dur != null && (
            <span className={s.workoutDur}>
              <Icon.Timer s={11} c={T.textMuted} />{dur}m
            </span>
          )}
        </div>
        <div className={s.workoutBadges}>
          {uniqueEx.slice(0, 3).map((ex) => (
            <FmBadge key={ex.id} cat={ex.category} label={ex.name.length > 14 ? ex.name.slice(0, 13) + "…" : ex.name} />
          ))}
          {uniqueEx.length > 3 && <span className={s.workoutMore}>+{uniqueEx.length - 3}</span>}
        </div>
      </div>
      <div className={s.workoutSets}>
        <span className={s.workoutSetsCount}>{w.sets.length}</span>
        <span className={s.workoutSetsSub}>sets</span>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const t = useT();
  const { open: openSettings } = useSettings();
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: getMeApi });
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  if (isLoading) return <FmPageLoader />;

  const weeklyActivity: number[] = (stats as any)?.weeklyActivity ?? [0, 0, 0, 0, 0, 0, 0];

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerRow}>
          <div>
            <p className={s.headerDate}>
              {format(new Date(), "EEEE, MMMM d")}
            </p>
            <h1 className={s.headerTitle}>
              {t.dashboard.greeting(user?.name?.split(" ")[0])}
            </h1>
          </div>
          {/* Avatar */}
          <button onClick={openSettings} className={s.avatar}>
            <span className={s.avatarLabel}>
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "FM"}
            </span>
          </button>
        </div>

        {/* Streak banner */}
        {stats?.streak ? (
          <div className={s.streak}>
            <Icon.Flame s={18} c={T.accentRaw} />
            <span className={s.streakLabel}>
              {t.dashboard.streak(stats.streak)}
            </span>
            <span className={s.streakSub}>{t.dashboard.keepItUp}</span>
          </div>
        ) : null}
      </div>

      {/* Scrollable content */}
      <div className={s.content}>

        {/* Stat cards */}
        <div className={s.statRow}>
          <StatCard value={stats?.workoutsThisWeek ?? 0} label={t.dashboard.workoutsThisWeek} sub={t.dashboard.workoutsSub} />
          <StatCard value={stats?.streak ?? 0} label={t.dashboard.streakLabel} sub={t.dashboard.streakSub} accent={T.accentRaw} />
          <StatCard value={stats?.currentWeight ? `${stats.currentWeight}` : "—"} label={t.dashboard.weightLabel} sub={t.dashboard.weightSub} accent={T.mobility} />
        </div>
        <div className={s.statRow}>
          <StatCard value={stats?.totalWorkouts ?? 0} label={t.dashboard.totalWorkouts} sub={t.dashboard.allTime} accent={T.strength} flex={2} />
          <StatCard value={stats?.totalSets ?? 0} label={t.dashboard.totalSets} sub={t.dashboard.allTime} accent={T.flexibility} flex={2} />
        </div>

        {/* Weekly chart */}
        <WeeklyChart data={weeklyActivity} />

        {/* Today's workout plan */}
        <div className={s.planCard}>
          <div className={s.planCardHead}>
            <span className={s.recentLabel}>
              Today&apos;s plan
            </span>
          </div>
          <TodayWorkoutPage compact />
        </div>

        {/* Recent workouts */}
        <div>
          <div className={s.recentHeader}>
            <span className={s.recentLabel}>
              {t.dashboard.recent}
            </span>
            <Link href="/workouts" className={s.recentLink}>
              {t.dashboard.seeAll}
            </Link>
          </div>

          {stats?.recentWorkouts?.length ? (
            <div className={s.recentList}>
              {(stats.recentWorkouts as RecentWorkout[]).map((w) => (
                <WorkoutRow key={w.id} w={w} />
              ))}
            </div>
          ) : (
            <div className={s.recentEmpty}>
              <p className={s.recentEmptyText}>{t.dashboard.noWorkouts}</p>
            </div>
          )}
        </div>

        {/* Start workout CTA */}
        <Link href="/workouts" className={s.cta}>
          <FmBtn size="lg" className="w-full rounded-[14px]">
            <Icon.Plus s={18} c="#0d0d12" /> {t.dashboard.startWorkout}
          </FmBtn>
        </Link>
      </div>
    </div>
  );
}
