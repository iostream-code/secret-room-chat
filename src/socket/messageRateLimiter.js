import { config } from "../config.js";

// Sliding-window counter per socket: { count, windowStart }
const hits = new Map();

export function isRateLimited(socketId) {
  const now = Date.now();
  const entry = hits.get(socketId);

  if (!entry || now - entry.windowStart >= config.rateLimit.windowMs) {
    hits.set(socketId, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > config.rateLimit.maxMessages;
}

export function clearRateLimit(socketId) {
  hits.delete(socketId);
}
