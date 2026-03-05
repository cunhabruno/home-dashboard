#!/bin/bash
# Generate a self-signed TLS certificate and create a K8s secret
# Run this once on your cluster

DOMAIN="home-dashboard.house"
NAMESPACE="home-dashboard"
SECRET_NAME="home-dashboard-tls"

# Generate self-signed cert (valid for 10 years)
openssl req -x509 -nodes -days 3650 \
  -newkey rsa:2048 \
  -keyout /tmp/tls.key \
  -out /tmp/tls.crt \
  -subj "/CN=${DOMAIN}" \
  -addext "subjectAltName=DNS:${DOMAIN}"

# Create the TLS secret in K8s
kubectl create secret tls "${SECRET_NAME}" \
  --cert=/tmp/tls.crt \
  --key=/tmp/tls.key \
  --namespace="${NAMESPACE}" \
  --dry-run=client -o yaml | kubectl apply -f -

# Clean up
rm /tmp/tls.key /tmp/tls.crt

echo "TLS secret '${SECRET_NAME}' created in namespace '${NAMESPACE}'"
