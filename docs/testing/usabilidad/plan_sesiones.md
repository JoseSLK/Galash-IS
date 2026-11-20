# Plan de sesiones de usabilidad — TU-T01 (versión 1.0, 16/11/2026)

Este plan también sirve como guion de la prueba moderada **TD-T11** (cinco
usuarios representativos sobre tareas Must).

**Estado: Pendiente – requiere sesión humana.** Este documento prepara las
sesiones. Todavía no se ha ejecutado ninguna, y no contiene resultados ni
métricas.

## 1. Objetivo y alcance

- Comprobar que cada perfil completa sus tareas Must sin ayuda, en el tiempo
  objetivo y entendiendo lo que puede y no puede hacer.
- Versión evaluada: la rama `main` desplegada en el ambiente de pruebas, con
  la API conectada a una base de **datos sintéticos**
  (`database/seed/synthetic.sql` del backend). No se usan datos reales.

## 2. Participantes

| Perfil | Cantidad | Criterio de selección |
|---|---|---|
| Visitante sin cuenta | 1 | No conoce GALASH |
| Estudiante (integrante) | 1 | Pertenece o quiere pertenecer a un semillero |
| Docente (director de semillero) | 1 | Dirige un semillero |
| Delegado | 1 | Estudiante con delegación activa |
| Administrador | 1 | Gestiona usuarios y contenidos |

Cada participante usa una cuenta de prueba preparada para su perfil, del
proyecto Firebase de pruebas. Las credenciales se entregan en persona y no se
registran en ningún documento.

## 3. Consentimiento

Antes de empezar se lee y se firma el formato de consentimiento
(sección 8). Sin consentimiento firmado no hay sesión. La participación es
voluntaria y la persona puede retirarse en cualquier momento. No se graba la
cara ni la voz: solo la pantalla, y solo si la persona lo autoriza.

## 4. Tareas

Tiempo objetivo = tiempo de un usuario experto × 3, redondeado. Criterio de
éxito: la tarea termina en el estado indicado, sin intervención del moderador.

| ID | Historia / TU | Perfil | Tarea (lo que se lee al participante) | Precondición | Éxito | Tiempo objetivo |
|---|---|---|---|---|---|---|
| S01 | HU-AUTH-01 / TU-T02 | Todos con cuenta | «Entra a GALASH con tu cuenta y luego cierra la sesión.» | Sesión cerrada | Ve su nombre en el menú y después vuelve a «Iniciar sesión» | 60 s |
| S02 | HU-AUTH-04 / TU-T03 | Visitante | «Quieres unirte a un semillero. Envía tu solicitud.» | Cuenta sin solicitud | Ve «Tu solicitud fue radicada» y el código | 5 min |
| S03 | HU-AUTH-05 / TU-T03 | Visitante | «Consulta en qué estado está tu solicitud.» | Solicitud radicada | Ve el estado y la fecha | 90 s |
| S04 | TU-T04 | Todos | «Dime qué puedes hacer desde tu menú de cuenta.» (pensar en voz alta) | Sesión iniciada | Nombra las acciones de su rol sin mencionar las de otro | 60 s |
| S05 | HU-SEM-01 / TU-T05 | Visitante | «Encuentra qué investiga el semillero X y quién lo dirige.» | — | Llega a la ficha y lee la línea y el director | 90 s |
| S06 | HU-INT-03 / TU-T07 | Visitante | «Busca el CvLAC de la profesora Daniela Ríos.» | Perfil con CvLAC | Abre el enlace CvLAC | 90 s |
| S07 | HU-EVT-03 / TU-T06 | Estudiante | «¿Qué talleres hay el próximo mes?» | Eventos publicados | Filtra o identifica los talleres próximos | 2 min |
| S08 | HU-EVT-01 / TU-T06 | Docente | «Crea una noticia de tu semillero y publícala.» | Docente director | La noticia aparece publicada | 4 min |
| S09 | HU-AUTH-06 / TU-T05 | Delegado | «Revisa las postulaciones de tu semillero y pide más información a una.» | Solicitud radicada en su semillero | Estado «Pendiente de información» con observación | 3 min |
| S10 | HU-TR-01 / TU-T04 | Administrador | «Cambia el rol de la cuenta de prueba Camila a Docente.» | Cuenta sintética activa | Rol actualizado | 2 min |
| S11 | TU-T08 | Estudiante | Con la red lenta (DevTools: «Slow 3G»): «Abre Proyectos.» | — | Entiende que la página está cargando y no abandona | — |
| S12 | TU-T09 | Visitante | «¿Qué datos de los integrantes puede ver cualquier persona?» | — | Explica correctamente lo que es público y lo que es privado | — |
| S13 | TU-T10 | Uno con teclado | Repetir S05 y S06 solo con teclado y con zoom al 200 % | — | Termina sin ratón | 2× el tiempo de S05/S06 |
| S14 | TU-T11 | Uno en móvil | Repetir S02 y S07 en un teléfono, en vertical y en horizontal | — | Termina en ambas orientaciones | Igual que la tarea original |

## 5. Métricas por tarea

Éxito (sí / con ayuda / no), tiempo en segundos, número de errores, ayudas
pedidas, puntos de abandono y una cita textual relevante (sin datos
personales). Al final de la sesión se aplica la encuesta SUS adaptada
(`encuesta_sus.md`).

## 6. Desarrollo de cada sesión (45 min)

1. Bienvenida, consentimiento y explicación de pensar en voz alta (5 min).
2. Tareas de su perfil en el orden de la tabla (30 min). El moderador no
   ayuda; si la persona lleva el doble del tiempo objetivo, se marca «no» y se
   pasa a la siguiente tarea.
3. Encuesta SUS y entrevista breve sobre confianza y claridad (10 min).

## 7. Registro

Se usa `plantilla_registro.md`. Cada participante se identifica solo con un
código (`P1`…`P5`). Los resultados van a
`docs/testing/evidence/<run-id>/usabilidad/` y al ledger como `run` + `result`
de cada tarea (TU-T02 a TU-T12). TU-T13 repite las tareas que fallen después
de las correcciones y las compara con esta línea base. TU-T14 consolida los
hallazgos por frecuencia y severidad.

## 8. Formato de consentimiento

> Acepto participar voluntariamente en una prueba de usabilidad de GALASH. Entiendo que
> se evalúa el sistema y no a mí; que puedo detenerme en cualquier momento; que solo se
> registran mis acciones en pantalla y mis comentarios, identificados con un código y
> sin mi nombre; que no se graba mi cara ni mi voz; y que los datos se usan únicamente
> para mejorar el sistema y se eliminan al cerrar el proyecto.
>
> Código del participante: ____  Fecha: ____  Firma: ____________
>
> Autorizo grabar la pantalla: ☐ Sí ☐ No
