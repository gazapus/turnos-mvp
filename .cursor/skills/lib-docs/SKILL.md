---
name: lib-docs
description: >-
  Consulta documentación actualizada de las librerías del stack turnos-mvp vía
  MCP Context7 para detectar deprecaciones, APIs recomendadas y oportunidades de
  mejora. Use when the user types /lib-docs, asks about deprecations or library
  upgrades, implements code with third-party APIs, or before closing a feature
  that introduced new library usage.
---

# Lib Docs (Context7)

Skill de proyecto para auditar el uso de librerías de terceros contra documentación **actual**, usando el MCP **Context7** de Cursor. Aplica al **proceso de desarrollo**; no modifica el runtime de `apps/web` ni `apps/api`.

## Cuándo aplicar

- El usuario escribe `/lib-docs`, pide deprecaciones, upgrades o “docs actuales de X”.
- Se implementa o se toca código que usa APIs de Next.js, NestJS, Prisma, Tailwind, Zod, RHF, TanStack Query, FullCalendar, LangChain, etc.
- Cierre de feature de UI: después de `frontend-coder`, antes o junto a `react-doctor`, si hubo APIs nuevas de librería.
- Cierre de feature de API: después de implementar módulos Nest o cambios Prisma con APIs no triviales.

## Prerrequisito

El MCP **Context7** (`plugin-context7-plugin-context7`) debe estar habilitado en Cursor. Si falla autenticación o el namespace no está disponible, **detener** e informar al usuario. No sustituir con conocimiento del modelo como si fuera documentación oficial.

## Fuentes de verdad

| Archivo | Rol |
| :------ | :-- |
| [references/stack.md](references/stack.md) | Catálogo de libs y versiones del monorepo |
| [`apps/web/package.json`](../../apps/web/package.json) | Dependencias frontend |
| [`apps/api/package.json`](../../apps/api/package.json) | Dependencias backend |
| [`packages/database/package.json`](../../packages/database/package.json) | Prisma y DB |

## Alcance

| Modo | Cuándo | Qué revisar |
| :--- | :----- | :---------- |
| **focused** (default) | Cambios recientes o `/lib-docs` sin argumentos | Solo libs usadas en archivos tocados o mencionados |
| **full** | `/lib-docs full` o pedido explícito de auditoría completa | Todo el catálogo en `references/stack.md` |

## Workflow

1. **Determinar alcance** — focused vs full (ver tabla anterior).
2. **Leer versiones reales** — de los `package.json`; no inventar números de versión.
3. **Identificar APIs en uso** — grep/lectura de imports y llamadas en el código afectado.
4. **Consultar Context7** — por cada librería relevante:
   - `resolve-library-id` con el nombre del paquete (ver mapeo en `references/stack.md`).
   - `query-docs` con preguntas concretas: deprecations, breaking changes, reemplazo recomendado, best practices para la API usada en el repo. Incluir la versión major/minor pinneada cuando aplique.
5. **Contrastar** — comparar hallazgos de Context7 con el uso real en el repo.
6. **Informe** — formato abajo. **No refactorizar** salvo que el usuario lo pida explícitamente.

## Formato del informe

```markdown
## Lib docs — [focused|full] — [fecha]

### Resumen
- Librerías revisadas: N
- Hallazgos accionables: N (alta / media / baja)

### Hallazgos

#### [Nombre librería @ versión]
- **Estado:** deprecated | superseded | ok-with-note
- **Uso en repo:** `ruta/archivo.ts` — breve descripción
- **Docs Context7:** qué dice la doc oficial
- **Recomendación:** acción concreta o “sin cambio”
- **Riesgo:** alta | media | baja

### Sin hallazgos
- [libs revisadas sin issues]

### Bloqueos
- [si Context7 no disponible o lib no encontrada]
```

Priorizar hallazgos por **riesgo** (seguridad, breaking en próxima minor, deprecación con fecha) y por **proximidad al código tocado**.

## Queries útiles para Context7

Plantillas (adaptar con la API concreta del código):

- `"deprecations and removed APIs in [lib] version [major]"`
- `"migration guide from [old API] to [new API] in [lib]"`
- `"recommended pattern for [use case] in [lib] [version]"`

## Qué no hacer

- No agregar Context7, MCP ni tools de docs al código de la app ni al chatbot del producto.
- No ejecutar upgrades de dependencias sin pedido explícito del usuario.
- No rellenar gaps de Context7 con suposiciones del modelo.

## Integración con otras skills

| Skill | Relación |
| :---- | :------- |
| `frontend-coder` | Tras UI con APIs nuevas, correr `lib-docs` focused antes de `react-doctor` |
| `react-doctor` | Complementario: react-doctor = calidad React; lib-docs = docs oficiales de libs |
| OpenSpec apply | Opcional al cerrar un change que tocó dependencias de terceros |
