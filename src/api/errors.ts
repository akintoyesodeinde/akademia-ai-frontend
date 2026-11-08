import type { ErrorEnvelope } from './generated/schema';

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly requestId: string;
  public readonly details?: unknown;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiClientError';
    this.status = params.status;
    this.code = params.code;
    this.requestId = params.requestId || '-';
    this.details = params.details;
  }

  public get userFacingMessage(): string {
    switch (this.status) {
      case 401:
        return this.message || 'Your session has expired. Please sign in again.';
      case 403:
        return this.message || 'You do not have permission to perform this action in this tenant.';
      case 404:
        return this.message || 'The requested resource could not be found.';
      case 409:
        return this.message || 'A conflict occurred with the current resource state.';
      case 422:
        return this.message || 'Please check the form inputs and try again.';
      case 429:
        return this.message || 'Rate limit or tenant quota reached. Please wait before retrying.';
      default:
        return this.message || 'An unexpected server error occurred.';
    }
  }
}

export function parseErrorEnvelope(status: number, body: unknown): ApiClientError {
  if (
    body &&
    typeof body === 'object' &&
    'error' in body &&
    body.error &&
    typeof body.error === 'object'
  ) {
    const env = body as ErrorEnvelope;
    return new ApiClientError({
      status,
      code: env.error.code || `HTTP_${status}`,
      message: env.error.message || `Request failed with status ${status}`,
      requestId: env.error.request_id,
      details: env.error.details,
    });
  }
  return new ApiClientError({
    status,
    code: `HTTP_${status}`,
    message: `Request failed with status ${status}`,
  });
}
