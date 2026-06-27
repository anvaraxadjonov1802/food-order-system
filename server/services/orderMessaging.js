// Buyurtma bo'yicha Telegram xabarlari (xodimlar guruhi, tugmalar, statistika, qidiruv)
const Order = require("../models/Order");
const { tgApi, TG_STAFF, TG_CHAT, TG_CHANNEL } = require("../integrations/telegram");
const { STATUS_LABELS } = require("../config/constants");

// Buyurtma matni (status qatori bilan) — yuborishda ham, tahrirlashda ham
const buildOrderTelegramText = (order) => {
  const itemsList = (order.items || []).map(i => `  • ${i.title} × ${i.quantity} = ${(Number(i.price) * Number(i.quantity)).toLocaleString()} so'm`).join("\n");
  const locText = order.location?.lat ? `\n🗺 <a href="https://yandex.com/maps/?pt=${order.location.lng},${order.location.lat}&z=16&l=map">Xaritada ko'rish</a>` : "";
  const orderTypeText = order.orderType === "pickup" ? "🛍 <b>Olib ketish</b>" : "🛵 <b>Dastavka</b>";
  const isCash = order.paymentType === "cash";
  const payLabel = isCash ? "💵 Naqd" : (order.paymentProvider === "payme" ? "Payme" : "Click");
  const taxiText = order.orderType === "delivery"
    ? `\n🚕 Taxi: ${Number(order.deliveryPrice || 0).toLocaleString()} so'm (mijoz haydovchiga NAQD to'laydi)${order.milleniumOrderId ? ` | Millenium #${order.milleniumOrderId}` : "\n⚠️ <b>Millenium chaqirilmadi — taxini QO'LDA chaqiring!</b>"}`
    : "";
  const statusLine = `\n\n📌 <b>Holat: ${STATUS_LABELS[order.status] || order.status}</b>${order.statusUpdatedBy ? ` — ${order.statusUpdatedBy}` : ""}`;
  const header = isCash
    ? `🛎 <b>YANGI BUYURTMA — 💵 NAQD (olib ketganda)</b>\n${orderTypeText}\n\n`
    : `🛎 <b>YANGI BUYURTMA — ✅ TO'LANDI (${payLabel})</b>\n${orderTypeText}\n\n`;
  const payLine = isCash
    ? `💵 <b>Naqd to'lov: ${Number(order.paymentAmount || order.totalPrice || 0).toLocaleString()} so'm — olib ketganda</b>\n`
    : `💳 <b>Taomlar uchun to'landi: ${Number(order.paymentAmount || order.totalPrice || 0).toLocaleString()} so'm</b>${order.orderType === "delivery" && order.deliveryPrice ? `\n💵 Taxi (naqd): ${Number(order.deliveryPrice).toLocaleString()} so'm` : ""}\n`;
  return (
    header +
    `👤 <b>${order.customerName}</b>\n📞 ${order.customerPhone}\n` +
    (order.address ? `📍 ${order.address}\n` : "") +
    `${locText}\n\n🍽 <b>Taomlar:</b>\n${itemsList}\n\n` +
    `💰 Taomlar: ${Number(order.totalPrice || 0).toLocaleString()} so'm${taxiText}\n` +
    payLine +
    `🧾 Order: ${order._id}` +
    statusLine
  );
};

const buildStatusKeyboard = (order) => {
  const id = String(order._id);
  const btn = (text, st) => ({ text, callback_data: `st:${id}:${st}` });
  if (order.status === "new") return { inline_keyboard: [[btn("🍳 Tayyorlanmoqda", "preparing"), btn("❌ Bekor", "cancelled")]] };
  if (order.status === "preparing") {
    const next = order.orderType === "delivery" ? btn("🚕 Yo'lda", "on_way") : btn("✅ Yetkazildi", "delivered");
    return { inline_keyboard: [[next, btn("❌ Bekor", "cancelled")]] };
  }
  if (order.status === "on_way") return { inline_keyboard: [[btn("✅ Yetkazildi", "delivered"), btn("❌ Bekor", "cancelled")]] };
  return null;
};

const buildDeleteKeyboard = (order) => ({ inline_keyboard: [[{ text: "🗑 O'chirish", callback_data: `del:${order._id}` }]] });

const editStaffOrderMessage = async (order) => {
  if (!order.tgChatId || !order.tgMessageId) return;
  const payload = { chat_id: order.tgChatId, message_id: order.tgMessageId, text: buildOrderTelegramText(order), parse_mode: "HTML" };
  const kb = buildStatusKeyboard(order);
  if (kb) payload.reply_markup = kb;
  else if (["delivered", "cancelled"].includes(order.status)) payload.reply_markup = buildDeleteKeyboard(order);
  await tgApi("editMessageText", payload);
};

const orderShortLine = (order) => {
  const idTail = String(order._id).slice(-5);
  const type = order.orderType === "pickup" ? "🛍" : "🛵";
  const sum = Number(order.paymentAmount || order.totalPrice || 0).toLocaleString();
  return `${STATUS_LABELS[order.status] || order.status} ${type} <code>${idTail}</code> — ${order.customerName} | ${sum} so'm | 📞 ${order.customerPhone}`;
};

