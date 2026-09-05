/**
 * Seed de desarrollo: usuarios, especialidades, pacientes y turnos de prueba.
 *
 * Uso: pnpm --filter @turnos/database db:seed
 *
 * Credenciales (solo desarrollo) — misma contraseña para todos:
 *   password: Admin123!@#$
 *   admin@clinica.local       → ADMIN
 *   recepcion@clinica.local   → RECEPCIONISTA
 *   medico@clinica.local      → MEDICO (Carlos Médico)
 *   medico2@clinica.local … medico5@clinica.local → MEDICO
 *   juan.prueba@clinica.local → MEDICO
 */
import {
  EstadoTurno,
  PrismaClient,
  RolUsuario,
  TipoTurno,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const DEV_PASSWORD = 'Admin123!@#$';

const DEV_USERS = [
  {
    documentoIdentidad: '00000000',
    nombre: 'Admin',
    apellido: 'Sistema',
    mail: 'admin@clinica.local',
    rol: RolUsuario.ADMIN,
  },
  {
    documentoIdentidad: '10000001',
    nombre: 'Ana',
    apellido: 'Recepción',
    mail: 'recepcion@clinica.local',
    rol: RolUsuario.RECEPCIONISTA,
  },
  {
    documentoIdentidad: '10000002',
    nombre: 'Carlos',
    apellido: 'Médico',
    mail: 'medico@clinica.local',
    rol: RolUsuario.MEDICO,
  },
  {
    documentoIdentidad: '10000003',
    nombre: 'Laura',
    apellido: 'Gómez',
    mail: 'medico2@clinica.local',
    rol: RolUsuario.MEDICO,
  },
  {
    documentoIdentidad: '10000004',
    nombre: 'Juan',
    apellido: 'Pérez',
    mail: 'medico3@clinica.local',
    rol: RolUsuario.MEDICO,
  },
  {
    documentoIdentidad: '10000005',
    nombre: 'María',
    apellido: 'Fernández',
    mail: 'medico4@clinica.local',
    rol: RolUsuario.MEDICO,
  },
  {
    documentoIdentidad: '10000006',
    nombre: 'Diego',
    apellido: 'Ruiz',
    mail: 'medico5@clinica.local',
    rol: RolUsuario.MEDICO,
  },
  {
    documentoIdentidad: '10000007',
    nombre: 'Juan',
    apellido: 'Prueba',
    mail: 'juan.prueba@clinica.local',
    rol: RolUsuario.MEDICO,
  },
] as const;

const ESPECIALIDADES = [
  { nombre: 'Cardiología' },
  { nombre: 'Clínica Médica' },
  { nombre: 'Traumatología' },
] as const;

const PACIENTES = [
  {
    documento: '20000001',
    nombre: 'María',
    apellido: 'González',
    telefono: '011-4000-0001',
    mail: 'maria.gonzalez@example.com',
  },
  {
    documento: '20000002',
    nombre: 'Carlos',
    apellido: 'Ramírez',
    telefono: '011-4000-0002',
  },
  {
    documento: '20000003',
    nombre: 'Lucía',
    apellido: 'Martínez',
    mail: 'lucia.martinez@example.com',
  },
  {
    documento: '20000004',
    nombre: 'Pedro',
    apellido: 'Sánchez',
    telefono: '011-4000-0004',
  },
  {
    documento: '20000005',
    nombre: 'Sofía',
    apellido: 'López',
  },
  {
    documento: '20000006',
    nombre: 'Martín',
    apellido: 'Torres',
    telefono: '011-4000-0006',
    mail: 'martin.torres@example.com',
  },
  {
    documento: '20000007',
    nombre: 'Valentina',
    apellido: 'Díaz',
  },
  {
    documento: '20000008',
    nombre: 'Facundo',
    apellido: 'Acosta',
    telefono: '011-4000-0008',
  },
  {
    documento: '20000009',
    nombre: 'Camila',
    apellido: 'Herrera',
    mail: 'camila.herrera@example.com',
  },
  {
    documento: '20000010',
    nombre: 'Jorge',
    apellido: 'Molina',
  },
] as const;

const DURATIONS_MIN = [15, 30, 45, 60] as const;
const GAP_MINUTES = [0, 15, 30, 45] as const;
const MINUTES_QUARTER = [0, 15, 30, 45] as const;
const REGULAR_TIPOS = [
  TipoTurno.PRIMER_TURNO,
  TipoTurno.CONTROL,
  TipoTurno.URGENTE,
] as const;
const ESTADOS_PASADOS = [
  EstadoTurno.ATENDIDO,
  EstadoTurno.AUSENTE,
  EstadoTurno.CANCELADO,
] as const;
const ESTADOS_FUTUROS = [
  EstadoTurno.PROGRAMADO,
  EstadoTurno.CONFIRMADO,
  EstadoTurno.CANCELADO,
] as const;

type TurnoSeedRow = {
  pacienteId: string;
  medicoId: string;
  especialidadId: string;
  creadoPorId: string;
  fechaInicio: Date;
  fechaFin: Date;
  tipo: TipoTurno;
  estado: EstadoTurno;
  motivoCancelacion?: string;
};

type Intervalo = { inicio: Date; fin: Date };

type DayState = {
  patientCount: Map<string, number>;
  patientIntervals: Map<string, Intervalo[]>;
  patientMedicoEsp: Map<string, Set<string>>;
};

/**
 * Inicio del día local para una fecha dada.
 *
 * @param date - Fecha base.
 * @returns Date a las 00:00:00 local.
 */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Suma días a una fecha.
 *
 * @param date - Fecha base.
 * @param days - Cantidad de días (puede ser negativa).
 * @returns Nueva fecha.
 */
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Suma minutos a una fecha.
 *
 * @param date - Fecha base.
 * @param minutes - Minutos a sumar.
 * @returns Nueva fecha.
 */
function addMinutes(date: Date, minutes: number): Date {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

/**
 * Crea una fecha con hora y minuto en el mismo día local.
 *
 * @param day - Día base (00:00).
 * @param hour - Hora (0–23).
 * @param minute - Minuto (0–59).
 * @returns Fecha resultante.
 */
function atTime(day: Date, hour: number, minute: number): Date {
  const d = new Date(day);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/**
 * Último día de noviembre del mismo año que la fecha de referencia (00:00 local).
 *
 * @param reference - Fecha de referencia.
 * @returns 30 de noviembre a las 00:00.
 */
function endOfNovember(reference: Date): Date {
  return startOfDay(new Date(reference.getFullYear(), 10, 30));
}

/**
 * Indica si la fecha cae en lunes a viernes.
 *
 * @param date - Fecha a evaluar.
 * @returns `true` si es día hábil.
 */
function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

/**
 * Lista de días hábiles entre dos fechas inclusive (00:00 local).
 *
 * @param from - Primer día del rango.
 * @param to - Último día del rango.
 * @returns Array de fechas lun–vie.
 */
function eachWeekdayInclusive(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  let current = startOfDay(from);
  const end = startOfDay(to);

  while (current.getTime() <= end.getTime()) {
    if (isWeekday(current)) {
      days.push(new Date(current));
    }
    current = addDays(current, 1);
  }

  return days;
}

/**
 * Generador pseudoaleatorio determinista (mulberry32).
 *
 * @param seed - Semilla numérica.
 * @returns Función que devuelve números en [0, 1).
 */
function mulberry32(seed: number): () => number {
  let state = seed;

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Elige un elemento de un array usando el RNG.
 *
 * @param rng - Generador [0, 1).
 * @param items - Opciones.
 * @returns Elemento elegido.
 */
function pickFrom<T>(rng: () => number, items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) {
    throw new Error('pickFrom: array vacío');
  }
  return item;
}

/**
 * Detecta solapamiento entre dos intervalos [inicio, fin).
 *
 * @param a - Primer intervalo.
 * @param b - Segundo intervalo.
 * @returns `true` si se solapan.
 */
function intervalsOverlap(a: Intervalo, b: Intervalo): boolean {
  return a.inicio < b.fin && b.inicio < a.fin;
}

/**
 * Estado inicial de restricciones por día de agenda.
 *
 * @returns Mapas vacíos para contadores e intervalos.
 */
function createDayState(): DayState {
  return {
    patientCount: new Map(),
    patientIntervals: new Map(),
    patientMedicoEsp: new Map(),
  };
}

/**
 * Clave compuesta médico + especialidad para restricciones de paciente.
 *
 * @param medicoId - ID del médico.
 * @param especialidadId - ID de la especialidad.
 * @returns Clave única.
 */
function medicoEspKey(medicoId: string, especialidadId: string): string {
  return `${medicoId}:${especialidadId}`;
}

/**
 * Evalúa si un paciente puede recibir un turno en el día.
 *
 * @param dayState - Estado acumulado del día.
 * @param pacienteId - Paciente candidato.
 * @param medicoId - Médico del turno.
 * @param especialidadId - Especialidad del turno.
 * @param intervalo - Horario propuesto.
 * @returns `true` si cumple todas las reglas de paciente.
 */
function canAssignPatient(
  dayState: DayState,
  pacienteId: string,
  medicoId: string,
  especialidadId: string,
  intervalo: Intervalo,
): boolean {
  const count = dayState.patientCount.get(pacienteId) ?? 0;
  if (count >= 2) {
    return false;
  }

  const intervals = dayState.patientIntervals.get(pacienteId) ?? [];
  if (intervals.some((existing) => intervalsOverlap(existing, intervalo))) {
    return false;
  }

  const key = medicoEspKey(medicoId, especialidadId);
  const usedPairs = dayState.patientMedicoEsp.get(pacienteId) ?? new Set();
  if (usedPairs.has(key)) {
    return false;
  }

  return true;
}

/**
 * Registra un turno asignado en el estado del día.
 *
 * @param dayState - Estado del día (mutado).
 * @param pacienteId - Paciente asignado.
 * @param medicoId - Médico del turno.
 * @param especialidadId - Especialidad del turno.
 * @param intervalo - Horario del turno.
 */
function registerPatientAssignment(
  dayState: DayState,
  pacienteId: string,
  medicoId: string,
  especialidadId: string,
  intervalo: Intervalo,
): void {
  dayState.patientCount.set(
    pacienteId,
    (dayState.patientCount.get(pacienteId) ?? 0) + 1,
  );

  const intervals = dayState.patientIntervals.get(pacienteId) ?? [];
  intervals.push(intervalo);
  dayState.patientIntervals.set(pacienteId, intervals);

  const key = medicoEspKey(medicoId, especialidadId);
  const usedPairs = dayState.patientMedicoEsp.get(pacienteId) ?? new Set();
  usedPairs.add(key);
  dayState.patientMedicoEsp.set(pacienteId, usedPairs);
}

/**
 * Asigna el primer paciente elegible rotando desde un índice base.
 *
 * @param dayState - Estado del día.
 * @param pacientes - Catálogo de pacientes.
 * @param medicoId - Médico del turno.
 * @param especialidadId - Especialidad del turno.
 * @param intervalo - Horario propuesto.
 * @param startIdx - Índice inicial de rotación.
 * @returns ID del paciente o `null` si ninguno califica.
 */
function assignPatient(
  dayState: DayState,
  pacientes: Array<{ id: string }>,
  medicoId: string,
  especialidadId: string,
  intervalo: Intervalo,
  startIdx: number,
): string | null {
  for (let offset = 0; offset < pacientes.length; offset += 1) {
    const paciente = pacientes[(startIdx + offset) % pacientes.length];
    if (
      canAssignPatient(
        dayState,
        paciente.id,
        medicoId,
        especialidadId,
        intervalo,
      )
    ) {
      registerPatientAssignment(
        dayState,
        paciente.id,
        medicoId,
        especialidadId,
        intervalo,
      );
      return paciente.id;
    }
  }

  return null;
}

/**
 * Resuelve estado y motivo de cancelación según la fecha del turno.
 *
 * @param day - Día del turno (00:00).
 * @param rng - Generador determinista.
 * @returns Estado y motivo opcional.
 */
function resolveEstado(
  day: Date,
  rng: () => number,
): { estado: EstadoTurno; motivoCancelacion?: string } {
  const today = startOfDay(new Date());
  const pool =
    day.getTime() < today.getTime() ? ESTADOS_PASADOS : ESTADOS_FUTUROS;
  const estado = pickFrom(rng, pool);

  if (estado === EstadoTurno.CANCELADO) {
    return { estado, motivoCancelacion: 'Paciente reprogramó' };
  }

  return { estado };
}

/**
 * Arma dos bloques regulares para un médico en un día, respetando 8:00–20:00.
 *
 * @param day - Día hábil.
 * @param medicoIdx - Índice del médico en la rotación.
 * @param rng - Generador determinista del día.
 * @returns Par de intervalos regulares (sin solaparse).
 */
function buildRegularSlots(
  day: Date,
  medicoIdx: number,
  rng: () => number,
): [Intervalo, Intervalo] {
  const closing = atTime(day, 20, 0);
  const earliest = atTime(day, 8, 0);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const duration1 = pickFrom(rng, DURATIONS_MIN);
    const duration2 = pickFrom(
      rng,
      DURATIONS_MIN.filter((d) => d !== duration1),
    );
    const gap = pickFrom(rng, GAP_MINUTES);

    const baseHour = 8 + ((medicoIdx * 2 + attempt) % 9);
    const baseMinute = pickFrom(rng, MINUTES_QUARTER);
    const start1 = atTime(day, baseHour, baseMinute);

    if (start1 < earliest) {
      continue;
    }

    const end1 = addMinutes(start1, duration1);
    const start2 = addMinutes(end1, gap);
    const end2 = addMinutes(start2, duration2);

    if (end2 <= closing && start1 >= earliest) {
      return [
        { inicio: start1, fin: end1 },
        { inicio: start2, fin: end2 },
      ];
    }
  }

  const fallbackStart1 = atTime(day, 8 + medicoIdx, 0);
  const fallbackEnd1 = addMinutes(fallbackStart1, 30);
  const fallbackStart2 = addMinutes(fallbackEnd1, 15);
  const fallbackEnd2 = addMinutes(fallbackStart2, 45);

  return [
    { inicio: fallbackStart1, fin: fallbackEnd1 },
    { inicio: fallbackStart2, fin: fallbackEnd2 },
  ];
}

/**
 * Genera turnos de desarrollo desde ayer hasta el 30 de noviembre (solo hábiles).
 * Por médico y día: 2 regulares + 1 sobreturno superpuesto.
 *
 * @param params - Médicos, pacientes, especialidades por médico y creador.
 * @returns Filas listas para `createMany`.
 */
function buildTurnosAgenda(params: {
  medicos: Array<{ id: string }>;
  pacientes: Array<{ id: string }>;
  medicoEspecialidades: Map<string, string[]>;
  creadoPorId: string;
}): TurnoSeedRow[] {
  const { medicos, pacientes, medicoEspecialidades, creadoPorId } = params;
  const today = startOfDay(new Date());
  const rangeStart = addDays(today, -1);
  const rangeEnd = endOfNovember(today);
  const dias = eachWeekdayInclusive(rangeStart, rangeEnd);
  const turnos: TurnoSeedRow[] = [];

  for (let dayIdx = 0; dayIdx < dias.length; dayIdx += 1) {
    const day = dias[dayIdx];
    const daySeed = day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate();
    const rng = mulberry32(daySeed);
    const dayState = createDayState();

    const medicosRotados = [...medicos];
    const rotation = dayIdx % medicosRotados.length;
    medicosRotados.push(...medicosRotados.splice(0, rotation));

    for (let medicoIdx = 0; medicoIdx < medicosRotados.length; medicoIdx += 1) {
      const medico = medicosRotados[medicoIdx];
      const especialidadesMedico = medicoEspecialidades.get(medico.id);

      if (!especialidadesMedico || especialidadesMedico.length === 0) {
        throw new Error(`Médico ${medico.id} sin especialidades asignadas`);
      }

      const [regular1, regular2] = buildRegularSlots(day, medicoIdx, rng);
      const espRegular1 = especialidadesMedico[medicoIdx % especialidadesMedico.length];
      const espRegular2 =
        especialidadesMedico[(medicoIdx + 1) % especialidadesMedico.length];

      const pacienteIdxBase =
        (dayIdx * medicos.length + medicoIdx) % pacientes.length;

      const paciente1 = assignPatient(
        dayState,
        pacientes,
        medico.id,
        espRegular1,
        regular1,
        pacienteIdxBase,
      );
      if (!paciente1) {
        throw new Error(
          `No se pudo asignar paciente al turno regular 1 (${day.toISOString()}, médico ${medico.id})`,
        );
      }

      const paciente2 = assignPatient(
        dayState,
        pacientes,
        medico.id,
        espRegular2,
        regular2,
        pacienteIdxBase + 3,
      );
      if (!paciente2) {
        throw new Error(
          `No se pudo asignar paciente al turno regular 2 (${day.toISOString()}, médico ${medico.id})`,
        );
      }

      const tipo1 = pickFrom(rng, REGULAR_TIPOS);
      const tipo2 = pickFrom(rng, REGULAR_TIPOS);
      const estado1 = resolveEstado(day, rng);
      const estado2 = resolveEstado(day, rng);

      turnos.push({
        pacienteId: paciente1,
        medicoId: medico.id,
        especialidadId: espRegular1,
        creadoPorId,
        fechaInicio: regular1.inicio,
        fechaFin: regular1.fin,
        tipo: tipo1,
        estado: estado1.estado,
        motivoCancelacion: estado1.motivoCancelacion,
      });

      turnos.push({
        pacienteId: paciente2,
        medicoId: medico.id,
        especialidadId: espRegular2,
        creadoPorId,
        fechaInicio: regular2.inicio,
        fechaFin: regular2.fin,
        tipo: tipo2,
        estado: estado2.estado,
        motivoCancelacion: estado2.motivoCancelacion,
      });

      const overlapTarget = rng() < 0.5 ? regular1 : regular2;
      const espSobreturno =
        overlapTarget === regular1 ? espRegular1 : espRegular2;
      const sobreturnoDuration = pickFrom(rng, [15, 30] as const);
      const sobreturnoInterval: Intervalo = {
        inicio: overlapTarget.inicio,
        fin: addMinutes(overlapTarget.inicio, sobreturnoDuration),
      };

      const excludedPatients = new Set([paciente1, paciente2]);
      let pacienteSobreturno: string | null = null;

      for (let offset = 0; offset < pacientes.length; offset += 1) {
        const candidate = pacientes[(pacienteIdxBase + 5 + offset) % pacientes.length];
        if (excludedPatients.has(candidate.id)) {
          continue;
        }
        if (
          canAssignPatient(
            dayState,
            candidate.id,
            medico.id,
            espSobreturno,
            sobreturnoInterval,
          )
        ) {
          registerPatientAssignment(
            dayState,
            candidate.id,
            medico.id,
            espSobreturno,
            sobreturnoInterval,
          );
          pacienteSobreturno = candidate.id;
          break;
        }
      }

      if (!pacienteSobreturno) {
        throw new Error(
          `No se pudo asignar paciente al sobreturno (${day.toISOString()}, médico ${medico.id})`,
        );
      }

      const estadoSobreturno = resolveEstado(day, rng);

      turnos.push({
        pacienteId: pacienteSobreturno,
        medicoId: medico.id,
        especialidadId: espSobreturno,
        creadoPorId,
        fechaInicio: sobreturnoInterval.inicio,
        fechaFin: sobreturnoInterval.fin,
        tipo: TipoTurno.SOBRETURNO,
        estado: estadoSobreturno.estado,
        motivoCancelacion: estadoSobreturno.motivoCancelacion,
      });
    }
  }

  return turnos;
}

/**
 * Valida que los turnos generados cumplan las reglas de negocio del seed.
 *
 * @param turnos - Turnos a validar.
 * @param medicoEspecialidades - Especialidades permitidas por médico.
 * @throws Error si alguna restricción se viola.
 */
function assertTurnosConstraints(
  turnos: TurnoSeedRow[],
  medicoEspecialidades: Map<string, string[]>,
): void {
  const byMedicoDay = new Map<string, TurnoSeedRow[]>();
  const byPacienteDay = new Map<string, TurnoSeedRow[]>();

  for (const turno of turnos) {
    const dayKey = startOfDay(turno.fechaInicio).toISOString();
    const medicoKey = `${turno.medicoId}|${dayKey}`;
    const pacienteKey = `${turno.pacienteId}|${dayKey}`;

    const medicoList = byMedicoDay.get(medicoKey) ?? [];
    medicoList.push(turno);
    byMedicoDay.set(medicoKey, medicoList);

    const pacienteList = byPacienteDay.get(pacienteKey) ?? [];
    pacienteList.push(turno);
    byPacienteDay.set(pacienteKey, pacienteList);

    const allowed = medicoEspecialidades.get(turno.medicoId) ?? [];
    if (!allowed.includes(turno.especialidadId)) {
      throw new Error(
        `Especialidad ${turno.especialidadId} no pertenece al médico ${turno.medicoId}`,
      );
    }

    if (turno.fechaInicio < atTime(turno.fechaInicio, 8, 0)) {
      throw new Error(`Turno antes de las 8:00: ${turno.fechaInicio.toISOString()}`);
    }

    if (turno.fechaFin > atTime(turno.fechaInicio, 20, 0)) {
      throw new Error(`Turno después de las 20:00: ${turno.fechaFin.toISOString()}`);
    }

    const durationMin =
      (turno.fechaFin.getTime() - turno.fechaInicio.getTime()) / 60_000;
    if (!DURATIONS_MIN.includes(durationMin as (typeof DURATIONS_MIN)[number])) {
      throw new Error(
        `Duración inválida (${durationMin} min) en turno ${turno.fechaInicio.toISOString()}`,
      );
    }
  }

  for (const [, dayTurnos] of byMedicoDay) {
    const regulares = dayTurnos.filter((t) => t.tipo !== TipoTurno.SOBRETURNO);
    const sobreturnos = dayTurnos.filter((t) => t.tipo === TipoTurno.SOBRETURNO);

    if (sobreturnos.length < 1) {
      throw new Error('Médico sin sobreturno en el día');
    }

    const pacientesMedico = new Set(dayTurnos.map((t) => t.pacienteId));
    if (pacientesMedico.size < 2) {
      throw new Error('Médico con menos de 2 pacientes distintos en el día');
    }

    for (let i = 0; i < regulares.length; i += 1) {
      for (let j = i + 1; j < regulares.length; j += 1) {
        const a = regulares[i];
        const b = regulares[j];
        if (
          intervalsOverlap(
            { inicio: a.fechaInicio, fin: a.fechaFin },
            { inicio: b.fechaInicio, fin: b.fechaFin },
          )
        ) {
          throw new Error('Turnos regulares del mismo médico se solapan');
        }
      }
    }

    for (const sobreturno of sobreturnos) {
      const overlapsRegular = regulares.some((regular) =>
        intervalsOverlap(
          { inicio: regular.fechaInicio, fin: regular.fechaFin },
          { inicio: sobreturno.fechaInicio, fin: sobreturno.fechaFin },
        ),
      );
      if (!overlapsRegular) {
        throw new Error('Sobreturno sin superposición con turno regular');
      }
    }
  }

  for (const [, dayTurnos] of byPacienteDay) {
    if (dayTurnos.length > 2) {
      throw new Error('Paciente con más de 2 turnos en el día');
    }

    for (let i = 0; i < dayTurnos.length; i += 1) {
      for (let j = i + 1; j < dayTurnos.length; j += 1) {
        const a = dayTurnos[i];
        const b = dayTurnos[j];
        if (
          intervalsOverlap(
            { inicio: a.fechaInicio, fin: a.fechaFin },
            { inicio: b.fechaInicio, fin: b.fechaFin },
          )
        ) {
          throw new Error('Paciente con turnos solapados en el mismo día');
        }

        if (
          a.medicoId === b.medicoId &&
          a.especialidadId === b.especialidadId
        ) {
          throw new Error(
            'Paciente con dos turnos el mismo día con mismo médico y especialidad',
          );
        }
      }
    }
  }

  const pacienteMedicos = new Map<string, Set<string>>();
  for (const turno of turnos) {
    const set = pacienteMedicos.get(turno.pacienteId) ?? new Set();
    set.add(turno.medicoId);
    pacienteMedicos.set(turno.pacienteId, set);
  }

  for (const [pacienteId, medicosSet] of pacienteMedicos) {
    if (medicosSet.size < 2) {
      throw new Error(
        `Paciente ${pacienteId} atendido por menos de 2 médicos en el período`,
      );
    }
  }
}

async function main(): Promise<void> {
  const passwordHash = await argon2.hash(DEV_PASSWORD);

  for (const user of DEV_USERS) {
    await prisma.usuario.upsert({
      where: { mail: user.mail },
      update: {
        passwordHash,
        activo: true,
        rol: user.rol,
        nombre: user.nombre,
        apellido: user.apellido,
      },
      create: {
        documentoIdentidad: user.documentoIdentidad,
        nombre: user.nombre,
        apellido: user.apellido,
        mail: user.mail,
        passwordHash,
        rol: user.rol,
        activo: true,
      },
    });
  }

  const recepcion = await prisma.usuario.findUniqueOrThrow({
    where: { mail: 'recepcion@clinica.local' },
  });

  const medicos = await Promise.all(
    DEV_USERS.filter((u) => u.rol === RolUsuario.MEDICO).map((u) =>
      prisma.usuario.findUniqueOrThrow({ where: { mail: u.mail } }),
    ),
  );

  const especialidades = await Promise.all(
    ESPECIALIDADES.map((esp) =>
      prisma.especialidad.upsert({
        where: { nombre: esp.nombre },
        update: {},
        create: { nombre: esp.nombre },
      }),
    ),
  );

  const medicoEspecialidades = new Map<string, string[]>();

  for (let i = 0; i < medicos.length; i += 1) {
    const medico = medicos[i];
    const esp1 = especialidades[i % especialidades.length];
    const esp2 = especialidades[(i + 1) % especialidades.length];

    await prisma.medicoEspecialidad.upsert({
      where: {
        medicoId_especialidadId: {
          medicoId: medico.id,
          especialidadId: esp1.id,
        },
      },
      update: {},
      create: { medicoId: medico.id, especialidadId: esp1.id },
    });

    await prisma.medicoEspecialidad.upsert({
      where: {
        medicoId_especialidadId: {
          medicoId: medico.id,
          especialidadId: esp2.id,
        },
      },
      update: {},
      create: { medicoId: medico.id, especialidadId: esp2.id },
    });

    medicoEspecialidades.set(medico.id, [esp1.id, esp2.id]);
  }

  const pacientes = await Promise.all(
    PACIENTES.map((p) =>
      prisma.paciente.upsert({
        where: { documento: p.documento },
        update: {
          nombre: p.nombre,
          apellido: p.apellido,
          telefono: 'telefono' in p ? p.telefono : null,
          mail: 'mail' in p ? p.mail : null,
        },
        create: {
          documento: p.documento,
          nombre: p.nombre,
          apellido: p.apellido,
          telefono: 'telefono' in p ? p.telefono : null,
          mail: 'mail' in p ? p.mail : null,
        },
      }),
    ),
  );

  await prisma.llamadoTurno.deleteMany({});
  await prisma.turno.deleteMany({});

  const turnosData = buildTurnosAgenda({
    medicos,
    pacientes,
    medicoEspecialidades,
    creadoPorId: recepcion.id,
  });

  assertTurnosConstraints(turnosData, medicoEspecialidades);

  await prisma.turno.createMany({ data: turnosData });

  const rangeStart = addDays(startOfDay(new Date()), -1);
  const rangeEnd = endOfNovember(new Date());
  const diasHabiles = eachWeekdayInclusive(rangeStart, rangeEnd);
  const turnosPorDia = medicos.length * 3;

  const counts = {
    medicos: medicos.length,
    especialidades: especialidades.length,
    pacientes: pacientes.length,
    turnos: turnosData.length,
    diasHabiles: diasHabiles.length,
    turnosPorDia,
  };

  const firstDay = diasHabiles[0]?.toLocaleDateString('es-AR') ?? '—';
  const lastDay =
    diasHabiles[diasHabiles.length - 1]?.toLocaleDateString('es-AR') ?? '—';

  // eslint-disable-next-line no-console -- script CLI
  console.log(
    `Seed OK: ${DEV_USERS.map((u) => `${u.mail} (${u.rol})`).join(', ')} | ` +
      `${counts.medicos} médicos, ${counts.especialidades} especialidades, ` +
      `${counts.pacientes} pacientes, ${counts.turnos} turnos ` +
      `(${counts.turnosPorDia}/día hábil × ${counts.diasHabiles} días, ${firstDay} → ${lastDay})`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
