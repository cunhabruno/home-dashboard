.PHONY: help build push deploy delete logs

# Variables
IMAGE_NAME ?= home-dashboard
IMAGE_TAG ?= latest
REGISTRY ?= cunhabruno
FULL_IMAGE = $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

help:
	@echo "Available targets:"
	@echo "  build         - Build Docker image"
	@echo "  push          - Push image to registry"
	@echo "  deploy        - Deploy to k3s"
	@echo "  delete        - Delete deployment from k3s"
	@echo "  logs          - Show application logs"
	@echo "  all           - Build, push, and deploy"
	@echo ""
	@echo "Variables:"
	@echo "  IMAGE_NAME    - Image name (default: home-dashboard)"
	@echo "  IMAGE_TAG     - Image tag (default: latest)"
	@echo "  REGISTRY      - Registry URL (default: cunhabruno)"

build:
	@echo "Building Docker image..."
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .
	@echo "Image built: $(IMAGE_NAME):$(IMAGE_TAG)"

tag:
	@echo "Tagging image for registry..."
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(FULL_IMAGE)

push: tag
	@echo "Pushing image to registry..."
	docker push $(FULL_IMAGE)
	@echo "Image pushed: $(FULL_IMAGE)"

import:
	@echo "Importing image to k3s..."
	docker save $(IMAGE_NAME):$(IMAGE_TAG) | sudo k3s ctr images import -
	@echo "Image imported to k3s"

deploy:
	@echo "Deploying to k3s..."
	kubectl apply -k k8s/
	@echo "Deployment complete!"

delete:
	@echo "Deleting deployment..."
	kubectl delete -k k8s/
	@echo "Deployment deleted!"

logs:
	kubectl logs -n home-dashboard -l app=home-dashboard --tail=100 -f

status:
	kubectl get all -n home-dashboard

all: build import deploy
	@echo "Build and deployment complete!"
