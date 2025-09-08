import type { Hono } from 'hono';
import type { SessionService } from '../../../core/services/session';

type Deps = {
  sessionService: SessionService;
};

export const registerMeRoutes = (app: Hono, { sessionService }: Deps) => {
  app.get('/api/me', async (c) => {
    const session = await sessionService.getSession(c.req.raw.headers);

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    return c.json(session.user);
  });
};
