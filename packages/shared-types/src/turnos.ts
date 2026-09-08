/**
 * Estados de turno (alineados a EstadoTurno de Prisma).
 */
export const ESTADO_TURNO = [
  'PROGRAMADO',
  'CONFIRMADO',
  'ATENDIDO',
  'AUSENTE',
  'CANCELADO',
] as const;

/**
 * Estado de un turno.
 */
export type EstadoTurno = (typeof ESTADO_TURNO)[number];

/**
 * Tipos de turno (alineados a TipoTurno de Prisma).
 */
export const TIPO_TURNO = [
  'PRIMER_TURNO',
  'CONTROL',
  'SOBRETURNO',
  'URGENTE',
] as const;

/**
 * Tipo de un turno.
 */
export type TipoTurno = (typeof TIPO_TURNO)[number];

/**
 * Modos de visualización de la agenda.
 */
export const VISTA_AGENDA = ['lista', 'dia', 'semana', 'mes'] as const;

/**
 * Vista activa de la agenda.
 */
export type VistaAgenda = (typeof VISTA_AGENDA)[number];

/**
 * Dirección de paginación por cursor del listado de turnos.
 */
export const DIRECCION_PAGINACION = ['siguiente', 'anterior'] as const;

/**
 * Dirección de la página solicitada.
 */
export type DireccionPaginacion = (typeof DIRECCION_PAGINACION)[number];

/**
 * Persona mínima para columnas de listado.
 */
export type PersonaNombreDto = {
  nombre: string;
  apellido: string;
};

/**
 * Especialidad mínima para columnas de listado.
 */
export type EspecialidadNombreDto = {
  nombre: string;
};

/**
 * Ítem de turno para la grilla de agenda (modo Lista y Día).
 */
export type TurnoListItemDto = {
  id: string;
  fecha: string;
  hora: string;
  /** Hora local de fin (HH:mm) en zona horaria de clínica. */
  horaFin: string;
  paciente: PersonaNombreDto;
  medico: PersonaNombreDto;
  especialidad: EspecialidadNombreDto;
  estado: EstadoTurno;
  tipo: TipoTurno;
};

/**
 * Opción de médico para combos de filtro y del formulario de turno.
 */
export type MedicoOption = {
  id: string;
  nombre: string;
  apellido: string;
  especialidadIds: string[];
};

/**
 * Opción de especialidad para combos de filtro y del formulario de turno.
 */
export type EspecialidadOption = {
  id: string;
  nombre: string;
  medicoIds: string[];
};

/**
 * Opción de paciente para combos de filtro.
 */
export type PacienteOption = {
  id: string;
  nombre: string;
  apellido: string;
};

/**
 * Paciente con documento y contacto para el popup de turno.
 */
export type PacienteDetalleDto = {
  id: string;
  documento: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  mail: string | null;
};

/**
 * Datos de paciente nuevo enviados junto al alta o edición de turno.
 */
export type PacienteAltaDto = {
  documento: string;
  nombre: string;
  apellido: string;
  telefono?: string | null;
  mail?: string | null;
};

/**
 * Detalle de turno para hidratar el popup.
 */
export type TurnoDetalleDto = {
  id: string;
  paciente: PacienteDetalleDto;
  medicoId: string;
  medico: PersonaNombreDto;
  especialidadId: string;
  especialidad: EspecialidadNombreDto;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipo: TipoTurno;
  estado: EstadoTurno;
  notificarMail: boolean;
};

/**
 * Body de POST /api/turnos y PATCH /api/turnos/:id.
 * Debe incluir `pacienteId` o `paciente` (datos de alta).
 */
export type UpsertTurnoRequest = {
  pacienteId?: string;
  paciente?: PacienteAltaDto;
  medicoId: string;
  especialidadId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipo: TipoTurno;
  notificarMail: boolean;
};

/**
 * Query de primera vez paciente+médico.
 */
export type PrimeraVezQuery = {
  pacienteId: string;
  medicoId: string;
  excluirTurnoId?: string;
};

/**
 * Respuesta de GET /api/turnos/primera-vez.
 */
export type PrimeraVezResponse = {
  primeraVez: boolean;
};

/**
 * Query params de filtros para GET /api/turnos.
 */
export type TurnosListQuery = {
  medicoId?: string;
  especialidadId?: string;
  pacienteId?: string;
  soloPendientes?: boolean;
  cursor?: string;
  direccion?: DireccionPaginacion;
  fecha?: string;
};

/**
 * Respuesta paginada de GET /api/turnos.
 */
export type TurnosListResponse = {
  items: TurnoListItemDto[];
  cursorSiguiente: string | null;
  cursorAnterior: string | null;
};

/**
 * Query params de la URL de la agenda en el frontend.
 */
export type AgendaUrlParams = {
  vista: VistaAgenda;
  medicoId?: string;
  especialidadId?: string;
  pacienteId?: string;
  soloPendientes: boolean;
  fecha?: string;
};
