## Context

El modo Día (`AgendaDia` + `TurnoDiaCard` + `TurnoEstadoPill`) ya está en producción de specs (`openspec/specs/appointments-day`). Las cards van en columnas iguales de FullCalendar (`slotEventOverlap: false`). La pill de Lista/Día comparte `TurnoEstadoPill` con `min-w-[7.5rem]` y el texto completo del estado. El contenedor `.agenda-dia-calendar` usa `overflow-hidden` (necesario en Y para el timegrid) y **no** tiene `min-width`. El modo Lista ya documenta la excepción de piso: la tabla usa `min-w-[960px]` y el glass `overflow-auto`.

## Goals / Non-Goals

**Goals:**

- Piso de ancho del panel Día = 960px, con scroll horizontal al angostar el viewport (mismo criterio que Lista).
- Umbral único de 260px por card: debajo, pill en 3 letras del label (`PRO`/`CON`/`ATE`/`AUS`/`CAN`) + tooltip del texto completo; a 260px o más, texto completo. El color de la pill no cambia.

**Non-Goals:**

- Cambiar el modo Lista, el backend, o los colores de card/pill.
- Piso de ancho por card individual (FullCalendar sigue partiendo columnas en %).
- Compactar el ícono de tipo o los nombres (siguen truncando).

## Decisions

### 1. El `min-width` 960px va en el contenido interno del panel, no en cada evento

Lista aplica `min-w-[960px]` a la tabla y `overflow-auto` al glass. Día replica el patrón: el wrapper del calendario (o un inner del glass) tiene `min-w-[960px]` y el contenedor scrollea en X.

El timegrid de FullCalendar necesita `overflow: hidden` en Y para `height: 100%`. Se separan los ejes: el scroll horizontal vive en un ancestro (`overflow-x-auto`); el harness del calendar conserva overflow hidden en Y. No se pone `min-width` en `.fc-timegrid-event-harness` (FullCalendar posiciona en % y pelearía con un piso por card).

### 2. Umbral 260px con CSS container query, no ResizeObserver

Cada `TurnoDiaCard` (o su raíz) declara `container-type: inline-size`. A `@container (max-width: 259px)` se muestra la etiqueta corta y se oculta la larga. FullCalendar redimensiona las columnas y el query reacciona sin JS ni re-renders.

El valor 260px es un umbral único para todas las cards (no “si entra Programado”). Se nombra como constante (`as const` / custom property en `agenda-dia.css`) para no repetir el magic number.

### 3. Compacto es variante de la pill en Día; Lista no cambia

`TurnoEstadoPill` sigue mostrando el texto completo por defecto (Lista). En Día se renderizan ambas etiquetas (completa y 3 letras) y el CSS de container query elige cuál se ve. El `min-w-[7.5rem]` de la pill **no aplica** en modo compacto (si se mantiene, `PRO` seguiría ocupando 120px).

Mapeo (primeras 3 letras del **label** en español, no del enum):

| Estado     | Completo   | Compacto |
| ---------- | ---------- | -------- |
| PROGRAMADO | Programado | PRO      |
| CONFIRMADO | Confirmado | CON      |
| ATENDIDO   | Atendido   | ATE      |
| AUSENTE    | Ausente    | AUS      |
| CANCELADO  | Cancelado  | CAN      |

En compacto: `title` y `aria-label` (o equivalente) con el label completo. En texto completo no hace falta tooltip nuevo (comportamiento actual).

Alternativa descartada: `ResizeObserver` por card — más código, más tests de layout, mismo resultado.

### 4. Excepción documentada de `min-width` ad-hoc

`AGENTS.md` / frontend-coder prohíben `min-width` suelto salvo excepción. Lista ya es una. Este change documenta la misma excepción para el panel Día (960px), no un token de pantalla (`--agenda-dia-min-width`).

## Risks / Trade-offs

- **[Riesgo]** `overflow-x-auto` en el glass vs `overflow-hidden` del timegrid rompe el alto 100% de FullCalendar → **[Mitigación]** el scroll X queda en un wrapper externo; el nodo `.agenda-dia-calendar` conserva el contrato de altura actual.
- **[Riesgo]** Container queries mal aplicados al harness de FullCalendar (el evento es `position: absolute`) → **[Mitigación]** `container-type` en la raíz de `TurnoDiaCard`, que ya es `h-full` del evento.
- **[Riesgo]** Lectores de pantalla oyen las dos etiquetas si ambas quedan en el DOM visibles → **[Mitigación]** la oculta con `hidden`/`display: none` y un solo `aria-label` en el contenedor de la pill.
- **[Trade-off]** Con muchos overlaps, cada card sigue pudiendo bajar de 260px (el piso es del panel, no de la card); ahí entra el compacto, que es el objetivo.

## Migration Plan

Solo frontend. Rollback: revertir el change. Sin migración de datos ni API.

## Open Questions

Ninguna: umbral 260px, min-width de panel 960px, tooltip solo en compacto, Lista intacta.
