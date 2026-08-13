## Purpose

Autenticación de usuarios internos (administrador, recepcionista, médico) mediante mail y contraseña, con sesión JWT en cookie httpOnly, bloqueo por intentos fallidos y redirección al panel del rol.

## Requirements

### Requirement: Login con mail y contraseña

El sistema SHALL autenticar usuarios activos mediante mail y contraseña. Las contraseñas MUST verificarse contra un hash Argon2 almacenado. Ante credenciales inválidas o cuenta inactiva, el sistema MUST responder con un error genérico que no revele si el mail existe.

#### Scenario: Login exitoso

- **WHEN** un usuario activo envía mail y contraseña correctos y no está bloqueado
- **THEN** el sistema emite una sesión JWT en cookie `httpOnly` y devuelve los datos públicos del usuario (id, mail, nombre, apellido, rol)

#### Scenario: Credenciales inválidas

- **WHEN** el mail o la contraseña son incorrectos
- **THEN** el sistema rechaza el login con un mensaje genérico e incrementa el contador de intentos fallidos para esa combinación mail + IP

#### Scenario: Cuenta inactiva

- **WHEN** el mail corresponde a un usuario con `activo = false`
- **THEN** el sistema rechaza el login con el mismo mensaje genérico que credenciales inválidas

### Requirement: Sesión JWT en cookie httpOnly

El sistema SHALL mantener la sesión del usuario en una cookie `httpOnly` que contenga un JWT firmado. La cookie MUST no ser accesible desde JavaScript del navegador. El cliente autenticado MUST poder consultar su sesión actual.

#### Scenario: Consultar sesión activa

- **WHEN** un cliente autenticado solicita su sesión (`me`)
- **THEN** el sistema devuelve los datos públicos del usuario asociado al JWT

#### Scenario: Sesión ausente o inválida

- **WHEN** un cliente sin cookie válida solicita recursos protegidos o `me`
- **THEN** el sistema responde no autorizado

### Requirement: Cerrar sesión

El sistema SHALL permitir cerrar la sesión eliminando o invalidando la cookie de autenticación.

#### Scenario: Logout

- **WHEN** un usuario autenticado solicita cerrar sesión
- **THEN** el sistema elimina la cookie de sesión y las peticiones posteriores se tratan como no autenticadas

### Requirement: Bloqueo por intentos fallidos mail + IP

El sistema SHALL limitar intentos fallidos de login a un máximo de 3 por combinación mail + IP. Al alcanzar el tercer fallo, el sistema MUST bloquear nuevos intentos para esa combinación durante 10 minutos. Los intentos y bloqueos MUST persistirse de forma auditable.

#### Scenario: Primer y segundo fallo

- **WHEN** ocurren el primer o segundo intento fallido para un mail + IP
- **THEN** el sistema registra el intento, muestra error genérico y permite reintentar

#### Scenario: Tercer fallo dispara bloqueo

- **WHEN** ocurre el tercer intento fallido para un mail + IP dentro de la ventana de conteo
- **THEN** el sistema registra un bloqueo de 10 minutos para esa combinación mail + IP

#### Scenario: Intento durante bloqueo activo

- **WHEN** un cliente intenta login con un mail + IP aún bloqueado
- **THEN** el sistema rechaza el intento sin validar la contraseña y comunica que el acceso está temporalmente bloqueado

#### Scenario: Bloqueo expirado

- **WHEN** han pasado al menos 10 minutos desde el inicio del bloqueo
- **THEN** el sistema permite nuevos intentos de login para esa combinación mail + IP

### Requirement: Redirección al panel según rol

Tras un login exitoso, el cliente MUST redirigir al usuario al panel correspondiente a su rol: administrador → gestión de usuarios; recepcionista → agenda; médico → agenda propia.

#### Scenario: Redirect administrador

- **WHEN** un usuario con rol administrador inicia sesión correctamente
- **THEN** el cliente lo redirige a la ruta de gestión de usuarios

#### Scenario: Redirect recepcionista

- **WHEN** un usuario con rol recepcionista inicia sesión correctamente
- **THEN** el cliente lo redirige a la ruta de agenda

#### Scenario: Redirect médico

- **WHEN** un usuario con rol médico inicia sesión correctamente
- **THEN** el cliente lo redirige a la ruta de agenda propia

### Requirement: Pantalla de login

El sistema SHALL exponer una pantalla de inicio de sesión responsive (desktop-first) con campos de correo electrónico y contraseña, acción de envío, y mensaje de contacto al administrador (sin recuperación autogestionada de contraseña). La UI MUST seguir el diseño de referencia Stitch acordado y consumir únicamente tokens visuales semánticos del tema.

#### Scenario: Render de login sin sesión

- **WHEN** un visitante sin sesión activa abre la ruta de login
- **THEN** el sistema muestra el formulario de credenciales alineado al diseño de referencia

#### Scenario: Sin auto-recuperación de contraseña

- **WHEN** el usuario visualiza la pantalla de login
- **THEN** no existe flujo de “olvidé mi contraseña”; solo se indica contactar al administrador
