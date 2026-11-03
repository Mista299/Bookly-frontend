# BOOKLY — APK Android, testing y UI/UX

## Resumen ejecutivo

| Entregable | Estado | Ubicación |
|---|---|---|
| **APK firmado** | ✅ Verificado (`apksigner` OK, RSA 2048, zipalign OK) | `android/app/build/outputs/apk/release/app-release.apk` |
| **AAB (Play Store)** | ✅ Generado | `android/app/build/outputs/bundle/release/app-release.aab` |
| **APK debug** | ✅ Para QA | `android/app/build/outputs/apk/debug/app-debug.apk` |
| **Tests E2E** | ✅ **393 pasan / 1 skip** | `tests/e2e/` |
| **Accesibilidad** | ✅ WCAG AA en contraste, jerarquía, foco, touch targets | `tests/e2e/11-a11y.spec.ts` |
| **Verificado en dispositivo** | ✅ Android 14 (API 34), emulador x86_64 | — |

---

## 1. Cómo generar el APK

```bash
cd frontend

# Build web + sincronización con el proyecto Android
npm run android:sync

# APK release firmado
npm run android:apk:release

# AAB para Google Play
npm run android:aab

# Instalar y abrir en el dispositivo/emulador conectado
npm run android:install
npm run android:run
```

### Requisitos

- Java 21
- Android SDK (`ANDROID_HOME`), platform 34/36, build-tools 34/36
- Node 22

El `android/local.properties` ya apunta al SDK local. `android/key.properties` contiene las credenciales de firma y **no se versiona**.

### Verificar la firma

```bash
$ANDROID_HOME/build-tools/34.0.0/apksigner verify --print-certs \
  android/app/build/outputs/apk/release/app-release.apk

$ANDROID_HOME/build-tools/34.0.0/zipalign -c 4 \
  android/app/build/outputs/apk/release/app-release.apk
```

### Conectar con el backend

El APK no tiene proxy de Vite: la API va por URL absoluta (`VITE_API_URL` en `.env.android`).

```bash
# El dispositivo ve el backend del host en localhost:
adb reverse tcp:18080 tcp:18080

# En el emulador, el host es 10.0.2.2:
#   VITE_API_URL=http://10.0.2.2:18080/api/v1
```

El backend debe permitir el origen del APK en CORS. Está en `docker-compose.yml`:

```
FRONTEND_URL=http://127.0.0.1:5173,http://localhost:5173,http://localhost,...
```

---

## 2. Qué se hizo para que funcione en un celular real

### 2.1 La app dejó de ser SSR

`adapter-auto` renderizaba en el servidor Node; en el APK no hay servidor. Se migró a
`adapter-static` con `fallback: 'index.html'` y `ssr = false`: todo el render ocurre en el
cliente. `base: './'` para que los assets resuelvan bajo el esquema del WebView.

### 2.2 Integración con el shell nativo

En `src/routes/+layout.svelte` (solo cuando `Capacitor.isNativePlatform()`):

| Plugin | Para qué |
|---|---|
| `@capacitor/status-bar` | Barra con la ciruela de marca e iconos claros |
| `@capacitor/keyboard` | `resize: 'native'`: el input no queda tapado por el teclado |
| `@capacitor/app` | Botón atrás de Android: navega el historial, sale solo en la raíz |
| `@capacitor/network` | Aviso "Sin conexión" en vez de una pantalla que no carga |
| `@capacitor/splash-screen` | Se oculta con reintentos (el primer hide a veces se pierde) |

### 2.3 Configuración nativa

- `network_security_config.xml`: cleartext **solo** para `localhost`, `10.0.2.2` y la LAN de
  desarrollo. En release contra un backend real en HTTPS no se aplica ninguna de esas reglas.
- `AndroidManifest.xml`: `portrait`, deep links (`bookly://app/...`), permisos de red.
- Iconos y splash nativos generados con `@capacitor/assets` (87 recursos).

---

## 3. Mejoras de UI/UX para móvil

### 3.1 Safe areas — el bug que hacía "feo" la app

`env(safe-area-inset-*)` en la barra inferior y en los tres layouts. Antes, la barra de
navegación quedaba **debajo del gesto de Android** y del indicador de inicio de iOS.

### 3.2 Barra inferior con "Más"

El admin tiene 7 secciones y las metía todas en la barra inferior: ilegible a 360px.

`BottomNav.svelte` muestra **4 destinos + "Más"**, que abre un panel con el resto. En
escritorio el layout lateral sigue mandando.

### 3.3 Objetivos táctiles de 44px

Regla global en `_base.scss` + ajustes por componente. Corregidos:

| Elemento | Antes | Ahora |
|---|---|---|
| Enlace "Ver todos" | 80×20 | 44px alto |
| Chips de filtro | 34px | 44px |
| Botones de icono | 36×36 | 44×44 |
| Inputs de hora | 40px | 44px |
| Botón "Quitar franja" | 32×32 | 44×44 |

### 3.4 Contraste WCAG AA

El gris de texto secundario daba 4.16:1 sobre blanco (mínimo AA: 4.5:1).

