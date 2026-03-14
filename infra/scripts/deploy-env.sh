#!/usr/bin/env bash
set -euo pipefail

# Deploy script for DigitalOcean Kubernetes.
# Called by the GitHub Actions deploy workflow.
#
# Usage:
#   deploy-env.sh \
#     --namespace <ns> \
#     --overlay <prod> \
#     --backend-image <image:tag> \
#     --frontend-image <image:tag>

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "$SCRIPT_DIR/../kubernetes" && pwd)"

NAMESPACE=""
OVERLAY=""
BACKEND_IMAGE=""
FRONTEND_IMAGE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --namespace) NAMESPACE="$2"; shift 2 ;;
    --overlay) OVERLAY="$2"; shift 2 ;;
    --backend-image) BACKEND_IMAGE="$2"; shift 2 ;;
    --frontend-image) FRONTEND_IMAGE="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

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
kustomize edit set image "BACKEND_IMAGE=$BACKEND_IMAGE"
kustomize edit set image "FRONTEND_IMAGE=$FRONTEND_IMAGE"

# --- Step 2: Run database migration BEFORE deploying new pods ---
# Migration uses the new backend image (has latest Prisma schema).
# Old pods continue serving traffic during migration.
echo ""
echo "--- Running database migration ---"
kubectl delete job prisma-migrate -n "$NAMESPACE" --ignore-not-found=true

sed "s|BACKEND_IMAGE|$BACKEND_IMAGE|g" \
  "$INFRA_DIR/jobs/migration-job.yaml" | kubectl apply -n "$NAMESPACE" -f -

echo "Waiting for migration to complete..."
kubectl wait --for=condition=complete job/prisma-migrate \
  -n "$NAMESPACE" --timeout=300s || {
  echo ""
  echo "ERROR: Migration job failed or timed out"
  echo "=== Job Status ==="
  kubectl describe job/prisma-migrate -n "$NAMESPACE"
  echo "=== Pod Logs ==="
  kubectl logs -n "$NAMESPACE" -l job-name=prisma-migrate --tail=100 || true
  exit 1
}

echo "Migration completed successfully."

# --- Step 3: Apply all manifests via kustomize ---
# With Recreate strategy, old pods are killed then new ones start.
echo ""
echo "--- Applying Kustomize manifests ---"
kustomize build "$OVERLAY_DIR" | kubectl apply -f -

# --- Step 4: Wait for backend rollout ---
echo ""
echo "--- Waiting for backend rollout ---"
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=180s

# --- Step 5: Wait for frontend rollout ---
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
