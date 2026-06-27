const fetch = require("../lib/fetch");

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;
const TG_CHANNEL = process.env.TELEGRAM_CHANNEL_ID;
const TG_STAFF = process.env.TELEGRAM_STAFF_CHAT_ID; // xodimlar guruhi (tugmali xabarlar)

// Oddiy matnli xabar — chat va kanalga
const sendTelegram = async (text) => {
  if (!TG_TOKEN) return;
  for (const chatId of [TG_CHAT, TG_CHANNEL].filter(Boolean)) {
    try {
      await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      });
    } catch (e) { console.error("Telegram:", e.message); }
  }
};

// Telegram Bot API ga umumiy so'rov
const tgApi = async (method, payload) => {
  if (!TG_TOKEN) return null;
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/${method}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await r.json();
  } catch (e) { console.error("Telegram API:", method, e.message); return null; }
};

module.exports = { TG_TOKEN, TG_CHAT, TG_CHANNEL, TG_STAFF, sendTelegram, tgApi };
