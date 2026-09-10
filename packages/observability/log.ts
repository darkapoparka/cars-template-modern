import { log as logtail } from "@logtail/next";
import { isBetterStackLoggingConfigured } from "./better-stack";
import { sanitizeLogArguments } from "./redaction";

type LogLevel = "debug" | "error" | "info" | "warn";

const sink =
  process.env.NODE_ENV === "production" && isBetterStackLoggingConfigured()
    ? logtail
    : console;

const write = (level: LogLevel, values: readonly unknown[]): void => {
  const method = sink[level] as (...arguments_: unknown[]) => void;
  method.call(sink, ...sanitizeLogArguments(values));
};

export const log = {
  debug: (...values: unknown[]) => write("debug", values),
  error: (...values: unknown[]) => write("error", values),
  info: (...values: unknown[]) => write("info", values),
  warn: (...values: unknown[]) => write("warn", values),
};
