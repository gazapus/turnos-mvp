## 1. Modelo de datos y datos de desarrollo

- [x] 1.1 Actualizar `EstadoTurno` en `packages/database/prisma/schema.prisma`: quitar `VENCIDO`, agregar `ATENDIDO` y `AUSENTE` (orden final: `PROGRAMADO`, `CONFIRMADO`, `ATENDIDO`, `AUSENTE`, `CANCELADO`)

- [x] 1.2 Generar la migración de Prisma correspondiente (`pnpm --filter @turnos/database exec prisma migrate dev`) y verificar el SQL generado

- [x] 1.3 Extender `packages/database/prisma/seed.ts`: agregar 4 médicos adicionales (usuario rol `MEDICO`, total 5 con el ya sembrado) y 3 especialidades, con relación `MedicoEspecialidad` distribuida entre ellos

- [x] 1.4 Extender el seed con 10 pacientes de prueba (documento, nombre, apellido; teléfono/mail opcionales)

- [x] 1.5 Extender el seed con al menos 100 turnos distribuidos entre los 5 médicos, 3 especialidades y 10 pacientes, cubriendo los 5 estados y los 4 tipos de turno (incluyendo turnos con fecha pasada, del día actual y futura, para poder ejercitar el scroll bidireccional)

- [x] 1.6 Ejecutar `pnpm db:seed` contra la base local y verificar manualmente los conteos (médicos, especialidades, pacientes, turnos)

## 2. Contratos compartidos (`packages/shared-types`)

- [x] 2.1 Crear `packages/shared-types/src/turnos.ts` con: enum/union de `EstadoTurno`, `TipoTurno`, `VistaAgenda` (`lista`|`dia`|`semana`|`mes`), `TurnoListItemDto`, tipos de opciones de filtro (`MedicoOption`, `EspecialidadOption`, `PacienteOption`) y el shape de query/respuesta paginada de `GET /api/turnos`

- [x] 2.2 Exportar los nuevos tipos desde `packages/shared-types/src/index.ts`

## 3. Backend — endpoints de soporte para filtros

- [x] 3.1 Crear módulo `apps/api/src/users/` con `GET /api/usuarios?rol=MEDICO` (Response DTO mínimo: id, nombre, apellido), protegido por `JwtAuthGuard`, con Swagger (`@ApiTags`, `@ApiOperation`, `@ApiResponse`)

- [x] 3.2 Crear módulo `apps/api/src/especialidades/` con `GET /api/especialidades` (Response DTO mínimo: id, nombre), protegido por `JwtAuthGuard`, con Swagger

- [x] 3.3 Crear módulo `apps/api/src/pacientes/` con `GET /api/pacientes` (Response DTO mínimo: id, nombre, apellido), protegido por `JwtAuthGuard`, con Swagger

- [x] 3.4 Agregar tests (`*.spec.ts`) de controller y service para los tres módulos nuevos

- [x] 3.5 Registrar los tres módulos nuevos en `apps/api/src/app.module.ts`

## 4. Backend — listado de turnos (`appointments`)

- [x] 4.1 Crear módulo `apps/api/src/appointments/` (module, controller, service, dto, barrel `index.ts`)

- [x] 4.2 Definir DTO de query de entrada (`medicoId`, `especialidadId`, `pacienteId`, `incluirCancelados`, `cursor`, `direccion`) con `class-validator`

- [x] 4.3 Definir `TurnoListItemResponseDto` mapeado desde la entidad Prisma (nunca devolver la entidad cruda), con `@ApiProperty` en cada campo

- [x] 4.4 Implementar en el service la paginación por cursor ordenada por `(fechaInicio, id)`, límite fijo de 30, con ancla inicial en "hoy 00:00" cuando no llega `cursor`

- [x] 4.5 Implementar el scoping por rol: si el JWT tiene `rol=MEDICO`, forzar `medicoId = sub` e ignorar cualquier `medicoId` recibido por query

- [x] 4.6 Implementar `GET /api/turnos` en el controller, protegido por `JwtAuthGuard`, con Swagger completo (`@ApiTags`, `@ApiOperation`, `@ApiResponse`) y sin encabezados de caché

- [x] 4.7 Agregar tests (`*.spec.ts`) de controller y service: DTO de respuesta mínimo, scoping por rol de médico, paginación por cursor (primera página, página siguiente, página anterior)

- [x] 4.8 Registrar `AppointmentsModule` en `apps/api/src/app.module.ts`

## 5. Frontend — infraestructura de data-fetching

- [x] 5.1 Agregar `@tanstack/react-query` a `apps/web/package.json`

