#!/usr/bin/env bash
# =============================================================================
# auto-instalar.sh — Instala el APK automáticamente cada vez que conectas
#                     el celular.
#
# Cómo usarlo (una sola vez):
#   1. Conecta el celular por USB y acepta la depuración.
#   2. Ejecuta:  bash scripts/auto-instalar.sh --instalar
#      Esto deja el script corriendo en segundo plano.
#   3. Cada vez que conectes el celular, instala y abre el APK solo.
#
# Para detenerlo:  bash scripts/auto-instalar.sh --detener
# Para ver el registro:  tail -f /tmp/bookly-autoinstall.log
# =============================================================================
set -uo pipefail

export PATH="$PATH:$HOME/.local/bin"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
ADB="$ANDROID_HOME/platform-tools/adb"

PKG="com.bookly.app"
PROJECT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APK="$PROJECT/android/app/build/outputs/apk/release/app-release.apk"

LOG="/tmp/bookly-autoinstall.log"
PIDFILE="/tmp/bookly-autoinstall.pid"

GREEN='\033[0;32m'; CYAN='\033[0;36m'; RED='\033[0;31m'; YELLOW='\033[0;33m'; OFF='\033[0m'
ok()   { printf "${GREEN}✔${OFF} %s\n" "$*"; }
info() { printf "${CYAN}→${OFF} %s\n" "$*"; }
warn() { printf "${YELLOW}!${OFF} %s\n" "$*"; }
err()  { printf "${RED}✘${OFF} %s\n" "$*"; }

log() { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*" >>"$LOG"; }

# ------------------------------------------------------------------ parar
if [[ "${1:-}" == "--detener" ]]; then
  if [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    kill "$(cat "$PIDFILE")" 2>/dev/null
    rm -f "$PIDFILE"
    ok "Auto-instalación detenida."
  else
    warn "No había auto-instalación corriendo."
  fi
  exit 0
fi

if [[ "${1:-}" == "--estado" ]]; then
  if [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    ok "Auto-instalación activa (pid $(cat "$PIDFILE"))."
  else
    warn "Auto-instalación inactiva."
  fi
  exit 0
fi

# ------------------------------------------------------------------ inicio
if [[ ! -f "$APK" ]]; then
  err "No existe el APK en $APK"
  err "Genera uno con:  npm run android:apk:release"
  exit 1
fi

if [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
  warn "Ya está corriendo (pid $(cat "$PIDFILE"))."
  exit 0
fi

info "Iniciando la auto-instalación en segundo plano…"
info "Conecta el celular por USB: se instalará y abrirá sola."
info "Registro:  tail -f $LOG"
info "Detener:   bash scripts/auto-instalar.sh --detener"

# El proceso real corre desacoplado de esta terminal.
nohup bash -c '
  export ANDROID_HOME="$HOME/Android/Sdk"
  ADB="$ANDROID_HOME/platform-tools/adb"
  LOG="/tmp/bookly-autoinstall.log"
  PKG="com.bookly.app"
  APK="'"$APK"'"

  # El log() del script padre no existe en este subshell: se define aquí.
  log() { printf "[%s] %s\n" "$(date "+%H:%M:%S")" "$*" >>"$LOG"; }

  log "--- watcher iniciado ---"
  # Espera a que el backend esté disponible.
  while ! curl -s -o /dev/null http://127.0.0.1:18080/api/v1/servicios; do
    sleep 5
  done
  log "backend disponible"

  known=""
  while true; do
    devs=$("$ADB" devices | awk "NR>1 && \$2==\"device\" {print \$1}")
    for dev in $devs; do
      # No repetimos con el mismo dispositivo.
      if [[ "$dev" == "$known" ]]; then continue; fi

      log "dispositivo conectado: $dev"
      "$ADB" -s "$dev" reverse tcp:18080 tcp:18080 >/dev/null 2>&1 && log "puerto 18080 redirigido"

      if "$ADB" -s "$dev" install -r "$APK" 2>&1 | grep -q "Success"; then
        log "APK instalado correctamente"
        sleep 1
        "$ADB" -s "$dev" shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
        log "app abierta"
      else
        log "fallo la instalación (¿firmado distinto?)"
      fi
      known="$dev"
    done

    # Si se desconecta, forgotten para reinstalar al reconectar.
    if [[ -z "$devs" ]]; then
      known=""
    fi
    sleep 2
  done
' >>"$LOG" 2>&1 &

echo $! >"$PIDFILE"
sleep 1
ok "Auto-instalación activa (pid $(cat "$PIDFILE"))."
echo
echo "  Conecta el celular por USB y acepta la depuración."
echo "  El APK se instalará y se abrirá automáticamente."
echo
echo "  Ver registro:  tail -f $LOG"
echo "  Detener:       bash scripts/auto-instalar.sh --detener"
