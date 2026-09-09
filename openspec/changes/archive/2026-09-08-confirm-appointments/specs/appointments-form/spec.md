## MODIFIED Requirements

### Requirement: Botones según rol y modo

En alta MUST mostrarse solo Salir y Guardar (no Confirmar ni Anular). En detalle, Recepcionista y Administrador MUST ver Anular turno (sin efecto y sin subtexto bajo Anular) además de Salir y Guardar cuando corresponda, y MUST ver "Confirmar turno" solo cuando el turno está `PROGRAMADO` y su fecha civil de clínica es hoy. El médico MUST ver el detalle en solo lectura, con Llamar paciente (sin efecto, en el lugar de Confirmar) y Salir; MUST NOT ver Guardar, Confirmar ni Anular. Anular y Llamar MUST permanecer sin efecto. Confirmar, cuando está visible, MUST ejecutar la transición de `appointments-confirm`.

#### Scenario: Alta sin Confirmar ni Anular

- **WHEN** el popup está en modo Nuevo Turno
- **THEN** no se muestran Confirmar turno ni Anular turno

#### Scenario: Médico solo lectura

- **WHEN** un usuario con rol Médico abre el detalle
- **THEN** ningún campo es editable y los botones visibles son Llamar paciente y Salir

#### Scenario: Anular sin subtexto

- **WHEN** un Recepcionista abre un detalle
- **THEN** Anular turno no muestra el subtexto de cancelación y notificación

#### Scenario: Confirmar visible en programado de hoy

- **WHEN** un Recepcionista o Administrador abre el detalle de un turno `PROGRAMADO` cuya fecha civil de clínica es hoy
- **THEN** se muestra el botón Confirmar turno

#### Scenario: Confirmar oculto si no aplica

- **WHEN** un Recepcionista o Administrador abre el detalle de un turno que no está `PROGRAMADO` o cuya fecha civil no es hoy
- **THEN** no se muestra el botón Confirmar turno
