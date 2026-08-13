---
name: commit-message
description: Genera mensajes de commit Conventional Commits válidos para turnos-mvp (scopes, husky, commitlint). Use when the user asks to commit, write a commit message, or create a git commit.
---

# Commit message (turnos-mvp)

Genera y aplica commits que pasen los hooks de Husky y `commitlint` de este monorepo.

## Fuentes de verdad

| Archivo | Rol |
| :------ | :-- |
| `commitlint.config.js` | Reglas: `@commitlint/config-conventional` + scopes permitidos |
| `.husky/pre-commit` | `pnpm exec lint-staged` |
| `.husky/commit-msg` | `pnpm exec commitlint --edit $1` |
| `AGENTS.md` → Conventional Commits | Scopes y ejemplos del proyecto |

No inventar scopes ni saltar hooks (`--no-verify`) salvo pedido explícito del usuario.

## Formato

```text
<tipo>(<scope>): <descripción>
```

- **tipo** (obligatorio): uno de `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- **scope** (opcional; si se usa, solo estos):

| Scope | Uso |
| :---- | :-- |
| `web` | `apps/web` |
| `api` | `apps/api` |
| `db` | `packages/database` |
| `shared` | `packages/shared-types` |
| `config` | `packages/config` |

- Sin scope solo para cambios transversales o docs (p. ej. `docs: actualizar FUNCIONAL.md`).
- **descripción**: imperativo, minúscula, sin punto final, en español (como en AGENTS.md).
- Header ≤ 72 caracteres preferible; cuerpo opcional separado por línea en blanco si el *why* no cabe en el subject.

### Ejemplos válidos

```text
feat(web): pantalla de login
fix(api): validación de turno duplicado
chore(db): migración de índices
docs: actualizar convenciones de commits
refactor(config): unificar preset de eslint
```

### Inválidos (fallan commitlint)

```text
feat(frontend): ...          # scope no permitido
Feat(web): ...               # tipo en mayúscula
feat(web): Pantalla de login. # mayúscula / punto final (estilo del repo)
```

## Workflow al crear un commit

Solo cuando el usuario pida explícitamente crear el commit:

1. En paralelo: `git status`, `git diff` (staged + unstaged), `git log -10 --format='%s'` (si hay historial).
2. Elegir **un** tipo y **un** scope según los paths tocados (si hay varios paquetes, preferir el scope dominante o sin scope si es transversal).
3. Redactar el mensaje (énfasis en el *why*).
4. Stage solo archivos relevantes (nunca `.env` / secretos).
5. Commit con mensaje vía HEREDOC. En PowerShell:

```powershell
git commit -m @"
tipo(scope): descripción

"@
```

En bash:

```bash
git commit -m "$(cat <<'EOF'
tipo(scope): descripción

EOF
)"
```

6. `git status` para verificar. Si el hook falla:
   - **pre-commit / lint-staged**: corregir lint/format, stage de nuevo, **nuevo** commit (no `--amend` salvo reglas de amend del usuario).
   - **commit-msg / commitlint**: corregir el mensaje y crear un **nuevo** commit.

## Hooks que debe respetar

- **pre-commit**: ESLint `--fix` + Prettier en `*.{ts,tsx}`; Prettier en `*.{json,md}`.
- **commit-msg**: valida tipo, formato y `scope-enum` (`web` | `api` | `db` | `shared` | `config`).

## Qué no hacer

- No usar scopes fuera del enum de `commitlint.config.js`.
- No pushear ni hacer `--amend` / `--force` salvo pedido explícito y reglas de seguridad del usuario.
- No incluir archivos con secretos.
- No generar commits vacíos.
