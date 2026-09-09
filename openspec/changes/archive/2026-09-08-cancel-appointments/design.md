## Context

La Agenda lista turnos (Lista y Día) y permite crear/editar el detalle. Confirmar ya es un comando real (`PATCH /api/turnos/:id/confirmar`). Cancelar sigue stub: ícono X siempre visible para recepción/admin en la lista, y el popup de detalle dice **"Anular turno"** sin efecto ni filtro de estado.

`PATCH /api/turnos/:id` edita campos de un `PROGRAMADO` y no cambia `estado`. El enum Prisma ya incluye `CANCELADO`. El modelo ya tiene `motivoCancelacion` (string opcional); el DTO de detalle no lo expone. Feedback (`toastSuccess` / `showError`) e invalidación de `['turnos']` / `['turnos-dia']` ya existen.

Vocabulario de producto unificado a **Cancelar** (no Anular): UI, toast, endpoint `/cancelar`. El estado persistido sigue siendo `CANCELADO`.

Actores: Recepcionista y Administrador cancelan; el Médico no.

## Goals / Non-Goals

**Goals:**

- Transición `PROGRAMADO | CONFIRMADO → CANCELADO` sin importar la fecha civil del turno.
- Dialog de confirmación warning (mismo shell que el error) con Aceptar, Cancelar y textarea de motivo opcional.
- Ocultar Cancelar (no deshabilitar) si el rol no aplica o el estado es `ATENDIDO`, `AUSENTE` o `CANCELADO`.
- Backend que rechace lo que la UI oculta (rol, estado). Fecha no se valida.
- Tras éxito: toast "Turno cancelado correctamente", cerrar el popup si estaba abierto, refrescar Lista o Día.
- En el detalle de un `CANCELADO`, mostrar el motivo o "Sin especificar".
- Modo Día: sin ícono de cancelar en la card; se cancela desde el popup.
- Copy del popup de detalle: "Cancelar turno" (deja de decir Anular).

**Non-Goals:**

- Llamar, finalizar, ausente, atendido.
- Ícono de cancelar sobre la card del modo Día.
- Columna o tooltip de motivo en el listado / modo Día.
- Notificar mail o WhatsApp al cancelar.
- Reutilizar `PATCH /api/turnos/:id` de edición para cambiar estado.
- Modo Semana/Mes.
- Migración Prisma (el campo y el enum ya existen).

## Decisions

### 1. Comando dedicado `PATCH /api/turnos/:id/cancelar`

El PATCH de edición valida `PROGRAMADO` + fecha ≥ hoy y actualiza paciente/médico/horario. Meter `estado` ahí mezcla dos contratos. Confirmar ya sentó el patrón de comando.

| Método | Ruta | Body | Quién | 200 |
| --- | --- | --- | --- | --- |
| `PATCH` | `/api/turnos/:id/cancelar` | `{ motivo?: string }` | ADMIN, RECEPCIONISTA | `TurnoDetalleDto` con `estado: CANCELADO` y `motivoCancelacion` |

Médico: 403. No autenticado: 401. No existe: 404. Estado no cancelable: 400 con `message` legible.

`motivo` ausente, `null`, vacío o solo espacios → `motivoCancelacion = null`. Máximo 500 caracteres (`MaxLength` en el DTO; el schema Prisma no cambia).

Alternativa descartada: `PATCH /api/turnos/:id` con `{ estado: "CANCELADO" }` — misma razón que en confirmar.

### 2. Fecha irrelevante; solo estado

A diferencia de confirmar (día civil de hoy) y de Guardar (fecha ≥ hoy), cancelar **no mira la fecha**. Un `PROGRAMADO` o `CONFIRMADO` de ayer, hoy o mañana se puede cancelar.

Estados origen: `PROGRAMADO`, `CONFIRMADO`.  
Estados que no cancelan: `ATENDIDO`, `AUSENTE`, `CANCELADO`.

### 3. Visibilidad: ocultar, no deshabilitar

Cancelar se renderiza solo si:

1. Rol `ADMIN` o `RECEPCIONISTA`
2. `estado === PROGRAMADO` o `estado === CONFIRMADO`

Si no, el control no existe. Alta: nunca Cancelar. Médico: nunca. Tras un cancelado exitoso, al refrescar o reabrir el detalle, el botón ya no está.

Helper compartido `canCancelarTurno({ rol, estado })` (sin fecha), usado por lista y popup.

