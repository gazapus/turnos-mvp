## MODIFIED Requirements

### Requirement: Botones según rol y modo

En alta MUST mostrarse solo Salir y Guardar (no Confirmar ni Cancelar). En detalle, Recepcionista y Administrador MUST ver "Cancelar turno" (sin subtexto bajo el botón) solo cuando el turno está `PROGRAMADO` o `CONFIRMADO`, además de Salir y Guardar cuando corresponda, y MUST ver "Confirmar turno" solo cuando el turno está `PROGRAMADO` y su fecha civil de clínica es hoy. El médico MUST ver el detalle en solo lectura, con Llamar paciente (sin efecto, en el lugar de Confirmar) y Salir; MUST NOT ver Guardar, Confirmar ni Cancelar. Llamar MUST permanecer sin efecto. Confirmar, cuando está visible, MUST ejecutar la transición de `appointments-confirm`. Cancelar, cuando está visible, MUST ejecutar la transición de `appointments-cancel`.

#### Scenario: Alta sin Confirmar ni Cancelar

- **WHEN** el popup está en modo Nuevo Turno
- **THEN** no se muestran Confirmar turno ni Cancelar turno

#### Scenario: Médico solo lectura

- **WHEN** un usuario con rol Médico abre el detalle
- **THEN** ningún campo es editable y los botones visibles son Llamar paciente y Salir

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

### Requirement: Contratos de escritura y detalle de turnos

El sistema SHALL exponer `GET /api/turnos/:id` (detalle con ids, paciente con contacto, tipo, estado, fechas/horas locales de clínica, `notificarMail`, `motivoCancelacion`), `POST /api/turnos` (alta transaccional) y `PATCH /api/turnos/:id` (edición). POST y PATCH MUST restringirse a Recepcionista y Administrador. GET detalle para Médico MUST limitarse a turnos propios (si no es suyo, 404). PATCH de un turno no PROGRAMADO o con fecha civil &lt; hoy MUST rechazarse con error legible. `GET /api/turnos/primera-vez` SHALL indicar si el par paciente+médico no tiene turnos previos (en edición excluye el propio id). `GET /api/pacientes?documento=` SHALL devolver el paciente con contacto o vacío sin 404. Los catálogos de médicos y especialidades MUST incluir los ids de la relación cruzada.

#### Scenario: Médico no crea por API

- **WHEN** un usuario con rol Médico envía `POST /api/turnos`
- **THEN** el sistema responde 403

#### Scenario: Documento no encontrado no es 404

- **WHEN** `GET /api/pacientes?documento=` no encuentra padrón
- **THEN** la respuesta es 200 sin paciente (no 404)

#### Scenario: Detalle incluye motivo de cancelación

- **WHEN** un usuario autenticado solicita `GET /api/turnos/:id` de un turno existente
- **THEN** la respuesta incluye `motivoCancelacion` (texto o nulo)
