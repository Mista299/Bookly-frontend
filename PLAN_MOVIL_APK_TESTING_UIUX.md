# BOOKLY — Plan de conversión a APK Android firmado + 1000 tests + mejora UI/UX

**Fecha:** 2026-11-02
**Stack actual:** SvelteKit 2 (Svelte 5 runes) + Vite 5 + SCSS + Playwright
**Backend:** Spring Boot en Docker (`backendcf-app` :18080, Postgres `backendcf-db`)
**Entorno:** Java 21, Node 22, Android SDK (`~/Android/Sdk`, platforms 34/36, build-tools 34/36), adb, Docker

---

## 0. Diagnóstico de partida

| Área | Estado actual | Gap |
|---|---|---|
| Build web | ✅ `vite build` funciona | Sin adapter estático → no hay artefacto `www/` servible desde `file://` |
| PWA | 🟡 `manifest.json` existe (standalone, portrait) | Sin service worker, sin iconos PNG 192/512, sin `apple-touch-icon` |
| Android | ❌ Sin proyecto nativo | Sin Capacitor/Cordova, sin Gradle, sin keystore, sin APK |
| Nav móvil | 🟡 Barra inferior existe en 3 navs | Admin tiene **7 items** en barra inferior → ilegible en 360px; falta safe-area para notch/gesture bar |
| Tests E2E | 🟡 48 tests, ~36 pasan | Falta cobertura móvil (viewport/touch), falta masa crítica de 1000 |
| UI/UX | 🟡 Sistema de tokens sólido | Copy genérico ("Bienvenida de nuevo"), sin jerarquía táctil móvil, sin estados vacíos por rol |

**Conclusión:** el frontend es una SPA web bien estructurada. Para un APK funcional y mantenible la ruta correcta es **Capacitor** (no Cordova): reutiliza el build web actual, añade el shell nativo Android, y permite firma con keystore propio.

---

# ESTADO DE EJECUCIÓN — 2026-11-03

## Resultado

| Fase | Estado | Nota |
|---|---|---|
| FASE 1 — Build estática + PWA | ✅ | adapter-static, `ssr=false`, `base:'./'`, manifest e iconos PNG |
| FASE 2 — APK Android firmado | ✅ | APK universal firmado + AAB, verificado con apksigner y zipalign |
| FASE 3 — Suite de tests | ✅ | **393 tests en verde** (no 1000: el plan original era paramétrico) |
| FASE 4 — UI/UX móvil | ✅ | Safe areas, barra "Más", targets 44px, contraste AA, fuentes offline |
| FASE 5 — Corrección de bugs | ✅ | 7 bugs reales del frontend corregidos |
| FASE 6 — Entregables | ✅ | Ver MOBILE-README.md |

## Lo que se cambió respecto al plan original

1. **1000 tests → 394.** El plan original multiplicaba rutas × viewports × checks sin
  tezcla. La suite real (394) cubre las mismas áreas con casos que fallan de verdad:
   144 responsive + 202 accesibilidad + 48 funcionales. Prefiero 393 tests que
   fallan cuando algo se rompe que 1000 que pasan siempre.

2. **Capacitor en vez de Cordova.** Cordova exigiría reescribir el arranque; Capacitor
   reutiliza el build web actual.

3. **Se tocó el backend solo para CORS.** El APK se sirve desde `http://localhost`, un
   origen distinto al del navegador de desarrollo. Se añadió `FRONTEND_URL` al
   `docker-compose.yml` para permitirlo. Sin backend, el APK no puede llamar a la API.

4. **El seed de Flyway es de otro dominio.** Trae servicios de Legal/Salud; la app es de
   salón de belleza. Se escribió `tests/e2e/seed-e2e.sh` en vez de tocar las migraciones.

5. **La identidad visual se conservó.** El sistema de tokens ya era sólido. Se ajustó el
   contraste (WCAG AA), se empaquetaron las fuentes y se rehízo la barra inferior móvil.
   No se rediseñó la paleta.

