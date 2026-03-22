-- CreateEnum
CREATE TYPE "UsageResource" AS ENUM ('SMS', 'EMAIL', 'AI_EXPLAINER', 'STORAGE_BYTES');

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "current_period_start" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "usage_ledger" (
    "id" TEXT NOT NULL,
    "practice_id" TEXT NOT NULL,
    "resource" "UsageResource" NOT NULL,
    "period_key" TEXT NOT NULL,
    "count" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_alerts" (
    "id" TEXT NOT NULL,
    "practice_id" TEXT NOT NULL,
    "resource" "UsageResource" NOT NULL,
    "period_key" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_ledger_practice_id_period_key_idx" ON "usage_ledger"("practice_id", "period_key");

-- CreateIndex
CREATE INDEX "usage_ledger_period_key_resource_idx" ON "usage_ledger"("period_key", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "usage_ledger_practice_id_resource_period_key_key" ON "usage_ledger"("practice_id", "resource", "period_key");

-- CreateIndex
CREATE INDEX "usage_alerts_practice_id_period_key_idx" ON "usage_alerts"("practice_id", "period_key");

-- CreateIndex
CREATE UNIQUE INDEX "usage_alerts_practice_id_resource_period_key_threshold_key" ON "usage_alerts"("practice_id", "resource", "period_key", "threshold");

-- AddForeignKey
ALTER TABLE "usage_ledger" ADD CONSTRAINT "usage_ledger_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_alerts" ADD CONSTRAINT "usage_alerts_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
