# PT-NF-01 — Conformidad con §11.4.2 (TD-T05) del informe

Fuente observada: `computed-<dispositivo>.json` (estilos computados en 8 pantallas
públicas, desktop/tablet/mobile) y `styles.scss`. Capturas `*.png` en esta carpeta.

| Elemento | §11.4.2 | Observado | Resultado |
|---|---|---|---|
| Fuente de títulos | Signika | Sora (todas las pantallas) | No conforme |
| Fuente de texto | Open Sans | IBM Plex Sans (todas las pantallas) | No conforme |
| Fuentes cargadas (máx. 3) | 2 | 3: Sora, IBM Plex Sans, IBM Plex Mono | Conforme (≤ 3) |
| Fondo principal Eerie Black | #1E1A17 | #0A1420 (`--galash-bg`) | No conforme |
| Acento Jonquil (CTA) | #F7C500 | #F7C500 (`--galash-accent`) | Conforme |
| Delft Blue | #3D405B | no usado; superficies #102332 | No conforme |
| Glaucous | #7785AC | #7785AC (`--galash-secondary`) | Conforme |
| Celadon | #A5E6BA | no definido como token | No conforme |
| Grey / Dim Grey (texto) | #7C7C7C / #767171 | #C3CCD4 / #8FA1AD | No conforme |
| Consistencia entre pantallas | — | 1 fuente de títulos y 1 de texto en las 8 pantallas | Conforme |

Conclusión: la UI es consistente internamente, pero se aparta de la paleta y la
tipografía aprobadas en §11.4.2. Los cambios de paleta aparecen en la bitácora
(p. ej. `fondo-azul-cta-semilleros-20261110`), pero no hay una decisión que
actualice el manual. Se registra el defecto D004 para que el equipo decida si
actualiza §11.4.2 o la interfaz.
