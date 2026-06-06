/**
 * Minimal zero-dependency structured logger with a pino-like API
 * (logger.info({ ctx }, "message")). Emits one JSON line per call to stdout/
 * stderr, which Railway/Vercel capture. Swap in `pino` later if you want
 * transports/redaction — the call sites won't change.
 */
type Level = "debug" | "info" | "warn" | "error";

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = ORDER[(process.env.LOG_LEVEL as Level) || "info"] ?? 20;

function emit(level: Level, ctx: unknown, msg?: string) {
  if (ORDER[level] < threshold) return;
  const base =
    typeof ctx === "string" ? { msg: ctx } : { ...(ctx as object), msg };
  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    ...base,
  });
  if (level === "error" || level === "warn") console.error(line);
  else console.log(line);
}

export const logger = {
  debug: (ctx: unknown, msg?: string) => emit("debug", ctx, msg),
  info: (ctx: unknown, msg?: string) => emit("info", ctx, msg),
  warn: (ctx: unknown, msg?: string) => emit("warn", ctx, msg),
  error: (ctx: unknown, msg?: string) => emit("error", ctx, msg),
};
