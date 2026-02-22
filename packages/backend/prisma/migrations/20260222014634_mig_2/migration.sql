-- AlterTable
ALTER TABLE "consent_forms" ADD COLUMN     "comprehension_answers" JSONB,
ADD COLUMN     "comprehension_score" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "practice_settings" ADD COLUMN     "education_videos" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "two_factor_secret" TEXT;
