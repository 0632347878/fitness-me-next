"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { Icon, FmStyles, FmPageLoader } from "@/components/fm";
import { useLang, useT } from "@/lib/lang-context";
import { SettingsProvider, useSettings } from "@/lib/settings-context";
import { AccountPopup } from "@/features/settings";
import { useUserProfile } from "@/features/programs";
import { isOnboardingComplete } from "@/features/onboarding";
import s from "./layout.module.css";


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
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const onboardingOk = isOnboardingComplete(profile);

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
    if (!token) { router.replace("/login"); return; }
    // Logged in but hasn't finished onboarding → collect the profile first.
    // Without this, the injury/equipment filters and plan generation run on an
    // empty profile.
    if (!profileLoading && !onboardingOk) {
      router.replace("/onboarding");
    }
  }, [router, onboardingOk, profileLoading]);

  // Gate the render until onboarding status is known — otherwise the dashboard
  // paints for a frame before the redirect above fires (the flicker).
  if (profileLoading || !onboardingOk) return <FmPageLoader />;

  return (
    <div className={s.shell}>
      <FmStyles />

      <AccountPopup onLogout={handleLogout} />

      {/* Page content */}
      <main className={s.main}>
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <nav className={s.tabBar}>
        {TABS.map(({ href, label, IconComp }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={clsx(s.tab, isActive && s.active)}>
              {isActive && <span className={s.tabIndicator} />}
              <IconComp s={20} c="currentColor" />
              <span className={s.tabLabel}>{label}</span>
            </Link>
          );
        })}

        {/* Account button */}
        <button onClick={openSettings} className={clsx(s.tab, s.accountTab)}>
          <Icon.User s={20} c="currentColor" />
          <span className={s.tabLabel}>
            {lang === "ru" ? "Аккаунт" : "Account"}
          </span>
        </button>
      </nav>
    </div>
  );
}
