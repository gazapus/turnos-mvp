# Definición de Spec-Driven Development con OpenSpec — Sistema de Gestión de Turnos MVP

**Fecha:** Agosto 2026  
**Estado:** Decisión tomada  
**Alcance:** Metodología de desarrollo y herramienta SDD  
**Prerrequisito:** `docs/adr/01_definicion_arquitectura.md` (monorepo)

---

## 1. Decisión

Se adopta **Spec-Driven Development (SDD)** como metodología de trabajo del MVP, utilizando **OpenSpec** como herramienta de orquestación de especificaciones, cambios (deltas) e implementación asistida por agentes de IA.

Los 10 casos de uso del MVP (`docs/Propuesta_MVP.md`) y los requisitos funcionales (`docs/requisitos-funcionales-sistema-turnos.md`) son la entrada de negocio; OpenSpec es el mecanismo operativo para convertirlos en specs versionadas, propuestas de cambio e implementación controlada.

Esta decisión no reemplaza el stack tecnológico ni la organización monorepo ya definidos; los complementa definiendo **cómo** se traduce la especificación en código.

---

## 2. Ventajas de OpenSpec

| Ventaja                     | Detalle en este proyecto                                                                                                                                |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Flujo liviano (menos pasos) | Ciclo Propose → Apply → Archive (con deltas), frente a pipelines más largos de otras herramientas SDD. Acelera la iteración del MVP.                    |
| Flexibilidad                | Artefactos opcionales (p. ej. `design.md` se puede omitir cuando no aporta); no impone una constitución rígida ni fases obligatorias en orden estricto. |
| Fuente de verdad unificada  | `openspec/specs/` consolida el estado actual del sistema por dominio; cada cambio es un delta explícito (ADDED / MODIFIED / REMOVED).                   |
| Velocidad con agentes de IA | Menos fricción entre “especificar” e “implementar”; el agente trabaja contra un contrato claro y un checklist de tareas derivado del delta.             |
| Ajuste a monorepo + SDD     | Una sola carpeta `openspec/` en la raíz del repo sirve a `apps/web` y `apps/api` sin fragmentar la especificación por aplicación.                       |
| Evolución incremental       | Ideal para incorporar los CU del MVP de a uno (auth, turnos, sala de espera, chatbot) sin reescribir specs completas en cada ciclo.                     |

---

## 3. Desventajas de OpenSpec

| Desventaja                                                 | Mitigación                                                                                                                                                                               |
| :--------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Menor ritual / rigor formal que SpecKit                    | Compensar con los CU de Cockburn y el ADR de arquitectura como guardrails; no saltar la etapa de proposal cuando el cambio toque contratos críticos (auth, estados de turno, WebSocket). |
| Estructura de carpetas opinada (`openspec/`)               | Aceptarla en la raíz del monorepo; documentarla en este ADR para que no compita con `docs/` ni con `packages/`.                                                                          |
| Dependencia del CLI / skills de OpenSpec                   | Fijar versión de herramienta en el README y scripts del monorepo; versionar specs y changes en git junto al código.                                                                      |
| Riesgo de diluir la spec si se archivan deltas incompletos | Archivar solo cuando el change esté implementado y verificado contra los escenarios de éxito / extensiones del CU correspondiente.                                                       |

---

## 4. Ubicación de OpenSpec en la organización de carpetas

OpenSpec vive en la **raíz del monorepo**, al mismo nivel que `apps/`, `packages/` y `docs/`. No se anida dentro de una app concreta: las specs son transversales al sistema.

