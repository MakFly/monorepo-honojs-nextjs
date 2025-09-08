import type { Context } from 'hono';
import type { ProblemDetail } from '../../types/problem';

/**
 * Send an RFC 7807 problem+json response with a consistent shape.
 */
export function problem(c: Context, p: ProblemDetail) {
  const traceId = c.req.header('x-request-id') || c.get('x-request-id') || undefined;
  const body: ProblemDetail = {
    ...p,
    traceId,
  };
  // Explicitly mark as Problem JSON
  c.header('Content-Type', 'application/problem+json; charset=utf-8');
  return c.body(JSON.stringify(body), p.status);
}

