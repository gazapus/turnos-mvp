## Purpose

Modo de visualización Lista de la Agenda: grilla de turnos con paginación por cursor solo hacia adelante, representación visual de estado y tipo, acciones por rol (Confirmar ejecuta la transición de `appointments-confirm`; Cancelar, Llamar y Finalizar siguen stubs), contrato de backend `GET /api/turnos` y endpoints de soporte para filtros.

## Requirements

### Requirement: Columnas del modo de visualización Lista

El sistema SHALL mostrar, en el modo de visualización Lista, una grilla de turnos con las columnas: fecha, hora, paciente, doctor, especialidad, estado, tipo y acciones. Cada fila MUST representar un turno real obtenido del backend.

#### Scenario: Render de una fila de turno

- **WHEN** el backend devuelve un turno dentro del rango consultado
- **THEN** la grilla muestra una fila con su fecha, hora, nombre y apellido del paciente, nombre del médico, nombre de la especialidad, estado, tipo y los botones de acción correspondientes al rol del usuario

### Requirement: Representación visual del estado del turno

El sistema SHALL representar el estado de cada turno como una pill con el texto del estado, con un color distinto para cada uno de los 5 estados: Programado, Confirmado, Atendido, Ausente y Cancelado.

#### Scenario: Pill de estado por cada valor

- **WHEN** un turno tiene estado Programado, Confirmado, Atendido, Ausente o Cancelado
- **THEN** la celda de estado muestra una pill con el texto de ese estado y un color distintivo asociado únicamente a ese estado

### Requirement: Representación visual del tipo de turno

El sistema SHALL representar el tipo de cada turno mediante un ícono en la columna "Tipo", agrupado en tres categorías visuales: primer turno (ícono "1" en rombo), control (ícono "C" en círculo) y urgencia/sobreturno (ícono "!" en triángulo amarillo). Los tipos de turno `SOBRETURNO` y `URGENTE` MUST representarse con el mismo ícono de urgencia/sobreturno. Cada ícono MUST incluir un tooltip que indique el tipo de turno que representa.

#### Scenario: Ícono de primer turno

- **WHEN** un turno tiene tipo Primer Turno
- **THEN** la celda de tipo muestra el ícono de rombo con "1" y un tooltip indicando "Primer turno"

#### Scenario: Ícono de control

- **WHEN** un turno tiene tipo Control
- **THEN** la celda de tipo muestra el ícono de círculo con "C" y un tooltip indicando "Control"

#### Scenario: Ícono de urgencia o sobreturno

- **WHEN** un turno tiene tipo Sobreturno o Urgente
- **THEN** la celda de tipo muestra el ícono de triángulo amarillo con "!" y un tooltip indicando "Urgencia o sobreturno"

### Requirement: Botones de acción por rol

El sistema SHALL mostrar en la columna "Acciones" icon-buttons según el rol del usuario autenticado. Recepcionista y Administrador ven Cancelar (X roja) en toda fila, y Confirmar (check) solo cuando el turno está `PROGRAMADO` y su fecha civil de clínica es hoy; Médico ve Llamar (teléfono) y Finalizar (check verde) en toda fila. Cada botón visible MUST mostrar un tooltip con su nombre de acción. Confirmar MUST ejecutar la transición de `appointments-confirm`. Cancelar, Llamar y Finalizar MUST permanecer stubs (no llaman al backend).

#### Scenario: Acciones para recepcionista o administrador en un programado de hoy

- **WHEN** un usuario con rol Recepcionista o Administrador visualiza una fila de turno `PROGRAMADO` con fecha civil de hoy
- **THEN** la columna de acciones muestra los botones Confirmar y Cancelar, con tooltips "Confirmar paciente" y "Cancelar turno" respectivamente

#### Scenario: Acciones para recepcionista sin Confirmar fuera de regla

- **WHEN** un usuario con rol Recepcionista o Administrador visualiza una fila que no está `PROGRAMADO` o cuya fecha civil no es hoy
- **THEN** la columna de acciones muestra Cancelar y no muestra Confirmar

#### Scenario: Acciones para médico

- **WHEN** un usuario con rol Médico visualiza una fila de turno
- **THEN** la columna de acciones muestra los botones Llamar y Finalizar, con tooltips "Llamar al paciente" y "Finalizar turno" respectivamente

#### Scenario: Click en Cancelar, Llamar o Finalizar no ejecuta nada

- **WHEN** el usuario activa Cancelar, Llamar o Finalizar en la columna de acciones
- **THEN** el sistema no cambia el estado del turno ni realiza ninguna llamada al backend

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

### Requirement: Contrato de backend para el listado de turnos

