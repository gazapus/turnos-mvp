# Mini manual — Flujo OpenSpec (planificar → cerrar)

Guía operativa para trabajar un cambio de punta a punta en **turnos-mvp** con OpenSpec (Spec-Driven Development).

Para el _por qué_ de la metodología, ver [adr/02_definicion_sdd_openspec.md](adr/02_definicion_sdd_openspec.md).  
Para _cómo escribir código_, ver [AGENTS.md](../AGENTS.md).  
Para _qué debe hacer el sistema_, ver [FUNCIONAL.md](FUNCIONAL.md).

---

## Idea en una frase

```text
Explorar (opcional) → Proponer → Implementar → Sincronizar specs → Archivar
```

Un **change** es una unidad de trabajo versionada en `openspec/changes/<nombre>/`.  
Las **specs** en `openspec/specs/` son el contrato vigente del sistema.  
Al archivar, el change deja de estar activo y (si sincronizaste) las specs principales ya reflejan lo implementado.

---

## Mapa de carpetas

```text
openspec/
├── specs/                      # Fuente de verdad (estado actual)
│   └── <capability>/spec.md    # p. ej. auth, appointments, waiting-room
└── changes/
    ├── <nombre-del-cambio>/    # Trabajo en curso
    │   ├── proposal.md         # Qué y por qué
    │   ├── design.md           # Cómo (opcional si el cambio es trivial)
    │   ├── tasks.md            # Checklist de implementación
    │   └── specs/              # Deltas (ADDED / MODIFIED / REMOVED / RENAMED)
    └── archive/
        └── YYYY-MM-DD-<nombre>/  # Changes cerrados
```

| Lugar                       | Rol                                                   |
| :-------------------------- | :---------------------------------------------------- |
| `docs/`                     | Producto, ADRs, este manual — no es el runtime de SDD |
| `openspec/specs/`           | Contrato vigente del software                         |
| `openspec/changes/`         | Propuestas y trabajo en curso                         |
| `openspec/changes/archive/` | Historial de changes cerrados                         |
| `apps/` + `packages/`       | Código que materializa las specs                      |

---

## Comandos en Cursor

En el chat del agente (slash commands):

| Comando         | Cuándo usarlo                                                                   |
| :-------------- | :------------------------------------------------------------------------------ |
| `/opsx-explore` | Pensar el problema, comparar opciones, investigar el código. **No implementa.** |
| `/opsx-propose` | Crear el change y generar artefactos (proposal, design, tasks, deltas).         |
| `/opsx-apply`   | Implementar las tareas del `tasks.md` una a una.                                |
| `/opsx-sync`    | Fusionar deltas del change en `openspec/specs/` **sin** archivar.               |
| `/opsx-archive` | Cerrar el change: sync (recomendado) + mover a `archive/`.                      |

También podés pedir lo mismo en lenguaje natural (“proponé un change para login”, “implementá el change X”, “archivá el change”).

---

## Flujo paso a paso

### 0. (Opcional) Explorar

Usá `/opsx-explore` cuando la idea esté difusa, haya trade-offs, o quieras mapear el código antes de formalizar.

- Podés leer código y artefactos OpenSpec.
- No se escribe código de producto.
- Cuando el enfoque esté claro: pasá a proponer.

### 1. Proponer el change

```text
/opsx-propose add-login-jwt
```

o describí el trabajo y el agente deriva un nombre **kebab-case**.

Se crea `openspec/changes/<nombre>/` con, como mínimo:

1. **`proposal.md`** — problema, alcance, no-goals, impacto.
2. **`design.md`** — decisiones técnicas (omitible si el cambio es trivial).
3. **`specs/.../spec.md`** — deltas respecto a `openspec/specs/`.
4. **`tasks.md`** — checklist accionable para implementar.

Revisá los artefactos antes de implementar. Si algo no cierra, pedí ajustes (no hace falta archivar ni empezar de cero).

**Listo para implementar** cuando el status del change indique que los artefactos requeridos están `done` (en schema `spec-driven`, típicamente cuando existe `tasks.md` completo).

### 2. Implementar

```text
/opsx-apply
```

o `/opsx-apply <nombre-del-cambio>`.

El agente:

1. Lee proposal / design / specs / tasks.
2. Trabaja tarea por tarea.
3. Marca cada ítem en `tasks.md`: `- [ ]` → `- [x]`.
4. Se detiene si hay ambigüedad, error de diseño o blocker.

Podés interrumpir y retomar: el progreso vive en los checkboxes de `tasks.md`.

Si durante la implementación descubrís un problema de diseño:

- Actualizá `design.md` / deltas / `tasks.md`.
- Seguí implementando — el flujo no es rígido por fases.

Antes de tocar código, el agente debe respetar [AGENTS.md](../AGENTS.md) y [FUNCIONAL.md](FUNCIONAL.md).

### 3. Sincronizar specs (antes o al archivar)

Los deltas viven en `openspec/changes/<nombre>/specs/`.  
`openspec/specs/` **no** se actualiza sola al escribir código.

Opciones:

| Acción        | Comando                            | Efecto                                                                                   |
| :------------ | :--------------------------------- | :--------------------------------------------------------------------------------------- |
| Solo sync     | `/opsx-sync`                       | Aplica ADDED / MODIFIED / REMOVED / RENAMED a `openspec/specs/`. El change sigue activo. |
| Sync + cierre | `/opsx-archive` (elegí “Sync now”) | Actualiza specs principales y archiva.                                                   |

**Recomendado:** sincronizar al archivar, salvo que quieras que las specs principales reflejen el contrato antes de terminar el código.

### 4. Archivar (dar por cerrado)

```text
/opsx-archive
```

Checklist mental antes de cerrar:

- [ ] Artefactos del change completos
- [ ] Tareas de `tasks.md` en `- [x]`
- [ ] Código alineado con los escenarios de la spec / CU
- [ ] Deltas sincronizados a `openspec/specs/` (recomendado)

El change se mueve a:

```text
openspec/changes/archive/YYYY-MM-DD-<nombre>/
```

A partir de ahí, la fuente de verdad vigente está en `openspec/specs/` y el histórico del change queda en `archive/`.

---

## Diagrama del ciclo

```text
                    ┌──────────────┐
                    │  /opsx-explore│  (opcional)
                    └──────┬───────┘
                           │ idea clara
                           ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ docs/       │────▶│ /opsx-propose│────▶│  change     │
│ FUNCIONAL   │     └──────────────┘     │  proposal   │
│ + ADRs      │                          │  design     │
└─────────────┘                          │  tasks      │
                                         │  delta specs│
                                         └──────┬──────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │ /opsx-apply  │
                                         │  código +    │
                                         │  [x] tasks   │
                                         └──────┬───────┘
                                                │
                         ┌──────────────────────┼──────────────────────┐
                         ▼                      ▼                      │
                  ┌──────────────┐       ┌──────────────┐              │
                  │ /opsx-sync   │       │ /opsx-archive│◀─────────────┘
                  │ (opcional    │       │ sync + move  │
                  │  mid-cycle)  │       │ a archive/   │
                  └──────┬───────┘       └──────┬───────┘
                         │                      │
                         ▼                      ▼
                  openspec/specs/        openspec/changes/archive/
                  (contrato vigente)     YYYY-MM-DD-<nombre>/
```

---

## CLI útil (referencia rápida)

Si preferís la terminal en lugar de slash commands:

```bash
openspec list                          # changes activos
openspec status --change "<nombre>"    # estado de artefactos
openspec new change "<nombre>"         # scaffold vacío (luego completar artefactos)
openspec validate --change "<nombre>"  # validar change
openspec archive "<nombre>"            # archivar (según CLI; en Cursor preferí /opsx-archive)
```

En este repo el schema es `spec-driven` (`openspec/config.yaml`).

---

## Buenas prácticas en este proyecto

1. **Un change = un objetivo claro.** Preferí varios changes chicos (auth, agenda, sala-espera) a un mega-change.
2. **Nombre kebab-case.** Ej.: `add-login-jwt`, `cu9-waiting-room-call`.
3. **Deltas explícitos.** No reescribas a mano `openspec/specs/` “de paso”: el cambio pasa por el change y luego sync/archive.
4. **No archivar a medias.** Si faltan tareas o no sincronizaste specs, el contrato y el código divergen.
5. **FUNCIONAL.md alimenta el alcance; OpenSpec opera el día a día.** Los CU viven en docs; el trabajo concreto vive en changes.
6. **Código con AGENTS.md.** Al aplicar, respetá módulos, DTOs, tests y convenciones del monorepo.

---

## Ejemplo mínimo

Querés agregar login con JWT:

1. `/opsx-explore` — ¿sesión cookie o JWT? ¿dónde vive el guard?
2. `/opsx-propose add-login-jwt` — proposal + design + delta en `auth` + tasks.
3. Revisás artefactos; pedís ajustes si hace falta.
4. `/opsx-apply add-login-jwt` — implementás hasta `7/7` tasks.
5. `/opsx-archive` → sync a `openspec/specs/auth/` → archive `2026-08-11-add-login-jwt`.

Cambio cerrado.
