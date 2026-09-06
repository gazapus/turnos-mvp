## ADDED Requirements

### Requirement: Combobox de filtros con búsqueda

Los campos médico, especialidad y paciente del formulario de filtros SHALL ser combobox tipeables. El usuario MUST poder filtrar las opciones al escribir; MUST seleccionar la opción resaltada con Enter, Tab o click. Enter y Tab sobre el listado MUST no disparar el submit de "Aplicar". El valor vacío MUST interpretarse como "Todos" y MUST mostrarse como placeholder del input, no como ítem del listado.

Médico y especialidad MUST cargar su catálogo completo al montar y filtrar en el cliente. Paciente MUST no cargar el padrón al montar: MUST consultar el backend solo cuando el texto ingresado tiene al menos 3 caracteres, MUST esperar 1 segundo sin nuevas teclas antes de disparar la petición, MUST mostrar como máximo 30 coincidencias y MUST etiquetar cada opción como `Apellido, Nombre` (sin documento). Si la URL incluye `pacienteId`, el combobox MUST hidratar la etiqueta consultando ese paciente por id.

#### Scenario: Selección por teclado

- **WHEN** el usuario abre el combobox de especialidad, escribe texto que deja una opción resaltada y presiona Enter o Tab
- **THEN** esa opción queda seleccionada y el sistema no consulta turnos hasta que se active "Aplicar"

#### Scenario: Paciente no busca con menos de 3 caracteres

- **WHEN** el usuario escribe menos de 3 caracteres en el combobox de paciente
- **THEN** el sistema no consulta el listado de pacientes

#### Scenario: Paciente busca tras debounce

- **WHEN** el usuario escribe al menos 3 caracteres en el combobox de paciente y permanece 1 segundo sin teclear
- **THEN** el sistema consulta el backend de pacientes con ese texto y muestra hasta 30 coincidencias cuyo nombre o apellido contienen el substring

#### Scenario: Hidratar paciente desde la URL

- **WHEN** un usuario abre `/agenda` con `pacienteId` en la URL
- **THEN** el combobox de paciente muestra `Apellido, Nombre` de ese paciente, obtenidos por id, sin listar el padrón completo

### Requirement: Botón de reset de filtros

El formulario de filtros SHALL incluir, al lado de "Aplicar", un botón de reset sin texto visible, con ícono de flecha en círculo, forma cuadrada del mismo alto que "Aplicar", fondo de superficie y borde e ícono de alto contraste. Activarlo MUST restablecer médico, especialidad, paciente y "Solo Pendientes" a los defaults del rol (el médico autenticado con rol Médico MUST permanecer seleccionado y no editable) y MUST disparar la consulta de turnos resultante. MUST no alterar la vista ni la fecha seleccionadas.

#### Scenario: Reset para recepcionista o administrador

- **WHEN** un usuario con rol Recepcionista o Administrador activa el botón de reset con filtros de médico, especialidad o paciente aplicados y "Solo Pendientes" marcado
- **THEN** los tres combobox quedan en "Todos", "Solo Pendientes" queda destildado y el sistema consulta turnos con esos defaults

#### Scenario: Reset para médico conserva su usuario

- **WHEN** un usuario con rol Médico activa el botón de reset
- **THEN** el filtro de médico sigue mostrando su propio usuario y no editable, especialidad y paciente quedan en "Todos", "Solo Pendientes" queda marcado y el sistema consulta turnos con esos defaults

### Requirement: Checkbox "Solo Pendientes" consulta el backend

El sistema SHALL exponer un checkbox "Solo Pendientes" en el layout de Agenda (misma posición que el antiguo "Cancelados"). Marcarlo MUST restringir los turnos a estados `PROGRAMADO` y `CONFIRMADO`. Desmarcarlo MUST incluir todos los estados. Activar o desactivar el checkbox MUST actualizar el query param `soloPendientes` y MUST disparar una nueva consulta al backend, mostrando el estado de carga de la vista activa.

#### Scenario: Marcar Solo Pendientes refetchea

- **WHEN** el usuario marca el checkbox "Solo Pendientes"
- **THEN** la URL incluye `soloPendientes=true` y el sistema consulta de nuevo los turnos pendientes, con indicador de carga

#### Scenario: Desmarcar Solo Pendientes refetchea

- **WHEN** el usuario desmarca el checkbox "Solo Pendientes"
- **THEN** la URL incluye `soloPendientes=false` y el sistema consulta de nuevo los turnos de todos los estados, con indicador de carga

## MODIFIED Requirements

### Requirement: Layout de la pantalla de Agenda de Turnos

El sistema SHALL renderizar en la ruta `/agenda` un layout compartido por todos los modos de visualización de turnos, compuesto por: título "Agenda de Turnos", formulario de filtros, botón "Nuevo Turno" (según rol, ver requirement dedicado), tabs de modo de visualización, checkbox de "Solo Pendientes" y un contenedor donde se monta el modo de visualización activo. Este layout MUST ser el mismo sin importar qué modo de visualización esté seleccionado.

