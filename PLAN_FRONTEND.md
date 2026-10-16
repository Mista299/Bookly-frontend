# Plan de cierre del frontend BOOKLY

> Documento vivo. Última revisión: la implementación actual del backend (`backendcf`) cubre **Sprint 1 + Sprint 2** completos (15 HU mergeadas). El frontend (SvelteKit + TS + SCSS) tiene varias pantallas implementadas pero todavía **no está conectado a varios endpoints que ya existen en el backend**, y le faltan vistas para HU que nunca fueron planificadas en frontend.

---

## 0. TL;DR

- **Stack confirmado:** SvelteKit 2 + Svelte 5 (runes) + TypeScript + SCSS modules. NO migrar a React; el `planificacion-frontend.md` original proponía React/Vite pero el código que está versionado (este repo) ya adoptó SvelteKit.
- **Lo ya hecho (Sprint 1):** login, splash por rol, CRUD de servicios de admin, alta de profesionales, agenda del profesional y del cliente con componente `Calendar`, perfil mínimo, home del cliente.
- **Lo que falta (Sprint 2 + extras):** reservas reales (POST + cancel), disponibilidad (HU-07), horario semanal (HU-04), asignación de servicios a profesionales, roles y búsqueda de usuarios (HU-17), MFA setup/verify (HU-18), recuperación de claves (HU-17), auditoría (HU-19), setup inicial de plataforma (HU-20), registro de cliente (HU-01), cambio de contraseña, vista `/forbidden`.
- **Tiempo estimado:** ~3 semanas full-time para cerrar el 100% del scope descrito abajo. 1 semana extra de hardening, accesibilidad y pruebas E2E.

---

## 1. Estado actual del repositorio (mapa archivo por archivo)

### 1.1 Estructura
```
frontend/src/
├── app.html, app.d.ts
├── lib/
│   ├── components/   (12 piezas: AdminNav, Button, Calendar, CustomerNav,
│   │                   EmptyState, Field, Modal, Money, PageHead, ProfessionalNav,
│   │                   Select, Skeleton, StatusPill, Switch, Toaster)
│   ├── services/     (api.ts, service.ts, professional.ts, booking.ts)
│   ├── stores/       (auth.ts, toasts.ts)
│   ├── styles/       (_base, _globals, _tokens, index.scss)
│   └── types/        (auth.ts, service.ts, professional.ts, booking.ts)
└── routes/
    ├── +layout.svelte, +page.svelte (splash que redirige por rol)
    ├── (auth)/
    │   ├── +layout.svelte  (shell aislado para login/register/setup)
    │   └── login/+page.svelte
    ├── admin/
    │   ├── +layout.svelte         (guard + AdminNav)
    │   ├── +page.svelte           (overview)
    │   ├── professionals/+page.svelte (alta + lista vacía con banner)
    │   ├── services/+page.svelte   (listado + toggleStatus + delete)
    │   ├── services/new/+page.svelte
    │   ├── services/[id]/+page.svelte (edit)
    │   ├── agenda/+page.svelte     (calendar + filtro profesional)  ⚠️ falta lógica real
    │   └── settings/+page.svelte   ("Próximamente")
    ├── customer/
    │   ├── +layout.svelte
    │   ├── +page.svelte            (home, featured + calendar)
    │   ├── services/+page.svelte           (filtros)
    │   ├── services/[id]/+page.svelte      (hero + calendar + CTA "próximamente")
    │   ├── agenda/+page.svelte             (próximas reservas)
    │   └── profile/+page.svelte            (solo logout)
    └── professional/
        ├── +layout.svelte
        ├── +page.svelte            (turnos del día)
        ├── agenda/+page.svelte     (calendar)
        ├── turns/+page.svelte      (listado agrupado por día)
        └── profile/+page.svelte    (solo logout)
```

### 1.2 Inventario de componentes
| Componente | Estado | Notas |
|---|---|---|
| `Button.svelte` | ✅ | Variants `primary/secondary/ghost/danger`, sizes `sm/md/lg`, loading spinner. |
| `Field.svelte` | ✅ | Input único con label, error, helper. Tipos `text/email/password/number/tel/url`. Sin textarea/select. |
| `Select.svelte` | ✅ | Custom con chevron SVG. |
| `Switch.svelte` | ✅ | Switch accesible. |
| `Modal.svelte` | ✅ | Backdrop, ESC, slot footer. |
| `EmptyState.svelte` | ✅ | Con snippet `action`. |
| `Skeleton.svelte` | ✅ | `lines`, `avatar`. |
| `StatusPill.svelte` | ✅ | Solo pintado para `ServiceStatus`. |
| `Money.svelte` | ✅ | Formato COP tabular. |
| `Calendar.svelte` | ✅ | Día + semana, slots según horarios 8-20 / 30 min. **No usa disponibilidad real ni franjas semanales.** |
| `PageHead.svelte` | ✅ | Eyebrow + title + description + slot actions. |
| `Toaster.svelte` | ✅ | Lee store `toasts`. |
| Navs (Admin/Professional/Customer) | ✅ | Sidebar desktop, bottom-bar móvil. |

