"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/fm";
import { useLang } from "@/lib/lang-context";
import { getActiveWorkout } from "../workouts.api";
import s from "./ActiveWorkoutWidget.module.css";

export function ActiveWorkoutWidget() {
  const pathname = usePathname();
  const { lang } = useLang();
  const { data: active } = useQuery({
    queryKey: ["workouts", "active"],
    queryFn: getActiveWorkout,
    refetchInterval: 60_000,
    retry: 1,
  });

  // The workout screens already render the active logger in full.
  if (!active || pathname.startsWith("/workouts")) return null;

  const title = active.planDayLabel
    ?? (lang === "ru" ? "Свободная тренировка" : "Freestyle workout");
  const setLabel = lang === "ru"
    ? `${active.setsLogged} подходов`
    : `${active.setsLogged} ${active.setsLogged === 1 ? "set" : "sets"}`;

  return (
    <Link
      href={`/workouts/${active.id}`}
      className={s.widget}
      aria-label={lang === "ru" ? "Продолжить активную тренировку" : "Resume active workout"}
    >
      <span className={s.icon} aria-hidden="true">
        <Icon.Bolt s={16} c="currentColor" />
      </span>
      <span className={s.copy}>
        <span className={s.eyebrow}>
          {lang === "ru" ? "Тренировка идёт" : "Workout in progress"}
        </span>
        <span className={s.title}>{title}</span>
      </span>
      <span className={s.meta}>{setLabel}</span>
      <span className={s.chevron} aria-hidden="true">
        <Icon.ChevRight s={15} c="currentColor" />
      </span>
    </Link>
  );
}
