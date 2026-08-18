import rateLimit from 'express-rate-limit';
import config from '../config/env.js';

const jsonMessage = (message) => ({ success: false, message });

/** Broad protection for the whole API surface. Generous by design. */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isProduction ? 600 : 10_000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: jsonMessage('Too many requests, please try again shortly.'),
});

/**
 * Login is the one endpoint where brute force actually pays off, so it gets a
 * much tighter budget. Successful logins are not counted against the limit.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isProduction ? 8 : 1000,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: jsonMessage('Too many sign-in attempts. Please wait 15 minutes and try again.'),
});

/** Public write endpoint - the only unauthenticated POST in the API. */
export const enquiryLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: config.isProduction ? 20 : 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: jsonMessage('Too many enquiries from this device. Please try again later.'),
});

/** Image uploads are expensive in bandwidth and Cloudinary quota. */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: config.isProduction ? 100 : 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: jsonMessage('Upload limit reached. Please try again later.'),
});
