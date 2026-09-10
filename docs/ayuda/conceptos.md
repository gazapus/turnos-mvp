# Conceptos y términos de la aplicación

Esta guía explica el vocabulario de la clínica en esta aplicación. No lista turnos ni pacientes reales: solo qué significa cada término.

## Quién usa el sistema

Hay tres roles. Cada persona tiene uno solo:

- **Administrador** — configura consultorios y puede gestionar la agenda como recepción.
- **Recepcionista** — crea, confirma y cancela turnos, y asigna consultorios.
- **Médico** — ve su propia agenda, llama al paciente y finaliza la atención.

El **paciente** no se loguea. Es la persona atendida: se identifica por documento y se carga o busca al crear un turno.

Un **turno** es una cita: tiene paciente, médico, especialidad, horario, tipo y estado.

## Especialidades

Una **especialidad** es el tipo de atención que ofrece un médico (por ejemplo clínica, cardiología). El catálogo lo mantiene el sistema; en esta versión no se dan de alta especialidades desde una pantalla de usuario.

Un médico puede tener **una o varias** especialidades. Un turno siempre queda asociado a **una** especialidad, la que se eligió al crearlo.

En Agenda y en el alta, médico y especialidad van **cruzados**:

- si elegís un médico, solo ves las especialidades que él atiende;
- si elegís una especialidad, solo ves los médicos que la atienden;
- si queda una sola opción, se selecciona sola.

Filtrar la Agenda por especialidad muestra turnos de esa especialidad, no “todos los turnos del médico”.

## Tipos de turno

El tipo describe la naturaleza de la cita. En la Lista se ve como ícono (con tooltip):

| Tipo | Qué significa | Cómo se asigna |
| --- | --- | --- |
| **Primer turno** | El paciente **nunca tuvo un turno con ese médico**. La especialidad no interviene: si ya se atendió con el mismo médico en otra especialidad, no es primer turno. | Automático. También aplica si el documento es nuevo (paciente que aún no está en el padrón). |
| **Control** | El paciente **ya tuvo** al menos un turno con ese médico, o es el valor inicial del formulario antes de que el sistema calcule. | Automático cuando no es primera vez. |
| **Urgente** | Atención marcada a propósito como urgente. | Lo elige Recepcionista o Administrador. **Pisa** primer turno y control. |
| **Sobreturno** | Tipo que puede verse en turnos ya guardados. En esta versión el alta **no crea** sobreturnos: no lo elijas al dar de alta. | Solo se muestra si el turno ya lo tenía. |

En el alta podés elegir **Control** o **Urgente**. Si el par paciente + médico es primera vez y no marcaste Urgente, el campo pasa solo a **Primer turno**.

Si cambiás de médico o de paciente, el tipo se vuelve a calcular (salvo que esté en Urgente). Si pasás de Urgente a Control, también se recalcula.

En la Lista, Urgente y Sobreturno comparten el mismo ícono de aviso (triángulo); Primer turno es el rombo con “1” y Control el círculo con “C”.

## Estados del turno

El **estado** es en qué punto del circuito está la cita. En la Lista se ve como pastilla de color.

| Estado | Qué significa | Cómo se llega |
| --- | --- | --- |
| **Programado** | Cita agendada, el paciente todavía no se dio por presente. | Al crear el turno. |
| **Confirmado** | El paciente está en la clínica (o se lo dio por presente ese día). Queda listo para que el médico lo llame. | Recepcionista o Administrador confirman un Programado **el mismo día** del turno. |
| **Atendido** | La atención de ese turno terminó. | El **Médico** finaliza un Confirmado de **hoy** que ya fue **llamado**. |
| **Ausente** | El paciente no se presentó. Es un estado final. | En esta versión **no hay un botón** para marcarlo; puede verse en turnos ya cargados. |
| **Cancelado** | La cita se anuló. Es un estado final. | Recepcionista o Administrador cancelan un Programado o Confirmado (cualquier fecha). El motivo es opcional. |

Atendido, Ausente y Cancelado **no vuelven atrás**. No se editan ni se confirman de nuevo.

**Solo Pendientes** en la Agenda pide solo Programados y Confirmados (oculta Atendido, Ausente y Cancelado).

## Llamado (concepto)

**Llamar** no cambia el estado: el turno sigue **Confirmado**. Es el aviso del médico para que el paciente pase. Solo el médico dueño del turno, si está Confirmado **hoy**. Puede llamar más de una vez. Hace falta que ese médico tenga **consultorio** asignado.

**Finalizar** sí cambia el estado a **Atendido**, después de al menos un llamado.

## Consultorio (concepto)

Un **consultorio** es el box numerado (1 a 20) donde atiende el médico. Cada médico tiene como máximo uno, y cada número como máximo un médico. El aviso público usa el texto `CONSULTORIO` más el número. Cómo asignarlo está en la guía de Consultorios.

## Otros términos útiles

- **Documento** — identificación del paciente (solo dígitos al buscar). Si existe, se completan sus datos; si no, se carga como alta junto con el turno.
- **Duración por defecto** — 30 minutos entre hora de inicio y fin, editable.
- **Fecha del turno** — día civil de la clínica (Argentina). Confirmar, llamar y finalizar miran **hoy**, no la hora exacta del slot.
- **Notificar al paciente** — recordatorio por mail si hay un mail válido. No envía WhatsApp.
