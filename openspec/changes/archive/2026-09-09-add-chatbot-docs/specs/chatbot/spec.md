## ADDED Requirements

### Requirement: Corpus markdown de ayuda de usuario

El sistema SHALL mantener una base de conocimiento de uso de la aplicación en markdown bajo `docs/ayuda/`, con un archivo por flujo existente y un glosario de conceptos. El corpus MUST cubrir login y menú, agenda (filtros, Lista, Día, alta y detalle de turno), confirmación, cancelación, consultorios, y la terminología de la app (roles, paciente, turno, tipos incluyendo primer turno, estados, especialidades, llamado y consultorio). El corpus MUST NOT documentar pantallas o acciones que aún son stub (pacientes, usuarios, sala de espera, vistas Semana y Mes, perfil). El texto MUST estar redactado para el usuario de la clínica, no como spec técnica.

#### Scenario: Archivos por flujo

- **WHEN** un operador abre `docs/ayuda/`
- **THEN** existen al menos los archivos de inicio, agenda, confirmar, cancelar, consultorios y conceptos

#### Scenario: Stubs fuera del corpus

- **WHEN** se lee el corpus completo
- **THEN** no instruye cómo gestionar pacientes, usuarios, sala de espera ni vistas Semana o Mes

#### Scenario: Glosario de primer turno y estados

- **WHEN** un usuario autenticado pregunta qué es un primer turno, qué estados tiene un turno o qué es una especialidad
- **THEN** el sistema responde en lenguaje de usuario con la definición alineada al corpus (primera vez con ese médico, pastillas de estado, catálogo cruzado médico–especialidad)

### Requirement: Asistente restringido al dominio de la documentación

El sistema SHALL responder preguntas de uso de esta aplicación usando únicamente el corpus markdown. Un saludo breve (hola, buen día y equivalentes) MUST considerarse dentro de dominio y recibir una respuesta cordial que ofrezca ayuda de uso, sin consultar la base de datos. Preguntas ajenas al uso documentado (temas generales, datos operativos, pedidos de acción sobre turnos o pacientes) MUST recibir el mensaje de rechazo fijo de que solo puede ayudar con el uso de esta aplicación, sin inventar procedimientos ni consultar la base de datos. El grafo del asistente MUST NOT invocar tools, Prisma ni endpoints de negocio.

#### Scenario: Saludo breve

- **WHEN** un usuario autenticado envía un saludo breve (“hola”, “buenos días”)
- **THEN** el sistema responde con cordialidad, ofrece ayuda sobre el uso de la aplicación y no aplica el rechazo de dominio

#### Scenario: Pregunta cubierta por el corpus

- **WHEN** un usuario autenticado pregunta cómo confirmar un turno
- **THEN** el sistema responde en lenguaje de usuario con información alineada al corpus (confirmación el día civil, roles que pueden hacerlo)

#### Scenario: Pregunta fuera de dominio

- **WHEN** un usuario autenticado pregunta el clima, una receta o cuántos turnos tiene hoy
- **THEN** el sistema responde el rechazo fijo y no expone datos de turnos ni pacientes

#### Scenario: Pedido de acción

- **WHEN** un usuario autenticado pide que el chatbot cancele un turno o llame a un paciente
- **THEN** el sistema responde el rechazo fijo y no llama APIs de negocio

### Requirement: Acceso autenticado para todos los roles

El sistema SHALL aceptar mensajes del chatbot de cualquier usuario autenticado (Administrador, Recepcionista o Médico). Un visitante sin sesión MUST NOT obtener una respuesta del asistente.

#### Scenario: Médico pregunta

- **WHEN** un usuario con rol Médico envía un mensaje válido al chatbot
- **THEN** el sistema acepta el mensaje y devuelve una respuesta (de dominio o de rechazo)

#### Scenario: Recepcionista pregunta

- **WHEN** un usuario con rol Recepcionista envía un mensaje válido al chatbot
- **THEN** el sistema acepta el mensaje y devuelve una respuesta

#### Scenario: Anónimo rechazado

- **WHEN** un visitante sin sesión envía un mensaje al chatbot
- **THEN** el sistema no genera respuesta de asistente y responde que no está autorizado

### Requirement: Contrato de mensaje

El sistema SHALL exponer `POST /api/chatbot/mensajes` con cuerpo `{ mensaje }` y respuesta `{ respuesta, dentroDeDominio }`. Un `mensaje` vacío o que exceda el máximo MUST rechazarse con error de validación. `dentroDeDominio` MUST ser verdadero cuando la respuesta se basa en el corpus y falso cuando se aplica el rechazo de dominio.

#### Scenario: Mensaje válido in-domain

- **WHEN** un usuario autenticado envía “cómo asigno un consultorio”
- **THEN** el sistema responde 200 con `dentroDeDominio` verdadero y un `respuesta` no vacío

#### Scenario: Mensaje válido off-domain

- **WHEN** un usuario autenticado envía “¿qué hora es en Tokio?”
- **THEN** el sistema responde 200 con `dentroDeDominio` falso y el texto de rechazo fijo

#### Scenario: Mensaje vacío

- **WHEN** un usuario autenticado envía un `mensaje` vacío o solo espacios
- **THEN** el sistema no invoca al modelo y responde error de validación
