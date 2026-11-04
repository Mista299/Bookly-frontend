#!/usr/bin/env bash
# =============================================================================
# seed-e2e.sh — Seed de datos de dominio para los tests E2E del frontend.
#
# El seed de Flyway del backend usa servicios genéricos (Legal, Yoga, Limpieza),
# pero el frontend BOOKLY está diseñado para el dominio de salón de belleza
# (Peluquería, Manos y Pies, Maquillaje). Este script crea/adopta los servicios,
# profesionales y reservas que las specs esperan.
#
# Es idempotente: si el servicio ya existe (por nombre), lo reutiliza.
#
# Uso:
#   bash tests/e2e/seed-e2e.sh
#   RESET=1 bash tests/e2e/seed-e2e.sh   # borra primero los datos E2E
# =============================================================================
set -euo pipefail

API="${API:-http://127.0.0.1:18080/api/v1}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@bookly.local}"
PROJECT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ADMIN_PASS="${ADMIN_PASS:-Admin123!Pass}"
PROF_PASS="${PROF_PASS:-Prof123!Pass}"
CUST_PASS="${CUST_PASS:-Client123!Pass}"

log()  { printf '\033[0;36m[seed]\033[0m %s\n' "$*"; }
ok()   { printf '\033[0;32m[ok]\033[0m   %s\n' "$*"; }
warn() { printf '\033[0;33m[warn]\033[0m %s\n' "$*"; }
die()  { printf '\033[0;31m[fail]\033[0m %s\n' "$*" >&2; exit 1; }

jqv() { python3 -c "import sys,json;d=json.load(sys.stdin);print(d$1)" 2>/dev/null || true; }

# ---------------------------------------------------------------- admin token
# El admin del seed tiene MFA activo, así que /auth/login devuelve un mfaToken.
# Para el seed usamos la API de plataforma/setup o el login MFA si es posible.
admin_login() {
  curl -sS -X POST "$API/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}"
}

log "Autenticando admin ($ADMIN_EMAIL)…"
LOGIN_JSON="$(admin_login)"
ADMIN_TOKEN="$(printf '%s' "$LOGIN_JSON" | jqv "['accessToken']")"
MFA_TOKEN="$(printf '%s' "$LOGIN_JSON" | jqv "['mfaToken']")"

if [[ -z "$ADMIN_TOKEN" || "$ADMIN_TOKEN" == "None" ]]; then
  if [[ -n "$MFA_TOKEN" && "$MFA_TOKEN" != "None" ]]; then
    # Admin enrolado: el secret no es recuperable por API.
    # Si /mfa/enroll falla con INVALID_MFA_TOKEN, el admin ya tenía MFA activo:
    # en ese caso pedimos un reset de la DB (ver README de tests) y reintentamos.
    warn "Admin requiere MFA. Intentando enrolar secret de pruebas…"
    ENROLL_JSON="$(curl -sS -X POST "$API/auth/mfa/enroll" \
      -H 'Content-Type: application/json' \
      -d "{\"mfaToken\":\"$MFA_TOKEN\"}")"
    SECRET="$(printf '%s' "$ENROLL_JSON" | jqv "['secret']")"

    if [[ -z "$SECRET" || "$SECRET" == "None" ]]; then
      warn "MFA ya enrolado (secret desconocido). Reseteando MFA del admin en la DB…"
      docker exec backendcf-db psql -U backendcf -d backendcf -c \
        "UPDATE app_user SET mfa_enabled=false, mfa_secret_encrypted=NULL, failed_login_attempts=0, locked_until=NULL WHERE email='$ADMIN_EMAIL';" >/dev/null 2>&1 || true
      LOGIN_JSON="$(admin_login)"
      ADMIN_TOKEN="$(printf '%s' "$LOGIN_JSON" | jqv "['accessToken']")"
      MFA_TOKEN="$(printf '%s' "$LOGIN_JSON" | jqv "['mfaToken']")"
      # Tras el reset, el login devuelve mfaSetupRequired + mfaToken (sin accessToken).
      # Enrolamos con ese token nuevo.
      if [[ -z "$ADMIN_TOKEN" || "$ADMIN_TOKEN" == "None" ]]; then
        [[ -z "$MFA_TOKEN" || "$MFA_TOKEN" == "None" ]] && die "Login admin falló tras reset: $LOGIN_JSON"
        ENROLL_JSON="$(curl -sS -X POST "$API/auth/mfa/enroll" \
          -H 'Content-Type: application/json' \
          -d "{\"mfaToken\":\"$MFA_TOKEN\"}")"
        SECRET="$(printf '%s' "$ENROLL_JSON" | jqv "['secret']")"
      fi
    fi

    if [[ -z "$SECRET" || "$SECRET" == "None" ]]; then
      die "No se pudo enrolar MFA: $ENROLL_JSON"
    fi
    CODE="$(python3 - "$SECRET" <<'PY'
