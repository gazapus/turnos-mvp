# Definición de Arquitectura — Sistema de Gestión de Turnos MVP

**Fecha:** Agosto 2026  
**Estado:** Decisión tomada  
**Alcance:** Organización del código y estructura del repositorio  
**Stack base (fuera de esta decisión):** Next.js + NestJS + PostgreSQL/Prisma + LangChain.js + MCP

---

## 1. Decisión

Se adopta una arquitectura **monorepo** con **pnpm workspaces** + **Turborepo** (o Nx equivalente), donde conviven en un único repositorio las aplicaciones desplegables y los paquetes compartidos del sistema.

Esta decisión cubre únicamente la organización del código. El stack tecnológico y el alcance funcional single-tenant ya están definidos en `docs/Propuesta_MVP.md` y `docs/requisitos-funcionales-sistema-turnos.md`.

---

## 2. Ventajas del monorepo

| Ventaja                     | Detalle en este proyecto                                                                                                                     |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| Tipado end-to-end           | Prisma genera tipos desde un schema único; NestJS y Next.js los consumen sin duplicar DTOs ni sincronizar contratos a mano.                  |
| Cambios atómicos            | Un ajuste al modelo de Turno (schema + API + UI) se resuelve en un solo commit/PR, evitando drift entre apps.                                |
| Contexto para agentes de IA | Schema, endpoints, DTOs y componentes viven en el mismo workspace; favorece el desarrollo Spec-Driven documentado en la propuesta.           |
| Tooling unificado           | ESLint, TypeScript, Prisma y CI se configuran una sola vez y se reutilizan por paquete.                                                      |
| Contratos en tiempo real    | El flujo CU9/CU10 (llamado de turno → WebSocket → pantalla de sala de espera) evoluciona junto en front y back.                              |
| MCP alineado al schema      | El servidor MCP de PostgreSQL (solo lectura) comparte el mismo modelo/tipos que la API, reduciendo inconsistencias en consultas del chatbot. |

---

## 3. Desventajas del monorepo

| Desventaja                                                | Mitigación                                                                             |
| :-------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| Setup inicial más complejo (workspaces + Turborepo/Nx)    | Invertir una sola vez al iniciar el repo; documentar scripts de arranque en el README. |
| Historial de git mezcla front/back/db                     | Usar convenciones de commit por scope (`web:`, `api:`, `db:`, etc.).                   |
| Riesgo de acoplamiento indebido entre apps                | Restringir imports: las apps solo consumen `packages/*`, nunca internos de otra app.   |
| CI puede reconstruir todo el repo si está mal configurado | Usar builds "affected" de Turborepo para compilar solo lo impactado por cada cambio.   |

---

## 4. Organización de carpetas propuesta

```text
turnos-mvp/
├── apps/
│   ├── web/                      # Next.js (App Router) — Frontend
│   │   ├── app/
│   │   │   ├── (auth)/login/
│   │   │   ├── (admin)/usuarios/
│   │   │   ├── (recepcion)/agenda/
│   │   │   ├── (medico)/mi-agenda/
│   │   │   └── (publico)/sala-espera/
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
│   └── mcp-postgres/             # servidor MCP solo-lectura (chatbot)
│       ├── src/
│       └── policies/             # reglas de alcance por rol
│
├── packages/
│   ├── database/                 # Prisma: fuente única de tipos y migraciones
│   │   └── prisma/schema.prisma
│   ├── shared-types/             # DTOs / contratos web ↔ api
│   ├── ui/                       # design system compartido (si aplica)
│   └── config/                   # eslint / tsconfig / bases compartidas
│
├── docs/
│   ├── Propuesta_MVP.md
│   ├── requisitos-funcionales-sistema-turnos.md
│   └── decisiones/
│       └── definicion_arquitectura.md
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Roles de cada capa

- **`apps/`** — unidades desplegables (web, API, MCP).
- **`packages/database`** — única fuente de verdad del modelo de datos (Prisma).
- **`packages/shared-types`** — contratos tipados entre frontend y backend.
- **`docs/`** — especificación funcional y decisiones de arquitectura.

---

## 5. Razones de la elección

Se eligió monorepo por las siguientes razones, alineadas al contexto real del MVP:

1. **Equipo de 1 persona**  
   Mantener 3–4 repositorios (web, api, mcp), cada uno con su CI, lint y versionado, añade overhead innecesario para un único desarrollador con plazo académico. Un solo checkout y un solo pipeline reducen fricción operativa.

2. **Compartir tipos para acelerar el desarrollo**  
   La propuesta exige tipado estático end-to-end con Prisma. En monorepo, el schema genera tipos consumibles de inmediato por NestJS y Next.js. Eso evita duplicar DTOs, regenerar clientes OpenAPI a mano o publicar paquetes intermedios solo para sincronizar contratos.

3. **Spec-Driven Development (SDD) con mayor control**  
   Los 10 casos de uso del MVP operan como contrato inalterable para agentes de IA. Con todo el código en un mismo workspace, los agentes ven schema, endpoints, DTOs y UI juntos, lo que reduce alucinaciones y permite aplicar cambios consistentes de extremo a extremo bajo la especificación.

4. **Contratos de tiempo real y MCP sin drift**  
   El llamado de turno (CU9) y la pantalla de sala de espera (CU10) dependen de un contrato WebSocket compartido entre front y back. Además, el MCP de PostgreSQL (solo lectura, con alcance por rol) debe alinearse al mismo schema que la API. El monorepo mantiene ambos contratos en el mismo ciclo de cambio, sin PRs coordinados entre repos.

---

## 6. Alternativa descartada (resumen)

Se evaluó también un **polyrepo** (un repo por app: `turnos-web`, `turnos-api`, `turnos-mcp-postgres`). Ofrece independencia de despliegue y ownership claro por repo, pero implica sincronizar tipos entre repositorios, coordinar PRs multi-repo y fragmentar el contexto de los agentes de IA. Esa independencia no aporta valor suficiente en un MVP single-tenant desarrollado por una sola persona.

Si el proyecto evoluciona post-MVP hacia multi-tenant o a un equipo con ownership separado por app, se podrá extraer `apps/api` o `apps/mcp-postgres` a un repositorio propio sin rediseñar el sistema completo.

---

## 7. Próximos pasos sugeridos

1. Inicializar el monorepo (`pnpm-workspace.yaml`, `turbo.json`, estructura `apps/` + `packages/`).
2. Definir el schema Prisma en `packages/database` a partir del modelado de datos.
3. Levantar `apps/api` (NestJS) y `apps/web` (Next.js) consumiendo los paquetes compartidos.
4. Incorporar `apps/mcp-postgres` cuando se implemente el chatbot con consultas de datos.