- [x] 5.2 Crear el `QueryClientProvider` (con `staleTime: 0`, `gcTime: 0` por defecto) acotado al shell autenticado o a la sección de agenda, según convenga en la implementación

- [x] 5.3 Crear `apps/web/lib/api/turnos-client.ts` con funciones para `GET /api/turnos` y los tres listados de soporte (médicos, especialidades, pacientes), siguiendo el patrón de `apps/web/lib/api/auth-client.ts`

- [x] 5.4 Crear `apps/web/lib/agenda/url-params.ts` con helpers de parseo/serialización de los query params de agenda (`vista`, `medicoId`, `especialidadId`, `pacienteId`, `cancelados`)

## 6. Frontend — layout de la Agenda de Turnos

- [x] 6.1 Reemplazar el stub de `apps/web/app/(app)/agenda/page.tsx`: Server Component que lee `searchParams`, resuelve los defaults de filtros por rol (usando el usuario de sesión) y monta el layout

- [x] 6.2 Construir el layout visual siguiendo `wireframes/wireframe_listado_turnos.png`: título, franja de filtros, botón "Nuevo Turno" (sin handler, oculto por completo cuando el rol es Médico), franja de tabs + checkbox de cancelados, contenedor de visualización — reutilizando el AppShell existente sin reconstruirlo

- [x] 6.3 Crear `components/agenda/agenda-filtros-form.tsx` (leaf client, RHF + Zod): combos de médico/especialidad/paciente poblados desde los endpoints de soporte, botón "Aplicar" que actualiza la URL y dispara el refetch; combo de médico deshabilitado y fijo cuando el rol es Médico

- [x] 6.4 Crear `components/agenda/agenda-tabs.tsx` (leaf client): tabs Lista/Día/Semana/Mes que actualizan el query param `vista` vía `router.replace`, sin recargar la página

- [x] 6.5 Crear `components/agenda/agenda-cancelados-toggle.tsx` (leaf client): checkbox que solo filtra en memoria las filas ya cargadas y actualiza el query param `cancelados`, sin refetch; default marcado para Recepcionista/Administrador y sin marcar para Médico

- [x] 6.6 Crear placeholders vacíos seleccionables para los modos Día, Semana y Mes (sin lógica ni datos)

- [x] 6.7 Agregar tests (`*.test.tsx`) para `agenda-filtros-form`, `agenda-tabs` y `agenda-cancelados-toggle`

## 7. Frontend — modo de visualización Lista

- [x] 7.1 Crear `components/agenda/turnos-listado.tsx` (leaf client): `useInfiniteQuery` bidireccional (`fetchNextPage`/`fetchPreviousPage`), listener de scroll para disparar carga hacia arriba/abajo, `queryKey` que incluye los filtros activos para invalidar por completo al aplicar

- [x] 7.2 Crear `components/agenda/turno-estado-pill.tsx`: pill de color por cada uno de los 5 estados, usando tokens semánticos del tema (sin hex/rgb arbitrarios)

- [x] 7.3 Crear `components/agenda/turno-tipo-icon.tsx`: ícono + tooltip para primer turno (rombo "1"), control (círculo "C") y urgencia/sobreturno (triángulo "!", agrupando `SOBRETURNO` y `URGENTE`)

- [x] 7.4 Crear `components/agenda/turno-acciones.tsx`: botones icon-button estáticos por rol (Recepcionista/Administrador: confirmar, cancelar; Médico: llamar, finalizar) con tooltip, sin `onClick` funcional

- [x] 7.5 Ensamblar la grilla con columnas fecha, hora, paciente, doctor, especialidad, estado, tipo y acciones, dejando documentado (comentario de diseño, no lógica) el punto de extensión para doble click → detalle de turno

- [x] 7.6 Agregar tests (`*.test.tsx`) para `turnos-listado`, `turno-estado-pill`, `turno-tipo-icon` y `turno-acciones`

## 8. Documentación y cierre

- [x] 8.1 Actualizar `docs/FUNCIONAL.md` §7.3 y §11 con el nuevo `EstadoTurno` (`PROGRAMADO`, `CONFIRMADO`, `ATENDIDO`, `AUSENTE`, `CANCELADO`)

- [x] 8.2 Actualizar `docs/FUNCIONAL.md` §7.5 dejando nota explícita de que la semántica del job de "vencidos"/`AUSENTE` queda pendiente de definición en una futura iteración (sin implementarla)

- [x] 8.3 Actualizar `AGENTS.md` §3 tabla de endpoints REST si corresponde (agregar `/api/turnos`, `/api/usuarios`, `/api/pacientes`)

- [x] 8.4 Ejecutar `pnpm lint`, `pnpm format:check`, `pnpm test` y `pnpm build` en el monorepo y resolver cualquier hallazgo
