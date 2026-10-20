# Comandos de ejecución de pruebas

Ejecutar desde la raíz del repositorio. Los comandos usan `env VAR=valor`, que
funciona en bash, zsh y fish.

## Preparación (una vez por máquina)

Instala las dependencias exactas de `package-lock.json` y el navegador Chromium
que usa Playwright.

```sh
npm ci
npx playwright install chromium
```

`src/environments/environment.ts` debe existir. Sin configuración real de
Firebase basta la plantilla:

```sh
cp src/environments/environment.example.ts src/environments/environment.ts
```

## Unitarias / componente (Vitest)

**Qué evalúa:** lógica aislada de servicios, componentes, guards y formularios,
sin backend real.

**Cómo evalúa:** el builder `@angular/build:unit-test` compila los `*.spec.ts`
de `src/` y los ejecuta con Vitest en jsdom (DOM simulado en Node.js). Las
dependencias externas se reemplazan con dobles de prueba; las peticiones HTTP se
interceptan con `HttpTestingController`. Una prueba falla si alguna aserción
`expect` no se cumple.

```sh
npm test                                   # modo watch: reejecuta al guardar
npm test -- --watch=false                  # una sola ejecución de todas las unitarias
```

### T029 · ApiService

**Qué evalúa:** el cliente HTTP compartido por todas las llamadas al backend.

**Cómo evalúa:** llama `api.get('//auth/sessions/current')` y comprueba que la
petición sale a `/api/auth/sessions/current` (prefijo de `API_BASE_URL` y barras
iniciales eliminadas), con `withCredentials: true`, y que la promesa resuelve con
el cuerpo de la respuesta simulada. `http.verify()` falla si queda alguna
petición inesperada.

```sh
npm test -- --watch=false --include src/app/core/services/api.service.spec.ts
```

## End-to-end y accesibilidad (Playwright + axe)

**Qué evalúa:** la aplicación real en un navegador, tal como la ve el usuario.

**Cómo evalúa:** Playwright abre Chromium contra `ng serve` en
`localhost:4200` y repite cada prueba en tres proyectos: `desktop` (Desktop
Chrome), `tablet` (Galaxy Tab S4) y `mobile` (Pixel 7). Toda llamada a
`**/api/**` se intercepta con `page.route()` y responde `401` (visitante
anónimo), así que no depende del backend. Si una prueba falla guarda captura de
pantalla y trace en `test-results/`.

Modo local: reutiliza un `ng serve` que ya esté corriendo en `localhost:4200`;
si no hay ninguno, lo inicia.

```sh
npm run test:e2e                                       # todas las e2e en los tres viewports
npx playwright test --project=mobile                   # un solo viewport: desktop | tablet | mobile
npx playwright test --headed                           # con navegador visible
npx playwright test --ui                                # modo interactivo
npx playwright show-report                             # abrir el último reporte HTML
```

### T030 · La home pública se muestra

**Qué evalúa:** que la home pública carga en los tres viewports (PT-NF-02).

**Cómo evalúa:** abre `/` y comprueba que el título de la pestaña contiene
`GALASH` y que `main#contenido` es visible.

```sh
npx playwright test -g "renders main content"
```

### T031 · Accesibilidad de la home pública

**Qué evalúa:** la parte automatizable de accesibilidad WCAG 2 nivel A y AA
(PT-NF-06): contraste, etiquetas, roles y nombres accesibles. No reemplaza la
revisión manual con teclado y lector de pantalla.

**Cómo evalúa:** abre `/`, ejecuta `@axe-core/playwright` con las etiquetas
`wcag2a` y `wcag2aa` y exige cero violaciones; si hay, lista regla y selector.
Hoy está marcada con `test.fail()` por el defecto D003 (contraste de
`.device-photo`): Playwright la reporta como correcta mientras siga fallando, y
como error cuando el defecto se corrija y haya que quitar la marca.

```sh
npx playwright test -g "WCAG"
```

### Modo CI de Playwright

**Qué evalúa:** las mismas pruebas e2e, con la configuración de GitHub Actions.

**Cómo evalúa:** con `CI=true` Playwright inicia su propio `ng serve` y no
reutiliza servidores, reintenta una vez cada prueba fallida, falla si queda un
`test.only` y genera el reporte HTML en `playwright-report/`.

1. Detener cualquier `ng serve` en el puerto 4200; si el puerto está ocupado,
   la ejecución falla con `http://localhost:4200 is already used`.
2. Ejecutar:

```sh
env CI=true npm run test:e2e
npx playwright show-report
```

Para ver qué proceso ocupa el puerto: `ss -ltnp | grep 4200`.

## Rendimiento (Lighthouse CI) — T032

**Qué evalúa:** el rendimiento, la accesibilidad, las buenas prácticas y el SEO
del build de producción de la home.

**Cómo evalúa:** `lhci autorun` sirve `dist/src/browser` con un servidor
estático, ejecuta Lighthouse 3 veces en Chrome y compara la mediana contra
`lighthouserc.json`: performance ≥ 0.8 y accessibility, best-practices y seo
≥ 0.9. Por la fase temprana del proyecto los umbrales son `warn`: avisan pero no
fallan la ejecución. Los reportes quedan en `.lighthouseci/reports/`.

Requiere el build de producción y Chrome. Si no hay Chrome en el sistema, usar
el Chromium de Playwright mediante `CHROME_PATH`.

```sh
npm run build
npm run test:perf
env CHROME_PATH="$HOME/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome" npm run test:perf
```

La carpeta `chromium-<versión>` cambia al actualizar Playwright; verificarla con
`ls ~/.cache/ms-playwright/`.

## Build

**Qué evalúa:** que la aplicación compila para producción.

**Cómo evalúa:** `ng build` compila con plantillas estrictas (`strictTemplates`)
y aplica los presupuestos de `angular.json`: aviso si el bundle inicial supera
500 kB y error si supera 1 MB. Falla ante cualquier error de TypeScript o de
plantilla.

```sh
npm run build
```

## Secuencia completa como en CI

**Qué evalúa:** todo lo anterior, en el mismo orden que
`.github/workflows/tests.yml`. Se detiene en el primer paso que falle.

Requiere el puerto 4200 libre.

```sh
npm ci
npm run build
npm test -- --watch=false
env CI=true npm run test:e2e
npm run test:perf
```

## Después de ejecutar

Registrar la ejecución y sus resultados en `events.ndjson` (`R` y `X`) según
`README.md`. Copiar la evidencia que se quiera conservar a
`evidence/<run-id>/`.
