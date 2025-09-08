import type { MiddlewareHandler } from 'hono';
import { problem } from './problem';

// Generates or propagates a request ID for correlation
export const requestId: MiddlewareHandler = async (c, next) => {
  let id = c.req.header('x-request-id');
  if (!id) {
    try {
      // Prefer crypto.randomUUID when available
      // @ts-ignore - runtime check
      id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    } catch {
      id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  }
  c.set('x-request-id', id);
  c.header('X-Request-Id', id);
  await next();
};

// Sets common security headers suitable for APIs
export const securityHeaders: MiddlewareHandler = async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  // Auth endpoints should not be cached
  if (c.req.path.startsWith('/api/')) {
    c.header('Cache-Control', 'no-store');
  }
  // Only advertise HSTS in production when behind HTTPS
  if (process.env.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
};

// Enforce JSON-only API via Accept negotiation
export const acceptJsonOnly: MiddlewareHandler = async (c, next) => {
  const accept = c.req.header('accept');
  if (accept && !accept.includes('application/json') && !accept.includes('*/*')) {
    return problem(c, {
      status: 406,
      title: 'Not Acceptable',
      type: 'https://httpstatuses.com/406',
      detail: 'Only application/json responses are supported.',
      code: 'NOT_ACCEPTABLE',
    });
  }
  await next();
};

// Advertise current API version via response headers
export const apiVersion = (version: string): MiddlewareHandler => async (c, next) => {
  await next();
  c.header('X-API-Version', version);
};
