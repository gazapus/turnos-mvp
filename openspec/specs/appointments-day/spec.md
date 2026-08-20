## Purpose

Modo de visualización Día de la Agenda de Turnos: grilla horaria de 24hs con turnos posicionados por hora y duración real, selector de fecha con navegación, y reutilización del layout, filtros y checkbox de cancelados ya definidos en `appointments-agenda`.

## Requirements

### Requirement: Grilla horaria de 24hs para el día seleccionado

El sistema SHALL renderizar, dentro del contenedor del modo de visualización Día de `/agenda`, una grilla horaria continua de 00:00 a 24:00 para la fecha seleccionada, mostrando los turnos de ese día como cards posicionadas verticalmente según su hora de inicio.

#### Scenario: Render inicial del modo Día

- **WHEN** un usuario activa la tab "Día" y existen turnos cargados para la fecha seleccionada que cumplen los filtros activos
- **THEN** el sistema muestra una grilla con las 24 horas del día y una card por cada turno, posicionada según su hora de inicio

#### Scenario: Día sin turnos

- **WHEN** la fecha seleccionada no tiene turnos que cumplan los filtros activos
- **THEN** el sistema muestra la grilla horaria vacía, sin cards y sin mensaje de error

### Requirement: Posicionamiento continuo por hora y duración real

El sistema SHALL posicionar cada card de turno en la grilla según su hora de inicio exacta y su duración real (diferencia entre inicio y fin del turno), de forma análoga a un calendario de eventos por día. Los turnos cuyos rangos horarios se superponen, total o parcialmente, MUST mostrarse en columnas de igual ancho pegadas entre sí, sin espacio vacío lateral entre columnas ni margen vacío antes de la primera columna, ocupando entre todas el ancho completo disponible de la grilla.

#### Scenario: Turnos sin superposición horaria

- **WHEN** dos turnos del día no se superponen en el tiempo
- **THEN** cada uno ocupa el ancho completo de la grilla en su franja horaria

#### Scenario: Turnos superpuestos

- **WHEN** dos o más turnos del día se superponen parcial o totalmente en el tiempo
- **THEN** el sistema los muestra en columnas de igual ancho, pegadas entre sí sin espacio vacío lateral, sin margen antes de la primera columna, y su altura refleja la duración real de cada turno

### Requirement: Contenido de la card de turno

Cada card de turno del modo Día SHALL mostrar: un ícono de médico junto al nombre y apellido del médico, un ícono de paciente junto al nombre y apellido del paciente, la pill de estado del turno y el ícono del tipo de turno. La pill MUST reutilizar el color y la forma ya definidos para el modo Lista. Cuando el ancho de la card es menor a 260px, el texto de la pill MUST reducirse a las primeras tres letras del label de estado (`PRO`, `CON`, `ATE`, `AUS`, `CAN`) y MUST mostrar un tooltip con el label completo. Cuando el ancho de la card es mayor o igual a 260px, la pill MUST mostrar el label completo. El color de la pill MUST no cambiar entre ambos modos. El ícono de tipo MUST conservar el mismo tooltip que el modo Lista.

#### Scenario: Datos visibles en la card

- **WHEN** el sistema renderiza la card de un turno en el modo Día
- **THEN** la card muestra el ícono y el nombre completo del médico, el ícono y el nombre completo del paciente, la pill del estado del turno y el ícono del tipo de turno

#### Scenario: Tooltip del ícono de tipo reutilizado

- **WHEN** el usuario posiciona el cursor sobre el ícono de tipo de una card del modo Día
- **THEN** el sistema muestra el mismo texto de tooltip que usa el modo Lista para ese tipo de turno

#### Scenario: Pill completa en card ancha

- **WHEN** el ancho de una card de turno en el modo Día es mayor o igual a 260px
- **THEN** la pill muestra el label completo del estado (Programado, Confirmado, Atendido, Ausente o Cancelado)

#### Scenario: Pill compacta en card angosta

- **WHEN** el ancho de una card de turno en el modo Día es menor a 260px
- **THEN** la pill muestra únicamente las primeras tres letras del label de ese estado: PRO, CON, ATE, AUS o CAN

#### Scenario: Tooltip de la pill compacta

- **WHEN** la pill está en modo compacto y el usuario posiciona el cursor sobre ella
- **THEN** el sistema muestra un tooltip con el label completo del estado

### Requirement: Color de card asociado al estado del turno

Cada card SHALL usar un color de fondo claro derivado del color de la pill de su estado, distinto para cada uno de los 5 estados de turno.

#### Scenario: Color por estado

- **WHEN** un turno tiene un estado determinado (Programado, Confirmado, Atendido, Ausente o Cancelado)
- **THEN** la card se muestra con un color de fondo claro asociado únicamente a ese estado, derivado del color de la pill de ese mismo estado

### Requirement: Fondo del contenedor de la vista Día

El contenedor de la grilla del modo Día SHALL usar el mismo efecto visual de blur y opacidad (`glass-panel-agenda`) que el contenedor de la grilla del modo Lista.

#### Scenario: Fondo con blur equivalente a Lista

- **WHEN** se muestra el modo Día
- **THEN** el contenedor de la grilla aplica el mismo blur y opacidad de fondo que el contenedor del modo Lista

### Requirement: Ancho mínimo del contenedor Día con scroll horizontal

El contenedor de visualización del modo Día SHALL tener el mismo ancho mínimo que el modo Lista (`960px`). Cuando el viewport es más estrecho que ese piso, el sistema MUST permitir scroll horizontal del contenedor en lugar de recortar la grilla.

#### Scenario: Viewport más ancho que el piso

