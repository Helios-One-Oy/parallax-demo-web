import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Server } from "node:http";
import { createApp } from "../src/app.js";
import { _reset } from "../src/shipments.js";

let server: Server;
let base: string;

beforeAll(async () => {
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  base = `http://127.0.0.1:${port}`;
});

afterAll(() => {
  server?.close();
});

beforeEach(() => _reset());

async function post(path: string, body: unknown) {
  return fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("northbound-dispatch api", () => {
  it("reports health", async () => {
    const res = await fetch(base + "/healthz");
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("ok");
  });

  it("builds release notes via @nbd/release-notes", async () => {
    const res = await fetch(base + "/version");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.version).toBe("1.3.0");
    expect(body.notes).toContain("## feat");
    expect(body.notes).toContain("## fix");
  });

  it("creates and fetches a shipment", async () => {
    const create = await post("/shipments", {
      origin: "Helsinki",
      destination: "Oslo",
      etaStart: "2026-12-10T00:00:00.000Z",
      etaEnd: "2026-12-14T00:00:00.000Z",
    });
    expect(create.status).toBe(201);
    const created = await create.json();
    expect(created.id).toMatch(/^NBD-\d+$/);

    const get = await fetch(`${base}/shipments/${created.id}`);
    expect(get.status).toBe(200);
    const got = await get.json();
    expect(got.destination).toBe("Oslo");
    expect(got.events).toHaveLength(1);
  });

  it("rejects an invalid shipment body", async () => {
    const res = await post("/shipments", { origin: "X" });
    expect(res.status).toBe(400);
  });

  it("rejects an ETA window that ends before it starts", async () => {
    const res = await post("/shipments", {
      origin: "Helsinki",
      destination: "Oslo",
      etaStart: "2026-12-14T00:00:00.000Z",
      etaEnd: "2026-12-10T00:00:00.000Z",
    });
    expect(res.status).toBe(400);
  });

  it("checks ETA-window coverage via @nbd/date-range", async () => {
    const create = await post("/shipments", {
      origin: "Helsinki",
      destination: "Oslo",
      etaStart: "2026-12-10T00:00:00.000Z",
      etaEnd: "2026-12-14T00:00:00.000Z",
    });
    const id = (await create.json()).id as string;

    const inside = await fetch(
      `${base}/shipments/${id}/covers?date=2026-12-12T00:00:00.000Z`
    );
    expect((await inside.json()).covered).toBe(true);

    const outside = await fetch(
      `${base}/shipments/${id}/covers?date=2026-12-20T00:00:00.000Z`
    );
    expect((await outside.json()).covered).toBe(false);
  });

  it("appends an event and advances status", async () => {
    const create = await post("/shipments", {
      origin: "Helsinki",
      destination: "Oslo",
      etaStart: "2026-12-10T00:00:00.000Z",
      etaEnd: "2026-12-14T00:00:00.000Z",
    });
    const id = (await create.json()).id as string;
    const ev = await post(`/shipments/${id}/events`, {
      status: "in_transit",
      note: "departed hub",
    });
    expect(ev.status).toBe(200);
    const body = await ev.json();
    expect(body.status).toBe("in_transit");
    expect(body.events).toHaveLength(2);
  });

  it("404s for an unknown shipment", async () => {
    const res = await fetch(base + "/shipments/NBD-404");
    expect(res.status).toBe(404);
  });
});
