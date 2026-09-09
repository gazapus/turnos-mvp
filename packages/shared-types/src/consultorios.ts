/**
 * Médico asignado a un consultorio (puede estar inactivo).
 */
export type ConsultorioMedicoDto = {
  id: string;
  nombre: string;
  apellido: string;
};

/**
 * Consultorio del catálogo numerado con médico opcional.
 */
export type ConsultorioDto = {
  id: string;
  numero: number;
  medico: ConsultorioMedicoDto | null;
};

/**
 * Body de PATCH /api/consultorios/:id.
 */
export type AsignarConsultorioRequest = {
  medicoId: string | null;
};