import sys, hmac, hashlib, base64, struct, time
secret = sys.argv[1].replace(' ', '').upper()
secret += '=' * ((8 - len(secret) % 8) % 8)
key = base64.b32decode(secret)
counter = int(time.time()) // 30
hm = hmac.new(key, struct.pack('>Q', counter), hashlib.sha1).digest()
o = hm[-1] & 0x0F
code = (struct.unpack('>I', hm[o:o+4])[0] & 0x7FFFFFFF) % 1000000
print(f'{code:06d}')
PY
)"
    CONFIRM_JSON="$(curl -sS -X POST "$API/auth/mfa/enroll/confirm" \
      -H 'Content-Type: application/json' \
      -d "{\"mfaToken\":\"$MFA_TOKEN\",\"code\":\"$CODE\",\"trustDevice\":true}")"
    ADMIN_TOKEN="$(printf '%s' "$CONFIRM_JSON" | jqv "['accessToken']")"
    [[ -z "$ADMIN_TOKEN" || "$ADMIN_TOKEN" == "None" ]] && \
      ADMIN_TOKEN="$(printf '%s' "$CONFIRM_JSON" | jqv "['session']['accessToken']")"
    [[ -z "$ADMIN_TOKEN" || "$ADMIN_TOKEN" == "None" ]] && \
      ADMIN_TOKEN="$(printf '%s' "$CONFIRM_JSON" | jqv "['authResponse']['accessToken']")"
  fi
fi

[[ -z "$ADMIN_TOKEN" || "$ADMIN_TOKEN" == "None" ]] && die "Login admin falló: $LOGIN_JSON"
ok "Token admin obtained"

AH=(-H "Authorization: Bearer $ADMIN_TOKEN")

# ---------------------------------------------------------------- servicios
# (nombre, categoría, duración, precio, descripción)
SERVICES=(
  "Corte clásico|Peluquería|45|35.00|Corte de cabello para mujer con lavado y peinado"
  "Corte caballero|Peluquería|30|25.00|Corte corto con acabado a medida"
  "Manicura completa|Manos y Pies|60|45.00|Uñas, cutícula, esmaltado y reparación"
  "Pedicura spa|Manos y Pies|50|40.00|Exfoliación, masaje y esmaltado semipermanente"
  "Maquillaje social|Maquillaje|45|55.00|Maquillaje de evento con acabado profesional"
  "Coloración completa|Maquillaje|120|140.00|Coloración de cabello con tratamiento"
)

# Servicios en estado INACTIVO: los usa la spec de filtros de /admin/services.
INACTIVE_SERVICES=(
  "Tinte y color|Peluquería|75|95.00|Coloración con tinte permanente"
)

# Servicios genéricos que trae el seed de Flyway del backend (Legal, Salud,
# Limpieza). Pertenecen a otro dominio y desplazan a los servicios de salón en
# el listadofeatured del home (que hace slice(0,4) sobre el orden alfabético).
# Los desactivamos para que la app muestre el dominio real.
LEGACY_SERVICES=(
  "Asesoría legal"
  "Consulta médica general"
  "Limpieza express"
  "Limpieza profunda"
  "Clase de yoga"
  "Masaje relajante"
  "Limpieza facial"
)

declare -A SVC_ID

find_service_id() {
  local name="$1"
  curl -sS "$API/servicios" "${AH[@]}" | python3 -c "
import sys, json
name = sys.argv[1]
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
for s in (data if isinstance(data, list) else data.get('content', [])):
    if (s.get('name') or s.get('nombre')) == name:
        print(s.get('id',''))
        break
" "$name"
}

