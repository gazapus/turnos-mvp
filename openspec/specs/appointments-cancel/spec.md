## Purpose

Cancelación de turno (CU 5): transición `PROGRAMADO | CONFIRMADO → CANCELADO` sin importar la fecha civil, desde el listado o el popup de detalle, con contrato `PATCH /api/turnos/:id/cancelar`, motivo opcional, dialog de confirmación warning, visibilidad del control, feedback y motivo en el detalle cancelado.

## Requirements

### Requirement: Transición PROGRAMADO o CONFIRMADO a CANCELADO

El sistema SHALL permitir a un Recepcionista o Administrador cancelar un turno en estado `PROGRAMADO` o `CONFIRMADO` independientemente de su fecha civil. MUST NOT permitir cancelar un turno en estado `ATENDIDO`, `AUSENTE` o `CANCELADO`. Un usuario con rol Médico MUST NOT poder cancelar. El motivo de cancelación es opcional: ausente, vacío o solo espacios MUST persistirse como nulo.

#### Scenario: Cancelación exitosa de un programado de cualquier fecha

- **WHEN** un Recepcionista o Administrador cancela un turno `PROGRAMADO` cuya fecha civil no es hoy
- **THEN** el estado del turno pasa a `CANCELADO`

#### Scenario: Cancelación exitosa de un confirmado

- **WHEN** un Recepcionista o Administrador cancela un turno `CONFIRMADO`
- **THEN** el estado del turno pasa a `CANCELADO`

#### Scenario: Rechazo si ya está atendido, ausente o cancelado

- **WHEN** se intenta cancelar un turno en estado `ATENDIDO`, `AUSENTE` o `CANCELADO`
- **THEN** el sistema no cambia el estado

#### Scenario: Médico no cancela

- **WHEN** un usuario con rol Médico intenta cancelar un turno
- **THEN** el sistema no cambia el estado

#### Scenario: Motivo opcional vacío queda nulo

- **WHEN** se cancela un turno sin ingresar motivo o solo con espacios
- **THEN** el estado pasa a `CANCELADO` y `motivoCancelacion` queda nulo

#### Scenario: Motivo informado se persiste

- **WHEN** se cancela un turno con un motivo de hasta 500 caracteres
- **THEN** el estado pasa a `CANCELADO` y el detalle incluye ese motivo

### Requirement: Contrato PATCH /api/turnos/:id/cancelar

El sistema SHALL exponer `PATCH /api/turnos/:id/cancelar` con body opcional `{ motivo?: string }` (máximo 500 caracteres) restringido a Recepcionista y Administrador. En éxito MUST responder 200 con el detalle del turno en estado `CANCELADO` y `motivoCancelacion`. Médico MUST recibir 403. No autenticado MUST recibir 401. Turno inexistente MUST responder 404. Si el turno no está `PROGRAMADO` ni `CONFIRMADO`, MUST responder 400 con un `message` legible. La actualización MUST ser condicional a esos estados para que una segunda cancelación concurrente no pise un estado posterior. MUST NOT validar la fecha civil del turno.

#### Scenario: Éxito autenticado con rol de escritura

- **WHEN** un Recepcionista envía `PATCH /api/turnos/:id/cancelar` sobre un `PROGRAMADO` o `CONFIRMADO`
- **THEN** la respuesta es 200 y el detalle trae `estado` `CANCELADO`

#### Scenario: Médico recibe 403

- **WHEN** un usuario con rol Médico envía `PATCH /api/turnos/:id/cancelar`
- **THEN** el sistema responde 403 y el turno no cambia

#### Scenario: Ya cancelado es 400

- **WHEN** un Recepcionista envía `PATCH /api/turnos/:id/cancelar` sobre un turno `CANCELADO`
- **THEN** el sistema responde 400

#### Scenario: Atendido es 400

- **WHEN** un Recepcionista envía `PATCH /api/turnos/:id/cancelar` sobre un turno `ATENDIDO`
- **THEN** el sistema responde 400

#### Scenario: Fecha pasada no es 400

- **WHEN** un Recepcionista envía `PATCH /api/turnos/:id/cancelar` sobre un `PROGRAMADO` cuya fecha civil es anterior a hoy
- **THEN** la respuesta es 200 y el estado pasa a `CANCELADO`

### Requirement: Superficies de cancelar y visibilidad del control

El sistema SHALL ofrecer cancelar desde el ícono Cancelar (X) de la columna Acciones del modo Lista y desde el botón "Cancelar turno" del popup de detalle. El modo Día MUST NOT mostrar un control de cancelar sobre la card; en esa vista la cancelación MUST hacerse desde el popup. El control MUST ocultarse (no deshabilitarse) cuando el rol no es Recepcionista ni Administrador, o cuando el estado no es `PROGRAMADO` ni `CONFIRMADO`. Tras cancelar, el botón MUST NOT volver a mostrarse para ese turno. El alta MUST NOT mostrar Cancelar.

