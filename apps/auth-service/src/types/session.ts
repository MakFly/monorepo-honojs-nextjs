export type SessionUser = {
  id: string;
  email: string;
  [k: string]: unknown;
};

export type Session = {
  user: SessionUser;
  [k: string]: unknown;
} | null;

