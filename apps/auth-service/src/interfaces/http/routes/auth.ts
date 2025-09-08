import type { Hono } from 'hono';

type Deps = {
  authHandler: (c: any) => Promise<any> | any;
};

export const registerAuthRoutes = (app: Hono, { authHandler }: Deps) => {
  app.on(['GET', 'POST', 'PUT', 'DELETE'], '/api/auth/*', authHandler);
};

