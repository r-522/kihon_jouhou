#!/bin/sh
# Google Cloud Run デプロイスクリプト
# 事前に: gcloud auth login && gcloud auth configure-docker

PROJECT_ID="your-gcp-project-id"
REGION="asia-northeast1"
SERVICE="kihon-jouhou"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE}"

# 1. イメージをビルド & プッシュ
docker build -t "${IMAGE}" .
docker push "${IMAGE}"

# 2. Cloud Run にデプロイ
#    DATABASE_URL は Secret Manager から注入する（平文で渡さない）
gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1 \
  --set-secrets "DATABASE_URL=kihon-jouhou-db-url:latest"

echo "Deploy complete."
gcloud run services describe "${SERVICE}" --region "${REGION}" --format "value(status.url)"
