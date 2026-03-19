#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# DermaConsent — Stripe Sandbox Setup Script
# ─────────────────────────────────────────────────────────────────────────────
#
# Creates Stripe products + prices and seeds PlatformConfig in the local DB.
# Safe to run multiple times — uses lookup-by-name to avoid duplicates.
#
# Prerequisites:
#   1. Stripe sandbox keys in .secrets/stripe-sandbox-config.txt
#   2. PostgreSQL running (make db)
#   3. Migrations applied (make migrate)
#   4. stripe CLI installed (brew install stripe/stripe-cli/stripe)
#
# Usage:
#   ./scripts/setup-stripe.sh              # Full setup (products + DB + webhooks)
#   ./scripts/setup-stripe.sh --no-listen  # Skip starting webhook listeners
#
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SECRETS_FILE="$ROOT_DIR/.secrets/stripe-sandbox-config.txt"
ENV_FILE="$ROOT_DIR/.env"
BACKEND_DIR="$ROOT_DIR/packages/backend"

NO_LISTEN=false
SET_WEBHOOK=false
WEBHOOK_ARG=""

case "${1:-}" in
  --no-listen)   NO_LISTEN=true ;;
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

echo -e "\n${BOLD}DermaConsent — Stripe Sandbox Setup${NC}\n"

# Check stripe CLI
if ! command -v stripe &>/dev/null; then
  err "Stripe CLI not installed. Run: brew install stripe/stripe-cli/stripe"
fi

# Check secrets file
if [[ ! -f "$SECRETS_FILE" ]]; then
  err "Missing $SECRETS_FILE — create it with your sandbox keys:\n  Publishable key: pk_test_...\n  secret key: sk_test_..."
fi

# Parse keys from secrets file
STRIPE_PK=$(grep -i 'publishable' "$SECRETS_FILE" | sed 's/.*: *//')
STRIPE_SK=$(grep -i 'secret' "$SECRETS_FILE" | sed 's/.*: *//')

if [[ -z "$STRIPE_PK" || -z "$STRIPE_SK" ]]; then
  err "Could not parse keys from $SECRETS_FILE"
fi

if [[ "$STRIPE_SK" == sk_live_* ]]; then
  err "LIVE key detected! This script requires sandbox/test keys (sk_test_...)"
fi

ok "Sandbox keys loaded (${STRIPE_SK:0:12}...)"

# Check DB is reachable
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/derma_consent}"

if ! psql "$DATABASE_URL" -c "SELECT 1" &>/dev/null 2>&1; then
  err "Cannot connect to PostgreSQL. Run: make db"
fi
ok "Database reachable"

# ── Handle --set-webhook-secret (quick path) ───────────────────────────────

if [[ "$SET_WEBHOOK" == true ]]; then
  if [[ -z "$WEBHOOK_ARG" ]]; then
    err "Usage: ./scripts/setup-stripe.sh --set-webhook-secret <whsec_...>"
  fi

  # Need the upsert_config function — define it inline here for the quick path
  set_webhook_config() {
    local key="$1" value="$2" desc="$3"
    local stored_value
    local enc_key=""
    if [[ -f "$ENV_FILE" ]]; then
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
      VALUES (gen_random_uuid(), '$key', '$stored_value', true, '$desc', 'stripe', NOW(), NOW())
      ON CONFLICT (key) DO UPDATE SET value = '$stored_value', updated_at = NOW();
    " 2>/dev/null
  }

  set_webhook_config "stripe.webhookSecret"              "$WEBHOOK_ARG" "Stripe Webhook Signing Secret"
  set_webhook_config "stripe.subscriptionWebhookSecret"  "$WEBHOOK_ARG" "Stripe Subscription Webhook Secret"
  set_webhook_config "stripe.connectWebhookSecret"       "$WEBHOOK_ARG" "Stripe Connect Webhook Secret"
  ok "Webhook secrets updated: ${WEBHOOK_ARG:0:12}..."
  exit 0
fi

# ── Step 1: Create Stripe Products & Prices (idempotent) ───────────────────

info "Setting up Stripe products and prices..."

