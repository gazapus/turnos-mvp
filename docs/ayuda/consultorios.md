# Consultorios

La pantalla Consultorios asigna un consultorio numerado a cada médico. La usan Administrador y Recepcionista. El médico no entra a esta pantalla.

## Qué ves

Hay un catálogo fijo de consultorios **1 a 20**. Esta versión no permite crear, borrar ni cambiar números. Los vacíos también se listan (selector de médico vacío).

El nombre público de aviso es `CONSULTORIO` más el número (por ejemplo CONSULTORIO 7). No lo edités: se arma solo a partir del número.

## Asignación

Cada médico tiene como máximo un consultorio, y cada consultorio como máximo un médico.

- Elegí un médico libre en un consultorio vacío: se guarda al momento.
- Si movés a un médico que ya tenía otro consultorio, el anterior queda libre.
- Podés dejar un consultorio sin médico (opción “Sin asignar”).

Cuando alguien **pierde** un consultorio (mover, reemplazar o desasignar), el sistema pide confirmación. Llenar un hueco con un médico libre no pide confirmación.

Si el mismo médico ya está en ese consultorio, no hay cambio.

## Médicos inactivos

La lista para asignar muestra médicos activos. Si un inactivo ya estaba asignado, la fila lo sigue mostrando. Esta pantalla no le quita el consultorio al dar de baja a un usuario.

## Si algo falla

Los errores se muestran en un diálogo. El selector vuelve al valor anterior. Un guardado correcto no muestra aviso de éxito: se actualiza la grilla.
