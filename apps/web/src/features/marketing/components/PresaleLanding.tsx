"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { FmStyles } from "@/components/fm";
import s from "./PresaleLanding.module.css";

// ─── Signature element: a mechanical set-log flip counter ─────────────────────
// This is literally the app's core loop (logging a set) — not a generic KPI ticker.
const SAMPLE_SETS = [
  { ex: "Back squat", set: "4×6", load: "100 kg" },
  { ex: "Bench press", set: "3×8", load: "80 kg" },
  { ex: "Deadlift", set: "1×5", load: "140 kg" },
  { ex: "Жим лёжа", set: "3×8", load: "80 кг" },
  { ex: "Pull-up", set: "3×10", load: "BW" },
  { ex: "Romanian DL", set: "3×10", load: "60 kg" },
];

function SetLogTicker() {
  const [i, setI] = useState(0);
  const [n, setN] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setI((v) => (v + 1) % SAMPLE_SETS.length);
      setN((v) => v + 1);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const set = SAMPLE_SETS[i];

  return (
    <div className={s.ticker}>
      <div className={s.tickerCountLabel}>
        Set
        <span key={n} className={s.tickerCount}>
          {String(n).padStart(3, "0")}
        </span>
      </div>
      <div className={s.tickerDivider} />
      <div key={`ex-${i}`} className={s.tickerEx}>
        <div className={s.tickerExName}>{set.ex}</div>
        <div className={s.tickerExMeta}>
          {set.set} <span className={s.dot}>·</span> {set.load}
        </div>
      </div>
    </div>
  );
}

// ─── Roadmap strip (mirrors docs/PLAN.md status, not invented) ────────────────
const ROADMAP: { label: string; status: "done" | "next" | "later" }[] = [
  { label: "Auth", status: "done" },
  { label: "Exercise library", status: "next" },
  { label: "Workout logging", status: "later" },
  { label: "Body metrics", status: "later" },
  { label: "Nutrition log", status: "later" },
  { label: "AI coach", status: "later" },
];

function RoadmapStrip() {
  return (
    <div className={s.roadmapStrip}>
      {ROADMAP.map((r) => (
        <div key={r.label} className={s.roadmapPill} data-status={r.status}>
          <span className={s.roadmapDot} />
          <span className={s.roadmapLabel}>
            {r.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Feature card ───────────────────────────────────────────────────────────
function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className={s.featureCard}>
      <h3 className={s.featureTitle}>
        {title}
      </h3>
      <p className={s.featureBody}>{body}</p>
    </div>
  );
}

// ─── Waitlist form ──────────────────────────────────────────────────────────
function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setState("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("failed");
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className={s.waitlistDone}>
        You&apos;re on the list — I&apos;ll email you the moment early access opens.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className={s.waitlistForm}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className={clsx(s.waitlistInput, state === "error" && s.error)}
      />
      <button type="submit" disabled={state === "loading"} className={s.waitlistBtn}>
        {state === "loading" ? "Joining…" : "Join waitlist"}
      </button>
      {state === "error" && (
        <p className={s.waitlistError}>
          Something went wrong — try again in a moment.
        </p>
      )}
    </form>
  );
}

// ─── Pricing card ───────────────────────────────────────────────────────────
function PricingCard({
  eyebrow, price, cadence, features, cta, highlight, onClick,
}: {
  eyebrow: string; price: string; cadence: string; features: string[];
  cta: string; highlight?: boolean; onClick?: () => void;
}) {
  return (
    <div className={clsx(s.priceCard, highlight && s.highlight)}>
      <span className={s.priceEyebrow}>
        {eyebrow}
      </span>
      <div>
        <span className={s.priceAmount}>{price}</span>
        <span className={s.priceCadence}>{cadence}</span>
      </div>
      <ul className={s.priceFeatureList}>
        {features.map((f) => (
          <li key={f} className={s.priceFeatureItem}>
            <span className={s.priceCheck}>✓</span>{f}
          </li>
        ))}
      </ul>
      <button onClick={onClick} className={s.priceCta}>
        {cta}
      </button>
    </div>
  );
}

// ─── Scroll parallax + reveal ─────────────────────────────────────────────────
// Sets --sy (scrollY in px) on the root for CSS-driven parallax, and reveals
// sections as they enter the viewport. Both disabled under reduced-motion.
function useScrollAtmosphere(rootRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reveal-on-scroll for every [data-reveal] element.
    const revealEls = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (reduced) {
      revealEls.forEach((el) => el.setAttribute("data-shown", "true"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.setAttribute("data-shown", "true");
              io.unobserve(e.target);
            }
          }
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
      );
      revealEls.forEach((el) => io.observe(el));

      // Parallax: write scrollY into a CSS var, rAF-throttled.
      let raf = 0;
      const onScroll = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          root.style.setProperty("--sy", `${window.scrollY}px`);
          raf = 0;
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      return () => {
        io.disconnect();
        window.removeEventListener("scroll", onScroll);
        if (raf) cancelAnimationFrame(raf);
      };
    }
  }, [rootRef]);
}

