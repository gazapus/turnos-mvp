## Context

Ver `proposal.md` (Why / What). Estado actual: monorepo con `HealthModule` únicamente; `Usuario` ya tiene `mail`, `passwordHash`, `rol`, `activo`; no hay módulo `auth`, ni cookie JWT, ni `@turnos/shared-types` usable (carpeta reservada vacía). UI debe copiar el Stitch screen `00dca9cbc61a44aabbe8855be88aba07` bajo AGENTS.md + skill `frontend-coder` (tokens semánticos, desktop-first).

## Goals / Non-Goals

**Goals:**

- Sesión JWT en cookie `httpOnly` consumible por Next.js y NestJS.
- Rate-limit auditable mail+IP vía tablas Prisma.
- Contratos auth en `@turnos/shared-types` desde el día uno.
- Login UI fiel a Stitch (animación + assets locales) sin hex en JSX.
- Guard reutilizable y stubs de destino por rol.

**Non-Goals:**

- Refresh tokens / rotación avanzada.
- Redis u otro store de rate-limit.
- Paneles reales de agenda/usuarios.
- CSRF tokens dedicados más allá de SameSite en cookie (MVP single-origin).

## Decisions

### 1. Cookie httpOnly vs Bearer en cliente

- **Elegido:** JWT firmado en cookie `httpOnly`, `Secure` en producción, `SameSite=Lax`, path `/`.
- **Rationale:** reduce XSS; encaja con middleware Next y fetch same-origin.
- **Alternativa descartada:** `Authorization: Bearer` + `localStorage` (más simple, peor frente a XSS).

### 2. Persistencia de intentos / bloqueos

- **Elegido:** modelos `LoginIntento` y `LoginBloqueo` en Prisma.
  - Intentos: mail, IP, `exito`, `createdAt`.
  - Bloqueo: mail, IP, `bloqueadoHasta`, único lógico por par activo.
- **Rationale:** auditable, sin infra extra, reinicio de API no pierde bloqueos.
- **Alternativa descartada:** memoria/Redis.

### 3. Hash de contraseñas

- **Elegido:** Argon2 (alineado a FUNCIONAL.md).
- **Alternativa:** bcrypt solo si Argon2 bloquea el entorno; no es el default.

### 4. Contratos compartidos

- **Elegido:** bootstrap de `packages/shared-types` (`@turnos/shared-types`) con tipos/DTOs de login, usuario autenticado y errores de auth tipados; Nest Response DTOs y Zod web alineados a esos contratos.
- **Alternativa descartada:** duplicar shapes solo en Nest + Zod.

### 5. Endpoints mínimos

| Método | Ruta               | Auth                                     | Rol                        |
| :----- | :----------------- | :--------------------------------------- | :------------------------- |
| POST   | `/api/auth/login`  | pública                                  | setea cookie               |
| POST   | `/api/auth/logout` | autenticada (o best-effort clear cookie) | limpia cookie              |
| GET    | `/api/auth/me`     | autenticada                              | devuelve usuario de sesión |

`JwtAuthGuard` exportado desde el módulo para uso futuro.

### 6. Redirect por rol (stubs)

| Rol             | Destino      |
| :-------------- | :----------- |
| `ADMIN`         | `/usuarios`  |
| `RECEPCIONISTA` | `/agenda`    |
| `MEDICO`        | `/mi-agenda` |

Páginas stub mínimas (título + “próximamente”) para no romper el flujo CU1.

### 7. Frontend / tokens / assets

- Extender `apps/web/app/tokens.css` con tokens semánticos reutilizables (`brand`, `brand-foreground`, `brand-muted`, `accent`, `surface-elevated`, `font-heading`, etc.) — **no** `--login-*`.
- Tipografía: Montserrat (heading) + Inter (UI) vía `next/font`, mapeadas en `@theme`.
- Slideshow: 3 imágenes descargadas a `apps/web/public/images/login/`; animación CSS (opacity/scale/shine) en CSS de página o módulo acotado, valores de color vía tokens/`@theme`.
- Leaf client: formulario RHF + Zod (`lib/schemas/login-schema.ts`); page Server Component.
- Mensajes de error **genéricos** (no revelar si el mail existe).

### 8. Seed de prueba

- Seed (o script documentado) de un usuario admin activo con password conocida **solo en desarrollo**, para poder ejercitar CU1 sin CU2.

## Risks / Trade-offs

- **[Risk] Cookie cross-origin en dev (web :3000 / api :3001)** → Mitigación: configurar CORS `credentials: true` + `COOKIE_DOMAIN`/`API_URL` documentados; o proxy de Next hacia `/api` same-origin en MVP.
- **[Risk] Tokens actuales (teal primary) vs paleta Stitch (navy + teal)** → Mitigación: ampliar tokens semánticos sin romper health panel; `primary` puede alinearse a `accent` teal del diseño.
- **[Risk] Assets Stitch con URLs Google efímeras** → Mitigación: copiar binarios al repo en `public/images/login/`.
- **[Risk] Sin CSRF explícito** → Mitigación: SameSite=Lax + origen único; revisar si el front y la API no son same-site.

## Migration Plan

1. Migración Prisma (`LoginIntento`, `LoginBloqueo`).
2. Bootstrap `@turnos/shared-types` + dependencias auth.
3. API auth + tests Jest.
4. Tokens, assets, UI login + stubs + tests Vitest.
5. Verificar flujo E2E manual: login → cookie → `/me` → redirect stub.

Rollback: revertir migración (drop tablas nuevas), quitar módulo auth y ruta login; sin datos de negocio dependientes aún.

## Open Questions

Ninguna que bloquee specs o tasks; el proxy same-origin vs CORS dual-port se elige en implementación priorizando el path de menor fricción en el monorepo actual.
