import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication – FitMe",
};

// ── Left brand panel ──────────────────────────────────────────────────────────
function BrandPanel() {
  return (
    <div
      className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{ background: "var(--fm-bg-card)", borderRight: "1px solid var(--fm-border)" }}
    >
      {/* dot-grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, var(--fm-text-sub) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Logo */}
      <div className="relative flex items-center gap-3">
        <span
          className="flex items-center justify-center w-10 h-10 rounded-xl text-xl font-black select-none"
          style={{ background: "var(--fm-accent)", color: "#0d0d12" }}
        >
          ⚡
        </span>
        <span
          className="text-2xl font-black uppercase tracking-widest"
          style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", color: "var(--fm-text-primary)" }}
        >
          FITME
        </span>
      </div>

      {/* Center tagline */}
      <div className="relative space-y-4">
        <h2
          className="text-5xl font-black uppercase leading-tight"
          style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", color: "var(--fm-text-primary)" }}
        >
          TRACK.<br />LIFT.<br />PROGRESS.
        </h2>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: "var(--fm-text-sub)" }}>
          Your personal fitness companion. Log workouts, track body metrics, and crush your goals.
        </p>
      </div>

      {/* Bottom social proof */}
      <div className="relative">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium"
          style={{ background: "var(--fm-bg-input)", border: "1px solid var(--fm-border)", color: "var(--fm-text-sub)" }}
        >
          <span style={{ color: "var(--fm-accent)" }}>●</span>
          Join athletes already tracking their progress
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2" style={{ background: "var(--fm-bg)" }}>
      <BrandPanel />
      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
