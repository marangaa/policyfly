/*
  Warnings:

  - You are about to drop the column `claimHistory` on the `Policy` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Policy" DROP COLUMN "claimHistory",
ADD COLUMN     "claimsHistory" JSONB DEFAULT '{}',
ADD COLUMN     "packageType" TEXT DEFAULT 'standard',
ADD COLUMN     "paymentStatus" TEXT DEFAULT 'current',
ALTER COLUMN "type" SET DEFAULT 'auto',
ALTER COLUMN "coverageDetails" SET DEFAULT '{}',
ALTER COLUMN "status" SET DEFAULT 'active',
ALTER COLUMN "premiumDetails" SET DEFAULT '{}',
ALTER COLUMN "renewalStatus" SET DEFAULT 'pending',
ALTER COLUMN "underwritingStatus" SET DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "Policy_clientId_idx" ON "Policy"("clientId");

-- CreateIndex
CREATE INDEX "Policy_type_idx" ON "Policy"("type");

-- CreateIndex
CREATE INDEX "Policy_status_idx" ON "Policy"("status");
