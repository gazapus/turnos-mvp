## Context

La Agenda (`/agenda`) ya tiene formulario de filtros con tres `<select>` nativos (médico, especialidad, paciente), botón "Aplicar" y checkbox "Cancelados" solo cliente. `GET /api/pacientes` devuelve el padrón completo sin documento ni búsqueda. `GET /api/turnos` acepta `incluirCancelados`, pero el front siempre lo manda `true` y filtra `CANCELADO` en memoria (Lista y Día). El query param de URL es `cancelados`.

No hay primitive de combobox ni librería de UI (Radix/cmdk/Downshift). `lucide-react` ya está en `apps/web`. El usuario de sesión (`AuthUser`) incluye `id`, `nombre` y `apellido`, suficiente para hidratar el médico locked.

Este change es transversal: web (formulario, toggle, query keys) + API (turnos y pacientes) + contratos en `shared-types`.

## Goals / Non-Goals

**Goals:**

- Combobox tipeable en médico, especialidad y paciente, con placeholder "Todos" (campo vacío = sin filtro).
- Paciente remoto: ≥ 3 caracteres, debounce 1 s, `ILIKE` en nombre **o** apellido, tope 30, hidratación por `GET /api/pacientes/:id`.
- Botón reset (ícono, cuadrado) que vuelve a defaults de rol — incluido "Solo Pendientes" — y dispara la búsqueda.
- "Solo Pendientes" reemplaza "Cancelados": filtrado en backend (`PROGRAMADO` | `CONFIRMADO`), refetch con loader al togglear.

**Non-Goals:**

- Mostrar o buscar por documento de paciente.
- Autocompletado cruzado médico ↔ especialidad (eso es del alta de turno, FUNCIONAL.md §7.1).
- Cambiar paginación, vistas Semana/Mes, o acciones de turno.
- Migrar bookmarks viejos con `cancelados` (MVP interno; el param se ignora).
- Extraer el combobox a un design system publicado; queda como primitive de `apps/web`.

## Decisions

### 1. Combobox propio, no una librería nueva

Se implementa un leaf `Combobox` en `apps/web/components/` (p. ej. `components/ui/combobox.tsx`) con input + listbox, teclado (flechas, Enter, Tab, Escape) y click. Enter/Tab seleccionan la opción resaltada y **no** disparan submit del form (el `<form>` sigue teniendo "Aplicar" como submit).

Alternativas descartadas: `cmdk`, Downshift, Radix Combobox. Sumar dependencia para tres campos es desproporcionado; el patrón es acotado y se reutilizará en el alta de turno.

Dos fuentes de opciones, mismo control:

| Modo | Campos | Fetch |
| --- | --- | --- |
| Local | médico, especialidad | catálogo completo al montar; filtro cliente |
| Remoto | paciente | no fetch al montar; `q` + debounce |

Valor controlado (`id` o `''`). Label mostrado: `Apellido, Nombre` (especialidad: `nombre`). Vacío muestra placeholder "Todos". El rol Médico deja el combobox de médico `disabled` con su usuario de sesión (sin depender del listado).

### 2. `GET /api/pacientes` deja de listar el padrón

- `GET /api/pacientes?q=` exige `q` recortado de longitud ≥ 3. Si falta o es más corto, responde `[]` (no 400: el cliente puede disparar el request a destiempo). Match: `nombre ILIKE '%q%' OR apellido ILIKE '%q%'`, case-insensitive, orden apellido/nombre, `take 30`.
- `GET /api/pacientes/:id` devuelve el DTO mínimo (`id`, `nombre`, `apellido`) o 404. Sirve para hidratar el combobox cuando la URL ya trae `pacienteId`.
- El DTO **no** agrega `documento`.

Debounce de 1 s y umbral de 3 caracteres viven en el cliente (cancelar in-flight / ignorar respuestas stale). El servidor aplica el mismo umbral como red de seguridad.

### 3. `soloPendientes` reemplaza `incluirCancelados` y `cancelados`

Semántica de API (`GET /api/turnos?soloPendientes=`):

- `true` → `estado IN (PROGRAMADO, CONFIRMADO)`
- `false` o ausente → sin filtro de estado

El front siempre envía el boolean según la URL. `incluirCancelados` se elimina del DTO, `shared-types` y el cliente. El filtro en memoria (`filterTurnosDia`, `visibleItems` en Lista) desaparece.

URL de agenda: query param `soloPendientes` (`true`/`false`), serializado siempre (igual que hoy `cancelados`). Ausente en la URL → default por rol:

| Rol | Default |
| --- | --- |
| ADMIN, RECEPCIONISTA | `false` (destildado) |
| MEDICO | `true` (tildado) |

Togglear el checkbox actualiza la URL **y** refetch (queda en el `queryKey` de Lista y Día). Se muestra el loader ya existente al recargar.

"Aplicar" sigue sin tocar `soloPendientes` (vive fuera del form). Reset sí lo vuelve al default del rol.

### 4. Reset: mismo alto que Aplicar, cuadrado, tokens de contraste

Botón `type="button"` al lado de Aplicar: `RotateCcw` de lucide, sin texto visible, `aria-label` "Restablecer filtros". Mismo alto que Aplicar (`py-2` + `text-sm`); ancho = alto (cuadrado). Estilo con tokens: `bg-background border-foreground text-foreground` (blanco / trazo oscuro, sin hex).

Al activar: `medicoId` vacío salvo rol Médico (queda `user.id`); `especialidadId` y `pacienteId` vacíos; `soloPendientes` al default del rol; `vista` y `fecha` no se tocan; `router.replace` dispara la búsqueda.

### 5. Hidratación de paciente seleccionado

Si `params.pacienteId` está definido, un `useQuery` a `GET /api/pacientes/:id` llena el label del combobox. Si 404, el campo queda vacío (Todos) y al Aplicar/Reset se limpia el param inválido en el próximo write de URL — no se borra solo al montar para evitar loops.

## Risks / Trade-offs

- [Combobox a mano, a11y incompleta] → Mitigación: roles `combobox`/`listbox`/`option`, `aria-activedescendant`, tests de teclado (Enter/Tab/flechas) en el primitive.
- [Debounce 1 s se siente lento] → Pedido explícito; no bajarlo en este change.
- [`q` corto o `GET /api/pacientes` sin query ya no trae el padrón] → Contrato nuevo; el único consumidor actual es el form de Agenda.
- [Param `cancelados` en URLs viejas se ignora] → Defaults por rol cubren el caso feliz; no hay usuarios externos.

## Migration Plan

1. Backend primero: `soloPendientes` + búsqueda/id de pacientes (el front viejo deja de compilar al sacar `incluirCancelados` del paquete compartido, deploy conjunto).
2. Front: combobox, reset, toggle, URL, query keys, borrar filtro en memoria.
3. Rollback: revertir el change; no hay migración de DB.

## Open Questions

_(ninguna: cerradas en exploración — match OR en nombre/apellido, hidratar paciente por id, Solo Pendientes a la API con refetch)_
