# Servicios

Registro compartido backend <-> front. Diseno objetivo:
`planificacion_modulos_y_endpoints_galash_is_2026.md` (contrato).
Desviaciones: `docs/mapeo_estado_vs_contrato.md`. Mantenimiento y handoff:
`AGENTS.md` -> Shared contract.

Columnas: `Contrato` = modulo del contrato, `-` = fuera de contrato (motivos al
pie). `Uso` = consumo del front: `[ ]` sin usar, `[x]` usado. Todo endpoint del
contrato ausente de esta tabla NO existe: no construir UI que lo llame; si la
tarea lo necesita, reportar bloqueo. Marcar `[x]` solo al consumir. Agregar
filas o marcar disponible solo con registro/handoff del backend.

## Auth (Go, `:8080`)

Sesion por cookie HttpOnly. `POST /auth/register` crea o sincroniza la cuenta,
independiente de las solicitudes del M3. Requiere `Authorization: Bearer
<FIREBASE_ID_TOKEN>` y `{"nombre","apellido","tipo_dni","dni","email"}`;
sin password ni rol, email igual al token. El rol nuevo es `visitante` y el
re-registro conserva el rol existente. Rutas en `internal/adapters/inbound/http/handler.go`.

| Metodo | Ruta | Descripcion | Contrato | Uso |
|---|---|---|---|---|
| GET | `/health` | salud y bd | - | [ ] |
| POST | `/auth/register` | alta por token | M1 | [x] |
| POST | `/auth/sessions` | crea sesion | M1 | [x] |
| DELETE | `/auth/sessions/current` | cierra sesion | M1 | [x] |
| GET | `/users/me` | perfil y roles | M1 | [x] |
| GET | `/members` | dir. publico | M5 | [x] |
| POST | `/members` | crea perfil | M5 | [ ] |
| GET | `/members/{id}` | detalle público/privado autorizado | M5 | [ ] |
| PATCH | `/members/{id}` | edita perfil | M5 | [ ] |
| PATCH | `/members/{id}/status` | activa o desactiva perfil | M5 | [x] |
| GET | `/members/{id}/publications` | publicaciones visibles | M5 | [ ] |
| GET | `/admin/members` | busq. admin (requiere `q`) | M11 | [x] |
| PUT | `/users/roles` | alias rol | - | [ ] |
| PUT | `/users/{userId}/roles` | asigna rol (id = Firebase UID) | M11 | [x] |
| GET | `/seedbeds` | lista | M2 | [x] |
| POST | `/seedbeds` | crea | M2 | [ ] |
| GET | `/seedbeds/{id}` | detalle | M2 | [ ] |
| GET | `/seedbeds/{id}/space` | vista compuesta | M2 | [x] |
| PATCH | `/seedbeds/{id}` | edita | M2 | [ ] |
| PATCH | `/seedbeds/{id}/visibility` | estado | M2 | [ ] |
| GET | `/seedbeds/{id}/members` | integrantes | M2 | [x] |
| POST | `/seedbeds/{id}/members` | vincula | M2 | [ ] |
| DELETE | `/seedbeds/{id}/members/{userId}` | retiro | M2 | [ ] |
| POST | `/registration-requests` | radica solicitud pública | M3 | [x] |
| GET | `/registration-requests/{id}/status` | consulta propia con token/sesión | M3 | [x] |
| GET | `/admin/registration-requests` | lista administrativa | M3 | [x] |
| GET | `/admin/registration-requests/{id}` | detalle e historial administrativo | M3 | [x] |
| PATCH | `/admin/registration-requests/{id}/status` | actualiza estado y auditoría | M3 | [x] |
| GET | `/seedbeds/{seedbedId}/activities` | lista actividades | M4 | [ ] |
| POST | `/seedbeds/{seedbedId}/activities` | registra actividad | M4 | [ ] |
| GET | `/activities/{id}` | detalle de actividad | M4 | [ ] |
| PATCH | `/activities/{id}` | modifica actividad | M4 | [ ] |
| GET | `/projects` | lista proyectos | M4 | [x] |
| POST | `/projects` | registra proyecto | M4 | [ ] |
| GET | `/projects/{id}` | detalle de proyecto | M4 | [ ] |
| PATCH | `/projects/{id}` | modifica proyecto | M4 | [ ] |
| PATCH | `/projects/{id}/progress` | actualiza avance | M4 | [ ] |
| GET | `/projects/progress` | resumen de avance | M4 | [ ] |
| GET | `/projects/{id}/history` | historial de proyecto | M4 | [ ] |
| GET | `/research-proposals` | lista propuestas | M4 | [ ] |
| POST | `/research-proposals` | registra propuesta | M4 | [ ] |
| GET | `/research-proposals/{id}` | detalle de propuesta | M4 | [ ] |
| PATCH | `/research-proposals/{id}` | modifica propuesta | M4 | [ ] |
| POST | `/research-proposals/{id}/convert-to-project` | convierte propuesta aprobada | M4 | [ ] |
| POST | `/seedbeds/{seedbedId}/reviews` | crea reseña | M4 | [ ] |
| GET | `/admin/seedbed-reviews` | lista reseñas | M4 | [ ] |
| PATCH | `/admin/seedbed-reviews/{id}/moderation` | modera reseña | M4 | [ ] |
| GET | `/events` | agenda pública filtrable; Admin autenticado ve todos los estados | M6 | [x] |
| POST | `/events` | crea evento en borrador | M6 | [x] |
| GET | `/events/{id}` | detalle publicado/autorizado | M6 | [x] |
| PATCH | `/events/{id}` | edita evento | M6 | [x] |
| POST | `/events/{id}/publish` | publica evento | M6 | [x] |
| POST | `/events/{id}/cancel` | cancela evento | M6 | [x] |
| POST | `/events/{id}/hide` | oculta evento | M6 | [x] |

