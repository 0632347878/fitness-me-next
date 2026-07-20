"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getWorkout, getWorkouts } from "@/features/workouts/workouts.api";
import { SetLogger } from "@/features/workouts/components/SetLogger";
import { FmPageLoader, AppHeader } from "@/components/fm";
import { useSettings } from "@/lib/settings-context";

export default function WorkoutSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { open: openSettings } = useSettings();
  const qc = useQueryClient();

  const { data: session, isLoading } = useQuery({
    queryKey: ["workout", id],
    queryFn: () => getWorkout(id),
  });

  const { data: allSessions = [] } = useQuery({
    queryKey: ["workouts"],
    queryFn: getWorkouts,
  });

  if (isLoading) return <FmPageLoader />;

  if (!session) {
    return (
      <div className="py-10 px-4 text-center text-fm-text-sub">
        Workout not found.
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-fm-bg">
      <AppHeader
        title="Workout"
        onAccountClick={openSettings}
      />
      <SetLogger
        session={session}
        allSessions={allSessions}
        onDone={() => {
          qc.invalidateQueries({ queryKey: ["workouts"] });
          router.replace("/workouts");
        }}
      />
    </div>
  );
}