log "Asegurando servicios de dominio…"
# Limpia servicios basura que dejaron corridas anteriores de las specs.
docker exec backendcf-db psql -U backendcf -d backendcf -c \
  "DELETE FROM profesional_servicio WHERE servicio_id IN (SELECT id FROM servicios WHERE nombre LIKE 'E2E%');
   DELETE FROM servicios WHERE nombre LIKE 'E2E%';" >/dev/null 2>&1 || true
for spec in "${SERVICES[@]}"; do
  IFS='|' read -r name cat dur price desc <<<"$spec"
  id="$(find_service_id "$name")"
  if [[ -z "$id" ]]; then
    resp="$(curl -sS -X POST "$API/servicios" "${AH[@]}" \
      -H 'Content-Type: application/json' \
      -d "{\"name\":\"$name\",\"description\":\"$desc\",\"category\":\"$cat\",\"durationMinutes\":$dur,\"price\":$price}")"
    id="$(printf '%s' "$resp" | jqv "['id']")"
    if [[ -z "$id" || "$id" == "None" ]]; then
      warn "No se pudo crear '$name': $resp"
      continue
    fi
    ok "  + $name ($cat)"
  else
    ok "  = $name ya existe"
  fi
  SVC_ID["$name"]="$id"
done

log "Asegurando servicios inactivos…"
for spec in "${INACTIVE_SERVICES[@]}"; do
  IFS='|' read -r name cat dur price desc <<<"$spec"
  id="$(find_service_id "$name")"
  if [[ -z "$id" ]]; then
    resp="$(curl -sS -X POST "$API/servicios" "${AH[@]}" \
      -H 'Content-Type: application/json' \
      -d "{\"name\":\"$name\",\"description\":\"$desc\",\"category\":\"$cat\",\"durationMinutes\":$dur,\"price\":$price}")"
    id="$(printf '%s' "$resp" | jqv "['id']")"
    if [[ -z "$id" || "$id" == "None" ]]; then
      warn "No se pudo crear '$name': $resp"
      continue
    fi
    ok "  + $name (inactivo)"
  else
    ok "  = $name ya existe"
  fi
  # Lo dejamos INACTIVO para que la spec de filtros lo encuentre en "Inactivos".
  # El PUT exige todos los campos obligatorios.
  curl -sS "$API/servicios/$id" "${AH[@]}" | python3 -c "
import sys, json
try:
    s = json.load(sys.stdin)
except Exception:
    sys.exit(0)
print(json.dumps({
    'name': s.get('name'),
    'description': s.get('description') or '',
    'category': s.get('category'),
    'durationMinutes': s.get('durationMinutes'),
    'price': s.get('price'),
    'status': 'INACTIVO',
}, ensure_ascii=False))
" | curl -sS -o /dev/null -X PUT "$API/servicios/$id" "${AH[@]}" \
    -H 'Content-Type: application/json' -d @-
  SVC_ID["$name"]="$id"
done

# Desactivamos los servicios genéricos del seed de Flyway: no pertenecen al
# dominio de la app y ocupan los primeros lugares del listado (el home hace
# slice(0,4) sobre el orden alfabético, así que desplazan a los servicios
# reales del salón).
log "Desactivando servicios genéricos del seed de backend…"
for name in "${LEGACY_SERVICES[@]}"; do
  id="$(find_service_id "$name")"
  [[ -z "$id" ]] && continue
  # El PUT exige todos los campos obligatorios: los recuperamos del servicio
  # actual y los reenviamos junto con el nuevo status.
  curl -sS "$API/servicios/$id" "${AH[@]}" | python3 -c "
import sys, json, subprocess, os
try:
    s = json.load(sys.stdin)
except Exception:
    sys.exit(0)
body = {
    'name': s.get('name'),
    'description': s.get('description') or '',
    'category': s.get('category'),
    'durationMinutes': s.get('durationMinutes'),
    'price': s.get('price'),
    'status': 'INACTIVO',
}
print(json.dumps(body, ensure_ascii=False))
" | curl -sS -o /dev/null -X PUT "$API/servicios/$id" "${AH[@]}" \
    -H 'Content-Type: application/json' -d @-
  ok "  - $name → INACTIVO"
done

