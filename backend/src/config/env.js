/**
 * Centralised, validated environment configuration.
 *
 * The server refuses to boot without a usable JWT_SECRET — there is
 * deliberately NO hardcoded fallback secret.
 */
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required' })
    .min(32, 'JWT_SECRET must be at least 32 characters (try: openssl rand -hex 32)'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  PORT: z.coerce.number().int().positive().default(4000),
  // Comma-separated list of allowed browser origins. Unset = allow any
  // origin (safe here because auth uses Bearer tokens, not cookies).
  CORS_ORIGIN: z.string().optional(),
});

export function loadEnv(source = process.env) {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return Object.freeze(parsed.data);
}
