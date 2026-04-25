"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { getDashboardStats } from "@/features/dashboard/dashboard.api";
import { getMeApi } from "@/features/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Feedback";

const CATEGORY_VARIANT = {
  STRENGTH: "strength",
  CARDIO: "cardio",
  FLEXIBILITY: "flexibility",
  MOBILITY: "mobility",
} as const;

export default function DashboardPage() {
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: getMeApi });
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  if (isLoading) return <PageLoader />;

  const statCards = [
    { label: "Workouts this week", value: stats?.workoutsThisWeek ?? 0, icon: "🏋️", color: "text-indigo-600" },
    { label: "Total workouts",     value: stats?.totalWorkouts     ?? 0, icon: "📅", color: "text-blue-600"   },
    { label: "Total sets logged",  value: stats?.totalSets         ?? 0, icon: "📊", color: "text-purple-600" },
    {
      label: "Current weight",
      value: stats?.currentWeight ? `${stats.currentWeight} kg` : "—",
      icon: "⚖️",
      color: "text-emerald-600",
    },
    { label: "Streak", value: stats?.streak ? `${stats.streak} d` : "—", icon: "🔥", color: "text-orange-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hey{user?.name ? `, ${user.name}` : ""} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>
        <Link href="/workouts">
          <Button size="sm">+ New workout</Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Recent workouts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent workouts</h2>
            <Link href="/workouts" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!stats?.recentWorkouts.length ? (
            <div className="py-8 text-center text-sm text-gray-400">
              No workouts yet —{" "}
              <Link href="/workouts" className="text-indigo-500 hover:underline">
                start your first one
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.recentWorkouts.map((w) => {
                const uniqueExercises = [...new Map(w.sets.map((s) => [s.exercise.id, s.exercise])).values()];
                const totalSets = w.sets.length;
                const duration = w.finishedAt
                  ? Math.round((new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60_000)
                  : null;

                return (
                  <div key={w.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">
                          {format(new Date(w.startedAt), "MMM d")}
                        </span>
                        <Badge variant={w.finishedAt ? "done" : "active"}>
                          {w.finishedAt ? "Done" : "Active"}
                        </Badge>
                        {duration != null && (
                          <span className="text-xs text-gray-400">{duration} min</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {uniqueExercises.slice(0, 4).map((ex) => (
                          <Badge key={ex.id} variant={CATEGORY_VARIANT[ex.category as keyof typeof CATEGORY_VARIANT] ?? "default"}>
                            {ex.name}
                          </Badge>
                        ))}
                        {uniqueExercises.length > 4 && (
                          <Badge>+{uniqueExercises.length - 4} more</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0 text-right">
                      <div>{totalSets} sets</div>
                      <div>{formatDistanceToNow(new Date(w.startedAt), { addSuffix: true })}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/exercises", label: "Browse exercises", icon: "🔍" },
          { href: "/workouts",  label: "Start workout",   icon: "▶️" },
          { href: "/metrics",   label: "Log weight",      icon: "⚖️" },
          { href: "/workouts",  label: "Workout history", icon: "📋" },
        ].map((l) => (
          <Link key={l.href + l.label} href={l.href}>
            <Card className="p-4 hover:border-indigo-300 hover:shadow-sm transition cursor-pointer">
              <div className="text-2xl mb-1">{l.icon}</div>
              <div className="text-sm font-medium text-gray-700">{l.label}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