- **WHEN** el área disponible para el modo Día es de 960px o más
- **THEN** la grilla ocupa el ancho disponible y no aparece scroll horizontal forzado por el piso

#### Scenario: Viewport más estrecho que el piso

- **WHEN** el área disponible para el modo Día es menor a 960px
- **THEN** el contenedor mantiene 960px de ancho mínimo y el usuario puede scrollear horizontalmente para ver la grilla completa

### Requirement: Selector de fecha con calendario y navegación manual

El sistema SHALL mostrar, centrado sobre la grilla del modo Día, un input de selección de fecha que muestra el valor en formato "{día} {mes} {año}" (ej. "16 agosto 2026), acompañado de dos botones flecha (día anterior / día siguiente). Al activar el input SHALL abrirse un calendario emergente para elegir el día, y el input MUST también aceptar el ingreso manual de una fecha en formato `DD/MM/YYYY`.

#### Scenario: Formato de visualización del input

- **WHEN** hay una fecha seleccionada en el modo Día
- **THEN** el input muestra esa fecha con el formato "{número de día} {nombre de mes} {año}"

#### Scenario: Selección de fecha desde el calendario emergente

- **WHEN** el usuario activa el input de fecha y elige un día en el calendario que se despliega
- **THEN** el sistema actualiza el input con la fecha elegida y cierra el calendario

#### Scenario: Ingreso manual de fecha válida

- **WHEN** el usuario escribe en el input una fecha válida en formato `DD/MM/YYYY`
- **THEN** el sistema interpreta esa fecha como la fecha seleccionada del modo Día

### Requirement: Navegación de un día a la vez con flechas y botón HOY

Los botones flecha SHALL avanzar o retroceder la fecha seleccionada en exactamente un día. El sistema SHALL mostrar un botón "HOY" en la esquina superior derecha del bloque de visualización, que MUST establecer la fecha seleccionada al día actual.

#### Scenario: Avanzar un día

- **WHEN** el usuario activa la flecha de avanzar
- **THEN** el sistema incrementa la fecha seleccionada en un día y actualiza el input con la nueva fecha

#### Scenario: Retroceder un día

- **WHEN** el usuario activa la flecha de retroceder
- **THEN** el sistema decrementa la fecha seleccionada en un día y actualiza el input con la nueva fecha

#### Scenario: Botón HOY

- **WHEN** el usuario activa el botón "HOY"
- **THEN** el sistema establece la fecha seleccionada al día actual y actualiza el input en consecuencia

### Requirement: Cambiar la fecha dispara una nueva consulta al backend

Cualquier cambio de fecha seleccionada (input, calendario emergente, flechas o botón HOY) SHALL disparar una nueva consulta al backend acotada a la nueva fecha, respetando los filtros de médico/especialidad/paciente activos.

#### Scenario: Nueva consulta al cambiar de fecha

- **WHEN** la fecha seleccionada cambia por cualquiera de los mecanismos de navegación
- **THEN** el sistema consulta al backend los turnos de la nueva fecha con los filtros actualmente activos

### Requirement: Consulta de turnos del día sin límite de resultados

El sistema SHALL obtener los turnos a mostrar en el modo Día consultando el mismo endpoint `GET /api/turnos` que usa el modo Lista, agregando el filtro de fecha correspondiente, y MUST solicitar todos los turnos de ese día sin límite de cantidad de resultados.

#### Scenario: Todos los turnos del día se muestran

- **WHEN** la fecha seleccionada tiene más de 30 turnos que cumplen los filtros activos
- **THEN** el sistema muestra en la grilla la totalidad de esos turnos, sin paginar ni truncar el resultado

### Requirement: Scroll de la grilla horaria anclado a las 8am

Al cargar el modo Día o al cambiar de fecha, el sistema SHALL posicionar automáticamente el scroll de la grilla en las 8:00, permitiendo al usuario scrollear libremente hacia atrás para ver las horas previas y hacia adelante hasta el final del día. El sistema MUST no avanzar automáticamente al día siguiente al llegar el scroll al final de las 24hs.

#### Scenario: Posición inicial en las 8am

- **WHEN** se carga el modo Día para una fecha, ya sea al entrar por primera vez o tras cambiar de fecha
- **THEN** el scroll de la grilla se posiciona de forma que las 8:00 quedan visibles al inicio del área visible

#### Scenario: Scroll libre en las 24hs

- **WHEN** el usuario scrollea la grilla hacia arriba o hacia abajo
- **THEN** el sistema permite ver cualquier hora entre las 00:00 y las 24:00 del día seleccionado

#### Scenario: El scroll no avanza de día automáticamente

- **WHEN** el usuario scrollea hasta el final de la grilla (las 24:00 del día seleccionado)
- **THEN** el sistema no cambia la fecha seleccionada ni consulta turnos de otro día

### Requirement: El checkbox de "Cancelados" aplica al modo Día sin refetch

El checkbox "Cancelados" del layout compartido de la Agenda SHALL alternar la visibilidad de los turnos en estado Cancelado ya cargados en el modo Día, sin disparar ninguna consulta adicional al backend.

#### Scenario: Ocultar cancelados en el modo Día

- **WHEN** el usuario desmarca el checkbox "Cancelados" mientras el modo Día está activo
- **THEN** el sistema oculta las cards de turnos en estado Cancelado ya cargadas, sin realizar una nueva consulta al backend

#### Scenario: Mostrar cancelados en el modo Día

- **WHEN** el usuario marca el checkbox "Cancelados" mientras el modo Día está activo
- **THEN** el sistema muestra las cards de turnos en estado Cancelado ya cargadas, sin realizar una nueva consulta al backend
