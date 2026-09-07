## Context

El modo Lista (`TurnosListado`) usa `useInfiniteQuery` bidireccional. La primera página del backend ya filtra `fechaInicio >= hoy 00:00`, pero dos caminos del cliente traen el pasado:

1. Scroll al tope (`scrollTop ≤ 80px`) llama `fetchPreviousPage`.
2. Un `useEffect` de “lista vacía” llama `fetchPreviousPage` cuando la primera página no tiene ítems pero el backend devolvió `cursorAnterior` (hay turnos previos).

El contrato `GET /api/turnos` sigue exponiendo `cursorAnterior` / `direccion=anterior`. El modo Día no usa cursores: consulta por `fecha`. Semana y Mes son placeholders.

## Goals / Non-Goals

**Goals:**

- El tope de la Lista es hoy 00:00: nunca se piden ni se prependean turnos anteriores al día actual.
- El scroll infinito hacia adelante (páginas posteriores) se mantiene.
- Si hoy no tiene turnos pero hay futuros, la primera página ya los incluye (`gte hoy`); no hay salto manual.
- Si no hay turnos desde hoy, se muestra el mensaje vacío **actual**.

**Non-Goals:**

- Cambiar copy de estados vacíos (Lista, Día u otros).
- Botón “volver a hoy”, contadores, realtime, loaders, ni nada de `pendientes.md`.
- Modos Día / Semana / Mes (ni copy, ni navegación, ni placeholders).
- Eliminar `cursorAnterior` / `direccion=anterior` del backend.

## Decisions

### 1. Corte en el cliente, no en la API

El modo Lista deja de usar la dirección `anterior`: no llama `fetchPreviousPage`, no dispara carga al llegar al tope, y el `useEffect` de lista vacía no pide páginas previas. `getPreviousPageParam` MUST devolver `undefined` para que TanStack Query no considere que hay página anterior.

Se descarta cortar `cursorAnterior` en el backend en este change: Día no lo usa, ningún otro cliente lo necesita, y sacar el contrato implica tests y DTO sin beneficio de producto. El campo puede seguir llegando; el cliente lo ignora.

**Alternativa considerada:** anular `cursorAnterior` en la primera página del service. Más estricto, más superficie (API + specs de backend + tests). Se pospone.

### 2. Scroll dentro de lo ya cargado no es “ir al pasado”

Una vez cargados hoy y días futuros, el usuario puede scrollear hacia arriba **dentro del DOM** (volver a las filas de hoy). Eso no dispara fetch. El tope duro es no **pedir** turnos con fecha anterior a hoy.

### 3. Vacío = mensaje existente, sin relleno automático

Hoy, si la primera página está vacía y hay `cursorAnterior`, el cliente rellena con el pasado. Eso se elimina. El mensaje vacío actual se conserva; no se agrega copy que invite a cambiar de vista.

## Risks / Trade-offs

- **[Riesgo]** Un bug futuro vuelve a cablear `fetchPreviousPage` porque la API sigue mandando `cursorAnterior` → **[Mitigación]** `getPreviousPageParam` siempre `undefined` y tests que fallan si se llama al client con `direccion: 'anterior'`.
- **[Riesgo]** Quien usaba Lista como historial ya no puede → **[Mitigación]** esperado; el historial se consulta en Día. Semana/Mes siguen fuera de este change.
- **[Trade-off]** La API queda “más ancha” que la UI. Aceptable frente a un change de contrato sin consumidores.

## Migration Plan

Cambio de frontend únicamente. Deploy conjunto web; no hay migración de datos ni de clientes API. Rollback: revertir `turnos-listado` restaura el scroll bidireccional.

## Open Questions

Ninguna. El copy vacío, el botón “hoy” y el trabajo fuera de Lista quedaron explícitamente fuera de alcance.