### 1.3 Servicios HTTP
- `api.ts`: wrapper `apiFetch<T>` sobre `fetch`. Lee `VITE_API_URL` (default `/api/v1`). **Lee token de `localStorage('bookly.token')` y lo manda como `Authorization: Bearer …`.** Manejo de 401 limpia token.
- `service.ts`: list (con `?categoria=`), get, create, update, setStatus, remove.
- `professional.ts`: list, create. ⚠️ comentario interno dice "GET /profesionales no existe" (ahora sí existe en backend).
- `booking.ts`: solo `list({date, professionalId})` apuntando a `/bookings?...`. ⚠️ **endpoint equivocado**: el backend usa `/api/v1/reservas/cliente/{customerId}` y `/api/v1/reservas/profesional/{professionalId}`.

### 1.4 Stores
- `auth.ts`: estado `{user, loading, ready, error}`. Bootstrap decodifica el JWT del localStorage y rellena `fullName` desde la cache (`localStorage 'bookly.user'`). **`login()` invoca `/auth/login` esperando `{accessToken, user}`**, pero el backend devuelve `{accessToken, tokenType, expiresIn, user, mfaRequired, mfaSetupRequired, mfaToken, deviceToken}` → no se trata mfaRequired.
- `toasts.ts`: `push(message, tone, timeoutMs)`, `dismiss(id)`.

### 1.5 Tipos
- `auth.ts`: `UserRole`, `User`, `AuthResponse` (con `accessToken/tokenType/expiresIn/user`), `RegisterResponse`, `ApiError`.
- `service.ts`: `Service`, `ServiceInput`, `ServiceStatus = 'ACTIVO' | 'INACTIVO'`.
- `professional.ts`: `Professional` (id, email, fullName, specialty, role).
- `booking.ts`: `Booking` (id, serviceId/professionalId/customerId, startTime/endTime ISO, status `CONFIRMED|PENDING|CANCELLED`), `SlotState`, `TimeSlot`.

---

## 2. Brecha: endpoints backend ↔ superficie frontend

| HU | Endpoint backend | Estado frontend | Acción |
|---|---|---|---|
| **HU-01** Registro cliente | `POST /auth/register` | **No existe pantalla** | Crear `/register` |
| **HU-02** Catálogo público | `GET /servicios`, `GET /servicios/{id}`, `?categoria=` | `customer/services/+page.svelte` y `[id]/+page.svelte` ya consumen | ✅ |
| **HU-03** Login seguro | `POST /auth/login` (200/401/423), bloqueo 5 intentos | `/login` consume, **no muestra countdown 423 ni contador 401/5** | Añadir UI de bloqueo + countdown |
| **HU-04** Horario semanal profesional | `GET/PUT /horarios/{professionalId}` | **No existe** | Crear `/professional/schedule` |
| **HU-06** Duración servicio | `duracionMinutos` en `PUT /servicios/{id}` | Form de admin ya lo valida 1-480 | ✅ |
| **HU-07** Disponibilidad | `GET /disponibilidad?profesionalId=&servicioId=&desde=&hasta=` | Calendar dibuja AVAILABLE/BOOKED de manera local, **no llama al endpoint** | Sustituir por endpoint + pintar bloques |
| **HU-08** Crear reserva | `POST /reservas` | `customer/services/[id]` botón "próximamente" | Implementar flujo completo |
| **HU-08** Reprogramar reserva | `PATCH /reservas/{id}` (RescheduleBookingRequest con startTime/endTime) | **No existe** | Permitir reagendar desde `customer/agenda` y `professional/turns` |
| **HU-08** Listar reservas cliente | `GET /reservas/cliente/{customerId}` | `booking.ts` apunta a `/bookings` (incorrecto) | Apuntar a endpoint real |
| **HU-08** Listar reservas profesional | `GET /reservas/profesional/{professionalId}` | `booking.ts` apunta a `/bookings` (incorrecto) | Apuntar a endpoint real |
| **HU-09** Cancelar reserva | `PATCH /reservas/{id}/cancelacion` con `{reason}` | **No existe** | Botón "Cancelar" con modal en listados |
| **HU-10** Notificación correo | No expone endpoint (eventos after-commit) | No-op (ok) | Mostrar toast tras confirmar/cancelar; sin UI de admin |
| **HU-17** Roles | `GET /usuarios/buscar?q=`, `PUT /usuarios/{id}/rol`, `POST /usuarios/{id}/clave/restablecer` | **No existe** | Crear `/admin/users` con búsqueda + cambio de rol + reset pwd |
| **HU-17** Change own password | `PUT /auth/password` | **No existe** | Botón "Cambiar contraseña" en los profiles |
| **HU-18** MFA setup | `POST /auth/mfa/enroll`, `/confirm`, `/skip`, `/verify` | **No existe**, además `auth.login` no inspecciona `mfaRequired` | Refactor login + pantallas `/mfa/enroll`, `/mfa/verify` |
| **HU-18** MFA settings admin | `GET /mfa/recovery-codes/estado`, `POST /mfa/recovery-codes/regenerar`, `POST /mfa/desactivar` | **No existe** | Sección "Seguridad" en profiles admin |
| **HU-19** Auditoría | `GET /auditoria?from=&to=&page=&size=` | **No existe** | Crear `/admin/audit` con filtros + paginación |
| **HU-20** Setup inicial plataforma | `POST /platform/setup` | **No existe** | Crear `/setup` (solo si backend responde 409 en login) |
| **HU-21** OwnershipGuard | Comportamiento en backend, frontend solo envía el ID de su usuario autenticado | **No bloqueado** | Garantizar que cada llamada pase el ID del usuario en sesión (revisar `OwnershipGuard` semántica en cada caso) |
| **HU-22** Profesionales | `GET/POST /profesionales`, `GET/PUT /profesionales/{id}/servicios` | `professionals/+page.svelte` ya tiene alta; **no llama GET**; **no expone asignación de servicios** | Habilitar lista real + chips de servicios |
| **HU-02** Asignar profesionales a un servicio | `GET /servicios/{id}/profesionales` | **No usado** | En edición de servicio, mostrar profesionales disponibles |
| **HU-22** Listado de profesionales para un servicio | `GET /servicios/{id}/profesionales` | **No usado** | `customer/services/[id]` debería elegir profesional disponible |

