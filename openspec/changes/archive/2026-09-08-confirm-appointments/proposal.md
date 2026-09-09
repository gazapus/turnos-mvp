## Why

El circuito operativo del MVP exige confirmar al paciente el día de la cita (CU 4): hoy los botones Confirmar del listado y del popup de detalle son stubs. Sin esa transición `PROGRAMADO → CONFIRMADO` el médico no puede llamar el turno y recepción no puede marcar la llegada.

## What Changes

- Confirmar un turno deja de ser stub: un click en el ícono del modo Lista o en "Confirmar turno" del popup de detalle dispara el cambio de estado en el backend, sin dialog de "¿estás seguro?".
- El botón Confirmar solo es visible para Recepcionista y Administrador, y solo si el turno está `PROGRAMADO` y su fecha civil de clínica es **hoy**. En cualquier otro día, estado o rol, el control no se muestra (no se deshabilita).
- Éxito: toast "Turno confirmado correctamente", cierre del popup si estaba abierto, y refresh del listado o de la grilla del modo Día. Error: dialog genérico (mensaje amigable + detalle del backend); el popup no se cierra.
- El modo Día no agrega un check sobre la card: la confirmación en esa vista es solo desde el popup.
- API nueva `PATCH /api/turnos/:id/confirmar` que valida rol, estado y día civil. No se reutiliza el `PATCH` de edición de campos.
- Un turno ya `CONFIRMADO` (u otro estado distinto de `PROGRAMADO`) no vuelve a mostrar el botón.

## Capabilities

### New Capabilities

- `appointments-confirm`: transición de estado Confirmar (CU 4), visibilidad del control, contrato `PATCH /api/turnos/:id/confirmar`, feedback y refresh de las vistas activas.

### Modified Capabilities

- `appointments-list`: la columna Acciones deja de tratar Confirmar como stub fijo; visibilidad por rol + estado + día; el click confirma sin abrir el popup. Anular, Llamar y Finalizar siguen stubs.
- `appointments-form`: "Confirmar turno" en detalle deja de mostrarse siempre y sin efecto; misma regla de visibilidad y el mismo flujo de éxito/error.

## Impact

- `apps/api`: endpoint de confirmar en `appointments` (comando dedicado, no el PATCH de edición); mismas reglas de zona horaria `America/Argentina/Buenos_Aires`.
- `apps/web`: `TurnoAcciones` y `TurnoFormDialog` (handler + visibilidad); cliente HTTP; reutilizar `FeedbackProvider` e invalidación de queries `turnos` / `turnos-dia`.
- `packages/shared-types`: tipo/contrato del comando de confirmar si hace falta.
- Sin migración Prisma: el enum `EstadoTurno` ya incluye `CONFIRMADO`.
- Fuera de alcance: anular, llamar, finalizar, ausente, job de ausentes, modo Semana/Mes, check en la card del modo Día.
