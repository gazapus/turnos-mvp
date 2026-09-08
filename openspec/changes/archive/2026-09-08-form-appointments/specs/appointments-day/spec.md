## ADDED Requirements

### Requirement: Segmentos de 15 minutos en la grilla Día

La grilla horaria del modo Día SHALL permitir seleccionar huecos en segmentos de 15 minutos, manteniendo etiquetas de hora en intervalos de 1 hora.

#### Scenario: Click en el último cuarto de una hora

- **WHEN** un Recepcionista o Administrador hace click en la zona vacía correspondiente al último cuarto de las 09:00
- **THEN** el sistema interpreta la hora de inicio como 09:45

### Requirement: Click en hueco vacío abre el alta precargada

El sistema SHALL abrir el popup de alta de turno cuando un Recepcionista o Administrador hace click izquierdo en un espacio vacío de la grilla Día. El popup MUST usar el mismo formulario que "Nuevo Turno", con fecha del día visible y hora de inicio/fin precargadas (fin = inicio + 30 minutos). El rol Médico MUST NOT abrir el alta desde un hueco.

#### Scenario: Recepcionista crea desde un hueco

- **WHEN** un Recepcionista hace click en un hueco vacío del modo Día
- **THEN** se abre el popup "Nuevo Turno" con fecha y horas precargadas según el segmento

#### Scenario: Médico no crea desde un hueco

- **WHEN** un usuario con rol Médico hace click en un hueco vacío del modo Día
- **THEN** el sistema no abre el popup de alta

### Requirement: Click en card de turno abre el detalle

El sistema SHALL abrir el popup de detalle al hacer click en una card de turno del modo Día, para cualquier rol autenticado que pueda ver esa card. Mientras carga el detalle MUST aplicarse el overlay abortable definido en `appointments-form`.

#### Scenario: Click en card abre Detalle de Turno

- **WHEN** el usuario hace click en una card de turno del modo Día
- **THEN** se abre el popup con título "Detalle de Turno" y se solicita el detalle al backend