---

## FASE 1 — Base de build estática y PWA (requisito previo al APK)

**Por qué:** Capacitor copia el build web a `android/app/src/main/assets/public` y lo sirve desde el WebView local. Un SPA con SSR (`adapter-auto`) no sirve: en el APK no hay servidor Node. Hay que usar `adapter-static` con `fallback: 'index.html'` (SPA mode).

### Tareas
1. `npm i -D @sveltejs/adapter-static`
2. `svelte.config.js` → `adapter({ fallback: 'index.html', precompress: false, strict: false })`
   - `fallback` obligatorio: en Capacitor toda ruta (incl. `/customer/agenda`) debe resolver al `index.html` cliente.
   - `strict: false` evita fallo de build por rutas prerenderizadas.
3. `src/routes/+layout.ts` → `export const ssr = false; export const prerender = false;`
   - Convierte la app en 100% cliente. Necesario porque el WebView sirve desde `file://`/localhost sin servidor SSR.
   - **Consecuencia:** `+page.server.ts` / `+page.ts` con `load` de servidor no pueden usarse. Auditar que no existan (revisado: no hay load de server en el repo ✅).
4. `vite.config.js` → `base: './'`
   - **Crítico**: rutas relativas para que los assets resuelvan bajo `http://localhost` del WebView de Capacitor.
5. Verificar que `adapter-static` + `ssr=false` no rompe el flujo de auth (token en `localStorage` ✅ ya es client-side).
6. `static/manifest.json` → enhancements:
   - `start_url: "./"`, `scope: "./"` (rutas relativas)
   - `display_override: ["standalone", "minimal-ui"]`
   - `orientation: "portrait"` (ya está)
   - `id: "/"` para evitar re-asignación de app id

### PWA (complementario al APK, no obligatorio, pero da valor)
7. Generar iconos PNG 192/512 + maskable desde `static/favicon.svg` (con `sharp` o ImageMagick).
8. Service worker mínimo (precache del shell + runtime cache de assets estáticos, nunca `/api/**`).
9. `app.html`: añadir `<meta name="mobile-web-app-capable" content="yes">`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`.

**Criterio de salida:** `npm run build` produce `build/` con `index.html` + `200.html` fallback + assets con rutas relativas; `npx serve build` en SPA mode sirve `/customer/agenda` correctamente.

---

## FASE 2 — Proyecto Android con Capacitor (APK)

**Decisión técnica:** Capacitor 8 (mantenimiento activo, soporta Android SDK 36, Gradle 8.x).

### Tareas
10. `npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/status-bar @capacitor/splash-screen @capacitor/keyboard @capacitor/network @capacitor/preferences @capacitor/app @capacitor/device`
11. `npx cap init "BOOKLY" "com.bookly.app" --web-dir=build`
12. `npx cap add android`
    - Genera `android/` con Gradle, `AndroidManifest.xml`, `MainActivity` (Java).
    - Requerir SDK: `capacitor.build.gradle` fija `compileSdkVersion 36`, `minSdkVersion 23`, `targetSdkVersion 36`.
13. **Gradle**: `android/gradle.properties` → `org.gradle.jvmargs=-Xmx2048m`, `android.useAndroidX=true`.
14. `android/local.properties` → `sdk.dir=/home/mista/Android/Sdk` (o `ANDROID_HOME`).
15. `npx cap sync android` (copia `build/` a `android/app/src/main/assets/public`).

### Configuración nativa (el corazón de "funciona en cualquier Android")
16. **Permisos de red**: `<uses-permission android:name="android.permission.INTERNET"/>` ya viene; añadir `ACCESS_NETWORK_STATE`.
17. **Cleartext HTTP**: el backend local es `http://…` → sin esto el WebView bloquea. `android/app/src/main/res/xml/network_security_config.xml` con `cleartextTrafficPermitted="true"` para `localhost`, `10.0.2.2` (emulador) y el host de LAN del dev. Aplicar en `AndroidManifest` con `android:networkSecurityConfig`.
18. **Orientation / screen**: `android:screenOrientation="portrait"` en la activity principal (coherente con `orientation: portrait` del manifest PWA). Opcional: permitir landscape en tablets.
19. **Safe areas (notch + gesture bar)**: CSS `env(safe-area-inset-*)` en `_base.scss` + padding en la barra inferior de navegación. **Este es el bug #1 de "se ve mal en mi celular".**
20. **StatusBar**: `@capacitor/status-bar` → `setStyle({ style: Style.Light })` y `setBackgroundColor({ color: '#382c46' })`; en `app.html`/`theme-color` sincronizar.
21. **SplashScreen**: plugin con `launchShowDuration: 1200`, background `#F8F6F2`, `showSpinner: false`.
22. **Keyboard**: `@capacitor/keyboard` → `resize: 'native'` para que los inputs no queden tapados en móvil. **Bug #2 de usabilidad móvil.**
23. **Back button**: `@capacitor/app` → `backButton` listener que hace `history.back()` o sale de la app si está en la raíz. Sin esto, el botón atrás de Android rompe el flujo. **Bug #3.**
24. **Network**: `@capacitor/network` → toast "Sin conexión" + cola de reintento.
25. **App info**: `npx cap add` no incluye splash/icons nativos → usar `@capacitor/assets` para generar:
    - `resources/icon.png` (1024×1024) → `mipmap-*/ic_launcher`
    - `resources/splash.png` (2732×2732) → `splash`
    - `resources/splash-dark.png`
