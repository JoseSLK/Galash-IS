# DESIGN.md: GALASH (web)

> Source of truth for visual decisions. Read before building any UI. Tokens live in `tokens.css`; brand rules in the skill's `references/galash-brand.md`.

## Product
- **What it is / for whom:** Web presence and tools of GALASH (Grupo de Auditoría Lógica y Arquitectura de Software y Hardware), UPTC research group. Audience: students, professors and people interested in joining the group.
- **Tone:** rigorous, calm, approachable
- **Platform:** web, responsive, light and dark
- **Density:** comfortable for content pages, compact for dashboards
- **Language:** Spanish (es-CO)

## Principles
1. The content (research, events, people) is the hero; the interface stays quiet.
2. One Jonquil accent per screen: primary action, active state, or a single highlighted word.
3. Delft Blue is ink, not a second accent.
4. Geometry from the logo (hexagon, monoline, nodes) appears rarely and always on purpose.

## Color roles
| Role | Light | Dark | Use |
|---|---|---|---|
| bg | `#FBFAF9` | `#1E1A17` | page |
| surface | `#FFFFFF` | `#2A2521` | cards, panels |
| border | Eerie black 12% | white 12% | hairlines |
| text | `#1E1A17` | `#F5F3F0` | body |
| text-muted | `#767171` | `#A8A29E` | secondary text |
| ink | `#3D405B` | `#F5F3F0` | headings, logo |
| link | `#3D405B` | `#B4BEDA` | links |
| accent | `#F7C500` | `#F7C500` | primary action, active, one highlight |
| accent-fg | `#1E1A17` | `#1E1A17` | text on accent |
| secondary | `#7785AC` | `#7785AC` | UI accents, charts, chips (never small text on light) |
| success | `#A5E6BA` bg + Eerie black text | same | positive status |
| danger | `#B3261E` (derived) | `#F2A29C` (derived) | errors |

## Type
- Display: Signika 600 (fallback Arial Narrow). Body: Open Sans 400/500/600. Labels: Arial Narrow stack, uppercase, +0.14em.
- Scale: 12 / 14 / 16 / 20 / fluid 24-32 / fluid 32-48. Body line-height 1.55, headings 1.15.

## Space, shape, elevation, motion
- Space: 2, 4, 8, 12, 16, 24, 32, 48, 64, 96. Content max 1120px, reading 65ch.
- Radius: sm 6, md 10, lg 16. Controls use `--r-control` (10px; flip to pill to match galash.com).
- Elevation: none by default, hairline borders. One soft shadow for menus, popovers, dialogs.
- Motion: 120 / 200 / 320 ms, ease-out enter, ease-in exit, reduced-motion respected.

## Logo
Official SVG only. Horizontal in header, vertical in footer/cover/OpenGraph. Dark ink on light, contrast version on dark. Min height 32px, clear space at least half the mark height (proposed, confirm). Never modify.

## Digital pieces
Hero 1900x600, inner slide 1140x450, social 1920x1080, agenda 709x410, agenda index 700x246, bulletin 1280x720, OpenGraph 1200x630, email 800 wide.

## Component inventory
- Button: primary (Jonquil fill), secondary (outline), ghost. One primary per view.
- Link, eyebrow label, highlight (max one per view), hexagon avatar.
- Add new components here when created.

## Voice (UI copy)
Verb + object for actions ("Guardar cambios"). Errors: what happened + how to fix. Empty states: what goes here + one action. Short sentences, no unexplained jargon.

## Rejected here
Gradients (the manual's gray gradient tags are a slide device), Jonquil text on light, Glaucous or Gray as body text, more than one accent, decorative hexagon patterns, any font outside the three roles.

## Changelog
- Initial contract from Manual de Identidad Digital.
