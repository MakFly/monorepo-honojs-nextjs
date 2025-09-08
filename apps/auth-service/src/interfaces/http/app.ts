import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { RoutesRegistrar } from '../../types/http';
import { acceptJsonOnly, apiVersion, requestId, securityHeaders } from './middleware';
import { problem } from './problem';

type CreateAppDeps = {
  cors: { trustedOrigins: string[] };
  routes: RoutesRegistrar;
};

export const createApp = ({ cors: corsCfg, routes }: CreateAppDeps) => {
  const app = new Hono();

  // Global middlewares
  app.use('*', requestId);
  app.use('*', securityHeaders);

  app.use(
    '/api/*',
    cors({
      origin: corsCfg.trustedOrigins,
      credentials: true,
    })
  );
  app.use('/api/*', acceptJsonOnly);
  app.use('/api/*', apiVersion('1'));

  // Register routes via provided registrar (dependency inversion)
  routes(app);

  // Centralized error handling with RFC7807 problem+json
  app.onError((err, c) => {
    console.error('Unhandled error:', err); // basic logging
    return problem(c, {
      status: 500,
      title: 'Internal Server Error',
      type: 'https://httpstatuses.com/500',
      detail: 'An unexpected error occurred.',
      code: 'INTERNAL_ERROR',
    });
  });

  // Unified 404
  app.notFound((c) =>
    problem(c, {
      status: 404,
      title: 'Not Found',
      type: 'https://httpstatuses.com/404',
      detail: 'The requested resource was not found.',
      code: 'NOT_FOUND',
    })
  );

  return app;
};
