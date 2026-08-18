import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import config from '../config/env.js';

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Translate anything thrown anywhere in the stack into a consistent JSON body.
 * Express 5 forwards rejected promises from async handlers here automatically,
 * so controllers do not need a try/catch wrapper.
 */
// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
export function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let message = 'Internal server error';
  let details;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    // A malformed ObjectId is a client mistake, not a server fault.
    statusCode = 400;
    message = `Invalid value for '${err.path}'`;
  } else if (err?.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    message = `A record with that ${field} already exists`;
  } else if (err?.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err?.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired, please sign in again';
  } else if (err?.name === 'MongooseError' || err?.name === 'MongoNetworkError') {
    statusCode = 503;
    message = 'Database temporarily unavailable';
  } else if (err?.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request payload too large';
  } else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request body';
  }

  // Unexpected failures are logged in full but described only generically.
  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  const body = { success: false, message };
  if (details) body.details = details;
  // Stack traces are a development affordance only - never shipped to users.
  if (!config.isProduction && statusCode >= 500) body.stack = err?.stack;

  res.status(statusCode).json(body);
}

export default errorHandler;
