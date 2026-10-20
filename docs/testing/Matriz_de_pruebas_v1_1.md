# Matriz de pruebas v1.1 (frontend)
Alcance: solo lo verificable desde la interfaz de usuario (Galash-IS). Persistencia, reglas de backend, base de datos y seguridad de servidor se prueban en Galash-IS-Backend.
Convenciones: HU=historia de usuario; CA=criterios de aceptación observables en la interfaz (formato Dado/cuando/entonces); fecha de HU=2026-09-04 salvo indicación.

## Autenticación y solicitudes (HU-AUTH-*)

### HU-AUTH-01 · Iniciar Sesión · Must
Como usuario registrado
Quiero iniciar sesión con mis credenciales
Para acceder a las funciones autorizadas del sistema.
CA:
- Dado usuario activo y credenciales válidas, cuando envía el formulario, entonces la interfaz muestra el panel correspondiente a su rol.
- Dado usuario o contraseña inválidos, cuando intenta ingresar, entonces la interfaz muestra mensaje claro sin revelar cuál dato falló.
- Dado usuario inactivo, cuando intenta ingresar, entonces la interfaz informa que debe contactar al administrador.
- El formulario valida campos obligatorios antes de enviarse.
- El botón de envío queda deshabilitado y muestra estado de carga mientras se procesa.

### HU-AUTH-02 · Cerrar sesión · Must
Como usuario autenticado
Quiero cerrar sesión
Para proteger mi cuenta al terminar.
CA:
- Cuando selecciona cerrar sesión, entonces la interfaz redirige al acceso público.
- Al volver a una ruta protegida por historial o URL directa, la interfaz exige autenticación.

### HU-AUTH-03 · Recuperar acceso · Should
Como usuario registrado
Quiero recuperar mi contraseña
Para volver a ingresar si la olvido.
CA:
- La interfaz permite solicitar recuperación mediante correo registrado.
- La interfaz muestra el mismo mensaje para correos existentes e inexistentes.
- Un enlace expirado o reutilizado muestra mensaje claro y opción de solicitar uno nuevo.

### HU-AUTH-04 · Gestionar solicitud de registro de estudiante · Must
Como visitante o estudiante interesado
Quiero enviar una solicitud de registro
Para pertenecer al grupo o a un semillero.
CA:
- El formulario solicita datos definidos por GALASH y valida campos obligatorios.
- El semillero de interés es opcional y seleccionable.
- La interfaz confirma radicación, muestra estado inicial Radicada y el dato de seguimiento, sin exponer información privada.

### HU-AUTH-05 · Consultar estado de solicitud · Must
Como solicitante
Quiero consultar el estado de mi solicitud
Para conocer su avance.
CA:
- La interfaz muestra estado actual, fecha de actualización y observaciones autorizadas.
- Estados mínimos visibles: Radicada, En revisión, Aprobada, Rechazada, Pendiente de información.
- Una consulta de solicitud ajena o inexistente muestra mensaje sin datos de otro solicitante.

### HU-AUTH-06 · Supervisar solicitudes en tiempo real · Must
Como administrador
Quiero ver un panel de solicitudes actualizado
Para controlar el proceso interno de registro
CA:
- El panel muestra solicitudes filtrables por estado, fecha, semillero y responsable.
- Cada solicitud muestra trazabilidad de cambios, usuario responsable y fecha.
- Una actualización de estado se refleja en el panel sin requerir recarga manual o informa claramente la necesidad de actualizar.
- La acción de cambio de estado solo aparece a usuarios con permiso.

## Gestión de semilleros

### HU-SEM-01 · Crear y configurar semillero · Must
Como administrador o coordinador
Quiero crear un semillero
Para organizar integrantes, actividades y proyectos.
CA:
- El formulario permite registrar nombre, descripción, línea de investigación, responsable y estado.
- El formulario impide enviar sin nombre ni responsable.
- La interfaz permite publicar, ocultar o marcar como inactivo y muestra el estado resultante.

