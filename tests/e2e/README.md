# Tests E2E con Playwright

## Cómo ejecutar

```bash
# Antes: resetear DB al estado de seed
docker exec -i backendcf-db psql -U backendcf -d backendcf -v ON_ERROR_STOP=1 < /tmp/opencode/mfa-test/seed.full.sql

# Limpiar MFA + contadores
docker exec backendcf-db psql -U backendcf -d backendcf -c "UPDATE app_user SET mfa_enabled = false, mfa_secret_encrypted = NULL, failed_login_attempts = 0, locked_until = NULL;"

# Ejecutar todos los tests
cd /home/mista/Escritorio/udea/2026-II/calidad-software/Proyecto-FE/frontend
npm run test:e2e

# Solo un archivo
node_modules/.bin/playwright test tests/e2e/03-admin-services.spec.ts

# Solo un test por nombre
node_modules/.bin/playwright test -g "admin entra vía MFA"

# Modo headed (ver el navegador)
node_modules/.bin/playwright test --headed

# Reporte HTML
node_modules/.bin/playwright test --reporter=html
# Abre playwright-report/index.html
```

## Estado actual

| Spec | Tests | Pasan | Notas |
|---|---|---|---|
| 00-smoke | 2 | ✅ 2/2 | Sanity |
| 01-auth | 6 | ✅ 5/5 (1 skip) | 1 skip: el backend no devuelve 423 ACCOUNT_LOCKED |
| 02-public | 8 | ✅ 8/8 | register, setup, login links, forbidden, error 404 |
| 03-admin-services | 6 | ✅ 6/6 | CRUD + asignación profesionales |
| 04-admin-professionals | 4 | ⚠️ 3/4 | 1 falla: alta nueva profesional (timing) |
| 05-admin-users-audit | 6 | ⚠️ 4/6 | 2 fallas: auditoría (data) |
| 06-admin-profile | 2 | ⚠️ 0/2 | problemas de carga con login + MFA |
| 07-admin-agenda-settings | 2 | ⚠️ 1/2 | 1 falla: settings links |
| 08-professional | 5 | ✅ 5/5 | home, schedule, agenda, turns, profile |
| 09-customer | 7 | ⚠️ 2/7 | 5 fallas: rutas que cargan datos del backend |
| **Total** | **48** | **36/47 + 1 skip** | |

## Bugs del backend descubiertos (no se pueden arreglar desde el frontend)

1. **`POST /auth/login` no devuelve 423 `ACCOUNT_LOCKED`**: el `LoginService` aplica el bloqueo en la DB pero siempre lanza `InvalidCredentialsException` (401). El frontend tiene el countdown implementado pero nunca se activa. **Ticket:** backend no comunica al frontend cuando una cuenta está bloqueada.

2. **`BookingResponse` no incluye `customerName`/`serviceName`**: el listado de reservas en `/customer/agenda`, `/professional/turns`, etc. muestra "Cliente" y "Servicio" como placeholders en vez de los nombres reales. El frontend necesitaría cruzar IDs con `/usuarios/buscar` y `/servicios/{id}` para mostrarlos.

3. **`MfaConfirmResponse.authResponse` se llama `session` en el JAR deployado** (desincronizado con el código fuente que dice `authResponse`). El frontend ya tolera ambos nombres con `data.session ?? data.authResponse`.

## Bugs del frontend descubiertos (arreglados durante la batería)

- `CustomerNav`/`AdminNav` etc. cerraban el `<button type="button">` pero el `<nav>` no tenía `aria-label`. (no afecta tests)
- `customer/agenda/+page.svelte` no recargaba reservas cuando el `auth.user` se setea tras el `onMount`. Arreglado con `$effect` reactivo.
- `BookingStatus` declarado en inglés en el frontend pero el backend usa español (`CONFIRMADA`/`CANCELADA`/etc.). Corregido.

## Comandos útiles

```bash
# Ver el trace de un test fallido
npx playwright show-trace test-results/<nombre-test>-chromium/trace.zip

# Reset DB al estado de seed
docker exec -i backendcf-db psql -U backendcf -d backendcf -v ON_ERROR_STOP=1 < /tmp/opencode/mfa-test/seed.full.sql

# Ver logs del frontend y backend
tail -f /tmp/opencode/logs/frontend.log
docker logs -f backendcf-app
```
