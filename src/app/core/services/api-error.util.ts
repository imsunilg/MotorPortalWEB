import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../models/api-error.model';

/**
 * Renders a `HttpErrorResponse` from MotorPortalAPI into a human-readable
 * message, honoring the API's `{ statusCode, message, traceId }` error body
 * where present, and falling back to sensible messages for network errors
 * or unexpected shapes (e.g. an endpoint that doesn't exist yet -> 404 with
 * no JSON body, or a validation body with a top-level `message` plus an
 * `errors` array).
 */
export function extractErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Unable to reach the server. Please check your connection and that the API is running.';
  }

  const body = error.error as Partial<ApiError> & { message?: string } | null;

  if (body && typeof body.message === 'string' && body.message.trim().length > 0) {
    return body.message;
  }

  if (error.status === 404) {
    return 'The requested resource was not found (404). This endpoint may not be available yet.';
  }

  if (typeof error.message === 'string' && error.message.trim().length > 0) {
    return error.message;
  }

  return `Request failed with status ${error.status}.`;
}
