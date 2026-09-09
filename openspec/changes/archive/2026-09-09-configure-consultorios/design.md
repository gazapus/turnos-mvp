## Context

CU 7 está stub: `/consultorios` es placeholder, el menú (admin / recepcionista) ya existe en `app-shell`. El schema actual (`MedicoConsultorio`) es médico-céntrico y guarda un string libre en MAYÚSCULAS; no hay catálogo de consultorios vacíos. La sala de espera (aún no implementada) necesita `CONSULTORIO {n}` a partir de una asignación 1:1 fija.

Actores: Administrador y Recepcionista escriben; el Médico no ve el ítem y la API le responde 403. Feedback (`showConfirm` warning, `showError` danger) y `Combobox` ya existen. `GET /api/usuarios` ya lista médicos activos.

## Goals / Non-Goals

**Goals:**

- Catálogo numerado persistido (`Consultorio.numero` único) como fuente de las filas.
- Asignación 1:1 (un médico ↔ un consultorio) con liberación del consultorio anterior al reasignar.
- Pantalla `/consultorios` con Combobox por fila, layout multi-columna y confirmación cuando alguien pierde un consultorio.
- API `GET`/`PATCH /api/consultorios` para listar y asignar (incluido `medicoId: null`).
- Semilla inicial de números 1–20 en la migración (sin CRUD de catálogo).

**Non-Goals:**

- Alta/baja/renumeración de consultorios en UI.
- Sala de espera, llamado de turno, formateo en pantalla pública (sí el contrato `CONSULTORIO {n}`).
- Liberar consultorio al dar de baja un usuario.
- Toast de éxito.
- Paginación.
- Cambiar el `Combobox` genérico más de lo necesario.

## Decisions

### 1. Entidad `Consultorio` reemplaza `MedicoConsultorio`

La UI es consultorio-céntrica (filas = consultorios, celda = médico opcional). El PK actual (`medico_id`) no puede representar un consultorio vacío.

```
Consultorio
  id         uuid PK
  numero     int UNIQUE          -- 1, 2, … orden de pantalla
  medicoId   uuid? UNIQUE FK     -- null = libre
```

Relación `Usuario.consultorio` 0..1. Se **elimina** el model `MedicoConsultorio` y la tabla `medico_consultorio` (sin datos de seed; el string libre no se migra).

Nombre canónico para consumidores futuros (sala de espera): `` `CONSULTORIO ${numero}` `` en mayúsculas. No se persiste el string.

Alternativa descartada: seguir con texto libre — no hay lista de vacíos ni unicidad real de “CONSULTORIO 7”.

### 2. El catálogo nace en la migración (20 filas)

Sin CRUD, producción y desarrollo necesitan filas. La migración crea la tabla e inserta números **1–20**. El seed de usuarios **no** vuelve a insertar consultorios (idempotente: ya existen).

N=20 en desktop (max 3 columnas) cae en 8+8+4 con el algoritmo de layout.

### 3. Contratos HTTP

Nuevo módulo Nest `apps/api/src/consultorios/` (barrel, DTOs Swagger, tests). Prefijo global `api`.

| Método | Ruta | Body | Quién | 200 |
| --- | --- | --- | --- | --- |
| `GET` | `/api/consultorios` | — | ADMIN, RECEPCIONISTA | `ConsultorioResponseDto[]` ordenados por `numero` ASC |
| `PATCH` | `/api/consultorios/:id` | `{ medicoId: string \| null }` | ADMIN, RECEPCIONISTA | snapshot completo del catálogo |

`ConsultorioResponseDto`: `{ id, numero, medico: { id, nombre, apellido } | null }`. Si el médico asignado está inactivo, **igual se incluye** en `medico` para que la fila no quede muda.

Médico: 403. Anónimo: 401. `:id` inexistente: 404. `medicoId` que no es UUID válido ni `null`: 400. Usuario inexistente, no `MEDICO`, o inactivo al **asignar**: 400 con `message` legible. Un PATCH que deja el mismo `medicoId` ya puesto: 200 no-op.

Alternativa descartada: PATCH que devuelve una sola fila — el swap toca dos consultorios; el cliente reemplaza la lista entera (N ≤ 20).

### 4. Reasignación atómica en transacción

```
-- asignar médico M al consultorio C
UPDATE consultorios SET medico_id = NULL WHERE medico_id = M AND id <> C;
UPDATE consultorios SET medico_id = M WHERE id = C;
```

Desasignar: `UPDATE consultorios SET medico_id = NULL WHERE id = C`.

Unicidad de `medico_id` en BD como red de seguridad. Conflicto único (dos recepcionistas) → 409 o 400 con mensaje; la UI muestra `showError` y refresca el listado.

La confirmación es **solo UX**. El backend aplica siempre que el rol y el médico sean válidos.

### 5. Confirmación en cliente, no en API

Se pide `showConfirm` (warning, sin textarea) cuando el cambio haría que **alguien pierda** un consultorio.

