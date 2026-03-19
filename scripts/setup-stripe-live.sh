#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# DermaConsent — Stripe LIVE Setup Script
# ─────────────────────────────────────────────────────────────────────────────
#
# Creates Stripe products + prices in LIVE mode and seeds PlatformConfig
# in the production database. Also registers a webhook endpoint.
# Safe to run multiple times — uses lookup-by-name to avoid duplicates.
#
# Prerequisites:
#   1. Stripe LIVE keys in .secrets/stripe-live-config.txt
#   2. Production DATABASE_URL set in environment or .env.production
#   3. stripe CLI installed (brew install stripe/stripe-cli/stripe)
#   4. jq installed (brew install jq)
#
# Usage:
#   ./scripts/setup-stripe-live.sh                        # Full setup
#   ./scripts/setup-stripe-live.sh --db-only              # Skip Stripe API calls, just seed DB
#   ./scripts/setup-stripe-live.sh --dry-run              # Show what would be done
#   ./scripts/setup-stripe-live.sh --set-webhook-secret <whsec_...>  # Update webhook secret only
#
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SECRETS_FILE="$ROOT_DIR/.secrets/stripe-live-config.txt"
ENV_FILE="$ROOT_DIR/.env.production"
BACKEND_DIR="$ROOT_DIR/packages/backend"

# Webhook endpoint URLs
WEBHOOK_URL_BILLING="https://api.consent.eblaisian.com/api/billing/webhook"
WEBHOOK_URL_CONNECT="https://api.consent.eblaisian.com/api/stripe/webhook"

DB_ONLY=false
DRY_RUN=false
SET_WEBHOOK=false
WEBHOOK_ARG=""

case "${1:-}" in
  --db-only)    DB_ONLY=true ;;
  --dry-run)    DRY_RUN=true ;;
  --set-webhook-secret)
    SET_WEBHOOK=true
    WEBHOOK_ARG="${2:-}"
    ;;
esac

