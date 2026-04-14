/*
  Warnings:

  - The primary key for the `affiliate_links` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `approvals` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `betting_houses` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `commissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `payments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `player_stats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `passwordHash` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "affiliate_links" DROP CONSTRAINT "affiliate_links_bettingHouseId_fkey";

-- DropForeignKey
ALTER TABLE "affiliate_links" DROP CONSTRAINT "affiliate_links_userId_fkey";

-- DropForeignKey
ALTER TABLE "approvals" DROP CONSTRAINT "approvals_userId_fkey";

-- DropForeignKey
ALTER TABLE "commissions" DROP CONSTRAINT "commissions_userId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_userId_fkey";

-- DropForeignKey
ALTER TABLE "player_stats" DROP CONSTRAINT "player_stats_bettingHouseId_fkey";

-- DropForeignKey
ALTER TABLE "player_stats" DROP CONSTRAINT "player_stats_userId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_referrerId_fkey";

-- AlterTable
ALTER TABLE "affiliate_links" DROP CONSTRAINT "affiliate_links_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "bettingHouseId" SET DATA TYPE TEXT,
ADD CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "affiliate_links_id_seq";

-- AlterTable
ALTER TABLE "approvals" DROP CONSTRAINT "approvals_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "approvals_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "approvals_id_seq";

-- AlterTable
ALTER TABLE "betting_houses" DROP CONSTRAINT "betting_houses_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "betting_houses_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "betting_houses_id_seq";

-- AlterTable
ALTER TABLE "commissions" DROP CONSTRAINT "commissions_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "commissions_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "commissions_id_seq";

-- AlterTable
ALTER TABLE "payments" DROP CONSTRAINT "payments_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "payments_id_seq";

-- AlterTable
ALTER TABLE "player_stats" DROP CONSTRAINT "player_stats_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "bettingHouseId" SET DATA TYPE TEXT,
ADD CONSTRAINT "player_stats_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "player_stats_id_seq";

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
ADD COLUMN     "refreshToken" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "passwordHash" SET NOT NULL,
ALTER COLUMN "externalId" SET DATA TYPE TEXT,
ALTER COLUMN "referrerId" SET DATA TYPE TEXT,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "users_id_seq";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_bettingHouseId_fkey" FOREIGN KEY ("bettingHouseId") REFERENCES "betting_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_bettingHouseId_fkey" FOREIGN KEY ("bettingHouseId") REFERENCES "betting_houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
