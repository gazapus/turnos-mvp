## Context

La Agenda (`/agenda`) lista turnos (`GET /api/turnos`) y los muestra en Lista y Día. El botón "Nuevo Turno" no tiene handler. FullCalendar en Día usa `slotDuration="01:00:00"` sin `dateClick`/`eventClick`. El DTO de listado no trae IDs de médico/paciente/especialidad ni datos de contacto. Pacientes se buscan por nombre (`q`), no por documento. Médicos y especialidades son catálogos planos, sin `MedicoEspecialidad`. No hay toast ni dialog de error reutilizables; el único formulario RHF+Zod es login.

El modelo Prisma ya tiene `Turno`, `Paciente` (documento único, teléfono/mail opcionales), `notificarMail` y la tabla puente médico↔especialidad. No hace falta migración.

Zona horaria de clínica: `America/Argentina/Buenos_Aires` (`CLINIC_TIMEZONE`), igual que listado y vista Día.

## Goals / Non-Goals

**Goals:**

- Un popup único para crear (vacío o con fecha/hora) y para ver/editar un turno existente.
- Escritura de turnos y alta silenciosa de paciente desde recepción/admin.
- Lookup por documento, cruce médico↔especialidad, tipo Control/Urgente con Primer turno automático.
- Primitivas genéricas de toast de éxito y dialog de error.
- Click en hueco Día (15 min), click en card Día y click en fila de Lista; botón "Nuevo Turno" del layout.

**Non-Goals:**

- Colisiones, advertencia de sobreturno y tipo `SOBRETURNO` automático.
- Efecto real de Confirmar, Anular o Llamar (siguen stubs en el popup y en la columna Acciones; ciclo de vida en otro change).
- Edición de datos de un paciente ya persistido (campos locked si el documento existe).
- Checkbox WhatsApp.
- Semana/Mes.
- Forzar Control cuando el par paciente+médico es primera vez.

## Decisions

### 1. Estado del popup en `AgendaContent`, no en cada vista

Un leaf `TurnoFormDialog` montado en `AgendaContent` (junto al botón "Nuevo Turno"). Lista y Día no poseen el dialog: notifican intención (`onCrearEnHueco`, `onAbrirTurno`) hacia arriba.

Modo:

| Entrada | Título | Prefill |
| --- | --- | --- |
| Botón Nuevo Turno | Nuevo Turno | vacío; tipo Control |
| `dateClick` en Día | Nuevo Turno | fecha del día + hora del slot 15 min; fin = inicio + 30 min |
| Click en fila de Lista | Detalle de Turno | `GET /api/turnos/:id` |
| `eventClick` en card Día | Detalle de Turno | `GET /api/turnos/:id` |

Click en la fila de Lista (cualquier celda salvo la columna Acciones) abre el detalle. Los icon-buttons de Acciones MUST `stopPropagation` y siguen siendo stubs: no abren el popup ni mutan el turno.

Al cerrar (X, Salir o éxito de alta) se destruye el estado: el próximo open no retiene valores. Sin confirmación de descartar cambios.

Alternativa descartada: ruta `/agenda/nuevo` o query param `turnoId`. El wireframe es modal sobre la agenda; no conviene desmontar la grilla ni ensuciar la URL.

### 2. FullCalendar: slots de 15 minutos con etiquetas horarias

```
slotDuration: '00:15:00'
slotLabelInterval: '01:00:00'
```

`dateClick` entrega el inicio del cuarto de hora. Médico: `dateClick` no abre el alta. Click en card dispara `eventClick`, no `dateClick`.

Hueco de un día civil &lt; hoy: el popup igual se abre con esa fecha; la validación de fecha deja Guardar deshabilitado (el usuario puede corregir la fecha).

### 3. Un `POST /api/turnos` transaccional, no dos round-trips visibles

El cliente no llama `POST /pacientes` y después `POST /turnos`. El body acepta `pacienteId` **o** los datos del paciente nuevo (`documento`, `nombre`, `apellido`, `telefono?`, `mail?`). El service, en una transacción:

1. Si viene `pacienteId`, usa ese paciente (404 si no existe).
2. Si vienen datos: busca por documento normalizado; si existe, lo reutiliza (carrera entre dos recepcionistas); si no, lo crea.
3. Inserta el turno `PROGRAMADO` con `creadoPorId` = JWT `sub`.
4. Si cualquier paso falla, rollback y el filtro global arma el error.

UX: el usuario no ve el alta de paciente. Si el paciente falla, no hay turno y el dialog de error cubre el formulario.

`PATCH /api/turnos/:id` no crea pacientes. Puede reasignar `pacienteId` si el documento cambió a uno existente o, si el documento no existe, crear el paciente nuevo en la misma transacción (mismo criterio que el alta).

Alternativa descartada: dos endpoints secuenciales desde el cliente — deja pacientes huérfanos si el turno falla.

### 4. Contratos de API

Escritura y detalle en `appointments`. Paciente por documento en `pacientes`. Catálogos: se **agregan** IDs cruzados (no breaking).

