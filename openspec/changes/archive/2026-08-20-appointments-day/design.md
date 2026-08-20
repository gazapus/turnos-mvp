## Context

`/agenda` ya tiene un layout compartido completo (título, filtros, tabs, checkbox "Cancelados") implementado en `2026-08-17-appointments-list` (archivada) y documentado en `openspec/specs/appointments-agenda/spec.md`. El modo Lista (`openspec/specs/appointments-list/spec.md`) consume `GET /api/turnos` con paginación por cursor (30 turnos, anclado a "hoy 00:00"), usa `@tanstack/react-query` (`useInfiniteQuery`) y filtra "Cancelados" en memoria. Los modos Día/Semana/Mes son hoy un placeholder (`AgendaVistaPlaceholder`) sin datos.

El DTO compartido `TurnoListItemDto` (`packages/shared-types/src/turnos.ts`) es intencionalmente mínimo: `id, fecha, hora, paciente{nombre,apellido}, medico{nombre,apellido}, especialidad{nombre}, estado, tipo`. No incluye `fechaFin` aunque existe en el modelo Prisma (`Turno.fechaFin`), porque el modo Lista no lo necesita.

El proyecto no tiene ninguna librería de calendario ni de UI (`components/ui/` no existe); todo el frontend hoy es Tailwind v4 + design tokens en utilities de JSX, sin hojas de estilo propias más allá de `globals.css`/`tokens.css` (que define `glass-panel-agenda`, usado por el modo Lista).

Se evaluaron alternativas de librería para la grilla de eventos (`react-big-calendar`, FullCalendar, Schedule-X) y para el selector de fecha (`@daypicker/react`, construcción a mano) durante la exploración previa a esta propuesta; las decisiones y el razonamiento completo quedan documentados abajo.

## Goals / Non-Goals

**Goals:**

- Modo Día funcional de punta a punta contra datos reales: grilla horaria de 24hs, turnos posicionados por hora exacta y duración real (modelo continuo, no agrupado por hora de reloj).
- Reutilización total del layout/filtros/tabs/checkbox de cancelados ya existentes — el modo Día es solo el contenido del contenedor de vista.
- Selector de fecha con navegación (input + calendario + flechas + "HOY") que dispara un nuevo fetch acotado a un día completo, sin paginación.
- Cards de turno con el mismo lenguaje visual que Lista (pill de estado, ícono de tipo con tooltip), extendido con íconos de médico/paciente e íconos de color por estado.

**Non-Goals:**

- Modos Semana y Mes (quedan como placeholder; esta propuesta solo habilita Día). El diseño deja pistas de reutilización (mismo componente FullCalendar, mismo query param `fecha` como fecha ancla) pero no las implementa.
- Interacción sobre los turnos del modo Día (crear, arrastrar, redimensionar, click para detalle) — cards son de solo lectura, igual que las filas de Lista hoy.
- Cambios en la lógica de negocio de transición de estados o en las acciones de turno (siguen siendo stubs visuales, como en Lista).
- Scoping por rol: se mantiene exactamente igual al ya implementado en `appointments-list` (médico solo ve sus turnos); esta propuesta no modifica esa lógica, solo agrega el filtro por fecha por encima.

## Decisions

### 1. Motor de grilla horaria: FullCalendar v6.1.21, no una implementación propia

Se evaluaron cuatro caminos: construir el algoritmo de overlap/columnas a mano, `react-big-calendar`, FullCalendar y Schedule-X.

- **Construcción propia**: da control total y cero dependencias nuevas, pero el modelo de posicionamiento elegido (continuo, por hora exacta y duración, con clustering de superposiciones) es exactamente el problema que estas librerías ya resuelven de forma madura; escribirlo y testearlo bien a mano es el equivalente a reimplementar el motor de un calendario.
- **`react-big-calendar`**: requiere un localizer externo (date-fns/dayjs/moment) y tiene issues documentados sobre offsets/márgenes al remover el overlap visual por defecto (`dayLayoutAlgorithm`, `minimumStartDifference`) que exigirían overrides con `!important`.
- **Schedule-X**: moderno y con slots de componente por vista, pero trabaja con `Temporal.PlainDate`/`Temporal.ZonedDateTime` (vía `temporal-polyfill`) en vez de `Date` nativo, un paradigma distinto al que usa hoy todo el backend (`Intl`, `startOfClinicDay`).
- **FullCalendar**: tiene dos líneas activas en paralelo al momento de esta propuesta — v6.1.21 (madura, `Date` nativo, CSS bundleada, toda la documentación de la comunidad aplica tal cual) y v7.x (recién lanzada, ~2 meses de vida, agrega `temporal-polyfill` como peer dependency obligatoria, ya no bundlea CSS propia y reestructuró paquetes completos a sub-imports por framework). Se descarta v7 por el mismo motivo que Schedule-X (Temporal) sumado a la inmadurez del release (`@fullcalendar/interaction` nunca superó release candidate en v7 al momento de escribir esto).

