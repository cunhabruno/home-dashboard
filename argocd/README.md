# ArgoCD Deployment Setup

This directory contains the ArgoCD Application manifest for deploying home-dashboard via GitOps.

## Architecture

ArgoCD points directly to this repository's `k8s/` folder, keeping manifests versioned with the application code.

## Setup Instructions

### 1. Deploy ArgoCD Application

Apply the ArgoCD Application manifest to your cluster:

```bash
kubectl apply -f argocd/application.yaml
```

Or copy to your argocd-deployments repo for centralized management:

```bash
cd argocd-deployments
mkdir -p argocd-apps
cp /path/to/home-dashboard/argocd/application.yaml argocd-apps/home-dashboard.yaml
git add argocd-apps/home-dashboard.yaml
git commit -m "Add home-dashboard ArgoCD application"
git push
```

### 2. Verify Deployment

Check the application status:

```bash
# Via ArgoCD CLI
argocd app get home-dashboard

# Via kubectl
kubectl get application -n argocd home-dashboard

# Check deployed resources
kubectl get all -n home-dashboard
```

## How It Works

1. **CI/CD Pipeline**:
   - Builds Docker image on push to main/develop
   - Pushes to Docker Hub: `cunhabruno/home-dashboard`
   - Tags with commit SHA, branch name, and `latest`

2. **Update Deployment**:
   - Update `k8s/deployment.yaml` in this repo with new image tag
   - Commit and push changes

3. **ArgoCD**:
   - Monitors this repo's `k8s/` folder
   - Automatically syncs changes to k3s cluster
   - Self-heals if manual changes are made

## Updating the Image

When CI builds a new image, update the deployment:

```bash
# Option 1: Use latest tag (always pulls newest)
sed -i 's|image: cunhabruno/home-dashboard:.*|image: cunhabruno/home-dashboard:latest|' k8s/deployment.yaml

# Option 2: Use specific SHA (recommended for production)
sed -i 's|image: cunhabruno/home-dashboard:.*|image: cunhabruno/home-dashboard:sha-abc1234|' k8s/deployment.yaml

git add k8s/deployment.yaml
git commit -m "Update image to sha-abc1234"
git push
```

ArgoCD will detect the change and automatically deploy the new version.

## ArgoCD Features Enabled

- **Automated Sync**: Changes in Git are automatically applied
- **Self-Heal**: Manual changes to cluster are reverted
- **Prune**: Deleted resources in Git are deleted from cluster
- **Auto-Create Namespace**: Namespace is created if it doesn't exist
- **Retry Logic**: Failed syncs are retried with exponential backoff

## Accessing ArgoCD UI

```bash
# Port forward to ArgoCD server
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Access at https://localhost:8080
```

## Troubleshooting

### Application not syncing

```bash
# Check application status
argocd app get home-dashboard

# Force sync
argocd app sync home-dashboard

# View sync history
argocd app history home-dashboard
```

### Health check failing

```bash
# Check application health
kubectl get application -n argocd home-dashboard -o yaml

# Check pod status
kubectl get pods -n home-dashboard
kubectl describe pod -n home-dashboard <pod-name>
```

### Remove and redeploy

```bash
# Delete application (this will delete all resources)
kubectl delete application -n argocd home-dashboard

# Reapply
kubectl apply -f argocd/application.yaml
```
