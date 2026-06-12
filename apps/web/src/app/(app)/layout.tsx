"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Icon, T, FmStyles } from "@/components/fm";
import { useLang, useT } from "@/lib/lang-context";
import { SettingsProvider, useSettings } from "@/lib/settings-context";
import { AccountPopup } from "@/features/settings";


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <AppShell>{children}</AppShell>
    </SettingsProvider>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { lang } = useLang();
  const t = useT();
  const { open: openSettings } = useSettings();

  const TABS = [
    { href: "/dashboard", label: t.nav.home,      IconComp: Icon.Home },
    { href: "/workouts",  label: t.nav.workouts,  IconComp: Icon.Dumbbell },
    { href: "/programs",  label: lang === "ru" ? "Программы" : "Programs", IconComp: Icon.Chart },
    { href: "/exercises", label: t.nav.exercises, IconComp: Icon.Search },
    { href: "/metrics",   label: t.nav.metrics,   IconComp: Icon.Chart },
  ] as const;

  function handleLogout() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    router.replace("/login");
  }

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) router.replace("/login");
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: T.bg,
        fontFamily: "var(--font-dm-sans, sans-serif)",
      }}
    >
      <FmStyles />

      <AccountPopup onLogout={handleLogout} />

      {/* Page content */}
      <main style={{ flex: 1, overflowY: "auto", paddingBottom: 64 }}>
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          background: T.bgCard,
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "stretch",
          zIndex: 100,
        }}
      >
        {TABS.map(({ href, label, IconComp }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                textDecoration: "none",
                color: isActive ? T.accentRaw : T.textMuted,
                position: "relative",
                transition: "color 0.15s",
              }}
            >
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 32,
                    height: 2,
                    borderRadius: 2,
                    background: T.accent,
                  }}
                />
              )}
              <IconComp s={20} c={isActive ? T.accentRaw : T.textMuted} />
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-barlow-condensed, sans-serif)",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* Account button */}
        <button
          onClick={openSettings}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.textMuted,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = T.accentRaw)}
          onMouseLeave={(e) => (e.currentTarget.style.color = T.textMuted)}
        >
          <Icon.User s={20} c="currentColor" />
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--font-barlow-condensed, sans-serif)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {lang === "ru" ? "Аккаунт" : "Account"}
          </span>
        </button>
      </nav>
    </div>
  );
}
