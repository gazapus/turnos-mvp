## Why

El circuito operativo del MVP exige cancelar turnos que no se van a cumplir (CU 5): hoy el ícono Cancelar del listado y el botón "Anular turno" del popup son stubs. Sin la transición a `CANCELADO` recepción no puede liberar la agenda ni dejar constancia del motivo.

## What Changes

- Cancelar un turno deja de ser stub: el ícono X del modo Lista (tooltip "Cancelar turno") y el botón del popup de detalle (copy unificado a **"Cancelar turno"**, deja de decir "Anular") abren un dialog de confirmación **warning** (mismo shell que el dialog de error, no danger/rojo) con Aceptar, Cancelar y un textarea de motivo **opcional**.
- Cancelar en el dialog cierra el aviso y no cambia el turno. Aceptar dispara `PATCH /api/turnos/:id/cancelar` con el motivo (o `null` si está vacío).
- El control solo es visible para Recepcionista y Administrador, y solo si el estado es `PROGRAMADO` o `CONFIRMADO`. En `ATENDIDO`, `AUSENTE`, `CANCELADO`, o rol Médico, no se muestra (no se deshabilita). La fecha **no** se valida: se puede cancelar pasado, hoy o futuro.
- Éxito: toast "Turno cancelado correctamente", cierre del popup si estaba abierto, y refresh del listado o de la grilla del modo Día (mismo patrón que confirmar). Error: dialog de error genérico (danger); el popup de turno no se cierra.
- En el detalle de un turno `CANCELADO` se muestra el motivo de cancelación (solo lectura, en "Información del turno"). Si no hay motivo, el texto es **"Sin especificar"**.
- El modo Día no agrega un ícono de cancelar sobre la card: se cancela desde el popup.
- API nueva `PATCH /api/turnos/:id/cancelar`. No se reutiliza el `PATCH` de edición de campos. Médico recibe 403. `GET /api/turnos/:id` incluye `motivoCancelacion`.

## Capabilities

### New Capabilities

- `appointments-cancel`: transición de estado Cancelar (CU 5), visibilidad del control, contrato `PATCH /api/turnos/:id/cancelar` con motivo opcional, dialog de confirmación warning, feedback, refresh y motivo en el detalle cancelado.

### Modified Capabilities

- `appointments-list`: la columna Acciones deja de tratar Cancelar como stub siempre visible; visibilidad por rol + estado (sin filtro de fecha); el click abre el dialog warning y no el detalle. Llamar y Finalizar siguen stubs.
- `appointments-form`: "Anular turno" pasa a "Cancelar turno"; misma regla de visibilidad; el click abre el dialog warning; el detalle `CANCELADO` muestra el motivo o "Sin especificar".
- `ui-feedback`: el dialog genérico gana variante warning (Aceptar / Cancelar y textarea opcional genérico), distinta de la variante error (Cerrar, danger).

## Impact

- `apps/api`: endpoint de cancelar en `appointments` (comando dedicado); persistencia en `motivoCancelacion`; `TurnoDetalleDto` expone el motivo.
- `apps/web`: `TurnoAcciones`, `TurnoFormDialog`, `FeedbackProvider`; cliente HTTP; helper de visibilidad; invalidación de queries `turnos` / `turnos-dia`.
- `packages/shared-types`: `motivoCancelacion` en el detalle y body opcional del comando de cancelar.
- Sin migración Prisma: `CANCELADO` y `motivoCancelacion` ya existen.
- Fuera de alcance: llamar, finalizar, ausente, atendido, job de ausentes, notificar mail/WhatsApp al cancelar, modo Semana/Mes, ícono de cancelar en la card del modo Día, columna de motivo en el listado.
