# Documentación Funcional

## Sistema de Gestión de Turnos Clínicos

**Fuente:** consolidado de `docs/requisitos-funcionales-sistema-turnos.md` y `docs/Propuesta_MVP.md`  
**Fecha de consolidación:** Agosto 2026  
**Estado:** Relevamiento cerrado — base para modelado, historias de usuario e implementación  
**Alcance:** Single-tenant (una sola clínica/sede)

---

## 1. Visión del producto

Sistema web interno de gestión de turnos médicos, genérico y aplicable a clínicas, sanatorios u hospitales de sede única. Coordina el flujo operativo de agendamiento y atención entre tres roles mutuamente excluyentes (Administrador, Recepcionista y Médico) y una interfaz pública de aviso sonoro y visual para la sala de espera.

### Principios de alcance

- Los **pacientes no son usuarios** del sistema: no acceden a login ni a ningún módulo.
- El sistema es **single-tenant**: una clínica, una ubicación física. Multi-sede queda fuera de alcance.
- El sistema debe ser **responsive**.
- Existe **una única pantalla de sala de espera** por clínica (sin múltiples pantallas por sector/piso).
- El MVP prioriza la lógica transaccional del circuito reserva → confirmación → llamado → aviso público.

---

## 2. Roles de usuario

Tres roles **mutuamente excluyentes** (un usuario tiene un solo rol):

| Rol           | Descripción                                                                 |
| ------------- | --------------------------------------------------------------------------- |
| Administrador | Gestiona usuarios y accede al módulo de administración                      |
| Recepcionista | Gestiona turnos (lectura/escritura), pantalla de aviso y bloqueo de agendas |
| Médico        | Consulta su propia agenda (solo lectura) y llama turnos por pantalla        |

---

## 3. Autenticación

- Login exclusivamente por **mail y contraseña**.
- Máximo **3 intentos fallidos**.
- Al superarlos, se bloquea el login para esa combinación **mail + IP** durante **10 minutos**.
- **No existe** recuperación autogestionada de contraseña ni cambio de contraseña por el propio usuario.
- El reseteo lo realiza solo el administrador (generación + envío por mail).
- Contraseñas generadas de forma criptográficamente segura (lineamientos NIST SP 800-63B; formato sugerido: 12 caracteres con mayúsculas, minúsculas, números y símbolos).
- Almacenamiento con hash **Argon2** (o bcrypt como alternativa). El administrador **nunca visualiza** la contraseña en texto plano.

---

## 4. Gestión de usuarios (Administración)

Acceso exclusivo del rol **Administrador**. El administrador inicial se da de alta directamente en base de datos (no vía UI).

### 4.1 Datos del usuario

| Campo                    | Detalle                                                           |
| ------------------------ | ----------------------------------------------------------------- |
| Nombre                   | Obligatorio                                                       |
| Apellido                 | Obligatorio                                                       |
| Código de identificación | Documento tipo DNI, **único**, identificación pública del usuario |
| Mail                     | Obligatorio, único                                                |
| Rol                      | Único (administrador, recepcionista o médico)                     |
| Especialidades           | Solo aplica a rol médico (listado; al menos una al dar de alta)   |

### 4.2 Operaciones

| Operación             | Comportamiento                                                                         |
| --------------------- | -------------------------------------------------------------------------------------- |
| Alta                  | Genera contraseña automática, la hashea, crea el usuario y envía credenciales por mail |
| Modificación          | Sin notificación al usuario                                                            |
| Baja                  | Sin notificación al usuario                                                            |
| Visualización         | Listado de usuarios existentes                                                         |
| Reseteo de contraseña | Genera nueva contraseña, la hashea y la envía por mail                                 |

---

## 5. Perfil de usuario

Disponible para todos los usuarios autenticados. Muestra:

- Nombre, apellido, mail, rol.
- Especialidades (si es médico).
- Opción de **cerrar sesión**.

---

## 6. Módulo de turnos — Vista Médico

- Acceso de **solo lectura** sobre turnos, con la excepción del llamado (sección 6.1).
- Vistas: mensual, semanal, diario, listado — estilo Google Calendar.
- Por cada turno visualiza: paciente (documento, nombre, apellido), especialidad requerida y estado (programado, confirmado, cancelado, vencido).
- Filtros: por paciente, por especialidad.
- **No puede bloquear** su propia agenda (función exclusiva del recepcionista).

