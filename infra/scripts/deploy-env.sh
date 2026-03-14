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
#
# Migration runs as an initContainer on the backend deployment.
# No separate Job needed — same image pull, no scheduling conflicts.

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

# --- Step 2: Apply all manifests via kustomize ---
# Migration runs as an initContainer on the backend pod (same image pull).
# With Recreate strategy: old pod killed → new pod starts → initContainer
# runs migration → main container starts serving traffic.
echo ""
echo "--- Applying Kustomize manifests ---"
kustomize build "$OVERLAY_DIR" | kubectl apply -f -

# --- Step 3: Wait for backend rollout (includes migration via initContainer) ---
echo ""
echo "--- Waiting for backend rollout (migration runs as init container) ---"
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=600s || {
  echo ""
  echo "ERROR: Backend rollout failed"
  echo "=== Pod Status ==="
  kubectl get pods -n "$NAMESPACE" -l app=backend -o wide
  echo "=== Pod Events ==="
  kubectl describe pods -n "$NAMESPACE" -l app=backend | tail -30
  echo "=== Init Container Logs (migration) ==="
  kubectl logs -n "$NAMESPACE" -l app=backend -c migrate --tail=100 || true
  echo "=== Main Container Logs ==="
  kubectl logs -n "$NAMESPACE" -l app=backend -c backend --tail=50 || true
  exit 1
}

# --- Step 4: Wait for frontend rollout ---
echo ""
echo "--- Waiting for frontend rollout ---"
kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=300s || {
  echo ""
  echo "ERROR: Frontend rollout failed"
  echo "=== Pod Status ==="
  kubectl get pods -n "$NAMESPACE" -l app=frontend -o wide
  echo "=== Pod Events ==="
  kubectl describe pods -n "$NAMESPACE" -l app=frontend | tail -20
  exit 1
}

# --- Step 5: Clean up any leftover migration jobs from previous deploys ---
kubectl delete job prisma-migrate -n "$NAMESPACE" --ignore-not-found=true

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
