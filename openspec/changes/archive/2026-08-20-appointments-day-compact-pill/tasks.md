## 1. Panel Día: min-width 960px y scroll horizontal

- [x] 1.1 En `agenda-dia.tsx` / `agenda-dia.css`, aplicar `min-width: 960px` al contenido interno del contenedor de visualización Día (mismo valor que la tabla de Lista) y `overflow-x: auto` en el ancestro que scrollea, sin romper el `height: 100%` / overflow Y del timegrid de FullCalendar
- [x] 1.2 Documentar en el CSS o en el className que 960px es la excepción de piso alineada a Lista (`AGENTS.md` / frontend-coder)
- [x] 1.3 Test: el contenedor de Día declara el piso de 960px (asserción de clase o estilo equivalente a la de altura actual en `agenda-dia.test.tsx`)

## 2. Pill compacta bajo 260px

- [x] 2.1 Extender `TurnoEstadoPill` (o un wrapper usado solo en Día) con el mapeo de labels compactos `PRO` / `CON` / `ATE` / `AUS` / `CAN` y ambas etiquetas en el DOM; Lista sigue mostrando solo el texto completo y conserva `min-w-[7.5rem]`
- [x] 2.2 En `TurnoDiaCard`, declarar `container-type: inline-size` y, vía container query `@container (max-width: 259px)` en `agenda-dia.css`, mostrar la etiqueta de 3 letras, ocultar la completa y quitar el `min-width` de 7.5rem de la pill
- [x] 2.3 En modo compacto, exponer tooltip (`title`) y nombre accesible (`aria-label`) con el label completo del estado; el color de la pill no cambia
- [x] 2.4 Extraer el umbral 260px a una constante `as const` (y/o custom property CSS) para no repetir el magic number
- [x] 2.5 Tests: mapeo de los 5 estados a 3 letras; `TurnoEstadoPill` en uso de Lista no cambia; card/pill de Día cubre tooltip del label completo (el umbral visual de 260px queda cubierto por CSS de container query, no por jsdom)

## 3. Verificación

- [x] 3.1 `pnpm --filter @turnos/web test` en verde
- [x] 3.2 `pnpm lint` en verde para los archivos tocados
- [x] 3.3 Prueba manual: viewport &lt; 960px scrollea en X; card ancha muestra pill completa; forzar overlaps para cards &lt; 260px y verificar 3 letras + tooltip
