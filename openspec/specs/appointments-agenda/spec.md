## Purpose

Pantalla de Agenda de Turnos (`/agenda`): layout compartido entre modos de visualización, filtros por médico/especialidad/paciente, tabs de vista, checkbox de cancelados (solo cliente) y sincronización de estado con query params de la URL.

## Requirements

### Requirement: Layout de la pantalla de Agenda de Turnos

El sistema SHALL renderizar en la ruta `/agenda` un layout compartido por todos los modos de visualización de turnos, compuesto por: título "Agenda de Turnos", formulario de filtros, botón "Nuevo Turno" (según rol, ver requirement dedicado), tabs de modo de visualización, checkbox de "Cancelados" y un contenedor donde se monta el modo de visualización activo. Este layout MUST ser el mismo sin importar qué modo de visualización esté seleccionado.

#### Scenario: Render inicial de la Agenda

- **WHEN** un usuario autenticado (cualquier rol) abre `/agenda`
- **THEN** el sistema muestra el título "Agenda de Turnos", el formulario de filtros, las tabs Lista/Día/Semana/Mes y el checkbox "Cancelados"

#### Scenario: Layout estable entre modos de visualización

- **WHEN** el usuario cambia de tab de modo de visualización
- **THEN** el título, el formulario de filtros, el botón "Nuevo Turno" (si corresponde a su rol) y el checkbox "Cancelados" permanecen visibles y en la misma posición; solo cambia el contenido del contenedor de visualización

### Requirement: Botón "Nuevo Turno" visible solo para Recepcionista y Administrador

El sistema SHALL mostrar el botón "Nuevo Turno" únicamente a los roles Recepcionista y Administrador en el layout de Agenda. El rol Médico MUST no ver este botón. En esta etapa, cuando el botón es visible, MUST no disparar ninguna acción (sin navegación ni modal).

#### Scenario: Recepcionista o administrador ve el botón

- **WHEN** un usuario con rol Recepcionista o Administrador abre `/agenda`
- **THEN** el sistema muestra el botón "Nuevo Turno" en el layout

#### Scenario: Médico no ve el botón

- **WHEN** un usuario con rol Médico abre `/agenda`
- **THEN** el sistema no muestra el botón "Nuevo Turno" en el layout

#### Scenario: Click en Nuevo Turno stub

- **WHEN** un usuario con rol Recepcionista o Administrador activa el botón "Nuevo Turno"
- **THEN** el sistema no abre ningún formulario ni navega a otra ruta

### Requirement: Formulario de filtros por médico, especialidad y paciente

El sistema SHALL exponer un formulario de filtros con tres campos de selección — médico, especialidad, paciente — y un botón "Aplicar". Cada campo MUST incluir la opción "Todos" salvo que el rol del usuario lo restrinja (ver requirement de defaults por rol). El backend MUST solo ejecutarse al activar "Aplicar"; cambiar la selección de un campo sin aplicar MUST no disparar una consulta.

#### Scenario: Cambiar un filtro sin aplicar

- **WHEN** el usuario cambia la selección de médico, especialidad o paciente sin activar "Aplicar"
- **THEN** el sistema no realiza ninguna consulta al backend

#### Scenario: Aplicar filtros

- **WHEN** el usuario activa el botón "Aplicar"
- **THEN** el sistema ejecuta una nueva consulta al backend con la combinación de filtros seleccionada

### Requirement: Defaults de filtros según el rol del usuario

El sistema SHALL preseleccionar los filtros de la Agenda según el rol del usuario autenticado al cargar la pantalla sin filtros explícitos en la URL:

| Rol           | Médico                               | Especialidad | Paciente | Cancelados                    |
| ------------- | ------------------------------------ | ------------ | -------- | ----------------------------- |
| Recepcionista | Todos                                | Todos        | Todos    | Visible (marcado)             |
| Administrador | Todos                                | Todos        | Todos    | Visible (marcado)             |
| Médico        | Su propio usuario, campo no editable | Todos        | Todos    | Oculto (no marcado), editable |

#### Scenario: Defaults para recepcionista o administrador

- **WHEN** un usuario con rol Recepcionista o Administrador abre `/agenda` sin filtros en la URL
- **THEN** los tres filtros muestran "Todos" y el checkbox "Cancelados" aparece marcado

#### Scenario: Defaults para médico

- **WHEN** un usuario con rol Médico abre `/agenda` sin filtros en la URL
- **THEN** el filtro de médico muestra preseleccionado al propio usuario y no permite cambiarlo, los filtros de especialidad y paciente muestran "Todos" y editables, y el checkbox "Cancelados" aparece sin marcar

### Requirement: Filtros y modo de visualización sincronizados con la URL

El sistema SHALL reflejar los filtros aplicados y el modo de visualización activo como query params de la URL (`medicoId`, `especialidadId`, `pacienteId`, `cancelados`, `vista`). Al cargar la Agenda con query params presentes, el sistema MUST hidratar el formulario de filtros, el checkbox de cancelados y la tab activa a partir de esos valores, y la primera consulta al backend MUST ejecutarse con esos filtros. El modo de visualización ausente en la URL MUST interpretarse como `lista`.

#### Scenario: Acceso directo con filtros en la URL

- **WHEN** un usuario abre `/agenda` con query params de filtros y/o vista ya definidos
- **THEN** el formulario, el checkbox de cancelados y la tab activa reflejan esos valores, y la primera consulta al backend usa esos filtros

#### Scenario: Aplicar filtros actualiza la URL

- **WHEN** el usuario activa "Aplicar" con una combinación de filtros
- **THEN** la URL se actualiza con los query params correspondientes a esa combinación

#### Scenario: Vista ausente en la URL

- **WHEN** un usuario abre `/agenda` sin el query param de vista
- **THEN** el sistema activa el modo de visualización Lista por defecto

### Requirement: Tabs de modo de visualización

El sistema SHALL mostrar cuatro tabs — Lista, Día, Semana, Mes — que representan el modo de visualización de turnos. Seleccionar una tab MUST actualizar el query param de vista en la URL y montar el contenido correspondiente en el contenedor de visualización, sin recargar la página completa.

#### Scenario: Cambiar de tab

- **WHEN** el usuario activa una tab distinta a la actual
- **THEN** el sistema actualiza el query param de vista en la URL y muestra el contenido de esa vista en el contenedor, conservando los filtros actuales

#### Scenario: Vistas Día, Semana y Mes sin datos

- **WHEN** el usuario activa la tab Día, Semana o Mes
- **THEN** el sistema muestra un contenedor vacío para esa vista, sin consultar datos de turnos ni ofrecer interacción adicional

### Requirement: Checkbox de "Cancelados" es solo cliente

El sistema SHALL exponer un checkbox "Cancelados" que alterna la visibilidad de los turnos en estado Cancelado ya cargados en el modo de visualización activo. Activar o desactivar este checkbox MUST no disparar ninguna consulta al backend; solo debe afectar qué filas ya obtenidas se muestran.

#### Scenario: Marcar o desmarcar cancelados no refetchea

- **WHEN** el usuario cambia el estado del checkbox "Cancelados"
- **THEN** el sistema muestra u oculta las filas en estado Cancelado ya presentes en memoria, sin realizar ninguna nueva consulta al backend

#### Scenario: Cambiar cancelados actualiza la URL

- **WHEN** el usuario cambia el estado del checkbox "Cancelados"
- **THEN** el query param `cancelados` de la URL se actualiza para reflejar el nuevo valor
