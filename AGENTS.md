# AGENTS.md — Convenciones de código

Documento normativo para agentes de IA y desarrolladores humanos del monorepo **turnos-mvp**.

**Leer antes de implementar cualquier change de OpenSpec o escribir código nuevo.**

---

## 1. Propósito y alcance

Este documento define **convenciones de código y arquitectura técnica**. No describe reglas de negocio ni casos de uso.

Para definiciones funcionales (roles, casos de uso, flujos operativos, reglas de negocio) consultar [docs/FUNCIONAL.md](docs/FUNCIONAL.md).

| Documento                    | Contenido                                                   |
| :--------------------------- | :---------------------------------------------------------- |
| **AGENTS.md** (este archivo) | Cómo escribir código: estructura, patrones, estilo, testing |
| **docs/FUNCIONAL.md**        | Qué debe hacer el sistema: requisitos y casos de uso        |
| **openspec/**                | Contrato operativo vigente y cambios en curso (SDD)         |

---

## 2. Estructura de carpetas

El monorepo usa **pnpm workspaces + Turborepo**. La estructura siguiente es de **cumplimiento estricto**: no crear carpetas ad-hoc fuera de este esquema.

```text
turnos-mvp/
├── apps/
│   ├── web/                      # Next.js (App Router) — Frontend
│   │   ├── app/
│   │   │   ├── (auth)/login/
│   │   │   ├── (app)/                 # shell autenticado (navbar + sidebar)
│   │   │   │   ├── agenda/
│   │   │   │   ├── consultorios/
│   │   │   │   ├── pacientes/
│   │   │   │   ├── usuarios/
│   │   │   │   └── sala-espera/
│   │   │   ├── (publico)/sala-espera/ # opcional pantalla pública sin shell
│   │   │   ├── globals.css         # importa tailwind + tokens.css
│   │   │   └── tokens.css          # design tokens (CSS + @theme)
│   │   ├── components/
│   │   └── lib/
│   │
│   ├── api/                      # NestJS — Backend
│   │   └── src/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── appointments/     # turnos
│   │       ├── schedule-blocks/  # bloqueo de agenda
│   │       ├── waiting-room/     # gateway WebSocket (CU9/CU10)
│   │       ├── chatbot/          # módulo LangChain.js
│   │       └── notifications/    # jobs de mail
│   │
├── packages/
│   ├── database/                 # Prisma: fuente única de tipos y migraciones
│   │   └── prisma/schema.prisma
│   ├── shared-types/             # DTOs / contratos web ↔ api
│   └── config/                   # eslint / tsconfig / bases compartidas
│
├── openspec/                     # Spec-Driven Development (OpenSpec)
│   ├── specs/                    # Fuente de verdad del sistema (estado actual)
│   │   ├── auth/
│   │   ├── users/
│   │   ├── appointments/
│   │   ├── waiting-room/
│   │   └── chatbot/
│   └── changes/                  # Propuestas en curso (deltas)
│       └── <nombre-del-cambio>/
│           ├── proposal.md
│           ├── design.md         # opcional
│           ├── tasks.md
│           └── specs/
│
├── docs/
│   └── FUNCIONAL.md              # definiciones funcionales
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Roles de cada capa

| Capa                        | Rol                                                          |
| :-------------------------- | :----------------------------------------------------------- |
| **`apps/`**                 | Unidades desplegables (web, API).                            |
| **`packages/database`**     | Única fuente de verdad del modelo de datos (Prisma).         |
| **`packages/shared-types`** | Contratos tipados compartidos entre frontend y backend.      |
| **`packages/config`**       | Configuraciones base compartidas (ESLint, TypeScript, etc.). |
| **`openspec/specs/`**       | Contrato operativo vigente del sistema.                      |
| **`openspec/changes/`**     | Trabajo en curso: propuesta, tareas y deltas.                |

### Reglas de organización

- **Nueva feature = nuevo módulo/carpeta** siguiendo el árbol anterior.
- Las apps **solo consumen `packages/*`**. Prohibido importar código interno de otra app.
- Los módulos de NestJS en `apps/api/src/` siguen el patrón por dominio (`auth/`, `users/`, `appointments/`, etc.), cada uno con su propio barrel file (`index.ts`).

---

## 3. Convenciones generales

Aplican a `apps/web`, `apps/api` y `packages/*`.

### TypeScript

- TypeScript estricto en todo el monorepo.
- **`any` está prohibido.** Usar `unknown` + type guards, genéricos, o tipos generados por Prisma/DTOs.
- Preferir tipos inferidos de Prisma (`@turnos/database`) y contratos de `@turnos/shared-types`.

### No magic strings

Prohibido repetir strings literales con significado de dominio. Usar:

- Enums de Prisma (`Rol`, `EstadoTurno`, `TipoTurno`, etc.).
- Objetos `as const` para constantes agrupadas.
- Archivos de constantes centralizados para rutas, roles, mensajes de error y claves de query.

```typescript
// ❌ Prohibido
if (turno.estado === "PROGRAMADO") { ... }

// ✅ Correcto
import { EstadoTurno } from "@turnos/database";
if (turno.estado === EstadoTurno.PROGRAMADO) { ... }
```

### Barrel files

Cada módulo o feature expone su API pública mediante un `index.ts`:

```typescript
// apps/api/src/appointments/index.ts
export { AppointmentsModule } from './appointments.module';
export { AppointmentsService } from './appointments.service';
export { CreateTurnoDto, TurnoResponseDto } from './dto';
```

- Importar siempre desde el barrel del módulo, nunca desde archivos internos de otro módulo.
- Prohibido saltarse el barrel con imports profundos (`../../otro-modulo/interno.ts`).

### Imports absolutos

Usar alias configurados en `tsconfig.json`:

- **`apps/web`**: `@/*` → raíz de la app (ya configurado).
- **`apps/api`**: `@/*` → `src/*` (configurar al introducir imports profundos).

Prohibidos los paths relativos de más de un nivel (`../../../`).

### JSDoc obligatorio

Todo componente, hook, servicio, controlador y **función exportada** debe incluir JSDoc:

```typescript
/**
 * Panel que muestra el estado de salud del backend y la base de datos.
 * Componente cliente: requiere fetch en el navegador.
 *
 * @returns Sección con el estado del servicio, API y conexión a DB.
 */
