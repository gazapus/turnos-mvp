# Inicialización del Monorepo — Sistema de Gestión de Turnos MVP

**Fecha:** Agosto 2026  
**Estado:** Decisión tomada / Ejecutada  
**Alcance:** Bootstrap técnico del repositorio (estructura, apps de prueba, base de datos, OpenSpec)  
**Prerrequisitos:** [ADR 01 — Arquitectura](01_definicion_arquitectura.md) · [ADR 02 — SDD / OpenSpec](02_definicion_sdd_openspec.md)

---

## 1. Decisión

Se ejecutó la **inicialización técnica del monorepo** según la estructura definida en el ADR 01, incorporando OpenSpec del ADR 02, con:

- Monorepo **pnpm workspaces + Turborepo**
- Paquete **`@turnos/database`** (Prisma) como fuente única del modelo de datos
- **`apps/api`** (NestJS) con endpoint de prueba `GET /api/health`
- **`apps/web`** (Next.js + Tailwind) con pantalla de prueba conectada al backend
- Base de datos **`turnos_mvp`** en PostgreSQL local, creada y migrada con **Prisma Migrate**

Este ADR documenta **qué se hizo** y **los comandos básicos** para replicar el bootstrap en otro proyecto con el mismo stack.

---

## 2. Decisiones tomadas en esta inicialización

| Decisión                 | Opción elegida                                                                            |
| :----------------------- | :---------------------------------------------------------------------------------------- |
| Orquestador de monorepo  | **Turborepo** + pnpm workspaces                                                           |
| Alcance de `packages/`   | **4 paquetes** (`database`, `shared-types`, `ui`, `config`); los 3 últimos con `.gitkeep` |
| Estrategia de esquema DB | **Prisma Migrate** (`prisma migrate dev --name init`)                                     |
| Nombre de base de datos  | **`turnos_mvp`**                                                                          |
| Estilos frontend         | **Tailwind CSS**                                                                          |
| Control de versiones     | **Git inicializado** (sin commit automático)                                              |

---

## 3. Prerrequisitos de entorno

```bash
node --version    # v22+
pnpm --version    # v10+
git --version
psql --version    # PostgreSQL 17+ (local en localhost:5432)
```

PostgreSQL local con credenciales usadas en este proyecto:

- **Host:** `localhost:5432`
- **Usuario:** `postgres`
- **Password:** `root`
- **Base de datos:** `turnos_mvp`

---

## 4. Tareas realizadas y comandos de replicación

### 4.1 Monorepo — raíz del repositorio

**Tareas:**

- Git inicializado
- `pnpm-workspace.yaml`, `package.json`, `turbo.json`, `.gitignore` creados

**Comandos:**

```bash
git init
```

Crear manualmente en la raíz:

- `pnpm-workspace.yaml` — workspaces `apps/*` y `packages/*`
- `package.json` — scripts `dev`, `build`, `lint`, `db:migrate`; devDependency `turbo`
- `turbo.json` — tasks `build`, `dev` (persistent, sin cache), `lint`
- `.gitignore` — `node_modules`, `dist`, `.next`, `.turbo`, `.env*` (excepto `.env.example`)

Instalar dependencias raíz:

```bash
pnpm install
```

---

### 4.2 Paquete `packages/database` (Prisma)

**Tareas:**

- Schema Prisma en `packages/database/prisma/schema.prisma` (fuente única de verdad)
- Singleton `PrismaClient` en `packages/database/src/index.ts`
- Variables de entorno en `.env` / `.env.example`

Crear `packages/database/package.json` con nombre `@turnos/database`, dependencias `@prisma/client` y `prisma`, script:

```json
"build": "prisma generate && tsc",
"db:migrate": "prisma migrate dev"
```

Contenido de `packages/database/.env`:

```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/turnos_mvp?schema=public"
```

Instalar dependencias del workspace:

```bash
pnpm install
```

---

### 4.3 Paquetes reservados (`shared-types`, `ui`, `config`)

**Tareas:** carpetas reservadas con `.gitkeep` para preservar la estructura del ADR 01 (ver sección 5).

---

### 4.4 Base de datos PostgreSQL

**Tareas:**

- Base `turnos_mvp` creada
- Migración inicial Prisma aplicada (`20260806121757_init`)
- 8 tablas + 3 enums según el modelo

**Comandos:**

```bash
# Crear la base (Linux/macOS o psql en PATH)
PGPASSWORD=root psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE turnos_mvp;"
```

En Windows (PowerShell):

```powershell
$env:PGPASSWORD='root'
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE turnos_mvp;"
```

Aplicar migración inicial:

```bash
pnpm --filter @turnos/database exec prisma migrate dev --name init
```

Verificar conexión (opcional):