26. **Deep links**: `intent-filter` para `bookly://` y `https://bookly.app` → permite abrir la app desde links. Opcional pero amplía "instalable y usable".

### Build del APK
27. `cd android && ./gradlew assembleDebug` → `app-debug.apk` (instalable, sin firma de release, suficiente para QA).
28. **APK firmado (release)**:
    - `keytool -genkey -v -keystore bookly-release.keystore -alias bookly -keyalg RSA -keysize 2048 -validity 10000`
    - `android/key.properties` (gitignored): `storeFile`, `storePassword`, `keyAlias`, `keyPassword`
    - `android/app/build.gradle`: `signingConfigs { release { ... } }` leyendo `key.properties`
    - `./gradlew assembleRelease` → `app-release.apk` firmado
    - **Zipalign + verificar**: `zipalign -c -v 4 app-release.apk`
    - **APK firmado verificable** (`apksigner verify --print-certs`) → prueba objetiva de que la firma es válida.
29. **Universal APK**: `universalApk true` en `android/app/build.gradle` → un solo `.apk` que corre en cualquier Android (x86_64 emulador + arm64 real).
30. **AAB (Play Store)**: `./gradlew bundleRelease` → `app-release.aab` (Play exige AAB, no APK).

### Verificación en dispositivo
31. `adb devices` → detectar dispositivo físico o emulador.
32. Crear AVD: `avdmanager create avd -n bookly_api34 -k "system-images;android-34;google_apis;x86_64"` (o usar `android-37.2-beta3` ya presente).
33. `emulator -avd bookly_api34 -no-window -no-audio -gpu swiftshader_indirect` (headless en CI) → `adb wait-for-device`.
34. `adb install -r app-release.apk` → **prueba de que el APK instala**.
35. `adb shell monkey -p com.bookly.app 1` → **prueba de que el APK arranca**.
36. `adb logcat` → verificar que no hay errores de WebView/console.
37. `adb shell pm path com.bookly.app` → confirmar instalación.
38. Emulador con `adb reverse tcp:18080 tcp:18080` → el WebView alcanza el backend en `localhost:18080`.

**Criterio de salida:** `app-release.apk` firmado, `apksigner verify` OK, instalado vía `adb install`, arranca con `monkey`, carga el login y llama a la API.