# ---------------------------------------------------------------- profesionales
# Formato: email|nombre completo|especialidad|servicios (separados por coma)
PROFS=(
  "prof.cristian@bookly.local|Cristian López|Peluquería|Corte clásico,Corte caballero,Coloración completa"
  "prof.valentina@bookly.local|Valentina Cruz|Manos y Pies|Manicura completa,Pedicura spa"
  "prof.mateo@bookly.local|Mateo Silva|Maquillaje|Maquillaje social,Coloración completa"
  "prof.laura@bookly.local|Laura Martínez|Manos y Pies|Manicura completa,Pedicura spa"
  "prof.andres@bookly.local|Andrés Castaño|Peluquería|Corte clásico,Corte caballero"
)

log "Asegurando profesionales…"
for spec in "${PROFS[@]}"; do
  IFS='|' read -r email fullname specialty svc_names <<<"$spec"

  exists="$(curl -sS "$API/usuarios/buscar?q=$email" "${AH[@]}" | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception: sys.exit(0)
items = d if isinstance(d,list) else d.get('content', d.get('usuarios', []))
for u in items:
    if u.get('email')==sys.argv[1]:
        print(u.get('id','')); break
" "$email")"

  if [[ -z "$exists" ]]; then
    resp="$(curl -sS -X POST "$API/profesionales" "${AH[@]}" \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"$email\",\"password\":\"$PROF_PASS\",\"fullName\":\"$fullname\",\"specialty\":\"$specialty\"}")"
    pid="$(printf '%s' "$resp" | jqv "['id']")"
    if [[ -z "$pid" || "$pid" == "None" ]]; then
      warn "No se pudo crear profesional $email: $resp"
      continue
    fi
    ok "  + $email"
  else
    pid="$exists"
    ok "  = $email ya existe"
  fi

  # Normaliza la especialidad y el nombre visible: si quedaron con la lista de
  # servicios pegada (un seed anterior), los corregimos en la DB para que la UI
  # muestre solo la especialidad real.
  docker exec backendcf-db psql -U backendcf -d backendcf -c \
    "UPDATE profesionales SET especialidad = '$specialty' WHERE id = '$pid' AND especialidad <> '$specialty';" >/dev/null 2>&1 || true
  docker exec backendcf-db psql -U backendcf -d backendcf -c \
    "UPDATE app_user SET full_name = '$fullname' WHERE id = '$pid' AND full_name <> '$fullname';" >/dev/null 2>&1 || true

  # Asignar servicios (PUT es idempotente: reemplaza el conjunto completo).
  # Los UUIDs deben ir entrecomillados en el JSON o el backend responde 400.
  ids=""
  IFS=',' read -ra names <<<"$svc_names"
  for n in "${names[@]}"; do
    sid="${SVC_ID[$n]:-}"
    if [[ -z "$sid" ]]; then
      warn "  ! servicio '$n' no encontrado para $email"
      continue
    fi
    ids="${ids:+$ids,}\"$sid\""
  done
  if [[ -n "$ids" ]]; then
    put_resp="$(curl -sS -w '\n%{http_code}' -X PUT "$API/profesionales/$pid/servicios" "${AH[@]}" \
      -H 'Content-Type: application/json' -d "{\"serviceIds\":[$ids]}")"
    put_code="$(printf '%s' "$put_resp" | tail -n1)"
    if [[ "$put_code" == "204" || "$put_code" == "200" ]]; then
      ok "  → servicios asignados a $email"
    else
      warn "  ! asignación falló ($put_code): $(printf '%s' "$put_resp" | head -n1)"
    fi
  fi

  # Horario semanal (lun-vie 09:00-18:00, sáb 10:00-14:00).
  # El endpoint /horarios/{id} exige el token del propio profesional (ownership guard),
  # así que initiation happens con su login.
  prof_token="$(curl -sS -X POST "$API/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"$PROF_PASS\"}" | jqv "['accessToken']")"
  if [[ -n "$prof_token" && "$prof_token" != "None" ]]; then
    sched="$(cat <<'JSON'
{"slots":[
{"dayOfWeek":"MONDAY","startTime":"09:00","endTime":"13:00"},
{"dayOfWeek":"MONDAY","startTime":"15:00","endTime":"19:00"},
{"dayOfWeek":"TUESDAY","startTime":"09:00","endTime":"13:00"},
{"dayOfWeek":"TUESDAY","startTime":"15:00","endTime":"19:00"},
{"dayOfWeek":"WEDNESDAY","startTime":"09:00","endTime":"13:00"},
{"dayOfWeek":"WEDNESDAY","startTime":"15:00","endTime":"19:00"},
{"dayOfWeek":"THURSDAY","startTime":"09:00","endTime":"13:00"},
{"dayOfWeek":"THURSDAY","startTime":"15:00","endTime":"19:00"},
{"dayOfWeek":"FRIDAY","startTime":"09:00","endTime":"13:00"},
{"dayOfWeek":"FRIDAY","startTime":"15:00","endTime":"19:00"}
]}
JSON
)"
    sch_code="$(curl -sS -o /dev/null -w '%{http_code}' -X PUT "$API/horarios/$pid" \
      -H "Authorization: Bearer $prof_token" -H 'Content-Type: application/json' -d "$sched")"
    if [[ "$sch_code" == "200" || "$sch_code" == "204" ]]; then
      ok "  → horario semanal configurado"
    else
      warn "  ! horario falló ($sch_code) para $email"
    fi
  else
    warn "  ! no se pudo iniciar sesión como $email para configurar el horario"
  fi
