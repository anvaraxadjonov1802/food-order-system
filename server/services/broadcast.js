// Barcha bot obunachilariga xabar yuborish (reklama/e'lon)
const BotSubscriber = require("../models/BotSubscriber");
const { tgApi } = require("../integrations/telegram");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Telegram limiti ~30 msg/s — xavfsiz tezlik uchun ~20/s (50ms oraliq).
const broadcast = async (text, photoUrl) => {
  const subs = await BotSubscriber.find({ active: true });
  let sent = 0, failed = 0, blocked = 0;

  for (const s of subs) {
    let r;
    if (photoUrl) {
      r = await tgApi("sendPhoto", { chat_id: s.chatId, photo: photoUrl, caption: text, parse_mode: "HTML" });
    } else {
      r = await tgApi("sendMessage", { chat_id: s.chatId, text, parse_mode: "HTML" });
    }
    if (r && r.ok) {
      sent++;
    } else {
      failed++;
      // 403 = user botni bloklagan → obunadan chiqaramiz
      if (r && (r.error_code === 403 || /blocked|deactivated/i.test(r.description || ""))) {
        blocked++;
        s.active = false;
        await s.save().catch(() => {});
      }
    }
    await sleep(50);
  }

  return { total: subs.length, sent, failed, blocked };
};

module.exports = { broadcast };
