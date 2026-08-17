## Context

`/agenda` es hoy un stub (`apps/web/app/(app)/agenda/page.tsx`) sin datos. No existe módulo `appointments` en `apps/api`, ni capability `turnos` en `openspec/specs/`. El modelo `Turno` en `packages/database/prisma/schema.prisma` ya existe con relaciones a `Usuario` (médico/creador), `Especialidad` y `Paciente`, pero `EstadoTurno` tiene 4 valores (`PROGRAMADO`, `CONFIRMADO`, `CANCELADO`, `VENCIDO`) mientras que el wireframe de referencia (`wireframes/wireframe_listado_turnos.png`) y el pedido de negocio definen 5 estados (agregando `ATENDIDO` y `AUSENTE`, sin `VENCIDO`).

La app web no tiene ninguna librería de data-fetching (solo `fetch` nativo) ni componentes de UI reusables (`components/ui/` no existe); todo se construye a mano con Tailwind v4 + design tokens, siguiendo `AGENTS.md`.

La autenticación ya provee sesión JWT en cookie httpOnly (`apps/api/src/auth`), con `rol` en el payload; no hay `RolesGuard` todavía, solo `JwtAuthGuard` (cualquier usuario autenticado).

## Goals / Non-Goals

**Goals:**

- Layout completo y reusable de la Agenda de Turnos (título, filtros, tabs, botón Nuevo Turno visible según rol, checkbox cancelados), listo para que las próximas etapas agreguen Día/Semana/Mes sin rehacer el layout.
- Filtros y modo de visualización persistidos en la URL, con hidratación bidireccional (URL ⇄ estado de UI).
- Modo Lista funcional de punta a punta contra datos reales: scroll infinito bidireccional, 30 turnos por página, anclado a "hoy 00:00" en la primera carga.
- Scoping de datos por rol aplicado en el backend (no solo ocultando UI): un médico nunca recibe turnos de otro médico.
- Datos de prueba realistas (5 médicos, 3 especialidades, 10 pacientes, ≥100 turnos) vía seed idiomático de Prisma.

**Non-Goals:**

- Lógica de negocio de transición de estados (quién/cuándo dispara `ATENDIDO`/`AUSENTE`) — los botones de acción son estáticos, sin handlers.
- Modos Día, Semana y Mes con datos reales (quedan como contenedor vacío seleccionable).
- Creación/edición de turnos (botón "Nuevo Turno" es un stub visual).
- Detalle de turno por doble click (se deja como extension point documentado, sin implementación).
- Combobox de búsqueda para el filtro de Paciente (queda como select simple; se revisita si el volumen de pacientes lo justifica).

## Decisions

### 1. `EstadoTurno`: reemplaza `VENCIDO` por `ATENDIDO` + `AUSENTE`

Se modifica el enum a `PROGRAMADO`, `CONFIRMADO`, `ATENDIDO`, `AUSENTE`, `CANCELADO`. Alternativa considerada: mantener `VENCIDO` y sumar los dos estados nuevos (6 valores). Se descarta porque el pedido de negocio y el wireframe de referencia enumeran explícitamente 5 estados sin mencionar `VENCIDO`, y mantenerlo introduciría un estado sin dueño claro ni forma de alcanzarlo desde la UI en esta etapa. La semántica exacta de cuándo se llega a `AUSENTE` (¿reemplaza al job nocturno de `docs/FUNCIONAL.md` §7.5, o es un estado disparado manualmente?) queda como pregunta abierta para una futura iteración de acciones; esta migración solo fija el enum, no la lógica de transición.

Como no hay datos de producción, la migración no requiere backfill: se recrea el enum y se re-siembra el entorno de desarrollo.

### 2. `TipoTurno`: sin cambios en el modelo, agrupación visual de 3 íconos

El enum se mantiene con sus 4 valores (`PRIMER_TURNO`, `CONTROL`, `SOBRETURNO`, `URGENTE`). En la UI, cada grupo se renderiza con un asset en `apps/web/public/images/general/`: `primer_turno.webp` (primer turno), `control.webp` (control) y `urgente.webp` (urgencia/sobreturno — compartido por `SOBRETURNO` y `URGENTE` con el mismo tooltip), ya que el negocio los trata como una sola categoría visual aunque conceptualmente se originen distinto (automático por superposición vs. manual).

### 3. Acciones de la columna "Acciones": estáticas por rol, no por estado

En esta etapa los botones no dependen del estado del turno, solo del rol de quien mira la pantalla:

| Rol                          | Botones                                    | Tooltip                                 |
| ---------------------------- | ------------------------------------------ | --------------------------------------- |
| Recepcionista, Administrador | Confirmar (check azul), Cancelar (X roja)  | "Confirmar paciente", "Cancelar turno"  |
| Médico                       | Llamar (teléfono), Finalizar (check verde) | "Llamar al paciente", "Finalizar turno" |

