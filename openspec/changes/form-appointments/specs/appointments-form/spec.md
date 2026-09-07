## ADDED Requirements

### Requirement: Popup único de alta y detalle de turno

El sistema SHALL mostrar un popup modal reutilizable para crear, visualizar y editar un turno, con las secciones "Información del turno" y "Datos del paciente", botón X de cierre, fondo `appointments-background.png` y sin subtítulo bajo el título. El popup MUST montarse sobre la Agenda sin navegar a otra ruta. Al cerrar (X, Salir o éxito de alta) MUST dejar el formulario sin valores residuales. Cerrar MUST NOT pedir confirmación de cambios sin guardar.

#### Scenario: Título de alta

- **WHEN** el popup se abre para crear un turno
- **THEN** el título visible es "Nuevo Turno" y no hay subtítulo

#### Scenario: Título de detalle

- **WHEN** el popup se abre para un turno existente
- **THEN** el título visible es "Detalle de Turno" y no hay subtítulo

#### Scenario: Cerrar descarta sin preguntar

- **WHEN** el usuario activa Salir o la X con campos modificados
- **THEN** el popup se cierra y la próxima apertura no muestra esos valores

### Requirement: Precarga de horario en el alta desde un hueco

Cuando el alta se abre desde un hueco del modo Día, el sistema SHALL precargar Fecha con el día seleccionado, Hora de inicio con el inicio del segmento de 15 minutos clickeado y Hora de fin 30 minutos después (editable). Cuando el alta se abre desde el botón "Nuevo Turno", esos campos MUST iniciar vacíos y Tipo MUST iniciar en Control.

#### Scenario: Alta vacía desde el botón

- **WHEN** un Recepcionista o Administrador abre el popup con "Nuevo Turno"
- **THEN** médico, especialidad, fecha, horas y datos de paciente están vacíos y tipo es Control

#### Scenario: Alta precargada desde un cuarto de hora

- **WHEN** el alta se abre desde un click en el último cuarto de las 09:00
- **THEN** hora de inicio es 09:45 y hora de fin es 10:15

### Requirement: Carga de detalle con overlay abortable

Al abrir un turno existente el sistema SHALL consultar `GET /api/turnos/:id`, mostrar un indicador de carga que bloquea el formulario y los botones de acción, y permitir solo la X para abortar. Si la carga termina con error, MUST mostrar el dialog de error genérico y MUST NOT dejar el formulario editable con datos parciales.

#### Scenario: Overlay mientras carga

- **WHEN** el usuario abre el detalle de un turno y la petición de detalle aún no respondió
- **THEN** el formulario no acepta edición ni Guardar/Confirmar/Anular/Llamar y se ve un indicador de carga

#### Scenario: X aborta la carga

- **WHEN** el usuario activa la X durante la carga del detalle
- **THEN** el popup se cierra y el sistema no aplica la respuesta posterior al formulario

### Requirement: Combobox cruzados de médico y especialidad

Los campos Médico y Especialidad SHALL ser combobox tipeables equivalentes a los filtros de agenda (sin opción "Todos"). Elegir un médico MUST restringir las especialidades a las suyas; elegir una especialidad MUST restringir los médicos a los que la atienden. Si tras filtrar queda una sola opción, el sistema MUST seleccionarla. Si la selección actual deja de ser válida, MUST vaciarse (y autoseleccionarse si queda una).

#### Scenario: Médico con dos especialidades

- **WHEN** el usuario elige un médico que atiende exactamente dos especialidades
- **THEN** el combobox de especialidad lista solo esas dos

#### Scenario: Especialidad con un solo médico

- **WHEN** el usuario elige una especialidad que atiende un único médico
- **THEN** el combobox de médico lista y selecciona a ese médico

### Requirement: Tipo Control, Urgente y Primer turno automático

El usuario SHALL poder elegir tipo Control o Urgente. El sistema MUST persistir y mostrar Primer turno cuando el paciente (nuevo o existente) no tiene turnos previos con el médico elegido y la elección no es Urgente. Urgente MUST pisan lo automático. Volver de Urgente a Control MUST recalcular. Cambiar médico o paciente MUST recalcular salvo que Urgente esté elegido. El alta MUST NEVER persistir `SOBRETURNO`. Un detalle cuyo tipo persistido es `SOBRETURNO` MUST mostrarlo; Guardar sin cambiar el tipo MUST dejar `SOBRETURNO`.

#### Scenario: Primera vez con el médico

- **WHEN** el documento identifica un paciente sin turnos previos con el médico seleccionado y el tipo no es Urgente
- **THEN** el campo muestra Primer turno y el alta persiste `PRIMER_TURNO`

#### Scenario: Urgente pisa la automática

- **WHEN** el par es primera vez y el usuario elige Urgente
- **THEN** el sistema persiste `URGENTE`

#### Scenario: Paciente nuevo es primera vez

- **WHEN** el documento no existe en el padrón, hay un médico elegido y el tipo no es Urgente
- **THEN** el campo muestra Primer turno

