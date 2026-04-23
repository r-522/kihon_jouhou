技術スタック: フロントエンド (React), バックエンド (Rust), データベース (Supabase), デプロイ (Google Cloud)。

設計制約: 個人利用に特化。認証・ログイン・サインアップ機能は一切実装しない。

UI構成: メイン画面には「過去問回答」と「暗記」の2つのボタンを横並びで配置する。

- 過去問回答: JSONファイルから読み込んだ過去問を実践形式で出題
- 暗記: SM-2アルゴリズムによる効率的な復習学習

過去問管理: 過去問データはJSONファイルで管理し、テーブルには格納しない。

- /backend/kakomon/ ディレクトリに年度ごとのJSONファイルを保存
- 例) 06_kakomon.json (令和6年度)
- JSONスキーマ: { year, examination, exam_date, total_questions, problems[] }

学習データ: 過去問での回答履歴は review_logs テーブルに記録される。

- card_id フィールドに「kakomon_YYMMDD_XXX」形式のID を保存
- SM-2アルゴリズムは過去問では適用しない（記録のみ）
