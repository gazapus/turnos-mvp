## Why

Tras el login, los paneles autenticados son stubs sin navegación compartida. Sin un shell común (navbar, sidebar por rol, fondo y acceso al chatbot) cada módulo reinventaría layout y menú, y no hay forma coherente de moverse entre Agenda, Consultorios, Pacientes, Usuarios y Sala de espera.

## What Changes

- Layout autenticado compartido en `apps/web`: fondo fijo, navbar superior, sidebar colapsable con efecto glass del wireframe `agendapage`, y botón flotante **AYUDA BOT**.
- Menú lateral filtrado por rol (ADMIN, RECEPCIONISTA, MEDICO) con rutas distintas por opción.
- Stubs de páginas nuevas: `/consultorios`, `/pacientes`, `/sala-espera` (dentro del shell).
- **BREAKING (UX/rutas):** desaparece `/mi-agenda`. Médico y recepcionista (y admin) usan la misma ruta `/agenda`; las acciones distintas por rol quedan para changes posteriores.
- Botones de perfil (usuario) y AYUDA BOT sin funcionalidad real: solo `console.log` / stub de popup.
- Ajuste de `ROLE_HOME_PATHS`, middleware y convenciones: médico → `/agenda`.
- Dependencia de iconos (`lucide-react`) para menú y controles del shell.

## Capabilities

### New Capabilities

- `app-shell`: layout autenticado (navbar, sidebar glass colapsable/responsive, fondo fijo, FAB chatbot), navegación por rol y stubs de rutas del menú.

### Modified Capabilities

- `auth`: redirección post-login del médico deja de ir a “agenda propia” (`/mi-agenda`) y pasa a la agenda unificada (`/agenda`).

## Impact

- **Apps:** `apps/web` (layout autenticado, componentes de shell, stubs de rutas, middleware, tokens/utilidades glass si hace falta).
- **Packages:** `packages/shared-types` (`ROLE_HOME_PATHS.MEDICO`, constantes de rutas/menú si se centralizan).
- **Dependencias:** `lucide-react` en `@turnos/web`.
- **Docs/convenciones:** `AGENTS.md` / frontend-coder aún documentan `(medico)/mi-agenda` — alinear en este change o follow-up.
- **Fuera de alcance:** contenido real de agenda, lógica de perfil/logout en popup, chatbot IA, fullscreen de sala de espera, autorización fina de acciones dentro de Agenda.
