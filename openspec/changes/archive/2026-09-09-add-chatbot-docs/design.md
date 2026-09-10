## Context

El shell autenticado ya muestra el FAB AYUDA BOT (`HelpBotButton`) y solo hace `console.log`. No existe `apps/api/src/chatbot/` ni `apps/mcp-postgres`. FUNCIONAL §9.1 pide un asistente de documentación; §9.2 (MCP / datos) queda fuera.

ADR 01 sitúa LangChain.js en Nest y MCP “cuando el chatbot consulte datos”. Este change implementa solo stuffing de markdown + LangGraph.

Probe ya hecho: `GOOGLE_API_KEY` en `apps/web/.env.local` lista modelos y genera con `gemini-flash-latest`. `gemini-2.5-flash` responde 404 a cuentas nuevas. La key MUST vivir en `apps/api/.env` para no exponerla al browser.

Actores: cualquier rol autenticado. Corpus alineado a specs vigentes (`auth`, `app-shell`, `appointments-*`, `consultorios`). No documentar stubs.

## Goals / Non-Goals

**Goals:**

- Corpus de ayuda de usuario en `docs/ayuda/` (varios `.md`).
- Grafo LangGraph en Nest: clasificar dominio → generar con stuffing o rechazar.
- `POST /api/chatbot/mensajes` con JWT; todos los roles autenticados.
- Panel de chat abierto desde AYUDA BOT.
- Gemini vía `@langchain/google-genai`.

**Non-Goals:**

- MCP, Prisma, tools, llamadas a `/api/turnos` u otros recursos de negocio.
- RAG / vector store / embeddings.
- Sala de espera, pacientes, usuarios, Semana/Mes, perfil real.
- Persistencia de historial en BD.
- Streaming de tokens.
- Pantalla pública / usuarios anónimos.
- LangSmith obligatorio.

## Decisions

### 1. Corpus en `docs/ayuda/`, no specs crudas

Markdown para recepción/médico/admin. Un archivo por flujo:

| Archivo | Cubre |
| --- | --- |
| `inicio.md` | Login, menú por rol, AYUDA BOT |
| `agenda.md` | Filtros, Lista, Día, alta/detalle de turno |
| `confirmar.md` | Confirmar el día civil del turno |
| `cancelar.md` | Cancelar con motivo opcional |
| `consultorios.md` | Catálogo 1–20, asignación 1:1 |
| `conceptos.md` | Glosario: roles, paciente, turno, tipos (primer turno, control, urgente, sobreturno), estados, especialidades, llamado |

Fuente: `openspec/specs/` vigentes. Prohibido copiar Gherkin, JWT, DTOs o FUNCIONAL.md entero.

Al arrancar, el módulo lee todos los `.md` del directorio (orden de nombre) y concatena. Override: `CHATBOT_DOCS_DIR`. Default: raíz del monorepo `docs/ayuda` (desde `apps/api`, `../../docs/ayuda`). Tests usan un fixture.

Alternativa descartada: un solo `guia.md` (peor de mantener). Alternativa descartada: indexar `openspec/specs/` (lenguaje de contrato, no de usuario).

### 2. LangGraph mínimo, sin tools

```
START → classify → generate → END
                 ↘ refuse  → END
```

Estado: `{ mensaje, historial?, respuesta, dentroDeDominio }`.

- `classify`: el LLM (salida estructurada) decide si la pregunta es uso de **esta** app cubierto por el corpus.
- `generate`: system prompt = corpus + “respondé solo con esa base; si no alcanza, decí que no está documentado”.
- `refuse`: texto constante, sin llamar al generador de respuesta larga.

Ningún `ToolNode`. Ningún retriever. Checkpointer `MemorySaver` en proceso, `thread_id` = `userId` del JWT. Se pierde al reiniciar; suficiente para el MVP.

Paquetes: `@langchain/langgraph`, `@langchain/core`, `@langchain/google-genai`. Modelo default `gemini-flash-latest` (alias vigente en el probe); override `GEMINI_MODEL`.

Alternativa descartada: RAG in-memory (embeddings extra, más fallos). Alternativa descartada: agent con tools hacia la API (viola el recorte).

### 3. Contrato HTTP

Módulo `apps/api/src/chatbot/` (controller, service que invoca el grafo, DTOs Swagger, constantes, barrel). `JwtAuthGuard`. Sin filtro por rol.

| Método | Ruta | Body | 200 |
| --- | --- | --- | --- |
| `POST` | `/api/chatbot/mensajes` | `{ mensaje: string }` | `{ respuesta: string, dentroDeDominio: boolean }` |

- Anónimo: 401.
- `mensaje` vacío o solo espacios: 400.
- Máximo 2000 caracteres: 400 si se excede.
- Fallo del proveedor LLM: excepción Nest (5xx) y el filtro global; la UI usa `showError`.

El grafo **no** consulta turnos ni pacientes. `dentroDeDominio: false` + mensaje de rechazo cuando `classify` sale del dominio.

Mensaje de rechazo (constante, no magic string): *“Solo puedo ayudarte con el uso de esta aplicación.”*

Cliente web: mismo patrón que `consultorios-client` (`credentials: 'include'`, proxy Next → Nest).

### 4. Panel de chat en el shell

`HelpBotButton` abre/cierra un panel (drawer o card anclado al FAB), leaf client. Lista de turnos de conversación (usuario / asistente), input, enviar. No navega de ruta.

Estados: cerrado, abierto vacío, pendiente de respuesta, error (`showError` de `ui-feedback`). Éxito **sin** toast: la respuesta es el propio globo del asistente.

El FAB sigue visible con el panel abierto (toggle). No se muestra en login ni en una eventual TV pública.

### 5. Secretos

`GOOGLE_API_KEY` en `apps/api/.env` y `.env.example`. Quitar la dependencia de `apps/web/.env.local` para Gemini (esa key no debe ir al bundle). Si el operador ya la tiene en web, copiarla a api; no commitear el valor.

## Risks / Trade-offs

- [El classify deja pasar off-topic] → Prompt estricto + corpus como única fuente en `generate`; tests con fixtures de mensaje fuera de dominio (mock del LLM o nodo `refuse` si el structured output es `false`).
- [Gemini cambia de alias / 404 de modelo] → `GEMINI_MODEL` configurable; default el alias que ya respondió (`gemini-flash-latest`).
- [Stuffing se queda corto si el corpus crece] → N actual cabe en ventana de Flash. Si explota, un change futuro de RAG (Camino 2).
- [Historial solo en RAM] → Aceptable; no hay requisito de auditar chats.
- [Latencia 2–6 s] → Spinner en el panel; sin streaming en este change.

## Migration Plan

1. Agregar `docs/ayuda/*.md` y el módulo API + panel.
2. Copiar `GOOGLE_API_KEY` a `apps/api/.env`.
3. Rollback: revertir el change; el FAB puede volver a stub. No hay migración de BD.

## Open Questions

Ninguna que bloquee implementación. El corpus de sala de espera se agregará en un change posterior cuando CU9/CU10 existan.
