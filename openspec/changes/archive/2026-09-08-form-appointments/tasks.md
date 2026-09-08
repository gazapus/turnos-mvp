## 1. Contratos compartidos

- [x] 1.1 Extender `packages/shared-types`: `PacienteDetalleDto` (id, documento, nombre, apellido, telefono, mail), `TurnoDetalleDto`, body de `POST`/`PATCH` de turno (pacienteId o datos de paciente nuevo, medicoId, especialidadId, fecha, horas, tipo, notificarMail), `PrimeraVezResponse`, y `especialidadIds` / `medicoIds` aditivos en las opciones de catálogo
- [x] 1.2 Exportar los tipos nuevos desde el barrel de `shared-types`

## 2. Backend — pacientes y catálogos

- [x] 2.1 Extender `GET /api/pacientes` con query `documento` (normalizado a dígitos): 200 con detalle de contacto o vacío, nunca 404 por miss; no romper `q` ni `GET :id` mínimo del filtro
- [x] 2.2 Incluir `especialidadIds` en el DTO de médicos y `medicoIds` en el de especialidades
- [x] 2.3 Tests de controller/service: lookup por documento (hit/miss), y catálogos con ids cruzados

## 3. Backend — detalle, primera vez y escritura de turnos

- [x] 3.1 `GET /api/turnos/primera-vez` (ruta estática **antes** de `:id`): `{ primeraVez }` para el par paciente+médico; en presencia de `excluirTurnoId` no contar ese turno
- [x] 3.2 `GET /api/turnos/:id` → `TurnoDetalleDto`; médico solo el suyo (404 si no); Swagger + `JwtAuthGuard`
- [x] 3.3 `POST /api/turnos` transaccional: crea o reutiliza paciente por documento, inserta `PROGRAMADO`, `creadoPorId` del JWT; 403 para MEDICO; sin validar solapamiento; calcular `PRIMER_TURNO` vs `CONTROL` vs `URGENTE` según spec
- [x] 3.4 `PATCH /api/turnos/:id`: mismos campos editables; 403 MEDICO; rechazar si no es `PROGRAMADO` o fecha civil &lt; hoy; misma transacción de paciente si cambia el documento
- [x] 3.5 Interpretar fecha + horas en `CLINIC_TIMEZONE`; si hora fin &lt; hora inicio, `fechaFin` al día siguiente
- [x] 3.6 Tests de controller/service: alta con paciente nuevo y existente, rollback si falla paciente, scoping médico, PATCH rechazado por estado/fecha, primera vez

## 4. Frontend — primitivas de feedback

- [x] 4.1 Copiar `wireframes/appointments-background.png` a `apps/web/public/images/agenda/appointments-background.png`
- [x] 4.2 Implementar toast de éxito genérico (provider en layout autenticado, 5 s + fade 1 s) en `components/ui/` con test
- [x] 4.3 Implementar dialog de error genérico (mensaje amigable + detalle, solo Cerrar, overlay sobre otras modales) en `components/ui/` con test
- [x] 4.4 Exportar las primitivas desde el barrel `components/ui`

## 5. Frontend — cliente HTTP y schema del form

- [x] 5.1 Extender `turnos-client` (o cliente dedicado) con detalle, alta, edición, lookup por documento, primera vez, y catálogos con ids cruzados; reutilizar `ApiError`
- [x] 5.2 Schema Zod + tipos RHF: validaciones de documento, nombre/apellido 3–45, mail opcional máx. 50, teléfono dígitos máx. 15, fecha ≥ hoy clínica, hora fin posterior a inicio

## 6. Frontend — popup de turno

- [x] 6.1 `TurnoFormDialog` (leaf): layout del wireframe (secciones, fondo, `CalendarPlus`, X, sin subtítulo), campos de información del turno y datos del paciente, espacio reservado para errores
- [x] 6.2 Combobox médico/especialidad con cruce y autoselect de opción única; tipo Control/Urgente + Primer turno automático vía `primera-vez` (paciente nuevo = primera vez)
- [x] 6.3 Lookup de documento (debounce 1,5 s o blur), lock de campos si existe, limpieza al cambiar documento, notificar solo con mail válido (tooltip, sin subtexto)
- [x] 6.4 Botones por modo/rol: alta Salir+Guardar; detalle recep/admin Confirmar y Anular stubs sin subtexto + Guardar si PROGRAMADO y fecha ≥ hoy; médico Llamar stub + Salir, todo read-only
- [x] 6.5 Guardar: disabled + tooltip (campos incompletos / sin cambios); overlay de procesamiento; alta cierra + toast; edición permanece + toast + reset dirty; error abre `ErrorDialog` y no cierra
- [x] 6.6 Overlay de carga de detalle con X que aborta (`AbortController`); al cerrar, reset total del form
- [x] 6.7 Tests del dialog: validaciones, lookup hit/miss, botones por rol, Guardar disabled, abort de carga

## 7. Frontend — wiring de Agenda, Lista y Día

- [x] 7.1 Estado del dialog en `AgendaContent`: botón "Nuevo Turno" abre alta vacía (tipo Control); invalidar queries de lista y día al guardar
- [x] 7.2 Vista Lista: click en fila (fuera de Acciones) abre el detalle; los botones de Acciones hacen `stopPropagation` y siguen stubs
- [x] 7.3 Vista Día: `slotDuration` 15 min y `slotLabelInterval` 1 h; `dateClick` abre alta precargada (recep/admin); `eventClick` abre detalle (todos los roles); médico no crea desde hueco
- [x] 7.4 Tests: click Nuevo Turno; click en fila de Lista abre detalle; click en Acciones no abre; dateClick precarga 15 min; eventClick abre detalle; médico no abre alta por hueco

## 8. Cierre

- [x] 8.1 Lint y tests de `web` y `api` en verde para los archivos tocados
