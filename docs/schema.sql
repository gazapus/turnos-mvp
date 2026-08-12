-- =====================================================================
-- Sistema de Gestión de Turnos — Script de creación de base de datos
-- PostgreSQL — equivalente en SQL puro al schema.prisma del proyecto
-- =====================================================================

-- Necesario para generar UUID nativamente (gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------

CREATE TYPE rol_usuario AS ENUM ('ADMIN', 'RECEPCIONISTA', 'MEDICO');

CREATE TYPE tipo_turno AS ENUM ('PRIMER_TURNO', 'CONTROL', 'SOBRETURNO', 'URGENTE');

CREATE TYPE estado_turno AS ENUM ('PROGRAMADO', 'CONFIRMADO', 'CANCELADO', 'VENCIDO');

-- ---------------------------------------------------------------------
-- Función auxiliar para mantener updated_at automáticamente
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Tabla: usuarios
-- ---------------------------------------------------------------------

CREATE TABLE usuarios (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_identidad VARCHAR(20)  NOT NULL,
  nombre              VARCHAR(100) NOT NULL,
  apellido            VARCHAR(100) NOT NULL,
  mail                VARCHAR(150) NOT NULL,
  password_hash       TEXT         NOT NULL,
  rol                 rol_usuario  NOT NULL,
  activo              BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT uq_usuarios_documento UNIQUE (documento_identidad),
  CONSTRAINT uq_usuarios_mail UNIQUE (mail)
);

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- Tabla: especialidades (catálogo maestro)
-- ---------------------------------------------------------------------

CREATE TABLE especialidades (
  id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,

  CONSTRAINT uq_especialidades_nombre UNIQUE (nombre)
);

-- ---------------------------------------------------------------------
-- Tabla: medico_especialidad (N:M entre usuarios y especialidades)
-- ---------------------------------------------------------------------

CREATE TABLE medico_especialidad (
  medico_id       UUID NOT NULL,
  especialidad_id UUID NOT NULL,

  CONSTRAINT pk_medico_especialidad PRIMARY KEY (medico_id, especialidad_id),
  CONSTRAINT fk_medico_especialidad_medico
    FOREIGN KEY (medico_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
  CONSTRAINT fk_medico_especialidad_especialidad
    FOREIGN KEY (especialidad_id) REFERENCES especialidades (id) ON DELETE RESTRICT
);

CREATE INDEX idx_medico_especialidad_especialidad ON medico_especialidad (especialidad_id);

-- ---------------------------------------------------------------------
-- Tabla: medico_consultorio (1:1 fija, médico -> consultorio)
-- ---------------------------------------------------------------------

CREATE TABLE medico_consultorio (
  medico_id   UUID PRIMARY KEY,
  consultorio VARCHAR(100) NOT NULL,

  CONSTRAINT fk_medico_consultorio_medico
    FOREIGN KEY (medico_id) REFERENCES usuarios (id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------
-- Tabla: pacientes
-- ---------------------------------------------------------------------

CREATE TABLE pacientes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento  VARCHAR(20)  NOT NULL,
  nombre     VARCHAR(100) NOT NULL,
  apellido   VARCHAR(100) NOT NULL,
  telefono   VARCHAR(30),
  mail       VARCHAR(150),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT uq_pacientes_documento UNIQUE (documento)
);

CREATE TRIGGER trg_pacientes_updated_at
  BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- Tabla: turnos (entidad central)
-- ---------------------------------------------------------------------

CREATE TABLE turnos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id         UUID         NOT NULL,
  medico_id           UUID         NOT NULL,
  especialidad_id     UUID         NOT NULL,
  creado_por          UUID         NOT NULL,
  fecha_inicio        TIMESTAMPTZ  NOT NULL,
  fecha_fin           TIMESTAMPTZ  NOT NULL,
  tipo                tipo_turno   NOT NULL,
  estado              estado_turno NOT NULL DEFAULT 'PROGRAMADO',
  motivo_cancelacion  TEXT,
  notificar_mail      BOOLEAN      NOT NULL DEFAULT FALSE,
  notificar_whatsapp  BOOLEAN      NOT NULL DEFAULT FALSE, -- sin funcionalidad real en esta versión
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT fk_turnos_paciente
    FOREIGN KEY (paciente_id) REFERENCES pacientes (id) ON DELETE RESTRICT,
  CONSTRAINT fk_turnos_medico
    FOREIGN KEY (medico_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
  CONSTRAINT fk_turnos_especialidad
    FOREIGN KEY (especialidad_id) REFERENCES especialidades (id) ON DELETE RESTRICT,
  CONSTRAINT fk_turnos_creado_por
    FOREIGN KEY (creado_por) REFERENCES usuarios (id) ON DELETE RESTRICT,
  CONSTRAINT chk_turnos_horario CHECK (fecha_fin > fecha_inicio)
);

CREATE TRIGGER trg_turnos_updated_at
  BEFORE UPDATE ON turnos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Sin constraint único en (medico_id, fecha_inicio): los sobreturnos pueden
-- compartir horario de inicio de forma intencional. La prevención de
-- doble-booking accidental se resuelve en la capa de aplicación, dentro de
-- una transacción (ver documentación del schema.prisma).
CREATE INDEX idx_turnos_medico_fecha ON turnos (medico_id, fecha_inicio);
CREATE INDEX idx_turnos_paciente ON turnos (paciente_id);
CREATE INDEX idx_turnos_estado ON turnos (estado);

-- ---------------------------------------------------------------------
-- Tabla: bloqueos_agenda
-- ---------------------------------------------------------------------

CREATE TABLE bloqueos_agenda (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id     UUID        NOT NULL,
  creado_por    UUID        NOT NULL,
  fecha_inicio  TIMESTAMPTZ NOT NULL,
  fecha_fin     TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fk_bloqueos_medico
    FOREIGN KEY (medico_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
  CONSTRAINT fk_bloqueos_creado_por
    FOREIGN KEY (creado_por) REFERENCES usuarios (id) ON DELETE RESTRICT,
  CONSTRAINT chk_bloqueos_horario CHECK (fecha_fin > fecha_inicio)
);

CREATE INDEX idx_bloqueos_medico_rango ON bloqueos_agenda (medico_id, fecha_inicio, fecha_fin);

-- ---------------------------------------------------------------------
-- Tabla: llamados_turno (registra cada llamado; alimenta la pantalla
-- de sala de espera con los últimos 5 turnos anunciados)
-- ---------------------------------------------------------------------

CREATE TABLE llamados_turno (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id    UUID        NOT NULL,
  llamado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fk_llamados_turno
    FOREIGN KEY (turno_id) REFERENCES turnos (id) ON DELETE RESTRICT
);

CREATE INDEX idx_llamados_llamado_en ON llamados_turno (llamado_en DESC);

-- =====================================================================
-- Fin del script
-- =====================================================================
