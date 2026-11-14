import { inRange } from "@nbd/date-range";
import { event } from "@nbd/telemetry-utils";
import { logger } from "./logger.js";

export type ShipmentStatus =
  | "created"
  | "in_transit"
  | "delivered"
  | "exception";

export interface ShipmentEvent {
  ts: string;
  status: ShipmentStatus;
  note: string;
}

export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  etaStart: string;
  etaEnd: string;
  events: ShipmentEvent[];
}

export interface CreateShipmentInput {
  origin: string;
  destination: string;
  etaStart: string;
  etaEnd: string;
}

const store = new Map<string, Shipment>();
let seq = 1000;

function emit(name: string, props: Record<string, unknown>): void {
  // @nbd/telemetry-utils builds a normalised event; we log it.
  logger.info(event(name, props), name);
}

export function createShipment(input: CreateShipmentInput): Shipment {
  const id = `NBD-${++seq}`;
  const shipment: Shipment = {
    id,
    origin: input.origin,
    destination: input.destination,
    status: "created",
    etaStart: input.etaStart,
    etaEnd: input.etaEnd,
    events: [{ ts: new Date().toISOString(), status: "created", note: "label created" }],
  };
  store.set(id, shipment);
  emit("shipment.created", { id, origin: input.origin, destination: input.destination });
  return shipment;
}

export function getShipment(id: string): Shipment | undefined {
  return store.get(id);
}

export function listShipments(): Shipment[] {
  return [...store.values()];
}

export function addEvent(
  id: string,
  status: ShipmentStatus,
  note: string
): Shipment | undefined {
  const shipment = store.get(id);
  if (!shipment) return undefined;
  shipment.status = status;
  shipment.events.push({ ts: new Date().toISOString(), status, note });
  emit("shipment.event", { id, status });
  return shipment;
}

// Is a given date inside a shipment's promised ETA window?
export function etaCovers(id: string, date: string): boolean | undefined {
  const shipment = store.get(id);
  if (!shipment) return undefined;
  return inRange(date, shipment.etaStart, shipment.etaEnd);
}

export function _reset(): void {
  store.clear();
  seq = 1000;
}