done

# ---------------------------------------------------------------- clientes
log "Asegurando clientes…"
# nombre completo por email
declare -A CUST_NAMES=(
  ["cliente.maria@bookly.local"]="María García"
  ["carolina.lopez@bookly.local"]="Carolina López"
  ["ana.perez@bookly.local"]="Ana Pérez"
  # Usuarios con nombre realista que las specs de /admin/users esperan encontrar.
  ["maria.restrepo@bookly.local"]="María Restrepo"
  ["juan.perez@bookly.local"]="Juan Pérez"
  ["ana.sanchez@bookly.local"]="Ana Sánchez"
  ["pedro.gomez@bookly.local"]="Pedro Gómez"
)
for email in cliente.maria@bookly.local carolina.lopez@bookly.local ana.perez@bookly.local \
             maria.restrepo@bookly.local juan.perez@bookly.local ana.sanchez@bookly.local pedro.gomez@bookly.local; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$API/auth/register" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"$CUST_PASS\",\"fullName\":\"${CUST_NAMES[$email]}\"}")"
  if [[ "$code" == "201" ]]; then ok "  + $email"; else ok "  = $email ya existe"; fi
  # Normaliza el nombre visible en los casos ya existentes.
  cid="$(curl -sS "$API/usuarios/buscar?q=$email" "${AH[@]}" | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception: sys.exit(0)
items = d if isinstance(d,list) else d.get('content', d.get('usuarios', []))
for u in items:
    if u.get('email')==sys.argv[1]: print(u.get('id','')); break
" "$email")"
  [[ -n "$cid" ]] && docker exec backendcf-db psql -U backendcf -d backendcf -c \
    "UPDATE app_user SET full_name = '${CUST_NAMES[$email]}' WHERE id = '$cid' AND full_name <> '${CUST_NAMES[$email]}';" >/dev/null 2>&1 || true
done

# ---------------------------------------------------------------- reservas
log "Creando reservas futuras…"
maria_token="$(curl -sS -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"cliente.maria@bookly.local","password":"Client123!Pass"}' | jqv "['accessToken']")"

if [[ -n "$maria_token" && "$maria_token" != "None" ]]; then
  maria_id="$(curl -sS "$API/usuarios/buscar?q=cliente.maria@bookly.local" "${AH[@]}" | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception: sys.exit(0)
items = d if isinstance(d,list) else d.get('content', d.get('usuarios', []))
for u in items:
    if u.get('email')=='cliente.maria@bookly.local':
        print(u.get('id','')); break
")"

  prof_cristian="$(curl -sS "$API/usuarios/buscar?q=prof.cristian@bookly.local" "${AH[@]}" | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception: sys.exit(0)
items = d if isinstance(d,list) else d.get('content', d.get('usuarios', []))
for u in items:
    if u.get('email')=='prof.cristian@bookly.local':
        print(u.get('id','')); break
")"

  if [[ -n "$maria_id" && -n "$prof_cristian" && -n "${SVC_ID['Corte clásico']}" ]]; then
    existing="$(curl -sS "$API/reservas/cliente/$maria_id" -H "Authorization: Bearer $maria_token" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
except Exception:
    print(0); raise SystemExit
