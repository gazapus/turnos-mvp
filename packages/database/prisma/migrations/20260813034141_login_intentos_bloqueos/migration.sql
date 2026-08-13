-- CreateTable
CREATE TABLE "login_intentos" (
    "id" TEXT NOT NULL,
    "mail" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "exito" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_intentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_bloqueos" (
    "id" TEXT NOT NULL,
    "mail" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "bloqueado_hasta" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_bloqueos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_intentos_mail_ip_created_at_idx" ON "login_intentos"("mail", "ip", "created_at");

-- CreateIndex
CREATE INDEX "login_bloqueos_mail_ip_bloqueado_hasta_idx" ON "login_bloqueos"("mail", "ip", "bloqueado_hasta");
