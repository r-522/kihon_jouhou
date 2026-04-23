# ─────────────────────────────────────────
# Stage 1: React フロントエンドのビルド
# ─────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ─────────────────────────────────────────
# Stage 2: Rust バックエンドのビルド
# ─────────────────────────────────────────
FROM rust:1.82-alpine AS backend-build
RUN apk add --no-cache musl-dev
WORKDIR /app/backend

# 依存クレートを先にキャッシュ（ソース変更時のリビルドを最小化）
COPY backend/Cargo.toml ./
RUN mkdir src && echo "fn main() {}" > src/main.rs \
    && cargo build --release \
    && rm -rf src

COPY backend/src ./src
# main.rsのタイムスタンプを更新してリビルドを確実に行う
RUN touch src/main.rs && cargo build --release

# ─────────────────────────────────────────
# Stage 3: 最小ランタイムイメージ
# ─────────────────────────────────────────
FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=backend-build /app/backend/target/release/kihon-jouhou-api ./
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 8080
CMD ["./kihon-jouhou-api"]
