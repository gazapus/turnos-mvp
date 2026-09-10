---
name: /lib-docs
id: lib-docs
category: Workflow
description: Auditar librerías del stack con Context7 (deprecaciones y mejoras)
---

Auditar el uso de librerías de terceros en turnos-mvp contra documentación actualizada vía MCP Context7.

**Input**: Opcionalmente `full` para auditoría de todo el stack (ej. `/lib-docs full`). Sin argumentos: alcance **focused** (archivos tocados en la conversación o libs mencionadas).

**Steps**

1. **Cargar la skill** — Leer y seguir [`.cursor/skills/lib-docs/SKILL.md`](../skills/lib-docs/SKILL.md).

2. **Verificar Context7** — Confirmar que el namespace `plugin-context7-plugin-context7` está disponible. Si requiere auth, invocar `mcp_auth` y reintentar. Si sigue fallando, informar y detener.

3. **Determinar alcance**
   - `full` en el input → revisar catálogo completo en `references/stack.md`.
   - Caso contrario → focused: libs de archivos modificados, abiertos o mencionados por el usuario.

4. **Ejecutar workflow de la skill**
   - Leer versiones de `apps/web/package.json`, `apps/api/package.json`, `packages/database/package.json`.
   - Por librería: `resolve-library-id` → `query-docs` (deprecations, migraciones, APIs usadas).
   - Contrastar con uso real en el repo.

5. **Entregar informe** — Usar el formato definido en la skill. No refactorizar código salvo que el usuario lo pida en el mismo turno.

**Ejemplos**

- `/lib-docs` — focused sobre el trabajo actual.
- `/lib-docs full` — auditoría de todo el stack pinneado.
- `/lib-docs next zod` — focused en Next.js y Zod aunque no haya cambios recientes.
