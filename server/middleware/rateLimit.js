// Rate limiter — Redis bo'lsa distributed (instance'lararo), bo'lmasa in-memory.
const { redis } = require("../lib/redis");

const memBuckets = new Map();
setInterval(() => { const now = Date.now(); for (const [k, b] of memBuckets) if (now > b.reset) memBuckets.delete(k); }, 10 * 60 * 1000);

// Bitta kalit uchun limitni tekshiradi → { limited, retryAfter }
const check = async (key, windowMs, max) => {
  if (redis) {
    try {
      const n = await redis.incr(key);
      if (n === 1) await redis.pexpire(key, windowMs);
      if (n > max) {
        const ttl = await redis.pttl(key);
        return { limited: true, retryAfter: Math.ceil((ttl > 0 ? ttl : windowMs) / 1000) };
      }
      return { limited: false };
    } catch { /* Redis xato → in-memory fallback */ }
  }
  const now = Date.now();
  let b = memBuckets.get(key);
  if (!b || now > b.reset) { b = { count: 0, reset: now + windowMs }; memBuckets.set(key, b); }
  b.count++;
  if (b.count > max) return { limited: true, retryAfter: Math.ceil((b.reset - now) / 1000) };
  return { limited: false };
};

const tooMany = (res, retryAfter) => {
  res.set("Retry-After", String(retryAfter));
  return res.status(429).json({ message: "Juda ko'p so'rov. Birozdan keyin qayta urinib ko'ring." });
};

// Endpointga xos limiter (factory)
const rateLimit = ({ windowMs, max }) => async (req, res, next) => {
  try {
    const key = `rl:${req.ip || req.connection?.remoteAddress || "?"}:${req.baseUrl || ""}${req.route?.path || req.path}`;
    const r = await check(key, windowMs, max);
    if (r.limited) return tooMany(res, r.retryAfter);
    next();
  } catch { next(); } // fail-open (infra xatosida legit trafikni bloklamaymiz)
};

// Global limiter: har IP uchun umumiy chegara (flood/DoS himoyasi)
const GLOBAL_MAX = Number(process.env.GLOBAL_RATE_MAX) || 300;
const GLOBAL_WINDOW = Number(process.env.GLOBAL_RATE_WINDOW_MS) || 60 * 1000;
const globalSkip = (p) => p.startsWith("/webhook") || p.startsWith("/api/payments") || p.startsWith("/api/images") || p.startsWith("/uploads");

const globalRateLimit = async (req, res, next) => {
  try {
    if (globalSkip(req.path)) return next();
    const key = `grl:${req.ip || req.connection?.remoteAddress || "?"}`;
    const r = await check(key, GLOBAL_WINDOW, GLOBAL_MAX);
    if (r.limited) return tooMany(res, r.retryAfter);
    next();
  } catch { next(); }
};

module.exports = { rateLimit, globalRateLimit };
