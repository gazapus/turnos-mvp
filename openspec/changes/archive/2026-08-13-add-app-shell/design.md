## Context

Tras `add-login-jwt`, existen stubs de paneles (`/usuarios`, `/agenda`, `/mi-agenda`) sin layout compartido. El wireframe de referencia es `wireframes/agendapage/` (glass, sidebar 280px, navbar, FAB AYUDA BOT). Assets: `logo_completo.png`, `logo_icono.png`, `images/general/logo_background.webp`. Sesión disponible vía `GET /api/auth/me` (`meRequest`). Ver proposal.md para motivación y matriz de menú por rol.

## Goals / Non-Goals

**Goals:**

- Un único AppShell para rutas autenticadas del menú.
- Sidebar glass colapsable (iconos + logo_icono) y drawer en mobile.
- Navegación declarativa filtrada por rol; stubs de rutas faltantes.
- Unificar home del médico en `/agenda`; retirar `/mi-agenda`.
- Stubs de perfil y chatbot con `console.log` (sin lógica de negocio).

**Non-Goals:**

- Contenido de agenda, pacientes, consultorios o sala de espera.
- Popup de perfil real (logout, datos) ni chatbot IA.
- Autorización de acciones dentro de Agenda (solo visibilidad de ítems de menú).
- Fullscreen / transmisión de sala de espera.

## Decisions

### 1. Route group `(app)` con layout compartido

Envolver `(admin)`, `(recepcion)` y páginas nuevas bajo un route group con `layout.tsx` que monte el AppShell. Login (`(auth)`) queda fuera. URLs no cambian por el group.

**Alternativa:** layout duplicado en cada route group → descartada (duplicación).

### 2. Catálogo de navegación centralizado

Constante tipada (p. ej. en `apps/web/lib/navigation/` o `shared-types`) con `{ id, label, href, icon, roles[] }`. El sidebar filtra por `user.rol`.

| Href            | Roles                        |
| --------------- | ---------------------------- |
| `/agenda`       | ADMIN, RECEPCIONISTA, MEDICO |
| `/consultorios` | ADMIN, RECEPCIONISTA         |
| `/pacientes`    | ADMIN, RECEPCIONISTA         |
| `/usuarios`     | ADMIN                        |
| `/sala-espera`  | ADMIN, RECEPCIONISTA         |

### 3. Unificar agenda; eliminar `/mi-agenda`

- `ROLE_HOME_PATHS.MEDICO = '/agenda'`.
- Eliminar stub `(medico)/mi-agenda` (o redirect permanente a `/agenda`).
- Middleware: proteger nuevas rutas; quitar `/mi-agenda` del matcher.

**Alternativa:** mantener `/mi-agenda` como alias → descartada (dos URLs para la misma pantalla).

### 4. Estado del sidebar (expandido / colapsado / drawer)

Client leaf components para interacción. Persistencia del colapso en desktop: `localStorage` opcional; default expandido. Mobile (`max-md` / breakpoint del tema): sidebar oculto; botón ☰ en navbar abre drawer overlay + backdrop.

### 5. Glass y tokens

Replicar CSS del wireframe (blur 40px, saturate, rgba blanco, borde). Preferir tokens en `tokens.css` (`--glass-bg`, etc.) y utilidades semánticas; prohibido hex sueltos en JSX.

### 6. Iconos: `lucide-react`

No hay librería de iconos hoy (SVG inline en login). `lucide-react` para menú, chevron, menu, user, bot.

**Alternativa:** Material Symbols CDN como el HTML Stitch → descartada (dependencia de red y menos alineada al monorepo).

### 7. Usuario en navbar

Nombre: `nombre` (+ apellido si cabe) desde `meRequest` en el layout/shell. Mobile: solo icono. Click usuario / AYUDA BOT → `console.log` (perfil popup y chatbot en changes futuros).

### 8. Viewport sin scroll fantasma

Shell `h-dvh` / `overflow-hidden`; solo el área de contenido (`children`) hace scroll si el contenido lo requiere.

## Risks / Trade-offs

- **[Docs desalineadas]** AGENTS.md / frontend-coder / FUNCIONAL aún hablan de `mi-agenda` → Actualizar en tasks de este change o chore inmediato post-merge.
- **[Auth spec vs producto]** Spec de auth dice “agenda propia” → Delta MODIFIED en este change.
- **[Menú ≠ autorización de página]** Filtrar ítems no impide navegar a URL a mano → Middleware/guards por rol pueden endurecerse en un change de authz; por ahora stubs visibles según menú + sesión requerida.
- **[Glass + backdrop-filter]** Coste de pintura en mobile → Aceptable para MVP; degradar blur solo si hay evidencia.

## Migration Plan

1. Deploy frontend con shell + rutas nuevas + home médico → `/agenda`.
2. Usuarios con bookmarks a `/mi-agenda`: redirect a `/agenda` si se deja rewrite; si se elimina la ruta, 404 hasta actualizar bookmark.
3. Rollback: revert del change de web/shared-types; no hay migración de DB.

## Open Questions

- Ninguna que bloquee implementación; el popup de perfil real y el chatbot quedan explícitamente fuera.
