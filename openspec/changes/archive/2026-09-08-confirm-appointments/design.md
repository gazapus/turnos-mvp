## Context

La Agenda ya lista turnos (Lista y Día) y permite crear/editar el detalle. Los controles Confirmar del listado (`TurnoAcciones`) y del popup (`TurnoFormDialog`) no tienen handler. `PATCH /api/turnos/:id` edita campos de un `PROGRAMADO` y no cambia `estado`. El enum Prisma ya incluye `CONFIRMADO`. Feedback (`toastSuccess` / `showError`) e invalidación de `['turnos']` / `['turnos-dia']` ya existen tras Guardar.

Zona horaria única: `America/Argentina/Buenos_Aires` (`CLINIC_TIMEZONE`), con `formatClinicDate` / `todayYmd` en API y web.

Actores: Recepcionista y Administrador confirman; el Médico no.

## Goals / Non-Goals

**Goals:**

- Transición `PROGRAMADO → CONFIRMADO` el día civil de clínica del turno, sin importar la hora del slot.
- Un click: Lista (ícono) o popup de detalle; sin dialog de confirmación extra.
- Ocultar Confirmar (no deshabilitar) si no aplica.
- Backend que rechace lo que la UI oculta (rol, estado, día).
- Tras éxito: toast "Turno confirmado correctamente", cerrar el popup si estaba abierto, refrescar Lista o Día.
- Modo Día: sin check en la card; se confirma desde el popup.

**Non-Goals:**

- Anular, llamar, finalizar, ausente, atendido.
- Check de confirmar sobre la card del modo Día.
- Confirmar turnos de otro día (pasado o futuro).
- Reutilizar `PATCH /api/turnos/:id` de edición para cambiar estado.
- Modo Semana/Mes.
- Confirmación extra tipo "¿estás seguro?".

## Decisions

### 1. Comando dedicado `PATCH /api/turnos/:id/confirmar`

El PATCH de edición valida `PROGRAMADO` + fecha ≥ hoy y actualiza paciente/médico/horario. Meter `estado` ahí mezcla dos contratos.

| Método | Ruta | Body | Quién | 200 |
| --- | --- | --- | --- | --- |
| `PATCH` | `/api/turnos/:id/confirmar` | vacío | ADMIN, RECEPCIONISTA | `TurnoDetalleDto` con `estado: CONFIRMADO` |

Médico: 403. No autenticado: 401. No existe (o médico consultando uno ajeno, si llegara a llamarlo): 404.

Alternativa descartada: `PATCH /api/turnos/:id` con `{ estado: "CONFIRMADO" }` — choca con el upsert de campos y abre un state-machine genérico que este change no necesita. Anular puede ser `/cancelar` en un change posterior.

### 2. Día civil de clínica, no la hora del slot

"Hoy" = `formatClinicDate(now) === fecha civil del turno` en `CLINIC_TIMEZONE`. Un turno de las 16:00 se puede confirmar a las 08:00 (llegó temprano) o a las 20:00 (llegó tarde).

La UI usa `todayYmd()` del cliente. El servidor **revalida** con su reloj; el browser no es fuente de verdad.

Confirmar es más estricto que Guardar: Guardar admite fecha ≥ hoy; confirmar exige **igual** a hoy.

### 3. Visibilidad: ocultar, no deshabilitar

Confirmar se renderiza solo si:

1. Rol `ADMIN` o `RECEPCIONISTA`
2. `estado === PROGRAMADO`
3. Fecha civil del turno === hoy en clínica

Si no, el control no existe. Tras un confirmado exitoso, al refrescar (lista/día) o al reabrir el detalle, el botón ya no está.

Lista: Cancelar sigue visible como stub. Popup: Anular y Llamar siguen stubs, Anular sigue visible para recepción/admin en detalle (sin validar estado). Alta: nunca Confirmar.

Modo Día: la card no gana un ícono de confirmar.

### 4. Un click, esperar respuesta, sin optimistic UI

No hay segundo dialog. El botón se deshabilita (o overlay de procesamiento del popup) mientras vuela el request, para no duplicar clicks.

Éxito:

1. Toast "Turno confirmado correctamente" (`FeedbackProvider`).
2. Si el origen es el popup: `onClose()` (el estado del dialog se destruye, igual que un alta exitosa). Distinto de Guardar en edición, que deja el popup abierto.
3. Invalidar `['turnos']` y `['turnos-dia']` (mismo `handleSaved` de `AgendaContent`).

Error: `showError` con mensaje amigable ("No se pudo confirmar el turno") + `message` del backend. El popup permanece abierto. La lista no se asume actualizada.

Alternativa descartada: optimistic update — un 400 de "ya confirmado" dejaría la UI mentirosa hasta el refetch.

### 5. Update atómico por estado

En el service, no leer-luego-escribir sin condición:

```
UPDATE turno SET estado = CONFIRMADO
 WHERE id = :id AND estado = PROGRAMADO
   AND fechaInicio ∈ [inicio, fin) del día civil de hoy
```

Si `count === 0`, se distingue 404 (no existe / fuera de alcance) vs 400 (estado o día inválidos) con un `findUnique` posterior. Dos recepcionistas que confirman a la vez: uno gana, el otro recibe 400.

Reutilizar `assertCanWrite` (médico 403).

### 6. Wiring frontend

- Cliente: `confirmarTurno(id)` en `turnos-client.ts` → `PATCH /api/turnos/:id/confirmar`.
- Lista: `TurnoAcciones` recibe `estado`, `fecha` y un `onConfirmar` (o llama al cliente y notifica al padre). `stopPropagation` se mantiene: no abre el detalle.
- Popup: el botón "Confirmar turno" llama al mismo cliente; overlay de procesamiento; éxito cierra + `onSaved`.
- Helper compartido de visibilidad (rol + estado + `fecha === todayYmd()`), usado por lista y dialog, para no duplicar la regla.

## Risks / Trade-offs

- **[Reloj del browser vs servidor]** → La UI puede ocultar/mostrar mal si el cliente tiene la fecha mal; el API manda. Error 400 + dialog.
- **[Doble click / dos pestañas]** → Botón inerte durante el request; update condicionado a `PROGRAMADO`.
- **[Confirmar a medianoche]** → Al cambiar el día civil de clínica, el botón desaparece y el API rechaza. Alineado al producto.
- **[Asimetría Anular]** → Anular sigue stub y visible sin filtrar por día/estado. Es alcance explícito, no un bug de este change.

## Migration Plan

Endpoint aditivo. Sin migración de schema. Rollback: retirar el endpoint y volver los botones a stub/visibilidad anterior.

## Open Questions

Ninguna: resueltas en explore (mismo día sin mirar hora; copy del toast; click directo; sin check en la card del modo Día).
