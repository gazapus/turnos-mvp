## Why

El FAB **AYUDA BOT** del shell autenticado es un stub (`console.log`) y no hay asistencia de uso dentro de la app. Recepción, médicos y admin no tienen dónde preguntar “cómo confirmo un turno” sin salir del sistema. FUNCIONAL §9.1 pide un asistente de documentación; este change cubre esa pieza y deja fuera las consultas a datos (§9.2 / MCP).

## What Changes

- Generar un **corpus markdown de ayuda de usuario** en `docs/ayuda/`, un archivo por pantalla/flujo ya existente (login, menú, agenda, confirmar, cancelar, consultorios) y un **glosario de conceptos** (primer turno, estados, especialidades y demás jerga). No documentar stubs (pacientes, usuarios, sala de espera, vistas Semana/Mes, perfil).
- Implementar el módulo Nest `apps/api/src/chatbot/` con LangChain.js + LangGraph: stuffing del corpus en el prompt, clasificación de dominio y generación. Sin tools, sin Prisma, sin llamadas a APIs de negocio.
- El chatbot **solo** responde preguntas de uso cubiertas por el corpus. Cualquier otro tema (datos operativos, clima, “cancelame el turno”) MUST recibir un rechazo fijo.
- Cualquier usuario **autenticado** (admin, recepcionista, médico) puede abrir el chat desde el FAB. Anónimos no.
- Reemplazar el stub de AYUDA BOT por un panel de chat que llama `POST /api/chatbot/mensajes` (nombre exacto en design).
- Proveedor LLM: **Gemini** (`GOOGLE_API_KEY` en `apps/api/.env`).

## Capabilities

### New Capabilities

- `chatbot`: asistente de documentación de la app (corpus markdown, grafo LangGraph restringido al dominio, contrato HTTP autenticado, panel de chat en el shell).

### Modified Capabilities

- `app-shell`: el botón AYUDA BOT deja de ser stub y abre el panel del chatbot.

## Impact

- `docs/ayuda/`: markdown de usuario derivado de specs vigentes (no `FUNCIONAL.md` crudo ni specs Gherkin).
- `apps/api`: módulo `chatbot`, dependencia LangChain/LangGraph + Gemini, env `GOOGLE_API_KEY`.
- `apps/web`: panel de chat desde el FAB; `HelpBotButton` deja el `console.log`.
- `packages/shared-types`: DTO de mensaje (pregunta + respuesta).
- Fuera de alcance: MCP, consultas a BD, tools hacia `/api/turnos` u otros recursos, RAG/vector store, sala de espera (CU9/CU10), pantalla pública, historial persistido en BD, LangSmith obligatorio.
