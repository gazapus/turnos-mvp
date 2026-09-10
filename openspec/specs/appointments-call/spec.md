## Purpose

Llamado de turno a sala de espera (CU 9): el Médico registra avisos sobre un turno propio `CONFIRMADO` del día civil de clínica, sin cambiar el estado, desde Lista o popup, con contrato `POST /api/turnos/:id/llamar` y flag `llamado` en listado y detalle.

## Requirements

### Requirement: Llamado de turno CONFIRMADO el día de hoy

El sistema SHALL permitir a un Médico llamar un turno propio en estado `CONFIRMADO` cuya fecha civil en `America/Argentina/Buenos_Aires` sea el día de hoy. El llamado MUST ejecutarse con un solo click, sin dialog de confirmación adicional. MUST NOT cambiar el `estado` del turno: permanece `CONFIRMADO`. El médico MUST poder llamar el mismo turno más de una vez mientras siga `CONFIRMADO`. MUST NOT exigir que la hora actual coincida con el horario del slot. Recepcionista y Administrador MUST NOT llamar. Un turno que no está `CONFIRMADO` MUST NOT poder llamarse.

#### Scenario: Llamado exitoso el día del turno

- **WHEN** un Médico llama un turno propio `CONFIRMADO` cuya fecha civil de clínica es hoy y tiene consultorio asignado
- **THEN** el sistema registra un llamado, el estado del turno sigue `CONFIRMADO` y el aviso llega a la sala de espera

#### Scenario: Segundo llamado del mismo turno

- **WHEN** el mismo Médico llama de nuevo un turno propio que ya había llamado y sigue `CONFIRMADO` de hoy
- **THEN** el sistema registra un llamado nuevo y la sala de espera muestra ese aviso como el más reciente

#### Scenario: Rechazo si no es el día de hoy

- **WHEN** se intenta llamar un turno `CONFIRMADO` cuya fecha civil de clínica es anterior o posterior a hoy
- **THEN** el sistema no registra el llamado y la sala de espera no cambia

#### Scenario: Rechazo si no está confirmado

- **WHEN** se intenta llamar un turno en estado distinto de `CONFIRMADO`
- **THEN** el sistema no registra el llamado

#### Scenario: Recepcionista no llama

- **WHEN** un usuario con rol Recepcionista o Administrador intenta llamar un turno
- **THEN** el sistema no registra el llamado

### Requirement: Contrato POST /api/turnos/:id/llamar

El sistema SHALL exponer `POST /api/turnos/:id/llamar` (body vacío) restringido al Médico dueño del turno. En éxito MUST persistir un `LlamadoTurno` con snapshot de nombre y apellido del paciente y número de consultorio asignado al médico del turno, emitir el evento de sala de espera, y responder 200 con el detalle del turno (`estado` `CONFIRMADO`, `llamado` verdadero). Recepcionista y Administrador MUST recibir 403. No autenticado MUST recibir 401. Turno inexistente o de otro médico MUST responder 404. Si el turno no está `CONFIRMADO`, su fecha civil no es hoy, o el médico del turno no tiene consultorio asignado, MUST responder 400 con un `message` legible y MUST NOT emitir evento ni insertar llamado.

#### Scenario: Éxito del médico dueño

- **WHEN** el Médico dueño envía `POST /api/turnos/:id/llamar` sobre un `CONFIRMADO` de hoy con consultorio asignado
- **THEN** la respuesta es 200, existe un `LlamadoTurno` nuevo y el detalle trae `llamado` verdadero

#### Scenario: Médico ajeno recibe 404

- **WHEN** un Médico envía `POST /api/turnos/:id/llamar` sobre el turno de otro médico
- **THEN** el sistema responde 404 y no registra llamado

#### Scenario: Recepcionista recibe 403

- **WHEN** un Recepcionista envía `POST /api/turnos/:id/llamar`
- **THEN** el sistema responde 403 y no registra llamado

#### Scenario: Sin consultorio es 400

- **WHEN** el Médico dueño llama un `CONFIRMADO` de hoy y no tiene consultorio asignado
- **THEN** el sistema responde 400, no inserta llamado y no emite evento a la sala de espera

#### Scenario: Ya atendido es 400

