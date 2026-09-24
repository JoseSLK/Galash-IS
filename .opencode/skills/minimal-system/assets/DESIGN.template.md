# DESIGN.md

> Source of truth for visual decisions. Read before building any UI. Update deliberately, not casually.

## Product
- **What it is / for whom:**
- **Tone (3 adjectives):** e.g. calm, precise, unhurried
- **Platform(s):** web (responsive)
- **Density:** comfortable / compact

## Principles (max 4, project specific)
1.
2.
3.

## Color roles
| Role | Light | Dark | Use |
|---|---|---|---|
| bg | | | page background |
| surface | | | cards, panels |
| border | | | hairlines |
| text | | | primary text |
| text-muted | | | secondary text |
| accent | | | primary action, active state only |
| accent-fg | | | text on accent |
| danger / success / warning | | | status only |

## Type
- Family:
- Scale (px): 12 / 14 / 16 / 20 / 24 / 32 / 48
- Weights: 400 / 500 / 600

## Space, radius, elevation, motion
- Space: 2, 4, 8, 12, 16, 24, 32, 48, 64, 96
- Radius: sm 6 / md 10 / lg 16
- Elevation: none by default; hairline borders; one soft shadow for floating layers
- Motion: 120 / 200 / 320 ms, ease-out enter, ease-in exit, reduced-motion respected

## Component inventory
List every shared component and its variants. Reuse before creating.
- Button: primary, secondary, ghost, destructive
-

## Voice (UI copy)
- Verb + object for actions. Errors: what happened + how to fix. Empty states: what goes here + one action.

## Rejected here
Project-specific patterns we decided against, and why.
-

## Changelog
- YYYY-MM-DD: initial contract
