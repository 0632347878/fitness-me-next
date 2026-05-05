"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { getDashboardStats } from "@/features/dashboard/dashboard.api";
import { getMeApi } from "@/features/auth";
import { T, CAT_COLOR, Icon, FmBadge, FmBtn, FmPageLoader } from "@/components/fm";
import { useT } from "@/lib/lang-context";
import { useSettings } from "@/lib/settings-context";

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ value, label, sub, accent, flex = 1 }: {
  value: string | number; label: string; sub?: string; accent?: string; flex?: number;
}) {
  return (
    <div style={{
      background: T.bgCard, borderRadius: 14, padding: "14px 16px",
      border: `1px solid ${T.border}`, flex, minWidth: 0,
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      {sub && (
        <span style={{ fontSize: 10, fontFamily: "var(--font-barlow-condensed, sans-serif)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textMuted }}>
          {sub}
        </span>
      )}
      <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 28, fontWeight: 900, letterSpacing: "-0.01em", color: accent ?? T.accent, lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: 11, color: T.textSub, lineHeight: 1.3 }}>{label}</span>
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
    <div style={{ background: T.bgCard, borderRadius: 14, padding: "16px 16px 12px", border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.textSub }}>
          {t.dashboard.thisWeek}
        </span>
        <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 13, fontWeight: 700, color: T.accent }}>
          {data.reduce((a, b) => a + b, 0)} {t.dashboard.sets}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
        {data.map((v, i) => {
          const isToday = i === todayIdx;
          const h = max > 0 ? Math.max((v / max) * 52, v > 0 ? 6 : 0) : 0;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{ width: "100%", height: 52, display: "flex", alignItems: "flex-end", borderRadius: 6, overflow: "hidden" }}>
                <div style={{
                  width: "100%", height: h || 0, borderRadius: 4,
                  background: isToday ? T.accent : v > 0 ? T.accentMid : T.bgInput,
                  transformOrigin: "bottom",
                  animation: v > 0 ? "fm-barGrow 0.4s ease both" : "none",
                  animationDelay: `${i * 0.06}s`,
                }} />
              </div>
              <span style={{ fontSize: 10, fontFamily: "var(--font-barlow-condensed, sans-serif)", fontWeight: 700, color: isToday ? T.accent : T.textMuted, letterSpacing: "0.04em" }}>
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
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${T.borderLight}` }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: catColor + "18", border: `1.5px solid ${catColor}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon.Dumbbell s={16} c={catColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 13, fontWeight: 600, color: T.textPrimary }}>
            {format(new Date(w.startedAt), "EEE, MMM d")}
          </span>
          {dur != null && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: T.textMuted }}>
              <Icon.Timer s={11} c={T.textMuted} />{dur}m
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {uniqueEx.slice(0, 3).map((ex) => (
            <FmBadge key={ex.id} cat={ex.category} label={ex.name.length > 14 ? ex.name.slice(0, 13) + "…" : ex.name} />
          ))}
          {uniqueEx.length > 3 && <span style={{ fontSize: 10, color: T.textMuted, alignSelf: "center" }}>+{uniqueEx.length - 3}</span>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
        <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 18, fontWeight: 800, color: T.textPrimary }}>{w.sets.length}</span>
        <span style={{ fontSize: 10, color: T.textMuted }}>sets</span>
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
    <div style={{ background: T.bg, minHeight: "100%", fontFamily: "var(--font-dm-sans, sans-serif)" }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 12, color: T.textSub, marginBottom: 2 }}>
              {format(new Date(), "EEEE, MMMM d")}
            </p>
            <h1 style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 34, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: T.textPrimary, lineHeight: 1 }}>
              {t.dashboard.greeting(user?.name?.split(" ")[0])}
            </h1>
          </div>
          {/* Avatar */}
          <button
            onClick={openSettings}
            style={{
              width: 44, height: 44, borderRadius: "50%",
              background: `linear-gradient(135deg, ${T.accent} 0%, oklch(0.62 0.22 50) 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 0 2px ${T.bg}, 0 0 0 4px ${T.accentMid}`,
              border: "none", cursor: "pointer", flexShrink: 0,
            }}
          >
            <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 17, fontWeight: 800, color: "#0d0d12" }}>
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "FM"}
            </span>
          </button>
        </div>

        {/* Streak banner */}
        {stats?.streak ? (
          <div style={{ marginTop: 14, padding: "10px 14px", background: T.accentDim, borderRadius: 12, border: `1px solid ${T.accentMid}`, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon.Flame s={18} c={T.accentRaw} />
            <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 14, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.dashboard.streak(stats.streak)}
            </span>
            <span style={{ fontSize: 12, color: T.textSub, marginLeft: "auto" }}>{t.dashboard.keepItUp}</span>
          </div>
        ) : null}
      </div>

      {/* Scrollable content */}
      <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Stat cards */}
        <div style={{ display: "flex", gap: 8 }}>
          <StatCard value={stats?.workoutsThisWeek ?? 0} label={t.dashboard.workoutsThisWeek} sub={t.dashboard.workoutsSub} />
          <StatCard value={stats?.streak ?? 0} label={t.dashboard.streakLabel} sub={t.dashboard.streakSub} accent={T.accentRaw} />
          <StatCard value={stats?.currentWeight ? `${stats.currentWeight}` : "—"} label={t.dashboard.weightLabel} sub={t.dashboard.weightSub} accent={T.mobility} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <StatCard value={stats?.totalWorkouts ?? 0} label={t.dashboard.totalWorkouts} sub={t.dashboard.allTime} accent={T.strength} flex={2} />
          <StatCard value={stats?.totalSets ?? 0} label={t.dashboard.totalSets} sub={t.dashboard.allTime} accent={T.flexibility} flex={2} />
        </div>

        {/* Weekly chart */}
        <WeeklyChart data={weeklyActivity} />

        {/* Recent workouts */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.textSub }}>
              {t.dashboard.recent}
            </span>
            <Link href="/workouts" style={{ color: T.accent, fontSize: 12, fontWeight: 500, textDecoration: "none" }}>
              {t.dashboard.seeAll}
            </Link>
          </div>

          {stats?.recentWorkouts?.length ? (
            <div style={{ background: T.bgCard, borderRadius: 14, padding: "0 14px", border: `1px solid ${T.border}` }}>
              {(stats.recentWorkouts as RecentWorkout[]).map((w) => (
                <WorkoutRow key={w.id} w={w} />
              ))}
            </div>
          ) : (
            <div style={{ background: T.bgCard, borderRadius: 14, padding: "24px 14px", border: `1px solid ${T.border}`, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: T.textSub }}>{t.dashboard.noWorkouts}</p>
            </div>
          )}
        </div>

        {/* Start workout CTA */}
        <Link href="/workouts" style={{ textDecoration: "none" }}>
          <FmBtn size="lg" style={{ width: "100%", borderRadius: 14 }}>
            <Icon.Plus s={18} c="#0d0d12" /> {t.dashboard.startWorkout}
          </FmBtn>
        </Link>
      </div>
    </div>
  );
}
