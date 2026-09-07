## REMOVED Requirements

### Requirement: Scroll infinito bidireccional anclado al día actual

**Reason:** El modo Lista deja de ser un historial scrolleable: el tope es el día actual y el pasado se consulta en el modo Día. El scroll infinito bidireccional contradice esa regla.

**Migration:** Reemplazado por el requisito "Scroll infinito solo hacia adelante anclado al día actual".

## ADDED Requirements

### Requirement: Scroll infinito solo hacia adelante anclado al día actual

El sistema SHALL cargar los turnos del modo Lista en páginas de 30, sin `offset`/`page`, usando paginación por cursor. La primera consulta (sin interacción de scroll) MUST filtrar turnos con fecha de inicio mayor o igual a las 00:00 del día actual, ordenados ascendentemente. Al llegar el scroll al final de los resultados cargados, el sistema SHALL solicitar la siguiente página de turnos posteriores. El sistema MUST NOT solicitar turnos con fecha de inicio anterior al día actual: ni al llegar el scroll al inicio de los resultados cargados, ni cuando la primera página no contiene ítems.

#### Scenario: Primera carga de la Lista

- **WHEN** el usuario abre o aplica filtros en el modo de visualización Lista
- **THEN** el sistema consulta el backend por hasta 30 turnos con fecha de inicio desde las 00:00 del día actual en adelante, ordenados por fecha y hora ascendente

#### Scenario: Scroll hacia abajo carga turnos posteriores

- **WHEN** el usuario scrollea hasta el último turno cargado en la Lista
- **THEN** el sistema solicita al backend hasta 30 turnos siguientes a los ya cargados, respetando los filtros activos, y los agrega al final de la grilla

#### Scenario: Scroll hacia arriba no carga turnos anteriores

- **WHEN** el usuario scrollea hasta el primer turno cargado en la Lista
- **THEN** el sistema no solicita turnos anteriores al día actual y no agrega filas al inicio de la grilla

#### Scenario: Primera página vacía no rellena con el pasado

- **WHEN** la primera consulta del modo Lista no devuelve turnos desde las 00:00 del día actual en adelante
- **THEN** el sistema no solicita turnos previos al día actual y muestra el mensaje vacío existente
