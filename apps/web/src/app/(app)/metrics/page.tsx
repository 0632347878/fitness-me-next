"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { getMetrics, logMetric, type BodyMetric } from "@/features/metrics/metrics.api";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageLoader, EmptyState } from "@/components/ui/Feedback";

export default function MetricsPage() {
  const qc = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [notes, setNotes] = useState("");

  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ["metrics"],
    queryFn: getMetrics,
  });

  const { mutate: log, isPending, isSuccess, reset } = useMutation({
    mutationFn: () =>
      logMetric({
        date,
        weight: weight ? Number(weight) : undefined,
        bodyFat: bodyFat ? Number(bodyFat) : undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["metrics"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setWeight(""); setBodyFat(""); setNotes("");
      setTimeout(reset, 2000);
    },
  });

  if (isLoading) return <PageLoader />;

  // Chart data — ascending order, only entries with weight
  const chartData = [...metrics]
    .filter((m) => m.weight != null)
    .reverse()
    .slice(-30)
    .map((m) => ({
      date: format(new Date(m.date), "MMM d"),
      weight: m.weight,
    }));

  const latest = metrics.find((m) => m.weight != null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Body metrics</h1>

      {/* Summary */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Current weight", value: `${latest.weight} kg`, icon: "⚖️" },
            { label: "Body fat",  value: latest.bodyFat  ? `${latest.bodyFat}%`  : "—", icon: "📊" },
            { label: "Muscle mass", value: latest.muscleMass ? `${latest.muscleMass} kg` : "—", icon: "💪" },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold text-indigo-600">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Weight chart */}
      {chartData.length > 1 ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Weight history (last 30 entries)</h2>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  unit=" kg"
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e5e7eb" }}
                  formatter={(v) => [`${v} kg`, "Weight"]}
                />
                <Line
                  type="monotone" dataKey="weight"
                  stroke="#6366f1" strokeWidth={2}
                  dot={{ r: 3, fill: "#6366f1" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : chartData.length === 0 && (
        <EmptyState title="No weight data yet" body="Log your first measurement below." />
      )}

      {/* Log form */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Log measurement</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
              <input
                type="number" min={0} step={0.1} placeholder="e.g. 75.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Body fat (%)</label>
              <input
                type="number" min={0} max={100} step={0.1} placeholder="optional"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <input
                type="text" placeholder="optional"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button loading={isPending} disabled={!weight && !bodyFat} onClick={() => log()}>
              Save measurement
            </Button>
            {isSuccess && <span className="text-sm text-emerald-600">✓ Saved!</span>}
          </div>
        </CardContent>
      </Card>

      {/* History table */}
      {metrics.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">History</h2>
          </CardHeader>
          <CardContent className="pt-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Weight</th>
                  <th className="pb-2 font-medium">Body fat</th>
                  <th className="pb-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {metrics.map((m: BodyMetric) => (
                  <tr key={m.id} className="text-gray-700">
                    <td className="py-2 pr-4">{format(new Date(m.date), "MMM d, yyyy")}</td>
                    <td className="py-2 pr-4">{m.weight != null ? `${m.weight} kg` : "—"}</td>
                    <td className="py-2 pr-4">{m.bodyFat != null ? `${m.bodyFat}%` : "—"}</td>
                    <td className="py-2 text-gray-400">{m.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

