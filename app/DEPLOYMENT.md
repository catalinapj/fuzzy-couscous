# Chat App Frontend - Quick Deployment Guide

## Step 1: Authenticate and set permissions

```bash
gcloud auth login
```

## Step 2: Build Docker image

Run these from the **`app/`** directory (same idea as building the API from **`api/`**).

```bash
docker build --platform linux/amd64 \
  -t europe-west9-docker.pkg.dev/learned-surge-492109-i0/chat-app/chat-app-frontend:<UNIQUE-TAG-HERE> .
```

Use a new tag each release (for example `v01`, `v02`), matching how you version `chat-app-backend`.

## Step 3: Push Docker image

```bash
docker push europe-west9-docker.pkg.dev/learned-surge-492109-i0/chat-app/chat-app-frontend:<UNIQUE-TAG-HERE>
```

## Step 4: Deploy to Cloud Run

Static frontend: no database URL and no Cloud SQL attachment (unlike the backend).

```bash
gcloud run deploy chat-app-frontend \
  --region=europe-west2 \
  --image=europe-west9-docker.pkg.dev/learned-surge-492109-i0/chat-app/chat-app-frontend:<UNIQUE-TAG-HERE> \
  --allow-unauthenticated
```

After deploy, Cloud Run prints the service URL. Use that as the site users open in the browser.

If you add **`VITE_*`** build-time variables later, pass them at **`docker build`** with **`--build-arg`** and wire them in the `Dockerfile`, or use your CI’s secret/build pipeline—same rule as any Vite app: they are baked in at **image build**, not at `gcloud run deploy`.