### HU-SEM-02 · Consultar espacio del semillero · Must
Como visitante o integrante
Quiero consultar el espacio de un semillero
Para conocer su propósito, integrantes, actividades y proyectos
CA:
- El espacio muestra información pública del semillero y sus responsables.
- La interfaz separa proyectos activos, finalizados y radicados.
- La información privada solo aparece a usuarios autorizados.

### HU-SEM-03 · Gestionar integrantes de semillero · Must
Como coordinador
Quiero vincular y retirar integrantes
Para mantener actualizado cada semillero.
CA:
- El coordinador puede buscar usuarios existentes y asignar rol dentro del semillero.
- La interfaz muestra fecha de vinculación y retiro.
- Un integrante retirado aparece en historial y deja de ver acciones operativas del semillero.

### HU-SEM-04 · Registrar actividad de semillero · Must
Como coordinador o profesor
Quiero registrar actividades
Para evidenciar el trabajo realizado.
CA:
- El formulario incluye nombre, descripción, fecha, responsables, estado y evidencias opcionales.
- La interfaz permite consultar actividades próximas, en curso y finalizadas.
- Las acciones de crear o modificar solo aparecen a usuarios autorizados.

### HU-SEM-05 · Gestionar proyecto de investigación · Must
Como profesor o coordinador
Quiero registrar y actualizar proyectos
Para controlar investigación activa, finalizada o radicada.
CA:
- El formulario incluye título, resumen, línea, responsables, integrantes, fechas, estado y porcentaje de avance.
- El campo de porcentaje acepta valores entre 0 y 100 e indica el error fuera de rango.
- Estados mínimos seleccionables: Radicado, Activo, Finalizado.
- La interfaz muestra fecha y autor de cada actualización relevante.

### HU-SEM-06 · Gestionar propuesta de investigación · Should
Como integrante autorizado
Quiero registrar una propuesta
Para someter una nueva investigación a evaluación.
CA:
- El formulario incluye título, problema, objetivos, metodología, responsables y documentos anexos, si aplica.
- La interfaz muestra estado y observaciones de revisión.
- La propuesta convertida en proyecto radicado conserva su historial visible.

### HU-SEM-07 · Consultar avance de proyectos · Must
Como integrante o coordinador
Quiero visualizar porcentaje y estado de avance
Para conocer evolución de cada proyecto.
CA:
- El porcentaje se presenta de forma numérica y visual.
- El avance puede consultarse por proyecto, semillero y periodo.
- La edición del porcentaje solo aparece a responsables autorizados.

### HU-SEM-08 · Publicar reseña de semillero · Could · 2026-09-06
Como usuario registrado
Quiero escribir y enviar una reseña o sugerencia acerca de un semillero
Para aportar retroalimentación que garantice la mejora continua en la construcción del grupo.
CA:
- El perfil del semillero ofrece un formulario de texto accesible para enviar la reseña.
- La interfaz confirma el envío.
- El administrador dispone de una vista para moderar reseñas.

## Eventos, talleres y convocatorias

### HU-EVT-01 · Crear evento · Must
Como administrador o coordinador
Quiero crear un evento
Para anunciar actividades académicas del grupo
CA:
- El formulario incluye título, descripción, tipo, fecha, hora, lugar o enlace virtual, organizador e imagen opcional.
- El formulario valida formato de fecha y hora.
- El evento creado aparece como borrador hasta su publicación.

### HU-EVT-02 · Publicar y actualizar evento · Must
Como administrador
Quiero publicar y actualizar eventos
Para mantener información vigente.
CA:
- Las acciones de publicar, editar, ocultar o cancelar solo aparecen a usuarios con permiso.
- Los eventos publicados muestran fecha de actualización.
- Un evento cancelado sigue visible con su estado.

### HU-EVT-03 · Explorar agenda interactiva · Must
Como visitante
Quiero explorar eventos mediante lista o calendario
Para encontrar actividades de mi interés.
CA:
- La agenda permite filtrar por tipo, fecha y estado.
- El detalle muestra información completa y enlace de inscripción, si existe.
- Eventos vencidos quedan diferenciados de eventos próximos.

## Gestión de integrantes y perfiles