export function HealthStatusPanel() { ... }
```

Incluir `@param` y `@returns` cuando aporten valor. No escribir comentarios redundantes que repitan lo obvio del código.

### Testing obligatorio

Cada componente o endpoint nuevo **debe incluir tests unitarios** antes de considerarse completo. Ver secciones 4 y 5 para el framework por app.

### Linter y formatter

- **ESLint** y **Prettier** son la fuente de verdad de estilo.
- Todo código debe pasar `lint` y `format` antes de commit.
- La configuración fina se implementará en un change posterior; este documento fija el estándar a cumplir.

### Conventional Commits

Formato: `<tipo>(<scope>): <descripción>`

| Scope         | Uso                                |
| :------------ | :--------------------------------- |
| `web`         | Cambios en `apps/web`              |
| `api`         | Cambios en `apps/api`              |
| `db`          | Cambios en `packages/database`     |
| `shared`      | Cambios en `packages/shared-types` |
| `config`      | Cambios en `packages/config`       |
| _(sin scope)_ | Cambios transversales o en docs    |

Ejemplos: `feat(web): pantalla de login`, `fix(api): validación de turno duplicado`, `chore(db): migración de índices`.

### Convención de rutas

**Frontend (`apps/web`)** — App Router estándar:

| Archivo       | Uso                         |
| :------------ | :-------------------------- |
| `page.tsx`    | Página de la ruta           |
| `layout.tsx`  | Layout compartido           |
| `loading.tsx` | Estado de carga             |
| `error.tsx`   | Manejo de errores           |
| `route.ts`    | Route handlers (API routes) |

Route groups definidos para el proyecto (nombres en español, convención tradicional):

| Ruta                    | Rol                                           |
| :---------------------- | :-------------------------------------------- |
| `(auth)/login`          | Autenticación                                 |
| `(app)/agenda`          | Agenda unificada (admin / recepción / médico) |
| `(app)/consultorios`    | Consultorios (admin / recepción)              |
| `(app)/pacientes`       | Pacientes (admin / recepción)                 |
| `(app)/usuarios`        | Administración de usuarios (admin)            |
| `(app)/sala-espera`     | Sala de espera dentro del shell               |
| `(publico)/sala-espera` | Pantalla pública de aviso (sin shell)         |

**Backend (`apps/api`)** — REST en plural, prefijo global `api`:

| Recurso            | Endpoint               |
| :----------------- | :--------------------- |
| Turnos             | `/api/turnos`          |
| Usuarios           | `/api/usuarios`        |
| Especialidades     | `/api/especialidades`  |
| Pacientes          | `/api/pacientes`       |
| Bloqueos de agenda | `/api/bloqueos-agenda` |

No inventar nombres genéricos ni abreviaturas (`/api/data`, `/api/t`, `/api/getTurnos`).

### Naming de archivos

| Elemento              | Convención                    | Ejemplo                              |
| :-------------------- | :---------------------------- | :----------------------------------- |
| Archivos              | kebab-case                    | `health-status-panel.tsx`            |
| Componentes / clases  | PascalCase                    | `HealthStatusPanel`                  |
| Variables / funciones | camelCase                     | `fetchHealthStatus`                  |
| Constantes            | UPPER_SNAKE_CASE o `as const` | `MAX_LOGIN_ATTEMPTS`                 |
| DTOs                  | PascalCase + sufijo           | `CreateTurnoDto`, `TurnoResponseDto` |

---

## 4. Convenciones — `apps/web` (Next.js)

### Server Components por defecto

Todo componente en `app/` o `features/` es **Server Component** a menos que necesite:

- Hooks de React (`useState`, `useEffect`, `useRef`, etc.).
- Event handlers del navegador (`onClick`, `onChange`, etc.).
- APIs exclusivas del cliente (`window`, `localStorage`, etc.).

### Leaf components (componentes hoja)

Colocar `"use client"` **únicamente en el componente interactivo más pequeño posible**, no en páginas enteras ni layouts.

```tsx
// app/(app)/agenda/page.tsx — Server Component (sin "use client")
import { AgendaFilters } from '@/components/agenda/agenda-filters';

