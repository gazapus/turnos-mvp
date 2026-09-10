## 1. Corpus de ayuda

- [x] 1.1 Crear `docs/ayuda/` con `inicio.md` (login, menú por rol, AYUDA BOT)
- [x] 1.2 Escribir `agenda.md` (filtros, Lista, Día, alta y detalle; sin Semana/Mes)
- [x] 1.3 Escribir `confirmar.md` y `cancelar.md` alineados a las specs vigentes
- [x] 1.4 Escribir `consultorios.md` (catálogo 1–20, asignación 1:1, quién puede)
- [x] 1.5 Revisar que ningún archivo documente pacientes, usuarios, sala de espera ni perfil
- [x] 1.6 Escribir `conceptos.md` (roles, tipos de turno, estados, especialidades, llamado) alineado a specs vigentes

## 2. Contratos y env

- [x] 2.1 Agregar en `packages/shared-types` request `{ mensaje }` y response `{ respuesta, dentroDeDominio }` y exportarlos
- [x] 2.2 Documentar `GOOGLE_API_KEY`, `GEMINI_MODEL` y `CHATBOT_DOCS_DIR` en `apps/api/.env.example`

## 3. Backend — grafo y módulo

- [x] 3.1 Agregar dependencias LangChain/LangGraph/Google GenAI en `@turnos/api`
- [x] 3.2 Implementar carga del corpus (`docs/ayuda` o `CHATBOT_DOCS_DIR`) y constante de rechazo
- [x] 3.3 Implementar StateGraph classify → generate | refuse con Gemini (`gemini-flash-latest` por default) y MemorySaver por `userId`
- [x] 3.4 Crear módulo Nest `chatbot`: `POST /api/chatbot/mensajes`, JWT todos los roles, validación de mensaje vacío/largo, DTO Swagger, barrel, registro en `AppModule`
- [x] 3.5 Tests: 401 anónimo, 400 vacío, 200 in-domain y off-domain (LLM mockeado), médico y recepcionista aceptados, grafo sin tools/Prisma

## 4. Frontend

- [x] 4.1 Cliente HTTP `chatbot-client` (POST mensajes, cookies, `ApiError`)
- [x] 4.2 Reemplazar el stub de `HelpBotButton`: toggle del panel de chat (abrir/cerrar), sin `console.log` de producto
- [x] 4.3 Panel leaf: hilo, input, enviar, estado de espera; error con `showError`; sin toast de éxito
- [x] 4.4 Tests: click abre/cierra panel; envío muestra pregunta y respuesta; error HTTP muestra dialog; login sigue sin FAB

## 5. Cierre

- [x] 5.1 Lint y tests de `web` y `api` en verde para los archivos tocados
