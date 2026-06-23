export class GatewayError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "GatewayError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class GatewayAuthError extends GatewayError {
  constructor(message: string, code: string) {
    super(message, code, 401);
    this.name = "GatewayAuthError";
  }
}

export class GatewayRateLimitError extends GatewayError {
  constructor(
    message: string,
    code: string,
    public readonly retryAfter: number,
  ) {
    super(message, code, 429);
    this.name = "GatewayRateLimitError";
  }
}

export class GatewayBudgetError extends GatewayError {
  constructor(
    message: string,
    code: string,
    public readonly spent: number,
    public readonly limit: number,
  ) {
    super(message, code, 402);
    this.name = "GatewayBudgetError";
  }
}

export class GatewayUpstreamError extends GatewayError {
  constructor(
    message: string,
    code: string,
    statusCode: number,
    public readonly provider: string,
  ) {
    super(message, code, statusCode);
    this.name = "GatewayUpstreamError";
  }
}

export class GatewayConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GatewayConfigError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class GatewayTimeoutError extends GatewayError {
  constructor() {
    super("Request timed out", "timeout", 408);
    this.name = "GatewayTimeoutError";
  }
}

/**
 * Maps a non-ok HTTP response to a typed GatewayError.
 * @internal
 */
export async function raiseForStatus(response: Response): Promise<never> {
  let body: { error?: string; code?: string; retry_after?: number; spent?: number; limit?: number; provider?: string } = {};
  try {
    body = await response.json();
  } catch {
    // non-JSON error body
  }

  const message = body.error ?? response.statusText;
  const code = body.code ?? "unknown_error";

  switch (response.status) {
    case 401:
      throw new GatewayAuthError(message, code);
    case 429:
      throw new GatewayRateLimitError(message, code, body.retry_after ?? 0);
    case 402:
      throw new GatewayBudgetError(message, code, body.spent ?? 0, body.limit ?? 0);
    case 502:
      throw new GatewayUpstreamError(message, code, 502, body.provider ?? "unknown");
    case 503:
      throw new GatewayUpstreamError(message, code, 503, "all_providers");
    default:
      throw new GatewayError(message, code, response.status);
  }
}
