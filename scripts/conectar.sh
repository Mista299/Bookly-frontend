#!/usr/bin/env bash
# =============================================================================
# conectar.sh — Conecta tu celular al PC y deja todo listo.
#
#   1. Activa la depuración USB en el celular (una sola vez, a mano).
#   2. Conecta el cable y ejecuta este script.
#   3. Mirror de la pantalla del celular en el PC, con control desde el ratón.
#
# Uso:
#   bash scripts/conectar.sh              # conectar + mirror
#   bash scripts/conectar.sh --sin-mirror # solo conectar e instalar
#   bash scripts/conectar.sh --wireless  # conectar por Wi-Fi (sin cable)
# =============================================================================
set -uo pipefail

export PATH="$PATH:$HOME/.local/bin"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
ADB="$ANDROID_HOME/platform-tools/adb"
SCRCPY="$HOME/.local/bin/scrcpy"

PKG="com.bookly.app"
PROJECT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GREEN='\033[0;32m'; YELLOW='\033[0;33m'; CYAN='\033[0;36m'; RED='\033[0;31m'; BOLD='\033[1m'; OFF='\033[0m'

ok()   { printf "${GREEN}✔${OFF} %s\n" "$*"; }
info() { printf "${CYAN}→${OFF} %s\n" "$*"; }
warn() { printf "${YELLOW}!${OFF} %s\n" "$*"; }
err()  { printf "${RED}✘${OFF} %s\n" "$*"; }

SIN_MIRROR=0
WIRELESS=0
for arg in "$@"; do
  case "$arg" in
    --sin-mirror) SIN_MIRROR=1 ;;
    --wireless)   WIRELESS=1 ;;
    -h|--help)    sed -n '2,14p' "$0"; exit 0 ;;
    *) err "Opción desconocida: $arg"; exit 1 ;;
  esac
done

# --------------------------------------------------------------- dispositivo
if [[ "$WIRELESS" -eq 1 ]]; then
  info "Modo inalámbrico. Deja el USB conectado la primera vez."
  "$ADB" devices | awk 'NR>1 && $2=="device" {print $1; exit}' | while read -r dev; do
    # Habilita el modo inalámbrico (Android 11+).
    "$ADB" -s "$dev" shell "cmd wifi connect-android-11" >/dev/null 2>&1 || true
  done
  info "Buscando equipos con depuración inalámbrica activada…"
  sleep 2
fi

info "Esperando el dispositivo…"
for i in $(seq 1 90); do
  DEVS=$("$ADB" devices | awk 'NR>1 && $2=="device" {print $1}')
  if [[ -n "$DEVS" ]]; then break; fi
  sleep 1
done

if [[ -z "${DEVS:-}" ]]; then
  err "No se detectó ningún celular."
  cat <<'EOS'

  Revisa esto:
    1. En el celular: Ajustes → Acerca del teléfono → pulsa 7 veces
       "Número de compilación" para abrir las opciones de desarrollador.
    2. Ajustes → Sistema → Opciones de desarrollador → "Depuración USB" ON.
    3. Cambia el cable USB: algunos solo cargan, no transmiten datos.
       Usa un cable que haya servido para transferir archivos.
    4. Acepta el diálogo "¿Permitir depuración USB?" en el celular.
       Marca "Permitir siempre desde este equipo".

  Después vuelve a ejecutar:  bash scripts/conectar.sh
EOS
  exit 1
fi

# Elige el primer dispositivo que no sea emulador.
DEV=$(echo "$DEVS" | grep -v '^emulator' | head -1)
[[ -z "$DEV" ]] && DEV=$(echo "$DEVS" | head -1)

ok "Celular conectado: $DEV"

# ------------------------------------------------------------------ info
MODELO=$("$ADB" -s "$DEV" shell getprop ro.product.model 2>/dev/null | tr -d '\r')
ANDROID=$("$ADB" -s "$DEV" shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
SDK=$("$ADB" -s "$DEV" shell getprop ro.build.version.sdk 2>/dev/null | tr -d '\r')
info "Dispositivo: $MODELO · Android $ANDROID (API $SDK)"

# ------------------------------------------------- empathetic: api URL
# El APK llama a http://localhost:18080 → hay que redirigir al host.
if "$ADB" -s "$DEV" reverse tcp:18080 tcp:18080 >/dev/null 2>&1; then
  ok "Puerto 18080 redirigido al PC (adb reverse)"
else
  warn "No se pudo redirigir el puerto 18080. La app no достиzará el backend."
fi

# --------------------------------------------------------------- instalar
APK="$PROJECT/android/app/build/outputs/apk/release/app-release.apk"
if [[ -f "$APK" ]]; then
  info "Instalando el APK release firmado…"
  if "$ADB" -s "$DEV" install -r "$APK" 2>&1 | tail -1 | grep -q "Success"; then
    ok "App instalada (release firmado)"
  else
    warn "Falló la instalación. Reintentando con desinstalación previa…"
    "$ADB" -s "$DEV" uninstall "$PKG" >/dev/null 2>&1
    if "$ADB" -s "$DEV" install "$APK" 2>&1 | tail -1 | grep -q "Success"; then
      ok "App instalada (release firmado)"
    else
      err "No se pudo instalar el APK."
    fi
  fi
else
  warn "No existe el APK. Genéralo con: npm run android:apk:release"
fi

# --------------------------------------------------------------- abrir
if [[ "$SIN_MIRROR" -eq 0 ]]; then
  "$ADB" -s "$DEV" shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
  sleep 2
fi

# ---------------------------------------------------------------- mirror
if [[ "$SIN_MIRROR" -eq 1 ]]; then
  ok "Listo. Para ver la pantalla:  scrcpy"
  exit 0
fi

if [[ ! -x "$SCRCPY" ]]; then
  warn "scrcpy no está instalado. Mirror manual con:"
  echo "    $ANDROID_HOME/platform-tools/adb exec-out screencap -p > pantalla.png"
  exit 0
fi

cat <<'EOS'

────────────────────────────────────────────────────────────
 Mirror de pantalla iniciado en una ventana aparte.

   · Arrastra con el ratón = tocar la pantalla del celular
   · Rueda del ratón     = deslizar (scroll)
   · Ctrl+Z              = botón atrás de Android
   · Ctrl+C              = cerrar el mirror
────────────────────────────────────────────────────────────
EOS

exec "$SCRCPY" -s "$DEV" --turn-screen-off --stay-awake
