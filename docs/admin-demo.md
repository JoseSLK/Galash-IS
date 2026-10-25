# Administración demo

La ruta `/administracion-demo` muestra personas ficticias y permite simular cambios
de rol y estado únicamente en memoria. Se accede desde el menú de cuenta y no
sustituye a `/administracion`, su guard ni la autorización del backend.

## Configuración de la cuenta

En `src/environments/environment.ts` (ignorado por Git), añadir la propiedad
opcional `adminDemoAccountEmail` con el correo de la cuenta de pruebas autorizada.
Si el objeto tiene una anotación de tipo, incluir también esa propiedad opcional.
No guardar el correo ni identificadores personales en archivos versionados.

Sin configuración, no se muestra el enlace ni se permite entrar. La cuenta debe
tener correo verificado en Firebase y una sesión activa del backend. El acceso
demo no modifica el rol mostrado en Mi cuenta ni concede permisos administrativos.

La ruta también se incluye en la compilación de producción para las revisiones
publicadas solicitadas. El responsable del despliegue debe suministrar la misma
configuración en su entorno antes de compilar. El correo configurado no es un
secreto ni una autorización del backend; solo habilita una interfaz ficticia.

## Componentes y comportamiento

- `PeopleDirectoryComponent`: recibe personas, selección y modo de visualización;
  emite el identificador seleccionado. Busca, filtra, ordena y pagina con signals.
- El modo público predeterminado muestra solo cuentas activas, busca por nombre
  y omite correos y filtros internos. El consumidor debe proporcionar únicamente
  datos autorizados para publicación.
- El modo de gestión requiere rol Admin real o acceso demo autorizado; solo este
  último se conecta aquí a personas ficticias y al editor en memoria.
- `DemoUsersService` pertenece a la página: los cambios se descartan al salir o
  recargar. No usa almacenamiento local ni envía escrituras a servicios externos.
- Los roles son Visitante, Estudiante, Docente y Admin. Un responsable de semillero
  no constituye un rol adicional.

## Solicitudes de ingreso (demostración)

El selector del título permite alternar entre Usuarios y roles y Solicitudes de
ingreso. Las solicitudes tienen contadores, filtros y un detalle en diálogo modal
centrado, con historial y los 15 datos obligatorios del formulario público.

Todas las solicitudes pendientes permiten decidir. Aprobar admite una observación
opcional; Rechazar exige un motivo no vacío, hasta 1000 caracteres. La decisión
actualiza la tabla, el historial y los contadores en memoria. Las solicitudes
resueltas se consultan sin volver a decidir. No se crea ni activa una cuenta real.
La interfaz agrupa las solicitudes en Pendientes y Resueltas. Aprobar o rechazar
resuelve la solicitud y deja el resultado en el historial, sin fases intermedias
de líderes o responsables. Los valores internos de M3 se conservan como datos
de la simulación; no se modifica el contrato compartido.

El diálogo mantiene el foco dentro, permite cerrar con Escape o el botón de cierre,
y devuelve el foco a la fila. En celular, la tabla tiene desplazamiento horizontal
y el diálogo limita su altura al espacio visible.

## Integración real pendiente

No se conecta la búsqueda de cuentas: `/admin/members` está registrado como fuera
de contrato. Tampoco está disponible el servicio de activación/desactivación, ni
el esquema completo de respuestas y actualización de roles. El contrato M11
reserva la asignación real al Admin y exige autorización en backend. Esta demo no
marca servicios como consumidos ni modifica el contrato compartido.
