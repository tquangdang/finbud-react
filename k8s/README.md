# FinBud Kubernetes Deployment

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/) (local) or a GKE cluster (cloud)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)

## Architecture

```
                   ┌─────────────────────────────────┐
  User ──────────> │         Ingress (nginx)          │
                   │  /      -> frontend (port 80)    │
                   │  /api/* -> backend  (port 5000)  │
                   └──────────┬──────────┬────────────┘
                              │          │
                    ┌─────────┘          └──────────┐
                    v                               v
             ┌────────────┐                  ┌────────────┐
             │  Frontend   │                  │  Backend   │
             │  (nginx)    │                  │  (Node.js) │
             │  2 replicas │                  │  2 replicas│
             └────────────┘                  └──────┬─────┘
                                                    │
                                   ┌────────────────┼────────────────┐
                                   v                v                v
                            ┌────────────┐  ┌─────────────┐  ┌────────────┐
                            │ ML Service │  │ MongoDB     │  │ OpenAI API │
                            │ (FastAPI)  │  │ Atlas       │  │ (external) │
                            │ 1 replica  │  │ (external)  │  └────────────┘
                            └────────────┘  └─────────────┘
```

## Quick Start with Docker Compose (Local)

Test all containers locally before deploying to K8s:

```bash
# From the project root
docker compose up --build
```

This starts:
- Frontend at http://localhost:3000
- Backend at http://localhost:5000
- ML Service at http://localhost:8000

Make sure `backend/.env` exists with your real credentials (MONGO_URI, OPENAI_API_KEY, etc).

## Deploy to Minikube

### 1. Start Minikube

```bash
minikube start
minikube addons enable ingress
```

### 2. Build Docker images inside Minikube

Point your shell to Minikube's Docker daemon so images are available to the cluster:

```bash
# Linux / macOS
eval $(minikube docker-env)

# Windows PowerShell
& minikube docker-env --shell powershell | Invoke-Expression
```

Build all three images:

```bash
docker build -t finbud/frontend:latest ./frontend
docker build -t finbud/backend:latest ./backend
docker build -t finbud/ml-service:latest ./ml-service
```

### 3. Configure secrets

Edit `k8s/secrets.yaml` and replace the placeholder values with your real credentials. **Never commit this file with real values.**

### 4. Apply manifests

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/ml-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

Or apply everything at once:

```bash
kubectl apply -f k8s/
```

### 5. Verify

```bash
kubectl get pods -n finbud
kubectl get services -n finbud
kubectl get ingress -n finbud
```

All pods should show `Running` status with `READY 1/1`.

### 6. Access the app

Add the Minikube IP to your hosts file:

```bash
# Get Minikube IP
minikube ip
```

Add this line to your hosts file (`C:\Windows\System32\drivers\etc\hosts` on Windows, `/etc/hosts` on Linux/macOS):

```
<MINIKUBE_IP>  finbud.local
```

Then open http://finbud.local in your browser.

## Deploy to Google Cloud GKE

### 1. Setup

```bash
# Install gcloud CLI, then:
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable container.googleapis.com
```

### 2. Push images to Google Container Registry

```bash
# Tag images
docker tag finbud/frontend:latest gcr.io/YOUR_PROJECT_ID/finbud-frontend:latest
docker tag finbud/backend:latest gcr.io/YOUR_PROJECT_ID/finbud-backend:latest
docker tag finbud/ml-service:latest gcr.io/YOUR_PROJECT_ID/finbud-ml-service:latest

# Push
docker push gcr.io/YOUR_PROJECT_ID/finbud-frontend:latest
docker push gcr.io/YOUR_PROJECT_ID/finbud-backend:latest
docker push gcr.io/YOUR_PROJECT_ID/finbud-ml-service:latest
```

### 3. Create a GKE cluster

```bash
gcloud container clusters create-auto finbud-cluster --region=us-central1
gcloud container clusters get-credentials finbud-cluster --region=us-central1
```

### 4. Update image references

Before applying manifests, update the `image:` fields in the deployment YAMLs to point to your GCR images (e.g., `gcr.io/YOUR_PROJECT_ID/finbud-frontend:latest`).

### 5. Apply and verify

```bash
kubectl apply -f k8s/
kubectl get pods -n finbud
kubectl get ingress -n finbud   # Wait for the ADDRESS column to populate
```

## Useful Commands

```bash
# View logs for a specific pod
kubectl logs -n finbud <pod-name>

# Stream logs
kubectl logs -n finbud -f deployment/backend

# Open a shell inside a pod
kubectl exec -n finbud -it <pod-name> -- /bin/sh

# Scale a deployment
kubectl scale deployment backend -n finbud --replicas=3

# Restart a deployment (rolling restart)
kubectl rollout restart deployment/backend -n finbud

# Delete everything
kubectl delete namespace finbud
```

## Notes

- **MongoDB Atlas stays external** -- the connection string is in `secrets.yaml`. Running a database inside K8s is unnecessary complexity for this project.
- **Vercel/Railway deployments still work** -- K8s is a parallel deployment option, not a replacement.
- **The ML service uses more resources** than the other services because Prophet model fitting is CPU-intensive. Its replica count is set to 1 to conserve resources.
- **Image pull policy**: The deployments use `finbud/*:latest` tags. For Minikube, images are built locally. For GKE, update the image paths to your container registry.
