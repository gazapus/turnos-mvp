## 1. Shell — menú de perfil

- [x] 1.1 Envolver navbar, contenido y chatbot con `FeedbackProvider` en `AppShell`
- [x] 1.2 Reemplazar el stub de `AppNavbar`: toggle de menú anclado al icono, opción "Cerrar sesión", dismiss por Escape y click afuera; sin `console.log` de producto
- [x] 1.3 Al activar "Cerrar sesión": `logoutRequest()`, `router.replace('/login')` y `refresh()` solo si el POST responde éxito; si falla, `showError` y permanecer en el panel

## 2. Tests

- [x] 2.1 Tests de navbar: click abre el menú con "Cerrar sesión"; segundo click lo cierra; no navega a una ruta de perfil
- [x] 2.2 Tests de logout: éxito llama a `logoutRequest` y redirige a `/login`; fallo muestra el dialog de error y no redirige

## 3. Cierre

- [x] 3.1 Lint y tests de `@turnos/web` en verde para los archivos tocados
