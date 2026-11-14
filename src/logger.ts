import pino from "pino";

export const logger = pino({
  name: "northbound-dispatch",
  level: process.env.NBD_LOG_LEVEL ?? "info",
});
