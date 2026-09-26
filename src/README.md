# Estructura de la aplicación

La aplicación usa un **estado general** y componentes standalone, no un módulo Angular independiente por rol. La autorización futura debe resolverse en backend y reflejarse en guards y navegación del frontend.

- `core/`: servicios, modelos y guards compartidos.
- `shared/`: componentes y utilidades reutilizables.
- `features/auth/`: autenticación con correo/contraseña y Google.
- `features/auth/register/`: creación de cuenta en Firebase y sincronización con el servicio Auth.
- `features/dashboard/`: página principal pública con acceso a login y perfil del usuario autenticado.
- `features/roles/`: espacio reservado para vistas específicas por rol.

El rol `solicitante` identifica a la persona cuyo registro está en proceso; evita confundir un registro pendiente con un estudiante ya aprobado. Tailwind queda instalado y configurado para extender la interfaz después; la pantalla inicial conserva únicamente blanco y negro.

La autenticación usa Firebase Authentication mediante `src/app/core/config/firebase.config.ts` y soporta correo/contraseña y Google. Ambos proveedores deben estar habilitados en Firebase Console. La configuración web de Firebase no contiene credenciales privadas; las reglas y permisos deben permanecer protegidos en Firebase y en el backend.

La configuración del SDK se carga desde `src/environments/environment.ts`. Este archivo es local y está ignorado por Git; para configurar una instalación nueva, copia `src/environments/environment.example.ts` como `src/environments/environment.ts` y completa los valores de Firebase. Nunca coloques una cuenta de servicio o una clave privada dentro de este frontend.

El cierre de sesión usa `signOut(firebaseAuth)` desde `AuthService`; el dashboard limpia la sesión local y redirige a `/login`.

El registro crea primero la cuenta en Firebase, obtiene el ID token y luego llama a `POST http://localhost:8080/auth/register` con el header `Authorization: Bearer <token>` y únicamente `nombre` y `apellido`, según `servicios.md`. La URL base está centralizada en `src/app/core/config/api.config.ts`.
