/*
  Warnings:

  - Changed the type of `currency_code` on the `accounts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `currency_code` on the `transfers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'COP');

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "currency_code",
ADD COLUMN     "currency_code" "Currency" NOT NULL;

-- AlterTable
ALTER TABLE "transfers" DROP COLUMN "currency_code",
ADD COLUMN     "currency_code" "Currency" NOT NULL;
