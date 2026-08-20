## 1. Shared types

- [x] 1.1 Agregar `horaFin: string` a `TurnoListItemDto` en `packages/shared-types/src/turnos.ts`
- [x] 1.2 Agregar `fecha?: string` a `TurnosListQuery` en `packages/shared-types/src/turnos.ts`
- [x] 1.3 Agregar `fecha?: string` a `AgendaUrlParams` en `packages/shared-types/src/turnos.ts`

## 2. Backend — `GET /api/turnos` con filtro de fecha sin paginar

- [x] 2.1 Agregar `fecha` (validado como fecha `YYYY-MM-DD`) a `ListTurnosQueryDto` (`apps/api/src/appointments/dto/turno-list.dto.ts`)
- [x] 2.2 Agregar `horaFin` a `TurnoListItemResponseDto` y a `TurnoListItemResponseDto.fromEntity`, calculado con `formatClinicTime(turno.fechaFin)`
- [x] 2.3 Incluir `fechaFin` en el `select`/`include` de Prisma en todas las consultas de `AppointmentsService` que arman `TurnoListItemResponseDto`
- [x] 2.4 Implementar en `AppointmentsService` una rama `fetchByDate` (o similar) que, cuando `query.fecha` está presente, calcule el rango `[startOfClinicDay(fecha), startOfClinicDay(fecha+1día))`, ignore `cursor`/`direccion`, aplique `resolveFilters`/`buildFilterWhere` existentes (scoping por rol incluido) y devuelva **todos** los turnos del rango sin `take`, con `cursorAnterior`/`cursorSiguiente` en `null`
- [x] 2.5 Actualizar `AppointmentsController.list` si hace falta (debería no requerir cambios, ya delega todo a `ListTurnosQueryDto`/`AppointmentsService`)
- [x] 2.6 Tests de `appointments.controller.spec.ts` / servicio: consulta con `fecha` devuelve todos los turnos del día sin paginar, ignora `cursor` si viene junto a `fecha`, respeta scoping por rol Médico, y devuelve lista vacía para un día sin turnos

## 3. Frontend — dependencias nuevas

- [x] 3.1 Instalar `@fullcalendar/core@6`, `@fullcalendar/react@6`, `@fullcalendar/daygrid@6`, `@fullcalendar/timegrid@6` en `apps/web`
- [x] 3.2 Instalar `@daypicker/react` en `apps/web`

## 4. Frontend — tokens y estilos

- [x] 4.1 Agregar a `apps/web/app/tokens.css` un token "soft" por estado de turno (`--estado-programado-soft`, `--estado-confirmado-soft`, `--estado-atendido-soft`, `--estado-ausente-soft`, `--estado-cancelado-soft`), derivados de los colores ya usados en `TurnoEstadoPill`, y exponerlos en `@theme` como utilidades `bg-*`
- [x] 4.2 Crear la hoja de overrides de FullCalendar (ej. `apps/web/app/agenda-dia.css`, importada solo donde se usa la vista Día) que mapea variables `--fc-*` relevantes (bordes, fondo de evento, márgenes de `slotEventOverlap`) a `var(--token)`, sin valores hex/rgb arbitrarios
- [x] 4.3 Verificar que la hoja de overrides deja las columnas de turnos superpuestos pegadas entre sí (sin gap) y sin margen antes de la primera columna

## 5. Frontend — extensión de params y cliente de API

- [x] 5.1 Agregar `fecha` a `ParsedAgendaParams` en `apps/web/lib/agenda/url-params.ts`, con default "hoy" (día civil) cuando está ausente en la URL
- [x] 5.2 Actualizar `parseAgendaUrlParams`, `serializeAgendaUrlParams` y `buildAgendaHref` para incluir `fecha`
- [x] 5.3 Agregar helpers de fecha (formato de despliegue "{día} {mes} {año}" vía `Intl.DateTimeFormat('es-AR', ...)`, parseo/validación de `DD/MM/YYYY`, suma/resta de un día) en `apps/web/lib/agenda/` (ej. `fecha-dia.ts`)
- [x] 5.4 Extender `fetchTurnos` en `apps/web/lib/api/turnos-client.ts` para aceptar y serializar el query param `fecha`

