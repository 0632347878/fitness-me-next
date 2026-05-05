"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { getMetrics, logMetric, type BodyMetric } from "@/features/metrics/metrics.api";
import { T, FmBtn, FmPageLoader, AppHeader, FmStyles } from "@/components/fm";
import { useT } from "@/lib/lang-context";
import { useSettings } from "@/lib/settings-context";

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{
      flex: 1, background: T.bgCard, borderRadius: 14, padding: "14px 16px",
      border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 4, minWidth: 0,
    }}>
      {sub && (
        <span style={{ fontSize: 10, fontFamily: "var(--font-barlow-condensed, sans-serif)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: T.textMuted }}>
          {sub}
        </span>
      )}
      <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 26, fontWeight: 900, letterSpacing: "-0.01em", color: accent ?? T.accent, lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: 11, color: T.textSub, lineHeight: 1.3 }}>{label}</span>
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
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontFamily: "var(--font-barlow-condensed, sans-serif)",
        fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase" as const, color: T.textMuted,
      }}>
        {label}
      </label>
      <input
        type={type} value={value} placeholder={placeholder}
        min={min} max={max} step={step}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "10px 12px", borderRadius: 10,
          background: T.bgInput, border: `1.5px solid ${focused ? T.accent : T.border}`,
          color: T.textPrimary, fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 14,
          outline: "none", transition: "border-color 0.15s", width: "100%",
        }}
      />
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.bgCard, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: "8px 12px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    }}>
      <p style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: T.textMuted, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 18, fontWeight: 900, color: T.accentRaw }}>
          {p.value} {p.unit}
        </p>
      ))}
    </div>
  );
}

