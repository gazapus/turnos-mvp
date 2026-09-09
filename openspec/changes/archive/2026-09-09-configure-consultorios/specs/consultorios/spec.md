## ADDED Requirements

### Requirement: Catálogo numerado de consultorios

El sistema SHALL persistir un catálogo de consultorios con número entero único y médico asignado opcional. Esta versión MUST NOT ofrecer alta, baja ni renumeración de consultorios en la UI. El despliegue inicial MUST incluir los números 1 a 20. El nombre de aviso público de un consultorio MUST ser `CONSULTORIO {numero}` en mayúsculas, derivado del número, sin persistir ese string.

#### Scenario: Listado inicial con veinte consultorios

- **WHEN** un Recepcionista o Administrador abre Consultorios en un entorno con el catálogo inicial
- **THEN** ve exactamente los consultorios numerados del 1 al 20 en orden ascendente

#### Scenario: Consultorio vacío forma parte del catálogo

- **WHEN** el consultorio 4 no tiene médico asignado
- **THEN** la fila del 4 se muestra igual, con el selector de médico vacío

### Requirement: Acceso de administración y recepción

El sistema SHALL permitir consultar y asignar consultorios a usuarios con rol Administrador o Recepcionista. Un usuario con rol Médico MUST NOT consultar ni modificar asignaciones.

#### Scenario: Recepcionista asigna

- **WHEN** un Recepcionista autentica y abre Consultorios
- **THEN** el sistema muestra el catálogo y acepta cambios de asignación

#### Scenario: Administrador asigna

- **WHEN** un Administrador autentica y abre Consultorios
- **THEN** el sistema muestra el catálogo y acepta cambios de asignación

#### Scenario: Médico no accede a la API

- **WHEN** un usuario con rol Médico solicita el listado o una asignación de consultorios
- **THEN** el sistema no cambia datos y responde que no está autorizado

### Requirement: Asignación 1 a 1 médico-consultorio

El sistema SHALL garantizar que un médico tiene a lo sumo un consultorio y que un consultorio tiene a lo sumo un médico. Asignar un médico que ya tenía otro consultorio MUST dejar el consultorio anterior vacío. Desasignar MUST dejar el consultorio sin médico. Un médico inactivo que ya estaba asignado MUST permanecer en esa fila; este change MUST NOT liberar consultorios por inactividad. MUST NOT permitir asignar de nuevo a un médico inactivo.

#### Scenario: Médico libre a consultorio vacío

- **WHEN** se asigna un médico sin consultorio a un consultorio vacío
- **THEN** ese consultorio queda con ese médico y el resto no cambia

#### Scenario: Mover médico libera el anterior

- **WHEN** Pérez está en el 3 y se lo asigna al 7 vacío
- **THEN** el 7 queda con Pérez y el 3 queda sin médico

#### Scenario: Reemplazar ocupante

- **WHEN** el 7 tiene a Gómez y se asigna a Pérez (sin consultorio)
- **THEN** el 7 queda con Pérez y Gómez queda sin consultorio

#### Scenario: Mover y desalojar

- **WHEN** Pérez está en el 3, el 7 tiene a Gómez, y se asigna Pérez al 7
- **THEN** el 7 queda con Pérez, el 3 queda vacío y Gómez queda sin consultorio

#### Scenario: Desasignar deja el consultorio vacío

- **WHEN** se desasigna el médico del consultorio 7
- **THEN** el 7 queda sin médico y ese médico no queda asignado a otro consultorio por esa acción

#### Scenario: Un médico no queda en dos consultorios

- **WHEN** termina una asignación válida
- **THEN** no existe más de un consultorio con el mismo médico

#### Scenario: Inactivo sigue ocupando la fila

- **WHEN** el médico asignado al 7 está inactivo
- **THEN** el 7 sigue mostrando a ese médico y no se libera solo

### Requirement: Contrato GET /api/consultorios

