## MODIFIED Requirements

### Requirement: Dialog de error genérico

El sistema SHALL exponer un dialog de error modal reutilizable, superpuesto a cualquier UI incluida otra modal, con variante visual danger, un mensaje amigable para el usuario y un detalle legible provisto por el backend (`message` del error HTTP). MUST permanecer abierto hasta que el usuario active Cerrar. MUST NOT cerrarse por click en el overlay ni por la X del formulario subyacente.

#### Scenario: Error con detalle del backend

- **WHEN** una mutación falla y el backend envía un `message`
- **THEN** el dialog muestra un texto amigable y ese detalle, y no se cierra hasta Cerrar

#### Scenario: Error encima del popup de turno

- **WHEN** falla el guardado del turno con el formulario abierto
- **THEN** el dialog de error se muestra sobre el popup del formulario y el formulario no se cierra

## ADDED Requirements

### Requirement: Dialog de confirmación warning

El sistema SHALL exponer un dialog de confirmación modal que reutiliza el mismo shell que el dialog de error, con variante visual warning (no danger). MUST mostrar un título, botones Aceptar y Cancelar, y MUST soportar un textarea de texto opcional genérico (label y longitud máxima provistos por el caller; el caller puede omitirlo). MUST NOT cerrarse por click en el overlay. Cancelar MUST cerrar el dialog sin confirmar. Aceptar MUST cerrar el dialog y devolver al caller que se aceptó, junto con el texto ingresado (vacío si no hay textarea o está en blanco). MUST poder mostrarse sobre el popup de turnos.

#### Scenario: Cancelar cierra sin confirmar

- **WHEN** una pantalla abre el dialog warning y el usuario activa Cancelar
- **THEN** el dialog se cierra y el caller no ejecuta la acción confirmada

#### Scenario: Aceptar confirma con texto opcional

- **WHEN** una pantalla abre el dialog warning con textarea y el usuario escribe un texto y activa Aceptar
- **THEN** el dialog se cierra y el caller recibe que se aceptó junto con ese texto

#### Scenario: Warning encima del popup de turno

- **WHEN** se abre el dialog warning con el formulario de turno abierto
- **THEN** el dialog se muestra sobre el popup del formulario
