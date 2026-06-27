// Fon jarayonlari uchun alohida worker (API'dan ajratilgan).
// Ko'p instance deploy: API'larda RUN_JOBS=false, bitta `node worker.js` ishga tushiring.
// Lock baribir himoya qiladi — bir nechta worker bo'lsa ham faqat bittasi bajaradi.
require("dotenv").config();
const connectDB = require("./db");
const { tryLock } = require("./lib/redis");
const { autoCancelUnpaidOrders } = require("./services/orderJobs");

const INTERVAL_MS = 5 * 60 * 1000;

const tick = async () => {
  try {
    if (await tryLock("lock:autocancel", 290)) await autoCancelUnpaidOrders();
  } catch (e) {
    console.error("Worker tick xato:", e.message);
  }
};

(async () => {
  await connectDB();
  console.log("⚙️  Worker ishga tushdi — fon jarayonlari (har 5 daqiqa)");
  await tick();
  setInterval(tick, INTERVAL_MS);
})();