---

## 3. Decisiones arquitectónicas a tomar antes de empezar

| # | Decisión | Recomendación |
|---|---|---|
| D1 | Gestión de peticiones HTTP / cache | **Quedarse sin TanStack Query.** SvelteKit + stores reactivos + `fetch` nativo es suficiente; introducir Query exige +6 KB y un sobrecoste conceptual. Usar stores con patrón "load + invalidate" (ej. `services.refresh()`). |
| D2 | Validación de formularios | **Reforzar cliente con HTML5 native + función validadora por formulario** (consistente con código actual). Si se añaden reglas complejas en el futuro, evaluar Zod. |
| D3 | Tests | **Playwright** (e2e) + **Vitest con `@vitest/browser`** para utilidades puras (services, stores). El proyecto aún no tiene framework de test configurado → añadir `vitest` + `@sveltejs/vitest-plugin` y `playwright`. |
| D4 | i18n | **No en este sprint.** El copy actual está en `es-ES`. Centralizar strings clave en `lib/i18n/es.ts` solo si hay duplicación masiva. |
| D5 | Tema oscuro | **No**, los tokens no lo prevén; la marca ya se siente cálida con `ivory`. |
| D6 | 401 silencioso vs redirect | Hoy `api.ts` limpia el token. Falta **redirigir al login** desde `+layout.svelte` cuando hay 401 + path privado. |
| D7 | Persistencia de sesión | OK (`localStorage` + JWT). Sin cookies hasta validar `FRONTEND_URL` + CORS. |
| D8 | Variables de entorno | Crear `.env.example` (`VITE_API_URL=http://localhost:8080/api/v1`). |
| D9 | Path alias imports | Ya existe `$lib`. Añadir tests (`vitest/config.ts`) con mismo alias. |

---

## 4. Roadmap por fases

Cada fase es una entrega testeable. Tiempo = estimación full-time (1 persona). Backend **no se toca** salvo errores de contrato encontrados.

### Fase 0 · Hardening base (½ día)
- Crear `.env.example` con `VITE_API_URL`.
- Añadir `vitest` + `@sveltejs/vitest-plugin` y un test de humo para `services/service.ts`.
- Añadir Playwright (`@playwright/test`) y un spec que valide `login → /admin` en CI local.
- Refactor `api.ts`:
  - Manejar `423 ACCOUNT_LOCKED` con campo `lockMinutes` (`ApiError` ya tiene `details`; añadir `lockMinutes` opcional).
  - Lanzar evento global `'auth:unauthorized'` cuando hay 401 silencioso, escuchado por `+layout.svelte` para `goto('/login')`.
- En `stores/auth.ts`: modificar `login()` para devolver `{status:'ok',user}` o `{status:'mfaRequired', mfaToken}` o `{status:'locked', lockMinutes}`.
- En `routes/+layout.svelte`: tras `auth.bootstrap()` si no hay usuario → no redirigir, dejar que cada layout protegido decida.
- Crear `routes/+error.svelte` con UI elegante (no usar la página default).

**Criterios de aceptación:** `npm run build` produce bundle; `npm run dev` levanta en 5173; tests verdes.

---

### Fase 1 · Servicios profesionales y catálogo (1 día)
**Objetivo:** que `customer/services/[id]` y `admin/services/[id]` muestren profesionales elegibles y reflejen correctamente la asignación.