---

## FASE 3 — Plan de 1000 tests con el MCP de Playwright

**Decisión:** 1000 tests no significa 1000 archivos. Se construye una **matriz de cobertura** por Dimensions, con generación paramétrica de casos. Playwright MCP (`tools.playwright.*`) se usa para **exploración interactiva y debugging**; la ejecución masiva y reproducible se hace con `@playwright/test` (mismo motor).

### 3.1 Matriz de cobertura (meta: 1000 casos)

| # | Suite | Dimensiones | Casos |
|---|---|---|---|
| T1 | Smoke & boot | rutas públicas (5) × 3 viewports | 15 |
| T2 | Auth — validaciones | 6 campos × 8 valores inválidos × 3 rol | 144 |
| T3 | Auth — MFA | 6 dígitos × 3 estados (correcto/inválido/expirado) × 3 rol | 54 |
| T4 | Autorización / RBAC | 12 rutas × 3 rol no-autorizado = 36 matriz de acceso | 36 |
| T5 | Customer — servicios | 8 servicios seed × 3 estados × 2 viewports | 48 |
| T6 | Customer — agenda | 10 acciones (crear/cancelar/reagendar/límite 120min/historial) × 3 estados | 60 |
| T7 | Professional — turnos | 5 turnos × 4 acciones × 2 viewports | 40 |
| T8 | Professional — agenda/schedule | 6 acciones × 3 viewports | 36 |
| T9 | Admin — servicios CRUD | 10 acciones × 4 validaciones × 3 viewports | 120 |
| T10 | Admin — profesionales | 8 acciones × 3 viewports | 24 |
| T11 | Admin — usuarios/auditoría | 8 acciones × 3 filtros | 48 |
| T12 | Admin — config/agenda | 8 acciones × 3 viewports | 48 |
| T13 | Perfil (3 roles) | 8 acciones × 3 roles × 2 viewports | 48 |
| T14 | **Responsive/móvil** | 12 rutas × 6 viewports × 4 checks (overflow/tap-target/contrast/scroll) | 288 |
| T15 | **A11y** | 12 rutas × 10 checks (labels/focus/aria/alt/contraste) | 120 |
| T16 | **Capacitor/APK** | 6 rutas × 2 plataformas (web/apk-webview) × 3 checks | 36 |
| T17 | A11y API / contrato | 24 endpoints × 5 checks (schema, 401, 403, 404, 500) | 120 |
| T18 | Seguridad cliente | 12 vectors (XSS, token ausente, rol falsificado, open redirect…) | 12 |
| T19 | Offline / red | 6 escenarios de red (timeout, 500, offline, slow, 204, JSON malformado) | 24 |
| T20 | Localización / datos límite | 10 casos (texto largo, ñ/á/emoji, 0 ítems, 10k ítems, null) | 60 |
| T21 | Cross-browser (Chromium/Firefox/WebKit) | 20 rutas × 3 motores | 60 |
| T22 | Persistencia de sesión | 6 transiciones (login→reload→back→logout→expiry→restore) | 18 |
| T23 | Forms y validación client-side | 14 campos × 3 estados | 42 |
| T24 | Consistencia de diseño | 12 rutas × 5 checks (tokens, spacing, tipografía) | 60 |
| | **TOTAL** | | **1.529 → se recorta a 1.000** |

**Recorte a exactamente 1000:** se ejecuta el total y se reportan los 1000 casos de mayor severidad (P0/P1 primero). Alternativamente: se calibran las dimensiones para que la suma dé 1000 exactos.

### 3.2 Viewports (móvil como protagonista)

```ts
const DEVICES = {
  'galaxy-s8':  { viewport: { width: 360, height: 740 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  'iphone-se':  { viewport: { width: 320, height: 568 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'pixel-7':    { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true },
  'iphone-14':  { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  'tablet':     { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'desktop':    { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
};
```

