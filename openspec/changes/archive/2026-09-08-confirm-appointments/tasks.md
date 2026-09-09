## 1. Backend — confirmar turno

- [x] 1.1 Exponer `PATCH /api/turnos/:id/confirmar` (body vacío, `JwtAuthGuard`, Swagger) que delega en el service y responde `TurnoDetalleResponseDto`
- [x] 1.2 En el service: `assertCanWrite` (médico 403); update atómico `PROGRAMADO` + fecha civil de hoy en `CLINIC_TIMEZONE` → `CONFIRMADO`; 404 si no existe; 400 si estado o día no aplican, con `message` legible
- [x] 1.3 Tests de controller/service: éxito 200, 403 médico, 400 si no es hoy, 400 si ya `CONFIRMADO` (u otro estado), 404, y que una segunda confirmación no pisa el estado

## 2. Frontend — cliente y visibilidad

- [x] 2.1 Agregar `confirmarTurno(id)` en `turnos-client.ts` (`PATCH /api/turnos/:id/confirmar`, reutilizar `ApiError`)
- [x] 2.2 Helper de visibilidad (rol ADMIN/RECEPCIONISTA + `PROGRAMADO` + fecha civil === `todayYmd()`) compartido por lista y popup, con test

## 3. Frontend — lista

- [x] 3.1 `TurnoAcciones`: mostrar Confirmar solo si aplica; al click llamar `confirmarTurno`, toast "Turno confirmado correctamente" o dialog de error, `stopPropagation`, y notificar al padre para invalidar queries; deshabilitar el botón mientras vuela el request
- [x] 3.2 Tests: visibilidad por rol/estado/fecha; click Confirmar no abre el detalle; Cancelar/Llamar/Finalizar siguen sin efecto

## 4. Frontend — popup de detalle

- [x] 4.1 En `TurnoFormDialog`, mostrar "Confirmar turno" solo si aplica; mismo flujo de API + toast/error; overlay de procesamiento; éxito cierra el popup y llama `onSaved`; error no cierra
- [x] 4.2 Tests: visibilidad en detalle (hoy/no hoy/no PROGRAMADO/alta/médico); éxito cierra; error deja el popup abierto

## 5. Cierre

- [x] 5.1 Invalidar `['turnos']` y `['turnos-dia']` tras confirmar desde Lista (mismo criterio que `handleSaved` del popup)
- [x] 5.2 Verificar que la card del modo Día no gana un control de confirmar
