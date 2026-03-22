-- AlterTable
ALTER TABLE "consent_forms" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'de';

-- AlterTable
ALTER TABLE "practices" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'DE',
ADD COLUMN     "house_number" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "practice_email" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "website" TEXT;