El sistema SHALL exponer `GET /api/turnos` protegido por sesión autenticada (cualquier rol), que acepta filtros por médico, especialidad, paciente y `soloPendientes`, un filtro opcional de fecha exacta, y paginación por cursor. La respuesta MUST incluir únicamente los campos necesarios para el listado: id, fecha, hora, hora de fin, datos mínimos de paciente (nombre, apellido), médico (nombre, apellido) y especialidad (nombre), estado y tipo. Las respuestas MUST no cachearse (sin encabezados de caché HTTP que permitan servir una respuesta obsoleta).

#### Scenario: Acceso sin sesión

- **WHEN** una solicitud a `GET /api/turnos` no incluye una sesión válida
- **THEN** el sistema responde con error de no autorizado y no devuelve turnos

#### Scenario: Respuesta con DTO mínimo

- **WHEN** un usuario autenticado consulta `GET /api/turnos`
- **THEN** cada turno de la respuesta expone únicamente id, fecha, hora, hora de fin, paciente (nombre y apellido), médico (nombre y apellido), especialidad (nombre), estado y tipo, sin exponer campos internos de la entidad

### Requirement: Filtro soloPendientes en GET /api/turnos

El sistema SHALL aceptar en `GET /api/turnos` un query param booleano `soloPendientes`. Cuando es `true`, la respuesta MUST incluir únicamente turnos en estado `PROGRAMADO` o `CONFIRMADO`. Cuando es `false` o está ausente, MUST no filtrar por estado. El param `incluirCancelados` MUST no aceptarse.

#### Scenario: Solo pendientes activos

- **WHEN** un usuario autenticado consulta `GET /api/turnos` con `soloPendientes=true`
- **THEN** el sistema no devuelve turnos en estado `ATENDIDO`, `AUSENTE` ni `CANCELADO`

#### Scenario: Todos los estados

- **WHEN** un usuario autenticado consulta `GET /api/turnos` con `soloPendientes=false` o sin el param
- **THEN** el sistema incluye turnos de cualquier estado que cumplan el resto de los filtros

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

### Requirement: Un médico solo accede a sus propios turnos

El sistema SHALL forzar, en el backend, que un usuario con rol Médico solo pueda recibir turnos donde él es el médico asignado, sin importar el valor de `medicoId` recibido en la solicitud.

#### Scenario: Médico intenta consultar turnos de otro médico

- **WHEN** un usuario con rol Médico envía `GET /api/turnos` con un `medicoId` distinto al propio
- **THEN** el sistema ignora ese valor y devuelve únicamente turnos donde el médico autenticado es el médico asignado

#### Scenario: Médico sin filtro de médico

- **WHEN** un usuario con rol Médico envía `GET /api/turnos` sin `medicoId`
- **THEN** el sistema devuelve únicamente turnos donde el médico autenticado es el médico asignado

### Requirement: Endpoints de soporte para poblar los filtros

El sistema SHALL exponer endpoints de solo lectura protegidos por sesión autenticada para poblar los combos de filtro de la Agenda: listado de médicos (usuarios con rol Médico), listado de especialidades y búsqueda/hidratación de pacientes (ver requirement dedicado).

#### Scenario: Listado de médicos para el filtro

- **WHEN** un usuario autenticado solicita el listado de médicos
- **THEN** el sistema devuelve únicamente usuarios con rol Médico, con su id, nombre y apellido

#### Scenario: Listado de especialidades para el filtro

- **WHEN** un usuario autenticado solicita el listado de especialidades
- **THEN** el sistema devuelve todas las especialidades con su id y nombre

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

### Requirement: Datos de desarrollo para ejercitar el listado

El sistema SHALL proveer, vía el script de seed del paquete de base de datos, un conjunto de datos de desarrollo que permita ejercitar el modo Lista contra datos reales: al menos 5 médicos, 3 especialidades, 10 pacientes y al menos 100 turnos, distribuidos entre los tipos y estados de turno definidos.

#### Scenario: Ejecutar el seed de desarrollo

- **WHEN** se ejecuta el script de seed del paquete de base de datos
- **THEN** la base de datos queda con al menos 5 médicos, 3 especialidades, 10 pacientes y al menos 100 turnos, cubriendo los distintos tipos y estados de turno

### Requirement: Click en fila abre el detalle de turno

El sistema SHALL abrir el popup de detalle al hacer click en una fila del modo Lista, para cualquier rol autenticado que pueda ver esa fila. El popup MUST ser el mismo de `appointments-form`, con título "Detalle de Turno" y carga abortable. El click en un botón de la columna Acciones MUST NOT abrir el popup. El click en Confirmar MUST ejecutar la confirmación de `appointments-confirm`. El click en Cancelar, Llamar o Finalizar MUST NOT cambiar el estado del turno.

#### Scenario: Click en fila abre Detalle de Turno

- **WHEN** el usuario hace click en una celda de una fila de turno (fuera de la columna Acciones)
- **THEN** se abre el popup con título "Detalle de Turno" y se solicita el detalle al backend

#### Scenario: Click en Acciones no abre el popup

- **WHEN** el usuario activa un botón de la columna Acciones
- **THEN** el sistema no abre el popup de turno