// ─── History row ──────────────────────────────────────────────────────────────
function HistoryRow({ m, isLast }: { m: BodyMetric; isLast: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "11px 16px",
      borderBottom: isLast ? "none" : `1px solid ${T.borderLight}`,
    }}>
      <span style={{ flex: 1.2, fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 13, color: T.textSub }}>
        {format(new Date(m.date), "MMM d, yyyy")}
      </span>
      <span style={{ flex: 1, fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 16, fontWeight: 800, color: m.weight != null ? T.accent : T.textMuted }}>
        {m.weight != null ? `${m.weight} kg` : "—"}
      </span>
      <span style={{ flex: 1, fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 16, fontWeight: 800, color: m.bodyFat != null ? T.mobility : T.textMuted }}>
        {m.bodyFat != null ? `${m.bodyFat}%` : "—"}
      </span>
      <span style={{ flex: 1, fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 16, fontWeight: 800, color: m.muscleMass != null ? T.flexibility : T.textMuted }}>
        {m.muscleMass != null ? `${m.muscleMass} kg` : "—"}
      </span>
      <span style={{ flex: 1.2, fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 12, color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
        {m.notes ?? "—"}
      </span>
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
  const avg = chartData.length ? (chartData.reduce((s, d) => s + (d.weight ?? 0), 0) / chartData.length).toFixed(1) : null;

  return (
    <div style={{ background: T.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <FmStyles />
      <AppHeader
        title={t.metrics.title}
        onAccountClick={openSettings}
        right={
          <FmBtn size="sm" onClick={() => setFormOpen((v) => !v)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {t.metrics.logMeasurement}
          </FmBtn>
        }
      />

      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Stat cards */}
        {latest ? (
          <div style={{ display: "flex", gap: 8 }}>
            <StatCard
              value={latest.weight != null ? `${latest.weight}` : "—"}
              label={t.metrics.currentWeight}
              sub={t.metrics.weightCol}
              accent={T.accentRaw}
            />
            <StatCard
              value={latest.bodyFat != null ? `${latest.bodyFat}%` : "—"}
              label={t.metrics.bodyFat}
              sub="BF%"
              accent={T.mobility}
            />
            <StatCard
              value={latest.muscleMass != null ? `${latest.muscleMass}` : "—"}
              label={t.metrics.muscleMass}
              sub="kg"
              accent={T.flexibility}
            />
          </div>
        ) : (
          <div style={{
            background: T.bgCard, borderRadius: 14, padding: "20px 20px",
            border: `1px solid ${T.border}`, textAlign: "center",
          }}>
            <p style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 16, fontWeight: 800, textTransform: "uppercase" as const, color: T.textSub, marginBottom: 4 }}>
              {t.metrics.noWeightData}
            </p>
            <p style={{ fontSize: 13, color: T.textMuted, fontFamily: "var(--font-dm-sans, sans-serif)" }}>
              {t.metrics.noWeightDataBody}
            </p>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 1 && (
          <div style={{ background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: T.textMuted }}>
                {t.metrics.weightHistory}
              </span>
              {avg && (
                <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 13, fontWeight: 700, color: T.textSub }}>
                  avg <span style={{ color: T.accentRaw }}>{avg} kg</span>
                </span>
              )}
            </div>
            <div style={{ padding: "10px 0 6px" }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 8, right: 20, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: T.textMuted, fontSize: 10, fontFamily: "var(--font-barlow-condensed, sans-serif)", fontWeight: 700 }}
                    tickLine={false} axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fill: T.textMuted, fontSize: 10, fontFamily: "var(--font-barlow-condensed, sans-serif)" }}
                    tickLine={false} axisLine={false} unit=" kg"
                  />
                  <Tooltip content={<ChartTooltip />} />
                  {avg && (
                    <ReferenceLine y={Number(avg)} stroke={T.accentMid} strokeDasharray="4 4" strokeWidth={1} />
                  )}
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

        {/* Log form (collapsible) */}
        {formOpen && (
          <div style={{
            background: T.bgCard, borderRadius: 16,
            border: `1px solid ${T.border}`,
            overflow: "hidden",
            animation: "fm-fadeUp 0.2s ease",
          }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 15, fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: T.textPrimary }}>
                {t.metrics.logMeasurement}
              </span>
            </div>
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <DarkInput label={t.metrics.date} type="date" value={date} onChange={setDate} />
                <DarkInput label={t.metrics.weight} type="number" value={weight} onChange={setWeight} placeholder="e.g. 75.5" min={0} step={0.1} />
                <DarkInput label={t.metrics.bodyFatPct} type="number" value={bodyFat} onChange={setBodyFat} placeholder={t.metrics.optional} min={0} max={100} step={0.1} />
                <DarkInput label={t.metrics.muscleMassKg} type="number" value={muscleMass} onChange={setMuscleMass} placeholder={t.metrics.optional} min={0} step={0.1} />
                <DarkInput label={t.metrics.notes} value={notes} onChange={setNotes} placeholder={t.metrics.optional} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <FmBtn
                  loading={isPending}
                  disabled={!weight && !bodyFat}
                  onClick={() => log()}
                  style={{ flex: 1 }}
                >
                  {t.metrics.save}
                </FmBtn>
                <FmBtn variant="ghost" onClick={() => setFormOpen(false)}>
                  ✕
                </FmBtn>
                {isSuccess && (
                  <span style={{ fontSize: 13, color: T.success, fontFamily: "var(--font-dm-sans, sans-serif)", fontWeight: 600 }}>
                    {t.metrics.saved}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* History table */}
        {metrics.length > 0 && (
          <div style={{ background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
            {/* thead */}
            <div style={{
              display: "flex", padding: "10px 16px",
              borderBottom: `1px solid ${T.border}`,
            }}>
              {[
                { label: t.metrics.date, flex: 1.2 },
                { label: t.metrics.weightCol, flex: 1 },
                { label: t.metrics.bodyFatCol, flex: 1 },
                { label: t.metrics.muscleMassCol, flex: 1 },
                { label: t.metrics.notesCol, flex: 1.5 },
              ].map((col) => (
                <span key={col.label} style={{
                  flex: col.flex, fontFamily: "var(--font-barlow-condensed, sans-serif)",
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase" as const, color: T.textMuted,
                }}>
                  {col.label}
                </span>
              ))}
            </div>
            {metrics.map((m: BodyMetric, i) => (
              <HistoryRow key={m.id} m={m} isLast={i === metrics.length - 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
