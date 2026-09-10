## MODIFIED Requirements

### Requirement: Botones según rol y modo

En alta MUST mostrarse solo Salir y Guardar (no Confirmar ni Cancelar). En detalle, Recepcionista y Administrador MUST ver "Cancelar turno" (sin subtexto bajo el botón) solo cuando el turno está `PROGRAMADO` o `CONFIRMADO`, además de Salir y Guardar cuando corresponda, y MUST ver "Confirmar turno" solo cuando el turno está `PROGRAMADO` y su fecha civil de clínica es hoy. El médico MUST ver el detalle en solo lectura; MUST NOT ver Guardar, Confirmar ni Cancelar. El médico MUST ver "Llamar paciente" solo cuando el turno está `CONFIRMADO` y su fecha civil de clínica es hoy, y MUST ver "Finalizar turno" solo cuando además `llamado` es verdadero. Llamar, cuando está visible, MUST ejecutar el llamado de `appointments-call`. Finalizar, cuando está visible, MUST ejecutar la transición de `appointments-finalize`. Confirmar, cuando está visible, MUST ejecutar la transición de `appointments-confirm`. Cancelar, cuando está visible, MUST ejecutar la transición de `appointments-cancel`.

#### Scenario: Alta sin Confirmar ni Cancelar

- **WHEN** el popup está en modo Nuevo Turno
- **THEN** no se muestran Confirmar turno ni Cancelar turno

#### Scenario: Médico solo lectura en confirmado de hoy sin llamado

- **WHEN** un usuario con rol Médico abre el detalle de un turno `CONFIRMADO` de hoy que no fue llamado
- **THEN** ningún campo es editable y los botones visibles son Llamar paciente y Salir

#### Scenario: Médico ve Finalizar tras llamado

- **WHEN** un usuario con rol Médico abre el detalle de un turno `CONFIRMADO` de hoy con `llamado` verdadero
- **THEN** los botones visibles incluyen Llamar paciente, Finalizar turno y Salir

#### Scenario: Médico sin Llamar ni Finalizar fuera de regla

- **WHEN** un usuario con rol Médico abre el detalle de un turno `PROGRAMADO` o `ATENDIDO`
- **THEN** ningún campo es editable y el único botón de pie es Salir

#### Scenario: Cancelar sin subtexto

- **WHEN** un Recepcionista abre un detalle `PROGRAMADO` o `CONFIRMADO`
- **THEN** Cancelar turno no muestra el subtexto de cancelación y notificación

#### Scenario: Confirmar visible en programado de hoy

- **WHEN** un Recepcionista o Administrador abre el detalle de un turno `PROGRAMADO` cuya fecha civil de clínica es hoy
- **THEN** se muestra el botón Confirmar turno

#### Scenario: Confirmar oculto si no aplica

- **WHEN** un Recepcionista o Administrador abre el detalle de un turno que no está `PROGRAMADO` o cuya fecha civil no es hoy
- **THEN** no se muestra el botón Confirmar turno

#### Scenario: Cancelar oculto si el estado no aplica

- **WHEN** un Recepcionista o Administrador abre el detalle de un turno `ATENDIDO`, `AUSENTE` o `CANCELADO`
- **THEN** no se muestra el botón Cancelar turno
