# Web implementation rules

## Setup
- Copy `assets/tokens.css` into the project and import it once at the app root. Components consume only `var(--token)`.
- Set `<html lang="es">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, `<meta name="color-scheme" content="light dark">`.
- Fonts come from the tokens file (Google Fonts, `display=swap`). Preconnect to `fonts.googleapis.com` and `fonts.gstatic.com`. Always keep the fallback stacks.
- Dark mode follows the system by default; a manual toggle sets `data-theme="light|dark"` on `<html>` and persists it (guard storage access with try/catch).

## Layout
- Grid/flex with `gap` from space tokens. Page shell: `max-width: var(--content-max)`, gutters 16 (mobile), 24 (tablet), 32+ (desktop).
- Text blocks `max-width: 65ch`. Numeric columns right-aligned with `font-variant-numeric: tabular-nums`.
- Container queries for components, media queries for the page shell. Breakpoints near 640, 960, 1280.
- Structure groups with spacing first; hairline (`--border`) second; surface change third; never nested cards.

## Components
- Buttons are real `<button>`; links are `<a>`. Interactive targets are at least 44px.
- Forms: visible `<label>`, hint and error text tied with `aria-describedby`, validate on blur, errors say how to fix. Required marker in text, not just color.
- Images: explicit `width`/`height`, `loading="lazy"` below the fold, `alt` meaningful or empty. Icons: inline SVG monoline, `stroke="currentColor"`, stroke-width 1.5, one set.
- Hexagon avatars: `.hex` class on a square image. Use for people/team only.
- Tables: header row sticky when long, zebra not needed; use hairlines.
- Empty/loading/error: skeleton matching final layout, never a bare spinner for content.

## Motion
- Transition only `transform` and `opacity`: `transition: transform var(--d-base) var(--ease-out), opacity var(--d-base) var(--ease-out);`. Never `transition: all`.
- Enter with `--ease-out`, exit with `--ease-in` and a shorter duration. Hover and toggles: `--d-fast` or instant.
- Make animations interruptible (state driven, CSS transitions over one-off keyframes).
- Reduced motion handled globally in `tokens.css`.

## Semantics and accessibility
One `<h1>`, ordered headings, landmarks (`header, nav, main, footer`), skip link, sufficient contrast per the brand table, full keyboard path, no keyboard traps (use `<dialog>` or a focus trap with Escape), `aria-current="page"` on active nav, tap targets 44px, `text-wrap: balance` on headings.

## Digital pieces
- OpenGraph 1200x630 with the vertical logo on Eerie black, a short Signika title, one Jonquil highlight at most. Add `og:title`, `og:description`, `og:image`, `twitter:card=summary_large_image`.
- Emails: 800px wide container, inline styles, system fallbacks (web fonts may not load), Eerie black on white with a Jonquil button.
- Sizes for heroes, agenda and bulletin images are in `galash-brand.md`. Serve responsive `srcset` and modern formats (AVIF/WebP).
