# k8s / TLS setup

How HTTPS works for this cluster, and how to rebuild it from scratch.

## How the cert works

- Domain `200tech.site` is registered at Namecheap, with DNS delegated to **Cloudflare** (nameservers point at Cloudflare).
- `dashboard.200tech.site` is an A record in Cloudflare pointing to the k3s node's LAN IP (`192.168.1.161`), **DNS only** (grey cloud — orange cloud would proxy through Cloudflare's edge and break LAN access).
- **cert-manager** runs in the cluster and issues a **wildcard `*.200tech.site`** cert from Let's Encrypt using the **DNS-01 challenge** via Cloudflare's API. DNS-01 is required because the cluster isn't reachable from the public internet (HTTP-01 would fail).
- The cert lands as a Kubernetes secret `wildcard-200tech-site-tls` in the `home-dashboard` namespace. Traefik reads it via the `Ingress` `tls:` block and serves it. cert-manager auto-renews ~30 days before expiry.

### Resource map

| File | What it does |
|---|---|
| `cluster-issuer.yaml` | Cluster-wide Let's Encrypt issuer, configured to solve DNS-01 via Cloudflare. **Not** part of the kustomize bundle — applied directly by `setup-cert-manager.sh`. |
| `certificate.yaml` | Requests the wildcard cert. Applied via kustomize. |
| `ingress.yaml` | References `wildcard-200tech-site-tls` and routes `dashboard.200tech.site` to the app. |
| `middleware.yaml` | Traefik middleware that redirects http→https. |
| `setup-cert-manager.sh` | One-time bootstrap: installs cert-manager, creates the Cloudflare token secret in both namespaces, applies the ClusterIssuer. |

### Where the Cloudflare API token lives

A secret named `cloudflare-api-token` exists in **two** namespaces:
- `cert-manager` — used by the ClusterIssuer's DNS-01 solver.
- `home-dashboard` — kept in sync for any future namespace-scoped Issuers.

The token needs both `Zone:Zone:Read` and `Zone:DNS:Edit`, scoped to `200tech.site`. Easiest: use Cloudflare's "Edit zone DNS" template — it includes both.

## Rebuild from scratch

If the cluster gets blown away or you set up a new one:

1. Confirm `200tech.site` is still Active in Cloudflare (zone overview).
2. Confirm `dashboard.200tech.site` A record points at the new k3s node IP (DNS only / grey cloud).
3. Create a new Cloudflare API token (Edit zone DNS template, scoped to `200tech.site`).
4. Bootstrap:
   ```bash
   export CLOUDFLARE_API_TOKEN=<token>
   ./k8s/setup-cert-manager.sh
   kubectl apply -k k8s/
   ```
5. Watch the cert issue (1–3 min):
   ```bash
   kubectl get certificate,challenge,order -n home-dashboard -w
   ```
   Wait for `wildcard-200tech-site` to show `READY=True`.

## Add a new app on the same domain

1. Cloudflare: add an A record `<name>.200tech.site` → `192.168.1.161`, DNS only.
2. In the app's ingress, reuse the existing wildcard secret:
   ```yaml
   tls:
     - hosts: [<name>.200tech.site]
       secretName: wildcard-200tech-site-tls
   ```
   If the app lives in a different namespace, either copy the secret over, or add a `Certificate` resource in that namespace pointing at the same `letsencrypt-prod` ClusterIssuer.

## Troubleshooting

Verify what cert is actually on the wire:
```bash
echo | openssl s_client -servername dashboard.200tech.site \
  -connect dashboard.200tech.site:443 2>/dev/null \
  | openssl x509 -noout -issuer -subject -dates
```
Issuer should be Let's Encrypt. `TRAEFIK DEFAULT CERT` means the real cert never landed — check `kubectl describe certificate -n home-dashboard wildcard-200tech-site` and the cert-manager logs:
```bash
kubectl logs -n cert-manager -l app=cert-manager --tail=50
```

Common failure modes:
- **`/zones//dns_records/...` (empty zone ID) in logs** — API token missing `Zone:Zone:Read`. Recreate with both permissions, replace the secret in *both* namespaces, then `kubectl delete challenge,order,certificaterequest,certificate -n home-dashboard --all && kubectl apply -k k8s/`.
- **Challenge stuck `pending`** — zone not yet Active in Cloudflare (nameserver propagation), or DNS A record proxied (orange cloud) instead of DNS only.
- **Browser still warns after cert is Ready** — hard reload / private window; old self-signed cert cached.
- **Rate-limited by Let's Encrypt** — 5 duplicate certs per week. If iterating on the issuer config, temporarily point at the staging directory `https://acme-staging-v02.api.letsencrypt.org/directory` in `cluster-issuer.yaml`.