### Requirement: Fecha y horas del turno

El campo de día SHALL etiquetarse "Fecha" (no "Fecha de inicio") y MUST rechazar un día civil anterior a hoy en zona horaria de la clínica. Hora de inicio y hora de fin SHALL aceptar cualquier hora del día. Al completar hora de inicio, hora de fin MUST autocompletarse 30 minutos después y seguir siendo editable. Hora de fin MUST ser estrictamente posterior a hora de inicio; si el intervalo cruza medianoche, la fecha de fin MUST ser el día civil siguiente.

#### Scenario: Fecha pasada inválida

- **WHEN** el usuario ingresa una fecha anterior al día civil actual de la clínica
- **THEN** el campo Fecha muestra error y Guardar permanece deshabilitado

#### Scenario: Autocompletado de fin

- **WHEN** el usuario ingresa hora de inicio 10:00 y hora de fin estaba vacía o era el autocompletado previo
- **THEN** hora de fin queda en 10:30

#### Scenario: Fin no posterior al inicio

- **WHEN** hora de fin es igual o anterior a hora de inicio el mismo día
- **THEN** el campo hora de fin muestra error

### Requirement: Búsqueda de paciente por documento

El sistema SHALL buscar un paciente por documento al dejar de tipear 1,5 s o al hacer blur del campo, normalizando el documento a dígitos. Si existe, MUST completar nombre, apellido, teléfono y mail y MUST dejar esos campos no editables (el usuario MUST poder cambiar solo notificar, si aplica). Si no existe, MUST dejar esos campos editables y vacíos o con lo que el usuario ya hubiera escrito en un miss. Si el usuario cambia el documento de un paciente ya precargado, MUST limpiar los campos de paciente y el identificador asociado y MUST repetir la búsqueda.

#### Scenario: Documento existente autocompleta y bloquea

- **WHEN** el usuario ingresa un documento que existe y espera 1,5 s o sale del campo
- **THEN** se completan los datos del paciente y nombre, apellido, teléfono y mail no son editables

#### Scenario: Documento inexistente

- **WHEN** el usuario ingresa un documento que no existe y dispara la búsqueda
- **THEN** nombre, apellido, teléfono y mail quedan editables para carga manual

#### Scenario: Cambio de documento limpia el precargado

- **WHEN** había un paciente precargado y el usuario cambia el documento
- **THEN** se borran nombre, apellido, teléfono, mail y el id de paciente precargado

### Requirement: Notificar al paciente

El checkbox "Notificar al paciente" SHALL estar habilitado solo si hay un mail con formato válido. MUST NOT mostrar subtexto fijo; MUST mostrar un tooltip al pasar el cursor sobre el checkbox y su label indicando que se enviará un recordatorio por email. Un paciente existente sin mail MUST dejar el checkbox deshabilitado (no se puede cargar mail en este popup).

#### Scenario: Sin mail no notifica

- **WHEN** el mail está vacío o es inválido
- **THEN** el checkbox de notificar está deshabilitado

#### Scenario: Tooltip en lugar de subtexto

- **WHEN** el usuario posiciona el cursor sobre el checkbox o su label
- **THEN** aparece el tooltip de recordatorio por email y no hay subtexto bajo el label

### Requirement: Validación visible sin saltar el layout

Todos los campos excepto teléfono, mail y notificar SHALL ser obligatorios. Nombre y apellido MUST tener entre 3 y 45 caracteres; mail máximo 50; teléfono solo dígitos y máximo 15. Un campo inválido MUST mostrar borde rojo y un texto de error rojo debajo. Al corregirse, borde y texto MUST desaparecer de inmediato. El espacio del mensaje de error MUST estar reservado para que su aparición no desplace la línea inferior del formulario. Guardar MUST permanecer deshabilitado mientras el formulario sea inválido.

#### Scenario: Error de nombre corto

- **WHEN** el usuario ingresa un nombre de 2 caracteres
- **THEN** el campo Nombre tiene borde de error y el texto de validación debajo

#### Scenario: Error desaparece al corregir

- **WHEN** el usuario corrige el nombre a 3 o más caracteres
- **THEN** el borde rojo y el texto de error de ese campo desaparecen

### Requirement: Guardar en alta

En modo alta, con rol Recepcionista o Administrador, Guardar SHALL enviar `POST /api/turnos`. Mientras procesa MUST mostrar feedback de espera y MUST NOT cerrar el popup. Si el paciente no existía, el backend MUST crearlo en la misma transacción que el turno; si esa creación falla, MUST NO persistir el turno y MUST notificarse con el dialog de error. Éxito MUST cerrar el popup, mostrar el toast de éxito genérico indicando que el turno se guardó, e invalidar las consultas de agenda. El mensaje de éxito MUST NOT mencionar el alta de paciente.

#### Scenario: Alta exitosa cierra y tostea

