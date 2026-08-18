import { Admin } from '../models/Admin.js';
import { ApiError } from '../utils/ApiError.js';
import { signAdminToken } from '../middleware/auth.js';

/** POST /api/auth/login */
export async function login(req, res) {
  const { email, password } = req.body;

  // `password` is select:false on the schema, so it must be requested explicitly.
  const admin = await Admin.findOne({ email }).select('+password');

  // One generic message for "no such account" and "wrong password" alike, so
  // the endpoint cannot be used to enumerate valid admin emails.
  const invalid = ApiError.unauthorized('Invalid email or password');

  if (!admin) throw invalid;
  if (!admin.active) throw ApiError.forbidden('This account has been disabled');

  const matches = await admin.comparePassword(password);
  if (!matches) throw invalid;

  admin.lastLoginAt = new Date();
  await admin.save({ validateBeforeSave: false });

  const token = signAdminToken(admin);

  res.json({
    success: true,
    token,
    admin: { id: admin.id, name: admin.name, email: admin.email },
  });
}

/** GET /api/auth/me - lets the admin panel confirm a stored token is still good. */
export async function me(req, res) {
  res.json({
    success: true,
    admin: { id: req.admin.id, name: req.admin.name, email: req.admin.email },
  });
}
