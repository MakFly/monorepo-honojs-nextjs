Auth Service (Hono + BetterAuth)

Overview
- Hono-based HTTP service that mounts BetterAuth at `/api/auth/*` and exposes first-party routes under `/api/v1/*`.
- Follows pragmatic API design practices: versioned routes, consistent error format (RFC 7807), request correlation IDs, and sensible security headers.

Key Endpoints
- `GET /healthz` and `GET /api/v1/healthz`: Health checks.
- `GET /api/v1/me`: Returns the authenticated user. Backward-compatible alias: `GET /api/me`.
- `ANY /api/auth/*`: BetterAuth endpoints for sign-in/up, session, etc.

Versioning
- Current version: `v1`. All new endpoints should live under `/api/v1/...`.
- The service adds `X-API-Version: 1` to all `/api/*` responses.

Error Format (RFC 7807)
- Media type: `application/problem+json`.
- Shape:
  {
    "type": "https://httpstatuses.com/401",
    "title": "Unauthorized",
    "status": 401,
    "detail": "Authentication is required to access this resource.",
    "code": "AUTH_UNAUTHORIZED",
    "traceId": "..."
  }
- All 4xx/5xx responses include a `traceId` (propagated from `X-Request-Id` or generated per request).

Headers
- `X-Request-Id`: Present on all responses for correlation. You may send your own.
- `X-API-Version`: Advertises the current API major version.
- `WWW-Authenticate: Bearer realm="auth"` is returned on 401 responses.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`.
- `Cache-Control: no-store` on `/api/*` to prevent caching of sensitive data.

Content Negotiation
- JSON only. Requests with `Accept` excluding `application/json` (and not `*/*`) receive `406 Not Acceptable`.

Migration Notes
- Existing clients hitting `GET /api/me` continue to work. Prefer `GET /api/v1/me` going forward.
- No change to BetterAuth base path (`/api/auth`). `apps/web` continues to work without modification.

Local Development
- Start: `pnpm --filter auth-service dev`
- Health: `curl -i http://localhost:4001/healthz`
- Me (unauthenticated): `curl -i http://localhost:4001/api/v1/me`

