## Why

El circuito operativo del MVP se corta después de confirmar: los botones Llamar y Finalizar del médico son stubs, `/sala-espera` es un placeholder y no hay avisos en tiempo real. Sin CU 9 y CU 10 el paciente no es llamado al consultorio y el médico no puede cerrar el turno a `ATENDIDO`.

## What Changes

- El médico llama un turno `CONFIRMADO` del día civil de clínica **hoy** desde el ícono de la Lista o "Llamar paciente" del popup. Cada click persiste un `LlamadoTurno` (el estado del turno no cambia) y emite el aviso a la sala de espera. Se puede volver a llamar el mismo turno.
- Llamar se **oculta** (no se deshabilita) si no es médico, el estado no es `CONFIRMADO` o la fecha no es hoy. Sin consultorio asignado: 400 + dialog de error; la TV no cambia.
- Tras al menos un llamado, aparece **Finalizar turno** (ícono en Lista, botón en detalle). Un click pasa el turno a `ATENDIDO`; después no se puede llamar ni finalizar. Oculto hasta que aplique.
- El modo Día no suma botones en la card: Llamar y Finalizar se hacen desde el popup, igual que Confirmar/Cancelar.
- `/sala-espera` deja el stub y muestra el tablero del wireframe (`wireframes/monitor.jpg`): últimos 5 llamados (el último destacado arriba), solo filas reales, sin placeholders. Desktop-only (monitores grandes, sin responsive).
- Un botón de pantalla completa esconde navbar/sidebar y deja el monitor a pantalla completa. Ese gesto desbloquea el audio; cada llamado nuevo reproduce un sonido tipo alarma.
- Tiempo real por **SSE** (no WebSocket). Snapshot `GET` de los últimos 5 al cargar o reconectar.
- APIs nuevas: `POST /api/turnos/:id/llamar`, `PATCH /api/turnos/:id/finalizar`, `GET /api/sala-espera` y `GET /api/sala-espera/stream`. El médico escribe solo estos dos comandos; no se relaja `assertCanWrite` del resto de turnos.

## Capabilities

### New Capabilities

- `appointments-call`: llamado de turno (CU 9): visibilidad del control, persistencia de `LlamadoTurno` sin cambiar estado, contrato `POST /api/turnos/:id/llamar`, feedback y emisión al bus de sala de espera.
- `appointments-finalize`: transición `CONFIRMADO → ATENDIDO` (Finalizar turno) tras ≥1 llamado, visibilidad, contrato `PATCH /api/turnos/:id/finalizar`, feedback.
- `waiting-room`: pantalla de aviso (CU 10): tablero de últimos 5, SSE, snapshot, sonido, pantalla completa ocultando el shell.

### Modified Capabilities

- `appointments-list`: Llamar y Finalizar dejan de ser stubs siempre visibles; visibilidad por rol + estado + día + (para Finalizar) haber sido llamado; el DTO de lista incluye si el turno fue llamado; el click no abre el detalle.
- `appointments-form`: en detalle, Llamar paciente y Finalizar turno dejan de ser stubs; misma regla de visibilidad y el mismo flujo de éxito/error. El médico ya no ve Llamar en cualquier detalle.

## Impact

- `apps/api`: comandos de llamar y finalizar en `appointments` (el médico no usa `assertCanWrite`); módulo `waiting-room` (snapshot + SSE + bus in-memory); `TurnoListItem` / detalle con flag `llamado`.
- `apps/web`: `TurnoAcciones`, `TurnoFormDialog`, helpers de visibilidad, cliente HTTP, pantalla `/sala-espera`, EventSource, sonido y Fullscreen API.
- `packages/shared-types`: contratos de llamado, finalizar, ítem de sala de espera y flag `llamado` en listado/detalle.
- Prisma: la tabla `llamados_turno` ya existe. Sin enum nuevo. Posible denormalización de snapshot (nombre, apellido, número de consultorio) en `LlamadoTurno` para que el historial no cambie si se reasigna el consultorio.
- Fuera de alcance: ruta pública `(publico)/sala-espera`, múltiples TVs, WebSocket/Redis, CRUD de consultorios, ausente, Semana/Mes, botones en cards del modo Día, timer de ~10 s de FUNCIONAL (el destacado *es* el último llamado).
