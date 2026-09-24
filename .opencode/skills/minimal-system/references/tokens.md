# Token defaults (generic, non-GALASH brands)

> For GALASH projects the palette, type and radius come from `assets/tokens.css` and `galash-brand.md`. Use this file for the scale logic (spacing, motion, elevation) and when a different brand needs a token set from scratch. A brand palette, when given, overrides the color defaults below; derive neutrals from it.

Starting values. Adjust once per project in DESIGN.md, then freeze. A token set is good when you never need to invent a value mid-build.

## Spacing (4px base)
`2, 4, 8, 12, 16, 24, 32, 48, 64, 96`
- Inside a component: 4 to 16. Between components in a group: 8 to 16. Between groups/sections: 24 to 64.
- Page gutters: 16 (mobile), 24 (tablet), 32+ (desktop). Max content width: 1120 for apps, 680 for reading.

## Type
- One variable sans family (Inter, Geist, Instrument Sans, or the platform system font). Optional mono for data/code.
- Scale (approx. 1.25 ratio, px): `12, 14, 16, 20, 24, 32, 48`. Body 16 (14 for dense app UI). Caption 12.
- Weights: 400 body, 500 labels/UI, 600 headings. No 700+ unless there is a reason.
- Line height: body 1.5, UI labels 1.3, headings 1.15 to 1.25. Large headings: letter-spacing -0.01em to -0.02em.
- Numbers in tables and metrics: tabular figures.

## Color (define in OKLCH or hex)
- Neutrals: 11-step ramp (50 to 950) with a whisper of the brand hue (chroma 0.005 to 0.02). Never pure #000 on pure #fff; use ~ oklch(0.18 0.01 h) on oklch(0.99 0.003 h).
- Accent: one hue, 3 steps (base, hover/pressed, subtle background). Chroma moderate (0.12 to 0.18). Avoid default purple.
- Semantic (success, warning, danger, info): muted, each with a foreground and a subtle background. Used only for status.
- Roles instead of raw steps: `bg`, `surface`, `surface-raised`, `border`, `border-strong`, `text`, `text-muted`, `text-faint`, `accent`, `accent-fg`, `accent-subtle`, `danger`, ...
- Dark mode = redefine role tokens. Do not invert. Reduce accent chroma slightly; separate surfaces by lightness steps, not shadows.

## Radius
Pick one family: `sm 6`, `md 10`, `lg 16`, `full 999`. Inputs/buttons `sm` or `md`, cards `md` or `lg`. Never mix sharp and pill-shaped controls on one screen unless deliberate.

## Elevation and borders
- Default: no shadow, 1px hairline border with low-alpha color (`border` role). Raised things (menus, popovers, dialogs) get one soft shadow, low opacity, two layers max.
- Prefer semi-transparent shadows over solid dark borders for floating elements.
- Maximum 2 elevation levels in the whole app.

## Motion
- Durations: `instant 0`, `fast 120ms`, `base 200ms`, `slow 320ms`. Nothing above 400ms except page-level transitions.
- Easing: enter `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out), exit `cubic-bezier(0.4, 0, 1, 1)` (ease-in, shorter), move `cubic-bezier(0.4, 0, 0.2, 1)`.
- Frequency rule: the more often a user triggers something, the less it should animate. Hover and toggles: instant to 120ms. Dialogs and navigation: 200 to 320ms.
- Interruptible: animations must be reversible mid-flight (state-driven, not fire-and-forget).
- Reduced motion: replace movement with a fade or nothing.

## Sizes
- Controls height: 32 (dense), 40 (default), 48 (touch). Icon sizes: 16, 20, 24. Stroke 1.5 to 2, one value app-wide.
- Minimum touch target: 44px.