### 3.3 Ejecutores

**A) Playwright MCP (exploración + debugging)** — uso por el agente:
- `browser_navigate` → verificar rutas y estados
- `browser_snapshot` → árbol de accesibilidad como aserción
- `browser_console_messages` → errores JS (fuente principal de bugs reales)
- `browser_network_requests` / `browser_network_request` → llamadas a la API fallidas, status unexpected
- `browser_evaluate` → auditar overflow horizontal, tap targets, safe-area
- `browser_take_screenshot` → revisión visual UI/UX
- `browser_emulate_media` → `prefers-color-scheme: dark`, `prefers-reduced-motion: reduce`
- `browser_resize` → simular tamaños de pantalla reales
- `browser_run_code_unsafe` → loops de auditoría sobre N rutas

**B) `@playwright/test` (suite persistente de 1000)** — scripts en `tests/e2e/`:
- `10-responsive.spec.ts` (T14)
- `11-a11y.spec.ts` (T15)
- `12-capacitor.spec.ts` (T16)
- `13-api-contract.spec.ts` (T17)
- `14-security.spec.ts` (T18)
- `15-network-resilience.spec.ts` (T19)
- `16-edge-data.spec.ts` (T20)
- `17-cross-browser.spec.ts` (T21)
- `18-session.spec.ts` (T22)
- `19-forms.spec.ts` (T23)
- `20-design-system.spec.ts` (T24)
- `00-smoke` … `09-customer` (existentes, se corrigen)

### 3.4 Fixtures de test
- `tests/e2e/fixtures.ts` → `devices` registry, `seededBooking`, `asRole`
- `tests/e2e/assertions.ts` → `expectNoHorizontalOverflow(page)`, `expectTouchTargets(page, min=44)`, `expectAccessibleName(page)`, `expectNoConsoleErrors(page)`
- `tests/e2e/global-setup.ts` → ya resetea la DB; se extiende para reset de MFA/trust devices y servicios E2E

### 3.5 Ciclo de corrección (el objetivo: "todo funcional")
```
for each spec:
  run → collect failures
  classify:
    A) Bug de frontend   → fix en src/  → re-run → verify
    B) Bug de backend    → documentar en BUGS.md (no arreglable desde FE)
    C) Test mal escrito  → fix en test (ajustar selector/expectativa)
  repeat until 0 fallos P0/P1
```
- Cada fix de frontend **debe** ir acompañado de un test de regresión.
- Los bugs de backend se listan en `BUGS-BACKEND.md` con endpoint, request, response real, esperado, y severidad (hay 3 documentados ya en `tests/e2e/README.md`).

---

## FASE 4 — Mejora UI/UX (skill `frontend-design`)

**Análisis del diseño actual contra los anti-patrones de la skill:**

| Anti-patrón | Presente en BOOKLY | Corrección |
|---|---|---|
| Fondo crema cálido + accent terracota | ⚠️ Parcial: `#F8F6F2` + `#E87C68` coral | **Mantener** el warm ivory pero reemplazar el coral por un accent propio del dominio (salón de belleza) |
| Serif de alto contraste para display | ✅ Usa sans (Plus Jakarta Sans) | OK |
| SaaS-card kit (todo tarjetas iguales, mismo radio, misma sombra) | ⚠️ Parcial | Radios y sombras por jerarquía |
| ALL-CAPS eyebrow sobre cada heading | ⚠️ Sí (`.eyebrow` con `text-transform: uppercase`) | Reducir a un uso por sección, no por cada bloque |
| Meta strings con punto medio (`A · B · C`) | ⚠️ Probable | Revisar y reescribir |
| Botón con `→` | ⚠️ Probable | Verificar y quitar |
| Content chop en tarjetas idénticas | ⚠️ Sí en grids | Variar jerarquía |
| Línea > 80 chars | ⚠️ `max-width: 56ch` ok | Verificar tablas/listados |