### 6.1 Llamado de turno

- El médico selecciona un turno en estado **Confirmado** y confirma el llamado.
- Dispara en la pantalla de sala de espera: nombre y apellido del paciente + consultorio asignado al médico, junto con sonido de aviso.
- El consultorio es el que el recepcionista asignó de forma fija a ese médico (sección 9).

---

## 7. Módulo de turnos — Vista Recepcionista

- Acceso de **lectura y escritura** sobre la agenda de todos los médicos.
- Vistas: mensual, semanal, diario, listado — estilo Google Calendar.
- Por defecto, la agenda se muestra desde el día/semana/mes actual en adelante.
- Filtros: por médico, por especialidad, por paciente.

### 7.1 Creación de turno

- Click sobre franja horaria o día → popup con formulario.
- Campos:
  - Hora de inicio y fin (duración default: **30 minutos**, editable).
  - Paciente (documento, nombre, apellido; teléfono y mail opcionales).
  - Médico y especialidad.
  - Checkbox de notificación por **mail** (funcional) y **WhatsApp** (visible, sin funcionalidad real en esta versión).

**Autocompletado cruzado médico ↔ especialidad**

- Si se elige primero el médico → se precargan sus especialidades; si tiene una sola, se selecciona por default.
- Si se elige primero la especialidad → se precargan los médicos de esa especialidad; si hay uno solo, se selecciona por default.

**Búsqueda de paciente por documento**

- Si el documento existe → se precargan sus datos.
- Si no existe → se carga como paciente nuevo.
- Si se modifican datos de un paciente existente (excepto el documento) → se actualiza el registro.
- Si se modifica el **documento** → se interpreta como **paciente nuevo**.

### 7.2 Tipos de turno

| Tipo         | Asignación                                                                               |
| ------------ | ---------------------------------------------------------------------------------------- |
| Primer turno | Automático — primera vez del paciente con **ese médico** (la especialidad no interviene) |
| Control      | Automático — el paciente ya tuvo turnos previos con ese médico                           |
| Sobreturno   | Automático — se agenda superpuesto a otro existente; se visualiza superpuesto            |
| Urgente      | Manual — marcado explícitamente por el recepcionista                                     |

### 7.3 Estados de turno

| Estado     | Transiciones posibles             |
| ---------- | --------------------------------- |
| Programado | → Confirmado, Ausente o Cancelado |
| Confirmado | → Atendido, Ausente o Cancelado   |
| Atendido   | Terminal — no cambia              |
| Ausente    | Terminal — no cambia              |
| Cancelado  | Terminal — no cambia              |

- Al crearse inicia en **Programado**.
- Pasa a **Confirmado** cuando el recepcionista lo marca al llegar el paciente.
- Pasa a **Atendido** cuando el médico finaliza la atención (acción futura).
- Pasa a **Ausente** cuando el paciente no se presenta (disparador pendiente de definición).
- Pasa a **Cancelado** por decisión del paciente o del recepcionista (antes de estados terminales).
- **Motivo de cancelación:** texto libre, opcional.
- Cada estado tiene un **color distinto** en la agenda.

### 7.4 Notificaciones

- **Mail:** recordatorio **1 día antes** del turno. Funcional en esta versión.
- **WhatsApp:** checkbox visible, sin envío real (pendiente definición de proveedor).

### 7.5 Job diario de ausentes (pendiente)

> **Nota:** El enum vigente reemplazó `VENCIDO` por `ATENDIDO` y `AUSENTE`. La semántica exacta del job nocturno que antes pasaba turnos no confirmados a **Vencido** queda **pendiente de definición** en una futura iteración (¿reemplaza a `AUSENTE`, se elimina o convive con acciones manuales?). No está implementado en esta versión.

- ~~Corre a **medianoche**.~~
- ~~Los turnos del día no confirmados pasan a **Vencido**.~~
- Opera bajo una **única zona horaria** (single-tenant) cuando se implemente.

### 7.6 Concurrencia

