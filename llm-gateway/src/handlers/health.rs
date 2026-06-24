use axum::response::IntoResponse;

pub async fn health() -> impl IntoResponse {
    axum::Json(serde_json::json!({ "status": "ok" }))
}