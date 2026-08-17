-- AlterEnum: replace EstadoTurno (remove VENCIDO, add ATENDIDO and AUSENTE)

CREATE TYPE "EstadoTurno_new" AS ENUM ('PROGRAMADO', 'CONFIRMADO', 'ATENDIDO', 'AUSENTE', 'CANCELADO');

ALTER TABLE "turnos" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "turnos" ALTER COLUMN "estado" TYPE "EstadoTurno_new" USING (
  CASE
    WHEN "estado"::text = 'VENCIDO' THEN 'AUSENTE'::"EstadoTurno_new"
    ELSE "estado"::text::"EstadoTurno_new"
  END
);

ALTER TYPE "EstadoTurno" RENAME TO "EstadoTurno_old";
ALTER TYPE "EstadoTurno_new" RENAME TO "EstadoTurno";
DROP TYPE "EstadoTurno_old";

ALTER TABLE "turnos" ALTER COLUMN "estado" SET DEFAULT 'PROGRAMADO';
