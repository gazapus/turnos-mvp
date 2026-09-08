## ADDED Requirements

### Requirement: Click en fila abre el detalle de turno

El sistema SHALL abrir el popup de detalle al hacer click en una fila del modo Lista, para cualquier rol autenticado que pueda ver esa fila. El popup MUST ser el mismo de `appointments-form`, con título "Detalle de Turno" y carga abortable. El click en un botón de la columna Acciones MUST NOT abrir el popup ni ejecutar confirmar, anular, llamar o finalizar (esos botones siguen siendo stubs).

#### Scenario: Click en fila abre Detalle de Turno

- **WHEN** el usuario hace click en una celda de una fila de turno (fuera de la columna Acciones)
- **THEN** se abre el popup con título "Detalle de Turno" y se solicita el detalle al backend

#### Scenario: Click en Acciones no abre el popup

- **WHEN** el usuario activa un botón de la columna Acciones
- **THEN** el sistema no abre el popup de turno y no cambia el estado del turno
