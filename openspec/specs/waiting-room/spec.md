## Purpose

Pantalla de sala de espera (CU 10): tablero de avisos en `/sala-espera` para Administrador y Recepcionista, snapshot `GET /api/sala-espera`, stream SSE, sonido de aviso y pantalla completa que oculta el shell.

## Requirements

### Requirement: Tablero de últimos llamados

El sistema SHALL reemplazar el stub de `/sala-espera` por el tablero de aviso de la clínica. MUST mostrar encabezado con logo de Hospital Clínica Salud, fecha civil y reloj en `America/Argentina/Buenos_Aires`, y el tagline de la clínica; columnas `CONSULTORIO` y `PACIENTE`; y pie con la indicación de dirigirse al consultorio. MUST listar como máximo los 5 llamados más recientes, el más nuevo primero y destacado. Cada fila MUST mostrar el número de consultorio (no el string `CONSULTORIO {n}` en la celda) y el nombre y apellido del paciente en mayúsculas. Si el nombre no cabe, MUST recortarse con puntos suspensivos por CSS. MUST NOT mostrar filas vacías ni placeholders: si no hay llamados, el tablero queda con header y footer y ninguna fila. MUST ser una composición para monitor grande, sin adaptación responsive a viewports chicos.

#### Scenario: Vacío sin llamados

- **WHEN** un Recepcionista abre `/sala-espera` y no hay llamados persistidos
- **THEN** ve header y footer del tablero y no ve filas de consultorio/paciente

#### Scenario: Un llamado se destaca

- **WHEN** existe un único llamado
- **THEN** esa fila se muestra destacada como la vigente y no hay filas inferiores

#### Scenario: Más de cinco se recorta

- **WHEN** existen más de 5 llamados
- **THEN** el tablero muestra solo los 5 más recientes, el último arriba

#### Scenario: Llamado nuevo pisa el destacado

- **WHEN** llega un llamado nuevo mientras el tablero ya tenía filas
- **THEN** ese llamado pasa a la fila destacada y los anteriores bajan una posición, descartando el sexto

#### Scenario: Nombre largo con ellipsis

- **WHEN** el nombre y apellido del paciente no caben en la celda
- **THEN** el texto visible termina en puntos suspensivos y no se parte el layout

### Requirement: Acceso de recepción y administración

El sistema SHALL permitir consultar el snapshot y el stream de sala de espera a usuarios con rol Administrador o Recepcionista. Un usuario con rol Médico MUST NOT consultar snapshot ni stream. La ruta `/sala-espera` MUST permanecer en el menú de Administrador y Recepcionista.

#### Scenario: Recepcionista abre el monitor

- **WHEN** un Recepcionista autentica y abre Sala de espera
- **THEN** el sistema muestra el tablero

#### Scenario: Médico no accede a la API de sala de espera

- **WHEN** un usuario con rol Médico solicita el snapshot o el stream
- **THEN** el sistema responde que no está autorizado y no envía llamados

### Requirement: Contrato GET /api/sala-espera

El sistema SHALL exponer `GET /api/sala-espera` autenticado, restringido a Administrador y Recepcionista. En éxito MUST responder 200 con hasta 5 ítems ordenados por `llamadoEn` descendente, cada uno con `id`, `consultorioNumero`, `pacienteNombre`, `pacienteApellido` y `llamadoEn`. Los nombres MUST ser los persistidos en el snapshot del llamado (no el paciente vivo). Médico MUST recibir 403. No autenticado MUST recibir 401. MUST NOT paginar.

#### Scenario: Snapshot de los últimos cinco

- **WHEN** un Recepcionista envía `GET /api/sala-espera` con más de 5 llamados en BD
- **THEN** la respuesta es 200 y trae exactamente 5 ítems, el más reciente primero

#### Scenario: Snapshot vacío

- **WHEN** un Recepcionista envía `GET /api/sala-espera` sin llamados
- **THEN** la respuesta es 200 con `items` vacío

#### Scenario: Médico recibe 403 al listar avisos

- **WHEN** un usuario con rol Médico envía `GET /api/sala-espera`
- **THEN** el sistema responde 403

### Requirement: Stream SSE de llamados

El sistema SHALL exponer `GET /api/sala-espera/stream` (SSE) restringido a Administrador y Recepcionista. Cada llamado exitoso MUST enviarse a los clientes conectados como evento con el mismo shape de un ítem del snapshot. MUST NOT usar WebSocket en esta versión. El cliente de `/sala-espera` MUST abrir el stream después de cargar el snapshot y, ante un evento, MUST insertar el ítem al inicio, recortar a 5 y reproducir el sonido de aviso. Médico MUST recibir 403. No autenticado MUST recibir 401.

#### Scenario: Evento llega al tablero

- **WHEN** un Médico llama un turno y hay un Recepcionista con el stream abierto
- **THEN** el tablero muestra ese llamado como fila destacada sin recargar la página

#### Scenario: Reconexión usa el snapshot

- **WHEN** el Recepcionista recarga `/sala-espera` después de llamados previos
- **THEN** el tablero se hidrata con `GET /api/sala-espera` y no queda en blanco hasta el próximo llamado

### Requirement: Sonido de aviso

Cada vez que el tablero recibe un llamado nuevo el sistema SHALL reproducir un sonido corto tipo alarma. MUST NOT sonar al hidratar el snapshot inicial. El botón de pantalla completa MUST contar como gesto del usuario para habilitar audio en el navegador.

#### Scenario: Llamado nuevo suena

- **WHEN** el stream entrega un llamado y el usuario ya activó pantalla completa (o un gesto equivalente en la página)
- **THEN** se reproduce el sonido de aviso una vez

#### Scenario: Carga inicial sin sonido

- **WHEN** el tablero carga tres llamados históricos desde el snapshot
- **THEN** no se reproduce el sonido por esos ítems

### Requirement: Pantalla completa oculta el shell

El sistema SHALL exponer en `/sala-espera` un control de pantalla completa. Al activarlo MUST poner el tablero en pantalla completa de modo que navbar y sidebar no se vean. MUST NOT abrir una ruta pública distinta. La composición a pantalla completa MUST seguir el wireframe del monitor (sin chrome de aplicación).

#### Scenario: Transmitir esconde navbar y sidebar

- **WHEN** el Recepcionista activa pantalla completa en Sala de espera
- **THEN** el viewport muestra el tablero a pantalla completa y no muestra navbar ni sidebar
