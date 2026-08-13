/**
 * Seed de desarrollo: usuarios por rol para ejercitar autenticación.
 *
 * Uso: pnpm --filter @turnos/database db:seed
 *
 * Credenciales (solo desarrollo) — misma contraseña para todos:
 *   password: Admin123!@#$
 *   admin@clinica.local       → ADMIN
 *   recepcion@clinica.local   → RECEPCIONISTA
 *   medico@clinica.local      → MEDICO
 */
import { PrismaClient, RolUsuario } from '@prisma/client';
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
] as const;

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

  // eslint-disable-next-line no-console -- script CLI
  console.log(
    `Seed OK: ${DEV_USERS.map((u) => `${u.mail} (${u.rol})`).join(', ')}`,
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
