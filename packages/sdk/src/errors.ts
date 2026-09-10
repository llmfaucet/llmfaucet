export interface LlmFaucetErrorOptions {
  message: string;
  status?: number;
  code?: string;
  cause?: unknown;
}
export class LlmFaucetError extends Error {
  readonly status?: number;
  readonly code?: string;
  constructor(options: LlmFaucetErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = 'LlmFaucetError';
    this.status = options.status;
    this.code = options.code;
  }
}
export class RateLimitError extends LlmFaucetError {
  readonly retryAfter?: number;
  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super({ message, status: 429, code: 'rate_limit' });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}
export class AuthenticationError extends LlmFaucetError {
  constructor(message = 'Invalid or missing API key') {
    super({ message, status: 401, code: 'invalid_api_key' });
    this.name = 'AuthenticationError';
  }
}
export class PermissionError extends LlmFaucetError {
  constructor(message = 'Permission denied') {
    super({ message, status: 403, code: 'permission_denied' });
    this.name = 'PermissionError';
  }
}