const sendActiveOrdersList = async (chatId) => {
  const list = await Order.find({ status: { $in: ["new", "preparing", "on_way"] }, paymentStatus: "paid" }).sort({ createdAt: -1 }).limit(20);
  if (!list.length) {
    await tgApi("sendMessage", { chat_id: chatId, text: "📭 Aktiv buyurtma yo'q.", parse_mode: "HTML" });
    return;
  }
  const lines = list.map((o, i) => `${i + 1}. ${orderShortLine(o)}`).join("\n");
  await tgApi("sendMessage", { chat_id: chatId, text: `📋 <b>Aktiv buyurtmalar (${list.length})</b>\n\n${lines}\n\nBatafsil: <code>/find ID-oxiri</code> yoki <code>/find telefon</code>`, parse_mode: "HTML" });
};

const sendTodayStats = async (chatId) => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const paid = await Order.find({ createdAt: { $gte: start }, paymentStatus: "paid" });
  const totalSum = paid.reduce((s, o) => s + Number(o.paymentAmount || o.totalPrice || 0), 0);
  const foodSum = paid.reduce((s, o) => s + Number(o.totalPrice || 0), 0);
  const taxiSum = paid.reduce((s, o) => s + Number(o.deliveryPrice || 0), 0);
  const byStatus = {};
  for (const o of paid) byStatus[o.status] = (byStatus[o.status] || 0) + 1;
  const delivery = paid.filter(o => o.orderType === "delivery").length;
  const pickup = paid.filter(o => o.orderType === "pickup").length;
  const statusLines = Object.keys(byStatus).map(st => `   ${STATUS_LABELS[st] || st}: ${byStatus[st]}`).join("\n") || "   —";
  await tgApi("sendMessage", {
    chat_id: chatId, parse_mode: "HTML",
    text: `📊 <b>Bugungi statistika</b>\n\n🧾 To'langan buyurtmalar: <b>${paid.length}</b>\n   🛵 Dastavka: ${delivery} | 🛍 Olib ketish: ${pickup}\n\n💰 Taomlar: ${foodSum.toLocaleString()} so'm\n🚕 Taxi: ${taxiSum.toLocaleString()} so'm\n💳 <b>Jami tushum: ${totalSum.toLocaleString()} so'm</b>\n\n📌 Holatlar:\n${statusLines}`,
  });
};

const sendOrderSearch = async (chatId, query) => {
  const q = String(query || "").trim();
  if (!q) {
    await tgApi("sendMessage", { chat_id: chatId, text: "Qidiruv: <code>/find ID-oxiri</code> yoki <code>/find +998...</code>", parse_mode: "HTML" });
    return;
  }
  let orders = [];
  const digits = q.replace(/[^0-9]/g, "");
  if (digits.length >= 7) {
    orders = await Order.find({ customerPhone: { $regex: digits + "$" } }).sort({ createdAt: -1 }).limit(5);
  } else {
    orders = await Order.find({}).sort({ createdAt: -1 }).limit(200);
    orders = orders.filter(o => String(o._id).endsWith(q)).slice(0, 5);
  }
  if (!orders.length) {
    await tgApi("sendMessage", { chat_id: chatId, text: `🔍 "${q}" bo'yicha buyurtma topilmadi.`, parse_mode: "HTML" });
    return;
  }
  for (const order of orders) {
    const payload = { chat_id: chatId, text: buildOrderTelegramText(order), parse_mode: "HTML" };
    const kb = ["delivered", "cancelled"].includes(order.status) ? buildDeleteKeyboard(order) : buildStatusKeyboard(order);
    if (kb) payload.reply_markup = kb;
    await tgApi("sendMessage", payload);
  }
};

const sendPaidOrderTelegram = async (order) => {
  try {
    const text = buildOrderTelegramText(order);
    const staffChat = TG_STAFF || TG_CHAT;
    if (staffChat) {
      const payload = { chat_id: staffChat, text, parse_mode: "HTML" };
      const kb = buildStatusKeyboard(order);
      if (kb) payload.reply_markup = kb;
      const resp = await tgApi("sendMessage", payload);
      if (resp?.ok && resp.result?.message_id) {
        order.tgChatId = String(staffChat);
        order.tgMessageId = resp.result.message_id;
        await order.save();
      }
    }
    for (const chatId of [TG_CHAT, TG_CHANNEL].filter(Boolean)) {
      if (String(chatId) === String(staffChat)) continue;
      await tgApi("sendMessage", { chat_id: chatId, text, parse_mode: "HTML" });
    }
  } catch (e) {
    console.error("Paid-order telegram xato:", e.message);
  }
};

module.exports = {
  buildOrderTelegramText, buildStatusKeyboard, buildDeleteKeyboard, editStaffOrderMessage,
  orderShortLine, sendActiveOrdersList, sendTodayStats, sendOrderSearch, sendPaidOrderTelegram,
};
