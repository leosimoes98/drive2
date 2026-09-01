# Design Brief

## Direction
Night Fleet — a dark, mobile-first ride-hailing OS for Drive2 (customer, driver, admin) with deep navy surfaces and an electric-green "GO" signal accent.

## Tone
Premium industrial/utilitarian — a confident dark transport command center; precise, high-contrast, zero decoration that isn't functional.

## Differentiation
A chromatic ride-status signal system (amber waiting → cyan accepted → green in-progress → deep green completed) rendered as persistent status strips on every ride card, plus mono-digit fares that read like a live dispatch board.

## Color Palette
| Token       | OKLCH (dark)   | Role |
| ----------- | -------------- | ---- |
| background  | 0.135 0.02 258 | deep navy-black base |
| foreground  | 0.95 0.012 258 | primary text |
| card        | 0.175 0.022 258| elevated surfaces |
| primary     | 0.72 0.19 150  | electric green — action/fare/accept |
| accent      | 0.74 0.15 80   | amber — waiting/warning |
| muted       | 0.21 0.018 258 | secondary surfaces |
| success     | 0.68 0.18 150  | completed / confirmed |
| warning     | 0.74 0.15 80   | waiting state |
| destructive | 0.58 0.2 25    | decline / errors |

## Typography
- Display: Space Grotesk — headings, brand, hero numbers
- Body: DM Sans — UI labels, paragraphs, forms
- Mono: JetBrains Mono — fares, plates (ABC-1234), ride IDs
- Scale: hero text-4xl md:text-6xl font-bold tracking-tight, h2 text-2xl md:text-3xl font-bold tracking-tight, label text-xs font-semibold tracking-widest uppercase, body text-base

## Elevation & Depth
Three-tier navy surface hierarchy (background → card → popover) with subtle/elevated navy-tinted shadows and a faint grid texture on dispatch surfaces; no glow effects.

## Structural Zones
| Zone    | Background       | Border   | Notes |
| ------- | ---------------- | -------- | ----- |
| Header  | card / sidebar   | border-b | sticky, brand wordmark + role switch |
| Content | background       | —        | alternate bg-muted/30 sections, card grids |
| Footer  | muted/40         | border-t | legal + version |

## Spacing & Rhythm
Mobile-first: section gaps 24-32px, card padding 16-20px, micro-gaps 8-12px; 4px base grid, generous breathing room on cards.

## Component Patterns
- Buttons: 10px radius, primary = electric green with dark navy text, destructive = red; hover lifts + brightens
- Cards: 12px radius, card background, shadow-subtle resting / shadow-elevated on active
- Badges: full-radius pills tinted by status (amber/cyan/green), mono for plates

## Motion
- Entrance: slide-up 0.4s on cards/rows (staggered)
- Hover: transition-smooth 0.3s, subtle lift + border brighten
- Decorative: pulse-ring on the waiting-for-driver indicator; fade-in for panels

## Constraints
- Dark mode is the flagship; light mode tuned intentionally, both AA+ contrast
- UI copy in pt-BR (Aguardando, Aceito, Em andamento, Concluída)
- No PIX live payment, no driver tracking, no ratings, no payout withdrawal (doNotBuild)
- Token-only styling — no raw hex/rgb in components

## Signature Detail
The mono-digit fare + chromatic status strip: every ride card carries a color-coded signal bar and a JetBrains Mono fare, making the whole app read like a live fleet dispatch board.
