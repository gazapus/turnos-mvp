# Catálogo del stack — turnos-mvp

Fuente de versiones: `package.json` de cada paquete. **Actualizar este archivo cuando cambien dependencias relevantes.**

Última revisión: septiembre 2026.

## Raíz

| Herramienta | Versión | Notas |
| :---------- | :------ | :---- |
| pnpm | 10.11.0 | `packageManager` en raíz |
| turbo | ^2.5.4 | Orquestación monorepo |
| prettier | ^3.4.2 | Formato |
| husky + commitlint | — | Pre-commit |

## `apps/web` (@turnos/web)

| Librería | Versión | Uso típico en el repo |
| :------- | :------ | :-------------------- |
| next | 15.5.22 | App Router, RSC, route handlers |
| react / react-dom | 19.1.0 | UI |
| tailwindcss | ^4 | Estilos vía `@theme` + tokens.css |
| @tailwindcss/postcss | ^4 | PostCSS |
| react-hook-form | ^7.85.0 | Formularios |
| @hookform/resolvers | ^5.7.1 | zodResolver |
| zod | ^4.4.3 | Schemas de validación |
| @tanstack/react-query | ^5.90.12 | Fetch/cache cliente |
| @fullcalendar/* | 6.1.21 | Vista agenda (day/time grid) |
| @daypicker/react | ^10.0.1 | Selector de fechas |
| lucide-react | ^1.31.0 | Iconos |
| vitest | ^4.1.10 | Tests unitarios |
| @testing-library/react | ^16.3.2 | Tests de componentes |

**Queries Context7 sugeridas:** deprecations, App Router patterns, React 19 changes, Tailwind v4 migration, Zod 4 API, React Hook Form v7, TanStack Query v5, FullCalendar 6.

## `apps/api` (@turnos/api)

| Librería | Versión | Uso típico en el repo |
| :------- | :------ | :-------------------- |
| @nestjs/common, core, platform-express | ^11.0.1 | API REST |
| @nestjs/swagger | ^11.4.6 | OpenAPI |
| @nestjs/jwt | ^11.0.0 | Sesión JWT |
| class-validator / class-transformer | ^0.15.1 / ^0.5.1 | DTOs |
| nestjs-pino / pino-http | ^4.6.1 / ^11.0.0 | Logging |
| @langchain/core | ^1.2.10 | Chatbot |
| @langchain/langgraph | ^1.4.14 | Grafo del chatbot |
| @langchain/google-genai | ^2.3.1 | Gemini |
| argon2 | ^0.41.1 | Hash contraseñas |
| jest | ^30.0.0 | Tests |

**Queries Context7 sugeridas:** NestJS 11 breaking changes, Swagger decorators, class-validator, LangGraph patterns, LangChain deprecations.

## `packages/database` (@turnos/database)

| Librería | Versión | Uso típico en el repo |
| :------- | :------ | :-------------------- |
| prisma / @prisma/client | ^6.9.0 | ORM, migraciones, tipos |
| argon2 | ^0.41.1 | Seed de usuarios |

**Queries Context7 sugeridas:** Prisma 6 migrations, schema changes, client API deprecations.

## `packages/shared-types` (@turnos/shared-types)

Contratos TypeScript compartidos web ↔ api. Sin runtime de terceros propio; alinear con DTOs de Nest y consumo en web.

## Mapeo librería → Context7 (resolve-library-id)

Usar el nombre del paquete npm al resolver. Ejemplos probados:

| Paquete en repo | Búsqueda Context7 |
| :-------------- | :---------------- |
| next | `next.js` |
| react | `react` |
| tailwindcss | `tailwindcss` |
| zod | `zod` |
| react-hook-form | `react-hook-form` |
| @tanstack/react-query | `tanstack query` |
| @nestjs/common | `nestjs` |
| prisma | `prisma` |
| @langchain/langgraph | `langgraph` |
| vitest | `vitest` |

Si `resolve-library-id` devuelve varias opciones, preferir la que coincida con la **major** pinneada en el `package.json` correspondiente.