### HU-INT-01 · Gestionar integrante · Must
Como administrador
Quiero crear, editar, activar o desactivar integrantes
Para mantener el directorio institucional actualizado.
CA:
- El formulario distingue estudiante y profesor.
- La interfaz permite asociar integrante con uno o varios semilleros.
- Los datos obligatorios se validan antes de guardar.
- Un perfil desactivado conserva su historial visible para el administrador.

### HU-INT-02 · Consultar perfil público · Must
Como visitante
Quiero consultar perfiles de integrantes, Conocer Artículos y Publicaciones
Para conocer sus roles y experiencia.
CA:
- El perfil muestra únicamente datos públicos.
- El directorio permite buscar y filtrar por tipo, semillero o área.
- El perfil inactivo no aparece en el directorio público.

### HU-INT-03 · Acceder a Cvlac de profesor · Must
Como visitante
Quiero acceder al Cvlac de cada profesor
Para consultar su trayectoria académica.
CA:
- El perfil de profesor muestra enlace Cvlac cuando está registrado.
- El enlace abre la URL externa en una pestaña nueva.
- El administrador puede actualizar o retirar el enlace desde la interfaz.

## Información institucional

### HU-INFO-01 · Consultar información institucional · Must
Como visitante
Quiero consultar historia, objetivos, misión, visión y áreas de conocimiento
Para comprender identidad y alcance de GALASH.
CA:
- Cada contenido aparece en sección identificable y navegable.
- El contenido es legible en dispositivos móviles y escritorio.

### HU-INFO-02 · Gestionar contenido institucional · Must
Como administrador
Quiero editar y publicar contenido institucional
Para mantenerlo vigente.
CA:
- La interfaz permite guardar borrador y publicar sin modificar código.
- La interfaz muestra autor y fecha de actualización.
- El contenido publicado se muestra con formato consistente y sin ejecutar HTML o scripts ingresados.

## Tablero de Comunicados

### HU-COM-01 · Publicar comunicado oficial (Emisor) · Must · 2026-09-07
Como director del grupo de investigación
Quiero publicar un anuncio adjuntando documentos dentro de un tablero centralizado
Para emitir directrices institucionales y evitar el uso de canales de mensajería informales.
CA:
- El formulario permite título, descripción y carga de archivo adjunto (PDF, Word, Excel) e indica formatos no permitidos.
- El director visualiza un panel con el estado de lectura de cada profesor (Ej: Leído / Pendiente).

### HU-COM-02 · Confirmar lectura de documentos (Receptor) · Must · 2026-09-07
Como profesor o encargado de un semillero
Quiero visualizar los comunicados del director y confirmar su recepción
Para mantener el cumplimiento de mis responsabilidades con trazabilidad.
CA:
- El profesor visualiza el comunicado y un botón obligatorio de "Confirmar Lectura".
- Al confirmar, la interfaz muestra fecha y hora de la confirmación y el panel del director refleja el cambio.

## Cronograma

### HU-CRO-01 · Gestionar agendamiento interno · Must · 2026-09-07
Como integrante, profesor o director
Quiero visualizar e interactuar con un cronograma dinámico del grupo
Para planificar reuniones, tutorías o hitos internos de los semilleros.
CA:
- La interfaz presenta un calendario (mensual/semanal) con los eventos internos.
- Profesores y directores pueden crear reuniones definiendo título, fecha, hora y participantes.
- Los estudiantes ven los eventos de su semillero sin acciones de modificación.

## Enlaces, redes y repositorios

### HU-LIN-01 · Consultar enlaces oficiales · Must
Como visitante
Quiero acceder a enlaces oficiales centralizados
Para encontrar plataformas externas del grupo.
CA:
- La interfaz organiza enlaces por categoría: redes sociales, Cvlac, GrupLAC, Minciencias y repositorios.
- Cada enlace muestra nombre, descripción breve y destino.
- Los enlaces ocultos no aparecen en la vista pública.

### HU-LIN-02 · Administrar enlaces externos · Must
Como administrador
Quiero crear, actualizar, ordenar y desactivar enlaces
Para mantener accesos vigentes.
CA:
- El formulario valida formato de URL antes de guardar.
- El administrador puede definir visibilidad y orden desde la interfaz.
- La interfaz muestra usuario y fecha del último cambio.