```bash
pnpm --filter @turnos/database exec prisma db pull --print
```

---

### 4.5 Backend — `apps/api` (NestJS)

**Tareas:**

- Scaffold NestJS 11 como `@turnos/api`
- Módulo `health` con `GET /api/health` (prefijo global `api`)
- Verificación real de DB vía `@turnos/database` (`SELECT 1`)
- CORS para `http://localhost:3000`, puerto **3001**

**Comandos:**

```bash
npx -y @nestjs/cli@11 new api --directory apps/api --package-manager pnpm --skip-git --strict
```

Agregar dependencia al paquete de base de datos y dotenv:

```bash
pnpm --filter @turnos/api add @turnos/database dotenv
```

En `apps/api/package.json`, renombrar a `@turnos/api` y agregar script `"dev": "nest start --watch"`.

Compilar paquete database antes de la API:

```bash
pnpm --filter @turnos/database build
pnpm --filter @turnos/api build
```

Variables en `apps/api/.env`:

```env
PORT=3001
CORS_ORIGIN=http://localhost:3000
DATABASE_URL="postgresql://postgres:root@localhost:5432/turnos_mvp?schema=public"
```

Levantar en desarrollo:

```bash
pnpm --filter @turnos/api dev
```

Verificar endpoint:

```bash
curl http://localhost:3001/api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "turnos-api",
  "database": "connected",
  "timestamp": "..."
}
```

**Nota de replicación:** NestJS 11 genera `tsconfig` con `"module": "nodenext"`, que puede impedir emitir `dist/`. Para este monorepo se cambió a `"module": "commonjs"` y `"moduleResolution": "node"` en `apps/api/tsconfig.json`. El paquete `@turnos/database` debe compilarse a `dist/` (`main: ./dist/index.js`) antes de consumirlo desde la API.

---

### 4.6 Frontend — `apps/web` (Next.js + Tailwind)

**Tareas:**

- Scaffold Next.js 15 + Tailwind como `@turnos/web`
- Pantalla de prueba en `/` que consulta `/api/health`
- Puerto **3000**

**Comandos:**

```bash
npx -y create-next-app@15 apps/web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-pnpm \
  --turbopack \
  --yes
```

Renombrar en `apps/web/package.json` a `@turnos/web` (el script `dev` ya viene incluido).

Variables en `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Levantar en desarrollo:

```bash
pnpm --filter @turnos/web dev
```

Verificar:

```bash
curl -I http://localhost:3000
# Debe responder HTTP 200 con la pantalla de prueba
```

---

### 4.7 OpenSpec (SDD)

**Tareas:** OpenSpec inicializado en la raíz con integración Cursor.

**Comandos:**

```bash
openspec init --tools cursor --force
```

---

### 4.8 Verificación end-to-end

**Comandos:**

```bash
# Terminal 1 — compilar DB y levantar API
pnpm --filter @turnos/database build
pnpm --filter @turnos/api dev

# Terminal 2 — levantar frontend
pnpm --filter @turnos/web dev

# Terminal 3 — verificar
curl http://localhost:3001/api/health
curl http://localhost:3000
```

O ambas apps en paralelo desde la raíz (con Turborepo):

```bash
pnpm dev
```

---

## 5. Estructura resultante del repositorio

```text
turnos-mvp/
├── apps/
│   ├── api/                  # NestJS — GET /api/health
│   └── web/                  # Next.js + Tailwind — pantalla de prueba
├── packages/
│   ├── database/             # Prisma (schema + migraciones + client)
│   ├── shared-types/         # reservado (.gitkeep)
│   ├── ui/                   # reservado (.gitkeep)
│   └── config/               # reservado (.gitkeep)
├── openspec/
│   ├── config.yaml
│   ├── specs/
│   └── changes/
├── docs/
│   ├── adr/
│   │   ├── 01_definicion_arquitectura.md
│   │   ├── 02_definicion_sdd_openspec.md
│   │   └── 03_inicializacion_monorepo.md
│   └── schema.sql            # referencia SQL (histórico)
├── .cursor/                  # skills y commands de OpenSpec
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 6. Comandos de operación diaria (post-inicialización)

```bash
# Instalar dependencias
pnpm install

# Compilar paquete de base de datos
pnpm --filter @turnos/database build

# Desarrollo (API + Web en paralelo)
pnpm dev

# Migraciones de base de datos
pnpm db:migrate
# equivalente a: pnpm --filter @turnos/database db:migrate
```

| URL                                | Descripción                   |
| :--------------------------------- | :---------------------------- |
| `http://localhost:3000`            | Pantalla de prueba (frontend) |
| `http://localhost:3001/api/health` | Health check con estado de DB |

---

## 7. Diagrama de base de datos

