-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'RECEPCIONISTA', 'MEDICO');

-- CreateEnum
CREATE TYPE "TipoTurno" AS ENUM ('PRIMER_TURNO', 'CONTROL', 'SOBRETURNO', 'URGENTE');

-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('PROGRAMADO', 'CONFIRMADO', 'CANCELADO', 'VENCIDO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "documento_identidad" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "mail" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "especialidades" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "especialidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medico_especialidad" (
    "medico_id" TEXT NOT NULL,
    "especialidad_id" TEXT NOT NULL,

    CONSTRAINT "medico_especialidad_pkey" PRIMARY KEY ("medico_id","especialidad_id")
);

-- CreateTable
CREATE TABLE "medico_consultorio" (
    "medico_id" TEXT NOT NULL,
    "consultorio" TEXT NOT NULL,

    CONSTRAINT "medico_consultorio_pkey" PRIMARY KEY ("medico_id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT,
    "mail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "medico_id" TEXT NOT NULL,
    "especialidad_id" TEXT NOT NULL,
    "creado_por" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoTurno" NOT NULL,
    "estado" "EstadoTurno" NOT NULL DEFAULT 'PROGRAMADO',
    "motivo_cancelacion" TEXT,
    "notificar_mail" BOOLEAN NOT NULL DEFAULT false,
    "notificar_whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueos_agenda" (
    "id" TEXT NOT NULL,
    "medico_id" TEXT NOT NULL,
    "creado_por" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueos_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llamados_turno" (
    "id" TEXT NOT NULL,
    "turno_id" TEXT NOT NULL,
    "llamado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llamados_turno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_documento_identidad_key" ON "usuarios"("documento_identidad");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_mail_key" ON "usuarios"("mail");

-- CreateIndex
CREATE UNIQUE INDEX "especialidades_nombre_key" ON "especialidades"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_documento_key" ON "pacientes"("documento");

-- CreateIndex
CREATE INDEX "turnos_medico_id_fecha_inicio_idx" ON "turnos"("medico_id", "fecha_inicio");

-- CreateIndex
CREATE INDEX "turnos_paciente_id_idx" ON "turnos"("paciente_id");

-- CreateIndex
CREATE INDEX "bloqueos_agenda_medico_id_fecha_inicio_fecha_fin_idx" ON "bloqueos_agenda"("medico_id", "fecha_inicio", "fecha_fin");

-- CreateIndex
CREATE INDEX "llamados_turno_llamado_en_idx" ON "llamados_turno"("llamado_en");

-- AddForeignKey
ALTER TABLE "medico_especialidad" ADD CONSTRAINT "medico_especialidad_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medico_especialidad" ADD CONSTRAINT "medico_especialidad_especialidad_id_fkey" FOREIGN KEY ("especialidad_id") REFERENCES "especialidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medico_consultorio" ADD CONSTRAINT "medico_consultorio_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_especialidad_id_fkey" FOREIGN KEY ("especialidad_id") REFERENCES "especialidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueos_agenda" ADD CONSTRAINT "bloqueos_agenda_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueos_agenda" ADD CONSTRAINT "bloqueos_agenda_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llamados_turno" ADD CONSTRAINT "llamados_turno_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "turnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
