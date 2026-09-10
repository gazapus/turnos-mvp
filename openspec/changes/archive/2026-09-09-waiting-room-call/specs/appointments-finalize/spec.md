## ADDED Requirements

### Requirement: Transición CONFIRMADO a ATENDIDO tras un llamado

El sistema SHALL permitir a un Médico finalizar un turno propio en estado `CONFIRMADO` cuya fecha civil en `America/Argentina/Buenos_Aires` sea el día de hoy y que tenga al menos un llamado registrado. La finalización MUST ejecutarse con un solo click, sin dialog de confirmación adicional. MUST NOT exigir que la hora actual coincida con el horario del slot. Un turno sin llamados MUST NOT poder finalizarse. Un turno que no está `CONFIRMADO` MUST NOT poder finalizarse. Tras pasar a `ATENDIDO` MUST NOT poder llamarse ni finalizarse de nuevo.

#### Scenario: Finalización exitosa

- **WHEN** un Médico finaliza un turno propio `CONFIRMADO` de hoy que ya fue llamado
- **THEN** el estado del turno pasa a `ATENDIDO`

#### Scenario: Rechazo si nunca fue llamado

- **WHEN** se intenta finalizar un turno `CONFIRMADO` de hoy sin ningún `LlamadoTurno`
- **THEN** el sistema no cambia el estado

#### Scenario: Rechazo si no es el día de hoy

- **WHEN** se intenta finalizar un turno `CONFIRMADO` cuya fecha civil de clínica no es hoy
- **THEN** el sistema no cambia el estado

#### Scenario: Recepcionista no finaliza

- **WHEN** un usuario con rol Recepcionista o Administrador intenta finalizar un turno
- **THEN** el sistema no cambia el estado

### Requirement: Contrato PATCH /api/turnos/:id/finalizar

El sistema SHALL exponer `PATCH /api/turnos/:id/finalizar` (body vacío) restringido al Médico dueño del turno. En éxito MUST responder 200 con el detalle del turno en estado `ATENDIDO`. Recepcionista y Administrador MUST recibir 403. No autenticado MUST recibir 401. Turno inexistente o de otro médico MUST responder 404. Si el turno no está `CONFIRMADO`, su fecha civil no es hoy, o no tiene llamados, MUST responder 400 con un `message` legible. La actualización MUST ser condicional al estado `CONFIRMADO` para que una segunda finalización concurrente no pise un estado posterior.

#### Scenario: Éxito del médico dueño

- **WHEN** el Médico dueño envía `PATCH /api/turnos/:id/finalizar` sobre un `CONFIRMADO` de hoy con al menos un llamado
- **THEN** la respuesta es 200 y el detalle trae `estado` `ATENDIDO`

#### Scenario: Recepcionista recibe 403

- **WHEN** un Recepcionista envía `PATCH /api/turnos/:id/finalizar`
- **THEN** el sistema responde 403 y el turno no cambia

#### Scenario: Sin llamados es 400

- **WHEN** el Médico dueño envía `PATCH /api/turnos/:id/finalizar` sobre un `CONFIRMADO` de hoy sin llamados
- **THEN** el sistema responde 400 y el turno permanece `CONFIRMADO`

#### Scenario: Ya atendido es 400

- **WHEN** un Médico envía `PATCH /api/turnos/:id/finalizar` sobre un turno `ATENDIDO`
- **THEN** el sistema responde 400

### Requirement: Superficies de finalizar y visibilidad del control

El sistema SHALL ofrecer finalizar desde el ícono Finalizar (check verde) de la columna Acciones del modo Lista y desde el botón "Finalizar turno" del popup de detalle. El modo Día MUST NOT mostrar un control de finalizar sobre la card; en esa vista la finalización MUST hacerse desde el popup. El control MUST ocultarse (no deshabilitarse) cuando el rol no es Médico, cuando el estado no es `CONFIRMADO`, cuando la fecha civil del turno no es hoy, o cuando `llamado` es falso. Tras finalizar, el botón MUST NOT volver a mostrarse.

#### Scenario: Lista muestra Finalizar solo si aplica

- **WHEN** un Médico ve en la Lista un turno propio `CONFIRMADO` de hoy con `llamado` verdadero
- **THEN** se muestra el ícono Finalizar con tooltip "Finalizar turno"

#### Scenario: Lista oculta Finalizar hasta el primer llamado

- **WHEN** un Médico ve en la Lista un turno `CONFIRMADO` de hoy con `llamado` falso
- **THEN** no se muestra el ícono Finalizar y sí se muestra Llamar

#### Scenario: Popup muestra Finalizar turno solo si aplica

- **WHEN** un Médico abre el detalle de un turno propio `CONFIRMADO` de hoy con `llamado` verdadero
- **THEN** se muestra el botón "Finalizar turno"

#### Scenario: Popup oculta Finalizar si no hubo llamado

- **WHEN** un Médico abre el detalle de un turno `CONFIRMADO` de hoy que nunca fue llamado
- **THEN** se muestra "Llamar paciente" y no se muestra "Finalizar turno"

#### Scenario: Card del modo Día sin finalizar

- **WHEN** un Médico ve un turno `CONFIRMADO` de hoy en la grilla Día
- **THEN** la card no muestra un control de finalizar

### Requirement: Feedback y refresh tras finalizar

Al finalizar desde Lista o popup el sistema SHALL llamar `PATCH /api/turnos/:id/finalizar`. En éxito MUST mostrar el toast de éxito con el mensaje "Turno finalizado correctamente", MUST cerrar el popup de detalle si estaba abierto, y MUST refrescar los turnos de la vista activa. En error MUST mostrar el dialog de error genérico con un mensaje amigable y el detalle del backend, MUST NOT cerrar el popup, y MUST NOT asumir que el estado cambió. MUST NOT pedir una confirmación extra antes de disparar la petición.

#### Scenario: Éxito desde el listado

- **WHEN** el Médico activa Finalizar en la Lista y el backend responde 200
- **THEN** se muestra el toast "Turno finalizado correctamente", no se abre el popup de detalle, y el listado se refresca con el turno en estado Atendido

#### Scenario: Éxito desde el popup

- **WHEN** el Médico activa "Finalizar turno" en el detalle y el backend responde 200
- **THEN** se muestra el toast "Turno finalizado correctamente", el popup se cierra, y la vista activa se refresca

#### Scenario: Error no cierra el popup

- **WHEN** "Finalizar turno" falla con un error HTTP
- **THEN** se muestra el dialog de error genérico, el popup permanece abierto y el estado del turno no cambia en la UI