| Caso | Confirmar | Copy (título) |
| --- | --- | --- |
| C vacío + M libre | No | — |
| C vacío + M estaba en C0 | Sí | `{Apellido, Nombre} ya está en el {n0}. ¿Moverlo al {n} y dejar el {n0} libre?` |
| C ocupado por X + M libre | Sí | `El consultorio {n} está asignado a {X}. ¿Asignarlo a {M} y dejar a {X} sin consultorio?` |
| C ocupado por X + M estaba en C0 | Sí | `{M} ya está en el {n0} y el {n} está asignado a {X}. ¿Mover a {M} al {n}, dejar el {n0} libre y dejar a {X} sin consultorio?` |
| Desasignar M de C | Sí | `¿Desasignar a {M} del consultorio {n}?` |
| M ya está en C | No-op | — |

Nombres: `Apellido, Nombre` (igual que agenda). Cancelar el dialog no persiste. Aceptar dispara el PATCH.

Éxito: invalidar/reemplazar el listado, **sin toast**. Error: `showError('No se pudo asignar el consultorio', message)`; el Combobox permanece en el valor anterior (el estado local no se pisa hasta el 200).

### 6. Combobox: opción “Sin asignar”, no persistir al tipear

El `Combobox` actual llama `onChange('')` al borrar texto para buscar. Persistirlo desasignaría en cada búsqueda.

- Opciones: médicos **activos** (`GET /api/usuarios`) más `{ id: SIN_ASIGNAR, label: 'Sin asignar' }` (`SIN_ASIGNAR` constante, no UUID).
- Solo se dispara asignación al **seleccionar una opción**. `onChange('')` por tipeo se ignora; al cerrar, el input vuelve al label actual.
- Médico inactivo ya asignado: `selectedLabel` con su nombre aunque no esté en las opciones; no aparece para otros consultorios.

Médicos ya asignados a *otro* consultorio **sí** se listan (si no, no se los puede mover).

### 7. Layout multi-columna (función pura)

Breakpoints del tema, desktop-first:

| Viewport | `maxCols` |
| --- | --- |
| ≥ `lg` (1024px) | 3 |
| ≥ `md` y &lt; `lg` | 2 |
| &lt; `md` (768px) | 1 |

```
MIN_ROWS = 8
C = min(maxCols, max(1, ceil(N / 8)))
reparto igual entre C columnas (el resto a las primeras)
si C == 1 o min(reparto) >= 8 → usar ese reparto
si no → C-1 columnas de 8 y la última con el resto
```

Ejemplos: 5 → [5]; 10 → [8, 2] (desktop/mediana); 20 → [8, 8, 4] desktop / [10, 10] mediana / [20] chica; 25 → [9, 8, 8]; 30 → [10, 10, 10].

Particionado **column-major**: columna 1 = consultorios 1..k, luego la de la derecha. Gap entre columnas. Sin paginación. Helper `splitConsultorioColumns(n, maxCols)` en `apps/web/lib/consultorios/` con tests de los ejemplos.

Estilo: mismos tokens que la lista de turnos (`border-border`, `bg-input`, `text-sm`, panel glass, encabezado muted). Número a la izquierda, Combobox al lado.

### 8. Frontend y autorización

- Server page `app/(app)/consultorios/page.tsx` hidrata sesión (como agenda) y monta un leaf client.
- Leaf: query del catálogo + médicos; grid; hook de asignación.
- Middleware no filtra por rol (igual que el resto). Médico que entra a la URL: GET 403 → mensaje de error en página, sin grilla.
- Cliente HTTP dedicado `lib/api/consultorios-client.ts`. Query key `['consultorios']`.

### 9. Médico inactivo

Este change no toca baja de usuarios. GET sigue devolviendo el médico inactivo asignado. PATCH no permite *asignar* un inactivo. No hay job ni cascade que libere el consultorio.

## Risks / Trade-offs

- **[Tipeo del Combobox ≠ desasignar]** → Opción explícita “Sin asignar”; ignorar `onChange('')` de búsqueda. Se aparta de “borrar el texto = vaciar”, pero evita desasignar al filtrar.
- **[Dos recepcionistas]** → Unique en `medico_id` + mensaje + refetch.
- **[Catálogo fijo 1–20]** → Cambiar N implica SQL/seed, no UI. Aceptable hasta un CRUD futuro.
- **[Inactivo ocupando fila]** → Puede verse un médico que ya no loguea; se documenta para el change de usuarios.
- **[Médico y URL directa]** → 403 de API; no se agrega matcher de rol en middleware (no es el patrón actual).

## Migration Plan

1. Prisma: crear `consultorios`, insertar 1–20, dropear `medico_consultorio`, actualizar relación en `Usuario`.
2. Deploy API + web juntos (el modelo viejo deja de existir).
3. Rollback: revertir migración (recrea `medico_consultorio` vacía) y el módulo.

## Open Questions

Ninguna: catálogo en BD (migración 1–20), confirmación si alguien pierde consultorio, layout 8+2, desasignar con confirmación, `CONSULTORIO {n}`, inactivo no se libera en este change.
