import { z } from 'zod';
import type { Env } from '../types/env';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.preprocess((v) => (v ? Number(v) : 4001), z.number().int().positive()).default(4001),
  BETTER_AUTH_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(1),
  DATABASE_URL: z.string().default('file:./dev.db'),
  TRUSTED_ORIGINS: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((s) => s.trim()).filter(Boolean) : [] as string[])),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // Fail fast on invalid configuration
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration for auth-service:', parsed.error.flatten());
  throw new Error('Invalid environment configuration');
}

export const env: Env = Object.freeze({
  NODE_ENV: parsed.data.NODE_ENV,
  PORT: parsed.data.PORT,
  BETTER_AUTH_URL: parsed.data.BETTER_AUTH_URL,
  BETTER_AUTH_SECRET: parsed.data.BETTER_AUTH_SECRET,
  DATABASE_URL: (parsed.data as any).DATABASE_URL,
  TRUSTED_ORIGINS: parsed.data.TRUSTED_ORIGINS as unknown as string[],
});

// Ensure Prisma can read the SQLite URL without requiring a .env
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = env.DATABASE_URL;
}
