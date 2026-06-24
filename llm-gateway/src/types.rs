use std::collections::HashMap;

use serde::{Deserialize, Serialize};


#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Message {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum Provider {
    Openai,
    Anthropic,
    Gemini,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ChatCompletionRequest {
    pub model: String,
    pub messages: Vec<Message>,

    #[serde(default)]
    pub stream: Option<bool>,

    #[serde(default)]
    pub max_tokens: Option<u32>,

    #[serde(default)]
    pub temperature: Option<f32>,

    #[serde(default)]
    pub top_p: Option<f32>,

    #[serde(default)]
    pub frequency_penalty: Option<f32>,

    #[serde(default)]
    pub presence_penalty: Option<f32>,

    #[serde(default)]
    pub tools: Option<Vec<serde_json::Value>>,

    #[serde(default)]
    pub response_format: Option<serde_json::Value>,

    #[serde(default)]
    pub seed: Option<u64>,

    // anything else not explicitly named
    #[serde(flatten)]
    pub extra: HashMap<String, serde_json::Value>,
}

impl ChatCompletionRequest {
    // infer provider from model name
    pub fn provider(&self) -> Provider {
        if self.model.starts_with("gpt-") {
            Provider::Openai
        } else if self.model.starts_with("claude-") {
            Provider::Anthropic
        } else if self.model.starts_with("gemini-") {
            Provider::Gemini
        } else {
            Provider::Openai // default fallback
        }
    }
}