El sistema SHALL exponer `GET /api/consultorios` restringido a Administrador y Recepcionista, autenticado. En éxito MUST responder 200 con todos los consultorios, ordenados por número ascendente, cada uno con `id`, `numero` y `medico` (`id`, `nombre`, `apellido`) o `medico` nulo. MUST incluir el médico asignado aunque esté inactivo. MUST NOT paginar. Médico MUST recibir 403. No autenticado MUST recibir 401.

#### Scenario: Listado completo ordenado

- **WHEN** un Recepcionista envía `GET /api/consultorios`
- **THEN** la respuesta es 200 y los ítems vienen por `numero` ascendente sin cursor ni páginas

#### Scenario: Médico asignado inactivo se serializa

- **WHEN** el consultorio 7 tiene un médico inactivo
- **THEN** el ítem correspondiente incluye `medico` con id, nombre y apellido

#### Scenario: Médico recibe 403 al listar

- **WHEN** un usuario con rol Médico envía `GET /api/consultorios`
- **THEN** el sistema responde 403

### Requirement: Contrato PATCH /api/consultorios/:id

El sistema SHALL exponer `PATCH /api/consultorios/:id` con body `{ medicoId: string | null }` restringido a Administrador y Recepcionista. En éxito MUST aplicar la asignación 1:1 en una transacción y responder 200 con el snapshot completo del catálogo. `medicoId` nulo MUST desasignar. Si el médico ya está en ese consultorio, MUST ser 200 sin efecto colateral. Médico MUST recibir 403. No autenticado MUST recibir 401. Consultorio inexistente MUST responder 404. Si `medicoId` no es nulo y el usuario no existe, no es médico o no está activo, MUST responder 400 con un `message` legible.

#### Scenario: Asignación exitosa

- **WHEN** un Recepcionista envía `PATCH /api/consultorios/:id` con el id de un médico activo al consultorio vacío
- **THEN** la respuesta es 200 y ese consultorio figura con ese médico

#### Scenario: Desasignación exitosa

- **WHEN** un Recepcionista envía `PATCH` con `medicoId` nulo sobre un consultorio ocupado
- **THEN** la respuesta es 200 y ese consultorio figura sin médico

#### Scenario: Reasignación libera el consultorio previo

- **WHEN** un Recepcionista asigna al consultorio 7 un médico que estaba en el 3
- **THEN** el snapshot trae el 7 con ese médico y el 3 sin médico

#### Scenario: Médico recibe 403 al asignar

- **WHEN** un usuario con rol Médico envía `PATCH /api/consultorios/:id`
- **THEN** el sistema responde 403 y las asignaciones no cambian

#### Scenario: Médico inactivo no se puede asignar

- **WHEN** un Recepcionista envía `PATCH` con el id de un médico inactivo
- **THEN** el sistema responde 400 y el consultorio no cambia

### Requirement: Pantalla Consultorios

El sistema SHALL reemplazar el stub de `/consultorios` por el listado de asignación. MUST mostrar todos los consultorios existentes, ordenados por número, sin paginación. Cada fila MUST mostrar el número y un Combobox de médico equivalente al de la agenda (mismos tokens de input, borde y tipografía). El Combobox MUST listar médicos activos y la opción "Sin asignar". Los médicos ya asignados a otro consultorio MUST seguir disponibles para reasignar. Un médico inactivo asignado MUST verse como valor seleccionado de su fila y MUST NOT aparecer como opción en las demás.

#### Scenario: Filas del catálogo

- **WHEN** un Recepcionista abre `/consultorios` con 20 consultorios en BD
- **THEN** ve 20 filas numeradas de 1 a 20 cada una con un selector de médico

#### Scenario: Opción Sin asignar

- **WHEN** el usuario abre el Combobox de un consultorio ocupado
- **THEN** puede elegir "Sin asignar" además de los médicos activos

#### Scenario: Estilo alineado a la lista de turnos

- **WHEN** se renderiza una fila
- **THEN** el selector usa el mismo Combobox y tokens visuales que los filtros y la lista de la agenda

### Requirement: Confirmación al perder un consultorio