## Gestión de roles y permisos

### HU-TR-01 · Gestionar roles y permisos · Must
Como administrador
Quiero asignar roles y privilegios
Para limitar acciones según responsabilidad.
CA:
- La interfaz permite asignar, retirar y consultar roles.
- La interfaz no ofrece al usuario la opción de cambiar su propio rol.
- Un rechazo del servidor se muestra con mensaje claro y sin cambiar el rol en pantalla.

### HU-TR-02 · Panel adaptado a permisos · Must
Como usuario autenticado
Quiero ver un panel adaptado a mis permisos
Para acceder rápidamente a mis tareas.
CA:
- El panel no muestra acciones no autorizadas.
- Las rutas protegidas redirigen o muestran acceso denegado ante acceso directo sin permiso.
- El contenido cambia según rol y contexto del usuario.

### HU-TR-03 · Consultar auditoría · Must
Como administrador
Quiero consultar acciones críticas
Para investigar cambios y garantizar trazabilidad.
CA:
- La vista muestra actor, acción, entidad, fecha, resultado y origen disponible.
- La vista no ofrece acciones de edición o eliminación.
- La consulta permite filtrar por actor, acción, entidad y periodo.

## Requisitos no funcionales de interfaz

### HU-NF-01 · Aplicar identidad visual · Must
Como representante de GALASH y UPTC Seccional Sogamoso
Quiero que la interfaz use identidad institucional aprobada
Para comunicar pertenencia y coherencia visual.
CA:
- Colores, logotipos, tipografías e iconografía siguen manual o lineamientos aprobados.
- Contraste y estados visuales permiten lectura accesible.
- La identidad se mantiene en páginas públicas, paneles, formularios y mensajes.

### HU-NF-02 · Usar interfaz responsive y dinámica · Must
Como usuario
Quiero interactuar con una interfaz adaptable
Para usar el sistema desde escritorio, tableta o móvil.
CA:
- Las vistas principales se adaptan a distintos tamaños de pantalla sin desplazamiento horizontal.
- Acciones muestran estados de carga, éxito y error.
- Cambios de datos se reflejan sin comportamientos ambiguos.

### HU-NF-03 · Mantener experiencia moderna y profesional · Must
Como usuario
Quiero una interfaz clara, estética y consistente
Para completar tareas sin fricción.
CA:
- Navegación, botones, formularios y mensajes usan patrones consistentes.
- La interfaz evita saturación visual y prioriza contenido relevante.
- Errores de validación indican campo y corrección requerida.

### HU-NF-04 · Proteger sesión en la interfaz · Must
Como usuario autenticado
Quiero que la interfaz proteja mi sesión y mis datos
Para evitar exposición en el navegador.
CA:
- Una sesión expirada o rechazada (401) lleva al acceso público con mensaje claro.
- Datos personales se muestran según permisos.
- La interfaz no guarda contraseñas ni muestra tokens en pantalla, URL o consola.

### HU-NF-05 · Navegación y rutas · Must
Como usuario
Quiero que la navegación sea predecible
Para no perderme en el sitio.
CA:
- Una ruta inexistente muestra una página o redirección clara.
- Los enlaces del menú y del pie llevan a la sección indicada.
- Error de red o del servidor muestra mensaje recuperable sin pantalla en blanco.

### HU-NF-06 · Accesibilidad · Must
Como usuario con tecnologías de apoyo
Quiero operar la interfaz con teclado y lector de pantalla
Para usar el sistema sin barreras.
CA:
- Todo control interactivo es alcanzable con teclado y tiene foco visible.
- Formularios tienen etiquetas asociadas y mensajes de error anunciados.
- Contenido animado o en movimiento puede pausarse y respeta `prefers-reduced-motion`.

