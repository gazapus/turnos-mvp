---
name: frontend-coder
description: >-
  Lineamientos de desarrollo frontend para turnos-mvp (Next.js, Tailwind v4,
  design tokens, RHF+Zod). Use when implementing UI, pages, React components,
  styles, forms in apps/web, or when the user asks for frontend work or
  /frontend-coder.
---

# Frontend Coder (turnos-mvp)

Skill de proyecto para implementar UI en `apps/web`.

## Cuándo aplicar

- Toda tarea en `apps/web`.
- Páginas Next.js (App Router), componentes React, estilos Tailwind, formularios, layouts.
- El usuario pide trabajo frontend, diseño de pantallas o `/frontend-coder`.

## Fuentes de verdad

| Archivo | Rol |
| :------ | :-- |
| [`AGENTS.md`](../../AGENTS.md) | Convenciones técnicas del monorepo (§4 web, design tokens) |
| [`apps/web/app/tokens.css`](../../apps/web/app/tokens.css) | Tokens visuales — colores, tipografía, breakpoints, radius, spacing |
| [`docs/FUNCIONAL.md`](../../docs/FUNCIONAL.md) | Requisitos de negocio, roles, casos de uso |
| [`.cursor/skills/frontend-coder/references/tokens.md`](references/tokens.md) | Catálogo semántico de tokens |
| Skill `react-doctor` | Auditoría al cerrar cambios de UI |

OpenSpec **no es requerido** para estilos ni tokens; basta con AGENTS.md y esta skill.

## Workflow por tarea frontend

1. **Leer contexto** — `docs/FUNCIONAL.md` para el caso de uso; tokens actuales en `tokens.css`.
2. **Server Component por defecto** — páginas y layouts sin `"use client"` salvo necesidad real.
3. **Leaf client** — `"use client"` solo en el componente interactivo más pequeño (formularios, filtros, botones con estado).
4. **Estilos** — solo utilidades del tema; ver sección Estilos abajo.
5. **Formularios** — React Hook Form + Zod; schemas en `apps/web/lib/schemas/` cuando aplique.
6. **JSDoc** — obligatorio en componentes y funciones exportadas.
7. **Tests** — `*.test.tsx` junto al componente (Vitest + RTL); uno por componente nuevo.
8. **Desktop-first** — estilos base para ≥1024px; adaptar con `max-lg:`, `max-md:`, `max-sm:`.
9. **Cierre** — correr `pnpm --filter @turnos/web test` y skill `react-doctor` si hubo cambios de UI.

## Estilos (tokens CSS + `@theme`)

### Reglas

- Fuente única: [`apps/web/app/tokens.css`](../../apps/web/app/tokens.css).
- **Prohibido:** hex, `rgb()`/`hsl()` literales, colores Tailwind fuera del tema (`bg-blue-500`, `bg-[#…]`).
- **Usar:** utilidades semánticas (`bg-primary`, `text-muted-foreground`, `border-border`, `rounded-md`).
- **No** CSS-in-JS paralelo (Panda, styled-components, etc.); el stack es Tailwind v4 + tokens CSS.
- **No** tokens por pantalla (`--agenda-header-blue`); solo nombres semánticos reutilizables.

### Agregar un token nuevo

1. Definir valor en `:root` (y override en `@media (prefers-color-scheme: dark)` si aplica).
2. Mapear en bloque `@theme` con prefijo Tailwind (`--color-*`, `--radius-*`, etc.).
3. Consumir vía utilidad en componentes; actualizar [references/tokens.md](references/tokens.md).

```css
/* apps/web/app/tokens.css */
:root {
  --accent: #0369a1;
}
@theme {
  --color-accent: var(--accent);
}
```

```tsx
// Componente
<span className="text-accent">Destacado</span>
```

### Ejemplos

```tsx
// ❌ Prohibido
<div className="bg-[#0f766e] text-white border-[#e2e8f0]" />
<p className="text-slate-500" />

// ✅ Correcto
<div className="bg-primary text-primary-foreground border-border" />
<p className="text-muted-foreground" />
```

Catálogo completo: [references/tokens.md](references/tokens.md).

## Interactividad y cursor

Elementos clickeables deben indicar que son accionables con `cursor-pointer`:

- Botones (`<button>`), enlaces (`<a>`), ítems de menú y controles tipo toggle.
- En estado deshabilitado usar `disabled:cursor-not-allowed` (o `cursor-not-allowed` si no es un `<button>` nativo).

```tsx
// ✅ Botón primario
<button
  type="submit"
  className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
>
  Guardar
</button>

// ❌ Botón sin feedback de cursor
<button type="submit" className="bg-primary text-primary-foreground">
  Guardar
</button>
```

No aplicar `cursor-pointer` en elementos solo decorativos o de solo lectura.

## Estructura de archivos

```text
apps/web/
├── app/
│   ├── (auth)/login/
│   ├── (admin)/usuarios/
│   ├── (recepcion)/agenda/
│   ├── (medico)/mi-agenda/
│   ├── (publico)/sala-espera/
│   ├── globals.css      # importa tailwind + tokens.css
│   └── tokens.css       # design tokens
├── components/          # kebab-case.tsx, PascalCase export
└── lib/schemas/         # Zod schemas
```

- Archivos: **kebab-case** (`agenda-filters.tsx`).
- Componentes: **PascalCase** (`AgendaFilters`).
- Imports absolutos: `@/*` en `apps/web`.

## Qué no hacer

- No inventar colores o breakpoints en componentes; extender `tokens.css`.
- No poner `"use client"` en páginas enteras ni layouts.
- No tocar `apps/api` salvo contrato explícito (DTOs en `shared-types`).
- Primitives genéricos de UI (`Button`, `Input`) van en `apps/web/components/` cuando se necesiten.
- No usar OpenSpec para cambios puramente de estilos/tokens.
