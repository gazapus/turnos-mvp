## Context

El control de perfil de `AppNavbar` es un stub (`console.log`). `POST /api/auth/logout` y `logoutRequest()` ya existen: limpian la cookie `httpOnly` de sesión. El middleware redirige a `/login` cuando no hay cookie. `FeedbackProvider` envuelve el contenido y el chatbot, no la navbar.

## Goals / Non-Goals

**Goals:**

- Abrir un menú al click del icono de usuario con la opción **Cerrar sesión**.
- Cerrar sesión vía el endpoint existente y llevar al usuario a `/login`.
- Informar el error y no navegar si el logout falla (la cookie seguiría vigente y el middleware rebotaría).

**Non-Goals:**

- Pantalla o popup de perfil (mail, rol, especialidades).
- Confirmación extra antes de salir.
- Revocar el JWT en servidor (la sesión sigue siendo la cookie).
- Borrar `localStorage` del sidebar u otras preferencias de UI.

## Decisions

### 1. Menú mínimo en `AppNavbar`, sin librería de dropdown

Un popover local (estado abierto/cerrado, click afuera, Escape) junto al icono. No hay `DropdownMenu` en el design system y no justifica una dependencia nueva.

Alternativa descartada: ruta `/perfil` o dialog modal. El pedido es una opción al click del icono.

### 2. Logout inmediato: `logoutRequest` → `replace('/login')` + `refresh()`

Orden: esperar el 204, después navegar. `refresh()` hace que el middleware vea la cookie ya borrada. Desmontar el shell cierra EventSource de sala de espera y los QueryClient acotados a agenda/consultorios.

Alternativa descartada: navegar primero (rebote a panel si la cookie sigue) o `location.assign` sin esperar el POST.

### 3. Error con el dialog genérico; subir `FeedbackProvider`

Hoy la navbar está fuera del provider. El cambio envuelve navbar + contenido + chatbot para que el logout pueda usar `showError` sin un canal ad-hoc.

Alternativa descartada: texto de error solo dentro del menú (inconsistente con el resto del shell).

### 4. No tocar preferencias locales

`turnos-sidebar-collapsed` no es sesión. Limpiarlo no aporta seguridad y molesta al volver a entrar.

## Risks / Trade-offs

- [Logout OK pero navegación falla] → el usuario puede reintentar; la cookie ya no está; un refresh o ir a `/login` a mano alcanza.
- [JWT sigue válido 8 h si alguien copió el token] → diseño actual de auth; fuera de alcance invalidar en servidor.
- [Click afuera vs click en el icono] → toggle explícito y dismiss por Escape/overlay para no dejar el menú colgado.

## Migration Plan

Despliegue conjunto web. Rollback: revertir `AppNavbar` / `AppShell`; el endpoint de logout no cambia.

## Open Questions

Ninguna. El perfil completo de FUNCIONAL queda para un change posterior.
