## Purpose

Layout autenticado compartido de la aplicación web: fondo fijo, navbar, sidebar de navegación por rol (colapsable y responsive) y acceso al chatbot de ayuda (AYUDA BOT).

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

El sistema SHALL mostrar en la navbar el logo icono de la clínica a la izquierda (en viewport desktop) y, a la derecha, el nombre del usuario autenticado junto a un control de perfil con icono de usuario. En viewports pequeños el nombre del usuario MUST ocultarse y solo MUST mostrarse el control de perfil. Activar el control MUST abrir o cerrar un menú anclado al icono. El menú MUST incluir la opción con texto "Cerrar sesión". MUST NOT navegar a una ruta de perfil.

#### Scenario: Navbar en desktop

- **WHEN** un usuario autenticado visualiza el shell en viewport desktop
- **THEN** ve el logo icono a la izquierda y el nombre de usuario más el botón de perfil a la derecha

#### Scenario: Navbar en mobile

- **WHEN** un usuario autenticado visualiza el shell en viewport pequeño
- **THEN** el nombre de usuario no se muestra y solo permanece el botón de perfil a la derecha

#### Scenario: Click abre el menú de sesión

- **WHEN** el usuario activa el control de perfil con el menú cerrado
- **THEN** el sistema muestra un menú con la opción "Cerrar sesión" y no navega a otra ruta

#### Scenario: Click cierra el menú de sesión

- **WHEN** el usuario activa el control de perfil con el menú abierto
- **THEN** el sistema oculta el menú

### Requirement: Cerrar sesión desde el menú de perfil

El sistema SHALL cerrar la sesión cuando el usuario autenticado activa "Cerrar sesión" en el menú de perfil. MUST llamar a `POST /api/auth/logout`, MUST NOT pedir confirmación, y MUST redirigir a la ruta de login solo tras un cierre exitoso. Si la petición falla, MUST mostrar el dialog de error genérico, MUST permanecer en el panel autenticado y MUST NOT asumir que la sesión terminó.

#### Scenario: Logout exitoso vuelve al login

- **WHEN** el usuario activa "Cerrar sesión" y el backend responde éxito
- **THEN** el sistema elimina la cookie de sesión y muestra la pantalla de login

#### Scenario: Logout fallido no abandona el panel

- **WHEN** el usuario activa "Cerrar sesión" y la petición falla
- **THEN** el sistema muestra el dialog de error genérico y el usuario sigue en el shell autenticado

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

| Opción         | Ruta            | Roles                        |
| -------------- | --------------- | ---------------------------- |
| Agenda         | `/agenda`       | ADMIN, RECEPCIONISTA, MEDICO |
| Consultorios   | `/consultorios` | ADMIN, RECEPCIONISTA         |
| Pacientes      | `/pacientes`    | ADMIN, RECEPCIONISTA         |
| Usuarios       | `/usuarios`     | ADMIN                        |
| Sala de espera | `/sala-espera`  | ADMIN, RECEPCIONISTA         |

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

El sistema SHALL mostrar un botón fijo inferior derecho etiquetado como acceso al chatbot de ayuda (AYUDA BOT) en el shell autenticado. Activar el botón MUST abrir o cerrar el panel del chatbot de documentación. El botón MUST permanecer en el shell autenticado y MUST NOT aparecer en login.

#### Scenario: Click abre el panel

- **WHEN** el usuario autenticado activa el botón AYUDA BOT con el panel cerrado
- **THEN** el sistema muestra el panel de chat de ayuda

#### Scenario: Click cierra el panel

- **WHEN** el usuario autenticado activa el botón AYUDA BOT con el panel abierto
- **THEN** el sistema oculta el panel de chat

#### Scenario: Login sin AYUDA BOT

- **WHEN** un visitante abre la ruta de login
- **THEN** el sistema no muestra el botón AYUDA BOT ni el panel del chatbot

### Requirement: Panel de chat de ayuda

El sistema SHALL mostrar, al abrir AYUDA BOT, un panel de conversación en el shell autenticado que permite escribir un mensaje, enviarlo al asistente y ver la respuesta en el hilo. Mientras espera MUST indicar que está procesando. Si el backend falla MUST mostrar el dialog de error genérico y MUST NOT perder el hilo ya visible. MUST NOT exigir toast de éxito cuando llega una respuesta.

#### Scenario: Envío y respuesta

- **WHEN** el usuario autenticado envía una pregunta desde el panel
- **THEN** el hilo muestra su mensaje y, al completar la petición, la respuesta del asistente

#### Scenario: Error de red o proveedor

- **WHEN** el envío falla con error HTTP
- **THEN** el sistema muestra el dialog de error genérico y el panel permanece abierto

### Requirement: Viewport sin scroll innecesario

En viewports grandes el shell MUST dimensionarse al alto de la ventana de forma que no aparezca scroll de página si el contenido del panel cabe en el área disponible. El scroll MUST limitarse al área de contenido cuando el contenido lo requiera.

#### Scenario: Contenido corto sin scroll de página

- **WHEN** un panel stub con poco contenido se muestra en desktop dentro del shell
- **THEN** no se genera scroll vertical de la ventana completa solo por la estructura del layout
