# BOOKLY — Todos los comandos

Todos se ejecutan desde `frontend/`:

```bash
cd /home/mista/Escritorio/udea/2026-II/calidad-software/Proyecto-FE/frontend
```

---

## Arrancar todo (lo habitual)

```bash
npm run celular:desarrollo
```

Levanta backend + frontend, instala el APK en el celular, abre la app y abre
el mirror de pantalla (scrcpy) en una ventana aparte.

| Variante | Qué hace |
|---|---|
| `npm run celular:desarrollo` | Todo + mirror de pantalla |
| `npm run celular:desarrollo:sin-mirror` | Todo sin ventana de mirror |
| `npm run celular:desarrollo:watch` | Además, reinstala el APK al recompilar |

Equivalente directo: `bash scripts/desarrollo.sh`

---

## Desarrollo web (sin celular)

```bash
npm run dev            # frontend en http://127.0.0.1:5173
npm run build          # build de producción
npm run preview        # sirve el build
npm run check          # TypeScript + Svelte (0 errores, 0 warnings)
```

Para levantar solo el backend:

```bash
cd ../backendcf && docker compose up -d
docker compose logs -f app
docker compose down
```

---

## Celular

```bash
npm run celular:conectar       # detecta, instala el APK, abre la app + mirror
npm run celular:instalar       # auto-instala cada vez que conectas el cable
npm run celular:desarrollo     # backend + frontend + mirror
```

Opciones de `conectar.sh`:

```bash
bash scripts/conectar.sh --sin-mirror   # sin ventana de mirror
bash scripts/conectar.sh --wireless     # por Wi-Fi, sin cable
```

Detener la auto-instalación:

```bash
npm run celular:instalar -- --detener
npm run celular:instalar -- --estado
```

---

## APK de Android

```bash
npm run android:apk           # APK debug (rápido, para iterar)
npm run android:apk:release   # APK release FIRMADO
npm run android:aab           # AAB para Google Play
npm run android:sync          # solo compila web + copia a android/
npm run android:install       # instala el release en el dispositivo
npm run android:run           # abre la app
npm run android:logs          # logcat filtrado
```

Rutas de salida:

```
android/app/build/outputs/apk/release/app-release.apk
android/app/build/outputs/bundle/release/app-release.aab
```

Verificar la firma:

```bash
$ANDROID_HOME/build-tools/34.0.0/apksigner verify --print-certs \
  android/app/build/outputs/apk/release/app-release.apk
```

---

## MFA (código del administrador)

```bash
npm run mfa:codigo            # muestra el código TOTP vigente
npm run mfa:codigo -- --loop  # lo refresca cada segundo
npm run mfa:codigo -- --solo  # solo el número (para scripts)
npm run mfa:reset             # desenrola (vuelve al flujo del QR)
npm run mfa:enrolar           # reenrola con secret conocido
```

Los clientes y profesionales **no** tienen MFA.

---

## Tests

```bash
npm run seed:e2e              # datos de prueba (servicios, horarios, reservas)
npm run test:e2e              # suite completa (393 tests)
npm run test:e2e:ui           # modo interactivo
```

Un archivo o un test concreto:

```bash
npx playwright test tests/e2e/11-a11y.spec.ts
npx playwright test -g "crear una reserva"
npx playwright test --ui
```

Reports:

```
playwright-report/index.html   (abrir con: npx playwright show-report)
```

---

## Diagnóstico

```bash
# Estado del dispositivo
adb devices -l

# La API es alcanzable desde el celular
adb shell curl -s -o /dev/null -w '%{http_code}\n' http://localhost:18080/api/v1/servicios

# Logs de la app en el celular
npm run android:logs

# Solo errores de la consola del WebView
adb logcat -d | grep "Capacitor/Console"

# La pantalla del celular (mirror)
scrcpy -s $(adb devices | awk 'NR==2{print $1}')

# ¿Está la pantalla encendida? (si está dormida, el login falla)
adb shell dumpsys power | grep mWakefulness

# ¿Qué app tiene el foco?
adb shell dumpsys window | grep mCurrentFocus
```

### Si el login dice "Respuesta inesperada"

Causas, en orden de probabilidad:

1. **APK viejo instalado** (con `androidScheme: https` → la API se bloquea por CORS).
   Solución: `adb uninstall com.bookly.app` y `npm run celular:conectar`.
2. **Falta `adb reverse`**: `adb reverse tcp:18080 tcp:18080`
3. **Celular dormido**: `adb shell input keyevent KEYCODE_WAKEUP`
4. **Otra app en primer plano** (Zoom, panel de notificaciones): `adb shell am start -n com.bookly.app/.MainActivity`

---

## Estructura

```
frontend/
├── scripts/               # todo.sh, conectar.sh, desarrollo.sh, mfa-codigo.mjs
├── tests/e2e/             # suite Playwright (393 tests) + seed
├── android/               # proyecto Android nativo (Capacitor)
│   ├── app/build/outputs/  # APKs y AAB generados
│   ├── key.properties     # credenciales de firma (NO versionar)
│   └── bookly-release.keystore
├── src/
│   ├── lib/styles/        # tokens de diseño (paleta, tipografía, spacing)
│   ├── lib/components/    # UI compartida
│   └── routes/            # páginas por rol
└── MOBILE-README.md       # documentación del APK
```
