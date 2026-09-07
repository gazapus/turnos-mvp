## MODIFIED Requirements

### Requirement: Botón "Nuevo Turno" visible solo para Recepcionista y Administrador

El sistema SHALL mostrar el botón "Nuevo Turno" únicamente a los roles Recepcionista y Administrador en el layout de Agenda. El rol Médico MUST no ver este botón. Activar el botón MUST abrir el popup de alta de turno con título "Nuevo Turno" y el formulario vacío (ver `appointments-form`).

#### Scenario: Recepcionista o administrador ve el botón

- **WHEN** un usuario con rol Recepcionista o Administrador abre `/agenda`
- **THEN** el sistema muestra el botón "Nuevo Turno" en el layout

#### Scenario: Médico no ve el botón

- **WHEN** un usuario con rol Médico abre `/agenda`
- **THEN** el sistema no muestra el botón "Nuevo Turno" en el layout

#### Scenario: Click en Nuevo Turno abre el alta

- **WHEN** un usuario con rol Recepcionista o Administrador activa el botón "Nuevo Turno"
- **THEN** el sistema abre el popup de alta de turno con título "Nuevo Turno" y campos vacíos
