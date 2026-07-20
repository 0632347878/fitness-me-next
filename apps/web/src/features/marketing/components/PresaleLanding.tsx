"use client";

import { useEffect, useState } from "react";
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

// ─── Page ───────────────────────────────────────────────────────────────────
export function PresaleLanding() {
  const foundingLink = process.env.NEXT_PUBLIC_STRIPE_FOUNDING_LINK;

  function goFounding() {
    if (foundingLink) {
      window.location.href = foundingLink;
    } else {
      document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className={s.page}>
      <FmStyles />

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
        <span className={s.heroBadge}>
          Building in public · founding spots open
        </span>
        <h1 className={s.heroTitle}>
          Train smarter.
          <br />
          Log every rep.
        </h1>
        <p className={s.heroSubtitle}>
          Repwise pairs a science-backed program (push/pull/legs, upper/lower, and more) with a
          bilingual exercise library built for real lifters — and adapts as your equipment,
          injuries, and goals change.
        </p>

        <SetLogTicker />

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
        <FeatureCard
          title="Science-backed programs"
          body="Choose from proven structures — full body, upper/lower, push/pull/legs — each with honest pros, cons, and who it's actually for."
        />
        <FeatureCard
          title="A library that knows you"
          body="Every exercise is tagged by muscle group, equipment, and injury risk, with alternatives ready when something doesn't work for your body."
        />
        <FeatureCard
          title="Bilingual from day one"
          body="Search and log in English or Russian — the exercise library and workout logger both understand you either way."
        />
        <FeatureCard
          title="Track what matters"
          body="Sets, reps, load, RPE, and body metrics in one place, with the data feeding back into how your plan adapts week to week."
        />
      </div>

      {/* Pricing */}
      <div id="pricing" className={s.pricingWrap}>
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
      <div id="waitlist" className={s.waitlistWrap}>
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
