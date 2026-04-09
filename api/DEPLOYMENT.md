# Chat App - Quick Deployment Guide

## 🔐 Step 1: Authenticate and Set Permissions

```bash
# Authenticate with Google Cloud
gcloud auth login

## 🐳 Step 2: Build Docker Image

```bash
# Build with unique tag (increment version each time)
docker build --platform linux/amd64 \
  -t europe-west9-docker.pkg.dev/learned-surge-492109-i0/chat-app/chat-app-backend:<UNIQUE-TAG-HERE> .
```

## 🚀 Step 3: Push Docker Image

```bash
# Push to Google Artifact Registry
docker push europe-west9-docker.pkg.dev/learned-surge-492109-i0/chat-app/chat-app-backend:<UNIQUE-TAG-HERE>
```

## 📦 Step 4: Deploy to Cloud Run

```bash
# Deploy with the new version
export DB_URL='YOUR_DATABASE_CONNECTION_STRING_HERE'
gcloud run deploy chat-app-backend \
  --region=europe-west2 \
  --image=europe-west9-docker.pkg.dev/learned-surge-492109-i0/chat-app/chat-app-backend:v00 \
  --set-env-vars DATABASE_URL="$DB_URL" \
  --add-cloudsql-instances=learned-surge-492109-i0:europe-west2:chat-app-db
```