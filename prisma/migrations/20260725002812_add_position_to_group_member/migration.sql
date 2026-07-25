/*
  Warnings:

  - You are about to drop the column `position` on the `payout_order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[group_id,position]` on the table `group_members` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `position` to the `group_members` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "group_members" ADD COLUMN     "position" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "payout_order" DROP COLUMN "position";

-- CreateIndex
CREATE UNIQUE INDEX "group_members_group_id_position_key" ON "group_members"("group_id", "position");
