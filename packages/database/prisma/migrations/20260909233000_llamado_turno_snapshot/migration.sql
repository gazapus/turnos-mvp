-- AlterTable
ALTER TABLE "llamados_turno" ADD COLUMN "paciente_nombre" TEXT NOT NULL;
ALTER TABLE "llamados_turno" ADD COLUMN "paciente_apellido" TEXT NOT NULL;
ALTER TABLE "llamados_turno" ADD COLUMN "consultorio_numero" INTEGER NOT NULL;