#### Scenario: Lista muestra Cancelar en programado o confirmado

- **WHEN** un Recepcionista ve en la Lista un turno `PROGRAMADO` o `CONFIRMADO` de cualquier fecha
- **THEN** se muestra el ícono Cancelar con tooltip "Cancelar turno"

#### Scenario: Lista oculta Cancelar si el estado no aplica

- **WHEN** un Recepcionista ve en la Lista un turno `ATENDIDO`, `AUSENTE` o `CANCELADO`
- **THEN** no se muestra el ícono Cancelar

#### Scenario: Popup muestra Cancelar solo si aplica

- **WHEN** un Administrador abre el detalle de un turno `PROGRAMADO` o `CONFIRMADO`
- **THEN** se muestra el botón "Cancelar turno"

#### Scenario: Popup oculta Cancelar fuera de regla

- **WHEN** un Recepcionista abre el detalle de un turno `ATENDIDO`, `AUSENTE` o `CANCELADO`
- **THEN** no se muestra el botón "Cancelar turno"

#### Scenario: Médico no ve Cancelar en el popup

- **WHEN** un usuario con rol Médico abre el detalle
- **THEN** no se muestra el botón "Cancelar turno"

#### Scenario: Card del modo Día sin cancelar

- **WHEN** un Recepcionista ve un turno `PROGRAMADO` en la grilla Día
- **THEN** la card no muestra un control de cancelar

### Requirement: Dialog de confirmación antes de cancelar

Al activar Cancelar desde Lista o popup el sistema SHALL abrir el dialog de confirmación warning de `ui-feedback` con título "¿Cancelar este turno?", botones Aceptar y Cancelar, y un textarea de motivo opcional con label "Motivo (opcional)". MUST NOT disparar el PATCH hasta que el usuario active Aceptar. Si el usuario activa Cancelar en el dialog, MUST cerrarse sin cambiar el turno y MUST NOT llamar al backend.

#### Scenario: Cancelar en el dialog no cambia nada

- **WHEN** el usuario activa Cancelar turno y en el dialog warning elige Cancelar
- **THEN** el dialog se cierra, el turno no cambia y no hay petición al backend

#### Scenario: Aceptar dispara la cancelación

- **WHEN** el usuario activa Cancelar turno y en el dialog warning elige Aceptar
- **THEN** el sistema llama `PATCH /api/turnos/:id/cancelar` con el motivo ingresado o sin motivo si el textarea está vacío

### Requirement: Feedback y refresh tras cancelar

En éxito el sistema MUST mostrar el toast de éxito con el mensaje "Turno cancelado correctamente", MUST cerrar el popup de detalle si estaba abierto, y MUST refrescar los turnos de la vista activa (listado o modo Día). En error MUST mostrar el dialog de error genérico con el mensaje amigable "No se pudo cancelar el turno" y el detalle del backend, MUST NOT cerrar el popup, y MUST NOT asumir que el estado cambió.

#### Scenario: Éxito desde el listado

- **WHEN** el Recepcionista acepta cancelar en la Lista y el backend responde 200
- **THEN** se muestra el toast "Turno cancelado correctamente", no se abre el popup de detalle, y el listado se refresca con el turno en estado Cancelado

#### Scenario: Éxito desde el popup

- **WHEN** el Recepcionista acepta "Cancelar turno" en el detalle y el backend responde 200
- **THEN** se muestra el toast "Turno cancelado correctamente", el popup se cierra, y la vista activa (Lista o Día) se refresca

#### Scenario: Error no cierra el popup

- **WHEN** cancelar desde el detalle falla con un error HTTP
- **THEN** se muestra el dialog de error genérico, el popup permanece abierto y el estado del turno no cambia en la UI

### Requirement: Motivo visible en el detalle cancelado

Cuando el popup de detalle muestra un turno en estado `CANCELADO`, el sistema SHALL incluir en la sección "Información del turno" un bloque de solo lectura "Motivo de cancelación". Si `motivoCancelacion` tiene texto, MUST mostrarse ese texto. Si es nulo o vacío, MUST mostrar "Sin especificar". MUST NOT mostrar ese bloque en alta ni cuando el estado no es `CANCELADO`. `GET /api/turnos/:id` MUST incluir `motivoCancelacion`.

#### Scenario: Motivo persistido se lee en el detalle

- **WHEN** un usuario abre el detalle de un turno `CANCELADO` con motivo "Paciente reprogramó"
- **THEN** se muestra el label "Motivo de cancelación" y el texto "Paciente reprogramó"

#### Scenario: Sin motivo muestra Sin especificar

- **WHEN** un usuario abre el detalle de un turno `CANCELADO` sin motivo
- **THEN** se muestra "Motivo de cancelación" y el texto "Sin especificar"

#### Scenario: Otros estados no muestran el bloque

- **WHEN** un usuario abre el detalle de un turno que no está `CANCELADO`
- **THEN** no se muestra el bloque "Motivo de cancelación"