Modo Día: la card no gana un ícono de cancelar.

### 4. Dialog warning en `FeedbackProvider`, no un modal suelto

El dialog de error y el de confirmación son el **mismo shell** (overlay, caja, z-index sobre el popup de turno, no se cierra por click en overlay).

| Variante | Visual | Acciones | Extra |
| --- | --- | --- | --- |
| error (`showError`) | danger | Cerrar | — |
| warning (`showConfirm`) | warning (ámbar) | Cancelar / Aceptar | textarea opcional genérico (label + maxLength) |

API del confirm: título, detalle opcional, config del textarea. Devuelve `{ accepted, text }`. Cancelar (botón) → `accepted: false`, no hay PATCH. Aceptar cierra el warning y el caller dispara el PATCH.

El textarea no es “motivo de turno” dentro del provider: es texto libre opcional. `useCancelarTurno` pasa título **"¿Cancelar este turno?"**, label **"Motivo (opcional)"**, `maxLength: 500`.

El dialog de error actual no usa color danger; este change lo marca como variante danger para que el warning contraste, como pidió producto.

Choque de copy (acción "Cancelar turno" vs botón "Cancelar" del aviso): se acepta; el título del dialog desambigua.

### 5. Un confirm, luego request, sin optimistic UI

Flujo:

1. Click Cancelar (lista o popup) → `stopPropagation` en lista → `showConfirm`.
2. Si el usuario cierra con Cancelar: nada.
3. Si Aceptar: warning se cierra; botón/overlay inerte; `PATCH`.
4. Éxito: toast "Turno cancelado correctamente"; si el origen es el popup, `onClose()`; invalidar `['turnos']` y `['turnos-dia']`.
5. Error: `showError("No se pudo cancelar el turno", message)`; el popup de turno permanece abierto; la lista no se asume actualizada.

Alternativa descartada: optimistic update — un 400 de "ya cancelado" dejaría la UI mentirosa.

### 6. Update atómico por estado

```
UPDATE turno SET estado = CANCELADO, motivo_cancelacion = :motivo
 WHERE id = :id AND estado IN (PROGRAMADO, CONFIRMADO)
```

Si `count === 0`, se distingue 404 vs 400 con un `findUnique` posterior. Dos recepcionistas a la vez: uno gana, el otro recibe 400.

Reutilizar `assertCanWrite` (médico 403).

### 7. Motivo en el detalle `CANCELADO`

`GET /api/turnos/:id` y el 200 de cancelar incluyen `motivoCancelacion: string | null`.

En `TurnoFormDialog`, solo si `estado === CANCELADO`, un bloque de solo lectura al pie de "Información del turno":

- Label: **Motivo de cancelación**
- Valor: el texto persistido, o **Sin especificar** si es `null` o vacío

Visible también para el médico (el detalle ya es lectura). No se muestra en alta ni en otros estados. Lista y Día no muestran el motivo.

### 8. Wiring frontend

- Cliente: `cancelarTurno(id, motivo?)` → `PATCH /api/turnos/:id/cancelar`.
- Lista: `TurnoAcciones` usa `canCancelarTurno`; click abre confirm y luego el cliente; `onConfirmado` (o callback equivalente) invalida queries.
- Popup: botón "Cancelar turno"; mismo hook; overlay mientras vuela; éxito cierra + `onSaved`.

## Risks / Trade-offs

- **[Doble click / dos pestañas]** → Warning de un solo shot; botón/overlay inerte durante el PATCH; update condicionado a `PROGRAMADO | CONFIRMADO`.
- **[Cancelar un turno pasado que podría ser AUSENTE]** → Producto lo pidió: solo se mira estado. El job de ausentes sigue fuera de alcance.
- **[Textarea en el provider genérico]** → Se parametriza (label, maxLength) para no acoplar `ui-feedback` al dominio de turnos.
- **[GET detalle sin motivo hasta este change]** → Clientes viejos ignoran el campo nuevo; no es breaking.

## Migration Plan

Endpoint y campo de respuesta aditivos. Sin migración de schema. Rollback: retirar el endpoint, revertir visibilidad/copy de botones y el campo en el DTO de detalle.

## Open Questions

Ninguna: resueltas en explore (vocabulario Cancelar; motivo opcional con tope 500; toast espejo de confirmar; motivo visible en detalle o "Sin especificar"; sin ícono en la card del día).
