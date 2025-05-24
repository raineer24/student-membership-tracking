/*
  Warnings:

  - The `type` column on the `Membership` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Membership" DROP COLUMN "type",
ADD COLUMN     "type" "MembershipType" NOT NULL DEFAULT 'MONTHLY';
