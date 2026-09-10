## 1. Schema y contratos compartidos

- [x] 1.1 Migración Prisma: agregar `pacienteNombre`, `pacienteApellido` y `consultorioNumero` a `LlamadoTurno` (NOT NULL, snapshot al insertar)
- [x] 1.2 Extender `TurnoListItemDto` y `TurnoDetalleDto` con `llamado: boolean`; agregar DTOs de sala de espera (`id`, `consultorioNumero`, `pacienteNombre`, `pacienteApellido`, `llamadoEn`)

## 2. Backend — sala de espera

- [x] 2.1 Módulo Nest `waiting-room` (barrel): publisher in-memory, `GET /api/sala-espera` (últimos 5, ADMIN/RECEPCIONISTA) y `GET /api/sala-espera/stream` (SSE, mismos roles, headers anti-buffer)
- [x] 2.2 Tests: snapshot vacío y de 5; 403 médico; 401; el publisher entrega el payload a un subscriber de prueba

## 3. Backend — llamar

- [x] 3.1 Exponer `POST /api/turnos/:id/llamar` (body vacío, `JwtAuthGuard`, Swagger) que inserta `LlamadoTurno` con snapshot, emite al bus y responde detalle con `llamado: true` sin cambiar `estado`
- [x] 3.2 Service: solo MEDICO dueño; `CONFIRMADO` + día civil de hoy; consultorio asignado al médico del turno; 404 ajeno/inexistente; 403 no médico; 400 sin consultorio o estado/día inválidos
- [x] 3.3 Tests: 200 y segundo llamado; 400 sin consultorio (sin emit); 400 si no es hoy o no `CONFIRMADO`; 403 recepción; 404 ajeno

## 4. Backend — finalizar

- [x] 4.1 Exponer `PATCH /api/turnos/:id/finalizar` (body vacío, Swagger) con update atómico `CONFIRMADO` + hoy + ≥1 llamado → `ATENDIDO`
- [x] 4.2 Tests: 200; 400 sin llamados; 400 ya `ATENDIDO`; 403 recepción; 404 ajeno

## 5. Backend — flag `llamado` en listado y detalle

- [x] 5.1 Incluir `llamado` en `TurnoListItemResponseDto` y `TurnoDetalleResponseDto` (existencia de ≥1 `LlamadoTurno`)
- [x] 5.2 Tests: listado/detalle con y sin llamados

## 6. Frontend — cliente y visibilidad

- [x] 6.1 Cliente: `llamarTurno(id)`, `finalizarTurno(id)` y `fetchSalaEspera()` / EventSource de `/api/sala-espera/stream`
- [x] 6.2 Helpers `canLlamarTurno` y `canFinalizarTurno` (rol MEDICO + `CONFIRMADO` + hoy; finalizar exige `llamado`) con tests

## 7. Frontend — lista

- [x] 7.1 `TurnoAcciones`: mostrar Llamar/Finalizar solo si aplica; click llama al cliente, toast o dialog, `stopPropagation`, invalidar queries; deshabilitar el ícono mientras vuela el request
- [x] 7.2 Tests: visibilidad por estado/fecha/`llamado`; click no abre el detalle; recepción no ve estos botones

## 8. Frontend — popup de detalle

- [x] 8.1 `TurnoFormDialog`: "Llamar paciente" y "Finalizar turno" solo si aplican; mismo flujo de API + toast/error; overlay de procesamiento; llamar deja el popup abierto (aparece Finalizar); finalizar cierra y `onSaved`
- [x] 8.2 Tests: visibilidad; éxito de llamar no cierra; éxito de finalizar cierra; error deja el popup abierto; alta y recepción no muestran estos botones

## 9. Frontend — monitor `/sala-espera`

- [x] 9.1 Reemplazar el stub por el tablero del wireframe (header, columnas, pie, filas reales, uppercase + truncate, reloj de clínica, desktop-only)
- [x] 9.2 Hidratar con snapshot, suscribir SSE, prepend + recorte a 5, sonido en evento nuevo (no en la carga), botón de pantalla completa sobre el panel (esconde shell)
- [x] 9.3 Tests: vacío, un llamado, recorte a 5, ellipsis, presencia del control de pantalla completa

## 10. Cierre

- [x] 10.1 Invalidar `['turnos']` y `['turnos-dia']` tras llamar y finalizar desde Lista (mismo criterio que el popup)
- [x] 10.2 Verificar que las cards del modo Día no ganan controles de llamar ni finalizar
