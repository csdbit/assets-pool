/*
  Warnings:

  - You are about to drop the column `version` on the `image_versions` table. All the data in the column will be lost.
  - Added the required column `height` to the `image_versions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `image_versions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width` to the `image_versions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `image_versions` DROP COLUMN `version`,
    ADD COLUMN `height` INTEGER NOT NULL,
    ADD COLUMN `type` ENUM('ORIGINAL', 'LARGE', 'MEDIUM', 'SMALL') NOT NULL,
    ADD COLUMN `width` INTEGER NOT NULL;