| Método | Ruta | Quién | Rol |
| --- | --- | --- | --- |
| GET | `/api/turnos/:id` | Detalle para el popup | Autenticado; médico solo si `medicoId = sub` |
| POST | `/api/turnos` | Alta | RECEPCIONISTA, ADMIN |
| PATCH | `/api/turnos/:id` | Edición | RECEPCIONISTA, ADMIN; solo `PROGRAMADO` y fecha (civil clínica) ≥ hoy |
| GET | `/api/turnos/primera-vez?pacienteId=&medicoId=` | `{ primeraVez: boolean }` | Autenticado |
| GET | `/api/pacientes?documento=` | 0 o 1 paciente con contacto | Autenticado |
| GET | `/api/usuarios` | Médicos + `especialidadIds[]` | ya existía |
| GET | `/api/especialidades` | Especialidades + `medicoIds[]` | ya existía |

`GET /api/pacientes?q=` y `GET /api/pacientes/:id` (DTO mínimo del filtro) no cambian de semántica. El lookup por documento **no** usa 404 cuando no hay padrón: 200 con cuerpo vacío/`null` (no encontrado es el caso normal).

Documento: se normaliza a dígitos para buscar y persistir (el seed ya es `20000001`). El input puede mostrar lo que tipeó el usuario.

Fechas en API: `fecha` `YYYY-MM-DD` + `horaInicio`/`horaFin` `HH:mm` en zona clínica, o un ISO; se interpretan con `CLINIC_TIMEZONE` igual que el listado. Preferir fecha + horas locales para no pelear con UTC en el form.

Si `horaFin` &lt; `horaInicio` (cruce de medianoche, p. ej. 23:45–00:15), `fechaFin` es el día civil siguiente.

No hay validación de solapamiento en este change.

### 5. Tipificación

El usuario elige **Control** o **Urgente**. **Primer turno** no es opción manual.

- Paciente aún no persistido, o `primeraVez === true`, y la elección no es Urgente → persistir `PRIMER_TURNO` y mostrarlo en el campo.
- Si elige Urgente → `URGENTE` (pisa lo automático).
- Si vuelve de Urgente a Control → se recalcula Primer turno vs Control.
- Recalcular al cambiar médico o paciente identificado, salvo que Urgente esté elegido.
- Al abrir un turno `SOBRETURNO` (seed): el campo muestra Sobreturno; Guardar sin tocar tipo deja `SOBRETURNO`. Si el usuario pasa a Control o Urgente, se persiste ese valor. Este change **nunca** asigna `SOBRETURNO` en un alta.

Consulta `primera-vez`: existe algún turno previo de ese par paciente+médico (cualquier estado). En edición se excluye el propio `id`.

### 6. Quién puede persistir

Guardar visible y habilitado solo si:

1. Rol RECEPCIONISTA o ADMIN, y
2. Modo crear **o** (detalle con `PROGRAMADO` **y** fecha civil ≥ hoy), y
3. Form válido, y
4. En detalle, `isDirty`.

Si 2 falla (no PROGRAMADO, o fecha pasada): no se muestra Guardar; campos de turno y paciente en solo lectura (mismo techo que el médico). Confirmar/Anular/Llamar siguen visibles como stubs.

Médico: todos los campos disabled; botones Llamar + Salir (Llamar sin handler). No ve Guardar, Confirmar ni Anular.

Crear: no se muestran Confirmar ni Anular.

Tooltips de Guardar deshabilitado (wrapper, no `disabled` nativo):

- Crear o detalle inválido: faltan completar campos.
- Detalle válido y limpio: no hay cambios que guardar.

### 7. Paciente en el form

Debounce 1500 ms **o** blur sobre documento → `GET ?documento=`.

- Hit: llena nombre, apellido, teléfono, mail; esos campos `readOnly`; solo notificar es editable (si hay mail válido).
- Miss: deja editables nombre/apellido/teléfono/mail; no borra lo que el usuario ya escribió en esos campos si el documento no cambió desde el último miss.
- Si el documento cambia respecto del paciente precargado: se limpian nombre, apellido, teléfono, mail y el `pacienteId`, y se relanza el lookup.

Teléfono: solo dígitos, máximo 15. Mail: formato email, máximo 50; opcional. Nombre y apellido: 3–45, obligatorios. Documento obligatorio.

Notificar: checkbox (no switch de librería). Deshabilitado sin mail válido. Tooltip en checkbox+label: «Se enviará un recordatorio por email». Sin subtexto. Paciente existente sin mail: no se puede notificar ni cargar mail en este popup.

### 8. Cruce médico ↔ especialidad

Mismos `Combobox` que los filtros (catálogo local). Al montar el form se usan los catálogos ya cacheados o un fetch. Filtrado cruzado en cliente con `especialidadIds` / `medicoIds`.

Si el listado filtrado tiene **un** ítem, se selecciona solo. Si la selección actual queda fuera del filtro del otro campo, se vacía y, si queda uno, se autoselecciona.