export default function AgendaPage() {
  return (
    <main>
      <h1>Agenda</h1>
      <AgendaFilters /> {/* leaf client component */}
    </main>
  );
}
```

```tsx
// components/agenda/agenda-filters.tsx — Leaf client component
'use client';

/**
 * Filtros interactivos de la agenda de recepción.
 * Leaf component: contiene el mínimo de lógica cliente necesaria.
 */
export function AgendaFilters() {
  // useState, onClick, etc.
}
```

### Desktop-first, responsive

El sistema se usa principalmente en escritorio (recepción, consultorio). Diseñar **desktop-first** y adaptar hacia abajo:

- Estilos base (sin prefijo) pensados para ≥1024px.
- Usar variantes `max-lg:`, `max-md:`, `max-sm:` de Tailwind v4 para breakpoints menores.
- No usar el enfoque mobile-first típico de Tailwind (`sm:`, `md:` como base).

### Ancho mínimo global

La aplicación web define un **piso de layout** de **320px** (`--layout-min-width` en `tokens.css`), aplicado en `body` vía `globals.css`:

- Por debajo de 320px de viewport, el sitio **no comprime** más el contenido: aparece **scroll horizontal** (`overflow-x: auto` en `html`).
- No fijar `min-width` ad-hoc en páginas o componentes salvo casos excepcionales documentados; usar el token global.
- 320px es el mínimo estándar web (p. ej. iPhone SE); no implica soporte funcional completo en móvil para pantallas operativas (agenda, admin), que siguen siendo desktop-first.

### Design tokens y estilos

Fuente única de tokens visuales: [`apps/web/app/tokens.css`](apps/web/app/tokens.css), importado desde [`apps/web/app/globals.css`](apps/web/app/globals.css).

- **Prohibido** usar hex, `rgb()` / `hsl()` literales o colores arbitrarios en JSX/TSX (`bg-[#0f766e]`, `text-blue-500` fuera del tema).
- **Usar** utilidades semánticas del tema: `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`, etc.
- **Agregar tokens** editando `tokens.css` (`:root` + `@theme`); no inventar valores en componentes.
- Breakpoints del tema: `sm` 640px, `md` 768px, `lg` 1024px — consumir con `max-lg:`, `max-md:`, `max-sm:` (desktop-first).
- Para el flujo completo de tareas frontend, consultar la skill de proyecto `frontend-coder` (`.cursor/skills/frontend-coder/SKILL.md`).

```tsx
// ❌ Prohibido
<button className="bg-[#0f766e] text-white">Guardar</button>

// ✅ Correcto
<button className="bg-primary text-primary-foreground">Guardar</button>
```

### Formularios

Usar **React Hook Form + Zod** para toda validación de formularios:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  mail: z.string().email('Mail inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;
```

No implementar validaciones manuales sueltas fuera de Zod.

### Testing

- **Framework:** Vitest + React Testing Library.
- **Ubicación:** `*.test.tsx` junto al componente.
- **Obligatorio:** un test por cada componente nuevo.

```typescript
// components/health-status-panel.test.tsx
import { render, screen } from "@testing-library/react";
import { HealthStatusPanel } from "./health-status-panel";

describe("HealthStatusPanel", () => {
  it("muestra estado de carga inicial", () => {
    render(<HealthStatusPanel />);
    expect(screen.getByText(/consultando backend/i)).toBeInTheDocument();
  });
});
```

---

## 5. Convenciones — `apps/api` (NestJS)

### DTOs estrictos

Cada controlador define:

1. **DTO de entrada** — validado con `class-validator`.
2. **DTO de salida (Response DTO)** — shape explícito para el frontend.

**Nunca devolver una entidad de Prisma directamente.** Siempre mapear a un Response DTO:

```typescript
// ❌ Prohibido — expone schema interno de DB
@Get(":id")
async getTurno(@Param("id") id: string) {
  return this.prisma.turno.findUnique({ where: { id } });
}

// ✅ Correcto — Response DTO explícito
@Get(":id")
@ApiOperation({ summary: "Obtener turno por ID" })
@ApiResponse({ status: 200, type: TurnoResponseDto })
async getTurno(@Param("id") id: string): Promise<TurnoResponseDto> {
  const turno = await this.appointmentsService.findById(id);
  return TurnoResponseDto.fromEntity(turno);
}
```

Ejemplo de DTO con Swagger y validación:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsEnum } from 'class-validator';
import { TipoTurno } from '@turnos/database';

export class CreateTurnoDto {
  @ApiProperty({ description: 'ID del paciente', format: 'uuid' })
  @IsUUID()
  pacienteId: string;

  @ApiProperty({ description: 'ID del médico', format: 'uuid' })
  @IsUUID()
  medicoId: string;

  @ApiProperty({
    description: 'Fecha y hora de inicio',
    example: '2026-08-15T09:00:00Z',
  })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({ enum: TipoTurno, description: 'Tipo de turno' })
  @IsEnum(TipoTurno)
  tipo: TipoTurno;
}
```

### Swagger / OpenAPI

Decoradores de `@nestjs/swagger` **obligatorios** en todo DTO y endpoint de `apps/api`:

| Decorador         | Dónde                       |
| :---------------- | :-------------------------- |
| `@ApiProperty()`  | Cada propiedad de un DTO    |
| `@ApiTags()`      | Cada controlador            |
| `@ApiOperation()` | Cada endpoint               |
| `@ApiResponse()`  | Respuestas de cada endpoint |

Esto aplica exclusivamente al backend NestJS, no a Next.js.

### Gestión de errores centralizada

Usar un **filtro de excepciones global** (`AllExceptionsFilter`) que devuelva un shape consistente:

```typescript
{
  statusCode: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
}
```

- Prohibido `try/catch` ad-hoc en controladores que devuelvan formatos distintos.
- Lanzar excepciones de NestJS (`NotFoundException`, `BadRequestException`, etc.) y dejar que el filtro global las formatee.

### Logging

- **`console.log` está prohibido** en `apps/api`.
- Usar **`nestjs-pino`** para logs estructurados con nivel, contexto de request y timestamp.
- Inyectar el logger de Pino en servicios y controladores.

```typescript
// ❌ Prohibido
console.log(`Turno creado: ${turno.id}`);

// ✅ Correcto
this.logger.info({ turnoId: turno.id }, 'Turno creado');
```

### Barrel files por módulo

Cada módulo NestJS exporta su API pública desde `index.ts`:

```typescript
// apps/api/src/appointments/index.ts
export { AppointmentsModule } from './appointments.module';
export { AppointmentsService } from './appointments.service';
export { CreateTurnoDto, TurnoResponseDto } from './dto';
```

### Testing

- **Framework:** Jest (ya configurado en `apps/api`).
- **Ubicación:** `*.spec.ts` junto al controller/service.
- **Obligatorio:** un test por cada controller y service nuevo.

```typescript
// appointments.controller.spec.ts
describe('AppointmentsController', () => {
  it('devuelve TurnoResponseDto al consultar por ID', async () => {
    const result = await controller.getTurno('uuid-valido');
    expect(result).toHaveProperty('id');
    expect(result).not.toHaveProperty('passwordHash'); // no expone campos internos
  });
});
```

---

## 6. Herramientas configuradas y pendientes

### Configuradas en el monorepo

| Herramienta                | Ubicación                         | Uso                                                            |
| :------------------------- | :-------------------------------- | :------------------------------------------------------------- |
| ESLint (config compartida) | `packages/config`                 | Presets `base`, `nestjs`, `next`; `any` prohibido              |
| Prettier                   | raíz + `packages/config/prettier` | `pnpm format` / `pnpm format:check`                            |
| husky + commitlint         | raíz (`.husky/`)                  | Pre-commit con lint-staged; validación de Conventional Commits |
| nestjs-pino                | `apps/api`                        | Logging estructurado; prohibido `console.log`                  |
| Swagger / OpenAPI          | `apps/api`                        | Documentación en `/api/docs`                                   |
| Zod + React Hook Form      | `apps/web`                        | Validación de formularios (ver `lib/schemas/`)                 |
| Vitest + RTL               | `apps/web`                        | `pnpm --filter @turnos/web test`                               |
| Design tokens              | `apps/web/app/tokens.css`         | CSS + `@theme` Tailwind v4; import en `globals.css`            |
| Jest                       | `apps/api`                        | `pnpm --filter @turnos/api test`                               |
| Context7 (Cursor MCP)      | Plugin Cursor                     | Docs actualizadas de librerías; ver skill `lib-docs`           |
| Skill `lib-docs`           | `.cursor/skills/lib-docs/`        | Auditoría de deprecaciones y APIs vía Context7 (`/lib-docs`)   |

**Scripts raíz:** `pnpm lint`, `pnpm format`, `pnpm format:check`, `pnpm test`, `pnpm build`.

### MCPs de desarrollo (Cursor)

Los MCPs en este proyecto son **herramientas del IDE para agentes y desarrolladores**, no componentes del producto desplegable.

| MCP / skill | Rol |
| :---------- | :-- |
| **Context7** | Documentación actualizada de librerías del stack (Next, Nest, Prisma, Tailwind, etc.). |
| **Skill `lib-docs`** | Workflow del repo para consultar Context7, contrastar con el código y reportar deprecaciones. Comando: `/lib-docs`. |
| **Browser** (Cursor) | Verificación manual de UI en `localhost`. |

El chatbot del producto es solo asistente de documentación de usuario (`docs/ayuda/`); no usa Context7 ni MCP en runtime (ver `docs/FUNCIONAL.md` §9).

Context7 se habilita en Cursor (Settings → MCP / plugins). No requiere `.cursor/mcp.json` en el repo.

### Pendientes (changes posteriores)

| Elemento                | Propósito                                                                          |
| :---------------------- | :--------------------------------------------------------------------------------- |
| `packages/shared-types` | Contratos tipados compartidos web ↔ api                                            |
| Primitives UI           | Componentes base del design system (Button, Input, etc.) en `apps/web/components/` |
| CI/CD (GitHub Actions)  | Lint, test y build en cada PR                                                      |
| Plugin ESLint de JSDoc  | Validación automática de comentarios (JSDoc sigue siendo obligatorio manualmente)  |