El sistema SHALL pedir confirmación warning (Aceptar / Cancelar, sin motivo) antes de persistir un cambio en el que un médico pierde su consultorio: mover, reemplazar ocupante, mover y desalojar, o desasignar. MUST aplicar de inmediato, sin dialog, cuando un médico libre se asigna a un consultorio vacío. MUST NOT persistir si el usuario cancela el dialog. Elegir el mismo médico ya asignado a esa fila MUST no pedir confirmación ni disparar un cambio. Tipear en el Combobox para filtrar MUST NOT desasignar.

#### Scenario: Hueco con médico libre es inmediato

- **WHEN** el usuario elige un médico sin consultorio en la fila de un consultorio vacío
- **THEN** el sistema persiste sin mostrar confirmación

#### Scenario: Mover pide confirmación

- **WHEN** Pérez está en el 3 y el usuario lo elige en el 7 vacío
- **THEN** el sistema muestra un warning de que Pérez ya está en el 3 y que el 3 quedará libre, y no persiste hasta Aceptar

#### Scenario: Reemplazar pide confirmación

- **WHEN** el 7 tiene a Gómez y el usuario elige a Pérez (sin consultorio)
- **THEN** el sistema muestra un warning de que el 7 está asignado a Gómez y que Gómez quedará sin consultorio, y no persiste hasta Aceptar

#### Scenario: Desasignar pide confirmación

- **WHEN** el usuario elige "Sin asignar" en un consultorio ocupado por Pérez
- **THEN** el sistema muestra un warning preguntando si desasignar a Pérez de ese consultorio, y no persiste hasta Aceptar

#### Scenario: Cancelar el warning no cambia datos

- **WHEN** el usuario activa Cancelar en el dialog de confirmación
- **THEN** las asignaciones permanecen igual y el Combobox vuelve a mostrar el médico anterior

### Requirement: Feedback de asignación

Tras una asignación o desasignación exitosa el sistema MUST NOT mostrar toast. Si la persistencia falla, MUST mostrar el dialog de error genérico (danger) con un mensaje amigable y el detalle del backend, y MUST dejar el Combobox con el valor anterior.

#### Scenario: Éxito silencioso

- **WHEN** una asignación termina en 200
- **THEN** la grilla refleja el snapshot y no aparece toast de éxito

#### Scenario: Error no pisa el valor

- **WHEN** el PATCH responde error
- **THEN** se muestra el dialog de error y la fila sigue con el médico que tenía antes del intento

### Requirement: Layout multi-columna sin paginación

El sistema SHALL mostrar todos los consultorios en columnas verticales (números de arriba hacia abajo, luego la columna de la derecha), con espacio entre columnas. MUST usar como máximo 3 columnas en viewport desktop (≥ 1024px), 2 en viewport mediano (≥ 768px y &lt; 1024px) y 1 en viewport chico (&lt; 768px). MUST calcular las columnas así: `C = min(máximo del viewport, max(1, ceil(N / 8)))`; si el reparto igualitario deja todas las columnas con al menos 8 filas o `C` es 1, MUST usar ese reparto (el resto a las primeras columnas); si no, MUST llenar `C - 1` columnas con 8 filas y poner el resto en la última. MUST NOT paginar.

#### Scenario: Cinco consultorios en cualquier viewport

- **WHEN** hay 5 consultorios
- **THEN** se muestra una sola columna de 5 filas en desktop, mediano y chico

#### Scenario: Diez consultorios en desktop

- **WHEN** hay 10 consultorios en viewport desktop
- **THEN** se muestran dos columnas, una de 8 filas (1–8) y otra de 2 filas (9–10)

#### Scenario: Veinte consultorios en desktop

- **WHEN** hay 20 consultorios en viewport desktop
- **THEN** se muestran tres columnas de 8, 8 y 4 filas

#### Scenario: Veinticinco consultorios en desktop

- **WHEN** hay 25 consultorios en viewport desktop
- **THEN** se muestran tres columnas de 9, 8 y 8 filas

#### Scenario: Treinta consultorios en mediano

- **WHEN** hay 30 consultorios en viewport mediano
- **THEN** se muestran dos columnas de 15 filas cada una

#### Scenario: Pantalla chica una columna

- **WHEN** hay 20 consultorios en viewport chico
- **THEN** se muestra una sola columna de 20 filas
