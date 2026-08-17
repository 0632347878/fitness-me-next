"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import gifUrl, { finishFrame } from "@/utils";

// Один общий setInterval на все карточки с одинаковым intervalMs — сколько бы
// карточек ни анимировалось одновременно (актуально на тач, где триггер — видимость,
// а не hover, и в сетке легко может быть видно 6-9 карточек сразу).
const tickers = new Map<
  number,
  { id: ReturnType<typeof setInterval>; listeners: Set<() => void> }
>();

function subscribeTick(intervalMs: number, listener: () => void) {
  let t = tickers.get(intervalMs);
  if (!t) {
    const listeners = new Set<() => void>();
    const id = setInterval(() => listeners.forEach((l) => l()), intervalMs);
    t = { id, listeners };
    tickers.set(intervalMs, t);
  }
  t.listeners.add(listener);
  return () => {
    t!.listeners.delete(listener);
    if (t!.listeners.size === 0) {
      clearInterval(t!.id);
      tickers.delete(intervalMs);
    }
  };
}


export default function ExerciseGif({
                                      src,
                                      alt,
                                      className,
                                      intervalMs = 1650,
                                      name,
                                      objectFit = "cover",
                                    }: {
  src: string | null,
  alt: string,
  className?: string,
  intervalMs?: number,
  name?: string | null,
  objectFit?: CSSProperties["objectFit"],
}) {
  const start = gifUrl(src, name);
  // Финиш берём из сырого src (remote /0.jpg или локальный -0.png), а если там
  // пусто (например src=null, но есть локальный override) — из разрешённого start.
  const finishRaw = finishFrame(src) ?? finishFrame(start);
  const finish = finishRaw ? gifUrl(finishRaw, name) : null;

  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showFinish, setShowFinish] = useState(false);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReduceMotion(motionPreference.matches);

    updateMotionPreference();
    motionPreference.addEventListener("change", updateMotionPreference);
    return () => motionPreference.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !finish) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [finish]);

  useEffect(() => {
    if (!finish || !inView || reduceMotion) {
      setShowFinish(false);
      return;
    }
    return subscribeTick(intervalMs, () => setShowFinish((v) => !v));
  }, [finish, inView, intervalMs, reduceMotion]);

  if (!start) return null;

  const wrap: CSSProperties = { position: "relative", display: "block" };
  const frame: CSSProperties = { objectFit, transition: "opacity 1.1s ease-in-out" };

  return (
    <span ref={ref} className={className} style={wrap}>
      <Image src={start} alt={alt} fill unoptimized style={{ ...frame, opacity: showFinish ? 0 : 1 }} />
      {finish && inView && (
        <Image src={finish} alt={`${alt} — finish`} fill unoptimized style={{ ...frame, opacity: showFinish ? 1 : 0 }} />
      )}
    </span>
  );
}
