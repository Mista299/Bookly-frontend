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
# Se espera hasta 90s: tras reiniciar el server de adb el dispositivo puede
# tardar en reconectarse, y con un celular real el cable se negocia lento.
info "Esperando el celular…"
DEV=""
for i in $(seq 1 90); do
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

  # Instala el APK. En modo watch se usa el de debug: el watcher reinstala
  # ese mismo build, y cambiar de firma entre instalaciones fallaría.
  if [[ "$WATCH" -eq 1 ]]; then
    APK_A_INSTALAR="$PROJECT/android/app/build/outputs/apk/debug/app-debug.apk"
    [[ -f "$APK_A_INSTALAR" ]] || (cd "$PROJECT" && npm run android:apk >/dev/null 2>&1)
  else
    APK_A_INSTALAR="$PROJECT/android/app/build/outputs/apk/release/app-release.apk"
    [[ -f "$APK_A_INSTALAR" ]] || (cd "$PROJECT" && npm run android:apk:release >/dev/null 2>&1)
  fi

  if [[ -f "$APK_A_INSTALAR" ]]; then
    if "$ADB" -s "$DEV" install -r "$APK_A_INSTALAR" 2>&1 | grep -q Success; then
      ok "APK instalado ($(basename "$APK_A_INSTALAR"))"
    else
      # Puede haber una versión anterior con otra firma: se desinstala.
      warn "Reinstalando (firma distinta)…"
      "$ADB" -s "$DEV" uninstall com.bookly.app >/dev/null 2>&1
      "$ADB" -s "$DEV" install "$APK_A_INSTALAR" 2>&1 | grep -q Success && \
        ok "APK instalado"
    fi
  else
    warn "No se pudo generar el APK. Ver npm run android:apk"
  fi
else
  warn "Sin dispositivo: solo queda el frontend web."
fi

# ------------------------------------------------------ watcher de cambios
# Reinstala el APK cada vez que el frontend se recompila.
#
# El sello es el hash del build, no la fecha: comparar por fecha realimentaba
# el bucle (la propia compilación generaba un build más nuevo y disparaba
# otra compilación, indefinidamente).
#
# Usa el APK de debug: el release firmado tarda minutos en compilarse y para
# iterar es demasiado lento. La app instalada queda firmada con la clave de
# debug, que es la que espera el emulador.
if [[ "$WATCH" -eq 1 && -n "$DEV" ]]; then
  info "Modo watch: el APK se reinstala al recompilar el frontend."
  STAMP="/tmp/opencode/logs/.apk-watch-stamp"
  mkdir -p "$(dirname "$STAMP")"

  # El primer ciclo no reinstala: la app ya está instalada arriba.
  if [[ -f "$PROJECT/build/index.html" ]]; then
    md5sum "$PROJECT/build/index.html" | cut -d' ' -f1 >"$STAMP"
  fi

  (
    while true; do
      if [[ -f "$PROJECT/build/index.html" ]]; then
        actual=$(md5sum "$PROJECT/build/index.html" | cut -d' ' -f1)
        previo=$(cat "$STAMP" 2>/dev/null || echo "")

        if [[ -n "$actual" && "$actual" != "$previo" ]]; then
          echo "$actual" >"$STAMP"
          info "Cambio detectado: reconstruyendo el APK…"

          # Compila solo el bundle web y lo copia a android/ (sin Gradle
          # completo): para iterar, el build web es lo que cambia.
          if (cd "$PROJECT" && npm run build:android >>/tmp/opencode/logs/apk-build.log 2>&1 && \
              npx cap copy android >>/tmp/opencode/logs/apk-build.log 2>&1); then
            if (cd "$PROJECT/android" && ./gradlew assembleDebug -q >>/tmp/opencode/logs/apk-build.log 2>&1); then
              APK_DEBUG="$PROJECT/android/app/build/outputs/apk/debug/app-debug.apk"
              if "$ADB" -s "$DEV" install -r "$APK_DEBUG" 2>&1 | grep -q Success; then
                ok "APK reinstalado (debug)"
                "$ADB" -s "$DEV" shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
              else
                err "Falló la instalación. Ver /tmp/opencode/logs/apk-build.log"
              fi
            else
              err "Falló Gradle. Ver /tmp/opencode/logs/apk-build.log"
            fi
          else
            err "Falló la compilación. Ver /tmp/opencode/logs/apk-build.log"
          fi
        fi
      fi
      sleep 3
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
