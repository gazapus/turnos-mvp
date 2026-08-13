## Why

El MVP aún no tiene autenticación: sin login no hay roles ni acceso a los módulos posteriores (admin, recepción, médico). CU1 es el primer caso de uso operativo y desbloquea el resto del circuito.

## What Changes

- Pantalla de login en `apps/web` fiel al diseño Stitch (desktop-first, responsive), con tokens semánticos en `tokens.css`, animación de fondo e imágenes locales en el repo.
- Módulo NestJS `auth` con `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, JWT en cookie `httpOnly`, hash Argon2 y `JwtAuthGuard`.
- Persistencia de intentos fallidos y bloqueos mail+IP (`LoginIntento` / `LoginBloqueo`) en Prisma.
- Bootstrap de `@turnos/shared-types` con contratos tipados web ↔ api para auth.
- Redirect post-login por rol hacia stubs de paneles (`/usuarios`, `/agenda`, `/mi-agenda`).

## Capabilities

### New Capabilities

- `auth`: autenticación por mail/contraseña (CU1), sesión JWT en cookie httpOnly, rate-limit por mail+IP (3 fallos → bloqueo 10 min), logout, consulta de sesión (`me`) y redirección por rol.

### Modified Capabilities

- _(ninguna — no hay specs vigentes en `openspec/specs/`)_

## Impact

- **Apps:** `apps/api` (nuevo módulo `auth/`), `apps/web` (ruta `(auth)/login`, stubs de paneles, middleware/sesión, tokens y assets).
- **Packages:** `packages/database` (modelos + migración), `packages/shared-types` (bootstrap + DTOs de auth).
- **Dependencias nuevas (esperadas):** Argon2, `@nestjs/jwt` / passport o equivalente cookie-based, consumo de cookie en Next.js.
- **Fuera de alcance:** alta/reseteo de usuarios, perfil completo, paneles reales de agenda/usuarios, OAuth, recuperación autogestionada de contraseña.
