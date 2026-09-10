## 1. Fundamentos (rutas, tipos, deps)

- [x] 1.1 Instalar `lucide-react` en `@turnos/web`
- [x] 1.2 Actualizar `ROLE_HOME_PATHS.MEDICO` a `/agenda` en `@turnos/shared-types` y ajustar tests/consumidores
- [x] 1.3 Definir catálogo de navegación tipado (rutas, labels, roles, iconos) en `apps/web` (y exportar rutas compartidas si conviene)
- [x] 1.4 Extender middleware: proteger `/consultorios`, `/pacientes`, `/sala-espera`; quitar `/mi-agenda` del matcher; redirect de `/mi-agenda` → `/agenda` si se mantiene temporalmente
- [x] 1.5 Agregar tokens glass / layout del shell en `tokens.css` (sin hex en componentes)

## 2. Estructura App Router

- [x] 2.1 Crear route group autenticado con `layout.tsx` que monte el AppShell (fuera de `(auth)/login`)
- [x] 2.2 Mover/reubicar stubs existentes (`usuarios`, `agenda`) bajo el layout del shell
- [x] 2.3 Crear stubs de página: `/consultorios`, `/pacientes`, `/sala-espera` (contenido placeholder mínimo)
- [x] 2.4 Eliminar o redirigir `(medico)/mi-agenda`; alinear referencias en AGENTS.md / skill frontend-coder tocadas por el change

## 3. Componentes del shell

- [x] 3.1 `AppBackground`: fondo fijo con `background1.webp` (+ overlay ligero si el diseño lo pide)
- [x] 3.2 `AppSidebar`: glass del wireframe, logo completo/icono según estado, ítems filtrados por rol, activo por pathname, chevron colapsar/expandir
- [x] 3.3 `AppNavbar`: logo icono (desktop), control ☰ (mobile), nombre de usuario + botón perfil (`console.log`)
- [x] 3.4 `HelpBotButton`: FAB inferior derecho AYUDA BOT (`console.log`)
- [x] 3.5 `AppShell`: composición viewport `h-dvh` / sin scroll de página innecesario; drawer mobile con dismiss
- [x] 3.6 Cargar usuario vía `meRequest` (o equivalente) para nombre/rol en el shell; manejar sesión ausente

## 4. Tests y verificación

- [x] 4.1 Tests Vitest: filtrado de menú por rol; colapso muestra iconos; stubs de click perfil/bot
- [x] 4.2 Tests de redirect home médico → `/agenda` (shared-types / role-home si aplica)
- [x] 4.3 `pnpm --filter @turnos/web test` + lint/format de archivos tocados
- [x] 4.4 Smoke manual: login por rol → menú correcto → navegación stubs → colapso/drawer → fondo estable
