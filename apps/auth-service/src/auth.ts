import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins/bearer';
import { jwt } from 'better-auth/plugins/jwt';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const trustedOrigins = process.env.TRUSTED_ORIGINS?.split(',') || [];

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  basePath: '/api/auth',
  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,
  trustedOrigins,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    cookiePrefix: 'ba',
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  plugins: [
    jwt({
      expiresIn: 60 * 15, // 15 minutes
      definePayload: ({ user, session }) => ({
        sub: user.id,
        email: user.email,
        sid: session.id,
      }),
    }),
    bearer(),
  ],
});