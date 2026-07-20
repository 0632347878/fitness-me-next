import type { Metadata } from "next";
import { FmStyles } from "@/components/fm";
import s from "./layout.module.css";

export const metadata: Metadata = {
  title: "Authentication – FitMe",
};

function BrandPanel() {
  return (
    <div className={`hidden md:flex ${s.brandPanel}`}>
      {/* dot-grid */}
      <div className={s.dotGrid} />

      {/* Logo */}
      <div className={s.brandLogo}>
        <div className={s.brandLogoIcon}>⚡</div>
        <span className={s.brandLogoText}>FITME</span>
      </div>

      {/* Tagline */}
      <div className={s.tagline}>
        <h2 className={s.taglineHeading}>
          TRACK.<br />LIFT.<br />PROGRESS.
        </h2>
        <p className={s.taglineBody}>
          Your personal fitness companion. Log workouts, track body metrics, and crush your goals.
        </p>
      </div>

      {/* Social proof pill */}
      <div className={s.socialProof}>
        <div className={s.socialPill}>
          <span className={s.socialDot} />
          <span className={s.socialText}>
            Join athletes already tracking their progress
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`min-h-dvh md:grid md:grid-cols-2 ${s.page}`}>
      <FmStyles />
      <BrandPanel />

      {/* Right: form panel */}
      <div className={`md:px-16 lg:px-24 ${s.formPanel}`}>
        {children}
      </div>
    </div>
  );
}