# Helper: find or create a product by name, return product ID
find_or_create_product() {
  local name="$1"
  local description="$2"

  # Search for existing product by name
  local existing
  existing=$(stripe products list --limit 100 --api-key "$STRIPE_SK" 2>/dev/null \
    | jq -r ".data[] | select(.name == \"$name\" and .active == true) | .id" | head -1)

  if [[ -n "$existing" ]]; then
    echo "$existing"
    return
  fi

  # Create new product
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
  local amount="$2"       # in cents
  local interval="$3"     # month or year
  local nickname="$4"

  # Search for existing price
  local existing
  existing=$(stripe prices list --product "$product_id" --limit 100 --api-key "$STRIPE_SK" 2>/dev/null \
    | jq -r ".data[] | select(.unit_amount == $amount and .recurring.interval == \"$interval\" and .active == true) | .id" | head -1)

  if [[ -n "$existing" ]]; then
    echo "$existing"
    return
  fi

  # Create new price
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

# ── Step 2: Seed PlatformConfig in the database ────────────────────────────

info "Seeding PlatformConfig in database..."

# Helper: upsert a platform_config row
upsert_config() {
  local key="$1"
  local value="$2"
  local is_secret="$3"
  local description="$4"
  local category="$5"

  # For secrets, store as base64 (matches PlatformConfigService behavior when no PLATFORM_ENCRYPTION_KEY)
  local stored_value="$value"
  if [[ "$is_secret" == "true" ]]; then
    # Check if PLATFORM_ENCRYPTION_KEY is set — if not, use base64
    local enc_key=""
    if [[ -f "$ENV_FILE" ]]; then
      enc_key=$(grep PLATFORM_ENCRYPTION_KEY "$ENV_FILE" 2>/dev/null | head -1 | sed 's/.*=//' || true)
    fi
    if [[ -z "$enc_key" ]]; then
      stored_value=$(echo -n "$value" | base64)
    else
      # When encryption key exists, we can't easily replicate AES-256-GCM from bash.
      # Instead, we'll use a Node.js one-liner via the backend.
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

upsert_config "stripe.secretKey"                  "$STRIPE_SK"        "true"  "Stripe Secret API Key"              "stripe"
upsert_config "stripe.starterMonthlyPriceId"      "$STARTER_MONTHLY"  "false" "Starter Monthly Price ID"           "stripe"
upsert_config "stripe.starterYearlyPriceId"       "$STARTER_YEARLY"   "false" "Starter Yearly Price ID"            "stripe"
upsert_config "stripe.professionalMonthlyPriceId" "$PRO_MONTHLY"      "false" "Professional Monthly Price ID"      "stripe"
upsert_config "stripe.professionalYearlyPriceId"  "$PRO_YEARLY"       "false" "Professional Yearly Price ID"       "stripe"
upsert_config "stripe.enterpriseMonthlyPriceId"   "$ENT_MONTHLY"      "false" "Enterprise Monthly Price ID"        "stripe"
upsert_config "stripe.enterpriseYearlyPriceId"    "$ENT_YEARLY"       "false" "Enterprise Yearly Price ID"         "stripe"
upsert_config "stripe.platformFeePercent"         "5"                 "false" "Platform Fee Percentage"             "stripe"

echo ""

# ── Step 3: Webhook forwarding ─────────────────────────────────────────────

if [[ "$NO_LISTEN" == true ]]; then
  ok "Stripe setup complete (webhook listeners skipped)"
  echo ""
  echo -e "${BOLD}To start webhook forwarding manually:${NC}"
  echo "  stripe listen --forward-to localhost:3001/api/billing/webhook --forward-to localhost:3001/api/stripe/webhook"
  echo ""
  echo -e "${YELLOW}After starting, copy the whsec_... secret and run:${NC}"
  echo "  ./scripts/setup-stripe.sh --set-webhook-secret <whsec_...>"
  exit 0
fi

info "Starting Stripe webhook forwarding..."
echo ""
echo -e "${BOLD}Starting stripe listen in the background...${NC}"
echo -e "Events will be forwarded to:"
echo -e "  • localhost:3001/api/billing/webhook  (subscriptions)"
echo -e "  • localhost:3001/api/stripe/webhook   (connect/payments)"
echo ""

# Start stripe listen, capture the webhook secret from its output
WEBHOOK_LOG=$(mktemp)

stripe listen \
  --api-key "$STRIPE_SK" \
  --forward-to localhost:3001/api/billing/webhook \
  --forward-to localhost:3001/api/stripe/webhook \
  > "$WEBHOOK_LOG" 2>&1 &

STRIPE_PID=$!

# Wait for the webhook secret to appear in output (max 15s)
WEBHOOK_SECRET=""
for i in $(seq 1 30); do
  if grep -q "whsec_" "$WEBHOOK_LOG" 2>/dev/null; then
    WEBHOOK_SECRET=$(grep -o 'whsec_[A-Za-z0-9]*' "$WEBHOOK_LOG" | head -1)
    break
  fi
  sleep 0.5
done

if [[ -z "$WEBHOOK_SECRET" ]]; then
  warn "Could not capture webhook secret automatically."
  warn "Check output: cat $WEBHOOK_LOG"
  warn "Then run: ./scripts/setup-stripe.sh --set-webhook-secret <whsec_...>"
else
  # Seed webhook secrets into DB
  upsert_config "stripe.webhookSecret"              "$WEBHOOK_SECRET" "true" "Stripe Webhook Signing Secret"              "stripe"
  upsert_config "stripe.subscriptionWebhookSecret"  "$WEBHOOK_SECRET" "true" "Stripe Subscription Webhook Secret"         "stripe"
  upsert_config "stripe.connectWebhookSecret"       "$WEBHOOK_SECRET" "true" "Stripe Connect Webhook Secret"              "stripe"
  ok "Webhook secret saved to DB: ${WEBHOOK_SECRET:0:12}..."
fi

echo ""
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  Stripe sandbox setup complete!${NC}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}Stripe webhook listener:${NC} PID $STRIPE_PID (kill $STRIPE_PID to stop)"
echo -e "  ${BOLD}Webhook log:${NC}            $WEBHOOK_LOG"
echo ""
echo -e "  ${BOLD}Test the flow:${NC}"
echo -e "    1. make dev"
echo -e "    2. Login as admin@praxis-mueller.de / Test1234!"
echo -e "    3. Go to /billing → upgrade"
echo -e "    4. Use test card: 4242 4242 4242 4242"
echo ""
echo -e "  ${BOLD}Trigger a test event:${NC}"
echo -e "    stripe trigger payment_intent.succeeded --api-key $STRIPE_SK"
echo ""

# Keep running (webhook listener in background)
wait $STRIPE_PID 2>/dev/null || true