# Pruebas funcionales de interfaz
Para cada fila: Historia=HU-<sufijo del ID>. Estado inicial: Pendiente en todas. Evidencia esperada: captura o video del navegador, ruta, perfil y resultado.
|ID|Tarea o prueba específica|Responsable sugerido|Reporte requerido|
|---|---|---|---|
|PT-AUTH-01|Ejecutar inicio de sesión con campos vacíos, credenciales inválidas, usuario inactivo y cuentas válidas de cada rol.|QA funcional|Reporte con perfil, datos usados, mensaje mostrado, panel obtenido o rechazo, captura y defecto asociado.|
|PT-AUTH-02|Cerrar sesión y comprobar redirección y bloqueo de rutas protegidas por historial o URL directa.|QA funcional|Reporte con ruta protegida, resultado de redirección y captura.|
|PT-AUTH-03|Solicitar recuperación con correo existente e inexistente y abrir enlace válido, expirado y reutilizado.|QA funcional|Reporte con mensajes públicos mostrados, resultado del enlace y captura sin correos reales.|
|PT-AUTH-04|Enviar solicitudes incompletas y completas, con y sin semillero, y verificar validaciones y confirmación.|QA funcional|Reporte con campos, datos anonimizados, mensajes, estado mostrado y captura.|
|PT-AUTH-05|Consultar solicitud propia en cada estado y una ajena o inexistente.|QA funcional|Reporte con solicitud consultada, datos visibles, mensaje y captura.|
|PT-AUTH-06|Filtrar solicitudes, cambiar estado con y sin permiso y observar la actualización del panel.|QA funcional|Reporte con filtros, cambio realizado, actor, tiempo de actualización observado y captura.|
|PT-SEM-01|Crear semillero válido, intentar sin nombre o responsable y probar publicación, ocultamiento e inactivación.|QA funcional|Reporte con datos, validaciones, estados mostrados y captura.|
|PT-SEM-02|Consultar semillero como visitante e integrante y comparar información visible y clasificación de proyectos.|QA funcional|Reporte con perfil, contenido visible, datos ocultos, estados de proyectos y captura.|
|PT-SEM-03|Vincular y retirar integrante y comprobar fechas, historial y acciones visibles antes/después.|QA funcional|Reporte con usuario de prueba, rol, fechas, acciones visibles antes/después y captura.|
|PT-SEM-04|Crear y editar actividades con y sin evidencia, consultar por estado y comprobar acciones visibles por perfil.|QA funcional|Reporte con datos, estado mostrado, evidencia adjunta, perfil y captura.|
|PT-SEM-05|Registrar proyecto, probar porcentajes dentro y fuera de rango, cambiar estados y ver autoría y fecha.|QA funcional|Reporte con valores probados, mensajes, estado, historial mostrado y captura.|
|PT-SEM-06|Registrar propuesta con y sin anexos, ver observaciones y convertirla a proyecto radicado.|QA funcional|Reporte con documentos de prueba, estados mostrados, conversión, historial y captura.|
|PT-SEM-07|Consultar avance por proyecto, semillero y periodo y comprobar edición por responsable y no responsable.|QA funcional|Reporte con filtros, porcentaje numérico/visual, perfil, acción disponible y captura.|
|PT-SEM-08|Enviar reseña desde el perfil del semillero y moderarla como administrador.|QA funcional|Reporte con reseña de prueba, confirmación, vista de moderación y captura.|
|PT-EVT-01|Crear eventos presenciales y virtuales, probar fecha/hora inválidas, adjuntar imagen y verificar borrador.|QA funcional|Reporte con modalidad, datos, validaciones, estado mostrado y captura.|
|PT-EVT-02|Publicar, editar, ocultar y cancelar evento con administrador y verificar ausencia de acciones sin permiso.|QA funcional|Reporte con acción, actor, fecha de actualización mostrada, estado y captura.|
|PT-EVT-03|Explorar agenda en lista y calendario, aplicar filtros, abrir detalle y diferenciar vencidos y próximos.|QA funcional y usabilidad|Reporte con filtros, evento consultado, enlace de inscripción, dispositivo y captura.|
|PT-INT-01|Crear y editar perfiles de estudiante y profesor, asociar semilleros, validar obligatorios y desactivar.|QA funcional|Reporte con tipo, asociaciones, validaciones, estado antes/después y captura.|
|PT-INT-02|Consultar directorio, buscar y filtrar perfiles y verificar campos públicos y exclusión de inactivos.|QA funcional y privacidad|Reporte con filtros, campos observados, perfil inactivo y captura.|
|PT-INT-03|Abrir, actualizar y retirar enlaces Cvlac de perfiles de profesor.|QA funcional|Reporte con URL de prueba, apertura externa, cambios, visibilidad final y captura.|
|PT-INFO-01|Navegar por todos los contenidos institucionales como visitante en móvil, tableta y escritorio.|QA funcional y responsive|Reporte con secciones, dispositivo, navegador, legibilidad y capturas.|
|PT-INFO-02|Guardar borrador, publicar y consultar contenido institucional; ingresar HTML/script y verificar que no se ejecuta.|QA funcional|Reporte con estado, autor y fecha mostrados, contenido renderizado y captura.|
|PT-COM-01|Publicar comunicado con adjunto permitido y no permitido y revisar panel de lectura.|QA funcional|Reporte con archivo de prueba, mensajes, estado de lectura por profesor y captura.|
|PT-COM-02|Confirmar lectura como profesor y verificar actualización en el panel del director.|QA funcional|Reporte con comunicado, fecha/hora mostrada, panel antes/después y captura.|
|PT-CRO-01|Ver calendario mensual y semanal, crear reunión como profesor y verificar vista de solo lectura del estudiante.|QA funcional|Reporte con vista, reunión de prueba, perfil, acciones disponibles y captura.|
|PT-CON-01|Enviar formulario de contacto válido e inválido y repetir envíos rápidamente.|QA funcional|Reporte con datos anonimizados, validaciones, mensaje de confirmación o límite y captura.|
|PT-LIN-01|Consultar categorías de enlaces, abrir destinos y verificar que enlaces ocultos no aparecen.|QA funcional y navegación|Reporte con categoría, destino, visibilidad y captura.|
|PT-LIN-02|Crear, editar, ordenar, ocultar y desactivar enlaces con URL válida e inválida.|QA funcional|Reporte con URLs probadas, mensajes, orden y visibilidad resultantes y captura.|
|PT-TR-01|Asignar, consultar y retirar roles; verificar que el usuario no puede cambiar su propio rol desde la interfaz.|QA funcional|Reporte con matriz esperada/observada, mensajes y captura.|
|PT-TR-02|Iniciar sesión con cada rol, comparar paneles y abrir por URL directa rutas no permitidas.|QA funcional y autorización|Reporte con menú esperado/observado, rutas probadas, resultado y capturas.|
|PT-TR-03|Filtrar auditoría y verificar ausencia de acciones de edición o eliminación.|QA funcional|Reporte con filtros, columnas mostradas, acciones disponibles y captura.|
|PT-NF-01|Comparar páginas, paneles, formularios y mensajes con la identidad visual aprobada y revisar contraste.|QA visual y accesibilidad|Informe de conformidad visual con referencia, elemento, resultado, contraste y captura antes/después.|
|PT-NF-02|Recorrer vistas en móvil, tableta y escritorio con conexión normal y lenta; comprobar estados de carga, éxito y error.|QA responsive|Reporte con dispositivo, resolución, navegador, latencia, estado de interfaz y capturas.|
|PT-NF-03|Completar flujos principales, provocar errores y revisar consistencia de navegación, botones, formularios y mensajes.|QA de usabilidad|Reporte con flujo, error provocado, mensaje, hallazgo, severidad y captura.|
|PT-NF-04|Forzar sesión expirada o 401, revisar datos visibles por permiso y buscar tokens o contraseñas en URL, consola y almacenamiento del navegador.|QA funcional y seguridad|Informe con control evaluado, resultado, riesgo y evidencia no sensible.|
|PT-NF-05|Abrir ruta inexistente, recorrer enlaces de menú y pie, y simular error de red o servidor.|QA funcional|Reporte con ruta, destino esperado/observado, mensaje mostrado y captura.|
|PT-NF-06|Recorrer flujos Must solo con teclado y lector de pantalla y activar `prefers-reduced-motion`.|QA de accesibilidad|Informe con control, foco, etiqueta, anuncio, movimiento y captura.|