## 6. Frontend — selector de fecha

- [x] 6.1 Crear `apps/web/components/agenda/agenda-dia-selector.tsx` (leaf client): input con el valor formateado, popover con `@daypicker/react` (`mode="single"`), soporte de tipeo manual `DD/MM/YYYY`, flechas de día anterior/siguiente y botón "HOY"
- [x] 6.2 Cablear el selector para actualizar `fecha` en la URL (mismo mecanismo que `AgendaTabs`/`AgendaCanceladosToggle`: `router.replace(buildAgendaHref({ ...params, fecha }))`)
- [x] 6.3 Test (`agenda-dia-selector.test.tsx`): formatea la fecha mostrada correctamente, avanza/retrocede un día con las flechas, "HOY" fija la fecha actual

## 7. Frontend — grilla de turnos del modo Día

- [x] 7.1 Crear `apps/web/components/agenda/agenda-dia.tsx` (leaf client): monta `FullCalendar` con `plugins={[timeGridPlugin]}`, `initialView="timeGridDay"`, `headerToolbar={false}`, `slotEventOverlap={false}`, `scrollTime="08:00:00"`, `allDaySlot={false}`
- [x] 7.2 Consultar turnos vía `fetchTurnos` con el `fecha` activo y los filtros de médico/especialidad/paciente (reutilizando `toAppliedFilters`), sin `useInfiniteQuery` (una sola consulta, sin paginación)
- [x] 7.3 Mapear cada `TurnoListItemDto` a un evento de FullCalendar: `start`/`end` construidos desde `fecha` + `hora`/`horaFin`, y el turno completo en `extendedProps`
- [x] 7.4 Implementar `eventContent` propio: ícono de médico + nombre y apellido, ícono de paciente + nombre y apellido, `TurnoEstadoPill`, `TurnoTipoIcon`, con clase de color "soft" según `extendedProps.estado`
- [x] 7.5 Filtrar en memoria los turnos con estado Cancelado cuando `params.cancelados` es `false`, igual que `TurnosListado`
- [x] 7.6 Envolver el calendario en un contenedor con la clase `glass-panel-agenda`
- [x] 7.7 Llamar a `getApi().gotoDate(fecha)` cuando cambia la fecha activa, dejando que `scrollTimeReset` (default `true`) reposicione el scroll en las 8am
- [x] 7.8 Mostrar estado de carga / error / vacío de forma consistente con `TurnosListado` (mensajes equivalentes)
- [x] 7.9 Test (`agenda-dia.test.tsx`): el mapeo de `TurnoListItemDto` a evento (`start`/`end`) es correcto; el `eventContent` renderiza médico, paciente, pill y tipo esperados; los turnos cancelados se ocultan cuando `cancelados` es `false`

## 8. Frontend — integración en el layout de Agenda

- [x] 8.1 En `apps/web/components/agenda/agenda-content.tsx`, reemplazar `<AgendaVistaPlaceholder vista="dia" />` por `<AgendaDia .../>` (grilla + selector de fecha) cuando `params.vista === 'dia'`
- [x] 8.2 Verificar que cambiar de tab hacia/desde "Día" conserva `fecha` en la URL igual que el resto de los filtros

## 9. Verificación final

- [x] 9.1 `pnpm --filter @turnos/web test` y `pnpm --filter @turnos/api test` en verde
- [x] 9.2 `pnpm lint` y `pnpm format:check` en verde
- [ ] 9.3 Prueba manual: cargar `/agenda?vista=dia`, verificar scroll inicial en 8am, navegación con flechas/HOY/calendario, turnos superpuestos pegados sin huecos, colores por estado, checkbox de cancelados sin refetch