1. Crear `lib/types/serviceOffering.ts` (alias de Service) y `lib/types/professionalSummary.ts` (campos `{id, fullName, specialty}`).
2. En `services/service.ts` añadir `listProfessionals(serviceId)` → `GET /servicios/{id}/profesionales`.
3. En `services/professional.ts` añadir:
   - `getAssignedServices(id)` → `GET /profesionales/{id}/servicios`
   - `setAssignedServices(id, ids)` → `PUT /profesionales/{id}/servicios` (body `{serviceIds: string[]}`).
   - `list()` ya existe; revisar que se ejecute siempre (`shouldRetry: false`).
4. En `admin/services/[id]/+page.svelte` añadir una sección "Profesionales que ofrecen este servicio" (multi-select contra `professionalService.list()` + diff con los ya asignados).
5. En `customer/services/[id]/+page.svelte` añadir selector de profesional (sólo si `listProfessionals` devuelve >0); CTA cambia a "Ver disponibilidad de [profesional]".

**Criterio de aceptación:** admin asigna servicios; cliente los ve.

---

### Fase 2 · Horario semanal del profesional (HU-04) (½ día)
**Objetivo:** el profesional define franjas semanales (1 PUT = reemplaza la grilla completa).

1. Nuevos tipos en `lib/types/schedule.ts`:
   ```ts
   export type DayOfWeek = 'MONDAY'|'TUESDAY'|'WEDNESDAY'|'THURSDAY'|'FRIDAY'|'SATURDAY'|'SUNDAY';
   export interface ScheduleSlot { dayOfWeek: DayOfWeek; startTime: string; endTime: string; }
   export interface Schedule { professionalId: string; slots: ScheduleSlot[]; }
   ```
2. Nuevo servicio `lib/services/schedule.ts`:
   - `get(professionalId)`
   - `replace(professionalId, slots)`
3. Crear `lib/components/ScheduleEditor.svelte`:
   - Matriz 7×2 (lun-dom, mañana/tarde). Click añade un `input type="time"` emparejado (inicio/fin). Validación local: inicio < fin, no solapamientos el mismo día (`409 SCHEDULE_CONFLICT` se muestra como toast con detalle por conflicto desde `details`).
   - Botón "Guardar horario" → PUT, luego `get` de nuevo.
4. Crear `routes/professional/schedule/+page.svelte` con `PageHead` + `ScheduleEditor` + navegación "Mi agenda" / "Turnos".
5. Actualizar `ProfessionalNav.svelte` para incluir `Schedule` (icono `Clock4`).
6. En `admin/agenda/+page.svelte` (existe actualmente con filtrado), añadir columnas de horario del profesional seleccionado (`scheduleService.get(id)`).

---

### Fase 3 · Disponibilidad, reserva, cancelación (HU-07/08/09) (2 días)

#### 3.1 Disponibilidad real (HU-07)
1. Nuevo servicio `lib/services/availability.ts`:
   ```ts
   export const availabilityService = {
     find({ professionalId, serviceId, from, to }):
       Promise<AvailabilityResponse> // {professionalId, serviceId, durationMinutes, from, to, available, message, days:[{date, slots:[{startTime, endTime}]}]}
   };
   ```
2. Reescribir `lib/components/Calendar.svelte`:
   - Aceptar prop `slots: TimeSlot[]` con origen externo.
   - En `customer/services/[id]/+page.svelte`: `loadAvailability(date)` llamar al endpoint, mapear a `TimeSlot` con estado `AVAILABLE/SELECTED/BOOKED/OUT_OF_HOURS`.
   - Añadir prop `loading` + skeleton.
3. Quitar la generación local de slots en `daySlots = buildDaySlots(...)`. Solo se usa para la vista "disponibilidad general" sin servicio.

#### 3.2 Crear reserva (HU-08)
1. Reescribir `lib/services/booking.ts`:
   - `create({professionalId, serviceId, startTime, endTime})` → `POST /reservas` (201) / maneja `409 BOOKING_CONFLICT`.
   - `listForCustomer(customerId)` → `GET /reservas/cliente/{customerId}`.
   - `listForProfessional(professionalId)` → `GET /reservas/profesional/{professionalId}`.
   - `cancel(bookingId, reason?)` → `PATCH /reservas/{id}/cancelacion`.
   - `reschedule(bookingId, startTime, endTime)` → `PATCH /reservas/{id}` (⚠️ confirmar path en backend; verificar en `OpenAPI` o `BookingController`).
2. `customer/services/[id]/+page.svelte`:
   - Al confirmar slot → POST, navegar a `/customer/agenda` con toast `Reserva confirmada para [fecha y hora]`.
   - Validar tiempo mínimo (`BOOKING_CANCELLATION_MIN_ADVANCE_MINUTES = 120` por defecto; exponerlo en un endpoint `GET /platform/settings` o dejarlo hardcoded y documentar).

