import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';
import { ApiError } from '../utils/ApiError.js';
import config from '../config/env.js';

export function signAdminToken(admin) {
  return jwt.sign({ sub: admin.id ?? admin._id.toString(), role: 'admin' }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
}

function extractToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/**
 * Require a valid admin session.
 *
 * The account is re-read on every request rather than trusted from the token
 * alone, so deactivating an admin takes effect immediately instead of when
 * their JWT happens to expire.
 */
export async function requireAdmin(req, _res, next) {
  const token = extractToken(req);
  if (!token) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  const payload = jwt.verify(token, config.JWT_SECRET);

  if (payload.role !== 'admin') {
    return next(ApiError.forbidden('Admin access required'));
  }

  const admin = await Admin.findById(payload.sub);
  if (!admin || !admin.active) {
    return next(ApiError.unauthorized('Account is no longer active'));
  }

  req.admin = admin;
  return next();
}

export default requireAdmin;

/**
 * Attach `req.admin` when a valid token is present, but never reject.
 *
 * Public catalogue reads use this so an authenticated admin can opt into
 * seeing disabled products (`includeInactive`), while anonymous visitors get
 * the normal active-only view. Without it `req.admin` is always undefined on
 * these routes and every admin-only filter silently degrades to the public
 * one - which made the dashboard's "Disabled" tile count active products.
 *
 * A bad or expired token is ignored rather than surfaced: this is an
 * enhancement path, and every write is still gated by requireAdmin.
 */
export async function attachAdmin(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    if (payload.role === 'admin') {
      const admin = await Admin.findById(payload.sub);
      if (admin?.active) req.admin = admin;
    }
  } catch {
    // Ignored on purpose - see above.
  }

  return next();
}
