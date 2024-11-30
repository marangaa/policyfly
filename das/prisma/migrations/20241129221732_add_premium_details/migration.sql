/*
  Warnings:

  - Added the required column `premiumDetails` to the `Policy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Policy" ADD COLUMN     "claimHistory" JSONB,
ADD COLUMN     "lastReviewDate" TIMESTAMP(3),
ADD COLUMN     "premiumDetails" JSONB NOT NULL,
ADD COLUMN     "renewalStatus" TEXT,
ADD COLUMN     "underwritingStatus" TEXT;
