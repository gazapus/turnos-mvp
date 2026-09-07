## Why

La Agenda ya lista y muestra turnos, pero no permite crearlos ni ver/editar su detalle: el botón "Nuevo Turno" es un stub y el modo Día no reacciona al click. Sin un formulario único de alta/detalle, recepción no puede operar el CU 3 y el médico no puede abrir los datos del turno desde la grilla horaria.

## What Changes

- Un único popup reutilizable para crear, visualizar y editar turnos, según `wireframes/appointment-form.png` (con las salvedades de producto: sin subtítulo bajo el título, sin subtextos de notificar/anular, fondo `appointments-background.png`).
- Crear: botón "Nuevo Turno" (Recepcionista/Administrador, cualquier vista) o click en un hueco vacío del modo Día, con fecha y hora de inicio precargadas en segmentos de 15 minutos y hora de fin = inicio + 30 min (editable).
- Ver/editar: click en una card del modo Día. El modo Lista no abre el popup; sus botones de acción siguen siendo stubs.
- Lookup de paciente por documento (debounce 1,5 s o blur). Si existe, autocompleta y bloquea los datos (salvo notificar). Si no existe, el usuario completa a mano y el alta del paciente es silenciosa al guardar el turno.
- Médico y especialidad como combobox (mismo patrón que los filtros), con filtrado cruzado y autoselect si queda una sola opción.
- Tipo: el usuario elige Control o Urgente; Primer turno se calcula solo (primera vez de ese paciente con ese médico). Sin manejo de colisiones ni sobreturnos.
- Roles: médico ve el detalle en solo lectura (Llamar + Salir; Llamar sin efecto). Recepción/Admin editan si el turno está `PROGRAMADO` y la fecha no es pasada; Confirmar y Anular se muestran sin efecto.
- Feedback genérico de producto: toast de éxito (5 s + fade 1 s) y dialog de error (mensaje amigable + detalle del backend), reutilizables en el resto de la app.
- APIs nuevas: detalle de turno, alta y edición, búsqueda de paciente por documento, alta de paciente (transaccional con el turno), cruce médico↔especialidad, consulta de primera vez.

## Capabilities

### New Capabilities

- `appointments-form`: popup de alta/detalle/edición de turno, validaciones, lookup y alta silenciosa de paciente, tipificación Control/Urgente/Primer turno, contratos de API de escritura y detalle.
- `ui-feedback`: toast de éxito y dialog de error genéricos, para este flujo y pantallas futuras.

### Modified Capabilities

- `appointments-agenda`: el botón "Nuevo Turno" deja de ser stub y abre el popup vacío (título "Nuevo Turno").
- `appointments-day`: click en hueco vacío abre el alta precargada (slots de 15 min); click en card abre el detalle (título "Detalle de Turno").

## Impact

- `apps/web`: popup y formulario (RHF + Zod), primitivas de toast/dialog/tooltip, click handlers de FullCalendar (`dateClick` / `eventClick`), slots de 15 min, asset de fondo en `public/images/agenda/`, cliente HTTP de turnos/pacientes.
- `apps/api`: `POST`/`PATCH`/`GET :id` de turnos; búsqueda por documento y alta de paciente; DTOs de detalle; relación médico↔especialidad en catálogos o endpoint de cruce; regla de primera vez.
- `packages/shared-types`: DTOs de detalle, alta/edición, paciente con contacto, opciones de médico/especialidad con IDs cruzados.
- Sin migración de schema Prisma (el modelo ya cubre turno, paciente y `MedicoEspecialidad`).
- Fuera de alcance: colisiones/sobreturno, confirmar/anular/llamar con efecto, edición de paciente, WhatsApp, modo Lista como entrada al popup.
