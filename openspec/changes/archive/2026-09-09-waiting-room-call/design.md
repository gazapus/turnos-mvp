## Context

La Agenda ya lista turnos (Lista y Día) y confirma/cancela. Los controles Llamar y Finalizar de `TurnoAcciones` y "Llamar paciente" de `TurnoFormDialog` no tienen handler. `assertCanWrite` responde 403 a todo médico. `/sala-espera` es un stub dentro del shell (ADMIN / RECEPCIONISTA). Prisma ya tiene `LlamadoTurno` (`turnoId` + `llamadoEn`) pensado para el historial de avisos sin un estado `LLAMADO`. El catálogo de consultorios (CU 7) ya asigna 1:1 y define el nombre canónico `CONSULTORIO {n}`.

Zona horaria única: `America/Argentina/Buenos_Aires`. Feedback (`toastSuccess` / `showError`) e invalidación de `['turnos']` / `['turnos-dia']` ya existen.

El ADR de arquitectura menciona un gateway WebSocket. Este change lo supera para el MVP: el TV es un consumidor unidireccional.

Actores: el Médico llama y finaliza **sus** turnos; Recepcionista y Administrador operan el monitor.

## Goals / Non-Goals

**Goals:**

- Registrar cada llamado como fila de `LlamadoTurno` sin cambiar `estado` (sigue `CONFIRMADO`).
- Emitir el aviso en tiempo real a `/sala-espera` (SSE) y persistir snapshot de los últimos 5.
- Transición `CONFIRMADO → ATENDIDO` con Finalizar turno, solo si hubo ≥1 llamado.
- Ocultar Llamar/Finalizar cuando no aplican (mismo patrón que Confirmar).
- Tablero del wireframe `wireframes/monitor.jpg`, desktop-only; pantalla completa esconde el shell; sonido por llamado nuevo.
- Backend que rechace lo que la UI oculta (rol, dueño, estado, día, consultorio, llamado previo).

**Non-Goals:**

- Ruta pública sin sesión, múltiples TVs, WebSocket, Redis, varias instancias de API.
- Ausente, Semana/Mes, botones en cards del modo Día.
- Timer de ~10 s de FUNCIONAL: el destacado es el último llamado de la lista.
- Relajar `assertCanWrite` para crear/editar/confirmar/cancelar.
- CRUD de consultorios.

## Decisions

### 1. Comandos dedicados; el médico no usa `assertCanWrite`

`PATCH /api/turnos/:id` sigue prohibido para médico. Llamar y finalizar son excepciones explícitas, scoped al turno propio.

| Método | Ruta | Body | Quién | 200 |
| --- | --- | --- | --- | --- |
| `POST` | `/api/turnos/:id/llamar` | vacío | MEDICO dueño | `TurnoDetalleDto` con `llamado: true` |
| `PATCH` | `/api/turnos/:id/finalizar` | vacío | MEDICO dueño | `TurnoDetalleDto` con `estado: ATENDIDO` |
| `GET` | `/api/sala-espera` | — | ADMIN, RECEPCIONISTA | `{ items: LlamadoSalaEsperaDto[] }` (máx. 5) |
| `GET` | `/api/sala-espera/stream` | — | ADMIN, RECEPCIONISTA | SSE `text/event-stream` |

Médico en sala-espera: 403. No autenticado: 401. Turno inexistente o ajeno al médico: 404.

Alternativa descartada: meter `estado: ATENDIDO` en el PATCH de edición, o un WebSocket gateway. El primero mezcla contratos; el segundo es más infraestructura de la que el TV necesita.

### 2. Llamar no cambia estado; Finalizar sí

```
CONFIRMADO + hoy + consultorio
        │  POST .../llamar  (N veces)
        ▼
  insert LlamadoTurno + emit SSE
  estado sigue CONFIRMADO
        │  PATCH .../finalizar (1 vez, si count(llamados) ≥ 1)
        ▼
     ATENDIDO
```

Update de finalizar atómico:

```
UPDATE turno SET estado = ATENDIDO
 WHERE id = :id AND estado = CONFIRMADO
   AND fechaInicio ∈ [inicio, fin) del día civil de hoy
```

Si `count === 0` → 404 o 400. Además exigir ≥1 `LlamadoTurno` **antes** del update (si no hay llamado: 400, no se marca atendido).

Llamar: insert + emit; si no es `CONFIRMADO` de hoy, o no hay `Consultorio` con `medicoId` del turno: 400 con `message` legible ("El médico no tiene consultorio asignado" / estado o día inválidos).

### 3. Snapshot denormalizado en `LlamadoTurno`

Hoy la tabla solo guarda `turnoId` + `llamadoEn`. Si recepción reasigna el consultorio, el historial de la TV mentiría.

Migración aditiva:

- `paciente_nombre` String
- `paciente_apellido` String
- `consultorio_numero` Int

Se copian al insertar. La TV nunca joinea el turno vivo para pintar. El string `CONSULTORIO {n}` no se persiste: se deriva para aria; la celda muestra solo el número.

La tabla puede estar vacía en deploys actuales (el seed borra llamados): columnas `NOT NULL` sin default.

### 4. SSE in-memory; ADR de WS superado en el MVP

Módulo Nest `apps/api/src/waiting-room/`:

- Subject/EventEmitter de proceso: al insertar un llamado, `next` del payload.
- `@Sse('stream')` sobre `GET /api/sala-espera/stream`.
- Headers: `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no` para no bufferizar en el rewrite de Next (`/api/:path*` → Nest).

El browser usa `EventSource('/api/sala-espera/stream')` same-origin (cookies httpOnly via rewrite). Al conectar, el cliente ya hizo `GET /api/sala-espera` para no depender del primer evento.

Un solo proceso Nest. Si un día hay réplicas: Redis pub/sub o WS. Queda anotado; no se implementa.

Payload del evento y de cada ítem del GET:

```
{ id, consultorioNumero, pacienteNombre, pacienteApellido, llamadoEn }
```

Orden: `llamadoEn` DESC, `take: 5`. El cliente pone el primero como fila destacada.

### 5. Flag `llamado` en listado y detalle

`TurnoListItemDto` y `TurnoDetalleDto` ganan `llamado: boolean` (`true` si existe ≥1 `LlamadoTurno`). La UI no infiere por sesión: un refresh habilita Finalizar.

Helpers:

- `canLlamarTurno({ rol, estado, fecha })` → MEDICO + `CONFIRMADO` + hoy
- `canFinalizarTurno({ rol, estado, fecha, llamado })` → MEDICO + `CONFIRMADO` + hoy + `llamado`

Ocultar, no deshabilitar. Recpcionista/admin nunca ven estos botones.

### 6. Feedback: Llamar deja el popup abierto; Finalizar lo cierra

Un click, sin dialog de "¿estás seguro?". Botón inerte mientras vuela el request.

| Acción | Éxito | Error |
| --- | --- | --- |
| Llamar | Toast "Paciente llamado correctamente"; popup **sigue** (se puede repetir y debe aparecer Finalizar); invalidar `turnos` / `turnos-dia` | `showError` "No se pudo llamar al paciente" + `message`; popup abierto; TV no cambia |
| Finalizar | Toast "Turno finalizado correctamente"; popup **cierra**; invalidar | `showError` "No se pudo finalizar el turno" + `message`; popup abierto |

Lista: `stopPropagation` igual que Confirmar. Modo Día: sin íconos en la card.

### 7. Monitor: wireframe, no overlay de 10 s

`/sala-espera` reemplaza el stub por el tablero (logo Clínica Salud, fecha+reloj en `CLINIC_TIMEZONE`, tagline, columnas CONSULTORIO / PACIENTE, footer). Solo filas reales; 0 llamados = header/footer en silencio. Máximo 5. Paciente con `uppercase` + `truncate`. Sin breakpoints `max-sm:` / `max-md:`: composición para monitor grande.

Pantalla completa: `requestFullscreen()` sobre el **panel del monitor** (no el documento). Navbar/sidebar quedan fuera del elemento y desaparecen de la vista. El botón ⛶ vive en `/sala-espera` (fuera del área que se transmite, o se oculta en `:fullscreen`). Ese gesto es el unlock de autoplay: cada evento SSE posterior reproduce un sonido corto de alarma (`public/` estático).

Reloj: actualizar al menos cada minuto. Fecha: weekday + día + mes en español.

### 8. Módulos y wiring

- API: `AppointmentsService.llamarTurno` / `finalizarTurno`; `WaitingRoomModule` (controller snapshot+SSE, publisher inyectable para que appointments emita sin importar archivos internos: appointments importa el barrel de waiting-room).
- Web: `llamarTurno` / `finalizarTurno` en `turnos-client`; cliente de sala-espera; `Consultorios` no se toca (solo se lee la asignación al llamar).
- Tests: controller/service de los tres contratos; helpers de visibilidad; acciones lista/popup; tablero (vacío, 1, 5, ellipsis, fullscreen no se E2E-obliga en jsdom más allá del botón presente).

## Risks / Trade-offs

- **[Autoplay del sonido]** → Sin gesto el browser silencia. El ⛶ es el unlock; documentar que hay que transmitir para oír.
- **[Rewrite Next bufferiza SSE]** → Headers anti-buffer; verificar de punta a punta. Si falla, un route handler Next que haga proxy del stream.
- **[Una sola instancia de API]** → Bus in-memory. Dos réplicas = TVs mudos. Aceptable en single-tenant MVP.
- **[Reloj del browser vs servidor]** → La UI puede mostrar Llamar un minuto de más; el API manda. 400 + dialog.
- **[Doble click / dos pestañas]** → Botón inerte; finalizar condicionado a `CONFIRMADO`; llamar es insert (idempotente en el sentido de "otro aviso más", que es el producto).
- **[Médico sin consultorio]** → 400; la TV no recibe evento.

## Migration Plan

Migración Prisma aditiva en `llamados_turno` (tres columnas de snapshot). Endpoint y pantalla aditivos. Rollback: retirar endpoints y volver Llamar/Finalizar a stubs; la tabla de llamados puede quedar (histórico inerte).

## Open Questions

Ninguna: resueltas en explore (Finalizar en este change; nombre "Finalizar turno"; ocultar no disable; últimos 5; SSE; día = hoy; MAYÚSCULAS; ellipsis CSS; filas reales; 400 sin consultorio; fullscreen del panel esconde el shell).
