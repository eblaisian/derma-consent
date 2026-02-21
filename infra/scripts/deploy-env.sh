#!/usr/bin/env bash
set -euo pipefail

# Reusable deploy script for staging and production environments.
# Called by the GitHub Actions deploy workflow.
#
# Usage:
#   deploy-env.sh \
#     --namespace <ns> \
#     --overlay <staging|prod> \
#     --backend-image <image:tag> \
#     --frontend-image <image:tag>
#
# Optional:
#   --ingress-host <hostname>   # Only for staging overlay

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "$SCRIPT_DIR/../kubernetes" && pwd)"

# Parse arguments
NAMESPACE=""
OVERLAY=""
BACKEND_IMAGE=""
FRONTEND_IMAGE=""
INGRESS_HOST=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --namespace) NAMESPACE="$2"; shift 2 ;;
    --overlay) OVERLAY="$2"; shift 2 ;;
    --backend-image) BACKEND_IMAGE="$2"; shift 2 ;;
    --frontend-image) FRONTEND_IMAGE="$2"; shift 2 ;;
    --ingress-host) INGRESS_HOST="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# Validate required args
for var in NAMESPACE OVERLAY BACKEND_IMAGE FRONTEND_IMAGE; do
  if [ -z "${!var}" ]; then
    echo "ERROR: --$(echo $var | tr '[:upper:]' '[:lower:]' | tr '_' '-') is required"
    exit 1
  fi
done

OVERLAY_DIR="$INFRA_DIR/overlays/$OVERLAY"

if [ ! -d "$OVERLAY_DIR" ]; then
  echo "ERROR: Overlay directory not found: $OVERLAY_DIR"
  exit 1
fi

echo "========================================"
echo " Deploying to: $NAMESPACE ($OVERLAY)"
echo " Backend:  $BACKEND_IMAGE"
echo " Frontend: $FRONTEND_IMAGE"
echo "========================================"

# --- Step 1: Set images in overlay via kustomize ---
echo ""
echo "--- Setting container images ---"
cd "$OVERLAY_DIR"
kustomize edit set image "OCIR_BACKEND_IMAGE=$BACKEND_IMAGE"
kustomize edit set image "OCIR_FRONTEND_IMAGE=$FRONTEND_IMAGE"

# If staging, replace the ingress host placeholder
if [ -n "$INGRESS_HOST" ]; then
  echo "Setting ingress host: $INGRESS_HOST"
  sed -i "s|INGRESS_HOST_PLACEHOLDER|$INGRESS_HOST|g" kustomization.yaml
fi

# --- Step 2: Apply all steady-state resources via kustomize ---
echo ""
echo "--- Applying Kustomize manifests ---"
kustomize build "$OVERLAY_DIR" | kubectl apply -f -

# --- Step 3: Wait for PostgreSQL ---
echo ""
echo "--- Waiting for PostgreSQL ---"
kubectl rollout status statefulset/postgres -n "$NAMESPACE" --timeout=180s

# --- Step 4: Run database migration ---
echo ""
echo "--- Running database migration ---"
kubectl delete job prisma-migrate -n "$NAMESPACE" --ignore-not-found=true

sed "s|OCIR_BACKEND_IMAGE|$BACKEND_IMAGE|g" \
  "$INFRA_DIR/jobs/migration-job.yaml" | kubectl apply -n "$NAMESPACE" -f -

echo "Waiting for migration to complete..."
kubectl wait --for=condition=complete job/prisma-migrate \
  -n "$NAMESPACE" --timeout=120s

# --- Step 5: Wait for backend rollout ---
echo ""
echo "--- Waiting for backend rollout ---"
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=180s

# --- Step 6: Wait for frontend rollout ---
echo ""
echo "--- Waiting for frontend rollout ---"
kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=180s

# --- Done ---
echo ""
echo "========================================"
echo " Deploy complete: $NAMESPACE"
echo "========================================"
echo ""
echo "=== Pods ==="
kubectl get pods -n "$NAMESPACE"
echo ""
echo "=== Services ==="
kubectl get svc -n "$NAMESPACE"
echo ""
echo "=== Ingress ==="
kubectl get ingress -n "$NAMESPACE"
