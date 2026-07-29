"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard, isOnboardingComplete } from "@/features/onboarding";
import { useUserProfile } from "@/features/programs";
import { FmPageLoader } from "@/components/fm";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: profile, isLoading } = useUserProfile();

  // Auth guard + "already onboarded" guard.
  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) { router.replace("/login"); return; }
    if (!isLoading && isOnboardingComplete(profile)) router.replace("/dashboard");
  }, [isLoading, profile, router]);

  if (isLoading) return <FmPageLoader />;
  if (isOnboardingComplete(profile)) return <FmPageLoader />; // redirecting

  return <OnboardingWizard />;
}