El administrador no tiene casos de uso de gestión de turnos en `docs/FUNCIONAL.md`; se decide (explícitamente, como parte de esta propuesta) que en la Agenda ve las mismas acciones que Recepcionista, ya que además hereda los mismos defaults de filtros. Ningún botón tiene `onClick` funcional en esta etapa; solo `title`/tooltip accesible.

### 4. URL como fuente de verdad: query params, no path segments

`vista` (lista|dia|semana|mes), `medicoId`, `especialidadId`, `pacienteId`, `cancelados` viven todos como query params sobre una única ruta `/agenda`. Se descarta un path segment por vista (`/agenda/dia`) porque forzaría un `page.tsx` por vista y complicaría compartir el layout y el estado de filtros entre vistas; con query params, un único Server Component lee `searchParams` y decide qué sub-vista montar dentro del mismo layout.

`vista` ausente en la URL ⇒ `lista` (default). Cambiar de tab actualiza la URL vía `router.replace` (sin recargar ni ensuciar el historial por cada click).

### 5. Paginación por cursor, bidireccional, anclada a "hoy 00:00"

`GET /api/turnos` no acepta `page`/`offset`. Ordena por `(fechaInicio, id)` y expone `cursorSiguiente`/`cursorAnterior` opacos (fecha+id codificados). La primera carga (sin cursor) siempre filtra `fechaInicio >= hoy 00:00`, ascendente, límite 30 — independientemente de los filtros de médico/especialidad/paciente. Scroll hacia abajo pide con `cursor=cursorSiguiente&direccion=siguiente`; scroll hacia arriba pide con `cursor=cursorAnterior&direccion=anterior`. El límite de 30 es fijo en el backend, no un parámetro del cliente.

Alternativa descartada: `LIMIT/OFFSET`. Se degrada con datos que cambian constantemente (turnos que se cancelan/confirman entre requests) y no calza con el requisito explícito de "no cachear" — el offset puede duplicar u omitir filas si el conjunto cambia entre páginas.

### 6. Data fetching: TanStack Query, sin caché real

Se incorpora `@tanstack/react-query` (primera dependencia de data-fetching del proyecto) con `useInfiniteQuery` (soporta `fetchNextPage`/`fetchPreviousPage` de forma nativa, ideal para el patrón bidireccional). Se configura `staleTime: 0` y `gcTime: 0` para que ninguna respuesta de turnos quede servida desde caché tras un refetch — cumple el requisito de negocio de no cachear datos que cambian constantemente, a la vez que se obtiene manejo de carrera de requests, reintentos y estados de carga sin código artesanal.

### 7. Scoping por rol en el backend, no solo en el cliente

El controller de `GET /api/turnos` ignora el `medicoId` recibido por query cuando el JWT tiene `rol=MEDICO`, y fuerza `medicoId = sub`. El combo de médico en el cliente aparece deshabilitado para ese rol, pero la garantía real vive en el backend (defensa en profundidad ante manipulación de query params).

### 8. DTOs mínimos

`TurnoListItemDto`: `{ id, fecha, hora, paciente: { nombre, apellido }, medico: { nombre, apellido }, especialidad: { nombre }, estado, tipo }`. Sin campos de auditoría, sin IDs de relaciones que la UI de listado no usa. Los combos de filtro usan DTOs igualmente mínimos (`{ id, nombre, apellido? }`).

### 9. Semilla de datos vía `prisma/seed.ts`, no SQL embebido en la migración

Se extiende el seed existente (agrega médicos/especialidades/pacientes/turnos junto a los usuarios de desarrollo ya sembrados) y se ejecuta con `pnpm db:seed`. La migración de Prisma solo contiene el cambio de schema (`EstadoTurno`); nunca datos. Esto mantiene la distinción de términos: _migración_ = DDL versionado, _seed_ = datos de desarrollo reproducibles/idempotentes.

### 10. Estructura de módulos

```
apps/api/src/
├── appointments/        # GET /api/turnos (turnos.controller/service/dto)
├── especialidades/      # GET /api/especialidades
├── pacientes/           # GET /api/pacientes (lectura mínima)
└── users/               # GET /api/usuarios?rol=MEDICO (nuevo módulo; hoy solo existe auth)

apps/web/
├── app/(app)/agenda/page.tsx           # Server Component, lee searchParams
├── components/agenda/
│   ├── agenda-filtros-form.tsx         # leaf client: RHF + Zod, sync URL
│   ├── agenda-tabs.tsx                 # leaf client: cambia ?vista=
│   ├── agenda-cancelados-toggle.tsx    # leaf client: solo filtra en memoria
│   ├── turnos-listado.tsx              # leaf client: useInfiniteQuery
│   ├── turno-estado-pill.tsx
│   ├── turno-tipo-icon.tsx
│   └── turno-acciones.tsx
└── lib/
    ├── api/turnos-client.ts
    └── agenda/url-params.ts            # parseo/serialización de searchParams

packages/shared-types/src/turnos.ts     # DTOs, enums, tipos de query compartidos
```