| Token | Antes | Después | Sobre blanco |
|---|---|---|---|
| `$muted` | `#817a84` | `#6f6872` | 4.16 → **5.39** |
| `$success` | `#5e9f7a` | `#417255` | 3.13 → **5.58** |
| `$danger` | `#d96b68` | `#c03d33` | 3.43 → **5.31** |

El asterisco de campo obligatorio usaba el coral (2.79:1) → ahora `$danger`.

### 3.5 Fuentes empaquetadas

`static/fonts/` con Plus Jakarta Sans e Inter en woff2. **El APK ya no depende de Google
Fonts** y se ve igual sin conexión.

### 3.6 Jerarquía de encabezados

`EmptyState` usaba `h3` siempre, provocando saltos `h1 → h3`. Ahora el nivel es configurable
y por defecto `h2`. Los grupos por día de `/professional/turns` pasaron a `h2`.

---

## 4. Tests

### 4.1 Estado actual

```
Total: 394 tests in 12 files
```

| Archivo | Tests | Cubre |
|---|---|---|
| `00-smoke` | 2 | Arranque y redirección |
| `01-auth` | 6 | Login, sesión, logout, validación |
| `02-public` | 8 | Login, registro, setup, 403, 404 |
| `03-admin-services` | 6 | CRUD de servicios, filtros |
| `04-admin-professionals` | 4 | Listado, alta, validación |
| `05-admin-users-audit` | 6 | Búsqueda, roles, reset, auditoría |
| `06-admin-profile` | 2 | Contraseña, MFA |
| `07-admin-agenda-settings` | 2 | Agenda y ajustes |
| `08-professional` | 5 | Home, horario, agenda, turnos |
| `09-customer` | 7 | Catálogo, detalle, agenda, reserva |
| `10-responsive` | 144 | 6 viewports reales × overflow, touch, safe-area |
| `11-a11y` | 202 | WCAG: estructura, contraste, foco, nombres, landmarks |

### 4.2 Ejecutar

```bash
# Backend y base de datos primero
cd ../backendcf && docker compose up -d

# Seed determinista (servicios, profesionales, horarios, reservas, auditoría)
npm run seed:e2e

# Suite completa
npm run test:e2e

# Un archivo
npx playwright test tests/e2e/11-a11y.spec.ts
```

### 4.3 `seed-e2e.sh`

El seed de Flyway del backend trae servicios de otro dominio (Legal, Salud). El script crea
el dominio real de la app (salón de belleza), con horarios semanales, reservas futuras y
los tres tipos de evento de auditoría. Es **idempotente** y verifica al final que todo quedó
asignado.

`global-setup.ts` lo ejecuta antes de cada corrida, así que la BD siempre está en un estado
conocido.

### 4.4 Matriz de viewports

| Device | Ancho | Perfil |
|---|---|---|
| iPhone SE | 320px | Límite inferior real |
| Galaxy S8 | 360px | Android de gama media |
| Pixel 7 | 412px | Android flagship |
| iPhone 14 Pro | 393px | Notch + Dynamic Island |
| Tablet | 768px | Táctil grande |
| Desktop | 1440px | Referencia |

---

## 5. Bugs reales del frontend corregidos

Estos los encontraron los tests, no una revisión manual:

| Bug | Efecto | Corrección |
|---|---|---|
| `api.ts` limpiaba la sesión con un 401 de una petición con token obsoleto | El usuario recién autenticado era expulsado | Solo se cierra si el token que falló sigue vigente |
| `changePassword` usaba la ruta normal de 401 | La contraseña actual incorrecta expulsaba al admin | `silent401` + error inline en el modal |
| Filtros de auditoría enviados como LocalDateTime | La pantalla de auditoría siempre vacía (400) | Se envían como OffsetDateTime |
| Búsqueda de servicios sin protección de `null` | "Cannot read properties of null" rompía el catálogo | Fallback en `name`/`description`/`category` |
| `BookingResponse` sin `serviceName`/`professionalName` | La agenda mostraba "Servicio" y "Profesional" | `bookingNames.ts` resuelve los nombres cruzando el catálogo |
| `EmptyState` con `h3` fijo | Saltos `h1 → h3` en la jerarquía | Nivel configurable, `h2` por defecto |
| Colores de texto por debajo de AA | Texto ilegible | Tokens recalculados |

---

## 6. Bugs del backend documentados (no corregidos aquí)

| # | Bug | Impacto |
|---|---|---|
| 1 | `POST /auth/login` no devuelve `423 ACCOUNT_LOCKED` | El countdown de bloqueo nunca se activa |
| 2 | `BookingResponse` no incluye `serviceName`/`customerName` | Mitigado en el frontend con `bookingNames.ts` |
| 3 | `MfaConfirmResponse` devuelve `session` en vez de `authResponse` | El frontend acepta ambos |
| 4 | `PUT /usuarios/{id}/rol` exige `specialty` para PROFESSIONAL | Documentado en el seed |

---

## 7. Estado final

- **393 tests E2E en verde**, estables en corridas repetidas
- **APK release firmado** verificado con `apksigner` y `zipalign`
- **Instalado y arrancado** en Android 14: login completo contra el backend real
- **Accesibilidad WCAG AA** verificada por 202 casos automáticos
- **UI móvil** con safe areas, targets de 44px, barra adaptativa y fuentes offline
