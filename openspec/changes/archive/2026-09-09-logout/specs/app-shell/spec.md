## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Cerrar sesión desde el menú de perfil

El sistema SHALL cerrar la sesión cuando el usuario autenticado activa "Cerrar sesión" en el menú de perfil. MUST llamar a `POST /api/auth/logout`, MUST NOT pedir confirmación, y MUST redirigir a la ruta de login solo tras un cierre exitoso. Si la petición falla, MUST mostrar el dialog de error genérico, MUST permanecer en el panel autenticado y MUST NOT asumir que la sesión terminó.

#### Scenario: Logout exitoso vuelve al login

- **WHEN** el usuario activa "Cerrar sesión" y el backend responde éxito
- **THEN** el sistema elimina la cookie de sesión y muestra la pantalla de login

#### Scenario: Logout fallido no abandona el panel

- **WHEN** el usuario activa "Cerrar sesión" y la petición falla
- **THEN** el sistema muestra el dialog de error genérico y el usuario sigue en el shell autenticado
