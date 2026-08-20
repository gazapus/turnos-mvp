## MODIFIED Requirements

### Requirement: Contenido de la card de turno

Cada card de turno del modo Día SHALL mostrar: un ícono de médico junto al nombre y apellido del médico, un ícono de paciente junto al nombre y apellido del paciente, la pill de estado del turno y el ícono del tipo de turno. La pill MUST reutilizar el color y la forma ya definidos para el modo Lista. Cuando el ancho de la card es menor a 260px, el texto de la pill MUST reducirse a las primeras tres letras del label de estado (`PRO`, `CON`, `ATE`, `AUS`, `CAN`) y MUST mostrar un tooltip con el label completo. Cuando el ancho de la card es mayor o igual a 260px, la pill MUST mostrar el label completo. El color de la pill MUST no cambiar entre ambos modos. El ícono de tipo MUST conservar el mismo tooltip que el modo Lista.

#### Scenario: Datos visibles en la card

- **WHEN** el sistema renderiza la card de un turno en el modo Día
- **THEN** la card muestra el ícono y el nombre completo del médico, el ícono y el nombre completo del paciente, la pill del estado del turno y el ícono del tipo de turno

#### Scenario: Tooltip del ícono de tipo reutilizado

- **WHEN** el usuario posiciona el cursor sobre el ícono de tipo de una card del modo Día
- **THEN** el sistema muestra el mismo texto de tooltip que usa el modo Lista para ese tipo de turno

#### Scenario: Pill completa en card ancha

- **WHEN** el ancho de una card de turno en el modo Día es mayor o igual a 260px
- **THEN** la pill muestra el label completo del estado (Programado, Confirmado, Atendido, Ausente o Cancelado)

#### Scenario: Pill compacta en card angosta

- **WHEN** el ancho de una card de turno en el modo Día es menor a 260px
- **THEN** la pill muestra únicamente las primeras tres letras del label de ese estado: PRO, CON, ATE, AUS o CAN

#### Scenario: Tooltip de la pill compacta

- **WHEN** la pill está en modo compacto y el usuario posiciona el cursor sobre ella
- **THEN** el sistema muestra un tooltip con el label completo del estado

## ADDED Requirements

### Requirement: Ancho mínimo del contenedor Día con scroll horizontal

El contenedor de visualización del modo Día SHALL tener el mismo ancho mínimo que el modo Lista (`960px`). Cuando el viewport es más estrecho que ese piso, el sistema MUST permitir scroll horizontal del contenedor en lugar de recortar la grilla.

#### Scenario: Viewport más ancho que el piso

- **WHEN** el área disponible para el modo Día es de 960px o más
- **THEN** la grilla ocupa el ancho disponible y no aparece scroll horizontal forzado por el piso

#### Scenario: Viewport más estrecho que el piso

- **WHEN** el área disponible para el modo Día es menor a 960px
- **THEN** el contenedor mantiene 960px de ancho mínimo y el usuario puede scrollear horizontalmente para ver la grilla completa
