# Northbound Dispatch — web

Shipment tracking API for the fictional logistics company Northbound Dispatch.
Part of the Parallax fleet (`ToukoUrsin/parallax-demo-web`): its CI runs twice on
CRACI runners (a bare twin and a decoy twin) so Parallax can diff their network
traces.

## Stack

Node 22, Express, zod, pino, TypeScript (built with `tsc`), vitest.

## Routes

- `GET /healthz` — liveness
- `GET /version` — version and release notes (built with `@nbd/release-notes`)
- `GET /shipments` — list shipments
- `POST /shipments` — create a shipment (zod-validated)
- `GET /shipments/:id` — one shipment
- `GET /shipments/:id/events` — its event history
- `POST /shipments/:id/events` — append an event
- `GET /shipments/:id/covers?date=<iso>` — is a date inside the ETA window (uses `@nbd/date-range`)

## Dependencies from the Parallax sink

`@nbd/telemetry-utils`, `@nbd/release-notes`, `@nbd/date-range` come from the
Parallax sink registry (see `.npmrc`). `main` pins their clean versions. Attack
replays live on `deps/*` branches that bump one of them to a specimen version.

## Develop

```
npm ci
npm test
npm run build
npm start
```
