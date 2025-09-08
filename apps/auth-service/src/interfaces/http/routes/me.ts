import type { Hono } from 'hono';
import type { SessionService } from '../../../core/services/session';
import { problem } from '../../http/problem';

type Deps = {
  sessionService: SessionService;
};

export const registerMeRoutes = (app: Hono, { sessionService }: Deps) => {
  // Backward-compatible route (pre-versioned)
  app.get('/api/me', async (c) => {
    const session = await sessionService.getSession(c.req.raw.headers);
    if (!session) {
      c.header('WWW-Authenticate', 'Bearer realm="auth"');
      return problem(c, {
        status: 401,
        title: 'Unauthorized',
        type: 'https://httpstatuses.com/401',
        detail: 'Authentication is required to access this resource.',
        code: 'AUTH_UNAUTHORIZED',
      });
    }
    return c.json(session.user);
  });

  // Versioned route (recommended)
  app.get('/api/v1/me', async (c) => {
    const session = await sessionService.getSession(c.req.raw.headers);
    if (!session) {
      c.header('WWW-Authenticate', 'Bearer realm="auth"');
      return problem(c, {
        status: 401,
        title: 'Unauthorized',
        type: 'https://httpstatuses.com/401',
        detail: 'Authentication is required to access this resource.',
        code: 'AUTH_UNAUTHORIZED',
      });
    }
    return c.json(session.user, 200);
  });
};
