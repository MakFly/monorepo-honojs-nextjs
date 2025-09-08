import type { Session } from '../../types/session';

export interface SessionService {
  getSession(headers: Headers): Promise<Session>;
}