Médico en detalle para rol Médico: el campo muestra el médico del turno, disabled (no usa el filtro de agenda).

### 9. Validación visual y Guardar

RHF + Zod, `mode: 'onChange'` (o equivalente) para que el error desaparezca al corregir. Cada campo reserva altura para el mensaje (`min-height` / espacio fijo) para que el layout no salte.

Obligatorios: médico, especialidad, tipo, fecha, hora inicio, hora fin, documento, nombre, apellido. Opcionales: teléfono, mail, notificar.

Fecha ≥ día civil actual (clínica). Hora fin estrictamente posterior a hora inicio el mismo día, **o** al día siguiente si cruzó medianoche. Cualquier hora del día está permitida (incluido el pasado de hoy).

### 10. Feedback genérico, sin librería nueva

Primitivas propias en `apps/web/components/ui/`, mismo criterio que `Combobox` (sin Radix/Sonner):

- `SuccessToast`: mensaje, 5 s visibles, fade-out 1 s, dismissible. Provider + `toastSuccess(message)` en el shell autenticado `(app)/layout`.
- `ErrorDialog`: overlay encima de lo que haya (incluido el form), título/mensaje amigable fijo por contexto + `detalle` = `ApiError.message` (ya sale de `AllExceptionsFilter`). Solo botón Cerrar; no se cierra por overlay click ni Escape si se está mostrando un error de guardado (el usuario debe leerlo). El X del form no cierra el error.

Alta OK: cierra el popup, toast «Turno guardado correctamente» (o equivalente corto), invalida queries de Lista y Día.

Edición OK: popup sigue abierto, `reset()` con los valores guardados (Guardar vuelve a disabled), mismo toast, invalida queries.

Mientras POST/PATCH: overlay/spinner en el form, botones de acción disabled excepto que el procesamiento no se aborte con X (X cierra y abandona; la mutación in-flight se ignora al desmontar). Detalle: mientras `GET :id`, overlay que bloquea el form; X aborta (`AbortController`) y cierra.

### 11. Asset y UI del popup

Copiar `wireframes/appointments-background.png` a `apps/web/public/images/agenda/appointments-background.png`. El dialog usa esa imagen de fondo, bordes redondeados, token `surface` / `on-elevated`. Sin subtítulo. Ícono de título: `CalendarPlus` (lucide). Secciones "Información del turno" y "Datos del paciente" como en el wireframe.

Labels: **Fecha** (no "Fecha de inicio"). Hora de inicio / Hora de fin.

Botones pie: izquierda Anular (detalle recep/admin, sin subtexto); derecha Salir + Guardar. Confirmar turno / Llamar paciente centrados o donde el wireframe pone Confirmar, según rol.

### 12. Permisos de backend alineados al médico

`JwtAuthGuard` en todos. POST/PATCH: 403 si rol MEDICO. GET detalle: si MEDICO y el turno no es suyo, 404 (no filtrar existencia). PATCH a no PROGRAMADO o fecha civil &lt; hoy: 409 o 400 con mensaje legible para el dialog.

## Risks / Trade-offs

- **[Riesgo]** Alta sin chequeo de solapamiento genera dobles bookings reales → **[Mitigación]** alcance explícito; el change de ciclo de vida/sobreturno lo cubre. El schema ya documenta la transacción futura.
- **[Riesgo]** Paciente existente sin mail no puede notificarse → **[Mitigación]** aceptado; edición de paciente es otro change.
- **[Riesgo]** Extender DTOs de filtro con `especialidadIds`/`medicoIds` cambia el contrato de combos de agenda → **[Mitigación]** campos aditivos; el filtro los ignora.
- **[Riesgo]** `dateClick` en días pasados abre un form que no se puede guardar hasta cambiar la fecha → **[Mitigación]** validación visible en Fecha; no se bloquea el click para no inventar un estado “hueco muerto”.
- **[Riesgo]** Tooltip en botón `disabled` no dispara hover → **[Mitigación]** wrapper con `title`/`Tooltip` y `pointer-events`.
- **[Riesgo]** Dos recepcionistas crean el mismo documento a la vez → **[Mitigación]** unique de `documento` + transacción: el segundo reutiliza o recibe error de unique mapeado a mensaje amigable.

## Migration Plan

1. Contratos en `shared-types` y DTOs Nest.
2. API de lectura (detalle, documento, primera-vez, IDs cruzados) y tests.
3. API de escritura transaccional y tests.
4. Primitivas `ui` (toast, error dialog) + tests.
5. Popup + wiring del botón y de Día; asset de fondo.
6. Invalidación de queries de agenda al guardar.

Sin migración Prisma. Rollback: no usar los endpoints nuevos; el listado no depende de ellos.

## Open Questions

Ninguna bloqueante. Sobreturno persistido se muestra y solo cambia si el usuario elige Control o Urgente. Hueco en día pasado abre el alta con fecha inválida.
