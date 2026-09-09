## ADDED Requirements

### Requirement: Botones de acción por rol

El sistema SHALL mostrar en la columna "Acciones" icon-buttons según el rol del usuario autenticado. Recepcionista y Administrador ven Cancelar (X roja) en toda fila, y Confirmar (check) solo cuando el turno está `PROGRAMADO` y su fecha civil de clínica es hoy; Médico ve Llamar (teléfono) y Finalizar (check verde) en toda fila. Cada botón visible MUST mostrar un tooltip con su nombre de acción. Confirmar MUST ejecutar la transición de `appointments-confirm`. Cancelar, Llamar y Finalizar MUST permanecer stubs (no llaman al backend).

#### Scenario: Acciones para recepcionista o administrador en un programado de hoy

- **WHEN** un usuario con rol Recepcionista o Administrador visualiza una fila de turno `PROGRAMADO` con fecha civil de hoy
- **THEN** la columna de acciones muestra los botones Confirmar y Cancelar, con tooltips "Confirmar paciente" y "Cancelar turno" respectivamente

#### Scenario: Acciones para recepcionista sin Confirmar fuera de regla

- **WHEN** un usuario con rol Recepcionista o Administrador visualiza una fila que no está `PROGRAMADO` o cuya fecha civil no es hoy
- **THEN** la columna de acciones muestra Cancelar y no muestra Confirmar

#### Scenario: Acciones para médico

- **WHEN** un usuario con rol Médico visualiza una fila de turno
- **THEN** la columna de acciones muestra los botones Llamar y Finalizar, con tooltips "Llamar al paciente" y "Finalizar turno" respectivamente

#### Scenario: Click en Cancelar, Llamar o Finalizar no ejecuta nada

- **WHEN** el usuario activa Cancelar, Llamar o Finalizar en la columna de acciones
- **THEN** el sistema no cambia el estado del turno ni realiza ninguna llamada al backend

## MODIFIED Requirements

### Requirement: Click en fila abre el detalle de turno

El sistema SHALL abrir el popup de detalle al hacer click en una fila del modo Lista, para cualquier rol autenticado que pueda ver esa fila. El popup MUST ser el mismo de `appointments-form`, con título "Detalle de Turno" y carga abortable. El click en un botón de la columna Acciones MUST NOT abrir el popup. El click en Confirmar MUST ejecutar la confirmación de `appointments-confirm`. El click en Cancelar, Llamar o Finalizar MUST NOT cambiar el estado del turno.

#### Scenario: Click en fila abre Detalle de Turno

- **WHEN** el usuario hace click en una celda de una fila de turno (fuera de la columna Acciones)
- **THEN** se abre el popup con título "Detalle de Turno" y se solicita el detalle al backend

#### Scenario: Click en Acciones no abre el popup

- **WHEN** el usuario activa un botón de la columna Acciones
- **THEN** el sistema no abre el popup de turno

## REMOVED Requirements

### Requirement: Botones de acción por rol, sin lógica de habilitación por estado

**Reason**: Confirmar ahora se oculta según estado y día civil, y ejecuta la transición en vez de ser un stub fijo.

**Migration**: Usar el requirement "Botones de acción por rol" de este delta y `appointments-confirm`.
