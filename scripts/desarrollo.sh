#!/usr/bin/env bash
# =============================================================================
# desarrollo.sh — Flujo completo de desarrollo contra el celular real.
#
#   · Levanta el backend (Docker) y el frontend (Vite) en el puerto 5173.
#   · Espera a que ambos estén listos.
#   · Conecta el celular, instala el APK y abre el mirror de pantalla.
#   · En modo --watch, reinstala el APK cada vez que recompila el frontend.
#
# Uso:
#   bash scripts/desarrollo.sh              # todo
#   bash scripts/desarrollo.sh --sin-mirror # sin ventana de mirror
#   bash scripts/desarrollo.sh --watch      # reinstala al recompilar
# =============================================================================
set -uo pipefail

export PATH="$PATH:$HOME/.local/bin"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
ADB="$ANDROID_HOME/platform-tools/adb"
SCRCPY="$HOME/.local/bin/scrcpy"

PKG="com.bookly.app"
PROJECT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$(cd "$PROJECT/.." && pwd)/backendcf"

GREEN='\033[0;32m'; CYAN='\033[0;36m'; RED='\033[0;31m'; YELLOW='\033[0;33m'; OFF='\033[0m'
ok()   { printf "${GREEN}✔${OFF} %s\n" "$*"; }
info() { printf "${CYAN}→${OFF} %s\n" "$*"; }
warn() { printf "${YELLOW}!${OFF} %s\n" "$*"; }
err()  { printf "${RED}✘${OFF} %s\n" "$*"; }

SIN_MIRROR=0
WATCH=0
for arg in "$@"; do
  case "$arg" in
    --sin-mirror) SIN_MIRROR=1 ;;
    --watch)      WATCH=1 ;;
    -h|--help)    sed -n '2,15p' "$0"; exit 0 ;;
  esac
done

mkdir -p /tmp/opencode/logs

# ------------------------------------------------------------------ backend
info "Levantando el backend…"
if ! curl -s -o /dev/null --max-time 3 http://127.0.0.1:18080/api/v1/servicios; then
  (cd "$BACKEND" && docker compose up -d >/tmp/opencode/logs/backend.log 2>&1)
  info "Esperando al backend…"
  for i in $(seq 1 60); do
    if curl -s -o /dev/null --max-time 3 http://127.0.0.1:18080/api/v1/servicios; then
      break
    fi
    sleep 2
  done
fi
if curl -s -o /dev/null --max-time 3 http://127.0.0.1:18080/api/v1/servicios; then
  ok "Backend listo en :18080"
else
  err "El backend no responde. Revisa /tmp/opencode/logs/backend.log"
  exit 1
fi

# ---------------------------------------------------------------- frontend
if ! curl -s -o /dev/null --max-time 3 http://127.0.0.1:5173/login; then
  info "Levantando el frontend…"
  (cd "$PROJECT" && nohup npm run dev >/tmp/opencode/logs/frontend.log 2>&1 &)
  for i in $(seq 1 40); do
    if curl -s -o /dev/null --max-time 3 http://127.0.0.1:5173/login; then break; fi
    sleep 1
  done
fi
if curl -s -o /dev/null --max-time 3 http://127.0.0.1:5173/login; then
  ok "Frontend listo en :5173"
else
  err "El frontend no responde. Revisa /tmp/opencode/logs/frontend.log"
  exit 1
fi

# ---------------------------------------------------------------- dispositivo
info "Esperando el celular…"
DEV=""
for i in $(seq 1 30); do
  DEV=$("$ADB" devices | awk 'NR>1 && $2=="device" && $1 !~ /^emulator/ {print $1; exit}')
  [[ -n "$DEV" ]] && break
  sleep 1
done

if [[ -z "$DEV" ]]; then
  warn "No hay celular conectado (sigo con el emulador si lo hay)."
  DEV=$("$ADB" devices | awk 'NR>1 && $2=="device" {print $1; exit}')
fi

if [[ -n "$DEV" ]]; then
  MODELO=$("$ADB" -s "$DEV" shell getprop ro.product.model 2>/dev/null | tr -d '\r')
  ok "Dispositivo: $DEV ($MODELO)"
  "$ADB" -s "$DEV" reverse tcp:18080 tcp:18080 >/dev/null 2>&1 && \
    ok "Puerto 18080 redirigido al PC"
else
  warn "Sin dispositivo: solo queda el frontend web."
fi

# ------------------------------------------------------ watcher de cambios
if [[ "$WATCH" -eq 1 && -n "$DEV" ]]; then
  info "Modo watch: el APK se reinstala al recompilar el frontend."
  (
    while true; do
      if [[ "$PROJECT/build/index.html" -nt /tmp/opencode/logs/.apk-watch-stamp ]]; then
        touch /tmp/opencode/logs/.apk-watch-stamp
        info "Detectado cambio: recompilando…"
        if (cd "$PROJECT" && npm run android:apk:release >>/tmp/opencode/logs/apk-build.log 2>&1); then
          "$ADB" -s "$DEV" install -r "$PROJECT/android/app/build/outputs/apk/release/app-release.apk" 2>&1 | grep -q Success && \
            { ok "APK reinstalado"; "$ADB" -s "$DEV" shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1; }
        else
          err "Falló la compilación. Ver /tmp/opencode/logs/apk-build.log"
        fi
      fi
      sleep 4
    done
  ) &
fi

# ---------------------------------------------------------------- mirror
if [[ "$SIN_MIRROR" -eq 0 && -n "$DEV" && -x "$SCRCPY" ]]; then
  info "Abriendo el mirror de pantalla (Ctrl+C para cerrar)…"
  "$ADB" -s "$DEV" shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
  sleep 2
  "$SCRCPY" -s "$DEV" --turn-screen-off --stay-awake
else
  echo
  ok "Todo listo."
  echo "  Frontend:  http://127.0.0.1:5173"
  echo "  Backend:   http://127.0.0.1:18080"
  [[ -n "$DEV" ]] && echo "  Celular:   $DEV conectado (adb reverse :18080 activo)"
  echo
  echo "  Para el mirror:  scrcpy -s $DEV"
fi
