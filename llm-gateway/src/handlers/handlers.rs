use serde::Deserialize;
use crate::{AppState, middleware::auth::AuthContext, types::ChatCompletionRequest};


#[derive(Deserialize)]
pub struct GeminiResponse {
    pub candidates: Vec<GeminiCandidate>,
    #[serde(rename = "usageMetadata")]
    pub usage_metadata: GeminiUsageMetadata,
}

#[derive(Deserialize)]
pub struct GeminiCandidate {
    pub content: GeminiContent,
    #[serde(rename = "finishReason")]
    pub finish_reason: String,
}

#[derive(Deserialize)]
pub struct GeminiContent {
    pub parts: Vec<GeminiPart>,
    pub role: String,
}

#[derive(Deserialize)]
pub struct GeminiPart {
    pub text: String,
}

#[derive(Deserialize)]
pub struct GeminiUsageMetadata {
    #[serde(rename = "promptTokenCount")]
    pub prompt_token_count: u32,
    #[serde(rename = "candidatesTokenCount")]
    pub candidates_token_count: u32,
}


pub async fn handle_gemini(
    client:AppState,
    auth:AuthContext,
    body:ChatCompletionRequest
)  {
    
    let provider_key = auth.provider_key;

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent",
        body.model
    );

    let response = client.client
        .post(&url)
        .header("x-goog-api-key", provider_key)
        .header("Content-Type", "application/json")
        .json(&gemini_body)
        .send()
        .await?;

    let gemini_resp = response.json::<GeminiResponse>().await?;
}