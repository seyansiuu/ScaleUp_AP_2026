# Backend architecture

The Express app is composed in `src/app.js`; `src/server.js` owns the HTTP
listener and Prisma shutdown. Routes map URLs to validated controller calls.
Controllers handle HTTP input/output only, while services own authentication,
startup rules, simulation orchestration, and Prisma transactions. Prisma is the
database model and is shared through `src/models/index.js`.

Successful responses use `{ "success": true, "data": ... }`. Errors use
`{ "success": false, "error": { "message": ..., "details": ... } }`.
Validation errors return status 400. Copy `.env.example` to `.env` and set the
database URL and a private JWT secret before deploying.

## File inventory

- `src/app.js` — Express middleware, health endpoint, route mounting, and 404 handling.
- `src/server.js` — listener, domain event logging, and graceful Prisma shutdown.
- `src/config/env.js` — environment loading and validated runtime settings.
- `src/config/database.js` — shared Prisma client.
- `src/models/index.js` — persistence model boundary, exporting the shared Prisma client.
- `src/routes/authRoutes.js`, `src/routes/startupRoutes.js` — API route declarations.
- `src/controllers/authController.js`, `src/controllers/startupController.js` — HTTP adapters.
- `src/services/authService.js` — password hashing, login, registration, and JWT issuance.
- `src/services/startupService.js` — Prisma startup operations, term sheet rules, and atomic turn execution.
- `src/validators/authValidators.js`, `src/validators/startupValidators.js` — Zod request schemas.
- `src/middleware/validate.js` — reusable Zod validation middleware.
- `src/middleware/auth.js` — Bearer JWT verification.
- `src/middleware/errorHandler.js` — centralized validation, domain, and Prisma error mapping.
- `src/utils/asyncHandler.js` — forwards asynchronous controller failures to Express 4 error handling.
- `src/utils/response.js` — consistent success and error response shapes.
- `src/engine/turnEngine.js` — existing pure simulation engine, unchanged.
- `src/utils/money.js`, `src/utils/prng.js` — existing monetary serialization and deterministic PRNG helpers, unchanged.
- `prisma/schema.prisma` — existing PostgreSQL data model, unchanged.
- `package.json` — adds the syntax check script; existing dependencies and commands remain.
- `.env.example` — example local runtime configuration.