#### 3.3 Cancelar reserva (HU-09)
1. En `customer/agenda/+page.svelte`: en cada `booking` añadir botón "Cancelar" → modal con textarea (motivo opcional). Limitar si la reserva está dentro de las 2h.
2. Idem en `professional/turns/+page.svelte`.
3. Mostrar `cancelledAt` y `cancellationReason` en la fila cancelada.

#### 3.4 Reprogramar reserva (HU-08)
- Modal "Reagendar" reutiliza el `Calendar` filtrado a la disponibilidad. Backend es `PATCH /reservas/{id}` con body `{startTime, endTime}`.
- Solo permitir reagendar al cliente y antes del límite de `BOOKING_CANCELLATION_MIN_ADVANCE_MINUTES`.

#### 3.5 Notificación (HU-10)
- Tras POST/PATCH exitoso, mostrar toast con copy "Te enviamos un correo de confirmación" (sin lógica adicional; el listener del backend envía).

---

### Fase 4 · Administración de profesionales y servicios ampliada (½ día)
- En `admin/professionals/+page.svelte`: mostrar todos los profesionales (GET existe). Añadir chip "Servicios asignados" por persona. Click → `ScheduleEditor` precargado para ese ID.
- Añadir `/admin/services/[id]` un bloque con `listProfessionals(serviceId)` y un botón "Gestionar asignaciones" → modal con `MultiSelect` (chips) para añadir/quitar profesionales (PUT `/profesionales/{id}/servicios` por cada ID cambiado).

---

### Fase 5 · Configuración inicial (HU-20) (½ día)
1. Nuevo layout `routes/(public)/+layout.svelte` (renombrar `(auth)` → `(public)` si quedan más pantallas dentro).
2. Pantalla `routes/(public)/setup/+page.svelte`:
   - Campos: nombre plataforma, adminEmail, adminPassword, adminFullName.
   - Validaciones nativas (mismas reglas que backend).
   - Botón crea → toast + redirect `/login`.
3. Detección: en `+page.svelte` (splash), antes de redirigir, intentar `POST /auth/login` con credenciales vacías para ver 401 vs 503? NO: más limpio añadir endpoint público `GET /platform/status` que devuelva `{configured}` (a confirmar con backend; si no se quiere tocar, fallback: mostrar siempre `/login`, y si el login devuelve 401 con `errorCode === 'PLATFORM_NOT_CONFIGURED'`, redirigir a `/setup`).

---

### Fase 6 · Registro de cliente (HU-01) (½ día)
1. `routes/(public)/register/+page.svelte`: formulario 3 campos. Validación regex password (8+, 1 mayús, 1 dígito, 1 especial — el regex backend es `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$`).
2. Servicio `auth.register({email, password, fullName})` que mapee respuesta backend `{id, email, fullName, role, createdAt}`.
3. Tras éxito → toast "Revisa tu correo" (no aplica: backend no verifica email) + redirect a `/login`.
4. Link "¿No tienes cuenta?" desde login.

---

### Fase 7 · Roles, cambio de clave, MFA, auditoría (HU-17/18/19) (2 días)

#### 7.1 Roles y reset (HU-17)
- Pantalla `/admin/users` con campo `q` → llama `GET /usuarios/buscar?q=`.
- Tabla con `email/fullName/currentRole`.
- Acciones por fila:
  - "Cambiar rol" → modal con `Select` (`CUSTOMER`/`PROFESSIONAL`/`ADMIN`) y campo `specialty` (solo si rol es `PROFESSIONAL`). PUT `/usuarios/{id}/rol` (si choca rol → 409 `ROLE_CHANGE_CONFLICT`).
  - "Restablecer contraseña" → recibe `{temporaryPassword}` del backend, mostrar en modal copiable con botón copiar.
- Link en `AdminNav` "Usuarios".

#### 7.2 Cambio de contraseña propio (HU-17)
- Modal "Cambiar contraseña" desde cualquier `profile/+page.svelte`. Body `{currentPassword, newPassword}`. PUT `/auth/password`.

#### 7.3 MFA (HU-18)
- El backend exige MFA al rol ADMIN tras login (excepto si se omite en este login). Refactor del store `auth.ts`:
  - `login()` devuelve `{kind: 'authenticated'|'mfaRequired'|'mfaSetupRequired'|'locked', user?, mfaToken?, lockMinutes?}`.
  - `auth.completeMfa(token, code)` → POST `/auth/mfa/verify`. Si entra a un login que ya venía con TOTP: ruta `/login/mfa?mfaToken=...`.
  - `auth.skipMfa(token)` → POST `/auth/mfa/skip`.
  - `auth.enrollMfa()` → POST `/auth/mfa/enroll` → renderiza `otpauth://` como QR (`qrcode` lib) + input código → POST `/auth/mfa/enroll/confirm`. Al confirmar → muestra códigos de recuperación uno a uno (botón "Copiar todos").
