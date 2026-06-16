# Sandbox

## Purpose

A standalone Express mock server for Supplier API integration testing, allowing suppliers to validate their integrations without AWS access.

## General Flow

1. The server starts from `index.js`/`expressServer.js` and loads `api/openapi.yaml`.
2. Incoming requests are validated against the OpenAPI contract before reaching handlers.
3. Valid requests are routed to controller/service handlers that return canned responses from `data/examples/`.
4. The sandbox runs on port 9000 by default (configurable in `config.js`).

## Key Integration Points

- **OpenAPI spec**: the sandbox uses `api/openapi.yaml` to enforce request/response contract validation.
- **Swagger UI**: available at `/api-docs/` for interactive endpoint exploration.
- **Canned responses**: JSON files in `data/examples/` provide mock API data.
- **Docker**: `Dockerfile` enables containerised deployment for CI or supplier testing environments.

## Nuances and Peculiarities

- `LetterService.listLetters` respects the `limit` query parameter by truncating the canned response array to simulate pagination.
- This is an OpenAPI Generator-scaffolded project (CommonJS, not TypeScript). It does not share code with the Lambda implementations.
- No authentication is enforced; the authorization behaviour is not simulated.
- The OpenAPI spec in `sandbox/api/` may diverge from `specification/api/` if not kept in sync during spec updates.

## Running

```bash
cd sandbox && npm install && npm start
```

Or via Docker:

```bash
docker build -t supplier-api-sandbox sandbox/
docker run -p 9000:9000 supplier-api-sandbox
```
