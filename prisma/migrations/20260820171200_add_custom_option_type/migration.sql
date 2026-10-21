-- AlterEnum
ALTER TYPE "ProductOptionType" ADD VALUE 'CUSTOM';

-- AlterTable
ALTER TABLE "ProductOption" ADD COLUMN "customType" TEXT;