// ─── Page ───────────────────────────────────────────────────────────────────
export function PresaleLanding() {
  const foundingLink = process.env.NEXT_PUBLIC_STRIPE_FOUNDING_LINK;
  const rootRef = useRef<HTMLDivElement | null>(null);
  useScrollAtmosphere(rootRef);

  function goFounding() {
    if (foundingLink) {
      window.location.href = foundingLink;
    } else {
      document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className={s.page} ref={rootRef}>
      <FmStyles />

      {/* Atmospheric background — fixed, behind everything, parallax via --sy */}
      <div className={s.bg} aria-hidden="true">
        <div className={clsx(s.orb, s.orb1)} />
        <div className={clsx(s.orb, s.orb2)} />
        <div className={clsx(s.orb, s.orb3)} />
        <div className={s.grain} />
        <div className={s.vignette} />
      </div>

      {/* Nav */}
      <div className={s.nav}>
        <span className={s.logo}>
          Repwise
        </span>
        <button onClick={goFounding} className={s.navCta}>
          Get early access
        </button>
      </div>

      {/* Hero */}
      <div className={s.hero}>
        <span className={clsx(s.heroBadge, s.heroFloat)} data-depth="1">
          Building in public · founding spots open
        </span>
        <h1 className={clsx(s.heroTitle, s.heroFloat)} data-depth="2">
          Train smarter.
          <br />
          Log every rep.
        </h1>
        <p className={clsx(s.heroSubtitle, s.heroFloat)} data-depth="1">
          Repwise pairs a science-backed program (push/pull/legs, upper/lower, and more) with a
          bilingual exercise library built for real lifters — and adapts as your equipment,
          injuries, and goals change.
        </p>

        <div className={s.heroFloat} data-depth="3">
          <SetLogTicker />
        </div>

        <div className={s.heroCtaRow}>
          <button onClick={goFounding} className={s.heroPrimaryCta}>
            Reserve a founding spot — $49
          </button>
          <button
            onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
            className={s.heroSecondaryCta}
          >
            Just join the waitlist
          </button>
        </div>
      </div>

      {/* Roadmap */}
      <div className={s.roadmapWrap}>
        <p className={s.roadmapCaption}>
          Real build status, updated as I ship
        </p>
        <RoadmapStrip />
      </div>

      {/* Features */}
      <div className={s.featuresGrid}>
        <div data-reveal style={{ transitionDelay: "0ms" }}>
          <FeatureCard
            title="Science-backed programs"
            body="Choose from proven structures — full body, upper/lower, push/pull/legs — each with honest pros, cons, and who it's actually for."
          />
        </div>
        <div data-reveal style={{ transitionDelay: "80ms" }}>
          <FeatureCard
            title="A library that knows you"
            body="Every exercise is tagged by muscle group, equipment, and injury risk, with alternatives ready when something doesn't work for your body."
          />
        </div>
        <div data-reveal style={{ transitionDelay: "160ms" }}>
          <FeatureCard
            title="Bilingual from day one"
            body="Search and log in English or Russian — the exercise library and workout logger both understand you either way."
          />
        </div>
        <div data-reveal style={{ transitionDelay: "240ms" }}>
          <FeatureCard
            title="Track what matters"
            body="Sets, reps, load, RPE, and body metrics in one place, with the data feeding back into how your plan adapts week to week."
          />
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" className={s.pricingWrap} data-reveal>
        <h2 className={s.pricingTitle}>
          Founding pricing, locked in
        </h2>
        <p className={s.pricingSubtitle}>
          The app is mid-development — you&apos;re backing it early, not buying a finished product.
          Full refund any time before public launch if it&apos;s not for you.
        </p>
        <div className={s.pricingRow}>
          <PricingCard
            eyebrow="Founding member"
            price="$49"
            cadence="one-time"
            highlight
            features={[
              "Lifetime access, no subscription",
              "Every feature on the roadmap, as it ships",
              "Direct line to me for feedback and requests",
              "Price locked forever — public price will be higher",
            ]}
            cta="Reserve my spot"
            onClick={goFounding}
          />
          <PricingCard
            eyebrow="Public launch (later)"
            price="$9"
            cadence="/month"
            features={[
              "Same core app, standard pricing",
              "No say in roadmap priority",
              "Available once the app is feature-complete",
            ]}
            cta="Join the waitlist instead"
            onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
          />
        </div>
      </div>

      {/* Waitlist */}
      <div id="waitlist" className={s.waitlistWrap} data-reveal>
        <h2 className={s.waitlistTitle}>
          Not ready to pay? Just get notified.
        </h2>
        <WaitlistForm />
      </div>

      {/* Footer */}
      <div className={s.footer}>
        <p className={s.footerText}>
          Repwise is being built solo, in the open. No investors, no hype — just a working app and honest progress updates.
        </p>
      </div>
    </div>
  );
}