Se elige **FullCalendar v6.1.21** (`@fullcalendar/core`, `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`; sin `@fullcalendar/interaction`, no se necesita drag/click en esta propuesta) porque:

- `timeGrid` resuelve nativamente el modelo continuo (posición por hora exacta, altura ∝ duración, columnas por overlap).
- `slotEventOverlap: false` produce el layout lado a lado sin huecos que se pidió (confirmado contra la documentación y un issue público que reporta el comportamiento inverso al dejar el valor por defecto).
- `scrollTime` + `scrollTimeReset` (default `true`) resuelven "siempre arranca en las 8am, se resetea en cada cambio de fecha" sin código propio.
- `eventContent` acepta JSX propio: el contenido de cada card se construye 100% con componentes existentes (`TurnoEstadoPill`, `TurnoTipoIcon`) y Tailwind, sin que la librería imponga su propio markup interno de evento.
- `headerToolbar: false` cede el control total del header a nuestro propio selector de fecha; la navegación se maneja con la API imperativa (`getApi().gotoDate()/.next()/.prev()/.today()`).
- Peer dependencies de `@fullcalendar/react@6.1.21` incluyen React 19 (`^16.7.0 || ^17 || ^18 || ^19`), sin fricción de versión con el resto de `apps/web`.

Se acepta como costo: es la primera dependencia de "grilla de eventos" del proyecto, y la primera vez que se necesita una hoja de CSS de overrides (ver Decisión 4) en vez de solo utilities de Tailwind en JSX.

### 2. Modelo de posicionamiento: continuo por hora/duración real, no agrupado por hora de reloj

El wireframe de referencia (`wireframes/wireframe_day.png`) agrupa visualmente las cards por hora de reloj (todo lo que arranca entre las 8:00 y las 8:59 comparte fila), lo cual es más simple pero no representa fielmente cómo se solapan turnos de distinta duración. Se decide priorizar el comportamiento real de Google Calendar (posición vertical y altura según hora exacta y duración, columnas por clustering de superposición real) por sobre la fidelidad literal al wireframe, ya que es lo que el pedido original describe explícitamente ("a igual que Google Calendar visualiza los eventos") y es el modelo que FullCalendar resuelve de forma nativa (ver Decisión 1).

Consecuencia: el DTO de turno necesita conocer el fin del turno, no solo el inicio (ver Decisión 3).

### 3. `TurnoListItemDto` suma `horaFin` (no `duracionMinutos`)

Se agrega `horaFin: string` (formato `HH:mm`, mismo criterio de `formatClinicTime` que ya usa `hora`) en vez de un campo numérico de duración en minutos, por simetría con el campo `hora` existente y porque el frontend ya sabe combinar `fecha` + un string `HH:mm` en un `Date` local — extender esa combinación a `horaFin` no agrega un segundo formato de dato al DTO. Es un campo aditivo: el modo Lista (`turnos-listado.tsx`, columnas de la tabla) no lo consume y no cambia su comportamiento.

Esto modifica el contrato documentado en el requirement "Respuesta con DTO mínimo" de `openspec/specs/appointments-list/spec.md` (capability ya viva), por eso esta propuesta incluye un delta de esa spec además de la nueva `appointments-day`.

### 4. Query param `fecha`: modo "sin paginar" en el mismo endpoint, no un endpoint nuevo

