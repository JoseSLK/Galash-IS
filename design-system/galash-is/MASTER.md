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
| wave | `#3D7BE0` (azul saturado, 4.51:1 sobre navy) | **DECORATIVO**: solo el shader y la grilla del hero del Home. Prohibido en botones, texto, enlaces, estados, bordes y nodos del grafo. No es un acento. |
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
| Palabra destacada en un `h2` de sección | Una por sección, solo mientras el `h2` mide 32px o más, y lejos del primario (no en la misma sección que un botón Jonquil). Si el `h2` mide menos de 32px en algún ancho, en ese ancho la palabra va en blanco (`--galash-text-strong`). Decisión del 2026-11-01. |
| Nodo activo del grafo (d3) | Solo el nodo activo o enfocado, uno a la vez. Los demás nodos y aristas no usan Jonquil. |
| Subrayado de títulos | Barra de 3–4px bajo el `h1` o los `h2` de sección. Máximo una por sección. |
| Línea del botón specular | Solo la línea del borde. El relleno sigue siendo navy y el texto blanco. No cuenta como acción primaria. |

Excepción nombrada (2026-11-01): la palabra "GALASH" del `h1` del hero del Home
puede ir en Jonquil aunque comparta `.hero-copy` con el botón primario relleno.
Solo aplica a ese elemento; no es una regla general. Se separa visualmente del
botón con el subtítulo intermedio más un margen extra en el CTA.

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

## Fondo del hero (la ola)

La cinta ondulada y la grilla del shader del hero usan azules, sin grises:
`--galash-wave` mezclado como máximo un 15% con `--galash-link`; grano, líneas
de escaneo y viñeteo se tiñen hacia el azul o el navy, nunca hacia gris neutro.
La cresta medida es `#1B3152` (HSL 216°/51%/21%; antes `#4B566B`, 18% de
saturación). Su intensidad (`WAVE_GAIN`) está limitada para que el texto muted
`#8FA1AD` conserve 4.5:1 o más sobre la parte más brillante de la cinta (4.90:1
medido a 320px). Los colores salen de los tokens con `cssColor()` como constantes
GLSL. Excepción del 2026-11-06 por petición explícita: el fondo del inicio mantiene
el movimiento automático incluso con `prefers-reduced-motion: reduce`. Se pausa
fuera de pantalla o con la pestaña oculta y conserva el límite de 30 fps.
Para reducir tirones de entrada, el buffer interno se limita a 1280×720 píxeles
(con pixel ratio máximo 1), el shader se prepara antes del bucle y las
imágenes apilables cargan sus librerías solo al acercarse al viewport.

## Exploraciones descartadas

- Intensidad del Home (2026-11-01): bloque Jonquil a ancho completo, bandas de
  azul saturado, título del hero gigante y duotono navy/Jonquil. Se descartó
  visualmente; queda como referencia en la etiqueta `explore/intensidad-descartada`.

## Rechazado

Menta en cualquier rol, segundo amarillo, verde para éxito, glow, glassmorphism,
degradados decorativos y texto de menos de 12px.
