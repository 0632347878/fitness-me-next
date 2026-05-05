# FitMe — Design Notes
*Last updated: May 1, 2026*

## App Overview
- **Stack**: Next.js 15 (web) + Expo SDK 52 (mobile) + NestJS/Fastify API + PostgreSQL
- **Features**: Auth, Dashboard, Workouts (set logger), Exercises browser, Body Metrics, Nutrition (planned)
- **Design scope**: Android mobile-first, premium dark theme

---

## Design System

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `bg` | `#0d0d12` | Screen background |
| `bgCard` | `#16161f` | Card/panel surfaces |
| `bgInput` | `#1e1e2a` | Input fields |
| `border` | `#2a2a38` | Borders, dividers |
| `accent` | `oklch(0.72 0.18 35)` | Warm amber-orange — CTAs, active states |
| `accentDim` | `oklch(0.72 0.18 35 / 0.15)` | Selected card bg |
| `textPrimary` | `#f0ede8` | Headlines, main text |
| `textSub` | `#8a8898` | Labels, secondary text |
| `textMuted` | `#4a4a5c` | Tertiary, skip links |
| `danger` | `#ef4444` | Errors, destructive |
| `success` | `#22c55e` | Confirmations |

### Typography
- **Display**: `Barlow Condensed` 900, uppercase, tight tracking — hero headlines, CTAs, section labels
- **Body**: `DM Sans` 300–600 — inputs, descriptions, supporting text
- **Min sizes**: 11px labels · 13px body · 30px+ hero

### Components (built)
- `FInput` — dark input, floating label, focus accent ring, password reveal
- `FButton` — primary (accent fill), ghost (border), loading spinner
- `GoogleBtn` — full-width Google OAuth with real SVG logo
- `GoalCard` — 2×2 grid card, icon + label, accent selected state + checkmark
- `MeasureInput` — large numeric input with unit (height/weight)
- `Logo` — bolt icon in accent square + FITME wordmark (sm/lg variants)
- `ScaledDevice` — viewport-fitting wrapper for AndroidDevice frame
- `Divider` — horizontal rule with center label

---

## Screens Built

### 1. Login (`FitMe Auth.html` → screen: login)
- Email + password fields
- Forgot password link (placeholder)
- Log In CTA
- "Continue with Google" (full-width, real Google logo)
- Footer: "Sign up" link → Register

### 2. Register (`FitMe Auth.html` → screen: register)
- **Step 1**: Full name + email
- **Step 2**: Password + live strength meter (3-bar) + requirement checklist
- Step progress bar (2 segments)
- "Continue with Google" on step 1
- Footer: "Log in" link → Login

### 3. User Info / Profile Setup (`FitMe Auth.html` → screen: user-info)
- Avatar (initials + camera upload button)
- Body stats: height (cm) + weight (kg) — large numeric inputs
- Primary goal: 2×2 card grid (Lose Weight, Build Muscle, Endurance, Stay Fit)
- Fitness level: Beginner / Intermediate / Advanced pill selector
- "Start Training" CTA (disabled until goal + level selected)
- "Skip for now" text link
- **Note**: need to cross-check against `0 Логин-авторизация.md` in Obsidian vault once accessible

---

## Screens To Build

| Screen | Priority | Notes |
|--------|----------|-------|
| Dashboard | High | Stat cards, streak, recent workouts, weight chart |
| Workout Logger | High | Set logger — core UX, exercise picker, set rows |
| Exercises Browser | Medium | Filter pills, card grid, detail modal |
| Metrics / Charts | Medium | Weight history chart, log form |
| Navigation / Tab Bar | High | Bottom nav Android style |

---

## Tweaks (interactive controls)
- **Density**: compact ↔ comfortable — affects all padding/font sizes
- **Screen**: jump directly to login / register / profile

---

## Files
| File | Description |
|------|-------------|
| `FitMe Auth.html` | Login + Register + User Info screens |
| `android-frame.jsx` | AndroidDevice frame component |
| `tweaks-panel.jsx` | Tweaks panel shell + controls |
| `design-notes/DESIGN.md` | This file |
| `design-notes/Auth Screens.md` | Older detailed auth notes (superseded) |

---

## Decisions Log
- **2-step registration**: reduces cognitive load; password step isolated for strength feedback
- **Amber-orange accent** over indigo: more athletic/energetic, differentiates from default Tailwind look
- **Barlow Condensed**: sporty, condensed — saves vertical space, strong visual hierarchy
- **Google-only OAuth**: removed Apple/X per user feedback
- **User Info skip option**: profile data optional, don't gate the experience
- **AndroidDevice dark=true**: status bar + nav bar match app bg `#0d0d12`
