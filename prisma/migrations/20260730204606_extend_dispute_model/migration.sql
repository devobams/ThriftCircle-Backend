-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DisputeStatus" ADD VALUE 'in_review';
ALTER TYPE "DisputeStatus" ADD VALUE 'rejected';

-- AlterTable
ALTER TABLE "disputes" ADD COLUMN     "contribution_id" TEXT,
ADD COLUMN     "resolution" TEXT,
ADD COLUMN     "resolved_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "contributions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
