# GALASH brand reference (from "Manual de Identidad Digital")

GALASH = Grupo de Auditoría Lógica y Arquitectura de Software y Hardware, research group of the UPTC (Universidad Pedagógica y Tecnológica de Colombia). Site: www.galash.com. Mission (short): encourage, foster and lead the research process through interaction between students and professors of systems engineering and computing, promoting generation and dissemination of knowledge.

## 1. Palette (mandatory)
| Name | Hex | Web role |
|---|---|---|
| Eerie black | `#1E1A17` | Text on light, dark theme background, hero surfaces |
| Jonquil | `#F7C500` | The single accent: primary action fill, active state, one highlighted word |
| Delft Blue | `#3D405B` | Ink: headings, links, logo on light |
| Glaucous | `#7785AC` | Secondary UI: borders, chips, charts, large text only |
| Celadon | `#A5E6BA` | Positive/success backgrounds, with Eerie black text |
| Gray | `#7C7C7C` | Icons, dividers, disabled |
| Dim gray | `#767171` | Muted text on light |

Contrast (computed, WCAG relative luminance):
- Eerie black on white 17.3, on Jonquil 10.7, on Celadon 12.0. Delft Blue on white 10.1. White on Delft Blue 10.1.
- Jonquil on white 1.6: **never text or thin lines on light**. On Eerie black 10.7: fine.
- Glaucous on white 3.7: UI boundaries and large text only. On Eerie black 4.7: ok for small text.
- Gray `#7C7C7C` on white 4.2: not for body text. Dim gray on white 4.8: ok for muted text.

Not in the manual, therefore derived (marked in `tokens.css`): warm off-white background, sunken/raised surfaces, hairline borders, dark surface step, a danger red for errors, lighter Glaucous for links on dark. Keep them few and neutral.

## 2. Typography
- Titles: **Signika** semi-bold (600), plus **Arial Narrow** as the manual's second title face.
- Text: **Open Sans**; vary weight/style to build hierarchy.
- Web: load Signika and Open Sans from Google Fonts. Arial Narrow is a system font that cannot be assumed or embedded, so it is used (a) as fallback in the display stack and (b) for tracked uppercase micro-labels, which echoes the wide-tracked GALASH wordmark.
```
--font-display: "Signika", "Arial Narrow", Arial, sans-serif;   /* 600 */
--font-body:    "Open Sans", system-ui, sans-serif;             /* 400/500/600 */
--font-label:   "Arial Narrow", "Liberation Sans Narrow", Arial, sans-serif; /* uppercase, +0.14em */
```

## 3. Logo
- Two official arrangements: **vertical** (mark above wordmark) and **horizontal** (mark left of wordmark).
- Three color treatments: **dark ink** (Delft Blue on light), **grayscale**, **contrast** (white on black/Eerie black).
- Use only official files. Never redraw, recolor outside these treatments, stretch, add effects, or set on busy images. The logo is UPTC intellectual property; unauthorized use is sanctioned per the manual's legal page.
- Web choice: horizontal in headers, vertical in footers/covers/OpenGraph. Dark ink on light theme, contrast version on dark theme.
- The manual gives no minimum size or clear space. Proposed defaults (confirm with the group): min height 32px for horizontal, clear space at least half the mark's height on all sides.
- Provide SVG with `alt="GALASH"` (or `aria-label`) and a fixed aspect ratio; never text-only unless the file is unavailable.

## 4. What the logo suggests (use sparingly)
Monoline geometry: hexagon, thin uniform strokes, small circuit nodes. Echo it with:
- 1px hairline borders and 1.5px monoline outline icons (one icon set).
- The **hexagon** as the one signature shape: avatar/team-photo mask, section marker. Not a pattern or background texture.
- Small round "node" dots for timelines and list markers.

## 5. Digital piece sizes (px, from the manual, width x height)
| Piece | Size |
|---|---|
| Slide principal (hero) | 1900 x 600 |
| Slide interno | 1140 x 450 |
| Social post image | 1920 x 1080 |
| Agenda featured image | 709 x 410 |
| Agenda index image | 700 x 246 |
| Bulletin article featured image | 1280 x 720 |
| OpenGraph | 1200 x 630 |
| Email | 800 wide |

Social profile/cover sizes in the manual (Facebook 900x900 / 200x200 / 815x315, Twitter 400x400 / 1500x500 / 1024x512, Instagram 110x110 / 640x640, YouTube 2560x1140 / 250x250) are dated (it references Google Plus and old Twitter). Verify against each platform before producing assets.

## 6. Voice and content (from the manual's social guidelines)
- Aligned with the group's objectives and mission.
- Tone and voice consistent with the brand identity.
- Visual identity applied consistently in every piece.
- Attractive, clear and concise; adapt copy to each platform's space limits.
Proposed voice (not in the manual): institutional but close, short sentences, active verbs, no jargon without a gloss.

## 7. Patterns already on galash.com (from the manual screenshot, low resolution)
Dark hero photo with a wave divider, a headline where one word ("Investigación") is highlighted in Jonquil, top nav (Inicio, Historia, Equipo, Contáctanos) and two outlined Jonquil pill buttons (Iniciar sesión, Quiero registrarme). Keep continuity with this: dark hero moments, single Jonquil highlight. If matching the live site exactly, set `--r-control: 999px` in `tokens.css` (one token flips all controls).

## 8. Theme mapping
- **Light (default for content and app UI):** off-white bg, Eerie black text, Delft Blue headings and links, Jonquil primary buttons with Eerie black text.
- **Dark (heroes, footer, dark mode):** Eerie black bg, near-white text, Jonquil accent, light Glaucous links.
