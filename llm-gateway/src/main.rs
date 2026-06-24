use anyhow::*;
use axum::{Extension, Json, Router, extract::State, response::IntoResponse, routing::{get, post}};
use reqwest::Client;
use sqlx::{Pool, Postgres};

use crate::{handlers::{admin::{AuthContext, auth_middleware}, handlers::handle_gemini}, types::{ChatCompletionRequest, Provider}};

mod config;
mod error;
mod models;
mod middleware;
mod proxy;
mod storage;
mod handlers;
mod types;

#[derive(Clone)]
pub struct AppState {
    pub client: Client,
    pub pool: Pool<Postgres>
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    // load .env
    dotenvy::dotenv().ok();

    // read config
    let config = config::Config::from_env()?;

    // create db pool
    let pool = storage::db::create_pool(&config.database_url).await?;
    tracing::info!("database connected");

    let state = AppState {
        client: Client::new(),
        pool:pool
    };

    let app = Router::new()
        .route("/health", get(handlers::health::health))
        .route("/v1/chat", post(chat)
        .layer(axum::middleware::from_fn_with_state(state, auth_middleware)))
        .with_state(state);

    let addr = format!("0.0.0.0:{}", config.port);
    tracing::info!("listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}


async fn chat(
    State(state):State<AppState>,
    Extension(auth) :Extension<AuthContext>,
    Json(body): Json<ChatCompletionRequest>,
) -> impl IntoResponse {
    match body.provider() {
        Provider::Gemini    => handle_gemini(state, auth, body).await,
        Provider::Openai    => handle_openai(body).await,
        Provider::Anthropic => handle_anthropic(body).await,
    }
}