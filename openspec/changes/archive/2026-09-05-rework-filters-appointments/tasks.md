## 1. Contratos compartidos

- [x] 1.1 En `packages/shared-types/src/turnos.ts`, reemplazar `incluirCancelados` por `soloPendientes` en `TurnosListQuery` y `cancelados` por `soloPendientes` en `AgendaUrlParams`; exportar sin cambios de `PacienteOption`

## 2. Backend — pacientes

- [x] 2.1 Extender `GET /api/pacientes` con query `q`: si `q` recortado tiene menos de 3 caracteres o falta, devolver `[]`; si no, `nombre ILIKE` **o** `apellido ILIKE`, orden apellido/nombre, `take 30`; Swagger actualizado

- [x] 2.2 Agregar `GET /api/pacientes/:id` (JwtAuthGuard, Response DTO existente, 404 si no existe) y exportarlo en el barrel del módulo

- [x] 2.3 Tests de controller/service: búsqueda OR, tope 30, `q` corto/vacío no lista padrón, getById ok y 404

## 3. Backend — turnos

- [x] 3.1 En DTO/service de `appointments`, reemplazar `incluirCancelados` por `soloPendientes`: `true` → `estado IN (PROGRAMADO, CONFIRMADO)`; ausente o `false` → sin filtro de estado

- [x] 3.2 Actualizar specs de appointments (controller/service) para el nuevo param y quitar escenarios de `incluirCancelados`

## 4. Frontend — cliente API y URL

- [x] 4.1 Actualizar `turnos-client.ts`: `fetchTurnos` envía `soloPendientes`; `fetchPacientes(q)` y `fetchPacienteById(id)`

- [x] 4.2 Actualizar `url-params.ts`: parse/serialize `soloPendientes` (siempre en la URL); default `true` para MEDICO y `false` para ADMIN/RECEPCIONISTA; ignorar `cancelados`; `toTurnosListQuery` deja de hardcodear `incluirCancelados`

- [x] 4.3 Actualizar tests de `url-params` al nuevo param y defaults por rol

## 5. Frontend — combobox y formulario

- [x] 5.1 Crear primitive `Combobox` (leaf): input + listbox, placeholder, flechas/Enter/Tab/Escape/click; Enter/Tab no submit del form; modos opciones locales vs fetch remoto

- [x] 5.2 Reemplazar los tres `<select>` de `agenda-filtros-form` por Combobox: médico/especialidad locales; paciente remoto (≥3 chars, debounce 1 s); médico disabled con datos de sesión para rol MEDICO; hidratar paciente por id si viene en la URL; placeholder "Todos"

- [x] 5.3 Agregar botón reset al lado de Aplicar (`RotateCcw`, cuadrado, mismo alto, `bg-background border-foreground`, `aria-label` Restablecer filtros) que vuelve a defaults de rol (médico locked, `soloPendientes` incluido) y hace `router.replace` sin tocar `vista`/`fecha`

- [x] 5.4 Tests del Combobox (teclado, placeholder) y de `agenda-filtros-form` (Aplicar, reset por rol, no fetch de paciente < 3 chars, hidratar por id)

## 6. Frontend — Solo Pendientes y vistas

- [x] 6.1 Reemplazar `AgendaCanceladosToggle` por checkbox "Solo Pendientes" que escribe `soloPendientes` en la URL (refetch vía queryKey); default según rol

- [x] 6.2 En `turnos-listado` y `agenda-dia`: incluir `soloPendientes` en `queryKey` y en `fetchTurnos`; eliminar filtro en memoria (`visibleItems` / `filterTurnosDia` de cancelados)

- [x] 6.3 Actualizar tests de toggle, listado, día, tabs y content que aún usan `cancelados` o asumen filtro cliente

## 7. Verificación

- [x] 7.1 Correr tests de `@turnos/api` y `@turnos/web` afectados y corregir regresiones
