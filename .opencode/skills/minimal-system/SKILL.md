---
name: minimal-system
description: Design and review minimalist, accessible web interfaces with a coherent GALASH brand system. Use when creating, redesigning, polishing, or auditing pages, dashboards, forms, or components.
license: MIT
compatibility: Web agnostic: HTML, CSS, JavaScript, React, Vue, Svelte, Astro, and Next.
---

# Minimal System

Design calm, clear, and functional interfaces. Aesthetic supports the product:
do not disguise an empty experience with hero sections, gradients, or motion.
Every screen must help users complete a real task and make its capabilities
visible.

Respond in the user's language. For GALASH, use Colombian Spanish UI copy
unless instructed otherwise.

## Required workflow

1. Define the utility first: who uses the screen, what they are trying to do,
   what data they need, what changes after each action, and how they recover
   from an error. If there is no clear task, reduce the scope before designing.
2. Read `DESIGN.md` and the project's token file if they exist.
3. If the project is GALASH and they are missing, use
   `assets/DESIGN.galash.md` and `assets/tokens.css` as the base. For another
   brand, use `assets/DESIGN.template.md` and ask about product, audience, and
   tone.
4. Before implementation, define the screen's job, one primary action,
   required states, responsive behavior, and rejected anti-patterns.
5. Reuse existing components. Use tokens; do not invent component values.
6. Implement interaction and states first, then apply the visual layer. A
   button must work, a form must validate, and a list must explain its loading,
   empty, error, and updated states.
7. Check hierarchy, responsive behavior, keyboard access, contrast, visible
   focus, and loading, empty, error, success, and disabled states when relevant.
8. Remove anything that does not improve understanding, decision-making, or
   action.
9. Report briefly what changed, which tokens were used, and any deviations.

## GALASH contract

- Use one primary action and one accent: Jonquil.
- Delft Blue is ink for headings, links, and the logo; it is not a second
  accent.
- Use Signika for headings, Open Sans for body text, and Arial Narrow for
  labels.
- Use the official logo without modification. Use the hexagonal geometry only
  when it has a clear purpose.
- Use actionable copy: verb + object. Errors explain what happened and how to
  fix it. Empty states explain what is missing and offer one action.

## Function before fluff

- Do not invent metrics, testimonials, activity, results, integrations, or
  content to fill space. Use real data or explicit states.
- Do not design a landing page when the user needs a tool. Prioritize the task,
  context, and next decision.
- Every screen needs a clear main path and a safe exit: save, cancel, go back,
  undo, or correct as appropriate.
- Make system status visible: what is happening, what finished, what failed,
  and what the user can do now.
- Reduce steps, typing, and memory. Prefer selection, search, previous values,
  and actions close to the data they modify.
- Interaction must work without hover, sound, motion, or color. Motion only
  confirms an action or explains a change.
- When a decision needs confirmation, explain its consequence. Do not use a
  dialog for information that can be shown inline.
- Do not present disconnected prototypes as finished products. If something is
  not connected, say so and provide a useful state instead of a fake button.

## Implementation rules

- Import `assets/tokens.css` once and consume semantic variables.
- Use semantic HTML, visible labels, landmarks, one `h1`, a skip link, and
  controls of at least 44px.
- Keep content readable (`max-width: 65ch`) and prevent horizontal scrolling at
  320px and 200% zoom.
- Every interactive element needs `:focus-visible`; color must never be the
  only state signal.
- Animate only `transform` and `opacity`, with short durations and respect for
  `prefers-reduced-motion`.

## Reject by default

Gradients, glow, glassmorphism, neon, decorative blobs, nested cards, emoji as
icons, filler text, fake metrics, buttons that do nothing, purposeless
marketing sections, hover as the only affordance, placeholder-as-label,
spinners for content, vague buttons, and magic values.

## References

- `references/web.md`: web implementation and accessibility rules.
- `references/galash-brand.md`: GALASH identity and usage rules.
- `references/tokens.md`: scales for non-GALASH projects.
- `assets/DESIGN.galash.md`: GALASH visual contract.
- `assets/DESIGN.template.md`: contract for other brands.
- `assets/tokens.css`: ready-to-copy GALASH tokens.