- Creación simultánea para el mismo médico/horario se resuelve con validación/constraint a nivel de base de datos (índice único o control transaccional).

### 7.7 Bloqueo de agenda

- Exclusivo del **recepcionista**.
- Se define con fecha/hora de inicio y fin.
- Si hay turnos en el rango, el sistema muestra **advertencia**; la resolución (cancelar/reprogramar) es **manual**.

---

## 8. Pantalla de sala de espera / aviso de turnos

- Controlada por el **recepcionista** (estado actual y transmisión en pantalla completa).
- Muestra los **últimos 5 turnos anunciados**: nombre, apellido del paciente y consultorio.
- Relación **médico ↔ consultorio**: fija, un consultorio por médico, texto libre en **MAYÚSCULAS** (ej. `CONSULTORIO 7`).
- Al anunciarse un turno (llamado del médico):
  - Se reproduce un **sonido**.
  - Se muestra en formato grande ~**10 segundos**.
- Una sola pantalla por clínica.
- Los pacientes solo **visualizan**; no interactúan.

---

## 9. Chatbot de ayuda y consulta de datos

Disponible para todos los usuarios autenticados. Cumple dos funciones:

### 9.1 Asistente de documentación

- Responde consultas sobre el uso del sistema (ej. “cómo bloqueo la agenda”, “cómo creo un sobreturno”).
- Basado en IA con base de conocimiento de la documentación de la aplicación.

### 9.2 Consultas a datos en lenguaje natural

- Ejemplos: “¿qué turnos tengo hoy?”, “¿cuántos pacientes atendió el Dr. Pérez esta semana?”.
- Se resuelve vía **servidor MCP de PostgreSQL** conectado a la base del sistema.
- **Solo lectura:** no puede crear, modificar ni eliminar datos.

### 9.3 Alcance de datos por rol

Todo prompt de consulta de datos debe incluir el **rol autenticado** y las reglas de límite correspondientes:

| Rol           | Alcance permitido                                       |
| ------------- | ------------------------------------------------------- |
| Médico        | Solo sus turnos y los pacientes asociados a esos turnos |
| Recepcionista | Cualquier paciente, médico y turno del sistema          |
| Administrador | Todos los datos, sin restricción                        |

La restricción se aplica en el prompt de sistema (no solo por voluntad del usuario ni por filtro posterior).

### 9.4 Restricción de dominio

El chatbot **no responde** consultas ajenas a la aplicación (ni documentación de uso ni datos del sistema).

---

## 10. Casos de uso del MVP

Diez casos de uso críticos que validan el circuito operativo de extremo a extremo:

|  #  | Caso de uso                      | Actor principal           |
| :-: | -------------------------------- | ------------------------- |
|  1  | Iniciar sesión                   | Usuario (todos los roles) |
|  2  | Dar de alta usuario              | Administrador             |
|  3  | Crear turno                      | Recepcionista             |
|  4  | Confirmar turno                  | Recepcionista             |
|  5  | Cancelar turno                   | Recepcionista             |
|  6  | Bloquear agenda de médico        | Recepcionista             |
|  7  | Configurar consultorio de médico | Recepcionista             |
|  8  | Consultar agenda propia          | Médico                    |
|  9  | Llamar turno para sala de espera | Médico                    |
| 10  | Transmitir pantalla de aviso     | Recepcionista             |

### CU 1 — Iniciar sesión

- **Precondiciones:** cuenta activa; sin sesión activa.
- **Éxito:** el usuario ingresa mail y contraseña → validación (Argon2) → sesión JWT → redirección al panel de su rol.
- **Errores:** intentos 1–2 fallidos incrementan contador y muestran error genérico; al 3.er fallo se bloquea mail+IP por 10 minutos.

### CU 2 — Dar de alta usuario

- **Precondiciones:** administrador autenticado en gestión de usuarios.
- **Éxito:** completa formulario → validación de unicidad de mail y documento → generación de contraseña segura → hash Argon2 → mail con credenciales.
- **Extensiones:** colisión de mail/DNI; médico sin especialidad (se exige al menos una).

### CU 3 — Crear turno