- Pantalla `routes/(public)/login/mfa/+page.svelte`: input de 6 dígitos con auto-advance.
- Pantalla `routes/(public)/login/mfa-setup/+page.svelte`: si el login del admin sale con `mfaSetupRequired`, forzar enrolamiento (no permitir Skip para ADMIN salvo que sea un toggle del propio usuario en perfil).
- Sección "Seguridad" en `/admin/profile/+page.svelte` (nuevo):
  - Estado MFA, botón "Configurar MFA" / "Desactivar MFA" (POST `/mfa/desactivar` con `{password, code}`).
  - Códigos de recuperación: estado restante (`GET /mfa/recovery-codes/estado`), regenerar (`POST /mfa/recovery-codes/regenerar` requiere `{code}`).

#### 7.4 Auditoría (HU-19)
- Pantalla `/admin/audit/+page.svelte` con dos inputs datetime (`from`, `to`), tabla paginada (page=0 size=50 default). Columnas: `occurredAt`, `actorUserId`, `actionType`, `resourceType`, `resourceId`, `sourceIp`. Filtros por tipo de acción.
- Servicio `audit.list({from, to, page, size})` → GET `/auditoria?from=&to=&page=&size=`.

---

### Fase 8 · Vistas restantes / pulido (1 día)
- `/forbidden` para errores 403 ACCESS_DENIED (lo lanza `OwnershipGuard`).
- Mejorar home del **customer** para mostrar profesionales top por servicio.
- En `admin/agenda` permitir ver la agenda de un profesional específico (clic en filtro) y export CSV (cliente).
- En `professional/agenda` y `customer/agenda`, soportar la línea de "ahora" (ya hay `now-line` en Calendar).
- Skeletons consistentes.
- Toasts diferenciados por tono (`success/danger/info/warning`) — añadir `warning`.
- Página de error global personalizada (404, 500, mantenimiento).
- Cookie banner mínimo (no hay tracking) — opcional.

---

### Fase 9 · Accesibilidad, responsive, calidad (½ día)
- Auditar con axe-core en CI (`@axe-core/playwright`).
- Verificar matriz del manifest (360/390/430/600/820/1024/1366/1440/1920).
- `npm run check` (svelte-check) sin warnings.
- Documentar `README.md` con setup + roles + screenshots.

---

## 5. Detalle de implementación por archivo

### 5.1 Nuevos archivos
```
src/lib/types/
  ├── booking.ts            # extender con reason, cancelledAt, createdAt, updatedAt
  ├── availability.ts
  ├── schedule.ts
  ├── mfa.ts
  ├── platform.ts
  ├── audit.ts
  ├── role.ts
  └── user.ts

src/lib/services/
  ├── auth.ts               # register, mfa (enroll/verify/skip), changePassword
  ├── availability.ts
  ├── schedule.ts
  ├── platform.ts           # setup + opcional status
  ├── audit.ts
  ├── user.ts               # buscar, asignar rol, reset password
  └── mfaSettings.ts        # recovery codes status/regenerar, desactivar

src/lib/components/
  ├── ScheduleEditor.svelte
  ├── QrCode.svelte         # usa qrcode (CDN o npm)
  ├── OtpInput.svelte       # 6 inputs auto-focus
  ├── MultiSelect.svelte    # chips para profesionales ↔ servicios
  ├── CodeBlock.svelte      # mostrar recovery codes
  └── DateTimeInput.svelte  # tipo datetime-local para auditoría

src/routes/
  ├── (public)/
  │   ├── setup/+page.svelte
  │   ├── register/+page.svelte
  │   ├── login/mfa/+page.svelte
  │   └── login/mfa-setup/+page.svelte
  ├── admin/
  │   ├── users/+page.svelte
  │   ├── audit/+page.svelte
  │   └── profile/+page.svelte
  ├── professional/
  │   └── schedule/+page.svelte
  ├── forbidden/+page.svelte
  └── +error.svelte
```

### 5.2 Archivos a modificar
- `src/lib/services/api.ts`: añadir lockMinutes al `ApiError`, evento global en 401.
- `src/lib/services/booking.ts`: reescribir con paths correctos + métodos nuevos.
- `src/lib/services/professional.ts`: añadir `getServices`, `setServices`.
- `src/lib/services/service.ts`: añadir `listProfessionals(serviceId)`.
- `src/lib/stores/auth.ts`: refactor `login()` con máquina de estados.
- `src/routes/+layout.svelte`: enganchar evento 401 + render `<ErrorBoundary>`.
- `src/routes/customer/services/[id]/+page.svelte`: usar disponibilidad real.
- `src/routes/customer/agenda/+page.svelte`: cargar desde backend, botón cancelar.
- `src/routes/professional/turns/+page.svelte`: cargar desde backend, acciones.
- `src/routes/admin/services/[id]/+page.svelte`: gestionar profesionales.
- `src/routes/admin/professionals/+page.svelte`: cargar lista real + chips de servicios + link a schedule.
- `src/routes/admin/agenda/+page.svelte`: seleccionar profesional, cargar disponibilidad.
- `src/routes/admin/settings/+page.svelte`: enlazar a `/admin/users`, `/admin/audit` y mostrar info de plataforma.
- `src/lib/components/AdminNav.svelte`: añadir items "Usuarios" y "Auditoría".
- `src/lib/components/ProfessionalNav.svelte`: añadir "Horario".
- `src/lib/components/CustomerNav.svelte`: añadir "Reservar" si se quiere duplicar la entrada a `/customer/services`.

