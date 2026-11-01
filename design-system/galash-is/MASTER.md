# GALASH-IS · Design System MASTER

Fuente de verdad de marca: skill `minimal-system` (`DESIGN.galash.md`, `tokens.css`).
Este archivo registra las decisiones del refresh visual (rama `feat/refresh-visual`)
y las desviaciones aprobadas respecto a la marca. `ui-ux-pro-max` solo asesora.

Comparaciones: `docs/design/refresh-visual-direcciones.html`,
`docs/design/refresh-visual-tipografia.html`.

## Base

- Tema oscuro. Fondo `#0A1420` (navy), superficie `#102332`.
- Texto `#C3CCD4`, texto fuerte `#FFFFFF`, muted `#8FA1AD`.
- Bordes: blanco 12% (sutil) y 28% (fuerte). Se elimina la menta `#9BE8B8` en todos sus roles.
- UI en español, accesible (axe sin violaciones), ancho mínimo 320px.

## Color por rol

| Rol | Valor | Regla |
|---|---|---|
| accent | Jonquil `#F7C500` | Único amarillo. Reemplaza `#F5C518`. |
| accent-fg | navy `#0A1420` (11.41:1) | Desviación: la marca indica Eerie black `#1E1A17`. |
| link | `#B4BEDA` (9.98:1 / 8.65:1) | Solo enlaces de texto, siempre subrayados. |
| focus | `#FFFFFF` + halo navy | `outline: 2px solid; outline-offset: 2px; box-shadow: 0 0 0 2px #0A1420`. |
| secondary | Glaucous `#7785AC` (5.06:1 sobre navy) | Gráficos, íconos y números repetidos; solo texto grande o UI. Agregado en el Lote 2 para no repetir Jonquil. |
| success | neutro + check + texto | Desviación: la marca indica relleno Celadon `#A5E6BA`. Se descarta por ser casi idéntico a la menta. |
| pending | neutro, borde punteado `#8FA1AD` + reloj + texto | Sin amarillo. |
| danger | `#FF8F8A` (8.42:1), borde sólido + triángulo + texto | Sin cambios. |

Ningún estado depende solo del color. Pendiente, error y éxito se distinguen
en escala de grises por borde, ícono y texto.

## Jonquil: uso funcional (estricto)

- Una sola acción primaria por vista: botón relleno Jonquil con texto navy.
- Estado seleccionado: solo el más importante de cada grupo (pestaña o filtro activo),
  acompañado de una forma (subrayado de 3px o borde), nunca solo color.
- Prohibido en bordes de tarjetas, hover, chips de estado, íconos pequeños,
  degradados, glow y texto menor a 24px.

## Jonquil: uso expresivo

Jonquil puede aparecer en elementos grandes y decorativos que no son interactivos:

| Elemento | Límite |
|---|---|
| Números o palabras del hero | Una palabra o cifra por hero, de 32px o más. |
| Nodo activo del grafo (d3) | Solo el nodo activo o enfocado, uno a la vez. Los demás nodos y aristas no usan Jonquil. |
| Subrayado de títulos | Barra de 3–4px bajo el `h1` o los `h2` de sección. Máximo una por sección. |
| Línea del botón specular | Solo la línea del borde. El relleno sigue siendo navy y el texto blanco. No cuenta como acción primaria. |

Límites comunes:

- Máximo un uso expresivo por sección visible, además de la acción primaria.
- Nunca dentro del mismo componente que la acción primaria.
- Nunca para comunicar estado ni para indicar que algo es interactivo.
- Sin glow, sombras de color ni degradados.

## Eyebrow (etiqueta sobre títulos)

Regla única para la app, las tablas y los pies de foto:

- Color muted `#8FA1AD` (6.94:1 sobre navy). Nunca Jonquil.
- IBM Plex Mono 500, 12px mínimo, mayúsculas, `letter-spacing: .12em`.
- Se elimina `--font-label` (Arial Narrow): no es fuente web y en Linux o Android cae a otra fuente.

## Tipografía

P2, elegida el 2026-11-01. Es una evolución de marca registrada en `minimal-system`
(`references/galash-brand.md`, sección 2).

| Rol | Fuente | Pesos cargados | Token |
|---|---|---|---|
| Títulos | Sora | 600 | `--fuente-titulo` / `--font-display` |
| Cuerpo | IBM Plex Sans | 400, 600 | `--fuente-texto` / `--font-body` |
| Etiquetas, códigos, datos | IBM Plex Mono | 500 | `--galash-mono` |

- Se cargan con `<link>` + `preconnect` en `src/index.html`; no se usa `@import`.
- Un `font-weight` declarado que no está cargado se dibuja con el peso más cercano,
  sin negrita sintética (comprobado en Chromium): 700 → 600, 300 → 400, mono 600 → 500.

## Rechazado

Menta en cualquier rol, segundo amarillo, verde para éxito, glow, glassmorphism,
degradados decorativos y texto de menos de 12px.