### 11. Default de "Cancelados": visible para Recepcionista/Administrador, oculto para Médico

Se invierte el default inicialmente propuesto: Recepcionista y Administrador ven los turnos cancelados desde la primera carga (checkbox marcado por defecto), mientras que Médico los ve ocultos por defecto (checkbox sin marcar), aunque en ambos casos el checkbox sigue siendo editable por el usuario. El comportamiento client-only (no dispara refetch) definido en la Decisión de scoping de filtros no cambia, solo el valor inicial por rol.

### 12. Botón "Nuevo Turno" visible solo para Recepcionista y Administrador

El rol Médico no ve el botón "Nuevo Turno" en el layout de Agenda (ni siquiera deshabilitado): se oculta por completo, ya que la creación de turnos es un caso de uso exclusivo de Recepcionista según `docs/FUNCIONAL.md` (el Administrador lo hereda por consistencia con el resto de sus defaults, igual que las acciones de la grilla). Alternativa descartada: mostrarlo deshabilitado a Médico — se descarta porque no hay ningún flujo, ni siquiera futuro, en el que un médico cree turnos.

## Risks / Trade-offs

- **[Riesgo]** Cambiar filtros mientras hay scroll en curso podría mezclar páginas de distintos filtros → **[Mitigación]** cambiar filtros solo dispara refetch al presionar "Aplicar", que descarta el query anterior por completo (nueva `queryKey` en TanStack Query) y resetea ambos cursores.
- **[Riesgo]** Filtrar por especialidad o paciente sin médico puede no aprovechar el índice existente `@@index([medicoId, fechaInicio])` → **[Mitigación]** evaluar en implementación si se necesita un índice adicional sobre `fechaInicio` solo, o `(especialidadId, fechaInicio)`; no bloqueante para 100 turnos de prueba, sí a vigilar.
- **[Riesgo]** `@tanstack/react-query` es una dependencia nueva en un proyecto que hoy no tiene ninguna librería de data-fetching → **[Mitigación]** se limita su uso a esta feature; no se introduce un `QueryClientProvider` global innecesariamente amplio (se acota al layout de agenda o al shell autenticado, a definir en tasks).
- **[Riesgo]** El cambio de `EstadoTurno` desalinea `docs/FUNCIONAL.md` §7.3/§7.5 (que documentan `VENCIDO` y el job nocturno) → **[Mitigación]** se actualiza esa sección como parte de esta implementación, dejando explícitamente pendiente (nota, no lógica) la definición del job/trigger de `AUSENTE`.
- **[Riesgo]** Ver acciones de Recepcionista en el rol Administrador no está respaldado por un caso de uso en `docs/FUNCIONAL.md` → **[Mitigación]** queda documentado como decisión explícita de esta propuesta, revisable si Producto define lo contrario.

## Migration Plan

1. Migración de schema Prisma: actualizar `EstadoTurno` (quitar `VENCIDO`, agregar `ATENDIDO`/`AUSENTE`) — sin backfill, entorno de desarrollo sin datos reales de producción.
2. Extender `prisma/seed.ts` con médicos/especialidades/pacientes/turnos (idempotente vía `upsert` donde el modelo lo permita).
3. Implementar backend: módulos `appointments`, `especialidades`, `pacientes`, `users` (list mínimo).
4. Implementar frontend: layout de Agenda + modo Lista.
5. Sincronizar `docs/FUNCIONAL.md` con el nuevo enum.

Rollback: en desarrollo, `prisma migrate reset` + re-seed. No aplica estrategia de rollback de datos de producción porque este cambio no se despliega aún contra datos reales.

## Open Questions

- ¿Qué dispara `AUSENTE` en el futuro (acción manual, job nocturno, ambos)? No bloquea esta etapa, pero condiciona el diseño de la acción "finalizar"/futuras acciones de no-presentado.
- ¿El job de "vencidos" de medianoche (`docs/FUNCIONAL.md` §7.5) se redefine, se elimina o se reemplaza? A resolver antes de dar funcionalidad real a los botones de acción.
- ¿En qué momento se justifica migrar el filtro de Paciente a un combobox con búsqueda (volumen real de pacientes en producción)?
