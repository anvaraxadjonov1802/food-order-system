// Redis abstraksiyasi — masshtablash uchun.
// REDIS_URL bo'lsa → ulanadi (bir nechta instance umumiy holatni bo'lishadi).
// Bo'lmasa → null (har bir modul in-memory fallback ishlatadi). Lokal/dev shu rejimda.
// Prod ko'p instance: REDIS_URL qo'ying + `npm i ioredis`.
let redis = null;
let subscriber = null;

if (process.env.REDIS_URL) {
  try {
    const Redis = require("ioredis");
    const opts = { maxRetriesPerRequest: 2, enableOfflineQueue: false };
    redis = new Redis(process.env.REDIS_URL, opts);
    subscriber = new Redis(process.env.REDIS_URL, opts);
    redis.on("error", (e) => console.error("Redis:", e.message));
    subscriber.on("error", () => {});
    console.log("✅ Redis ulandi — distributed rejim (kesh + rate-limit + lock)");
  } catch (e) {
    console.warn("⚠️  REDIS_URL berilgan, lekin ioredis topilmadi — in-memory fallback. Prod uchun: npm i ioredis");
    redis = null; subscriber = null;
  }
}

// Distributed lock: faqat bitta instance ishni bajaradi (cron dublikatini oldini oladi).
// Redis yo'q bo'lsa → har doim true (single instance, lock kerak emas).
const tryLock = async (key, ttlSec) => {
  if (!redis) return true;
  try {
    const r = await redis.set(key, "1", "EX", ttlSec, "NX");
    return r === "OK";
  } catch { return true; } // Redis xato → bloklamaymiz (fail-open)
};

module.exports = { redis, subscriber, tryLock };
