## Why

El CU 7 (configurar consultorio de médico) es un eslabón del circuito llamado → sala de espera: sin asignación 1:1 el aviso público no puede mostrar `CONSULTORIO {n}`. Hoy `/consultorios` es un stub y el schema guarda texto libre por médico, incompatible con un listado numerado de consultorios vacíos u ocupados.

## What Changes

- Reemplazar el modelo de consultorio como texto libre (`medico_consultorio`) por un **catálogo numerado en BD**. Esta UI no crea ni borra consultorios; solo asigna médicos. Seed de desarrollo: 20 filas (números 1–20).
- Pantalla `/consultorios` (admin y recepcionista): todas las filas del catálogo, ordenadas por número ascendente, cada una con el número y un Combobox de médico (mismo control que filtros/formulario de turnos). Un médico no puede tener dos consultorios; un consultorio no puede tener dos médicos.
- Asignar a un médico que ya tenía otro consultorio **libera el anterior**. Se puede dejar un consultorio vacío (opción “Sin asignar” / borrar el combo).
- Confirmación warning cuando alguien **pierde** un consultorio (mover, reemplazar, mover+desalojar, desasignar). Llenar un consultorio vacío con un médico libre se aplica **de inmediato**, sin dialog. Mismo médico en el mismo consultorio = no-op. Éxito **sin toast**; error con dialog danger y el combo vuelve al valor anterior.
- Grilla adaptable: hasta 3 / 2 / 1 columnas según viewport (desktop / mediana / chica), mínimo 8 filas antes de abrir otra columna, reparto igual si la columna más corta queda ≥ 8; si no, primeras de 8 y resto al final (p. ej. 10 → 8+2). Sin paginación. Estilo alineado a la lista de turnos.
- Médico inactivo: este change **no** libera su consultorio. El combo lista médicos activos; si hay un inactivo asignado, la fila lo muestra igual.
- Sala de espera (fuera de esta UI) seguirá mostrando `CONSULTORIO {n}` armado desde el número; no se persiste el string.

## Capabilities

### New Capabilities

- `consultorios`: catálogo numerado, asignación 1:1 médico↔consultorio, pantalla `/consultorios`, contratos GET/PATCH, reglas de confirmación, layout multi-columna y feedback (sin toast de éxito).

### Modified Capabilities

- (ninguna) El ítem de menú y la ruta `/consultorios` ya están en `app-shell`. `ui-feedback` se reutiliza sin cambiar requisitos.

## Impact

- `packages/database`: nueva entidad `Consultorio` (número único, `medicoId` opcional único); migración que reemplaza `medico_consultorio`; seed de 20 consultorios.
- `apps/api`: módulo `consultorios` (`/api/consultorios`) restringido a ADMIN y RECEPCIONISTA; transacción al reasignar.
- `apps/web`: reemplazo del stub de `/consultorios`; Combobox, `showConfirm` / `showError`; helper de layout testeable.
- `packages/shared-types`: DTOs de listado y asignación.
- Fuera de alcance: CRUD de catálogo, sala de espera / llamado, liberación al dar de baja un usuario, paginación, toast de éxito.