`GET /api/turnos` ya es el endpoint que reutiliza el modo Lista según el pedido original. Se agrega `fecha` (`YYYY-MM-DD`) como query param opcional en `ListTurnosQueryDto`. Cuando está presente, `AppointmentsService` toma una rama de ejecución separada de la paginación por cursor: calcula el rango `[startOfClinicDay(fecha), startOfClinicDay(fecha+1día))` reutilizando el helper ya existente (`appointments.constants.ts`), y devuelve **todos** los turnos de ese rango sin `take` ni cursores (`cursorAnterior`/`cursorSiguiente` quedan en `null` siempre en este modo). No se combina `fecha` con `cursor`/`direccion` en la misma request; si ambos llegan, `fecha` tiene prioridad y los parámetros de cursor se ignoran.

Alternativa descartada: un endpoint nuevo (`GET /api/turnos/dia`). Se descarta porque el pedido es explícito en reutilizar la misma API, y porque el scoping por rol (médico solo ve sus propios turnos) ya vive en `AppointmentsService.resolveFilters` — bifurcar en un controller nuevo duplicaría esa lógica de seguridad.

### 5. Selector de fecha: `@daypicker/react` solo para el input, no para la grilla

`@daypicker/react` (rebranding de `react-day-picker` v10, MIT, sin dependencia obligatoria de `date-fns`) se usa exclusivamente para el popover de selección de un día (input + calendario mensual chico). Es un problema distinto al de la grilla de eventos (elegir una fecha vs. renderizar turnos en un timeline) y no compite con FullCalendar. El formato de visualización en el input (`{día} {mes} {año}`, ej. "16 agosto 2026") se resuelve con `Intl.DateTimeFormat('es-AR', { day, month: 'long', year: 'numeric' })`, consistente con el uso de `Intl` ya establecido en el backend; el parseo manual de texto libre en formato `DD/MM/YYYY` se valida a mano (sin sumar `date-fns` solo para esto).

### 6. `fecha` como query param de la URL, con default "hoy" y compatible con vistas futuras

Se agrega `fecha` a `ParsedAgendaParams`/`AgendaUrlParams`, con el mismo mecanismo que `medicoId`/`cancelados`: si está ausente en la URL, el default es "hoy" (día civil de la clínica); si está presente, se hidrata el selector con ese valor. Al cambiar de tab (`AgendaTabs`) el valor persiste porque el componente ya propaga `{ ...params, vista }`. Semana/Mes (fuera de alcance) podrían reinterpretar el mismo param como fecha ancla del rango sin necesidad de otro nombre de query param.

### 7. Colores de card por estado: tokens "soft" nuevos, mapeados a variables CSS de FullCalendar

Se agregan tokens nuevos a `tokens.css` (uno por estado: `--estado-programado-soft`, `--estado-confirmado-soft`, `--estado-atendido-soft`, `--estado-ausente-soft`, `--estado-cancelado-soft`), cada uno una variante clara del color ya usado en `TurnoEstadoPill`. Como FullCalendar v6 no permite estilizar el evento 100% vía className de Tailwind en JSX (el contenedor del evento — `.fc-timegrid-event`/`.fc-timegrid-event-harness` — es DOM propio de la librería), se agrega una hoja de estilos acotada (`apps/web/app/agenda-dia.css` o bloque en `globals.css`, a definir en tasks) que mapea variables CSS de FullCalendar (`--fc-event-bg-color`, bordes, márgenes de `slotEventOverlap: false`) a `var(--token)`. Es la primera vez que el proyecto necesita este patrón (CSS global de overrides en vez de solo utilities); se acota exclusivamente a los selectores de FullCalendar, sin introducir hex/rgb arbitrarios (todo valor sigue siendo `var(--token)`).

### 8. Reutilización del checkbox "Cancelados" sin cambios

El checkbox ya vive en el layout compartido (`AgendaContent` → `AgendaCanceladosToggle`) y ya escribe `params.cancelados` en la URL sin refetch. El componente del modo Día simplemente filtra en memoria los turnos ya cargados (`estado !== 'CANCELADO'` cuando `cancelados` es `false`), igual que `TurnosListado`. No se necesita ningún cambio en `AgendaCanceladosToggle`.

## Risks / Trade-offs

