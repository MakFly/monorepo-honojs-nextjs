import type { Hono } from 'hono';

export type RoutesRegistrar = (app: Hono) => void;