Payloads M4 en camelCase (`id`, `seedbedId`, `responsibleIds`, `memberIds`,
`progress`, ...). `GET /research-proposals/{id}` incluye `history` y
`projectId` (null hasta convertir); el estado de una propuesta solo lo cambia
`Docente`/`Admin`. Los `PATCH` de M4 son parciales: los campos omitidos
conservan su valor. `GET /research-proposals` devuelve todas a
`Docente`/`Admin` y solo propias o como responsable a `Estudiante`.
`GET /admin/seedbed-reviews` lista `pendiente` salvo `?status=`. Ids
malformados o semillero inexistente responden `404`. En `POST
/seedbeds/{seedbedId}/activities`, `status` es opcional si hay `date`: se
calcula (`próxima`, `en curso`, `finalizada`).

M2: los semilleros incluyen `topics` (máx. 4 `{title, phrase}`); en `PATCH
/seedbeds/{id}` omitirlo conserva los temas. `GET /admin/members` responde
`{"users": [...]}`, exige `q` e incluye cuentas inactivas.

M6 usa `title`, `description`, `type`, `startAt`, `endAt`, `venue`, `meetingUrl`,
`imageUrl` y `registrationUrl`. Las fechas son RFC3339; los estados son
`borrador`, `publicado`, `oculto` y `cancelado`. La agenda pública solo muestra
`publicado`; `status=proximo` y `status=vencido` permiten separar eventos según
la fecha de inicio. La escritura requiere sesión de `Docente` o `Admin`; el
docente solo administra sus propios eventos.

Fuera de contrato: `- /health` infraestructura · `- /users/roles` alias de
`PUT /users/{userId}/roles`. `GET /admin/members` responde `400` sin `q`.

## PostgreSQL (Docker, host `5433`)

`database/init.sql` al crear el volumen; vars en `database/.env.example`.

## Ejecucion (backend)

`.env` en la raiz (ver `deploy/auth/.env.example`). `go mod tidy && go run .`
(Auth) o `docker compose up -d --build` (todo). Credencial de Firebase: nunca
al repositorio. Front consume via proxy `/api` -> `http://localhost:8080`.

## Pendiente en contrato (sin implementar)

M1: password-recovery-requests, password-resets (S) | M4 actividades/proyectos/
propuestas/resenas: 19 | M5 completado | M6
eventos: 7 | M7 contenidos: 6 | M8 comunicados: 7 | M9 cronograma: 5 | M10
enlaces: 4 | M11 roles: 6 (roles, permissions, GET users/{userId}/roles,
users/me/dashboard) | M12: audit-logs | M13 files: 2
