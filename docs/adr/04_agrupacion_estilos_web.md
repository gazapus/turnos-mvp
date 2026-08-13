# Agrupación de estilos y design tokens en `apps/web` — Sistema de Gestión de Turnos MVP

**Fecha:** Agosto 2026  
**Estado:** Decisión tomada / Ejecutada  
**Alcance:** Organización de design tokens, estilos globales y futuros primitives de UI  
**Prerrequisitos:** [ADR 01 — Arquitectura](01_definicion_arquitectura.md) · [ADR 03 — Inicialización del monorepo](03_inicializacion_monorepo.md)

---

## 1. Decisión

Los **design tokens** y la **capa visual base** del frontend viven **dentro de `apps/web`**, no en un paquete workspace separado (`packages/ui` / `@turnos/ui`).

Estructura adoptada:

```text
apps/web/
├── app/
│   ├── globals.css      # importa tailwindcss + tokens.css
│   └── tokens.css       # design tokens (:root + @theme Tailwind v4)
├── components/          # componentes de dominio y, más adelante, primitives UI genéricos
└── lib/schemas/
```

- **Fuente única de tokens:** [`apps/web/app/tokens.css`](../apps/web/app/tokens.css), importada desde [`apps/web/app/globals.css`](../apps/web/app/globals.css).
- **Futuros primitives** del design system (`Button`, `Input`, `Dialog`, etc.) se implementarán en `apps/web/components/` (subcarpeta de UI genérica si el volumen lo justifica), **no** en un package `@turnos/ui`.
- El paquete `packages/ui` creado como reserva en el bootstrap (ADR 03) se **eliminó** tras colapsar su único artefacto (`tokens.css`) en la app web.

Esta decisión aplica mientras exista **una sola aplicación frontend** (`apps/web`) que consuma el design system.

---

## 2. Contexto

En el ADR 01 y en la inicialización del monorepo (ADR 03) se reservó `packages/ui` como _design system compartido (si aplica)_, con `.gitkeep` y la intención de alojar tokens CSS y, más adelante, componentes base.

Durante la implementación inicial:

- `@turnos/ui` exportaba únicamente `./tokens.css` (CSS + `@theme` de Tailwind v4).
- El **único consumidor** era `apps/web` vía `@import '@turnos/ui/tokens.css'` en `globals.css`.
- No había segunda app frontend, Storybook ni publicación del paquete como librería independiente.

Mantener un workspace package para un solo archivo CSS importado por una sola app añadía indirección sin beneficio operativo inmediato.

---

## 3. Ventajas de agrupar estilos en `apps/web`

| Ventaja                     | Detalle en este proyecto                                                                                                                         |
| :-------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| Menor fricción en el MVP    | Un checkout, un paquete frontend, sin resolver workspace links ni versionado interno del DS.                                                     |
| Simplicidad de toolchain    | No requiere build de librería React, `peerDependencies`, ni configuración extra de Turbopack/Next para consumir componentes desde `packages/ui`. |
| Coherencia con el alcance   | Single-tenant, una app Next.js con todos los módulos (auth, agenda, sala de espera) en el mismo App Router.                                      |
| Tokens accesibles al agente | AGENTS.md y la skill `frontend-coder` apuntan a un path local claro; menos saltos entre carpetas para cambios de estilo.                         |
| Commits unificados          | Cambios de tokens y pantallas comparten scope `web` en Conventional Commits.                                                                     |

---

## 4. Desventajas y mitigaciones

| Desventaja                                                               | Mitigación                                                                                                                          |
| :----------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| Sin reuso automático si aparece una segunda app frontend                 | Extraer tokens (y primitives) a un package solo cuando haya **2+ consumidores** reales (p. ej. app admin + kiosk dedicado).         |
| Riesgo de mezclar dominio y primitives en `components/`                  | Convención explícita en AGENTS.md: primitives genéricos separados de componentes de negocio (`agenda-filters`, `turno-card`, etc.). |
| ADRs 01/03 quedan parcialmente desactualizados en el árbol `packages/ui` | Los ADRs históricos no se reescriben; este ADR 04 supersede la parte de estilos.                                                    |
| Menos frontera “design system vs producto”                               | Compensar con reglas estrictas de tokens semánticos y prohibición de colores literales en JSX (AGENTS.md §4).                       |

---

## 5. Reglas operativas de estilos

Aplican a todo el frontend del MVP:

1. **Stack:** Tailwind CSS v4 + tokens CSS (`:root` + `@theme`). Sin CSS-in-JS paralelo.
2. **Tokens semánticos:** colores, radios, spacing y breakpoints con nombres reutilizables (`primary`, `muted-foreground`, `border`), no por pantalla (`--agenda-header-blue`).
3. **Prohibido en JSX/TSX:** hex, `rgb()`/`hsl()` literales y utilidades fuera del tema (`bg-blue-500`, `bg-[#0f766e]`).
4. **Desktop-first:** estilos base para ≥1024px; adaptar con `max-lg:`, `max-md:`, `max-sm:`.
5. **Agregar un token:** editar `tokens.css` (`:root` + override dark + mapeo `@theme`); actualizar catálogo en `.cursor/skills/frontend-coder/references/tokens.md`.
6. **Scope de commits:** cambios de tokens/estilos → `style(web):` o `chore(web):` según corresponda.

---

## 6. Alternativa descartada: mantener `packages/ui`

Se evaluó conservar `@turnos/ui` como paquete workspace para tokens y futuros primitives.

| Argumento a favor                   | Por qué no alcanza en el MVP                                                            |
| :---------------------------------- | :-------------------------------------------------------------------------------------- |
| Frontera clara DS / app             | Con un solo consumidor, la frontera es documental, no técnica.                          |
| Preparación para primitives         | Introduce `peerDependencies`, tests y build de librería antes de tener primitives.      |
| Consistencia con otros `packages/*` | `database` y `shared-types` tienen **múltiples consumidores** (api, web, mcp); `ui` no. |

Si el proyecto incorpora una segunda app frontend o un catálogo estable de primitives con documentación propia (Storybook), se puede **reintroducir** un package de UI en un change dedicado, extrayendo `tokens.css` y los primitives ya existentes en `apps/web`.

---

## 7. Relación con otros documentos

| Documento                                                                                | Rol tras esta decisión                                                    |
| :--------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| [`AGENTS.md`](../../AGENTS.md) §4                                                        | Convenciones normativas de tokens y estilos en `apps/web`                 |
| [`.cursor/skills/frontend-coder/SKILL.md`](../../.cursor/skills/frontend-coder/SKILL.md) | Workflow de implementación UI                                             |
| [`docs/adr/01_definicion_arquitectura.md`](01_definicion_arquitectura.md)                | Monorepo general; árbol con `packages/ui` es histórico                    |
| [`docs/adr/03_inicializacion_monorepo.md`](03_inicializacion_monorepo.md)                | Bootstrap con `packages/ui` reservado; superseded en estilos por este ADR |

---

## 8. Criterio de revisión futura

Reevaluar esta decisión cuando se cumpla **al menos una** de estas condiciones:

- Exista una **segunda aplicación frontend** desplegable que deba compartir tokens y/o primitives.
- El catálogo de primitives genéricos supere un umbral que dificulte mantenerlos mezclados con componentes de dominio en `apps/web/components/`.
- Se adopte **Storybook** (u otra herramienta) como documentación independiente del design system, desacoplada del ciclo de build de Next.js.

Hasta entonces, **`apps/web` es la única fuente de verdad visual** del sistema.
