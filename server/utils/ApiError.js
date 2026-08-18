/**
 * An error the API is willing to describe to a client.
 *
 * Anything thrown that is NOT an ApiError is treated as unexpected by the
 * error handler and reported as a generic 500, so internal messages and
 * stack traces never reach users.
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.expected = true;
    if (details) this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = 'Invalid request', details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, message);
  }

  static serviceUnavailable(message = 'Service unavailable') {
    return new ApiError(503, message);
  }
}

export default ApiError;
