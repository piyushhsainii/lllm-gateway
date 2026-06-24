use thiserror::Error;

#[derive(Error, Debug)]
pub enum ErrorTypes {
    #[error("Headers sent are invalid!")]
    InvalidHeaders,
    #[error("Authentication Key is not invalid!")]
    Unauthorized,
    #[error("LLM Provider Key is not valid!")]
    UnauthorizedLLMKey,
}