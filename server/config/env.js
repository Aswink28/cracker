import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Every environment variable the server needs, validated once at boot.
 * Failing fast here is deliberate: a missing JWT_SECRET or MONGODB_URI in
 * production should stop the process, not surface as a confusing 500 later.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Comma-separated list of origins allowed to call this API.
  FRONTEND_URL: z.string().min(1).default('http://localhost:3000'),

  // Cloudinary is optional at boot so the API still runs for read-only work
  // without credentials; uploads return a clear 503 instead of crashing.
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default('crackers'),

  // Used only by scripts/seed.js to create the first admin account.
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  ADMIN_NAME: z.string().default('Store Admin'),

  // Lets the API tell Next.js to re-render catalogue pages after a write.
  REVALIDATE_URL: z.string().url().optional(),
  REVALIDATE_SECRET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  console.error(`\nInvalid environment configuration:\n${details}\n`);
  console.error('Copy .env.example to .env and fill in the values.\n');
  process.exit(1);
}

const env = parsed.data;

export const config = {
  ...env,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  allowedOrigins: env.FRONTEND_URL.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  cloudinaryEnabled: Boolean(
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
  ),
  revalidateEnabled: Boolean(env.REVALIDATE_URL && env.REVALIDATE_SECRET),
};

export default config;
