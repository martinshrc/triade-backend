-- CreateEnum
CREATE TYPE "NfeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "betting_houses" ADD COLUMN     "fiscalCnae" TEXT,
ADD COLUMN     "fiscalCnpj" TEXT,
ADD COLUMN     "fiscalFantasy" TEXT,
ADD COLUMN     "fiscalName" TEXT,
ADD COLUMN     "fiscalNote" TEXT,
ADD COLUMN     "supportWhatsapp" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "ftdsEstimate" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "market" TEXT,
ADD COLUMN     "whatsapp" TEXT;

-- CreateTable
CREATE TABLE "nfes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodFrom" TIMESTAMP(3) NOT NULL,
    "periodTo" TIMESTAMP(3) NOT NULL,
    "emailPlatform" TEXT NOT NULL,
    "bankName" TEXT,
    "bankAgency" TEXT,
    "bankAccount" TEXT,
    "bankAccountType" TEXT,
    "pixKeyType" TEXT,
    "pixKey" TEXT,
    "pdfPath" TEXT,
    "status" "NfeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nfes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bettingHouseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "nfes" ADD CONSTRAINT "nfes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_bettingHouseId_fkey" FOREIGN KEY ("bettingHouseId") REFERENCES "betting_houses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