- **Precondiciones:** recepcionista autenticado en la agenda.
- **Éxito:** click en franja → formulario (30 min default) → búsqueda/carga de paciente → médico/especialidad con autocompletado → opcional recordatorio mail → validación de colisiones → tipificación automática → estado Programado → job de mail 1 día antes.
- **Variantes:** paciente existente (autocompleta/actualiza); sobreturno por superposición deliberada.

### CU 4 — Confirmar turno

- **Precondiciones:** turno en Programado; paciente en la clínica.
- **Éxito:** recepcionista confirma → estado Confirmado → color distintivo en agenda → disponible para llamado del médico.

### CU 5 — Cancelar turno

- **Precondiciones:** turno Programado o Confirmado.
- **Éxito:** cancelación con motivo opcional → estado Cancelado (terminal) → actualización visual.

### CU 6 — Bloquear agenda de médico

- **Precondiciones:** recepcionista autenticado.
- **Éxito:** define rango inicio/fin → si no hay conflictos, registra bloqueo como zona inhabilitada.
- **Extensiones:** con turnos en el rango, advertencia; si procede igual, la reprogramación/cancelación queda a cargo manual del recepcionista.

### CU 7 — Configurar consultorio de médico

- **Precondiciones:** recepcionista en configuración de sala de espera.
- **Éxito:** selecciona médico → ingresa consultorio (texto libre) → se guarda en mayúsculas como relación fija.

### CU 8 — Consultar agenda propia

- **Precondiciones:** médico autenticado.
- **Éxito:** agenda propia en vistas tipo calendario → detalle de paciente, especialidad y estado → filtros por paciente o especialidad.

### CU 9 — Llamar turno para sala de espera

- **Precondiciones:** turno Confirmado; médico con consultorio asignado.
- **Éxito:** médico llama turno → evento en tiempo real a sala de espera → sonido + display ~10 s + inclusión en últimos 5 anuncios.

### CU 10 — Transmitir pantalla de aviso

- **Precondiciones:** recepcionista autenticado.
- **Éxito:** carga últimos 5 anuncios → “Transmitir” en pantalla completa → escucha activa de llamados en tiempo real (CU 9).

---

## 11. Entidades de dominio (referencia funcional)

Modelo conceptual alineado al schema del sistema:

| Entidad            | Rol funcional                                                    |
| ------------------ | ---------------------------------------------------------------- |
| Usuario            | Personal del sistema (admin / recepcionista / médico)            |
| Especialidad       | Catálogo; asociada N:M a médicos                                 |
| Médico–Consultorio | Asignación fija 1:1 para la pantalla de aviso                    |
| Paciente           | Persona atendida; no es usuario del sistema                      |
| Turno              | Cita con tipo, estado, médico, paciente, especialidad y horarios |
| Bloqueo de agenda  | Rango de indisponibilidad de un médico                           |

Estados de turno: `PROGRAMADO`, `CONFIRMADO`, `ATENDIDO`, `AUSENTE`, `CANCELADO`.  
Tipos de turno: `PRIMER_TURNO`, `CONTROL`, `SOBRETURNO`, `URGENTE`.

---

## 12. Fuera de alcance en esta versión

- Recuperación autogestionada de contraseña.
- Cambio de contraseña por el propio usuario.
- Multi-rol por usuario.
- Integración funcional de WhatsApp (checkbox en UI sin lógica de envío).
- Multi-sede / múltiples sucursales.
- Múltiples pantallas de sala de espera simultáneas.
- Reprogramación automática de turnos afectados por bloqueo de agenda.
- Rotación de un médico entre múltiples consultorios.

---

## 13. Pendientes que no bloquean el modelado

- Proveedor de integración de WhatsApp y su modelo de costos.
- Detalle de implementación del chatbot (inyección de documentación en contexto vs. indexador ligero) y políticas MCP de alcance por rol.

---

## Referencias

- `docs/requisitos-funcionales-sistema-turnos.md` — requisitos funcionales completos
- `docs/Propuesta_MVP.md` — propuesta académica, 10 CU del MVP y anexo Cockburn
- `docs/schema.sql` — modelo de datos de referencia
- `docs/adr/` — decisiones de arquitectura y proceso (fuera del alcance de este documento funcional)
