# 6.1 — Lighthouse del home (3 corridas, build de producción, lhci collect)

| Corrida | Rendimiento | LCP | FCP | TBT | CLS |
|---|---|---|---|---|---|
| 1 | 0.81 | 3.9 s | 3.0 s | 90 ms | 0.003 |
| 2 | 0.79 | 4.3 s | 3.3 s | 60 ms | 0.002 |
| 3 | 0.80 | 4.1 s | 3.0 s | 90 ms | 0.003 |

## Diagnóstico

- Elemento LCP: el texto `h1#welcome-title > span` («GALASH»), no una imagen. El desglose es TTFB 11 % y *render delay* 89 % (unos 3,6 s simulados). Con 0 ms de carga de recurso, las optimizaciones de imagen de la tarea (NgOptimizedImage, AVIF/WebP, `loading="lazy"`, precarga del hero) no mueven esta métrica.
- El LCP observado sin limitación es de 169 ms. El simulado (Lantern, CPU ×4 y red móvil lenta) lo dominan la evaluación del JS inicial (592 kB sin comprimir: @angular/core 130 KiB, código propio 120 KiB, @firebase/auth+app 92 KiB, router 70 KiB, forms 52 KiB) y el renderizado en cliente.
- Se probó animar el `h1` sin partir de `opacity:0`: el LCP no cambió (4,1 s) y se revirtió.
- El CSS de Google Fonts ya va inlineado en el build.

## Opciones (requieren decisión o permiso)

1. Prerender o SSR del home con `@angular/ssr`: el `h1` llega en el HTML. Es la vía con más impacto, pero requiere instalar un paquete.
2. Cargar `firebase/auth` de forma diferida, solo al iniciar sesión con Google. Ahorra unos 92 KiB del bundle inicial, pero toca el flujo de autenticación (`onAuthStateChanged` al arrancar).
3. Llevar `RegisterComponent` (formularios) a un `@defer` que se active al abrir el registro.