- **WHEN** un Médico envía `POST /api/turnos/:id/llamar` sobre un turno `ATENDIDO`
- **THEN** el sistema responde 400 y no registra llamado

### Requirement: Superficies de llamar y visibilidad del control

El sistema SHALL ofrecer llamar desde el ícono Llamar (teléfono) de la columna Acciones del modo Lista y desde el botón "Llamar paciente" del popup de detalle. El modo Día MUST NOT mostrar un control de llamar sobre la card; en esa vista el llamado MUST hacerse desde el popup. El control MUST ocultarse (no deshabilitarse) cuando el rol no es Médico, cuando el estado no es `CONFIRMADO`, o cuando la fecha civil del turno no es hoy. Tras finalizar el turno a `ATENDIDO`, el botón MUST NOT volver a mostrarse.

#### Scenario: Lista muestra Llamar solo si aplica

- **WHEN** un Médico ve en la Lista un turno propio `CONFIRMADO` de hoy
- **THEN** se muestra el ícono Llamar con tooltip "Llamar al paciente"

#### Scenario: Lista oculta Llamar si está programado

- **WHEN** un Médico ve en la Lista un turno `PROGRAMADO`
- **THEN** no se muestra el ícono Llamar

#### Scenario: Lista oculta Llamar si no es hoy

- **WHEN** un Médico ve en la Lista un turno `CONFIRMADO` cuya fecha civil no es hoy
- **THEN** no se muestra el ícono Llamar

#### Scenario: Popup muestra Llamar paciente solo si aplica

- **WHEN** un Médico abre el detalle de un turno propio `CONFIRMADO` de hoy
- **THEN** se muestra el botón "Llamar paciente"

#### Scenario: Popup oculta Llamar fuera de regla

- **WHEN** un Médico abre el detalle de un turno `PROGRAMADO` o `ATENDIDO`, o de un `CONFIRMADO` que no es de hoy
- **THEN** no se muestra el botón "Llamar paciente"

#### Scenario: Card del modo Día sin llamar

- **WHEN** un Médico ve un turno `CONFIRMADO` de hoy en la grilla Día
- **THEN** la card no muestra un control de llamar

### Requirement: Feedback y refresh tras llamar

Al llamar desde Lista o popup el sistema SHALL llamar `POST /api/turnos/:id/llamar`. En éxito MUST mostrar el toast de éxito con el mensaje "Paciente llamado correctamente", MUST NOT cerrar el popup de detalle si estaba abierto, y MUST refrescar los turnos de la vista activa para que Finalizar pueda aparecer. En error MUST mostrar el dialog de error genérico con un mensaje amigable y el detalle del backend, MUST NOT cerrar el popup, y MUST NOT asumir que se registró el llamado. MUST NOT pedir una confirmación extra antes de disparar la petición.

#### Scenario: Éxito desde el listado

- **WHEN** el Médico activa Llamar en la Lista y el backend responde 200
- **THEN** se muestra el toast "Paciente llamado correctamente", no se abre el popup de detalle, y el listado se refresca

#### Scenario: Éxito desde el popup deja el detalle abierto

- **WHEN** el Médico activa "Llamar paciente" en el detalle y el backend responde 200
- **THEN** se muestra el toast "Paciente llamado correctamente", el popup permanece abierto y Finalizar turno pasa a estar visible

#### Scenario: Error no cierra el popup

- **WHEN** "Llamar paciente" falla con un error HTTP
- **THEN** se muestra el dialog de error genérico, el popup permanece abierto y no se asume un llamado nuevo

### Requirement: Flag llamado en listado y detalle

El sistema SHALL incluir en `GET /api/turnos` y en `GET /api/turnos/:id` el campo booleano `llamado`, verdadero si existe al menos un `LlamadoTurno` de ese turno y falso en caso contrario.

#### Scenario: Listado marca llamado tras el primer aviso

- **WHEN** un Médico lista un turno que tiene al menos un `LlamadoTurno`
- **THEN** el ítem trae `llamado` verdadero

#### Scenario: Detalle sin llamados

- **WHEN** un usuario autenticado pide el detalle de un turno `CONFIRMADO` sin filas de llamado
- **THEN** la respuesta trae `llamado` falso
