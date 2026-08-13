## 1. Shared types bootstrap

- [x] 1.1 Crear paquete `@turnos/shared-types` (package.json, tsconfig, barrel `src/index.ts`) y cablearlo al workspace
- [x] 1.2 Definir contratos de auth (`LoginRequest`, `AuthUser`, `LoginResponse` / errores tipados) y exportarlos desde el barrel
- [x] 1.3 Agregar dependencia `@turnos/shared-types` en `apps/api` y `apps/web`

## 2. Base de datos

- [x] 2.1 Agregar modelos Prisma `LoginIntento` y `LoginBloqueo` (mail, IP, timestamps / `bloqueadoHasta`)
- [x] 2.2 Generar y aplicar migración
- [x] 2.3 Seed de desarrollo: usuario admin activo con password conocida (hash Argon2)

## 3. API — módulo auth

- [x] 3.1 Instalar dependencias (Argon2, JWT/cookie según design) y variables de entorno documentadas (`JWT_SECRET`, cookie flags, CORS/credentials)
- [x] 3.2 Implementar `AuthModule` con DTOs Swagger, Response DTOs (sin exponer entidades Prisma) y `AuthService` (login Argon2, logout, me)
- [x] 3.3 Persistir intentos fallidos y bloqueos mail+IP (máx. 3 → 10 min); mensajes genéricos en fallos
- [x] 3.4 Emitir/limpiar cookie `httpOnly` en login/logout; exponer `JwtAuthGuard`
- [x] 3.5 Endpoints `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` con `@ApiTags` / `@ApiOperation` / `@ApiResponse`
- [x] 3.6 Tests Jest de service/controller (éxito, fallo genérico, bloqueo, me no autorizado)
- [x] 3.7 Barrel `apps/api/src/auth/index.ts` y registro en `AppModule`

## 4. Web — tokens, assets y tipografía

- [x] 4.1 Extender `tokens.css` con tokens semánticos (`brand`, `accent`, `surface-elevated`, `font-heading`, etc.) y actualizar catálogo `frontend-coder/references/tokens.md`
- [x] 4.2 Descargar imágenes del slideshow Stitch a `apps/web/public/images/login/` y referenciar rutas locales
- [x] 4.3 Configurar Montserrat + Inter vía `next/font` y mapear en el tema

## 5. Web — pantalla login y sesión

- [x] 5.1 Crear ruta `app/(auth)/login/` (Server Component) + leaf `login-form` (RHF + Zod, JSDoc, sin hex en JSX)
- [x] 5.2 Replicar layout Stitch (card split, slideshow + animación shine/opacity) con utilidades del tema
- [x] 5.3 Cliente de API con `credentials: 'include'`; login → cookie → redirect por rol
- [x] 5.4 Stubs mínimos: `(admin)/usuarios`, `(recepcion)/agenda`, `(medico)/mi-agenda`
- [x] 5.5 Middleware o guard de rutas: sin sesión → login; con sesión en login → redirect a panel del rol
- [x] 5.6 Tests Vitest del formulario/login (estados de error/éxito mockeados)

## 6. Verificación

- [x] 6.1 `pnpm --filter @turnos/api test` y `pnpm --filter @turnos/web test` en verde
- [x] 6.2 Smoke manual: login → cookie → `/api/auth/me` → redirect stub; 3 fallos → bloqueo 10 min; logout
- [x] 6.3 Lint/format de archivos tocados; skill `react-doctor` sobre cambios UI si aplica
