# turnos-mvp

Monorepo de gestión de turnos clínicos: **Next.js** (`apps/web`) + **NestJS** (`apps/api`) + **Prisma** (`packages/database`).

## Requisitos

- Node.js 22+
- pnpm 10+
- PostgreSQL en `localhost:5432` (usuario `postgres`, password `root`)

## Primera vez

```bash
cp packages/database/.env.example packages/database/.env
cp apps/api/.env.example apps/api/.env
```

Crear la base (PowerShell):

```powershell
$env:PGPASSWORD='root'
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE turnos_mvp;"
```

Luego:

```bash
pnpm install
pnpm db:migrate
pnpm --filter @turnos/database build
pnpm --filter @turnos/database db:seed
pnpm dev
```

| URL | Qué |
| --- | --- |
| http://localhost:3000 | Web |
| http://localhost:3001/api/health | API |
| http://localhost:3001/api/docs | Swagger |

Usuarios de desarrollo (password `Admin123!@#$`): `admin@clinica.local`, `recepcion@clinica.local`, `medico@clinica.local`.

## Día a día

```bash
pnpm install   # si cambiaron dependencias
pnpm --filter @turnos/database build
pnpm dev
```

## Tras cambios de base de datos

Con PostgreSQL corriendo:

```bash
pnpm db:migrate
pnpm --filter @turnos/database build
pnpm --filter @turnos/database db:seed   # solo si hace falta re-sembrar usuarios
pnpm dev
```

`pnpm db:migrate` aplica migraciones pendientes. Si editaste `packages/database/prisma/schema.prisma`, Prisma pide un nombre y genera la migración nueva.
