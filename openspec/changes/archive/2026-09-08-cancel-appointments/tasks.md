## 1. Backend — cancelar turno

- [x] 1.1 Exponer `motivoCancelacion` (`string | null`) en `TurnoDetalleDto` / `TurnoDetalleResponseDto` y mapearlo en `fromEntity`
- [x] 1.2 Crear DTO de body `{ motivo?: string }` con `@IsOptional`, `@IsString`, `@MaxLength(500)` y Swagger
- [x] 1.3 Exponer `PATCH /api/turnos/:id/cancelar` (`JwtAuthGuard`, Swagger) que delega en el service y responde `TurnoDetalleResponseDto`
- [x] 1.4 En el service: `assertCanWrite` (médico 403); normalizar motivo (trim / vacío → `null`); update atómico `PROGRAMADO | CONFIRMADO` → `CANCELADO` + `motivoCancelacion`; 404 si no existe; 400 si el estado no aplica, con `message` legible; no validar fecha
- [x] 1.5 Tests de controller/service: éxito 200 (programado/confirmado, con y sin motivo, fecha pasada), 403 médico, 400 si `ATENDIDO`/`AUSENTE`/`CANCELADO`, 404, y que una segunda cancelación no pisa el estado

## 2. Frontend — dialog warning

- [x] 2.1 Extender `FeedbackProvider`: variante danger en el dialog de error (Cerrar); `showConfirm` warning con Aceptar/Cancelar, textarea opcional genérico y sin cierre por overlay
- [x] 2.2 Tests del provider: error sigue cerrando con Cerrar; warning Cancelar no confirma; Aceptar devuelve el texto; warning se muestra sobre otra modal

## 3. Frontend — cliente y visibilidad

- [x] 3.1 Agregar `cancelarTurno(id, motivo?)` en `turnos-client.ts` (`PATCH /api/turnos/:id/cancelar`) y tipar `motivoCancelacion` en el detalle
- [x] 3.2 Helper `canCancelarTurno` (rol ADMIN/RECEPCIONISTA + `PROGRAMADO` o `CONFIRMADO`, sin fecha), con test

## 4. Frontend — lista

- [x] 4.1 `TurnoAcciones`: mostrar Cancelar solo si aplica; al click abrir `showConfirm` ("¿Cancelar este turno?", motivo opcional); Aceptar llama `cancelarTurno`, toast "Turno cancelado correctamente" o dialog de error; `stopPropagation`; notificar al padre para invalidar queries; deshabilitar mientras vuela el request
- [x] 4.2 Tests: visibilidad por rol/estado (incluido oculto en `ATENDIDO`/`AUSENTE`/`CANCELADO` y visible en fecha distinta a hoy); click Cancelar no abre el detalle; Cancelar del dialog no llama API; Llamar/Finalizar siguen sin efecto

## 5. Frontend — popup de detalle

- [x] 5.1 En `TurnoFormDialog`, renombrar "Anular turno" a "Cancelar turno" y mostrarlo solo si aplica; mismo flujo de confirm + API + toast/error; overlay de procesamiento; éxito cierra el popup y llama `onSaved`; error no cierra
- [x] 5.2 En detalle `CANCELADO`, bloque de solo lectura "Motivo de cancelación" al pie de "Información del turno": texto persistido o "Sin especificar"; no mostrarlo en alta ni en otros estados
- [x] 5.3 Tests: visibilidad de Cancelar (programado/confirmado/alta/médico/estados terminales); éxito cierra; error deja el popup abierto; motivo visible / "Sin especificar" / oculto si no es `CANCELADO`

## 6. Cierre

- [x] 6.1 Invalidar `['turnos']` y `['turnos-dia']` tras cancelar desde Lista (mismo criterio que `handleSaved` del popup)
- [x] 6.2 Verificar que la card del modo Día no gana un control de cancelar
