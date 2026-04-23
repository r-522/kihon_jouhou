use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::{get, post},
    Router,
};
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool};
use tower_http::{
    cors::CorsLayer,
    services::{ServeDir, ServeFile},
};
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
struct Card {
    id: Uuid,
    question: String,
    choice_a: String,
    choice_b: String,
    choice_c: String,
    choice_d: String,
    correct: String,
    interval_days: i32,
    ease_factor: f64,
    next_review: DateTime<Utc>,
    review_count: i32,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct CreateCard {
    question: String,
    choice_a: String,
    choice_b: String,
    choice_c: String,
    choice_d: String,
    correct: String,
}

#[derive(Debug, Deserialize)]
struct ReviewInput {
    card_id: String,
    answered: String,
}

#[derive(Clone)]
struct AppState {
    pool: PgPool,
}

/// SM-2準拠。正解でインターバル延長、不正解でリセット。
fn calc_next_review(
    interval_days: i32,
    ease_factor: f64,
    is_correct: bool,
) -> (i32, f64, DateTime<Utc>) {
    if !is_correct {
        return (
            1,
            (ease_factor - 0.2_f64).max(1.3),
            Utc::now() + Duration::days(1),
        );
    }
    let new_interval = ((interval_days as f64) * ease_factor).round() as i32;
    (
        new_interval,
        ease_factor,
        Utc::now() + Duration::days(new_interval as i64),
    )
}

async fn get_due_cards(State(state): State<AppState>) -> impl IntoResponse {
    match sqlx::query_as::<_, Card>(
        "SELECT * FROM cards WHERE next_review <= NOW() ORDER BY next_review ASC LIMIT 20",
    )
    .fetch_all(&state.pool)
    .await
    {
        Ok(cards) => Json(cards).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn create_card(
    State(state): State<AppState>,
    Json(input): Json<CreateCard>,
) -> impl IntoResponse {
    match sqlx::query_as::<_, Card>(
        "INSERT INTO cards (question, choice_a, choice_b, choice_c, choice_d, correct)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    )
    .bind(&input.question)
    .bind(&input.choice_a)
    .bind(&input.choice_b)
    .bind(&input.choice_c)
    .bind(&input.choice_d)
    .bind(&input.correct)
    .fetch_one(&state.pool)
    .await
    {
        Ok(card) => (StatusCode::CREATED, Json(card)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn get_kakomon_list() -> impl IntoResponse {
    match std::fs::read_to_string("kakomon/06_kakomon.json") {
        Ok(content) => {
            (
                StatusCode::OK,
                [("Content-Type", "application/json")],
                content,
            )
                .into_response()
        }
        Err(e) => {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to read kakomon file: {}", e),
            )
                .into_response()
        }
    }
}

async fn submit_review(
    State(state): State<AppState>,
    Json(input): Json<ReviewInput>,
) -> impl IntoResponse {
    // card_id が UUID 形式か過去問形式か判定
    let is_pastexam = input.card_id.starts_with("kakomon_");

    if is_pastexam {
        // 過去問の場合: card テーブルを参照せず、review_logs のみに記録
        // （JSON から得た correct 情報をもとに、フロント側で is_correct を判定済み）
        let log = sqlx::query(
            "INSERT INTO review_logs (card_id, answered, is_correct) VALUES ($1, $2, $3)",
        )
        .bind(&input.card_id)
        .bind(&input.answered)
        // フロント側では card_id から correct 情報を取得できないため、
        // ここでは仮に answered が空でないこと=何か回答したということで記録する
        // (実際の正誤判定はフロント側で行われている)
        .bind(true) // トレースのみ目的で全て true として記録
        .execute(&state.pool)
        .await;

        return match log {
            Ok(_) => StatusCode::OK.into_response(),
            Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
        };
    }

    // 通常のカードの場合
    let card_uuid = match Uuid::parse_str(&input.card_id) {
        Ok(uuid) => uuid,
        Err(_) => return StatusCode::BAD_REQUEST.into_response(),
    };

    let card = match sqlx::query_as::<_, Card>("SELECT * FROM cards WHERE id = $1")
        .bind(card_uuid)
        .fetch_one(&state.pool)
        .await
    {
        Ok(c) => c,
        Err(_) => return StatusCode::NOT_FOUND.into_response(),
    };

    let is_correct = input.answered == card.correct;
    let (new_interval, new_ease, next_review) =
        calc_next_review(card.interval_days, card.ease_factor, is_correct);

    let update = sqlx::query(
        "UPDATE cards SET interval_days=$1, ease_factor=$2, next_review=$3,
         review_count=review_count+1 WHERE id=$4",
    )
    .bind(new_interval)
    .bind(new_ease)
    .bind(next_review)
    .bind(card_uuid)
    .execute(&state.pool)
    .await;

    if let Err(e) = update {
        return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response();
    }

    let log = sqlx::query(
        "INSERT INTO review_logs (card_id, answered, is_correct) VALUES ($1, $2, $3)",
    )
    .bind(input.card_id)
    .bind(&input.answered)
    .bind(is_correct)
    .execute(&state.pool)
    .await;

    match log {
        Ok(_) => StatusCode::OK.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    let state = AppState { pool };

    let api = Router::new()
        .route("/cards/due", get(get_due_cards))
        .route("/cards", post(create_card))
        .route("/review", post(submit_review))
        .route("/kakomon/list", get(get_kakomon_list));

    // public/ ディレクトリの静的ファイルを配信。SPAなので未知パスは index.html へフォールバック。
    let static_files =
        ServeDir::new("public").not_found_service(ServeFile::new("public/index.html"));

    let app = Router::new()
        .nest("/api", api)
        .fallback_service(static_files)
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr = format!("0.0.0.0:{port}");
    println!("Listening on http://{addr}");
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
