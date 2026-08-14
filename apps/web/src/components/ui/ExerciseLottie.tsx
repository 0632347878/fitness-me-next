"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  className?: string;
  label: string;
};

/** Lightweight, viewport-aware Lottie player for exercise library artwork. */
export default function ExerciseLottie({ src, className, label }: Props) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let observer: IntersectionObserver | undefined;
    let animation: import("lottie-web").AnimationItem | undefined;

    void import("lottie-web").then(({ default: lottie }) => {
      if (disposed) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      animation = lottie.loadAnimation({
        container,
        renderer: "svg",
        loop: !reduceMotion,
        autoplay: !reduceMotion,
        path: src,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
          progressiveLoad: true,
        },
      });

      if (reduceMotion) {
        animation.addEventListener("DOMLoaded", () => animation?.goToAndStop(30, true));
        return;
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) animation?.play();
          else animation?.pause();
        },
        { threshold: 0.2 },
      );
      observer.observe(container);
    });

    return () => {
      disposed = true;
      observer?.disconnect();
      animation?.destroy();
    };
  }, [src]);

  return <span ref={containerRef} className={className} role="img" aria-label={label} />;
}
