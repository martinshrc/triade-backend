-- AlterTable: adiciona inviteCode opcional na tabela users
ALTER TABLE "users" ADD COLUMN "inviteCode" TEXT;

-- CreateIndex: índice único para inviteCode
CREATE UNIQUE INDEX "users_inviteCode_key" ON "users"("inviteCode");
