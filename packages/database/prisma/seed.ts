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

const ESTADOS = Object.values(EstadoTurno);
const TIPOS = Object.values(TipoTurno);

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

const TURNOS_POR_DIA = 40;

/**
 * Último día de agosto del mismo año que la fecha de referencia (00:00 local).
 *
 * @param reference - Fecha de referencia.
 * @returns 31 de agosto a las 00:00.
 */
function endOfAugust(reference: Date): Date {
  return startOfDay(new Date(reference.getFullYear(), 7, 31));
}

/**
 * Lista de días consecutivos entre dos fechas inclusive (00:00 local).
 *
 * @param from - Primer día.
 * @param to - Último día.
 * @returns Array de fechas, una por día.
 */
function eachDayInclusive(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  let current = startOfDay(from);
  const end = startOfDay(to);

  while (current.getTime() <= end.getTime()) {
    days.push(new Date(current));
    current = addDays(current, 1);
  }

  return days;
}

/**
 * Genera los turnos de desarrollo: {@link TURNOS_POR_DIA} por día desde hoy
 * hasta el 31 de agosto del año en curso.
 *
 * @param params - Médicos, pacientes, especialidades y usuario creador.
 * @returns Datos listos para `createMany`.
 */
function buildTurnosPorDia(params: {
  medicos: Array<{ id: string }>;
  pacientes: Array<{ id: string }>;
  especialidades: Array<{ id: string }>;
  creadoPorId: string;
}): Array<{
  pacienteId: string;
  medicoId: string;
  especialidadId: string;
  creadoPorId: string;
  fechaInicio: Date;
  fechaFin: Date;
  tipo: TipoTurno;
  estado: EstadoTurno;
}> {
  const { medicos, pacientes, especialidades, creadoPorId } = params;
  const today = startOfDay(new Date());
  const finAgosto = endOfAugust(today);
  const dias = eachDayInclusive(today, finAgosto);
  const turnos: ReturnType<typeof buildTurnosPorDia> = [];
  let turnoIndex = 0;

  for (const day of dias) {
    for (let slot = 0; slot < TURNOS_POR_DIA; slot += 1) {
      const medico = medicos[slot % medicos.length];
      const slotEnMedico = Math.floor(slot / medicos.length);
      const hour = 8 + Math.floor(slotEnMedico / 2);
      const minute = slotEnMedico % 2 === 0 ? 0 : 30;

      const fechaInicio = new Date(day);
      fechaInicio.setHours(hour, minute, 0, 0);

      const fechaFin = new Date(fechaInicio);
      fechaFin.setMinutes(fechaFin.getMinutes() + 30);

      turnos.push({
        pacienteId: pacientes[turnoIndex % pacientes.length].id,
        medicoId: medico.id,
        especialidadId: especialidades[turnoIndex % especialidades.length].id,
        creadoPorId,
        fechaInicio,
        fechaFin,
        tipo: TIPOS[turnoIndex % TIPOS.length],
        estado: ESTADOS[turnoIndex % ESTADOS.length],
      });

      turnoIndex += 1;
    }
  }

  return turnos;
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

  await prisma.turno.deleteMany({});

  const turnosData = buildTurnosPorDia({
    medicos,
    pacientes,
    especialidades,
    creadoPorId: recepcion.id,
  });

  await prisma.turno.createMany({ data: turnosData });

  const diasConTurnos = eachDayInclusive(
    startOfDay(new Date()),
    endOfAugust(new Date()),
  ).length;

  const counts = {
    medicos: medicos.length,
    especialidades: especialidades.length,
    pacientes: pacientes.length,
    turnos: turnosData.length,
    dias: diasConTurnos,
    turnosPorDia: TURNOS_POR_DIA,
  };

  // eslint-disable-next-line no-console -- script CLI
  console.log(
    `Seed OK: ${DEV_USERS.map((u) => `${u.mail} (${u.rol})`).join(', ')} | ` +
      `${counts.medicos} médicos, ${counts.especialidades} especialidades, ` +
      `${counts.pacientes} pacientes, ${counts.turnos} turnos ` +
      `(${counts.turnosPorDia}/día × ${counts.dias} días hasta fin de agosto)`,
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
