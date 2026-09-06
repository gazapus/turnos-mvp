## ADDED Requirements

### Requirement: Filtro soloPendientes en GET /api/turnos

El sistema SHALL aceptar en `GET /api/turnos` un query param booleano `soloPendientes`. Cuando es `true`, la respuesta MUST incluir únicamente turnos en estado `PROGRAMADO` o `CONFIRMADO`. Cuando es `false` o está ausente, MUST no filtrar por estado. El param `incluirCancelados` MUST no aceptarse.

#### Scenario: Solo pendientes activos

- **WHEN** un usuario autenticado consulta `GET /api/turnos` con `soloPendientes=true`
- **THEN** el sistema no devuelve turnos en estado `ATENDIDO`, `AUSENTE` ni `CANCELADO`

#### Scenario: Todos los estados

- **WHEN** un usuario autenticado consulta `GET /api/turnos` con `soloPendientes=false` o sin el param
- **THEN** el sistema incluye turnos de cualquier estado que cumplan el resto de los filtros

### Requirement: Búsqueda e hidratación de pacientes para el filtro

El sistema SHALL exponer `GET /api/pacientes` protegido por sesión autenticada, que acepta un query param `q`. MUST devolver como máximo 30 pacientes cuyo `nombre` o `apellido` contenga el substring `q` (sin distinguir mayúsculas ni tildes). Si `q` está ausente o tiene menos de 3 caracteres (tras recortar espacios), MUST devolver una lista vacía y MUST no listar el padrón completo. Cada ítem MUST incluir únicamente `id`, `nombre` y `apellido`.

El sistema SHALL exponer `GET /api/pacientes/:id` protegido por sesión autenticada. MUST devolver el mismo DTO mínimo del paciente o un error de no encontrado.

#### Scenario: Búsqueda por substring en nombre o apellido

- **WHEN** un usuario autenticado solicita `GET /api/pacientes?q=mar` y existen pacientes cuyo nombre o apellido contienen "mar"
- **THEN** el sistema devuelve hasta 30 coincidencias con id, nombre y apellido, sin documento

#### Scenario: Búsqueda ignora tildes

- **WHEN** un usuario autenticado solicita `GET /api/pacientes?q=gonzalez` y existe un paciente con apellido "González"
- **THEN** el sistema incluye a ese paciente en las coincidencias

#### Scenario: Query demasiado corta no lista el padrón

- **WHEN** un usuario autenticado solicita `GET /api/pacientes` sin `q` o con `q` de menos de 3 caracteres
- **THEN** el sistema responde con una lista vacía

#### Scenario: Obtener paciente por id

- **WHEN** un usuario autenticado solicita `GET /api/pacientes/:id` con un id existente
- **THEN** el sistema devuelve ese paciente con id, nombre y apellido

#### Scenario: Paciente inexistente

- **WHEN** un usuario autenticado solicita `GET /api/pacientes/:id` con un id que no existe
- **THEN** el sistema responde con error de no encontrado

## MODIFIED Requirements

### Requirement: Contrato de backend para el listado de turnos

El sistema SHALL exponer `GET /api/turnos` protegido por sesión autenticada (cualquier rol), que acepta filtros por médico, especialidad, paciente y `soloPendientes`, un filtro opcional de fecha exacta, y paginación por cursor. La respuesta MUST incluir únicamente los campos necesarios para el listado: id, fecha, hora, hora de fin, datos mínimos de paciente (nombre, apellido), médico (nombre, apellido) y especialidad (nombre), estado y tipo. Las respuestas MUST no cachearse (sin encabezados de caché HTTP que permitan servir una respuesta obsoleta).

#### Scenario: Acceso sin sesión

- **WHEN** una solicitud a `GET /api/turnos` no incluye una sesión válida
- **THEN** el sistema responde con error de no autorizado y no devuelve turnos

#### Scenario: Respuesta con DTO mínimo

- **WHEN** un usuario autenticado consulta `GET /api/turnos`
- **THEN** cada turno de la respuesta expone únicamente id, fecha, hora, hora de fin, paciente (nombre y apellido), médico (nombre y apellido), especialidad (nombre), estado y tipo, sin exponer campos internos de la entidad

### Requirement: Filtro por fecha exacta sin paginar

El sistema SHALL aceptar en `GET /api/turnos` un query param opcional `fecha` (fecha local `YYYY-MM-DD`). Cuando `fecha` está presente, el sistema MUST devolver todos los turnos cuya fecha de inicio caiga dentro de ese día civil (según la zona horaria de la clínica) que cumplan el resto de los filtros activos (médico, especialidad, paciente, `soloPendientes`), sin aplicar el límite de página ni la paginación por cursor del modo Lista. Cuando `fecha` está presente, el sistema MUST ignorar cualquier `cursor`/`direccion` recibido en la misma solicitud.

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

### Requirement: Endpoints de soporte para poblar los filtros

El sistema SHALL exponer endpoints de solo lectura protegidos por sesión autenticada para poblar los combos de filtro de la Agenda: listado de médicos (usuarios con rol Médico), listado de especialidades y búsqueda/hidratación de pacientes (ver requirement dedicado).

#### Scenario: Listado de médicos para el filtro

- **WHEN** un usuario autenticado solicita el listado de médicos
- **THEN** el sistema devuelve únicamente usuarios con rol Médico, con su id, nombre y apellido

#### Scenario: Listado de especialidades para el filtro

- **WHEN** un usuario autenticado solicita el listado de especialidades
- **THEN** el sistema devuelve todas las especialidades con su id y nombre