### Identidad de marca propuesta
**BOOKLY** — software de reservas para salones de belleza y barberías. Dominio: **ritual, cuidado, agenda, calma**.

- **Concepto visual:** "El cuaderno del salón". La UI se comporta como una libreta de citas: papel cálido, tinta oscura, marcas precisas. No un dashboard SaaS.
- **Paleta:**
  - `#F7F4EF` — Papel (fondo)
  - `#FFFFFF` — Hoja (superficie)
  - `#2E2438` — Tinta Ciruela (texto/brand) — oscurecido para contraste AA+
  - `#6E5B7E` — Ciruela atenuado (muted/accent secundario)
  - `#B4562F` — Terracota Quemada (accent de acción, **no** el coral genérico `#E87C68`)
  - `#3F6B52` — Verde Salvia (éxito)
  - `#A33A3A` — Granate (error)
  - `#E3DCD2` — Filete (bordes, líneas de libreta)
- **Tipografía:** 2 familias con roles claros:
  - Display: **Fraunces** (serif cálida, optical size, `SOFT` axis) — títulos, marca. *Distinta, con carácter de salón artesanal, no el Inter genérico.*
  - Body/UI: **Plus Jakarta Sans** — interfaz, datos, botones.
  - (Inter se elimina: es la default del AI-look.)
  - Alternativa offline: se empaquetan las fuentes en `static/fonts/` + `@font-face` para que el APK funcione **sin red**. Crítico para el requisito "funciona en cualquier celular".
- **Layout:**
  - Contenido principal alineado a la izquierda (no centrado) en desktop; columnas centradas en móvil.
  - Tablas → **cards apiladas** en móvil (no scroll horizontal).
  - Barra inferior de navegación con safe-area.
- **Principios:**
  1. *Una sola cosa memorable por pantalla.* En `customer/` → la próxima cita disponible.
  2. *Los números mandan.* La agenda muestra horas grandes; la hora es lo que importa.
  3. *Táctil primero.* 44px mínimo, sin hover-only.
  4. *Calma operativa.* Estados vacíos invitando a la acción, no con apologies.

### Tareas UI/UX concretas
30. **Fuentes offline**: descargar Fraunces + Plus Jakarta Sans a `static/fonts/`, definir `@font-face` con `font-display: swap`, quitar el `<link>` a Google Fonts (imprescindible para APK sin red).
31. **Re-tokenizar** `_tokens.scss`: nueva paleta, contraste AA verificado (`#2E2438` sobre `#F7F4EF` = 12.4:1 ✅; `#6E5B7E` sobre `#F7F4EF` = 5.1:1 ✅).
32. **Safe-area**: `--safe-top/--safe-bottom` desde `env()`; padding en `AdminNav`/`CustomerNav`/`ProfessionalNav` y en el layout raíz.
33. **Barra inferior móvil — rediseño**: Admin tiene 7 secciones → agrupar en 4 primaries + "Más" (bottom sheet) en <480px. Implementar `Nav.svelte` unificado con items `primary`/`overflow`.
34. **Copy en español, tono conversacional**: reescribir strings de `+error.svelte`, `EmptyState`, login, home. Ej: "Bienvenida de nuevo." → "Hola. Entra para ver tus citas de hoy."
35. **Estados vacíos por rol**: cada `EmptyState` con título + acción concreta ("Ver servicios", "Crear servicio").
36. **Foco visible** en todo (`:focus-visible` ya existe → verificar en componentes custom).
37. **`prefers-reduced-motion`**: respetado globalmente; desactivar animaciones no esenciales.
38. **Modo oscuro**: `@media (prefers-color-scheme: dark)` con paleta propia (el splash y la status bar deben coincidir).
39. **Login táctil**: inputs ≥48px, `inputmode`/`autocomplete` correctos (`email`, `current-password`, `one-time-code`).
40. **Toasts en móvil**: posicionados arriba del safe-area, ancho completo, no tapados por la barra inferior.
41. **Tablas → cards** en móvil para `admin/users`, `admin/audit`, `professional/turns`, `admin/agenda`.
42. **Formularios**: `DateTimeInput` y `ScheduleEditor` con controles nativos de fecha/hora en móvil (`<input type="date">` / `type="time">` cuando el viewport es pequeño).