# Pruebas de Diseño
|ID|Tarea o prueba específica|Relación con matriz|Responsable sugerido|Estado inicial|Reporte requerido|
|---|---|---|---|---|---|
|TD-T01|Evaluar diagramas de casos de uso frente a actores, objetivos y permisos definidos.|TD-01, TD-02, TD-04, TD-10|Analista funcional y diseñador UX|En curso|Matriz de revisión con diagrama, actor, caso de uso, inconsistencia encontrada, decisión y versión corregida.|
|TD-T02|Revisar que cada flujo principal tenga inicio, pasos, resultado, cancelación y recuperación de error.|TD-02, TD-03, TD-06, TD-09|Diseñador UX y líder técnico|En curso|Ficha de flujo con objetivo, precondiciones, recorrido, pantallas, puntos de abandono y acciones de mejora.|
|TD-T03|Verificar arquitectura de información, menú, nombres de secciones y rutas de navegación.|TD-01, TD-05|Diseñador UX|Pendiente|Reporte de navegación con tarea, ruta esperada, ruta observada, tiempo, dificultad y recomendación.|
|TD-T04|Revisar wireframes y prototipos de páginas públicas, paneles y formularios.|TD-04, TD-05, TD-06, TD-11|Diseñador UX y representante funcional|ok|Lista de hallazgos por pantalla: componente, problema, impacto, severidad, captura y corrección propuesta.|
|TD-T05|Comparar identidad visual: colores, logotipos, tipografías, iconos, espaciado y tono.|TD-11, TD-14|Diseñador UI y representante GALASH-UPTC|ok|Informe de conformidad visual con referencia del manual, elemento evaluado, resultado y evidencia antes/después.|
|TD-T06|Probar formularios con datos válidos, campos vacíos, formatos incorrectos y mensajes de error.|TD-03, TD-06, TD-09|QA y diseñador UX|Pendiente|Reporte de formulario con campo, dato usado, mensaje esperado, mensaje obtenido, resultado y captura.|
|TD-T07|Evaluar estados de carga, vacío, éxito, error, guardado, publicación, cancelación y sesión expirada.|TD-09|Diseñador UX y desarrollador frontend|Pendiente|Catálogo de estados con pantalla, condición, mensaje, acción disponible, resultado y estado de aprobación.|
|TD-T08|Comprobar panel y acciones según rol: visitante, estudiante, profesor, coordinador y administrador.|TD-04, TD-10|Analista funcional y QA|Pendiente|Matriz rol-permiso con acción, visibilidad esperada, acceso observado, evidencia y defecto asociado.|
|TD-T09|Evaluar diagramas y prototipos en móvil, tableta, escritorio y cambio de orientación.|TD-07|QA de interfaz y diseñador UI|Pendiente|Reporte responsive con dispositivo, resolución, navegador, pantalla, problema visual, severidad y captura.|
|TD-T10|Ejecutar navegación completa con teclado y revisión de foco, etiquetas, contraste y lector de pantalla.|TD-08|QA de accesibilidad|Pendiente|Informe WCAG con criterio revisado, componente, resultado, evidencia, impacto y corrección recomendada.|
|TD-T11|Realizar prueba moderada con cinco usuarios representativos sobre tareas Must.|TD-12|Investigador UX|Pendiente|Reporte de sesión anonimizado con tarea, perfil, éxito, tiempo, errores, comentario, hallazgo y prioridad.|
|TD-T12|Presentar prototipo o incremento en reunión interna dos veces por semana.|TD-13, TD-14|Líder de proyecto|Pendiente|Acta breve con fecha, asistentes, pantallas revisadas, decisiones, pendientes, responsable y fecha compromiso.|
|TD-T13|Validar prototipo o incremento con cliente cada dos o tres semanas.|TD-13|Líder de proyecto y representante funcional|Pendiente|Acta de validación con requisito, observación del cliente, aprobación o cambio solicitado, prioridad y responsable.|
|TD-T14|Comparar versión nueva contra pantallas aprobadas después de cada cambio relevante.|TD-14|QA visual|Pendiente|Reporte de regresión visual con versión base, versión evaluada, pantalla, diferencia, justificación y resultado.|
|TD-T15|Consolidar hallazgos, asignar severidad y verificar correcciones.|TD-08, TD-09, TD-10, TD-14|QA líder y líder de proyecto|Pendiente|Registro de hallazgos con ID, descripción, evidencia, severidad, responsable, fecha objetivo, estado y prueba de cierre.|

