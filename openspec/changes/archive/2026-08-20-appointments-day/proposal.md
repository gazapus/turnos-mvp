## Why

La Agenda de Turnos (`/agenda`) hoy solo tiene el modo Lista implementado; los modos Día, Semana y Mes son un placeholder vacío (`AgendaVistaPlaceholder`). El negocio necesita visualizar los turnos de un día concreto en una grilla horaria (estilo Google Calendar), para que recepción/médicos vean de un vistazo los huecos y superposiciones de la agenda de ese día, algo que la Lista (orientada a scroll cronológico continuo) no comunica bien.

## What Changes

- Se implementa el modo de visualización **Día** dentro del layout ya existente de `/agenda` (mismos filtros, tabs, checkbox "Cancelados").
- Grilla horaria de 24hs con turnos posicionados por hora exacta de inicio y duración real (modelo continuo, estilo Google Calendar), usando el motor `timeGrid` de **FullCalendar v6.1.21** (`@fullcalendar/core`, `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`) como dependencia nueva.
- Cada turno se renderiza como card propia (vía `eventContent`) con: ícono + nombre y apellido del médico, ícono + nombre y apellido del paciente, pill de estado (reutilizando `TurnoEstadoPill`) e ícono de tipo con tooltip (reutilizando `TurnoTipoIcon`). Turnos superpuestos en el tiempo se muestran lado a lado sin huecos ni margen inicial (`slotEventOverlap: false` + overrides de CSS).
- Colores de fondo de cada card derivados del color de la pill de su estado, en versión "soft"/clara — se agregan tokens nuevos a `tokens.css`.
- El fondo del contenedor del modo Día reutiliza la clase `glass-panel-agenda` (mismo blur/opacity que el modo Lista).
- Selector de fecha centrado sobre la grilla: input con formato de visualización `{día} {mes} {año}`, popover de calendario (`@daypicker/react`, dependencia nueva) para elegir el día o tipear `DD/MM/YYYY`, flechas de día anterior/siguiente a los costados, y botón "HOY" en la esquina superior derecha del bloque de vista. Cambiar de fecha (input, flechas o "HOY") dispara un nuevo fetch al backend.
- Scroll interno de la grilla: se posiciona en las 8:00 por defecto en cada carga/cambio de fecha (`scrollTime`), permite scrollear libremente por las 24hs (incluidas las horas previas a las 8am) y no avanza automáticamente al día siguiente al llegar al final.
- El checkbox "Cancelados" ya existente en el layout se aplica también al modo Día, filtrando en memoria (sin refetch), igual que en Lista.
- **`GET /api/turnos`** (mismo endpoint que ya usa Lista) suma un query param opcional `fecha` (`YYYY-MM-DD`): cuando está presente, el backend ignora la paginación por cursor/límite de 30 y devuelve **todos** los turnos de ese día.
- El DTO compartido `TurnoListItemDto` suma el campo `horaFin` (`HH:mm`, mismo criterio de formateo que `hora`), necesario para calcular la duración de cada card en la grilla. Es un campo aditivo: no rompe el contrato consumido hoy por el modo Lista.

## Capabilities

### New Capabilities

- `appointments-day`: modo de visualización Día de la Agenda de Turnos — grilla horaria de 24hs con turnos posicionados por hora/duración real, selector de fecha con navegación, y reutilización del layout/filtros/checkbox de cancelados ya definidos en `appointments-agenda`.

### Modified Capabilities

- `appointments-list`: el contrato de `GET /api/turnos` se extiende con el query param `fecha` (modo "sin paginar, un día completo") y el DTO de ítem de turno suma el campo `horaFin`.

## Impact

- **Frontend** (`apps/web`): nuevo componente de vista Día (grilla FullCalendar + card custom), nuevo selector de fecha (`@daypicker/react`), nuevos tokens de color "soft" por estado en `tokens.css`, nueva hoja de estilos de overrides para FullCalendar (primer uso de CSS global más allá de utilities de Tailwind en este proyecto), extensión de `ParsedAgendaParams`/`AgendaUrlParams` con `fecha`, extensión del cliente de API (`lib/api/turnos-client.ts`) y de `lib/agenda/url-params.ts`.
- **Backend** (`apps/api`): `AppointmentsService`/`ListTurnosQueryDto`/`TurnoListItemResponseDto` en el módulo `appointments` — nuevo modo de consulta sin cursor cuando hay `fecha`, nuevo campo `horaFin` en la respuesta.
- **Shared types** (`packages/shared-types`): `TurnoListItemDto` (suma `horaFin`), `TurnosListQuery` (suma `fecha`), `AgendaUrlParams` (suma `fecha`).
- **Dependencias nuevas**: `@fullcalendar/core@6`, `@fullcalendar/react@6`, `@fullcalendar/daygrid@6`, `@fullcalendar/timegrid@6`, `@daypicker/react` (frontend únicamente).
- **No afecta**: autenticación, scoping por rol (se mantiene igual, ya resuelto en `appointments-list`), modos Semana/Mes (siguen siendo placeholder, quedan fuera de esta propuesta), acciones sobre turnos (siguen sin lógica real).
