-- カード（フラッシュカード）テーブル
-- アイウエの選択肢を固定4択で保持。表示時にフロント側でシャッフルする。
create table cards (
  id            uuid primary key default gen_random_uuid(),
  question      text not null,
  choice_a      text not null,   -- ア
  choice_b      text not null,   -- イ
  choice_c      text not null,   -- ウ
  choice_d      text not null,   -- エ
  correct       text not null check (correct in ('a','b','c','d')),
  -- スペースド・リピティション用フィールド
  interval_days integer not null default 1,   -- 次回出題までの日数
  ease_factor   double precision not null default 2.5, -- 難易度係数（SM-2準拠）
  next_review   timestamptz not null default now(),
  review_count  integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 回答履歴テーブル（統計・デバッグ用）
create table review_logs (
  id         bigint primary key generated always as identity,
  card_id    uuid not null references cards(id) on delete cascade,
  answered   text not null check (answered in ('a','b','c','d')),
  is_correct boolean not null,
  reviewed_at timestamptz not null default now()
);

-- updated_at を自動更新するトリガー
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cards_updated_at
  before update on cards
  for each row execute function set_updated_at();

-- 出題クエリ用インデックス（next_review 昇順で期限切れカードを素早く取得）
create index idx_cards_next_review on cards(next_review asc);