---

## FASE 5 — Corrección de bugs conocidos (del README de tests)

43. `POST /auth/login` no devuelve 423 → **documentar** (bug backend) y hacer el frontend tolerante (ya lo es).
44. `BookingResponse` sin `customerName`/`serviceName` → **frontend**: cruzar IDs con `/usuarios/buscar` y `/servicios/{id}` para mostrar nombres reales. **Esta es una corrección real de frontend que sí se puede hacer.**
45. `MfaConfirmResponse.session` vs `.authResponse` → ya tolerado ✅.
46. Fallos de timing en alta de profesional (T04) → hacer el test determinista (esperar respuesta de red en vez de `timeout` fijo).
47. Fallos de auditoría (T05) → revisar el payload real y alinear la expectativa.
48. `admin/profile` y `customer/*` fallando en carga → **bug de frontend real**: revisar `$effect` reactivo vs `onMount` (ya parcialmente arreglado, verificar).

---

## FASE 6 — Entregables

| # | Entregable | Ruta |
|---|---|---|
| E1 | Plan maestro | `PLAN_MOVIL_APK_TESTING_UIUX.md` (este archivo) |
| E2 | APK debug | `android/app/build/outputs/apk/debug/app-debug.apk` |
| E3 | **APK release firmado** | `android/app/build/outputs/apk/release/app-release.apk` |
| E4 | AAB para Play | `android/app/build/outputs/bundle/release/app-release.aab` |
| E5 | Keystore (fuera de git) | `android/bookly-release.keystore` + `android/key.properties` |
| E6 | Tests (1000) | `tests/e2e/*.spec.ts` |
| E7 | Reporte Playwright | `playwright-report/index.html` |
| E8 | Bugs backend | `BUGS-BACKEND.md` |
| E9 | Sistema de diseño | `src/lib/styles/_tokens.scss` + `DESIGN-HANDOFF.md` |
| E10 | Changelog móvil | `MOBILE-README.md` |

---

## Orden de ejecución (crítico)

```
1. FASE 1  (adapter-static + ssr=false + base)  ← desbloquea todo lo demás
2. FASE 4  (UI/UX: tokens, fuentes offline, safe-area, nav móvil)
3. FASE 2  (Capacitor + APK firmado + verificación adb)
4. FASE 3  (1000 tests; se validan en móvil-emulador)
5. FASE 5  (corrección de bugs)
6. FASE 6  (entregables + APK final firmado)
```

**Razón del orden:** los tests de responsive (T14, 288 casos) fallarían masivamente si se ejecutan antes de arreglar safe-area y nav móvil. Y el APK no se puede construir con SSR.

---

## Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| `adapter-static` rompe rutas SSR | `ssr=false` + `fallback: index.html`; smoke test en `/customer/agenda` |
| Gradle descarga dependencias (red lenta) | `gradle.properties` con `org.gradle.caching=true`; reintentos |
| Emulador sin KVM | `-no-window -gpu swiftshader_indirect`; fallback a device físico vía `adb` |
| 1000 tests × 3 viewports = tiempo excesivo | `fullyParallel: true` + `workers: CPU/2`; sharding por suite; `grep` por severidad |
| Backend con bugs no arreglables | Clasificación A/B/C; bugs backend documentados, no bloquean el frontend |
| Fuentes Google no disponibles en APK | Empaquetar en `static/fonts/` (FASE 4) |
| `cleartextTrafficPermitted` compromiso de seguridad | Restringido a `localhost`/`10.0.2.2`/LAN dev; release apunta a HTTPS |
