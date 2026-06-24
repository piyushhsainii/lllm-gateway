use axum::{
    body::Body,
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use sqlx::types::uuid;

#[derive(Clone)]
pub struct AuthContext {
    // pub key_id: uuid::Uuid,
    pub auth_id:String,
    // pub api_key:String,
    pub org_id: String,
    pub provider_key: String,
}


pub async fn auth_middleware(
    req: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    let org_id = req.headers()
        .get("Org-Key")
        .ok_or(StatusCode::BAD_REQUEST)?.to_str().map_err(|_| StatusCode::BAD_REQUEST)?.to_string();

    let auth_header = req.headers()
        .get("Authentication-ID")
        .ok_or(StatusCode::BAD_REQUEST)?
        .to_str()
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    let auth_key = auth_header
        .strip_prefix("Bearer ")
        .ok_or(StatusCode::UNAUTHORIZED)?.to_string();

    let provider_header = req.headers()
        .get("Provider-Key")
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let provider_key = provider_header.to_str().map_err(|_| StatusCode::BAD_REQUEST)?.to_string();

    // get monthly budget usd

    req.extensions_mut().insert(AuthContext {
        auth_id:auth_key,
        org_id:org_id,
        provider_key:provider_key,
    });

    Ok(next.run(req).await)
}