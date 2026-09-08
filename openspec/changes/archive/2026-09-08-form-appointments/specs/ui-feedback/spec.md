## ADDED Requirements

### Requirement: Toast de éxito genérico

El sistema SHALL exponer un toast de éxito reutilizable desde cualquier pantalla autenticada, invocable con un mensaje. El toast MUST permanecer visible 5 segundos y MUST cerrarse desvaneciéndose durante 1 segundo. MUST poder usarse sin acoplarse al popup de turnos.

#### Scenario: Toast tras una acción exitosa

- **WHEN** una pantalla invoca el toast de éxito con un mensaje
- **THEN** el mensaje se muestra y a los 5 segundos comienza a desvanecerse hasta desaparecer en 1 segundo

#### Scenario: Reutilizable fuera de turnos

- **WHEN** otra pantalla autenticada dispara el mismo toast con otro mensaje
- **THEN** se muestra ese mensaje con la misma duración y el mismo cierre

### Requirement: Dialog de error genérico

El sistema SHALL exponer un dialog de error modal reutilizable, superpuesto a cualquier UI incluida otra modal, con un mensaje amigable para el usuario y un detalle legible provisto por el backend (`message` del error HTTP). MUST permanecer abierto hasta que el usuario active Cerrar. MUST NOT cerrarse por click en el overlay ni por la X del formulario subyacente.

#### Scenario: Error con detalle del backend

- **WHEN** una mutación falla y el backend envía un `message`
- **THEN** el dialog muestra un texto amigable y ese detalle, y no se cierra hasta Cerrar

#### Scenario: Error encima del popup de turno

- **WHEN** falla el guardado del turno con el formulario abierto
- **THEN** el dialog de error se muestra sobre el popup del formulario y el formulario no se cierra
