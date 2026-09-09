## 1. Modelo de datos

- [x] 1.1 Reemplazar `MedicoConsultorio` por `Consultorio` (`numero` único, `medicoId` opcional único) en `schema.prisma` y actualizar la relación en `Usuario`
- [x] 1.2 Migración: crear `consultorios`, insertar números 1–20, eliminar `medico_consultorio`
- [x] 1.3 Verificar que el seed de desarrollo no duplica consultorios (el catálogo ya viene de la migración)

## 2. Contratos compartidos

- [x] 2.1 Agregar en `packages/shared-types` el DTO de consultorio (`id`, `numero`, `medico` o null) y el body `{ medicoId: string | null }`
- [x] 2.2 Exportar los tipos desde el barrel de `shared-types`

## 3. Backend — módulo consultorios

- [x] 3.1 Crear módulo Nest `consultorios` (controller, service, DTOs Swagger, barrel) y registrarlo en `AppModule`
- [x] 3.2 `GET /api/consultorios`: JWT, solo ADMIN/RECEPCIONISTA, listado completo ordenado por `numero`, incluye médico inactivo asignado; MEDICO 403
- [x] 3.3 `PATCH /api/consultorios/:id`: transacción 1:1 (libera el consultorio previo, desasigna con `medicoId` null, no-op si es el mismo médico); 404 si no existe; 400 si el médico no existe, no es MEDICO o está inactivo; MEDICO 403
- [x] 3.4 Tests de controller/service: listado ordenado, asignación, mover, reemplazar, desasignar, 403 médico, 400 inactivo, 404

## 4. Frontend — helpers

- [x] 4.1 Cliente HTTP `consultorios-client` (GET listado, PATCH asignación) reutilizando `ApiError`
- [x] 4.2 Helper puro `splitConsultorioColumns` con tests de 5, 10, 20, 25 y 30 consultorios en los tres viewports
- [x] 4.3 Helper de copy de confirmación (mover / reemplazar / mover+desalojar / desasignar) y de si el cambio requiere dialog, con tests

## 5. Frontend — pantalla

- [x] 5.1 Reemplazar el stub de `/consultorios`: Server Component con sesión + leaf client (grilla, Combobox, query del catálogo y de médicos)
- [x] 5.2 Combobox por fila: médicos activos + opción "Sin asignar"; ignorar `onChange('')` de tipeo; `selectedLabel` si hay inactivo asignado
- [x] 5.3 Flujo de persistencia: inmediato si hueco + médico libre; `showConfirm` warning si alguien pierde consultorio; éxito sin toast e invalidar `['consultorios']`; error con `showError` sin pisar el valor
- [x] 5.4 Layout multi-columna con gap, column-major, tokens de la lista de turnos; 403 de médico muestra error sin grilla
- [x] 5.5 Tests del leaf: render del listado, asignación inmediata, confirmación al mover/desasignar, cancelar el warning, error no pisa valor, columnas 8+2 con 10 ítems

## 6. Cierre

- [x] 6.1 Lint y tests de `web` y `api` en verde para los archivos tocados
