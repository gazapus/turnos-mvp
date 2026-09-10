# Context7 en el proceso de desarrollo

**Fecha:** Agosto 2026  
**Estado:** Decisión tomada  
**Alcance:** Herramientas MCP en Cursor para consultar documentación de librerías durante el desarrollo

---

## 1. Decisión

1. Las **MCP en este proyecto** son herramientas del IDE (Cursor) para agentes y desarrolladores; **no** son unidades desplegables del monorepo.
2. Se adopta **Context7** (plugin MCP de Cursor) junto con la skill de proyecto **`lib-docs`** (`.cursor/skills/lib-docs/`, comando `/lib-docs`) para consultar documentación actualizada del stack y detectar deprecaciones mientras se implementa código.
3. Context7 **no se embebe** en `apps/web`, `apps/api` ni en el chatbot del producto.

---

## 2. Contexto

El monorepo usa muchas librerías con ciclos de release rápidos (Next.js, NestJS, Prisma, Tailwind, Zod, LangChain, etc.). El conocimiento del modelo de IA sobre APIs concretas envejece; usar APIs deprecadas genera deuda y bugs evitables.

OpenSpec y `AGENTS.md` definen **qué** debe hacer el sistema. Context7 complementa ese flujo respondiendo **cómo** usar hoy las librerías del stack, contrastado con el código real del repo.

---

## 3. Ventajas de Context7 + skill `lib-docs`

| Ventaja | Detalle |
| :------ | :------ |
| Docs actuales | Reduce uso de APIs deprecadas al implementar features. |
| Sin runtime extra | No hay proceso adicional en producción ni en `apps/`. |
| Alineado al monorepo | La skill conoce el catálogo en `references/stack.md` y los `package.json` reales. |
| Integrable al flujo | Enganchada en `AGENTS.md`, `frontend-coder` y comando `/lib-docs`. |

---

## 4. Herramientas MCP de desarrollo

| Herramienta | Rol |
| :---------- | :-- |
| **Context7** | Documentación actualizada de librerías del stack. |
| **Skill `lib-docs`** | Workflow del repo: consultar Context7, contrastar con el código, informar hallazgos. |
| **Browser** (Cursor) | Verificación manual de UI en `localhost`. |

Estas herramientas viven en Cursor (Settings → MCP / plugins). No requieren `.cursor/mcp.json` en el repositorio.

---

## 5. Relación con el resto del sistema

| Capa | Rol respecto a Context7 |
| :--- | :---------------------- |
| `openspec/` | Contrato funcional del producto; independiente de Context7. |
| `apps/web`, `apps/api` | Código que la skill audita contra docs oficiales. |
| Chatbot (`apps/api/src/chatbot/`) | Asistente de documentación de usuario (`docs/ayuda/`); no usa Context7 ni MCP en runtime. |

---

## 6. Próximos pasos

1. Habilitar Context7 en Cursor.
2. Ejecutar `/lib-docs` al cerrar features que introduzcan APIs nuevas de librerías.
3. Actualizar `references/stack.md` cuando cambien versiones pinneadas en `package.json`.
