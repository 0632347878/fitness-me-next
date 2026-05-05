# FitMe — Auth Screens Design Notes
*Created: May 1, 2026*

## Screens Covered
1. **Login** — email + password, forgot password, social auth (Google / Apple)
2. **Register** — 2-step flow: (1) name + email → (2) password + strength meter
3. **User Info** — post-registration profile setup: avatar, body stats, goal, fitness level

## Design System

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `bg` | `#0d0d12` | Screen background |
| `bgCard` | `#16161f` | Card / panel surfaces |
| `bgInput` | `#1e1e2a` | Input fields |
| `border` | `#2a2a38` | Borders, dividers |
| `accent` | `oklch(0.72 0.18 35)` | Warm amber-orange — CTAs, selections, active states |
| `textPrimary` | `#f0ede8` | Headlines, main text |
| `textSub` | `#8a8898` | Labels, placeholders |
| `textMuted` | `#4a4a5c` | Tertiary, skip links |

### Typography
- **Display / Headings**: `Barlow Condensed` — 900 weight, uppercase, tight tracking
- **Body / Labels**: `DM Sans` — 300–600 weight, natural tracking
- **Minimum sizes**: 11px labels, 13px body, 30px+ hero headlines

### Components
- `FInput` — dark input with floating label, focus ring in accent, password reveal toggle
- `FButton` — primary (accent fill, dark text), ghost (border only), loading spinner state
- `GoalCard` — grid card with icon + label, selected state with accent border + checkmark
- `MeasureInput` — large numeric input with unit label (height/weight)
- `Logo` — bolt icon in accent square + FITME wordmark

## Screen Flows
```
Login ──→ (forgot pw) — placeholder
     ──→ Register ──→ Step 1 (name + email)
                  ──→ Step 2 (password + strength)
                  ──→ User Info (post-registration)
                       ──→ Dashboard (not yet designed)
```

## UX Decisions
- **2-step registration**: reduces cognitive load on first screen; password step is isolated so strength feedback has full attention
- **Password strength meter**: 3-bar visual + live requirement checklist (8+ chars, contains number, contains letter)
- **User Info skip**: "Skip for now" option — profile data is optional, don't gate the experience
- **Goal cards**: 2×2 grid with icon + label — fast to scan, tap-friendly (Android 44px hit target)
- **Density tweak**: compact ↔ comfortable — affects padding, font sizes, spacing throughout

## Platform
- **Android**, portrait, 390×844 equivalent
- Status bar: `#0d0d12` (dark, light icons)
- Nav bar: `#0d0d12`
- No system back button override — screen-level back buttons handle navigation

## TODO / Next Steps
- [ ] Dashboard screen design
- [ ] Workout logger screen design  
- [ ] Exercises browser design
- [ ] Metrics / charts screen
- [ ] Connect vault: read `0 Логин-авторизация.md` for additional user screen specs
- [ ] Review User Info screen against vault spec once vault is mounted