```mermaid
erDiagram
    Usuario {
        uuid id PK
        string documento_identidad UK
        string nombre
        string apellido
        string mail UK
        string password_hash
        enum rol
        boolean activo
        datetime created_at
        datetime updated_at
    }

    Especialidad {
        uuid id PK
        string nombre UK
    }

    MedicoEspecialidad {
        uuid medico_id PK,FK
        uuid especialidad_id PK,FK
    }

    MedicoConsultorio {
        uuid medico_id PK,FK
        string consultorio
    }

    Paciente {
        uuid id PK
        string documento UK
        string nombre
        string apellido
        string telefono
        string mail
        datetime created_at
        datetime updated_at
    }

    Turno {
        uuid id PK
        uuid paciente_id FK
        uuid medico_id FK
        uuid especialidad_id FK
        uuid creado_por FK
        datetime fecha_inicio
        datetime fecha_fin
        enum tipo
        enum estado
        string motivo_cancelacion
        boolean notificar_mail
        boolean notificar_whatsapp
        datetime created_at
        datetime updated_at
    }

    BloqueoAgenda {
        uuid id PK
        uuid medico_id FK
        uuid creado_por FK
        datetime fecha_inicio
        datetime fecha_fin
        datetime created_at
    }

    LlamadoTurno {
        uuid id PK
        uuid turno_id FK
        datetime llamado_en
    }

    Usuario ||--o{ MedicoEspecialidad : "tiene"
    Especialidad ||--o{ MedicoEspecialidad : "asignada_a"
    Usuario ||--o| MedicoConsultorio : "consultorio_fijo"
    Paciente ||--o{ Turno : "tiene"
    Usuario ||--o{ Turno : "atiende"
    Usuario ||--o{ Turno : "crea"
    Especialidad ||--o{ Turno : "requiere"
    Turno ||--o{ LlamadoTurno : "llamados"
    Usuario ||--o{ BloqueoAgenda : "bloqueado"
    Usuario ||--o{ BloqueoAgenda : "registra_bloqueo"
```

### Enums

- **rol_usuario:** `ADMIN`, `RECEPCIONISTA`, `MEDICO`
- **tipo_turno:** `PRIMER_TURNO`, `CONTROL`, `SOBRETURNO`, `URGENTE`
- **estado_turno:** `PROGRAMADO`, `CONFIRMADO`, `CANCELADO`, `VENCIDO`

---

## 8. Diagrama de componentes actuales

```mermaid
graph TD
    Browser["Navegador"] -->|"HTTP :3000"| Web["apps/web<br/>Next.js 15 + Tailwind"]
    Web -->|"fetch GET /api/health"| Api["apps/api<br/>NestJS 11 :3001"]
    Api -->|"import @turnos/database"| DbPkg["packages/database<br/>Prisma Client"]
    DbPkg -->|"SQL"| Postgres["PostgreSQL<br/>turnos_mvp @ localhost:5432"]

    OpenSpec["openspec/<br/>config.yaml + .cursor/"] -.->|"SDD — guía de desarrollo"| Web
    OpenSpec -.->|"SDD — guía de desarrollo"| Api

    SharedTypes["packages/shared-types<br/>(reservado)"] -.->|"futuro"| Web
    SharedTypes -.->|"futuro"| Api

    subgraph monorepo ["Monorepo turnos-mvp"]
        Web
        Api
        DbPkg
        SharedTypes
        UiPkg["packages/ui<br/>(reservado)"]
        ConfigPkg["packages/config<br/>(reservado)"]
    end
```

---

## 9. Ajustes aplicados durante la init (lecciones para replicar)

| Problema                                               | Solución aplicada                                                                            |
| :----------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| NestJS no emitía `dist/main.js` con `module: nodenext` | Cambiar `apps/api/tsconfig.json` a `commonjs` + `moduleResolution: node`                     |
| API no resolvía `@turnos/database` en runtime          | Compilar `packages/database` a `dist/`; consumir vía workspace (`workspace:*`)               |
| Relación Prisma inválida en `Usuario.especialidades`   | Corregir de `MedicoEspecialidad?` a `MedicoEspecialidad[]` en el schema                      |
| pnpm bloqueaba scripts de Prisma                       | Agregar `pnpm.onlyBuiltDependencies` en `package.json` raíz para `prisma` y `@prisma/client` |

---

## 10. Próximos pasos sugeridos

1. Bootstrap de specs OpenSpec a partir de los CU1–CU10 (`openspec/specs/` por dominio).
2. Implementar módulo de autenticación (CU1) en `apps/api` + pantalla login en `apps/web`.
3. Poblar datos semilla: administrador inicial en base de datos.
4. Crear `apps/mcp-postgres` cuando se implemente el chatbot con consultas de datos.
