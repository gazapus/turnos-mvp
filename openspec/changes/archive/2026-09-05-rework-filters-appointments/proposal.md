## Why

Los filtros de la Agenda usan `<select>` nativos que no escalan: el combo de paciente carga el padrón completo, no se puede tipear para encontrar un médico o especialidad, y no hay forma de volver a los defaults. El checkbox "Cancelados" solo esconde un estado en memoria y deja visibles turnos ya cerrados (`ATENDIDO`, `AUSENTE`), que el médico no quiere ver por defecto.

## What Changes

- Reemplaza los tres `<select>` del formulario (médico, especialidad, paciente) por combobox con búsqueda: tipear filtra opciones; Enter, Tab o click selecciona la resaltada. Campo vacío = "Todos", mostrado como placeholder, no como ítem de la lista.
- Médico y especialidad siguen cargando el catálogo completo y filtran en cliente. Paciente no carga el padrón al montar: busca en el API recién con ≥ 3 caracteres y debounce de 1 s, máximo 30 resultados, match substring case-insensitive en `nombre` **o** `apellido`. Label de opción: `Apellido, Nombre` (sin documento).
- Si la URL ya trae `pacienteId`, hidrata el combobox con `GET /api/pacientes/:id` para mostrar el nombre sin listar el padrón.
- Agrega un botón de reset al lado de "Aplicar": cuadrado, mismo alto que Aplicar, sin texto, ícono de flecha en círculo, fondo blanco y borde/ícono de alto contraste. Al activarlo restablece médico/especialidad/paciente y "Solo Pendientes" a los defaults del rol (el médico sigue anclado a su usuario) y dispara la búsqueda.
- **BREAKING (UI y URL):** el checkbox "Cancelados" (filtro solo cliente, query param `cancelados`) se reemplaza por "Solo Pendientes". Marcado filtra en el **backend** a estados `PROGRAMADO` y `CONFIRMADO` (oculta `ATENDIDO`, `AUSENTE`, `CANCELADO`) y dispara refetch con loader. Default: destildado para Admin/Recepción; tildado para Médico.
- **BREAKING (API):** `GET /api/turnos` deja de usar `incluirCancelados`. Lo reemplaza `soloPendientes` (boolean). `GET /api/pacientes` deja de devolver el padrón completo: acepta `q` (búsqueda) y se agrega `GET /api/pacientes/:id`.

## Capabilities

### New Capabilities

_(ninguna: el rework vive en las capabilities de Agenda ya existentes)_

### Modified Capabilities

- `appointments-agenda`: combobox en los tres filtros, placeholder "Todos", botón reset, checkbox "Solo Pendientes" con defaults por rol, URL `soloPendientes` en lugar de `cancelados`.
- `appointments-list`: contrato de `GET /api/turnos` con `soloPendientes`; `GET /api/pacientes` con búsqueda acotada y `GET /api/pacientes/:id`; el listado deja de filtrar cancelados en memoria.
- `appointments-day`: el checkbox deja de filtrar en cliente sin refetch; Día respeta `soloPendientes` vía la misma consulta a `GET /api/turnos`.

## Impact

- `apps/web`: `agenda-filtros-form`, nuevo combobox reutilizable, toggle de pendientes, `url-params`, `turnos-client`, `turnos-listado`, `agenda-dia` (sacar filtro en memoria; incluir el param en `queryKey`).
- `apps/api`: `appointments` (`soloPendientes` reemplaza `incluirCancelados`); `pacientes` (query `q` + `GET :id`).
- `packages/shared-types`: `TurnosListQuery`, `AgendaUrlParams`, contratos de paciente.
- Sin migración de schema. Sin dependencias UI nuevas si el combobox se implementa como primitive propia (`lucide-react` ya cubre el ícono de reset).