print(len(d) if isinstance(d, list) else 0)
")"
    if [[ "$existing" -lt 2 ]]; then
      # Dos reservas futuras dentro del horario del profesional (L-V 09:00-13:00
      # y 15:00-19:00). Elegimos días que caen entre lunes y viernes para no
      # chocar con SLOT_OUTSIDE_SCHEDULE.
      booking_slots() {
        local day
        for day in 3 4 5 6 7 8 9 10; do
          local dow
          dow="$(date -d "+$day days" '+%u')"   # 1=lunes ... 7=domingo
          [[ "$dow" -ge 6 ]] && continue       # saltar sábado y domingo
          echo "+$day days 10:00|$(date -d "+$day days 11:00" '+%Y-%m-%dT%H:%M:%S')"
        done | head -2
      }
      mapfile -t pairs < <(booking_slots)
      for pair in "${pairs[@]}"; do
        IFS='|' read -r s e <<<"$pair"
        book_resp="$(curl -sS -w '\n%{http_code}' -X POST "$API/reservas" \
          -H "Authorization: Bearer $maria_token" -H 'Content-Type: application/json' \
          -d "{\"professionalId\":\"$prof_cristian\",\"serviceId\":\"${SVC_ID['Corte clásico']}\",\"startTime\":\"$(date -d "$s" '+%Y-%m-%dT%H:%M:%S')\",\"endTime\":\"$e\"}")"
        book_code="$(printf '%s' "$book_resp" | tail -n1)"
        if [[ "$book_code" != "201" && "$book_code" != "200" ]]; then
          warn "  ! reserva no creada ($book_code): $(printf '%s' "$book_resp" | head -n1)"
        fi
      done
      ok "  reservas creadas para maría (existentes: $existing)"
    else
      ok "  maría ya tiene reservas"
    fi
  fi
fi

# ---------------------------------------------------------------- auditoría
# Genera los tres action_type que el backend admite, para que /admin/audit
# tenga contenido que mostrar: BOOKING_CREATED, BOOKING_CANCELLED, ROLE_CHANGED.
log "Generando eventos de auditoría…"

audit_actor="$(curl -sS "$API/usuarios/buscar?q=admin@bookly.local" "${AH[@]}" | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception: sys.exit(0)
items = d if isinstance(d,list) else d.get('content', d.get('usuarios', []))
for u in items:
    if u.get('email')=='admin@bookly.local': print(u.get('id','')); break
")"

# 1) ROLE_CHANGED: cambiar el rol de un cliente y volverlo a CUSTOMER.
role_target="$(curl -sS "$API/usuarios/buscar?q=juan.perez@bookly.local" "${AH[@]}" | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception: sys.exit(0)
items = d if isinstance(d,list) else d.get('content', d.get('usuarios', []))
for u in items:
    if u.get('email')=='juan.perez@bookly.local': print(u.get('id','')); break
")"
if [[ -n "$role_target" && -n "$audit_actor" ]]; then
  # Cambiar a PROFESSIONAL exige `specialty`; después se vuelve a CUSTOMER.
  curl -sS -o /dev/null -X PUT "$API/usuarios/$role_target/rol" "${AH[@]}" \
    -H 'Content-Type: application/json' -d '{"role":"PROFESSIONAL","specialty":"Peluquería"}'
  curl -sS -o /dev/null -X PUT "$API/usuarios/$role_target/rol" "${AH[@]}" \
    -H 'Content-Type: application/json' -d '{"role":"CUSTOMER"}'
  ok "  ROLE_CHANGED generado"
fi

# 2) BOOKING_CANCELLED: crear una reserva y cancelarla.
maria_token="$(curl -sS -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"cliente.maria@bookly.local","password":"Client123!Pass"}' | jqv "['accessToken']")"
if [[ -n "$maria_token" && "$maria_token" != "None" ]]; then
  maria_id="$(curl -sS "$API/usuarios/buscar?q=cliente.maria@bookly.local" "${AH[@]}" | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception: sys.exit(0)
items = d if isinstance(d,list) else d.get('content', d.get('usuarios', []))
for u in items:
    if u.get('email')=='cliente.maria@bookly.local': print(u.get('id','')); break
")"
  prof_id="$(curl -sS "$API/usuarios/buscar?q=prof.cristian@bookly.local" "${AH[@]}" | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception: sys.exit(0)
