-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'CONSENT_COPY_SENT';

-- AlterTable
ALTER TABLE "consent_forms" ADD COLUMN     "pdf_sent_at" TIMESTAMP(3),
ADD COLUMN     "pdf_sent_to" TEXT;
