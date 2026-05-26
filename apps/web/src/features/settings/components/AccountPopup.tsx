"use client";

import { useLang, useT } from "@/lib/lang-context";
import { useSettings } from "@/lib/settings-context";
import { useTheme } from "@/lib/theme-context";
import { SegmentedControl } from "./SegmentedControl";
import { DangerZone } from "./DangerZone";
import s from "./AccountPopup.module.css";

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

interface AccountPopupProps {
  onLogout: () => void;
}

export function AccountPopup({ onLogout }: AccountPopupProps) {
  const { isOpen, close } = useSettings();
  const { lang, setLang, loading: langLoading } = useLang();
  const { theme, toggle: toggleTheme } = useTheme();
  const t = useT();

  if (!isOpen) return null;

  const labels = t.settings;

  return (
    <>
      <div className={s.backdrop} onClick={close} />

      <div className={s.panel}>
        {/* Header */}
        <div className={s.header}>
          <span className={s.title}>{labels.title}</span>
          <button className={s.closeBtn} onClick={close}>
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className={s.content}>

          {/* Language */}
          <section className={s.section}>
            <span className={s.sectionLabel}>{labels.language}</span>
            <SegmentedControl
              value={lang}
              onChange={setLang}
              disabled={langLoading}
              options={[
                { value: "en", label: "EN", emoji: "🇬🇧" },
                { value: "ru", label: "RU", emoji: "🇷🇺" },
              ]}
            />
          </section>

          {/* Appearance */}
          <section className={s.section}>
            <span className={s.sectionLabel}>{labels.appearance}</span>
            <SegmentedControl
              value={theme}
              onChange={(v) => { if (v !== theme) toggleTheme(); }}
              options={[
                { value: "dark", label: labels.themeDark, emoji: "🌙" },
                { value: "light", label: labels.themeLight, emoji: "☀️" },
              ]}
            />
          </section>

          {/* Danger zone */}
          <section className={s.section}>
            <span className={`${s.sectionLabel} ${s.sectionLabelDanger}`}>{labels.dangerZone}</span>
            <DangerZone onReset={close} />
          </section>

        </div>

        {/* Footer */}
        <div className={s.footer}>
          <button className={s.logoutBtn} onClick={() => { close(); onLogout(); }}>
            <LogoutIcon /> {labels.logout}
          </button>
        </div>
      </div>
    </>
  );
}