### 5.3 Borrar / deprecar
- Elimininar el banner "Listado no expuesto en Sprint 1" (`listUnavailable`) en `admin/professionals`.

---

## 6. Contratos clave a respetar (extraídos de los controllers)

### 6.1 `LoginResponse`
```json
{
  "accessToken": "string|null",
  "tokenType": "Bearer|null",
  "expiresIn": 0,
  "user": {"id":"uuid","email":"…","fullName":"…","role":"ADMIN"} | null,
  "mfaRequired": true,
  "mfaSetupRequired": false,
  "mfaToken": "string|null",
  "deviceToken": "string|null"
}
```
- Si `accessToken` viene → autenticado.
- Si `mfaRequired=true` y `accessToken=null` → redirigir a `/login/mfa?token=…`.
- Si `mfaSetupRequired=true` (sólo ADMIN) → forzar a `/login/mfa-setup?token=…`.

### 6.2 `BookingResponse`
Campos: `id, customerId, professionalId, serviceId, startTime (LocalDateTime), endTime, status, createdAt, updatedAt, cancelledAt, cancellationReason`. Actualizar `Booking` en `lib/types/booking.ts`.

### 6.3 `AvailabilityResponse`
```
{ professionalId, serviceId, durationMinutes, from, to, available, message, days:[{date, slots:[{startTime, endTime}]}] }
```
No expone `customerName`; el `Calendar` debe seguir usando el listado de reservas para pintar el nombre del cliente cuando se superponen.

### 6.4 `ScheduleResponse`
```
{ professionalId, slots:[{dayOfWeek, startTime (LocalTime ISO), endTime}] }
```
Usar `DayOfWeek` en español/inglés según backend (backend devuelve enum `MONDAY` etc. — UI en `Lun/Mar/…`).

### 6.5 `AuditLogResponse`
`id, actorUserId, actionType, resourceType, resourceId, occurredAt (OffsetDateTime), sourceIp, metadata (Map<String,String>)`. Mapear `metadata` como chips.

### 6.6 `ServiceIdsRequest`
`{ serviceIds: UUID[] }`. Validar IDs duplicados.

### 6.7 Errores uniformes
`{errorCode, message, details?, traceId, timestamp}`. Frontend debe mostrar `message` por defecto y mapear `errorCode` en casos sensibles:
- `EMAIL_ALREADY_REGISTERED` → "Este correo ya está registrado."
- `INVALID_CREDENTIALS` → "Credenciales inválidas."
- `ACCOUNT_LOCKED` + `details.lockMinutes` (añadir al ApiError) → countdown.
- `SCHEDULE_CONFLICT` (HU-04) → modal con detalle por franja.
- `BOOKING_CONFLICT` (HU-08) → toast "Ese horario ya no está disponible, elige otro."
- `ROLE_CHANGE_CONFLICT` (HU-17) → toast "Esta cuenta es un profesional, no se le puede cambiar el rol."
- `PLATFORM_ALREADY_CONFIGURED` (HU-20) → redirect `/login`.
- `ACCESS_DENIED` → redirect `/forbidden`.

---

## 7. Pruebas

### 7.1 Unit (Vitest)
- `services/booking.test.ts`: mocking de `fetch`, verificar paths correctos.
- `services/auth.test.ts`: todos los estados de `login()`.
- `stores/auth.test.ts`: máquina de estados.

### 7.2 E2E (Playwright)
Specs prioritarios (cubren 12 HU):
1. **HU-20 → HU-22**: setup, login admin, crear profesional, asignarle un servicio, crear disponibilidad, cliente reserva, cliente cancela.
2. **HU-17**: admin busca usuario, cambia rol, restablece contraseña.
3. **HU-18**: login admin fuerza MFA, enrola, loguea otra vez con código TOTP, regenera recovery codes.
4. **HU-19**: tras cancelar reserva, aparece en auditoría con `actionType=BOOKING_CANCELLED`.
5. **HU-03**: 5 intentos fallidos → 423 → countdown, intento correcto después de esperar.

