-- AlterTable
ALTER TABLE "consent_forms" ADD COLUMN "payment_amount_cents" INTEGER;

-- CreateIndex
CREATE INDEX "consent_forms_patient_id_idx" ON "consent_forms"("patient_id");

-- CreateIndex
CREATE INDEX "consent_forms_expires_at_idx" ON "consent_forms"("expires_at");

-- CreateIndex
CREATE INDEX "invites_practice_id_status_idx" ON "invites"("practice_id", "status");

-- CreateIndex
CREATE INDEX "users_practice_id_idx" ON "users"("practice_id");
