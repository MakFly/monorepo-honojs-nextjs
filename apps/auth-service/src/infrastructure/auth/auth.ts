import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins/bearer';
import { jwt } from 'better-auth/plugins/jwt';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import type { Env } from '../../types/env';
import { getPrisma } from '../db/prisma';

export const buildBetterAuth = (env: Env) => {
  const prisma = getPrisma();

  const auth = betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'sqlite',
    }),
    basePath: '/api/auth',
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: env.TRUSTED_ORIGINS,
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
    },
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      cookiePrefix: 'ba',
      useSecureCookies: env.NODE_ENV === 'production',
    },
    plugins: [
      jwt({
        // If your version supports expiration config, wire it via env or defaults.
        // Types in current version don't include expiresIn; we'll rely on defaults.
        // @ts-expect-error definePayload param types vary by version
        definePayload: ({ user, session }: any) => ({
          sub: user.id,
          email: user.email,
          sid: session.id,
        }),
      }),
      bearer(),
    ],
  });

  return auth;
};