# Pruebas de Usabilidad
Estado inicial: Pendiente en todas.
|ID|Tarea o prueba específica|Relación con matriz|Responsable sugerido|Reporte requerido|
|---|---|---|---|---|
|TU-T01|Preparar guiones, criterios de éxito, perfiles, datos anonimizados y tiempos objetivo.|TU-01 a TU-15|Investigador UX y analista funcional|Plan de sesión con historia, tarea, perfil, precondiciones, métrica, consentimiento y versión.|
|TU-T02|Ejecutar inicio, cierre y recuperación de sesión con perfiles representativos.|TU-01|Investigador UX y QA|Reporte con pasos, éxito, tiempo, errores, ayuda requerida, comentario y evidencia anonimizada.|
|TU-T03|Probar radicación y consulta de solicitud con errores y estados distintos.|TU-02|Investigador UX y QA funcional|Reporte con campos problemáticos, tasa de éxito, tiempo, abandono, hallazgos y recomendación.|
|TU-T04|Evaluar comprensión del panel y acciones por rol.|TU-03, TU-11|Investigador UX y analista funcional|Matriz de comprensión por rol con tarea, acción identificada, error, permiso entendido y evidencia.|
|TU-T05|Observar consulta y gestión de semilleros, integrantes, proyectos y propuestas.|TU-04, TU-05|Investigador UX y representante funcional|Reporte de recorrido con ruta, pasos, bloqueos, datos perdidos, comentarios y prioridad.|
|TU-T06|Probar creación, publicación, consulta y filtrado de eventos.|TU-06|Investigador UX y QA|Reporte de agenda con tarea, dispositivo, éxito, filtros, tiempo, errores y capturas.|
|TU-T07|Evaluar búsqueda de perfiles, Cvlac, contenido, contacto y enlaces.|TU-07, TU-08, TU-09|Investigador UX|Informe de descubribilidad con tarea, ruta, tiempo, dificultad, resultado y recomendación.|
|TU-T08|Provocar validaciones, estados vacíos, carga lenta, error de red y cancelación.|TU-10|Investigador UX y frontend|Catálogo de recuperación con condición, mensaje, acción, resultado y evidencia.|
|TU-T09|Realizar prueba de privacidad visible y comprensión de permisos.|TU-11|Investigador UX y seguridad|Reporte de privacidad percibida con vista, dato, interpretación, riesgo y corrección.|
|TU-T10|Ejecutar tareas Must con teclado, zoom y tecnologías de apoyo disponibles.|TU-12|QA de accesibilidad e investigador UX|Informe de accesibilidad con control, foco, etiqueta, bloqueo, criterio y evidencia.|
|TU-T11|Repetir tareas prioritarias en móvil, tableta, escritorio y orientaciones.|TU-13|QA responsive e investigador UX|Reporte comparativo con tarea, resolución, éxito, tiempo, problema y captura.|
|TU-T12|Aplicar encuesta posterior y entrevista sobre confianza, claridad y satisfacción.|TU-14|Investigador UX|Resumen anonimizado con métricas, comentarios agrupados, patrones y acciones.|
|TU-T13|Repetir tareas después de correcciones y comparar con línea base.|TU-15|QA líder e investigador UX|Reporte de regresión con versiones, métricas, hallazgos cerrados y resultado.|
|TU-T14|Consolidar hallazgos por frecuencia, impacto, perfil, dispositivo y severidad.|TU-01 a TU-15|QA líder y líder de proyecto|Registro con ID, descripción, evidencia, frecuencia, severidad, responsable, fecha y estado.|
