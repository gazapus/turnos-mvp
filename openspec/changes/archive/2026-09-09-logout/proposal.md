## Why

El shell autenticado muestra un control de perfil que solo registra el click en consola. El backend ya puede cerrar sesión (`POST /api/auth/logout`), pero el usuario no tiene forma de hacerlo desde la UI y queda atrapado en el panel hasta que expire la cookie.

## What Changes

- El click en el icono de usuario de la navbar abre un menú con la opción **Cerrar sesión** (sin pantalla ni ruta de perfil).
- Al activar esa opción el cliente llama al logout existente, elimina la cookie de sesión y redirige a `/login`.
- Si el logout falla, el usuario permanece autenticado en el panel y se informa el error (no se navega a login con la cookie aún vigente).
- Se retira el stub de `console.log` del control de perfil.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `app-shell`: el control de perfil deja de ser stub y expone un menú con **Cerrar sesión** que cierra la sesión y vuelve al login.

## Impact

- **Apps:** `apps/web` (`AppNavbar`, tests del shell, cliente `logoutRequest` ya existente).
- **API:** sin cambios de contrato; se reutiliza `POST /api/auth/logout`.
- **Fuera de alcance:** popup de perfil con datos (nombre, mail, rol, especialidades), confirmación extra antes de salir, invalidación de JWT en servidor, vaciar `localStorage` del sidebar.
