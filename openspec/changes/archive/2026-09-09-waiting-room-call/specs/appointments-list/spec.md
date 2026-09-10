## MODIFIED Requirements

### Requirement: Botones de acción por rol

El sistema SHALL mostrar en la columna "Acciones" icon-buttons según el rol del usuario autenticado. Recepcionista y Administrador ven Confirmar (check) solo cuando el turno está `PROGRAMADO` y su fecha civil de clínica es hoy, y Cancelar (X roja) solo cuando el turno está `PROGRAMADO` o `CONFIRMADO` (cualquier fecha). Médico ve Llamar (teléfono) solo cuando el turno está `CONFIRMADO` y su fecha civil de clínica es hoy, y Finalizar (check verde) solo cuando además `llamado` es verdadero. Cada botón visible MUST mostrar un tooltip con su nombre de acción. Confirmar MUST ejecutar la transición de `appointments-confirm`. Cancelar MUST ejecutar la transición de `appointments-cancel`. Llamar MUST ejecutar el llamado de `appointments-call`. Finalizar MUST ejecutar la transición de `appointments-finalize`.

#### Scenario: Acciones para recepcionista o administrador en un programado de hoy

- **WHEN** un usuario con rol Recepcionista o Administrador visualiza una fila de turno `PROGRAMADO` con fecha civil de hoy
- **THEN** la columna de acciones muestra los botones Confirmar y Cancelar, con tooltips "Confirmar paciente" y "Cancelar turno" respectivamente

#### Scenario: Acciones para recepcionista sin Confirmar fuera de regla

- **WHEN** un usuario con rol Recepcionista o Administrador visualiza una fila `PROGRAMADO` cuya fecha civil no es hoy, o una fila `CONFIRMADO`
- **THEN** la columna de acciones muestra Cancelar y no muestra Confirmar

#### Scenario: Acciones para recepcionista sin Cancelar si el estado no aplica

- **WHEN** un usuario con rol Recepcionista o Administrador visualiza una fila `ATENDIDO`, `AUSENTE` o `CANCELADO`
- **THEN** la columna de acciones no muestra Cancelar ni Confirmar

#### Scenario: Acciones para médico en confirmado de hoy sin llamado

- **WHEN** un usuario con rol Médico visualiza una fila `CONFIRMADO` de hoy con `llamado` falso
- **THEN** la columna de acciones muestra Llamar con tooltip "Llamar al paciente" y no muestra Finalizar

#### Scenario: Acciones para médico en confirmado de hoy ya llamado

- **WHEN** un usuario con rol Médico visualiza una fila `CONFIRMADO` de hoy con `llamado` verdadero
- **THEN** la columna de acciones muestra Llamar y Finalizar, con tooltips "Llamar al paciente" y "Finalizar turno" respectivamente

#### Scenario: Acciones para médico ocultas si no aplica

- **WHEN** un usuario con rol Médico visualiza una fila `PROGRAMADO`, `ATENDIDO`, o `CONFIRMADO` cuya fecha civil no es hoy
- **THEN** la columna de acciones no muestra Llamar ni Finalizar

### Requirement: Contrato de backend para el listado de turnos

El sistema SHALL exponer `GET /api/turnos` protegido por sesión autenticada (cualquier rol), que acepta filtros por médico, especialidad, paciente y `soloPendientes`, un filtro opcional de fecha exacta, y paginación por cursor. La respuesta MUST incluir únicamente los campos necesarios para el listado: id, fecha, hora, hora de fin, datos mínimos de paciente (nombre, apellido), médico (nombre, apellido) y especialidad (nombre), estado, tipo y `llamado`. Las respuestas MUST no cachearse (sin encabezados de caché HTTP que permitan servir una respuesta obsoleta).

#### Scenario: Acceso sin sesión

- **WHEN** una solicitud a `GET /api/turnos` no incluye una sesión válida
- **THEN** el sistema responde con error de no autorizado y no devuelve turnos

#### Scenario: Respuesta con DTO mínimo

- **WHEN** un usuario autenticado consulta `GET /api/turnos`
- **THEN** cada turno de la respuesta expone únicamente id, fecha, hora, hora de fin, paciente (nombre y apellido), médico (nombre y apellido), especialidad (nombre), estado, tipo y `llamado`, sin exponer campos internos de la entidad

### Requirement: Click en fila abre el detalle de turno

El sistema SHALL abrir el popup de detalle al hacer click en una fila del modo Lista, para cualquier rol autenticado que pueda ver esa fila. El popup MUST ser el mismo de `appointments-form`, con título "Detalle de Turno" y carga abortable. El click en un botón de la columna Acciones MUST NOT abrir el popup. El click en Confirmar MUST ejecutar la confirmación de `appointments-confirm`. El click en Cancelar MUST ejecutar la cancelación de `appointments-cancel`. El click en Llamar MUST ejecutar el llamado de `appointments-call`. El click en Finalizar MUST ejecutar la finalización de `appointments-finalize`.

#### Scenario: Click en fila abre Detalle de Turno

- **WHEN** el usuario hace click en una celda de una fila de turno (fuera de la columna Acciones)
- **THEN** se abre el popup con título "Detalle de Turno" y se solicita el detalle al backend

#### Scenario: Click en Acciones no abre el popup

- **WHEN** el usuario activa un botón de la columna Acciones
- **THEN** el sistema no abre el popup de turno
