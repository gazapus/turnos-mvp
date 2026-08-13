## MODIFIED Requirements

### Requirement: Redirección al panel según rol

Tras un login exitoso, el cliente MUST redirigir al usuario al panel correspondiente a su rol: administrador → gestión de usuarios; recepcionista → agenda; médico → agenda (misma ruta de agenda unificada que recepcionista y administrador).

#### Scenario: Redirect administrador

- **WHEN** un usuario con rol administrador inicia sesión correctamente
- **THEN** el cliente lo redirige a la ruta de gestión de usuarios

#### Scenario: Redirect recepcionista

- **WHEN** un usuario con rol recepcionista inicia sesión correctamente
- **THEN** el cliente lo redirige a la ruta de agenda

#### Scenario: Redirect médico

- **WHEN** un usuario con rol médico inicia sesión correctamente
- **THEN** el cliente lo redirige a la ruta de agenda unificada (`/agenda`)