- **[Riesgo]** FullCalendar v6 es la línea "anterior" (v7 ya está publicada) → **[Mitigación]** v6.1.21 se lanzó el día previo a v7.0.0 (probable último release de mantenimiento coordinado), sigue totalmente funcional y es la versión con la que toda la documentación/comunidad tiene experiencia; se revisita la migración a v7 en una futura propuesta si el ecosistema (`@fullcalendar/interaction` y plugins de terceros) termina de estabilizarse en la nueva arquitectura basada en Temporal.
- **[Riesgo]** Primera hoja de CSS de overrides del proyecto (rompe el patrón "100% Tailwind en JSX") → **[Mitigación]** se acota estrictamente a selectores de FullCalendar y solo mapea a `var(--token)`, nunca valores arbitrarios; se documenta como excepción justificada en el archivo mismo.
- **[Riesgo]** Testing con Vitest/RTL de un componente que envuelve FullCalendar en `jsdom` es más limitado que testear un componente 100% propio (no hay forma confiable de aserciones sobre scroll real o el árbol interno de columnas que genera la librería) → **[Mitigación]** los tests se acotan a: (a) el mapeo de `TurnoListItemDto` → evento de FullCalendar (`start`/`end`/`extendedProps`) es correcto, y (b) el contenido de `eventContent` (íconos, pill, nombres) renderiza los datos esperados. El comportamiento de scroll/overlap se considera cubierto por la librería, no por tests propios.
- **[Riesgo]** Agregar `horaFin` a `TurnoListItemDto` modifica una spec ya viva (`appointments-list`) → **[Mitigación]** es un campo aditivo (no se remueve ni renombra nada existente), el modo Lista no lo consume; el delta de spec documenta el cambio explícitamente en el requirement de DTO mínimo.
- **[Riesgo]** Turnos con muchas superposiciones (ej. 5+ médicos con horarios simultáneos) generan columnas muy angostas y contenido recortado → **[Mitigación]** aceptado como comportamiento esperado (igual trade-off que Google Calendar real); no se implementa un límite (`eventMaxStack`) en esta propuesta porque no fue pedido, queda como extension point documentado.
- **[Riesgo]** `fecha` sin límite de resultados podría devolver una cantidad grande de turnos en un día con muchos sobreturnos → **[Mitigación]** aceptado explícitamente en el pedido original ("sin limitar la cantidad de resultados"); no bloqueante para el volumen esperado de un solo día de agenda clínica.

## Migration Plan

1. `packages/shared-types`: agregar `horaFin` a `TurnoListItemDto`, agregar `fecha` a `TurnosListQuery` y a `AgendaUrlParams`.
2. `apps/api/src/appointments`: extender `ListTurnosQueryDto` (+`fecha`), `TurnoListItemResponseDto.fromEntity` (+`horaFin` vía `formatClinicTime(turno.fechaFin)`), y `AppointmentsService` con la rama "día completo sin paginar" cuando `fecha` está presente.
3. Actualizar el delta de spec `appointments-list` (requirement de DTO mínimo + nuevo requirement de query param `fecha`).
4. Instalar dependencias nuevas en `apps/web`: `@fullcalendar/core@6`, `@fullcalendar/react@6`, `@fullcalendar/daygrid@6`, `@fullcalendar/timegrid@6`, `@daypicker/react`.
5. Agregar tokens "soft" por estado a `tokens.css` y la hoja de overrides de FullCalendar.
6. Implementar frontend: extensión de `url-params.ts`/`turnos-client.ts` con `fecha`, componente de vista Día (grilla FullCalendar + `eventContent` custom), selector de fecha con `@daypicker/react`.
7. Reemplazar `AgendaVistaPlaceholder` por el nuevo componente cuando `params.vista === 'dia'`.

Rollback: en desarrollo, revertir el commit; no hay migración de base de datos (los campos nuevos son derivados de columnas Prisma existentes, `fechaFin` ya está en el modelo).

## Open Questions

- ¿En algún momento se necesita limitar visualmente turnos muy superpuestos (`eventMaxStack`) para no degradar la legibilidad en días con muchos sobreturnos? No bloqueante para esta propuesta.
- ¿La migración futura a FullCalendar v7 (o a otra librería) se revisita como propuesta propia cuando se implemente Semana/Mes, o se decide recién ahí definitivamente? Queda abierto para esas propuestas futuras.
- ¿El popover de `@daypicker/react` para el modo Mes (futuro) reutiliza el mismo componente que el selector de fecha de Día, o Mes usa directamente la grilla de FullCalendar (`dayGridMonth`) sin selector de fecha con popover? A resolver en la propuesta de Mes.