# ── Colors ──────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${BLUE}→${NC} $1"; }
ok()    { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
err()   { echo -e "${RED}✗${NC} $1"; exit 1; }

# ── Preflight checks ───────────────────────────────────────────────────────

echo -e "\n${RED}${BOLD}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}${BOLD}║         DermaConsent — Stripe LIVE Setup              ║${NC}"
echo -e "${RED}${BOLD}║         THIS USES REAL MONEY / PRODUCTION             ║${NC}"
echo -e "${RED}${BOLD}╚═══════════════════════════════════════════════════════╝${NC}\n"

if [[ "$DRY_RUN" == true ]]; then
  warn "DRY RUN mode — no changes will be made"
  echo ""
fi

# Check stripe CLI
if ! command -v stripe &>/dev/null; then
  err "Stripe CLI not installed. Run: brew install stripe/stripe-cli/stripe"
fi

# Check jq
if ! command -v jq &>/dev/null; then
  err "jq not installed. Run: brew install jq"
fi

# Check secrets file
if [[ ! -f "$SECRETS_FILE" ]]; then
  err "Missing $SECRETS_FILE — create it with your LIVE keys:\n  Publishable key: pk_live_...\n  Secret key: sk_live_..."
fi

# Parse keys from secrets file
STRIPE_PK=$(grep -i 'publishable' "$SECRETS_FILE" | sed 's/.*: *//')
STRIPE_SK=$(grep -i 'secret' "$SECRETS_FILE" | grep -iv 'webhook' | sed 's/.*: *//')

if [[ -z "$STRIPE_PK" || -z "$STRIPE_SK" ]]; then
  err "Could not parse keys from $SECRETS_FILE"
fi

if [[ "$STRIPE_SK" == sk_test_* ]]; then
  err "TEST key detected! This script requires LIVE keys (sk_live_...). Use setup-stripe.sh for sandbox."
fi

if [[ "$STRIPE_SK" != sk_live_* ]]; then
  err "Key does not start with sk_live_. Verify your keys in $SECRETS_FILE"
fi

ok "Live keys loaded (${STRIPE_SK:0:12}...)"

# Confirmation prompt
if [[ "$DRY_RUN" == false ]]; then
  echo ""
  echo -e "${YELLOW}${BOLD}You are about to modify your LIVE Stripe account and production database.${NC}"
  echo -e "${YELLOW}This will create real products, prices, and webhook endpoints.${NC}"
  echo ""
  read -p "Type 'yes' to continue: " CONFIRM
  if [[ "$CONFIRM" != "yes" ]]; then
    err "Aborted by user"
  fi
  echo ""
fi

# Check DB is reachable
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

# Also try the regular .env if .env.production doesn't have DATABASE_URL
if [[ -z "${DATABASE_URL:-}" && -f "$ROOT_DIR/.env" ]]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

DATABASE_URL="${DATABASE_URL:-}"

if [[ -z "$DATABASE_URL" ]]; then
  err "DATABASE_URL not set. Set it in .env.production or export it."
fi

if [[ "$DRY_RUN" == false ]]; then
  if ! psql "$DATABASE_URL" -c "SELECT 1" &>/dev/null 2>&1; then
    err "Cannot connect to PostgreSQL at: ${DATABASE_URL%%@*}@..."
  fi
  ok "Database reachable"
else
  info "Skipping DB check (dry-run mode)"
fi

# ── Handle --set-webhook-secret (quick path) ───────────────────────────────

encrypt_and_store() {
  local key="$1" value="$2" desc="$3" category="${4:-stripe}"
  local stored_value
  local enc_key=""

  if [[ -n "${PLATFORM_ENCRYPTION_KEY:-}" ]]; then
    enc_key="$PLATFORM_ENCRYPTION_KEY"
  elif [[ -f "$ENV_FILE" ]]; then
    enc_key=$(grep PLATFORM_ENCRYPTION_KEY "$ENV_FILE" 2>/dev/null | head -1 | sed 's/.*=//' || true)
  fi

  if [[ -z "$enc_key" ]]; then
    stored_value=$(echo -n "$value" | base64)
  else
    stored_value=$(node -e "
      const crypto = require('crypto');
      const key = crypto.createHash('sha256').update('$enc_key').digest();
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const encrypted = Buffer.concat([cipher.update('$value', 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();
      console.log(iv.toString('base64') + ':' + tag.toString('base64') + ':' + encrypted.toString('base64'));
    ")
  fi

  psql "$DATABASE_URL" -q -c "
    INSERT INTO platform_config (id, key, value, is_secret, description, category, created_at, updated_at)
    VALUES (gen_random_uuid(), '$key', '$stored_value', true, '$desc', '$category', NOW(), NOW())
    ON CONFLICT (key) DO UPDATE SET value = '$stored_value', updated_at = NOW();
  " 2>/dev/null
}

if [[ "$SET_WEBHOOK" == true ]]; then
  if [[ -z "$WEBHOOK_ARG" ]]; then
    err "Usage: ./scripts/setup-stripe-live.sh --set-webhook-secret <whsec_...>"
  fi

  encrypt_and_store "stripe.webhookSecret"              "$WEBHOOK_ARG" "Stripe Webhook Signing Secret"
  encrypt_and_store "stripe.subscriptionWebhookSecret"  "$WEBHOOK_ARG" "Stripe Subscription Webhook Secret"
  encrypt_and_store "stripe.connectWebhookSecret"       "$WEBHOOK_ARG" "Stripe Connect Webhook Secret"
  ok "Webhook secrets updated: ${WEBHOOK_ARG:0:12}..."
  exit 0
fi

# ── Step 1: Create Stripe Products & Prices (idempotent) ───────────────────

if [[ "$DB_ONLY" == false ]]; then
  info "Setting up Stripe LIVE products and prices..."

  # Helper: find or create a product by name, return product ID
  find_or_create_product() {
    local name="$1"
    local description="$2"

    local existing
    existing=$(stripe products list --limit 100 --api-key "$STRIPE_SK" 2>/dev/null \
      | jq -r ".data[] | select(.name == \"$name\" and .active == true) | .id" | head -1)

    if [[ -n "$existing" ]]; then
      echo "$existing"
      return
    fi

    if [[ "$DRY_RUN" == true ]]; then
      echo "DRY_RUN_PRODUCT_${name// /_}"
      return
    fi

    local created
    created=$(stripe products create \
      --api-key "$STRIPE_SK" \
      -d "name=$name" \
      -d "description=$description" \
      2>/dev/null | jq -r '.id')

    echo "$created"
  }

  # Helper: find or create a price for a product, return price ID
  find_or_create_price() {
    local product_id="$1"
    local amount="$2"
    local interval="$3"
    local nickname="$4"

    if [[ "$product_id" == DRY_RUN_* ]]; then
      echo "DRY_RUN_PRICE_${nickname// /_}"
      return
    fi

    local existing
    existing=$(stripe prices list --product "$product_id" --limit 100 --api-key "$STRIPE_SK" 2>/dev/null \
      | jq -r ".data[] | select(.unit_amount == $amount and .recurring.interval == \"$interval\" and .active == true) | .id" | head -1)

    if [[ -n "$existing" ]]; then
      echo "$existing"
      return
    fi

    if [[ "$DRY_RUN" == true ]]; then
      echo "DRY_RUN_PRICE_${nickname// /_}"
      return
    fi

    local created
    created=$(stripe prices create \
      --api-key "$STRIPE_SK" \
      -d "product=$product_id" \
      -d "unit_amount=$amount" \
      -d "currency=eur" \
      -d "recurring[interval]=$interval" \
      -d "nickname=$nickname" \
      2>/dev/null | jq -r '.id')

    echo "$created"
  }

  # --- Starter Plan ---
  info "  Starter plan..."
  STARTER_PRODUCT=$(find_or_create_product "DermaConsent Starter" "Up to 100 consents/month, 3 team members")
  STARTER_MONTHLY=$(find_or_create_price "$STARTER_PRODUCT" 4900 month "Starter Monthly")
  STARTER_YEARLY=$(find_or_create_price "$STARTER_PRODUCT" 47000 year "Starter Yearly")
  ok "  Starter: monthly=$STARTER_MONTHLY yearly=$STARTER_YEARLY"

  # --- Professional Plan ---
  info "  Professional plan..."
  PRO_PRODUCT=$(find_or_create_product "DermaConsent Professional" "Unlimited consents, 10 team members, priority support")
  PRO_MONTHLY=$(find_or_create_price "$PRO_PRODUCT" 9900 month "Professional Monthly")
  PRO_YEARLY=$(find_or_create_price "$PRO_PRODUCT" 95000 year "Professional Yearly")
  ok "  Professional: monthly=$PRO_MONTHLY yearly=$PRO_YEARLY"

  # --- Enterprise Plan ---
  info "  Enterprise plan..."
  ENT_PRODUCT=$(find_or_create_product "DermaConsent Enterprise" "Unlimited everything, dedicated support, custom integrations")
  ENT_MONTHLY=$(find_or_create_price "$ENT_PRODUCT" 19900 month "Enterprise Monthly")
  ENT_YEARLY=$(find_or_create_price "$ENT_PRODUCT" 199000 year "Enterprise Yearly")
  ok "  Enterprise: monthly=$ENT_MONTHLY yearly=$ENT_YEARLY"

  echo ""

  # ── Step 2: Create Webhook Endpoints ──────────────────────────────────────

  info "Setting up webhook endpoints..."

  # Events needed by the billing webhook controller
  BILLING_EVENTS="customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.payment_failed"

  # Events needed by the connect/payments webhook controller
  CONNECT_EVENTS="checkout.session.completed,charge.refunded,charge.dispute.created"

  create_or_find_webhook() {
    local url="$1"
    local events="$2"
    local description="$3"

    # Check if webhook endpoint already exists for this URL
    local existing
    existing=$(stripe webhook_endpoints list --limit 100 --api-key "$STRIPE_SK" 2>/dev/null \
      | jq -r ".data[] | select(.url == \"$url\" and .status == \"enabled\") | .id" | head -1)

    if [[ -n "$existing" ]]; then
      ok "  Webhook already exists for $url (${existing})"
      # Retrieve the secret for existing endpoint — not possible via CLI,
      # user must get it from Stripe Dashboard
      echo "$existing"
      return
    fi

    if [[ "$DRY_RUN" == true ]]; then
      info "  [DRY RUN] Would create webhook: $url"
      info "            Events: $events"
      echo "DRY_RUN_WEBHOOK"
      return
    fi

    # Build the -d enabled_events[] params
    local event_params=""
    IFS=',' read -ra EVENT_ARRAY <<< "$events"
    for evt in "${EVENT_ARRAY[@]}"; do
      event_params="$event_params -d enabled_events[]=$evt"
    done

    local result
    result=$(eval stripe webhook_endpoints create \
      --api-key "$STRIPE_SK" \
      -d "url=$url" \
      -d "description=$description" \
      $event_params \
      2>/dev/null)

    local endpoint_id
    endpoint_id=$(echo "$result" | jq -r '.id')
    local endpoint_secret
    endpoint_secret=$(echo "$result" | jq -r '.secret // empty')

    ok "  Created webhook: $url ($endpoint_id)"

    if [[ -n "$endpoint_secret" ]]; then
      echo "$endpoint_secret"
    else
      echo "$endpoint_id"
    fi
  }

  BILLING_WH_RESULT=$(create_or_find_webhook "$WEBHOOK_URL_BILLING" "$BILLING_EVENTS" "DermaConsent Billing Webhooks")
  CONNECT_WH_RESULT=$(create_or_find_webhook "$WEBHOOK_URL_CONNECT" "$CONNECT_EVENTS" "DermaConsent Connect/Payment Webhooks")

  echo ""

  # If we got webhook secrets back (from creation), save them
  if [[ "$BILLING_WH_RESULT" == whsec_* ]]; then
    info "Saving webhook secrets to database..."
    encrypt_and_store "stripe.subscriptionWebhookSecret" "$BILLING_WH_RESULT" "Stripe Subscription Webhook Secret"
    ok "  Billing webhook secret saved"
  fi

  if [[ "$CONNECT_WH_RESULT" == whsec_* ]]; then
    encrypt_and_store "stripe.connectWebhookSecret" "$CONNECT_WH_RESULT" "Stripe Connect Webhook Secret"
    ok "  Connect webhook secret saved"
  fi

  # If secrets weren't returned (existing endpoints), remind user
  if [[ "$BILLING_WH_RESULT" != whsec_* || "$CONNECT_WH_RESULT" != whsec_* ]]; then
    warn "Some webhook secrets could not be retrieved automatically."
    warn "Go to https://dashboard.stripe.com/webhooks to find the signing secrets,"
    warn "then run:"
    warn "  ./scripts/setup-stripe-live.sh --set-webhook-secret <whsec_...>"
    echo ""
  fi

else
  # --db-only mode: prompt for price IDs
  echo -e "${BOLD}DB-only mode: enter your existing Stripe price IDs${NC}"
  echo ""
  read -p "Starter Monthly price ID (price_...): " STARTER_MONTHLY
  read -p "Starter Yearly price ID (price_...): " STARTER_YEARLY
  read -p "Professional Monthly price ID (price_...): " PRO_MONTHLY
  read -p "Professional Yearly price ID (price_...): " PRO_YEARLY
  read -p "Enterprise Monthly price ID (price_...): " ENT_MONTHLY
  read -p "Enterprise Yearly price ID (price_...): " ENT_YEARLY
  echo ""
fi

# ── Step 3: Seed PlatformConfig in the database ────────────────────────────

if [[ "$DRY_RUN" == true ]]; then
  info "[DRY RUN] Would seed the following PlatformConfig rows:"
  echo "    stripe.secretKey = ••••••••"
  echo "    stripe.publishableKey = ${STRIPE_PK:0:20}..."
  echo "    stripe.starterMonthlyPriceId = $STARTER_MONTHLY"
  echo "    stripe.starterYearlyPriceId = $STARTER_YEARLY"
  echo "    stripe.professionalMonthlyPriceId = $PRO_MONTHLY"
  echo "    stripe.professionalYearlyPriceId = $PRO_YEARLY"
  echo "    stripe.enterpriseMonthlyPriceId = $ENT_MONTHLY"
  echo "    stripe.enterpriseYearlyPriceId = $ENT_YEARLY"
  echo "    stripe.platformFeePercent = 5"
  echo ""
  ok "Dry run complete — no changes made"
  exit 0
fi

info "Seeding PlatformConfig in database..."

# Helper: upsert a non-secret platform_config row
upsert_config() {
  local key="$1"
  local value="$2"
  local is_secret="$3"
  local description="$4"
  local category="$5"

  local stored_value="$value"
  if [[ "$is_secret" == "true" ]]; then
    local enc_key=""
    if [[ -n "${PLATFORM_ENCRYPTION_KEY:-}" ]]; then
      enc_key="$PLATFORM_ENCRYPTION_KEY"
    elif [[ -f "$ENV_FILE" ]]; then
      enc_key=$(grep PLATFORM_ENCRYPTION_KEY "$ENV_FILE" 2>/dev/null | head -1 | sed 's/.*=//' || true)
    fi
    if [[ -z "$enc_key" ]]; then
      stored_value=$(echo -n "$value" | base64)
    else
      stored_value=$(node -e "
        const crypto = require('crypto');
        const key = crypto.createHash('sha256').update('$enc_key').digest();
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([cipher.update('$value', 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        console.log(iv.toString('base64') + ':' + tag.toString('base64') + ':' + encrypted.toString('base64'));
      ")
    fi
  fi

  psql "$DATABASE_URL" -q -c "
    INSERT INTO platform_config (id, key, value, is_secret, description, category, created_at, updated_at)
    VALUES (gen_random_uuid(), '$key', '$stored_value', $is_secret, '$description', '$category', NOW(), NOW())
    ON CONFLICT (key) DO UPDATE SET
      value = '$stored_value',
      is_secret = $is_secret,
      description = '$description',
      category = '$category',
      updated_at = NOW();
  " 2>/dev/null

  if [[ "$is_secret" == "true" ]]; then
    echo -e "    ${GREEN}✓${NC} $key = ••••••••"
  else
    echo -e "    ${GREEN}✓${NC} $key = $value"
  fi
}

upsert_config "stripe.secretKey"                  "$STRIPE_SK"        "true"  "Stripe Live Secret API Key"         "stripe"
upsert_config "stripe.publishableKey"             "$STRIPE_PK"        "false" "Stripe Live Publishable Key"        "stripe"
upsert_config "stripe.starterMonthlyPriceId"      "$STARTER_MONTHLY"  "false" "Starter Monthly Price ID"           "stripe"
upsert_config "stripe.starterYearlyPriceId"       "$STARTER_YEARLY"   "false" "Starter Yearly Price ID"            "stripe"
upsert_config "stripe.professionalMonthlyPriceId" "$PRO_MONTHLY"      "false" "Professional Monthly Price ID"      "stripe"
upsert_config "stripe.professionalYearlyPriceId"  "$PRO_YEARLY"       "false" "Professional Yearly Price ID"       "stripe"
upsert_config "stripe.enterpriseMonthlyPriceId"   "$ENT_MONTHLY"      "false" "Enterprise Monthly Price ID"        "stripe"
upsert_config "stripe.enterpriseYearlyPriceId"    "$ENT_YEARLY"       "false" "Enterprise Yearly Price ID"         "stripe"
upsert_config "stripe.platformFeePercent"         "5"                 "false" "Platform Fee Percentage"            "stripe"

echo ""

# ── Done ────────────────────────────────────────────────────────────────────

echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  Stripe LIVE setup complete!${NC}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}What was configured:${NC}"
echo -e "    • 3 products with monthly + yearly prices"
echo -e "    • Webhook endpoints registered"
echo -e "    • PlatformConfig seeded in database"
echo ""
echo -e "  ${BOLD}Webhook endpoints:${NC}"
echo -e "    • $WEBHOOK_URL_BILLING  (subscriptions)"
echo -e "    • $WEBHOOK_URL_CONNECT  (connect/payments)"
echo ""
echo -e "  ${BOLD}Next steps:${NC}"
echo -e "    1. Verify webhooks at ${BLUE}https://dashboard.stripe.com/webhooks${NC}"
echo -e "    2. If webhook secrets weren't auto-saved, get them from the dashboard and run:"
echo -e "       ./scripts/setup-stripe-live.sh --set-webhook-secret <whsec_...>"
echo -e "    3. Deploy the backend so webhook URLs are reachable"
echo -e "    4. Send a test event from the Stripe dashboard to verify"
echo ""
