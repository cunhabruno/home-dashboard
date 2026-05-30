#!/bin/bash
# One-time setup for cert-manager + Cloudflare DNS-01 wildcard cert.
# Prereqs:
#   - 200tech.site nameservers pointed at Cloudflare
#   - Cloudflare API token with permissions: Zone:DNS:Edit, Zone:Zone:Read (scoped to 200tech.site)
#   - CLOUDFLARE_API_TOKEN env var set before running
set -euo pipefail

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Set CLOUDFLARE_API_TOKEN before running." >&2
  exit 1
fi

# 1. Install cert-manager (CRDs + controller) if not already installed
if ! kubectl get ns cert-manager >/dev/null 2>&1; then
  kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.16.1/cert-manager.yaml
  echo "Waiting for cert-manager pods..."
  kubectl wait --for=condition=Available --timeout=180s -n cert-manager deploy/cert-manager deploy/cert-manager-webhook deploy/cert-manager-cainjector
fi

# 2. Create the Cloudflare API token secret in the home-dashboard namespace
kubectl create namespace home-dashboard --dry-run=client -o yaml | kubectl apply -f -
kubectl create secret generic cloudflare-api-token \
  --namespace=home-dashboard \
  --from-literal=api-token="${CLOUDFLARE_API_TOKEN}" \
  --dry-run=client -o yaml | kubectl apply -f -

# cert-manager looks for the solver secret in its own namespace for ClusterIssuers
kubectl create secret generic cloudflare-api-token \
  --namespace=cert-manager \
  --from-literal=api-token="${CLOUDFLARE_API_TOKEN}" \
  --dry-run=client -o yaml | kubectl apply -f -

# 3. Apply the ClusterIssuer (cluster-scoped, not part of kustomize app bundle)
kubectl apply -f "$(dirname "$0")/cluster-issuer.yaml"

echo
echo "Done. Now apply the app: kubectl apply -k $(dirname "$0")"
echo "Then watch the cert: kubectl describe certificate -n home-dashboard wildcard-200tech-site"
