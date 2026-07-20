"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import clsx from "clsx";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { getMetrics, logMetric, type BodyMetric } from "@/features/metrics/metrics.api";
import { T, FmBtn, FmPageLoader, AppHeader, FmStyles } from "@/components/fm";
import { useT } from "@/lib/lang-context";
import { useSettings } from "@/lib/settings-context";
import s from "./page.module.css";

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className={s.statCard}>
      {sub && <span className={s.statSub}>{sub}</span>}
      <span className={s.statValue}>{value}</span>
      <span className={s.statLabel}>{label}</span>
    </div>
  );
}

// ─── Dark input ───────────────────────────────────────────────────────────────
function DarkInput({
  label, type = "text", value, onChange, placeholder, min, max, step,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  min?: number; max?: number; step?: number;
}) {
  return (
    <div className={s.inputWrap}>
      <label className={s.inputLabel}>{label}</label>
      <input
        className={s.input}
        type={type} value={value} placeholder={placeholder}
        min={min} max={max} step={step}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={s.tooltip}>
      <p className={s.tooltipLabel}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className={s.tooltipValue}>{p.value} {p.unit}</p>
      ))}
    </div>
  );
}

// ─── History row ──────────────────────────────────────────────────────────────
function HistoryRow({ m }: { m: BodyMetric }) {
  return (
    <div className={s.historyRow}>
      <span className={s.historyDate}>{format(new Date(m.date), "MMM d, yyyy")}</span>
      <span className={clsx(s.historyVal, m.weight != null && s.weight)}>
        {m.weight != null ? `${m.weight} kg` : "—"}
      </span>
      <span className={clsx(s.historyVal, m.bodyFat != null && s.bodyFat)}>
        {m.bodyFat != null ? `${m.bodyFat}%` : "—"}
      </span>
      <span className={clsx(s.historyVal, m.muscleMass != null && s.muscleMass)}>
        {m.muscleMass != null ? `${m.muscleMass} kg` : "—"}
      </span>
      <span className={s.historyNotes}>{m.notes ?? "—"}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MetricsPage() {
  const t = useT();
  const qc = useQueryClient();
  const { open: openSettings } = useSettings();
  const today = format(new Date(), "yyyy-MM-dd");

  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [notes, setNotes] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ["metrics"],
    queryFn: getMetrics,
  });

  const { mutate: log, isPending, isSuccess, reset } = useMutation({
    mutationFn: () =>
      logMetric({
        date,
        weight:     weight     ? Number(weight)     : undefined,
        bodyFat:    bodyFat    ? Number(bodyFat)    : undefined,
        muscleMass: muscleMass ? Number(muscleMass) : undefined,
        notes:      notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["metrics"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setWeight(""); setBodyFat(""); setMuscleMass(""); setNotes("");
      setFormOpen(false);
      setTimeout(reset, 2000);
    },
  });

  if (isLoading) return <FmPageLoader />;

  const chartData = [...metrics]
    .filter((m) => m.weight != null)
    .reverse()
    .slice(-30)
    .map((m) => ({
      date: format(new Date(m.date), "MMM d"),
      weight: m.weight,
    }));

  const latest = metrics.find((m) => m.weight != null);
  const avg = chartData.length
    ? (chartData.reduce((acc, d) => acc + (d.weight ?? 0), 0) / chartData.length).toFixed(1)
    : null;

  return (
    <div className={s.page}>
      <FmStyles />
      <AppHeader
        title={t.metrics.title}
        onAccountClick={openSettings}
        right={
          <FmBtn size="sm" onClick={() => setFormOpen((v) => !v)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t.metrics.logMeasurement}
          </FmBtn>
        }
      />

      <div className={s.content}>

        {/* Stat cards */}
        {latest ? (
          <div className={s.statCardsRow}>
            <StatCard value={latest.weight != null ? `${latest.weight}` : "—"} label={t.metrics.currentWeight} sub={t.metrics.weightCol} />
            <StatCard value={latest.bodyFat != null ? `${latest.bodyFat}%` : "—"} label={t.metrics.bodyFat} sub="BF%" />
            <StatCard value={latest.muscleMass != null ? `${latest.muscleMass}` : "—"} label={t.metrics.muscleMass} sub="kg" />
          </div>
        ) : (
          <div className={s.emptyCard}>
            <p className={s.emptyTitle}>{t.metrics.noWeightData}</p>
            <p className={s.emptyBody}>{t.metrics.noWeightDataBody}</p>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 1 && (
          <div className={s.chartCard}>
            <div className={s.chartHeader}>
              <span className={s.chartTitle}>{t.metrics.weightHistory}</span>
              {avg && (
                <span className={s.chartAvg}>
                  avg <span className={s.chartAvgValue}>{avg} kg</span>
                </span>
              )}
            </div>
            <div className={s.chartBody}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 8, right: 20, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: T.textMuted, fontSize: 10, fontFamily: "var(--font-barlow-condensed, sans-serif)", fontWeight: 700 }}
                    tickLine={false} axisLine={false} interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fill: T.textMuted, fontSize: 10, fontFamily: "var(--font-barlow-condensed, sans-serif)" }}
                    tickLine={false} axisLine={false} unit=" kg"
                  />
                  <Tooltip content={<ChartTooltip />} />
                  {avg && <ReferenceLine y={Number(avg)} stroke={T.accentMid} strokeDasharray="4 4" strokeWidth={1} />}
                  <Line
                    type="monotone" dataKey="weight" unit="kg"
                    stroke={T.accentRaw} strokeWidth={2}
                    dot={{ r: 3, fill: T.accentRaw, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: T.accentRaw, strokeWidth: 2, stroke: T.bg }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Log form */}
        {formOpen && (
          <div className={s.formCard}>
            <div className={s.formHeader}>
              <span className={s.formTitle}>{t.metrics.logMeasurement}</span>
            </div>
            <div className={s.formBody}>
              <div className={s.formGrid}>
                <DarkInput label={t.metrics.date} type="date" value={date} onChange={setDate} />
                <DarkInput label={t.metrics.weight} type="number" value={weight} onChange={setWeight} placeholder="e.g. 75.5" min={0} step={0.1} />
                <DarkInput label={t.metrics.bodyFatPct} type="number" value={bodyFat} onChange={setBodyFat} placeholder={t.metrics.optional} min={0} max={100} step={0.1} />
                <DarkInput label={t.metrics.muscleMassKg} type="number" value={muscleMass} onChange={setMuscleMass} placeholder={t.metrics.optional} min={0} step={0.1} />
                <DarkInput label={t.metrics.notes} value={notes} onChange={setNotes} placeholder={t.metrics.optional} />
              </div>
              <div className={s.formActions}>
                <FmBtn loading={isPending} disabled={!weight && !bodyFat} onClick={() => log()} className="flex-1">
                  {t.metrics.save}
                </FmBtn>
                <FmBtn variant="ghost" onClick={() => setFormOpen(false)}>✕</FmBtn>
                {isSuccess && <span className={s.savedMsg}>{t.metrics.saved}</span>}
              </div>
            </div>
          </div>
        )}

        {/* History table */}
        {metrics.length > 0 && (
          <div className={s.historyCard}>
            <div className={s.historyHead}>
              <span className={clsx(s.historyHeadCell, s.date)}>{t.metrics.date}</span>
              <span className={clsx(s.historyHeadCell, s.val)}>{t.metrics.weightCol}</span>
              <span className={clsx(s.historyHeadCell, s.val)}>{t.metrics.bodyFatCol}</span>
              <span className={clsx(s.historyHeadCell, s.val)}>{t.metrics.muscleMassCol}</span>
              <span className={clsx(s.historyHeadCell, s.notes)}>{t.metrics.notesCol}</span>
            </div>
            {metrics.map((m: BodyMetric) => (
              <HistoryRow key={m.id} m={m} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
