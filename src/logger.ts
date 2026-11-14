import pino from "pino";

export const logger = pino({
  name: "northbound-dispatch",
  level: process.env.LOG_LEVEL ?? "info",
});
