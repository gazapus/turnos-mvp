# Confirmar un turno

Confirmar marca que el paciente está en la clínica y deja el turno listo para ser atendido. Pasa de **Programado** a **Confirmado**.

## Quién puede

Solo Recepcionista y Administrador. El médico no confirma turnos.

## Cuándo aparece

El control se muestra únicamente si:

- el turno está **Programado**, y
- la fecha del turno es **hoy** (día civil de la clínica, Argentina).

No hace falta que coincida la hora exacta del turno: se puede confirmar antes o después, el mismo día.

No se puede confirmar un turno de ayer, de mañana, ni uno que ya no está programado.

## Dónde

- En la **Lista**: icono Confirmar (tooltip “Confirmar paciente”).
- En el **detalle** del turno: botón “Confirmar turno”.
- En la vista **Día**: no hay icono sobre la tarjeta; abrí el detalle.

Un solo click. No pide otra confirmación. Si sale bien, el estado pasa a Confirmado y el botón desaparece. Si algo falla, verás un mensaje de error.
