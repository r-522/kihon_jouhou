# 進捗状況

## 完了済み

- [x] CLAUDE.md / .claude/rules/ ハーネス構築
- [x] .claude/settings.json（hooks: cargo fmt / prettier / cargo check）
- [x] supabase/migrations/001_initial_schema.sql（cards, review_logs）
- [x] frontend/ 全ファイル（React + TypeScript + Vite）
  - App.tsx（メイン画面: 過去問回答・暗記ボタン 2列レイアウト）
  - InputView.tsx → POST /api/cards
  - StudyView.tsx → GET /api/cards/due / POST /api/review（シャッフル出題）
  - PastExamView.tsx（新規）→ GET /api/kakomon/list / POST /api/review（過去問出題）
  - lib/api.ts（fetchベースAPIクライアント）
  - lib/types.ts（Card型, PastExamProblem型, ChoiceKey, CHOICE_LABELS）
- [x] backend/src/main.rs（Axum: 4エンドポイント + 静的ファイル配信）
  - SM-2アルゴリズム（calcNextReview）
  - GET /api/kakomon/list（過去問データ取得）
  - POST /api/review（通常カード・過去問対応）
- [x] Dockerfile（multi-stage: Node→Rust→alpine）
- [x] .dockerignore
- [x] deploy.sh（Cloud Run デプロイスクリプト）

## 次のステップ（デプロイ前に必要）

1. Supabase でプロジェクト作成 → SQL Editorで migration 実行
2. GCP プロジェクト作成 → Secret Manager に DATABASE_URL を登録
   ```
   gcloud secrets create kihon-jouhou-db-url --data-file=- <<< "postgresql://..."
   ```
3. deploy.sh の PROJECT_ID を書き換えて実行
