# Catálogo de design tokens

Fuente: [`apps/web/app/tokens.css`](../../../apps/web/app/tokens.css)

Actualizar este archivo cuando se agreguen tokens en `tokens.css`.

## Colores semánticos

| Token CSS (`:root`) | Utilidad Tailwind | Uso |
| :------------------ | :---------------- | :-- |
| `--surface` | `bg-background` | Fondo principal de la app |
| `--foreground` | `text-foreground` | Texto principal |
| `--muted` | `bg-muted` | Superficies secundarias |
| `--muted-foreground` | `text-muted-foreground` | Texto secundario, hints |
| `--border` | `border-border` | Bordes y divisores |
| `--primary` | `bg-primary`, `text-primary` | Acción principal, CTAs |
| `--primary-foreground` | `text-primary-foreground` | Texto sobre primary |
| `--danger` | `bg-danger`, `text-danger` | Errores, acciones destructivas |
| `--danger-foreground` | `text-danger-foreground` | Texto sobre danger |
| `--success` | `bg-success`, `text-success` | Confirmaciones, estados OK |
| `--success-foreground` | `text-success-foreground` | Texto sobre success |
| `--warning` | `bg-warning`, `text-warning` | Advertencias |
| `--warning-foreground` | `text-warning-foreground` | Texto sobre warning |

Dark mode: mismos nombres; valores sobreescritos en `@media (prefers-color-scheme: dark)`.

## Tipografía

| Token `@theme` | Utilidad | Origen |
| :------------- | :------- | :----- |
| `--font-sans` | `font-sans` | Geist Sans (`layout.tsx`) |
| `--font-mono` | `font-mono` | Geist Mono (`layout.tsx`) |

## Breakpoints (desktop-first)

| Token | Valor | Consumo recomendado |
| :---- | :---- | :------------------ |
| `--breakpoint-sm` | 640px | `max-sm:` |
| `--breakpoint-md` | 768px | `max-md:` |
| `--breakpoint-lg` | 1024px | `max-lg:` |

Estilos base sin prefijo = escritorio (≥1024px).

## Radius

| Token | Utilidad |
| :---- | :------- |
| `--radius-sm` | `rounded-sm` |
| `--radius-md` | `rounded-md` |
| `--radius-lg` | `rounded-lg` |

## Spacing (escala corta)

| Token | Utilidad |
| :---- | :------- |
| `--space-1` / `--spacing-1` | `p-1`, `m-1`, `gap-1` |
| `--space-2` | `p-2`, `m-2`, `gap-2` |
| `--space-3` | `p-3`, `m-3`, `gap-3` |
| `--space-4` | `p-4`, `m-4`, `gap-4` |
| `--space-6` | `p-6`, `m-6`, `gap-6` |
| `--space-8` | `p-8`, `m-8`, `gap-8` |
