## Why

El modo Lista de la Agenda es la vista operativa del día en curso: la primera carga ya ancla a las 00:00 de hoy, pero el scroll infinito hacia arriba (y un fallback cuando la primera página viene vacía) trae turnos de días anteriores y deshace esa regla. El historial debe consultarse en Día (Semana/Mes más adelante), no mezclado en la lista de trabajo.

## What Changes

- El modo Lista deja de cargar turnos anteriores al día actual: el tope de la grilla es siempre hoy 00:00 (o el primer turno desde hoy si el día actual no tiene turnos).
- El scroll infinito queda **solo hacia adelante**: al llegar al final se piden páginas posteriores; al llegar al inicio no se solicita página anterior.
- Si no hay turnos desde hoy en adelante, se muestra el mensaje vacío **ya existente** (`No hay turnos para mostrar con los filtros actuales.`). No se cambia copy.
- Fuera de alcance: modos Día/Semana/Mes, botón "volver a hoy", `pendientes.md`, y cualquier cambio de mensaje vacío.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- `appointments-list`: el requisito de scroll infinito bidireccional anclado al día actual pasa a scroll infinito **solo hacia adelante**, con tope duro en hoy 00:00. El escenario de scroll hacia arriba que carga turnos anteriores se elimina.

## Impact

- Frontend: `apps/web/components/agenda/turnos-listado.tsx` (dejar de llamar `fetchPreviousPage`, quitar el fallback que rellena con el pasado cuando la primera página está vacía) y tests asociados.
- Backend: `GET /api/turnos` puede seguir exponiendo `cursorAnterior` / `direccion=anterior`; el modo Lista deja de usarlos. No es un cambio **BREAKING** de API.
- Specs: `openspec/specs/appointments-list/spec.md`. Día, Semana y Mes no se tocan.
