## Why

En el modo Día, las cards de turnos superpuestos se achican en columnas iguales y la pill de estado (texto completo + `min-width` de 7.5rem) se come el espacio de los nombres. El contenedor de la grilla no tiene piso de ancho: con `overflow-hidden` el contenido se corta en vez de scrollear, a diferencia del modo Lista (`min-w-[960px]` + `overflow-auto`).

## What Changes

- El contenedor de visualización del modo Día adopta el mismo `min-width` que Lista (`960px`) y scrollea horizontalmente al angostar el viewport (deja de cortar).
- Cuando el ancho de una card es menor a **260px**, la pill de estado muestra solo las primeras tres letras del label (`PRO`, `CON`, `ATE`, `AUS`, `CAN`) y un tooltip con el texto completo. A 260px o más, la pill sigue mostrando el estado completo.
- El color de la pill no cambia. El modo Lista no se modifica.

## Capabilities

### New Capabilities

<!-- ninguna: se extiende el modo Día ya especificado -->

### Modified Capabilities

- `appointments-day`: el contenedor de la grilla gana `min-width` 960px con scroll horizontal; la pill de la card pasa a modo compacto (3 letras + tooltip) cuando el ancho de la card es &lt; 260px.

## Impact

- **Frontend** (`apps/web`): `agenda-dia.tsx` / `agenda-dia.css` (min-width y overflow del panel), `turno-dia-card.tsx` y `turno-estado-pill.tsx` (variante compacta o umbral por container query). Tests de card/pill en vista Día.
- **No afecta**: backend, shared-types, modo Lista, scoping por rol, colores de card.
