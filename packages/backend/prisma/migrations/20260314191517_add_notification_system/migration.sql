-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "practice_settings" ADD COLUMN     "preferred_channel" TEXT NOT NULL DEFAULT 'email';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'de';

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "practice_id" TEXT,
    "recipient_type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'de',
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "provider_ref" TEXT,
    "error_message" TEXT,
    "metadata" JSONB,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_logs_practice_id_created_at_idx" ON "notification_logs"("practice_id", "created_at");

-- CreateIndex
CREATE INDEX "notification_logs_status_created_at_idx" ON "notification_logs"("status", "created_at");

-- CreateIndex
CREATE INDEX "notification_logs_template_key_idx" ON "notification_logs"("template_key");

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
