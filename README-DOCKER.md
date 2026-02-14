# Docker & k3s Deployment Guide

This guide explains how to build and deploy the Home Dashboard application to k3s.

## Prerequisites

- Docker installed
- k3s cluster running
- kubectl configured to access your k3s cluster
- (For CI/CD) Docker Hub account with secrets configured in GitHub

## CI/CD Pipeline

The project includes a GitHub Actions workflow that automatically:
- Builds the Docker image on pushes to `main` or `develop` branches
- Pushes multi-platform images (amd64/arm64) to Docker Hub
- Tags images with branch name, commit SHA, and `latest`
- Uses Docker layer caching for faster builds

### GitOps with ArgoCD

This project uses ArgoCD for GitOps deployments:

1. **CI builds and publishes** Docker images to Docker Hub
2. **Manually update** `argocd-deployments/home-dashboard/deployment.yaml` with new image tag
3. **ArgoCD automatically syncs** changes to your k3s cluster

See [argocd/README.md](argocd/README.md) for detailed setup instructions.

### Setting up CI/CD

1. Create Docker Hub access token at https://hub.docker.com/settings/security
2. Add secrets to your GitHub repository (Settings → Secrets and variables → Actions):
   - `DOCKER_USER`: Your Docker Hub username
   - `DOCKER_TOKEN`: Your Docker Hub access token

3. Push to `main` or `develop` branch - the workflow will automatically build and publish

## Quick Start

### Option 1: Using ArgoCD (Recommended for Production)

```bash
# 1. CI automatically builds and publishes on push
git push origin main

# 2. Update deployment in this repo
sed -i 's|image: cunhabruno/home-dashboard:.*|image: cunhabruno/home-dashboard:sha-abc1234|' k8s/deployment.yaml
git commit -am "Update image to sha-abc1234"
git push

# 3. ArgoCD automatically syncs to k3s (no manual kubectl needed!)
```

See [argocd/README.md](argocd/README.md) for setup instructions.

### Option 2: Using Makefile (Local Development)

```bash
# Build, push to Docker Hub, and deploy
make all

# Or step by step:
make build    # Build Docker image
make push     # Push to Docker Hub
make deploy   # Deploy to k8s
```

### Option 3: Local k3s Import (No Registry)

```bash
# Build and import directly to k3s
make build
make import   # Imports to k3s containerd
make deploy
```

## Manual Steps

#### 1. Build the Docker Image

```bash
docker build -t cunhabruno/home-dashboard:latest .
```

#### 2. Push to Docker Hub (Optional)

```bash
docker push cunhabruno/home-dashboard:latest
```

Or import directly to k3s:

```bash
docker save cunhabruno/home-dashboard:latest | sudo k3s ctr images import -
```

#### 3. Deploy to k3s

```bash
# Deploy all resources
kubectl apply -k k8s/

# Or apply individually
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

## Configuration

### Image Tags

The CI/CD pipeline creates multiple tags:
- `latest` - Latest build from main branch
- `sha-abc1234` - Specific commit SHA
- `main` / `develop` - Branch name tags

To use a specific version, update [k8s/deployment.yaml](k8s/deployment.yaml):

```yaml
spec:
  containers:
  - name: home-dashboard
    image: cunhabruno/home-dashboard:sha-abc1234  # Use specific SHA
```

### Configure Ingress

Edit [k8s/ingress.yaml](k8s/ingress.yaml) to set your domain:

```yaml
spec:
  rules:
  - host: home-dashboard.yourdomain.com  # Update this
```

Add to `/etc/hosts` for local testing:

```
127.0.0.1 home-dashboard.local
```

## Useful Commands

```bash
# Check deployment status
kubectl get all -n home-dashboard
make status

# View logs
make logs
# Or: kubectl logs -n home-dashboard -l app=home-dashboard -f

# Scale deployment
kubectl scale deployment home-dashboard -n home-dashboard --replicas=3

# Update to latest image
kubectl rollout restart deployment/home-dashboard -n home-dashboard

# Delete deployment
make delete
# Or: kubectl delete -k k8s/
```

## Environment Variables

Add environment variables in [k8s/deployment.yaml](k8s/deployment.yaml):

```yaml
env:
- name: NODE_ENV
  value: "production"
- name: CUSTOM_VAR
  value: "your-value"
```

Or use a ConfigMap/Secret:

```yaml
envFrom:
- configMapRef:
    name: home-dashboard-config
- secretRef:
    name: home-dashboard-secrets
```

## Troubleshooting

### Pod not starting

```bash
kubectl describe pod -n home-dashboard -l app=home-dashboard
kubectl logs -n home-dashboard -l app=home-dashboard
```

### Image pull errors

Check if image exists on Docker Hub or is imported to k3s:

```bash
# Check Docker Hub
docker pull cunhabruno/home-dashboard:latest

# Or check k3s local images
sudo k3s ctr images ls | grep home-dashboard
```

### CI/CD workflow failing

1. Verify GitHub secrets are set correctly
2. Check workflow logs in Actions tab
3. Ensure Docker Hub credentials are valid

### Ingress not working

Check if Traefik is running (k3s default ingress):

```bash
kubectl get pods -n kube-system | grep traefik
```

## Development Workflow

### With ArgoCD (Recommended)

1. Make changes locally and test: `pnpm dev`
2. Commit and push to `develop` or `main`
3. CI builds and pushes Docker image automatically
4. Update image tag in `k8s/deployment.yaml` in this repo
5. Commit and push
6. ArgoCD automatically syncs to k3s cluster
7. Verify in ArgoCD UI or via `kubectl get pods -n home-dashboard`

### Without ArgoCD

1. Make changes locally
2. Test locally: `pnpm dev`
3. Commit and push to `develop` branch
4. CI builds and pushes image automatically
5. Deploy to k3s: `kubectl apply -k k8s/`
6. Test in k3s environment
7. Merge to `main` when ready
8. CI builds production image with `latest` tag

## Clean Up

```bash
# Delete all resources
make delete

# Remove local Docker images
docker rmi cunhabruno/home-dashboard:latest
```
