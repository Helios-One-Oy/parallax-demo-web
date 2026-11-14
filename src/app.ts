import express, { type Request, type Response } from "express";
import { pinoHttp } from "pino-http";
import { z } from "zod";
import { logger } from "./logger.js";
import {
  addEvent,
  createShipment,
  etaCovers,
  getShipment,
  listShipments,
  type ShipmentStatus,
} from "./shipments.js";
import { releaseNotes, VERSION } from "./version.js";

const CreateShipmentSchema = z
  .object({
    origin: z.string().min(2),
    destination: z.string().min(2),
    etaStart: z.string().datetime(),
    etaEnd: z.string().datetime(),
  })
  .refine((v) => Date.parse(v.etaStart) <= Date.parse(v.etaEnd), {
    message: "etaStart must be on or before etaEnd",
    path: ["etaStart"],
  });

const EventSchema = z.object({
  status: z.enum(["created", "in_transit", "delivered", "exception"]),
  note: z.string().min(1),
});

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.get("/healthz", (_req: Request, res: Response) => {
    res.json({ status: "ok", service: "northbound-dispatch", version: VERSION });
  });

  app.get("/version", (_req: Request, res: Response) => {
    res.json({ version: VERSION, notes: releaseNotes() });
  });

  app.get("/shipments", (_req: Request, res: Response) => {
    res.json(listShipments());
  });

  app.post("/shipments", (req: Request, res: Response) => {
    const parsed = CreateShipmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid body", issues: parsed.error.issues });
    }
    const shipment = createShipment(parsed.data);
    return res.status(201).json(shipment);
  });

  app.get("/shipments/:id", (req: Request, res: Response) => {
    const shipment = getShipment(req.params.id);
    if (!shipment) return res.status(404).json({ error: "not found" });
    return res.json(shipment);
  });

  app.get("/shipments/:id/events", (req: Request, res: Response) => {
    const shipment = getShipment(req.params.id);
    if (!shipment) return res.status(404).json({ error: "not found" });
    return res.json(shipment.events);
  });

  app.post("/shipments/:id/events", (req: Request, res: Response) => {
    const parsed = EventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid body", issues: parsed.error.issues });
    }
    const shipment = addEvent(
      req.params.id,
      parsed.data.status as ShipmentStatus,
      parsed.data.note
    );
    if (!shipment) return res.status(404).json({ error: "not found" });
    return res.json(shipment);
  });

  app.get("/shipments/:id/covers", (req: Request, res: Response) => {
    const date = String(req.query.date ?? "");
    if (!date) return res.status(400).json({ error: "date query required" });
    const covered = etaCovers(req.params.id, date);
    if (covered === undefined) return res.status(404).json({ error: "not found" });
    return res.json({ id: req.params.id, date, covered });
  });

  return app;
}
