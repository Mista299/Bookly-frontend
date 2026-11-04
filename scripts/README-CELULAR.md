# Desarrollo contra el celular real

Conectar tu celular al PC, ver su pantalla en el monitor y que la app se
instale sola al enchufar el cable.

---

## 1. Preparar el celular (una sola vez)

En el **celular**:

1. **Ajustes → Acerca del teléfono** → pulsa **7 veces** "Número de compilación".
   Aparece el mensaje "Ya eres desarrollador".
2. **Ajustes → Sistema → Opciones de desarrollador** → activa **Depuración USB**.
3. Conecta el cable USB y acepta el diálogo **"¿Permitir depuración USB?"**.
   Marca **"Permitir siempre desde este equipo"**.

> Si el diálogo no aparece, el cable solo carga. Usa uno que ya haya servido
> para transferir archivos, o prueba otro puerto USB.

En el **PC**: la primera vez, `adb` pide la huella RSA del equipo. Acepta
("Aceptar todo" / "Always allow").

---

## 2. Conectar y ver la pantalla

```bash
cd frontend
bash scripts/conectar.sh
```

Qué hace:

| Paso | Resultado |
|---|---|
| Detecta el celular | Muestra modelo y versión de Android |
| `adb reverse tcp:18080` | El celular alcanza el backend del PC |
| Instala el APK release firmado | La app queda lista |
| Abre la app | Arranca en el celular |
| Lanza **scrcpy** | Ventana con la pantalla del celular |

### En la ventana de scrcpy

| Acción | Resultado |
|---|---|
| Arrastrar con el ratón | Tocar la pantalla del celular |
| Rueda del ratón | Deslizar (scroll) |
| `Ctrl` + `Z` | Botón **atrás** de Android |
| `Ctrl` + `C` | Cerrar el mirror |

Opciones alternativas:

```bash
bash scripts/conectar.sh --sin-mirror   # conectar e instalar, sin ventana
bash scripts/conectar.sh --wireless     # por Wi-Fi, sin cable
scrcpy -s <serial>                      # mirror manual
```

---

## 3. Instalación automática al conectar

Activa el watcher una vez y olvídate:

```bash
bash scripts/auto-instalar.sh --instalar
```

A partir de ahí, **cada vez que enchufes el celular** se instala el APK y se
abre la app solo.

```bash
bash scripts/auto-instalar.sh --estado    # ¿está activo?
bash scripts/auto-instalar.sh --detener   # apagarlo
tail -f /tmp/bookly-autoinstall.log       # ver qué está pasando
```

El registro muestra cada paso:

```
[20:05:17] --- watcher iniciado ---
[20:05:17] backend disponible
[20:05:17] dispositivo conectado: R5CT30XXXXX
[20:05:17] puerto 18080 redirigido
[20:05:21] APK instalado correctamente
[20:05:23] app abierta
```

---

## 4. Flujo completo de desarrollo

```bash
bash scripts/desarrollo.sh
```

Levanta backend + frontend, instala el APK, abre el mirror. Añade `--watch`
para que **reinstale el APK automáticamente** cada vez que recompiles:

```bash
bash scripts/desarrollo.sh --watch
```

Detecta los cambios en `build/index.html` y reconstruye y reinstala solo.
El registro de la compilación está en `/tmp/opencode/logs/apk-build.log`.

---

## 5. Por qué el celular necesita `adb reverse`

El APK llama a `http://localhost:18080/api/v1`. En el celular, `localhost`
es **el propio teléfono**, no tu PC. `adb reverse` hace que ese puerto
apunte a tu máquina:

```
celular:localhost:18080  ──adb reverse──>  PC:18080 (backend)
```

Por eso el script lo ejecuta siempre antes de instalar.

**Sin `adb reverse`** la app arranca pero la API falla con
*"Se requiere autenticación"* en todas las peticiones.

---

## 6. Conectar por Wi-Fi (sin cable)

