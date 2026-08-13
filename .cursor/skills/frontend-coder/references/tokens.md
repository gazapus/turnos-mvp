# Catálogo de design tokens

Fuente: [`apps/web/app/tokens.css`](../../../apps/web/app/tokens.css)

Actualizar este archivo cuando se agreguen tokens en `tokens.css`.

**Tema:** light únicamente (no hay dark mode ni `@media (prefers-color-scheme: dark)`).

## Colores semánticos

| Token CSS (`:root`) | Utilidad Tailwind | Uso |
| :------------------ | :---------------- | :-- |
| `--surface` | `bg-background` | Fondo principal de la app |
| `--surface-elevated` | `bg-surface-elevated` | Superficie elevada (formularios, paneles claros) |
| `--on-elevated` | `text-on-elevated` | Texto sobre superficies elevadas (títulos/labels form) |
| `--foreground` | `text-foreground` | Texto principal |
| `--muted` | `bg-muted` | Superficies secundarias |
| `--muted-foreground` | `text-muted-foreground` | Texto secundario, hints |
| `--border` | `border-border` | Bordes y divisores |
| `--brand` | `bg-brand`, `text-brand` | Fondo brand / marketing |
| `--brand-foreground` | `text-brand-foreground` | Texto sobre brand |
| `--brand-muted` | `text-brand-muted` | Texto secundario sobre brand |
| `--brand-subtle` | `text-brand-subtle`, `bg-brand-subtle` | Acentos suaves sobre brand |
| `--brand-panel-from/mid/to` | (CSS `.login-panel`) | Gradiente de panel brand |
| `--brand-overlay` | `bg-brand-overlay` | Overlay sobre slideshow |
| `--brand-shine` | (CSS shine) | Brillo animado |
| `--brand-border` / `--brand-border-strong` | `border-brand-border` | Bordes translúcidos del panel |
| `--shadow-brand-panel` | (CSS `.login-panel`) | Sombra del panel principal |
| `--shadow-elevated` | (CSS `.login-form-container`) | Sombra del contenedor de formulario |
| `--primary` | `bg-primary`, `text-primary` | Acción principal, CTAs |
| `--primary-hover` | `hover:bg-primary-hover` | Hover de botón primario |
| `--primary-foreground` | `text-primary-foreground` | Texto sobre primary |
| `--accent` | `text-accent`, `bg-accent` | Acento teal (subtítulos, iconos) |
| `--accent-foreground` | `text-accent-foreground` | Texto sobre accent |
| `--accent-soft` | `bg-accent-soft` | Fondo suave del logo/marca |
| `--link-accent` | `text-link-accent` | Enlaces de ayuda en formularios |
| `--input` | `bg-input` | Fondo de campos |
| `--input-foreground` | `text-input-foreground` | Texto en campos |
| `--ring` | `ring-ring` | Focus ring |
| `--danger` | `bg-danger`, `text-danger` | Errores, acciones destructivas |
| `--danger-foreground` | `text-danger-foreground` | Texto sobre danger |
| `--success` | `bg-success`, `text-success` | Confirmaciones, estados OK |
| `--success-foreground` | `text-success-foreground` | Texto sobre success |
| `--warning` | `bg-warning`, `text-warning` | Advertencias |
| `--warning-foreground` | `text-warning-foreground` | Texto sobre warning |

## Tipografía

| Token `@theme` | Utilidad | Origen |
| :------------- | :------- | :----- |
| `--font-sans` | `font-sans` | Inter (`layout.tsx`) |
| `--font-heading` | `font-heading` | Montserrat (`layout.tsx`) |
| `--font-mono` | `font-mono` | Geist Mono (`layout.tsx`) |

## Breakpoints (desktop-first)

| Token | Valor | Consumo recomendado |
| :---- | :---- | :------------------ |
| `--breakpoint-sm` | 640px | `max-sm:` |
| `--breakpoint-md` | 768px | `max-md:` |
| `--breakpoint-lg` | 1024px | `max-lg:` |

Estilos base sin prefijo = escritorio (≥1024px).

## Layout global

| Token | Valor | Uso |
| :---- | :---- | :-- |
| `--layout-min-width` | 320px | `min-width` en `body` (`globals.css`); scroll horizontal en viewports más estrechos |

## Radius

| Token | Utilidad |
| :---- | :------- |
| `--radius-sm` | `rounded-sm` |
| `--radius-md` | `rounded-md` |
| `--radius-lg` | `rounded-lg` |
| `--radius-xl` | `rounded-xl` |
| `--radius-2xl` | `rounded-2xl` |

## Spacing (escala corta)

| Token | Utilidad |
| :---- | :------- |
| `--space-1` / `--spacing-1` | `p-1`, `m-1`, `gap-1` |
| `--space-2` | `p-2`, `m-2`, `gap-2` |
| `--space-3` | `p-3`, `m-3`, `gap-3` |
| `--space-4` | `p-4`, `m-4`, `gap-4` |
| `--space-6` | `p-6`, `m-6`, `gap-6` |
| `--space-8` | `p-8`, `m-8`, `gap-8` |
