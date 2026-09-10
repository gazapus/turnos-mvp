# Agenda de turnos

La Agenda es la pantalla principal de turnos. Todos los roles autenticados pueden abrirla. Arriba ves el título, filtros, pestañas de vista y la casilla **Solo Pendientes**.

## Filtros

Podés filtrar por médico, especialidad y paciente (listas con búsqueda). Los filtros se combinan. La especialidad y el médico se cruzan: si elegís una especialidad, el listado de médicos se achica, y al revés.

**Solo Pendientes** pide al servidor los turnos que todavía hay que gestionar (programados y confirmados), no un filtro solo en pantalla.

Los filtros y la vista quedan en la dirección de la página: si recargás, se mantienen.

## Vistas

Hay pestañas Lista, Día, Semana y Mes. En esta versión **funcionan Lista y Día**. Semana y Mes todavía no están disponibles.

### Lista

Tabla de turnos con fecha, hora, paciente, doctor, especialidad, estado, tipo y acciones. Los estados se ven como pastillas de color: Programado, Confirmado, Atendido, Ausente y Cancelado.

La lista pagina hacia adelante (cargar más). No hay página anterior.

Acciones según rol y estado:

- Recepcionista y Administrador: Confirmar (si aplica), Cancelar (si aplica)
- Médico: Llamar (turno Confirmado de hoy) y Finalizar (después de haber llamado). Qué significan está en la guía de conceptos.

Un click en la fila (fuera de los iconos de acción) abre el detalle del turno.

### Día

Grilla de las 24 horas del día elegido. Cada turno aparece como tarjeta según su hora de inicio y duración. Cambiá el día con las flechas o el selector de fecha. Los mismos filtros y **Solo Pendientes** aplican.

En Día no hay botones de confirmar o cancelar sobre la tarjeta: abrí el detalle del turno para esas acciones.

## Nuevo turno y detalle

El botón **Nuevo Turno** lo ven Recepcionista y Administrador. El médico no lo ve.

Se abre un popup sobre la Agenda (no cambia de página) con dos bloques: información del turno y datos del paciente.

- Buscá el paciente por documento. Si existe, se completan los datos; si no, cargalos para el alta.
- Médico y especialidad son listas cruzadas.
- Duración por defecto: 30 minutos.
- Cerrar con X o Salir descarta lo no guardado, sin preguntar.

El detalle de un turno existente usa el mismo popup. Desde ahí también se confirma o cancela, según las reglas de esas acciones.