1. En el celular: Opciones de desarrollador → **Depuración inalámbrica** ON.
2. Mismo Wi-Fi el PC y el celular.
3. ```bash
   adb pair <ip-del-celular>:<puerto>    # el código lo muestra el celular
   adb connect <ip-del-celular>:5555
   bash scripts/conectar.sh
   ```

---

## 7. Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `adb: device not found` | Depuración USB off o cable de solo carga | Activa la depuración; cambia de cable/puerto |
| El diálogo de huella no aparece | La depuración quedó desactivada | Reinicia la depuración USB y acepta el diálogo |
| La app abre pero todo falla | Falta `adb reverse` | `adb reverse tcp:18080 tcp:18080` |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Firma distinta a la instalada | `adb uninstall com.bookly.app` y reinstala |
| scrcpy no encuentra el dispositivo | Versiones de adb distintas | Usa el adb del SDK: `~/Android/Sdk/platform-tools/adb` |
| Pantalla del PC en negro | El celular está en reposo | `--stay-awake` (ya viene activado en los scripts) |

### Ver los logs de la app en el celular

```bash
adb logcat | grep -iE "bookly|Capacitor|chromium"
```

Desde el PC, sin necesidad de cable:

```bash
adb logcat -d | grep -i "Capacitor/Console"
```

---

## 8. El segundo factor (MFA) del administrador

El admin usa TOTP: pide un **código de 6 dígitos** además de la contraseña.
Es el mismo código que mostraría Google Authenticator, pero sin la app.

```bash
npm run mfa:codigo          # muestra el código vigente
npm run mfa:codigo -- --loop  # lo refresca solo cada segundo
```

```
  admin@bookly.local
  ┌───────────────┐
  │  4 7 2 3 2 5  │
  └───────────────┘
  Vence en 23s
```

Los códigos rotan cada 30 segundos. Si expira, vuelve a ejecutar el comando.

### Si prefieres configurar el segundo factor desde la app

La primera vez, el admin **no** tiene MFA y la app muestra un QR con el secret.
Ahí es donde normalement lo escaneas con Google Authenticator / Aegis.

Para volver a ese estado (y que la app muestre el QR otra vez):

```bash
npm run mfa:reset
```

Después, al entrar con el admin, aparece la pantalla **"Activar segundo factor"**
con el código QR y el secret en texto. Puedes escanearlo con tu app de
autenticación o copiarlo a mano.

### Re-enrolar sin pasar por la app

Si quieres que el admin quede con MFA y que `npm run mfa:codigo` funcione
directamente:

```bash
npm run mfa:enrolar
```

Ojo: **las corridas de tests desactivan el MFA del admin** (el `global-setup`
lo resetea para que las specs recorran el flujo de setup). Si después de correr
los tests el código falla, reenróyalo:

```bash
npm run mfa:enrolar
```

O pídele al seed que lo deje enrolado:

```bash
MFA_ADMIN=1 npm run seed:e2e
```

### Otros usuarios

```bash
npm run mfa:codigo -- cliente.maria@bookly.local
```

Los clientes y profesionales **no** tienen MFA: con su correo y contraseña
entran directo.

### Sobre "el backend local en el celular"

El script del MFA y la app del celular usan **el mismo backend**:

```
script mfa-codigo  ──lee──>  base de datos (contenedor backendcf-db)
                                          ▲
app en el celular  ──adb reverse──>  backend :18080 en el PC
```

El script habla con la base de datos directamente (para descifrar el secret);
la app habla con la API. Ambos apuntan al mismo `docker compose` del backend
local, así que el código que te da el script es **exactamente** el que acepta
la app en el celular.

Comprobado desde el propio dispositivo:

```bash
adb shell curl -s -X POST http://localhost:18080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@bookly.local","password":"Admin123!Pass"}'
```

---

## 9. Requisitos instalados en el PC

| Herramienta | Ubicación | Para qué |
|---|---|---|
| `adb` | `~/Android/Sdk/platform-tools/adb` | Conectar el celular |
| `scrcpy` 5.0.1 | `~/.local/bin/scrcpy` | Mirror de pantalla |

Si `scrcpy` no aparece en el PATH:

```bash
export PATH="$PATH:$HOME/.local/bin"
```