### 7.3 Manual / smoke
- Lighthouse ≥ 90 desktop, ≥ 85 mobile en `/login`, `/admin`.
- Sin overflow horizontal en viewports 360–1920.
- Contraste AA en textos.

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Backend no devuelve `customerName/serviceName` en `BookingResponse` | Calcularlo en cliente cruzando con `serviceService.get(id)` y `professionalService.list()` o pedir cambio al backend como issue. |
| `Professional` no trae `customerName` | Necesario para vista profesional: añadir `GET /profesionales/{id}/clientes` o agregar `customerName` a `/reservas/profesional/{id}`. Solicitar cambio al backend. |
| MFA solo aplica a ADMIN | Otras rutas no deben redirigir a MFA: validar `user.role === 'ADMIN'` antes de forzar setup. |
| CORS del backend ya está abierto en `FRONTEND_URL` | Documentar `.env.example` apuntando a `http://localhost:8080`. |
| PATCH `/reservas/{id}` puede no existir como reprogramación (backend tiene solo `PATCH /reservas/{id}/cancelacion`) | Validar contra `OpenAPI` antes de implementar; si no existe, ofrecer "Cancelar + Reservar de nuevo". |
| Importar `qrcode` aumenta bundle | Carga dinámica en la ruta MFA (`import('qrcode')`). |
| El token JWT puede expirar a mitad de sesión | Interceptor 401 + redirect a login (evento `auth:unauthorized`). |

---

## 9. Checklist de cierre por HU

- [ ] HU-01 — Registro cliente
- [ ] HU-02 — Catálogo público + asignación
- [ ] HU-03 — Login con bloqueo
- [ ] HU-04 — Horario semanal
- [ ] HU-06 — Duración servicio (ya integrado)
- [ ] HU-07 — Disponibilidad por servicio+profesional
- [ ] HU-08 — Crear, listar, reprogramar reserva
- [ ] HU-09 — Cancelar reserva con motivo
- [ ] HU-10 — (no UI) Mensaje de confirmación por correo
- [ ] HU-17 — Roles + reset + cambiar mi contraseña
- [ ] HU-18 — MFA setup + verify + recovery codes
- [ ] HU-19 — Bitácora de auditoría
- [ ] HU-20 — Setup inicial plataforma
- [ ] HU-21 — (no UI directa; garantizar IDs correctos)
- [ ] HU-22 — Profesionales + servicios asignados

---

## 10. Orden sugerido de PRs

1. `feat(hardening): api interceptors + vitest + playwright scaffold`
2. `feat(admin): profesionales y servicios ampliados (HU-22)`
3. `feat(professional): horario semanal (HU-04)`
4. `feat(customer+admin): disponibilidad real (HU-07)`
5. `feat(booking): crear, listar, reprogramar, cancelar (HU-08 + HU-09)`
6. `feat(admin): usuarios, roles, reset (HU-17)`
7. `feat(auth): registro cliente (HU-01)`
8. `feat(public): setup plataforma (HU-20)`
9. `feat(admin): auditoria (HU-19)`
10. `feat(auth): MFA (HU-18)`
11. `feat(admin): profile seguridad`
12. `chore: a11y, lighthouse, responsive pass (DESIGN-HANDOFF matrix)`
13. `docs: README + screenshots + diagramas C4`

---

## 11. Apéndice: mapeo campo-por-campo entre backend y frontend (sólo lo nuevo)

| UI | Origen | Destino |
|---|---|---|
| Select profesional | `GET /profesionales` | Bind `professionalId` (UUID) en reserva y disponibilidad |
| Editor horario | `GET/PUT /horarios/{id}` | Listado de `DayOfWeek` + 2 inputs time |
| Confirmar reserva | `POST /reservas` `{professionalId, serviceId, startTime, endTime}` | Toast + navigate |
| Reprogramar | `PATCH /reservas/{id}` `{startTime, endTime}` (verificar disponibilidad primero con `GET /disponibilidad`) | Toast + refrescar |
| Cancelar | `PATCH /reservas/{id}/cancelacion` `{reason?: string}` | Toast + refrescar |
| Cambio de rol | `PUT /usuarios/{id}/rol` `{role, specialty?}` | Toast |
| Reset password | `POST /usuarios/{id}/clave/restablecer` | Modal con clave temporal + botón copiar |
| Cambio de mi contraseña | `PUT /auth/password` `{currentPassword, newPassword}` | Toast |
| MFA enroll | `POST /auth/mfa/enroll` `{mfaToken}` → `{secret, otpauthUri}` | QR con `otpauthUri` |
| MFA confirm | `POST /auth/mfa/enroll/confirm` `{mfaToken, code, trustDevice}` → `{authResponse, recoveryCodes[]}` | Mostrar recoveryCodes uno a uno + almacenar token |
| MFA verify | `POST /auth/mfa/verify` `{mfaToken, code, trustDevice}` → `LoginResponse` | Sesión iniciada |
| MFA skip (no admin) | `POST /auth/mfa/skip` `{mfaToken}` → `LoginResponse` | Continuar |
| Recovery status | `GET /mfa/recovery-codes/estado` | Texto "Quedan N códigos" |
| Regenerar recovery | `POST /mfa/recovery-codes/regenerar` `{code}` → códigos[] | Modal con códigos |
| Desactivar MFA | `POST /mfa/desactivar` `{password, code}` | Toast |
| Auditoría | `GET /auditoria?from=&to=&page=&size=` | Tabla paginada |
| Setup plataforma | `POST /platform/setup` `{name, adminEmail, adminPassword, adminFullName}` | Toast + a `/login` |

