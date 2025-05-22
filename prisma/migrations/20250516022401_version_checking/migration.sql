-- AlterTable
ALTER TABLE "SkyCloud" ADD COLUMN     "featuresVersionAPI" TEXT NOT NULL DEFAULT 'https://skycloud-version.diced.sh',
ADD COLUMN     "featuresVersionChecking" BOOLEAN NOT NULL DEFAULT true;