```text
turnos-mvp/
├── apps/
│   ├── web/                      # Next.js (App Router) — Frontend
│   └── api/                      # NestJS — Backend
│
├── packages/
│   ├── database/                 # Prisma: fuente única de tipos y migraciones
│   ├── shared-types/             # DTOs / contratos web ↔ api
│   ├── ui/
│   └── config/
│
├── openspec/                     # Spec-Driven Development (OpenSpec)
│   ├── specs/                    # Fuente de verdad del sistema (estado actual)
│   │   ├── auth/
│   │   │   └── spec.md
│   │   ├── users/
│   │   │   └── spec.md
│   │   ├── appointments/         # turnos, estados, sobreturnos
│   │   │   └── spec.md
│   │   ├── waiting-room/         # CU9 / CU10 — llamado y pantalla de aviso
│   │   │   └── spec.md
│   │   └── chatbot/
│   │       └── spec.md
│   └── changes/                  # Propuestas en curso (deltas)
│       └── <nombre-del-cambio>/
│           ├── proposal.md
│           ├── design.md         # opcional
│           ├── tasks.md
│           └── specs/            # deltas respecto a openspec/specs/
│
├── docs/
│   ├── Propuesta_MVP.md          # entrada de negocio / CU
│   ├── requisitos-funcionales-sistema-turnos.md
│   └── adr/
│       ├── 01_definicion_arquitectura.md
│       └── 02_definicion_sdd_openspec.md
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Roles de `openspec/` respecto al resto

| Ubicación             | Rol                                                                                 |
| :-------------------- | :---------------------------------------------------------------------------------- |
| `docs/`               | Documentación de producto, requisitos y ADRs (decisiones). No es el runtime de SDD. |
| `openspec/specs/`     | Contrato operativo vigente del sistema (qué debe hacer el software hoy).            |
| `openspec/changes/`   | Trabajo en curso: propuesta, tareas y deltas antes de mergear a `specs/`.           |
| `apps/` + `packages/` | Implementación que materializa lo definido en OpenSpec.                             |

Los documentos de `docs/` alimentan el bootstrap inicial de `openspec/specs/` (p. ej. traducir CU1–CU10 a specs por dominio). A partir de ahí, los cambios del día a día pasan por `openspec/changes/`, no por reescribir solo los markdown de producto.

---

## 5. Razones de la elección

Se eligió SDD con OpenSpec por las siguientes razones:

1. **Mayor flexibilidad frente a alternativas del mercado (p. ej. SpecKit)**  
   SpecKit impone un pipeline más rígido (specify → plan → tasks → implement, con constitución de proyecto y specs fragmentadas por feature). OpenSpec permite omitir artefactos que no aportan, trabajar con deltas sobre una fuente de verdad única y ajustar el flujo al tamaño real de cada cambio del MVP.

2. **Menos pasos → mayor velocidad**  
   La velocidad es un factor crítico del MVP académico. El ciclo Propose / Apply / Archive reduce el overhead ceremonial: se propone el delta, se implementa y se archiva contra `openspec/specs/`, sin atravesar fases obligatorias que no aportan valor en cambios acotados (p. ej. un ajuste de estado de turno o de política de alcance del chatbot).

3. **Alineación con el monorepo y el trabajo asistido por agentes**  
   Una sola carpeta `openspec/` en la raíz da a los agentes un contrato transversal a web y API. Eso refuerza el SDD con mayor control ya argumentado en el ADR 01: el agente ve especificación y código en el mismo workspace. Context7 y la skill `lib-docs` (ADR 05) complementan OpenSpec con documentación actualizada de librerías; no forman parte de `openspec/`.

4. **Evolución incremental de los 10 CU**  
   Los casos de uso del MVP se pueden incorporar como changes sucesivos (auth, alta de usuarios, agenda, sala de espera, chatbot) sin redefinir el sistema completo en cada iteración. Al archivar, la fuente de verdad crece de forma ordenada y auditable.

---

## 6. Alternativa descartada (resumen)

Se evaluó **GitHub Spec Kit** como herramienta SDD alternativa. Es sólida para greenfield con fuerte ritual de fases y constitución de proyecto, pero su flujo más largo y su estructura fragmentada por feature encajan peor cuando el objetivo es iterar rápido sobre un MVP ya especificado en `docs/`, con un solo desarrollador y agentes de IA que necesitan un ciclo corto entre spec e implementación.

Otras opciones (SDD ad hoc solo con markdown en `docs/`, sin herramienta) se descartaron porque no ofrecen ciclo de change/delta, estado de artefactos ni integración clara con agentes.

---

## 7. Próximos pasos sugeridos

1. Inicializar OpenSpec en la raíz del monorepo (`openspec/specs/` + `openspec/changes/`).
2. Bootstrap de specs base a partir de los CU1–CU10 y del documento de requisitos (dominios: auth, users, appointments, waiting-room, chatbot).
3. Primer change operativo (p. ej. autenticación / CU1) siguiendo Propose → Apply → Archive.
4. Documentar en el README del monorepo los comandos OpenSpec usados en el día a día.
