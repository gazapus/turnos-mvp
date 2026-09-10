## MODIFIED Requirements

### Requirement: Botón AYUDA BOT

El sistema SHALL mostrar un botón fijo inferior derecho etiquetado como acceso al chatbot de ayuda (AYUDA BOT) en el shell autenticado. Activar el botón MUST abrir o cerrar el panel del chatbot de documentación. El botón MUST permanecer en el shell autenticado y MUST NOT aparecer en login.

#### Scenario: Click abre el panel

- **WHEN** el usuario autenticado activa el botón AYUDA BOT con el panel cerrado
- **THEN** el sistema muestra el panel de chat de ayuda

#### Scenario: Click cierra el panel

- **WHEN** el usuario autenticado activa el botón AYUDA BOT con el panel abierto
- **THEN** el sistema oculta el panel de chat

#### Scenario: Login sin AYUDA BOT

- **WHEN** un visitante abre la ruta de login
- **THEN** el sistema no muestra el botón AYUDA BOT ni el panel del chatbot

## ADDED Requirements

### Requirement: Panel de chat de ayuda

El sistema SHALL mostrar, al abrir AYUDA BOT, un panel de conversación en el shell autenticado que permite escribir un mensaje, enviarlo al asistente y ver la respuesta en el hilo. Mientras espera MUST indicar que está procesando. Si el backend falla MUST mostrar el dialog de error genérico y MUST NOT perder el hilo ya visible. MUST NOT exigir toast de éxito cuando llega una respuesta.

#### Scenario: Envío y respuesta

- **WHEN** el usuario autenticado envía una pregunta desde el panel
- **THEN** el hilo muestra su mensaje y, al completar la petición, la respuesta del asistente

#### Scenario: Error de red o proveedor

- **WHEN** el envío falla con error HTTP
- **THEN** el sistema muestra el dialog de error genérico y el panel permanece abierto
