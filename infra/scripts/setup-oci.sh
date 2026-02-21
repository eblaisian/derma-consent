#!/usr/bin/env bash
set -euo pipefail

# Helper script to verify OCI prerequisites before first deploy.
# Usage: ./infra/scripts/setup-oci.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo "============================================"
echo " Derma Consent - OCI Prerequisites Check"
echo "============================================"
echo ""

ERRORS=0

# Check OCI CLI
if command -v oci &>/dev/null; then
  pass "OCI CLI installed: $(oci --version 2>&1 | head -1)"
else
  fail "OCI CLI not installed. Install: https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm"
  ERRORS=$((ERRORS + 1))
fi

# Check Terraform
if command -v terraform &>/dev/null; then
  TF_VERSION=$(terraform version -json 2>/dev/null | grep -o '"terraform_version":"[^"]*"' | cut -d'"' -f4)
  pass "Terraform installed: v${TF_VERSION}"
else
  fail "Terraform not installed. Install: https://developer.hashicorp.com/terraform/install"
  ERRORS=$((ERRORS + 1))
fi

# Check kubectl
if command -v kubectl &>/dev/null; then
  pass "kubectl installed: $(kubectl version --client --short 2>/dev/null || kubectl version --client 2>/dev/null | head -1)"
else
  fail "kubectl not installed. Install: https://kubernetes.io/docs/tasks/tools/"
  ERRORS=$((ERRORS + 1))
fi

# Check Docker
if command -v docker &>/dev/null; then
  pass "Docker installed: $(docker --version)"
else
  fail "Docker not installed (needed for local builds)"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# Check OCI config
if [ -f "$HOME/.oci/config" ]; then
  pass "OCI config file found at ~/.oci/config"

  # Try to validate the config
  if command -v oci &>/dev/null; then
    if oci iam region list --output table &>/dev/null; then
      pass "OCI CLI authentication works"

      # Check tenancy info
      TENANCY=$(oci iam tenancy get --output json 2>/dev/null | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
      if [ -n "$TENANCY" ]; then
        pass "Connected to tenancy: ${TENANCY}"
      fi

      # Check for Always Free resources
      REGION=$(oci iam region-subscription list --output json 2>/dev/null | grep -o '"region-name":"[^"]*"' | head -1 | cut -d'"' -f4)
      if [ -n "$REGION" ]; then
        pass "Home region: ${REGION}"
      fi
    else
      fail "OCI CLI authentication failed. Run: oci setup config"
      ERRORS=$((ERRORS + 1))
    fi
  fi
else
  warn "OCI config not found at ~/.oci/config. Run: oci setup config"
fi

echo ""

# Check for required environment variables (for CI context)
echo "Checking environment variables (optional for local, required for CI):"
VARS=(
  "OCI_TENANCY_OCID"
  "OCI_USER_OCID"
  "OCI_FINGERPRINT"
  "OCI_REGION"
  "OCI_COMPARTMENT_OCID"
  "OCI_OCIR_NAMESPACE"
)

for VAR in "${VARS[@]}"; do
  if [ -n "${!VAR:-}" ]; then
    pass "$VAR is set"
  else
    warn "$VAR is not set (required as GitHub Secret for CI)"
  fi
done

echo ""
echo "============================================"
if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}${ERRORS} check(s) failed. Fix the issues above before proceeding.${NC}"
  exit 1
else
  echo -e "${GREEN}All prerequisite checks passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Create OCI resources (compartment, API keys, auth token)"
  echo "  2. Copy infra/terraform/terraform.tfvars.example → terraform.tfvars"
  echo "  3. Run: cd infra/terraform && terraform init && terraform plan"
  echo "  4. Add GitHub Secrets (see CLAUDE.md manual setup checklist)"
fi
