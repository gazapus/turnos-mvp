## MODIFIED Requirements

### Requirement: Contrato de backend para el listado de turnos

El sistema SHALL exponer `GET /api/turnos` protegido por sesión autenticada (cualquier rol), que acepta filtros por médico, especialidad, paciente e inclusión de cancelados, un filtro opcional de fecha exacta, y paginación por cursor. La respuesta MUST incluir únicamente los campos necesarios para el listado: id, fecha, hora, hora de fin, datos mínimos de paciente (nombre, apellido), médico (nombre, apellido) y especialidad (nombre), estado y tipo. Las respuestas MUST no cachearse (sin encabezados de caché HTTP que permitan servir una respuesta obsoleta).

#### Scenario: Acceso sin sesión

- **WHEN** una solicitud a `GET /api/turnos` no incluye una sesión válida
- **THEN** el sistema responde con error de no autorizado y no devuelve turnos

#### Scenario: Respuesta con DTO mínimo

- **WHEN** un usuario autenticado consulta `GET /api/turnos`
- **THEN** cada turno de la respuesta expone únicamente id, fecha, hora, hora de fin, paciente (nombre y apellido), médico (nombre y apellido), especialidad (nombre), estado y tipo, sin exponer campos internos de la entidad

## ADDED Requirements

### Requirement: Filtro por fecha exacta sin paginar

El sistema SHALL aceptar en `GET /api/turnos` un query param opcional `fecha` (fecha local `YYYY-MM-DD`). Cuando `fecha` está presente, el sistema MUST devolver todos los turnos cuya fecha de inicio caiga dentro de ese día civil (según la zona horaria de la clínica) que cumplan el resto de los filtros activos (médico, especialidad, paciente, cancelados), sin aplicar el límite de página ni la paginación por cursor del modo Lista. Cuando `fecha` está presente, el sistema MUST ignorar cualquier `cursor`/`direccion` recibido en la misma solicitud.

#### Scenario: Consulta con filtro de fecha

- **WHEN** un usuario autenticado consulta `GET /api/turnos` con el query param `fecha`
- **THEN** el sistema devuelve todos los turnos de esa fecha que cumplen el resto de los filtros activos, sin límite de cantidad de resultados

#### Scenario: Fecha sin turnos

- **WHEN** un usuario autenticado consulta `GET /api/turnos` con `fecha` para un día sin turnos que cumplan los filtros activos
- **THEN** el sistema devuelve una lista vacía de turnos

#### Scenario: Fecha combinada con cursor es ignorada

- **WHEN** una solicitud a `GET /api/turnos` incluye tanto `fecha` como `cursor`
- **THEN** el sistema resuelve la consulta únicamente por `fecha`, ignorando el `cursor` recibido

#### Scenario: Fecha respeta el scoping por rol

- **WHEN** un usuario con rol Médico consulta `GET /api/turnos` con `fecha`
- **THEN** el sistema devuelve únicamente los turnos de esa fecha donde el médico autenticado es el médico asignado, igual que en el resto de las consultas del listado
