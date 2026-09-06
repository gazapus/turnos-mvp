## ADDED Requirements

### Requirement: El checkbox "Solo Pendientes" recarga el modo Día

El checkbox "Solo Pendientes" del layout compartido de la Agenda SHALL aplicarse al modo Día mediante una nueva consulta a `GET /api/turnos` con el filtro `soloPendientes` y la fecha seleccionada. Activar o desactivar el checkbox MUST no filtrar cards en memoria.

#### Scenario: Marcar Solo Pendientes en el modo Día

- **WHEN** el usuario marca el checkbox "Solo Pendientes" mientras el modo Día está activo
- **THEN** el sistema consulta de nuevo los turnos del día restringidos a estados `PROGRAMADO` y `CONFIRMADO` y actualiza la grilla

#### Scenario: Desmarcar Solo Pendientes en el modo Día

- **WHEN** el usuario desmarca el checkbox "Solo Pendientes" mientras el modo Día está activo
- **THEN** el sistema consulta de nuevo los turnos del día de todos los estados y actualiza la grilla

## MODIFIED Requirements

### Requirement: Cambiar la fecha dispara una nueva consulta al backend

Cualquier cambio de fecha seleccionada (input, calendario emergente, flechas o botón HOY) SHALL disparar una nueva consulta al backend acotada a la nueva fecha, respetando los filtros de médico, especialidad, paciente y `soloPendientes` activos.

#### Scenario: Nueva consulta al cambiar de fecha

- **WHEN** la fecha seleccionada cambia por cualquiera de los mecanismos de navegación
- **THEN** el sistema consulta al backend los turnos de la nueva fecha con los filtros actualmente activos

## REMOVED Requirements

### Requirement: El checkbox de "Cancelados" aplica al modo Día sin refetch

**Reason**: "Solo Pendientes" filtra en el backend; Día debe recargar igual que Lista.

**Migration**: El toggle de "Solo Pendientes" dispara `GET /api/turnos` con `fecha` y `soloPendientes`.
