import type { Env } from '../types/env';
import { buildBetterAuth } from './auth/auth';
import type { SessionService } from '../core/services/session';
import type { Session } from '../types/session';
import { registerAuthRoutes } from '../interfaces/http/routes/auth';
import { registerMeRoutes } from '../interfaces/http/routes/me';
import type { RoutesRegistrar } from '../types/http';

export const buildDependencies = (env: Env) => {
  const auth = buildBetterAuth(env);

  const sessionService: SessionService = {
    getSession: async (headers: Headers): Promise<Session> => {
      return auth.api.getSession({ headers });
    },
  };

  const routes: RoutesRegistrar = (app) => {
    registerMeRoutes(app, { sessionService });
    registerAuthRoutes(app, { authHandler: auth.handler });
  };

  return {
    routes,
  };
};
