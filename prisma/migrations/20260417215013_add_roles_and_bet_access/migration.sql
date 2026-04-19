-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'TEAM_ADMIN', 'AFFILIATE');

-- CreateEnum
CREATE TYPE "BetAccessStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'AFFILIATE';

-- CreateTable
CREATE TABLE "bet_access_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bettingHouseId" TEXT NOT NULL,
    "status" "BetAccessStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bet_access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bet_access_requests_userId_bettingHouseId_key" ON "bet_access_requests"("userId", "bettingHouseId");

-- AddForeignKey
ALTER TABLE "bet_access_requests" ADD CONSTRAINT "bet_access_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_access_requests" ADD CONSTRAINT "bet_access_requests_bettingHouseId_fkey" FOREIGN KEY ("bettingHouseId") REFERENCES "betting_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_access_requests" ADD CONSTRAINT "bet_access_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
