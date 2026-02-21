-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ARZT', 'EMPFANG');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CONSENT_CREATED', 'CONSENT_SUBMITTED', 'CONSENT_REVOKED', 'CONSENT_VIEWED', 'VAULT_UNLOCKED', 'VAULT_LOCKED', 'PATIENT_CREATED', 'PATIENT_VIEWED', 'TEAM_MEMBER_INVITED', 'TEAM_MEMBER_REMOVED', 'TEAM_MEMBER_ROLE_CHANGED', 'PRACTICE_SETTINGS_UPDATED', 'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_CANCELLED', 'DATA_EXPORTED', 'DATA_DELETED', 'PHOTO_UPLOADED', 'PHOTO_VIEWED', 'PHOTO_DELETED', 'TREATMENT_PLAN_CREATED', 'TREATMENT_PLAN_UPDATED', 'TREATMENT_PLAN_VIEWED');

-- CreateEnum
CREATE TYPE "BodyRegion" AS ENUM ('FOREHEAD', 'GLABELLA', 'PERIORBITAL', 'CHEEKS', 'NASOLABIAL', 'LIPS', 'CHIN', 'JAWLINE', 'NECK', 'DECOLLETE', 'HANDS', 'SCALP', 'OTHER');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('BEFORE', 'AFTER');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE_TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('BOTOX', 'FILLER', 'LASER', 'CHEMICAL_PEEL', 'MICRONEEDLING', 'PRP');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'FILLED', 'SIGNED', 'PAID', 'COMPLETED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "practices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dsgvo_contact" TEXT NOT NULL,
    "stripe_connect_id" TEXT,
    "public_key" JSONB NOT NULL,
    "encrypted_priv_key" JSONB NOT NULL,
    "gdt_sender_id" TEXT NOT NULL DEFAULT 'DERMACONSENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "password_hash" TEXT,
    "practice_id" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invites" (
    "id" TEXT NOT NULL,
    "practice_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "practice_id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE_TRIAL',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "trial_ends_at" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "practice_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_settings" (
    "id" TEXT NOT NULL,
    "practice_id" TEXT NOT NULL,
    "logo_url" TEXT,
    "default_consent_expiry" INTEGER NOT NULL DEFAULT 7,
    "enabled_consent_types" JSONB NOT NULL DEFAULT '["BOTOX","FILLER","LASER","CHEMICAL_PEEL","MICRONEEDLING","PRP"]',
    "brand_color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practice_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "practice_id" TEXT NOT NULL,
    "encrypted_name" TEXT NOT NULL,
    "encrypted_dob" TEXT,
    "encrypted_email" TEXT,
    "lookup_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_forms" (
    "id" TEXT NOT NULL,
    "practice_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "type" "ConsentType" NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "encrypted_responses" JSONB,
    "encrypted_session_key" TEXT,
    "signature_ip" TEXT,
    "signature_timestamp" TIMESTAMP(3),
    "signature_user_agent" TEXT,
    "stripe_session_id" TEXT,
    "stripe_payment_intent" TEXT,
    "pdf_storage_path" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consent_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_photos" (
    "id" TEXT NOT NULL,
    "practice_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "consent_form_id" TEXT,
    "treatment_plan_id" TEXT,
    "type" "PhotoType" NOT NULL,
    "body_region" "BodyRegion" NOT NULL,
    "encrypted_session_key" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "encrypted_metadata" JSONB,
    "photo_consent_granted" BOOLEAN NOT NULL DEFAULT false,
    "taken_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatment_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_plans" (
    "id" TEXT NOT NULL,
    "practice_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "consent_form_id" TEXT,
    "template_id" TEXT,
    "type" "ConsentType" NOT NULL,
    "encrypted_session_key" TEXT NOT NULL,
    "encrypted_data" JSONB NOT NULL,
    "encrypted_summary" JSONB,
    "performed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_templates" (
    "id" TEXT NOT NULL,
    "practice_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "body_region" "BodyRegion" NOT NULL,
    "template_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "invites_token_key" ON "invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_practice_id_key" ON "subscriptions"("practice_id");

-- CreateIndex
CREATE INDEX "audit_logs_practice_id_created_at_idx" ON "audit_logs"("practice_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "practice_settings_practice_id_key" ON "practice_settings"("practice_id");

-- CreateIndex
CREATE UNIQUE INDEX "patients_practice_id_lookup_hash_key" ON "patients"("practice_id", "lookup_hash");

-- CreateIndex
CREATE UNIQUE INDEX "consent_forms_token_key" ON "consent_forms"("token");

-- CreateIndex
CREATE INDEX "consent_forms_token_idx" ON "consent_forms"("token");

-- CreateIndex
CREATE INDEX "consent_forms_practice_id_status_idx" ON "consent_forms"("practice_id", "status");

-- CreateIndex
CREATE INDEX "treatment_photos_practice_id_patient_id_idx" ON "treatment_photos"("practice_id", "patient_id");

-- CreateIndex
CREATE INDEX "treatment_photos_patient_id_type_body_region_idx" ON "treatment_photos"("patient_id", "type", "body_region");

-- CreateIndex
CREATE INDEX "treatment_plans_practice_id_patient_id_idx" ON "treatment_plans"("practice_id", "patient_id");

-- CreateIndex
CREATE INDEX "treatment_plans_patient_id_type_idx" ON "treatment_plans"("patient_id", "type");

-- CreateIndex
CREATE INDEX "treatment_templates_practice_id_type_idx" ON "treatment_templates"("practice_id", "type");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_settings" ADD CONSTRAINT "practice_settings_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_forms" ADD CONSTRAINT "consent_forms_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_forms" ADD CONSTRAINT "consent_forms_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_photos" ADD CONSTRAINT "treatment_photos_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_photos" ADD CONSTRAINT "treatment_photos_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_photos" ADD CONSTRAINT "treatment_photos_consent_form_id_fkey" FOREIGN KEY ("consent_form_id") REFERENCES "consent_forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_photos" ADD CONSTRAINT "treatment_photos_treatment_plan_id_fkey" FOREIGN KEY ("treatment_plan_id") REFERENCES "treatment_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_consent_form_id_fkey" FOREIGN KEY ("consent_form_id") REFERENCES "consent_forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "treatment_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_templates" ADD CONSTRAINT "treatment_templates_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

