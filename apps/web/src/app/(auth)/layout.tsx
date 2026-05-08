import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication – FitMe",
};

const T = {
  accent: "oklch(0.72 0.18 35)",
  bgCard: "#16161f",
  border: "#2a2a38",
  textPrimary: "#f0ede8",
  textSub: "#8a8898",
  textMuted: "#4a4a5c",
};

function BrandPanel() {
  return (
    <div
      className="hidden md:flex"
      style={{
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px 52px",
        background: T.bgCard,
        borderRight: `1px solid ${T.border}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* dot-grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.05,
          backgroundImage: "radial-gradient(circle, #8a8898 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#0d0d12", fontSize: 20 }}>
          ⚡
        </div>
        <span style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 22, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: T.textPrimary }}>
          FITME
        </span>
      </div>

      {/* Tagline */}
      <div style={{ position: "relative" }}>
        <h2 style={{ fontFamily: "var(--font-barlow-condensed, sans-serif)", fontSize: 56, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.0, color: T.textPrimary, margin: 0 }}>
          TRACK.<br />LIFT.<br />PROGRESS.
        </h2>
        <p style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 14, color: T.textSub, marginTop: 16, maxWidth: 260, lineHeight: 1.6 }}>
          Your personal fitness companion. Log workouts, track body metrics, and crush your goals.
        </p>
      </div>

      {/* Social proof pill */}
      <div style={{ position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, padding: "8px 16px", background: "#1e1e2a", border: `1px solid ${T.border}` }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.accent, display: "inline-block" }} />
          <span style={{ fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 12, color: T.textSub }}>
            Join athletes already tracking their progress
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-dvh md:grid md:grid-cols-2"
      style={{ background: "#0d0d12" }}
    >
      <BrandPanel />

      {/* Right: form panel */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100dvh",
          padding: "36px 24px 28px",
          /* on desktop constrain form width */
        }}
        className="md:px-16 lg:px-24"
      >
        {children}
      </div>
    </div>
  );
}
