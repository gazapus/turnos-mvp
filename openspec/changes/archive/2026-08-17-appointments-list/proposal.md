## Why

La pantalla de Agenda (`/agenda`) es hoy un stub sin datos. Recepcionistas, médicos y administradores necesitan un lugar único para ver y filtrar turnos reales, con la estructura de layout ya lista para las futuras vistas Día/Semana/Mes. Esta primera etapa entrega el layout completo de la Agenda y el modo de visualización Lista, funcional de punta a punta contra datos reales.

## What Changes

- Implementa la pantalla `/agenda` con su layout compartido: título "Agenda de Turnos", formulario de filtros (médico, especialidad, paciente), botón "Nuevo Turno" (sin funcionalidad, visible solo para Recepcionista y Administrador), tabs de modo de visualización (Lista, Día, Semana, Mes) y checkbox de "Cancelados".
- Filtros y modo de visualización viven como query params en la URL: la URL es la fuente de verdad (hidrata el estado inicial) y toda interacción del usuario actualiza la URL.
- Defaults de filtros por rol: Recepcionista y Administrador → "Todos" en médico/especialidad/paciente, cancelados visible por defecto; Médico → médico fijo en su propio usuario (campo no editable), resto "Todos", cancelados oculto por defecto pero editable.
- El checkbox de "Cancelados" es puramente cliente: alterna visibilidad de filas ya cargadas, sin volver a consultar el backend. Solo el botón "Aplicar" dispara una nueva consulta.
- Implementa el modo de visualización **Lista**: grilla con columnas fecha, hora, paciente, doctor, especialidad, estado, tipo y acciones, con scroll infinito bidireccional (30 turnos por página; primera carga siempre anclada a las 00:00 del día actual; scroll hacia arriba trae turnos anteriores, hacia abajo trae turnos posteriores).
- Estado del turno como pill con color por estado (5 estados: Programado, Confirmado, Atendido, Ausente, Cancelado). Tipo de turno como ícono (3 grupos visuales: primer turno, control, urgencia/sobreturno). Columna de acciones con botones estáticos por rol (sin lógica de habilitación por estado en esta etapa) y tooltips: Recepcionista/Administrador ven confirmar y cancelar; Médico ve llamar y finalizar.
- Los modos Día, Semana y Mes quedan seleccionables como tabs (actualizan la URL) pero renderizan un contenedor vacío, sin datos ni lógica.
- **BREAKING (modelo de datos)**: el enum `EstadoTurno` reemplaza `VENCIDO` por `ATENDIDO` y `AUSENTE`, quedando en 5 valores: `PROGRAMADO`, `CONFIRMADO`, `ATENDIDO`, `AUSENTE`, `CANCELADO`.
- Nuevo endpoint `GET /api/turnos`: paginación por cursor (no offset), filtros por médico/especialidad/paciente/incluir-cancelados, y scoping obligatorio server-side por rol (un médico nunca recibe turnos de otro médico, sin importar los query params recibidos).
- Nuevos endpoints mínimos de soporte para poblar los combos de filtros: listado de médicos (usuarios con rol MEDICO), listado de especialidades, listado de pacientes.
- Datos de desarrollo: se extiende `prisma/seed.ts` (no una migración de schema) para generar 5 médicos, 3 especialidades, 10 pacientes y al menos 100 turnos, distribuidos entre los tipos y estados de turno definidos.

## Capabilities

### New Capabilities

- `appointments-agenda`: layout compartido de la pantalla de Agenda de Turnos — título, formulario de filtros con defaults por rol, sincronización de filtros y modo de visualización con la URL, tabs de modo de visualización, checkbox de cancelados (solo cliente) y botón "Nuevo Turno" (stub, visible solo para Recepcionista/Administrador).
- `appointments-list`: modo de visualización Lista — grilla de turnos con scroll infinito bidireccional contra datos reales, columnas y su representación visual (pills de estado, íconos de tipo, botones de acción con tooltip), y el contrato de backend que la sostiene (endpoint paginado con scoping por rol y endpoints de soporte para los filtros).

### Modified Capabilities

_(ninguna: no existe todavía una capability de turnos en `openspec/specs/`; las capabilities de `auth` y `app-shell` se consumen sin cambios de requirements)_

## Impact

- `apps/web`: nueva página `agenda/page.tsx` funcional, componentes de filtros/tabs/grilla en `components/agenda/`, hook de datos y helpers de sincronización de URL en `lib/`.
- `apps/api`: nuevo módulo `appointments` (`GET /api/turnos`) y módulos mínimos de soporte para médicos, especialidades y pacientes.
- `packages/database`: migración de schema para `EstadoTurno` (reemplazo de `VENCIDO`) y extensión de `prisma/seed.ts` con el set de datos de prueba.
- `packages/shared-types`: nuevos contratos compartidos (DTOs de turno, enums de estado/tipo, tipos de query de filtros).
- Nueva dependencia en `apps/web`: `@tanstack/react-query` para el data-fetching sin caché del scroll infinito.
- `docs/FUNCIONAL.md` §7.3/§7.5 quedan desalineados con el nuevo `EstadoTurno` y deberán actualizarse como parte de esta implementación (fuera del alcance de lógica de negocio nueva: solo se documenta el enum vigente).
