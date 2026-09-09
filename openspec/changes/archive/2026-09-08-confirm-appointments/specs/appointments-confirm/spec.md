## ADDED Requirements

### Requirement: Transición PROGRAMADO a CONFIRMADO el día del turno

El sistema SHALL permitir a un Recepcionista o Administrador confirmar un turno en estado `PROGRAMADO` cuya fecha civil en `America/Argentina/Buenos_Aires` sea el día de hoy. La confirmación MUST ejecutarse con un solo click, sin dialog de confirmación adicional. MUST NOT exigir que la hora actual coincida con el horario del slot (se puede confirmar antes o después de la hora de inicio, el mismo día). Un turno que no está `PROGRAMADO` MUST NOT poder confirmarse.

#### Scenario: Confirmación exitosa el día del turno

- **WHEN** un Recepcionista o Administrador confirma un turno `PROGRAMADO` cuya fecha civil de clínica es hoy
- **THEN** el estado del turno pasa a `CONFIRMADO`

#### Scenario: Rechazo si no es el día de hoy

- **WHEN** se intenta confirmar un turno `PROGRAMADO` cuya fecha civil de clínica es anterior o posterior a hoy
- **THEN** el sistema no cambia el estado

#### Scenario: Rechazo si ya no está programado

- **WHEN** se intenta confirmar un turno en estado distinto de `PROGRAMADO`
- **THEN** el sistema no cambia el estado

#### Scenario: Médico no confirma

- **WHEN** un usuario con rol Médico intenta confirmar un turno
- **THEN** el sistema no cambia el estado

### Requirement: Contrato PATCH /api/turnos/:id/confirmar

El sistema SHALL exponer `PATCH /api/turnos/:id/confirmar` (body vacío) restringido a Recepcionista y Administrador. En éxito MUST responder 200 con el detalle del turno en estado `CONFIRMADO`. Médico MUST recibir 403. No autenticado MUST recibir 401. Turno inexistente MUST responder 404. Si el turno no está `PROGRAMADO` o su fecha civil de clínica no es hoy, MUST responder 400 con un `message` legible. La actualización MUST ser condicional al estado `PROGRAMADO` para que una segunda confirmación concurrente no pise un estado posterior.

#### Scenario: Éxito autenticado con rol de escritura

- **WHEN** un Recepcionista envía `PATCH /api/turnos/:id/confirmar` sobre un `PROGRAMADO` de hoy
- **THEN** la respuesta es 200 y el detalle trae `estado` `CONFIRMADO`

#### Scenario: Médico recibe 403

- **WHEN** un usuario con rol Médico envía `PATCH /api/turnos/:id/confirmar`
- **THEN** el sistema responde 403 y el turno no cambia

#### Scenario: Día distinto es 400

- **WHEN** un Recepcionista envía `PATCH /api/turnos/:id/confirmar` para un `PROGRAMADO` de mañana
- **THEN** el sistema responde 400 y el turno permanece `PROGRAMADO`

#### Scenario: Ya confirmado es 400

- **WHEN** un Recepcionista envía `PATCH /api/turnos/:id/confirmar` sobre un turno `CONFIRMADO`
- **THEN** el sistema responde 400

### Requirement: Superficies de confirmar y visibilidad del control

El sistema SHALL ofrecer confirmar desde el ícono Confirmar de la columna Acciones del modo Lista y desde el botón "Confirmar turno" del popup de detalle. El modo Día MUST NOT mostrar un control de confirmar sobre la card; en esa vista la confirmación MUST hacerse desde el popup. El control MUST ocultarse (no deshabilitarse) cuando el rol no es Recepcionista ni Administrador, cuando el estado no es `PROGRAMADO`, o cuando la fecha civil del turno no es hoy. Tras confirmar, el botón MUST NOT volver a mostrarse para ese turno.

#### Scenario: Lista muestra Confirmar solo si aplica

- **WHEN** un Recepcionista ve en la Lista un turno `PROGRAMADO` de hoy
- **THEN** se muestra el ícono Confirmar con tooltip "Confirmar paciente"

#### Scenario: Lista oculta Confirmar en un día futuro

- **WHEN** un Recepcionista ve en la Lista un turno `PROGRAMADO` de una fecha distinta a hoy
- **THEN** no se muestra el ícono Confirmar y sí se muestra Cancelar

#### Scenario: Lista oculta Confirmar si ya está confirmado

- **WHEN** un Recepcionista ve en la Lista un turno `CONFIRMADO` de hoy
- **THEN** no se muestra el ícono Confirmar

#### Scenario: Popup muestra Confirmar solo si aplica

- **WHEN** un Administrador abre el detalle de un turno `PROGRAMADO` de hoy
- **THEN** se muestra el botón "Confirmar turno"

#### Scenario: Popup oculta Confirmar fuera de regla

- **WHEN** un Recepcionista abre el detalle de un turno `PROGRAMADO` de mañana o de un turno que no está `PROGRAMADO`
- **THEN** no se muestra el botón "Confirmar turno"

#### Scenario: Card del modo Día sin check

- **WHEN** un Recepcionista ve un turno `PROGRAMADO` de hoy en la grilla Día
- **THEN** la card no muestra un control de confirmar

### Requirement: Feedback y refresh tras confirmar

Al confirmar desde Lista o popup el sistema SHALL llamar `PATCH /api/turnos/:id/confirmar`. En éxito MUST mostrar el toast de éxito con el mensaje "Turno confirmado correctamente", MUST cerrar el popup de detalle si estaba abierto, y MUST refrescar los turnos de la vista activa (listado o modo Día) para que el estado visible coincida. En error MUST mostrar el dialog de error genérico con un mensaje amigable y el detalle del backend, MUST NOT cerrar el popup, y MUST NOT asumir que el estado cambió. MUST NOT pedir una confirmación extra antes de disparar la petición.

#### Scenario: Éxito desde el listado

- **WHEN** el Recepcionista activa Confirmar en la Lista y el backend responde 200
- **THEN** se muestra el toast "Turno confirmado correctamente", no se abre el popup de detalle, y el listado se refresca con el turno en estado Confirmado

#### Scenario: Éxito desde el popup

- **WHEN** el Recepcionista activa "Confirmar turno" en el detalle y el backend responde 200
- **THEN** se muestra el toast "Turno confirmado correctamente", el popup se cierra, y la vista activa (Lista o Día) se refresca

#### Scenario: Error no cierra el popup

- **WHEN** "Confirmar turno" falla con un error HTTP
- **THEN** se muestra el dialog de error genérico, el popup permanece abierto y el estado del turno no cambia en la UI