#### Scenario: Render inicial de la Agenda

- **WHEN** un usuario autenticado (cualquier rol) abre `/agenda`
- **THEN** el sistema muestra el título "Agenda de Turnos", el formulario de filtros, las tabs Lista/Día/Semana/Mes y el checkbox "Solo Pendientes"

#### Scenario: Layout estable entre modos de visualización

- **WHEN** el usuario cambia de tab de modo de visualización
- **THEN** el título, el formulario de filtros, el botón "Nuevo Turno" (si corresponde a su rol) y el checkbox "Solo Pendientes" permanecen visibles y en la misma posición; solo cambia el contenido del contenedor de visualización

### Requirement: Formulario de filtros por médico, especialidad y paciente

El sistema SHALL exponer un formulario de filtros con tres combobox — médico, especialidad, paciente —, un botón "Aplicar" y un botón de reset. El valor vacío de cada combobox MUST significar "Todos", salvo que el rol del usuario lo restrinja (ver requirement de defaults por rol). Las consultas de turnos MUST ejecutarse al activar "Aplicar" o el reset; cambiar la selección de un campo sin aplicar MUST no disparar una consulta de turnos. Las peticiones de opciones del combobox de paciente (búsqueda e hidratación por id) MUST no considerarse consultas de turnos.

#### Scenario: Cambiar un filtro sin aplicar

- **WHEN** el usuario cambia la selección de médico, especialidad o paciente sin activar "Aplicar" ni el reset
- **THEN** el sistema no realiza ninguna consulta de turnos al backend

#### Scenario: Aplicar filtros

- **WHEN** el usuario activa el botón "Aplicar"
- **THEN** el sistema ejecuta una nueva consulta al backend con la combinación de filtros seleccionada

### Requirement: Defaults de filtros según el rol del usuario

El sistema SHALL preseleccionar los filtros de la Agenda según el rol del usuario autenticado al cargar la pantalla sin filtros explícitos en la URL:

| Rol           | Médico                               | Especialidad | Paciente | Solo Pendientes                          |
| ------------- | ------------------------------------ | ------------ | -------- | ---------------------------------------- |
| Recepcionista | Todos                                | Todos        | Todos    | Destildado (todos los estados)           |
| Administrador | Todos                                | Todos        | Todos    | Destildado (todos los estados)           |
| Médico        | Su propio usuario, campo no editable | Todos        | Todos    | Tildado (solo PROGRAMADO y CONFIRMADO)   |

#### Scenario: Defaults para recepcionista o administrador

- **WHEN** un usuario con rol Recepcionista o Administrador abre `/agenda` sin filtros en la URL
- **THEN** los tres filtros muestran "Todos" y el checkbox "Solo Pendientes" aparece destildado

#### Scenario: Defaults para médico

- **WHEN** un usuario con rol Médico abre `/agenda` sin filtros en la URL
- **THEN** el filtro de médico muestra preseleccionado al propio usuario y no permite cambiarlo, los filtros de especialidad y paciente muestran "Todos" y editables, y el checkbox "Solo Pendientes" aparece marcado

### Requirement: Filtros y modo de visualización sincronizados con la URL

El sistema SHALL reflejar los filtros aplicados y el modo de visualización activo como query params de la URL (`medicoId`, `especialidadId`, `pacienteId`, `soloPendientes`, `vista`). Al cargar la Agenda con query params presentes, el sistema MUST hidratar el formulario de filtros, el checkbox "Solo Pendientes" y la tab activa a partir de esos valores, y la primera consulta al backend MUST ejecutarse con esos filtros. El modo de visualización ausente en la URL MUST interpretarse como `lista`. El query param `cancelados` MUST ignorarse.

#### Scenario: Acceso directo con filtros en la URL

- **WHEN** un usuario abre `/agenda` con query params de filtros y/o vista ya definidos
- **THEN** el formulario, el checkbox "Solo Pendientes" y la tab activa reflejan esos valores, y la primera consulta al backend usa esos filtros

#### Scenario: Aplicar filtros actualiza la URL

- **WHEN** el usuario activa "Aplicar" con una combinación de filtros
- **THEN** la URL se actualiza con los query params correspondientes a esa combinación

#### Scenario: Vista ausente en la URL

- **WHEN** un usuario abre `/agenda` sin el query param de vista
- **THEN** el sistema activa el modo de visualización Lista por defecto

## REMOVED Requirements

### Requirement: Checkbox de "Cancelados" es solo cliente

**Reason**: Reemplazado por "Solo Pendientes", que filtra estados terminales en el backend y recarga la vista.

**Migration**: Usar el checkbox "Solo Pendientes" y el query param `soloPendientes`. El param `cancelados` se ignora.
