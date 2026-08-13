## Purpose

Layout autenticado compartido de la aplicación web: fondo fijo, navbar, sidebar de navegación por rol (colapsable y responsive) y acceso stub al chatbot de ayuda.

## Requirements

### Requirement: Shell autenticado en rutas de panel

El sistema SHALL renderizar un layout compartido (fondo fijo, navbar superior, sidebar y botón de ayuda) en las rutas autenticadas del menú de la aplicación. La pantalla de login MUST permanecer fuera de este layout.

#### Scenario: Panel autenticado muestra shell

- **WHEN** un usuario autenticado abre una ruta de panel del menú (p. ej. agenda u usuarios)
- **THEN** el sistema muestra navbar, sidebar, fondo de aplicación y botón de ayuda junto al contenido de la página

#### Scenario: Login sin shell

- **WHEN** un visitante abre la ruta de login
- **THEN** el sistema no muestra el sidebar ni el botón de ayuda del shell autenticado

### Requirement: Fondo fijo de aplicación

El sistema SHALL mostrar una imagen de fondo fija en todas las pantallas que usan el shell autenticado, de modo que el fondo se mantenga al navegar entre paneles.

#### Scenario: Fondo consistente entre paneles

- **WHEN** el usuario autenticado navega de un ítem del menú a otro dentro del shell
- **THEN** el mismo fondo de aplicación permanece visible detrás del contenido

### Requirement: Navbar con identidad y usuario

El sistema SHALL mostrar en la navbar el logo icono de la clínica a la izquierda (en viewport desktop) y, a la derecha, el nombre del usuario autenticado junto a un control de perfil con icono de usuario. En viewports pequeños el nombre del usuario MUST ocultarse y solo MUST mostrarse el control de perfil. El control de perfil MUST aceptar interacción y, en esta versión, solo registrar la acción en consola (sin abrir perfil real).

#### Scenario: Navbar en desktop

- **WHEN** un usuario autenticado visualiza el shell en viewport desktop
- **THEN** ve el logo icono a la izquierda y el nombre de usuario más el botón de perfil a la derecha

#### Scenario: Navbar en mobile

- **WHEN** un usuario autenticado visualiza el shell en viewport pequeño
- **THEN** el nombre de usuario no se muestra y solo permanece el botón de perfil a la derecha

#### Scenario: Click en perfil stub

- **WHEN** el usuario activa el control de perfil
- **THEN** el sistema no navega a otra ruta de perfil y registra la acción en consola

### Requirement: Sidebar colapsable con glass

El sistema SHALL mostrar un sidebar lateral izquierdo con efecto glass coherente con el diseño de referencia. En desktop el sidebar MUST poder expandirse y colapsarse a demanda: expandido muestra logo completo y etiquetas de menú; colapsado muestra logo icono e iconos de menú sin etiquetas.

#### Scenario: Sidebar expandido

- **WHEN** el sidebar está expandido en desktop
- **THEN** muestra el logo completo y las etiquetas de las opciones de menú visibles para el rol

#### Scenario: Sidebar colapsado

- **WHEN** el usuario colapsa el sidebar en desktop
- **THEN** el sidebar reduce su ancho y muestra solo el logo icono y los iconos de las opciones de menú

### Requirement: Sidebar como drawer en mobile

En viewports pequeños el sidebar MUST no ocupar columna fija: el sistema SHALL exponer un control en la esquina superior izquierda que abre el menú en overlay (drawer). Al cerrarse, el menú MUST ocultarse de nuevo.

#### Scenario: Abrir menú mobile

- **WHEN** el usuario en viewport pequeño activa el control de menú superior izquierdo
- **THEN** el sistema muestra el sidebar en overlay con las opciones permitidas para su rol

#### Scenario: Cerrar menú mobile

- **WHEN** el usuario cierra el drawer (control de cierre o interacción de dismiss acordada)
- **THEN** el sidebar deja de mostrarse en overlay

### Requirement: Navegación por rol

El sistema SHALL mostrar en el sidebar únicamente las opciones de menú permitidas para el rol del usuario autenticado. Cada opción MUST navegar a una ruta distinta. La matriz de acceso MUST ser:

| Opción         | Ruta             | Roles                          |
| -------------- | ---------------- | ------------------------------ |
| Agenda         | `/agenda`        | ADMIN, RECEPCIONISTA, MEDICO   |
| Consultorios   | `/consultorios`  | ADMIN, RECEPCIONISTA           |
| Pacientes      | `/pacientes`     | ADMIN, RECEPCIONISTA           |
| Usuarios       | `/usuarios`      | ADMIN                          |
| Sala de espera | `/sala-espera`   | ADMIN, RECEPCIONISTA           |

#### Scenario: Menú de administrador

- **WHEN** un usuario con rol ADMIN visualiza el sidebar
- **THEN** ve Agenda, Consultorios, Pacientes, Usuarios y Sala de espera

#### Scenario: Menú de recepcionista

- **WHEN** un usuario con rol RECEPCIONISTA visualiza el sidebar
- **THEN** ve Agenda, Consultorios, Pacientes y Sala de espera, y no ve Usuarios

#### Scenario: Menú de médico

- **WHEN** un usuario con rol MEDICO visualiza el sidebar
- **THEN** ve únicamente Agenda entre las opciones de panel listadas

#### Scenario: Navegación a ruta del ítem

- **WHEN** el usuario activa una opción visible del menú
- **THEN** el cliente navega a la ruta asociada a esa opción

### Requirement: Agenda unificada sin ruta mi-agenda

El sistema SHALL exponer una única ruta de agenda (`/agenda`) para los roles que acceden a la agenda. La ruta `/mi-agenda` MUST no ser el destino de post-login ni un panel separado del shell.

#### Scenario: Médico usa agenda unificada

- **WHEN** un usuario con rol MEDICO elige Agenda en el menú o llega al home de su rol
- **THEN** el cliente lo lleva a `/agenda` y no a `/mi-agenda`

### Requirement: Botón AYUDA BOT

El sistema SHALL mostrar un botón fijo inferior derecho etiquetado como acceso al chatbot de ayuda (AYUDA BOT) en el shell autenticado. En esta versión el botón MUST aceptar interacción y solo registrar la acción en consola (sin abrir el chatbot).

#### Scenario: Click en AYUDA BOT stub

- **WHEN** el usuario autenticado activa el botón AYUDA BOT
- **THEN** el sistema no abre aún el chatbot y registra la acción en consola

### Requirement: Viewport sin scroll innecesario

En viewports grandes el shell MUST dimensionarse al alto de la ventana de forma que no aparezca scroll de página si el contenido del panel cabe en el área disponible. El scroll MUST limitarse al área de contenido cuando el contenido lo requiera.

#### Scenario: Contenido corto sin scroll de página

- **WHEN** un panel stub con poco contenido se muestra en desktop dentro del shell
- **THEN** no se genera scroll vertical de la ventana completa solo por la estructura del layout