items = d if isinstance(d,list) else d.get('content', d.get('usuarios', []))
for u in items:
    if u.get('email')=='prof.cristian@bookly.local': print(u.get('id','')); break
")"
  if [[ -n "$maria_id" && -n "$prof_id" && -n "${SVC_ID['Corte clásico']}" ]]; then
    # Día laboral future (para no chocar con SLOT_OUTSIDE_SCHEDULE).
    cancel_day=3
    for d in 3 4 5 6 7 8 9 10; do
      dow="$(date -d "+$d days" '+%u')"
      if [[ "$dow" -lt 6 ]]; then cancel_day="$d"; break; fi
    done
    DS=$(date -d "+$cancel_day days 10:00" '+%Y-%m-%dT%H:%M:%S')
    DE=$(date -d "+$cancel_day days 11:00" '+%Y-%m-%dT%H:%M:%S')
    created="$(curl -sS -X POST "$API/reservas" \
      -H "Authorization: Bearer $maria_token" -H 'Content-Type: application/json' \
      -d "{\"professionalId\":\"$prof_id\",\"serviceId\":\"${SVC_ID['Corte clásico']}\",\"startTime\":\"$DS\",\"endTime\":\"$DE\"}")"
    bid="$(printf '%s' "$created" | jqv "['id']")"
    if [[ -n "$bid" && "$bid" != "None" ]]; then
      curl -sS -o /dev/null -X PATCH "$API/reservas/$bid/cancelacion" \
        -H "Authorization: Bearer $maria_token" -H 'Content-Type: application/json' \
        -d '{"reason":"Reserva de prueba para auditoría"}'
      ok "  BOOKING_CANCELLED generado"
    fi
  fi
fi

# ---------------------------------------------------------------- estado MFA
# El seed enroló al admin con MFA para poder obtener el token. Para que las
# specs UI puedan recorrer el flujo /login/mfa-setup (donde leen el secret
# de la pantalla y calculan el TOTP), lo dejamos SIN enrolar al final.
# El global-setup de Playwright también lo resetea antes de cada corrida.
log "Restableciendo MFA del admin para el flujo UI…"
docker exec backendcf-db psql -U backendcf -d backendcf -c \
  "DELETE FROM mfa_trusted_device; DELETE FROM mfa_recovery_code; UPDATE app_user SET mfa_enabled=false, mfa_secret_encrypted=NULL, failed_login_attempts=0, locked_until=NULL WHERE email='$ADMIN_EMAIL';" >/dev/null 2>&1 || true
ok "  admin listo para /login/mfa-setup"

# ---------------------------------------------------------------- MFA del admin
# Por defecto el admin queda SIN MFA (para que los tests recorran el flujo de
# setup). Si quieres entrar a mano desde el celular con un código TOTP, pídelo
# con MFA_ADMIN=1: el script enrola al admin con un secret conocido para que
# `npm run mfa:codigo` devuelva siempre un código válido.
if [[ "${MFA_ADMIN:-0}" == "1" ]]; then
  log "Enrolando MFA del admin (MFA_ADMIN=1)…"
  node "$PROJECT/scripts/enrolar-mfa.mjs" "$ADMIN_EMAIL" && \
    ok "  admin con MFA: usa 'npm run mfa:codigo' para el código" || \
    warn "  ! no se pudo enrolar el MFA del admin"
fi

# ---------------------------------------------------------------- verificación
log "Verificando asignaciones de servicios…"
for spec in "${PROFS[@]}"; do
  IFS='|' read -r email fullname specialty svc_names <<<"$spec"
  pid="$(curl -sS "$API/usuarios/buscar?q=$email" "${AH[@]}" | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception: sys.exit(0)
items = d if isinstance(d,list) else d.get('content', d.get('usuarios', []))
for u in items:
    if u.get('email')==sys.argv[1]: print(u.get('id','')); break
" "$email")"
  [[ -z "$pid" ]] && { warn "  ! no se encontró $email"; continue; }
  count="$(curl -sS "$API/profesionales/$pid/servicios" "${AH[@]}" | python3 -c "
import sys,json
try: print(len(json.load(sys.stdin)))
except Exception: print(0)
")"
  if [[ "$count" -lt 1 ]]; then
    warn "  ! $email no tiene servicios asignados"
  else
    ok "  $email → $count servicio(s)"
  fi
done

log "Seed E2E completado."