- **WHEN** el usuario activa Guardar en un alta válida y el backend responde éxito
- **THEN** el popup se cierra y aparece el toast de turno guardado

#### Scenario: Error de paciente detiene el turno

- **WHEN** el backend no puede persistir el paciente nuevo
- **THEN** no se crea el turno, el popup sigue abierto y se muestra el dialog de error genérico

#### Scenario: Error de alta no cierra

- **WHEN** `POST /api/turnos` falla
- **THEN** el popup del formulario permanece abierto debajo del dialog de error

### Requirement: Guardar en edición

En detalle, Guardar SHALL enviarse solo si el turno está `PROGRAMADO`, su fecha civil es ≥ hoy, el formulario es válido y hay cambios. Éxito MUST dejar el popup abierto, mostrar el toast de éxito, resetear el estado dirty y refrescar la agenda. Mientras procesa MUST mostrar espera. Un turno `PROGRAMADO` con fecha pasada MUST no mostrar Guardar y MUST dejar los campos en solo lectura. Un turno que no está `PROGRAMADO` MUST no mostrar Guardar.

#### Scenario: Sin cambios Guardar deshabilitado

- **WHEN** el detalle de un PROGRAMADO de hoy o futuro está cargado sin modificaciones
- **THEN** Guardar está deshabilitado y su tooltip indica que no hay cambios que guardar

#### Scenario: Edición exitosa no cierra

- **WHEN** el usuario guarda cambios válidos en un PROGRAMADO con fecha ≥ hoy
- **THEN** el popup permanece abierto, se muestra el toast de éxito y Guardar vuelve a deshabilitarse

#### Scenario: PROGRAMADO de ayer sin Guardar

- **WHEN** se abre un turno PROGRAMADO cuya fecha civil es anterior a hoy
- **THEN** no se muestra Guardar y los campos no son editables

#### Scenario: Turno confirmado sin Guardar

- **WHEN** se abre un turno en estado distinto de PROGRAMADO con rol Recepcionista o Administrador
- **THEN** no se muestra Guardar

### Requirement: Tooltips de Guardar deshabilitado

Cuando Guardar está deshabilitado el sistema SHALL mostrar un tooltip al pasar el cursor (incluido un wrapper que reciba hover si el botón nativo está disabled). En alta o detalle inválido el texto MUST indicar que faltan completar campos. En detalle válido sin dirty MUST indicar que no hay cambios que guardar.

#### Scenario: Tooltip de campos incompletos

- **WHEN** el cursor está sobre Guardar deshabilitado en un alta incompleta
- **THEN** el tooltip indica que faltan completar campos

### Requirement: Botones según rol y modo

En alta MUST mostrarse solo Salir y Guardar (no Confirmar ni Anular). En detalle, Recepcionista y Administrador MUST ver Confirmar turno y Anular turno (sin efecto y sin subtexto bajo Anular) además de Salir y Guardar cuando corresponda. El médico MUST ver el detalle en solo lectura, con Llamar paciente (sin efecto, en el lugar de Confirmar) y Salir; MUST NOT ver Guardar, Confirmar ni Anular. Confirmar, Anular y Llamar MUST mostrarse en detalle sin validar estado (ciclo de vida fuera de este change).

#### Scenario: Alta sin Confirmar ni Anular

- **WHEN** el popup está en modo Nuevo Turno
- **THEN** no se muestran Confirmar turno ni Anular turno

#### Scenario: Médico solo lectura

- **WHEN** un usuario con rol Médico abre el detalle
- **THEN** ningún campo es editable y los botones visibles son Llamar paciente y Salir

#### Scenario: Anular sin subtexto

- **WHEN** un Recepcionista abre un detalle
- **THEN** Anular turno no muestra el subtexto de cancelación y notificación

### Requirement: Contratos de escritura y detalle de turnos

El sistema SHALL exponer `GET /api/turnos/:id` (detalle con ids, paciente con contacto, tipo, estado, fechas/horas locales de clínica, `notificarMail`), `POST /api/turnos` (alta transaccional) y `PATCH /api/turnos/:id` (edición). POST y PATCH MUST restringirse a Recepcionista y Administrador. GET detalle para Médico MUST limitarse a turnos propios (si no es suyo, 404). PATCH de un turno no PROGRAMADO o con fecha civil &lt; hoy MUST rechazarse con error legible. `GET /api/turnos/primera-vez` SHALL indicar si el par paciente+médico no tiene turnos previos (en edición excluye el propio id). `GET /api/pacientes?documento=` SHALL devolver el paciente con contacto o vacío sin 404. Los catálogos de médicos y especialidades MUST incluir los ids de la relación cruzada.

#### Scenario: Médico no crea por API

- **WHEN** un usuario con rol Médico envía `POST /api/turnos`
- **THEN** el sistema responde 403

#### Scenario: Documento no encontrado no es 404

- **WHEN** `GET /api/pacientes?documento=` no encuentra padrón
- **THEN** la respuesta es 200 sin paciente (no 404)
