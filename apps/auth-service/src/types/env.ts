export type Env = {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  DATABASE_URL: string;
  TRUSTED_ORIGINS: string[];
};

