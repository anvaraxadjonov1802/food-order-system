const router = require("express").Router();
const Order = require("../models/Order");
const { tgApi, TG_STAFF, TG_CHAT, TG_CHANNEL } = require("../integrations/telegram");
const { STAFF_HELP, ORDER_STATUSES } = require("../config/constants");
const { sendActiveOrdersList, sendTodayStats, sendOrderSearch, editStaffOrderMessage } = require("../services/orderMessaging");
const { mapMilleniumStatus, pick, MILLENIUM_TLS_VERIFY } = require("../integrations/millenium");

const TG_ALLOWED_CHATS = new Set(
  [process.env.TELEGRAM_ALLOWED_CHATS, TG_STAFF, TG_CHAT, TG_CHANNEL]
    .filter(Boolean)
    .flatMap(v => String(v).split(","))
    .map(s => s.trim())
    .filter(Boolean)
);
const isAllowedChat = (chatId) =>
  TG_ALLOWED_CHATS.size === 0 || TG_ALLOWED_CHATS.has(String(chatId));

router.post("/webhook/telegram", async (req, res) => {
  try {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secret && req.headers["x-telegram-bot-api-secret-token"] !== secret) {
      return res.sendStatus(403);
    }

    const update = req.body || {};

    // Guruhda /id yozilsa — chat ID ni aytadi (sozlashni osonlashtiradi)
    const msgText = update.message?.text || "";

    // Allowlist: /id dan tashqari hamma narsa ruxsat etilgan chatlardan kelishi shart
    const incomingChatId = update.message?.chat?.id ?? update.callback_query?.message?.chat?.id;
    const isIdCmd = msgText.trim().startsWith("/id");
    if (!isIdCmd && incomingChatId !== undefined && !isAllowedChat(incomingChatId)) {
      return res.status(200).json({ ok: true, ignored: "chat_not_allowed" });
    }
    if (msgText.trim().startsWith("/id")) {
      await tgApi("sendMessage", {
        chat_id: update.message.chat.id,
        text: `Chat ID: <code>${update.message.chat.id}</code>`,
        parse_mode: "HTML",
      });
      return res.sendStatus(200);
    }

    // Xodimlar komandalar (matnli)
    if (msgText.trim()) {
      const text = msgText.trim();
      const chatId = update.message.chat.id;

      if (text.startsWith("/start") || text.startsWith("/help")) {
        await tgApi("sendMessage", { chat_id: chatId, text: STAFF_HELP, parse_mode: "HTML" });
        return res.sendStatus(200);
      }
      if (text.startsWith("/active")) {
        await sendActiveOrdersList(chatId);
        return res.sendStatus(200);
      }
      if (text.startsWith("/stats")) {
        await sendTodayStats(chatId);
        return res.sendStatus(200);
      }
      if (text.startsWith("/find")) {
        const query = text.replace(/^\/find(@\w+)?\s*/i, "");
        await sendOrderSearch(chatId, query);
        return res.sendStatus(200);
      }
    }

    const cb = update.callback_query;

    // O'chirish callback'i (yakunlangan buyurtma)
    if (cb?.data && cb.data.startsWith("del:")) {
      const orderId = cb.data.split(":")[1];
      if (!/^[a-f0-9]{24}$/i.test(orderId || "")) {
        await tgApi("answerCallbackQuery", { callback_query_id: cb.id, text: "Noto'g'ri so'rov" });
        return res.sendStatus(200);
      }
      const order = await Order.findById(orderId);
      if (!order) {
        await tgApi("answerCallbackQuery", { callback_query_id: cb.id, text: "Buyurtma topilmadi" });
        return res.sendStatus(200);
      }
      if (!["delivered", "cancelled"].includes(order.status)) {
        await tgApi("answerCallbackQuery", { callback_query_id: cb.id, text: "Faqat yakunlangan buyurtmani o'chirish mumkin" });
        return res.sendStatus(200);
      }
      const byName = [cb.from?.first_name, cb.from?.last_name].filter(Boolean).join(" ") || cb.from?.username || "Xodim";
      await Order.findByIdAndDelete(orderId);
      if (order.tgChatId && order.tgMessageId) {
        await tgApi("editMessageText", {
          chat_id: order.tgChatId,
          message_id: order.tgMessageId,
          text: `🗑 <b>O'chirildi</b> — ${byName}\n${order.customerName} | 📞 ${order.customerPhone}`,
          parse_mode: "HTML",
        });
      }
      await tgApi("answerCallbackQuery", { callback_query_id: cb.id, text: "O'chirildi 🗑" });
      return res.sendStatus(200);
    }

    if (cb?.data && cb.data.startsWith("st:")) {
      const parts = cb.data.split(":");
      const orderId = parts[1];
      const newStatus = parts[2];

      if (!ORDER_STATUSES.includes(newStatus) || !/^[a-f0-9]{24}$/i.test(orderId || "")) {
        await tgApi("answerCallbackQuery", { callback_query_id: cb.id, text: "Noto'g'ri so'rov" });
        return res.sendStatus(200);
      }

      const existing = await Order.findById(orderId).select("status");
      if (!existing) {
        await tgApi("answerCallbackQuery", { callback_query_id: cb.id, text: "Buyurtma topilmadi" });
        return res.sendStatus(200);
      }
      if (["delivered", "cancelled"].includes(existing.status)) {
        await tgApi("answerCallbackQuery", { callback_query_id: cb.id, text: "Buyurtma allaqachon yakunlangan" });
        return res.sendStatus(200);
      }

      const byName =
        [cb.from?.first_name, cb.from?.last_name].filter(Boolean).join(" ") ||
        cb.from?.username || "Xodim";

      const order = await Order.findByIdAndUpdate(
        orderId,
        { status: newStatus, statusUpdatedBy: byName },
        { new: true }
      );

      await editStaffOrderMessage(order);
      await tgApi("answerCallbackQuery", {
        callback_query_id: cb.id,
        text: STATUS_LABELS[newStatus] || "Yangilandi",
      });
      return res.sendStatus(200);
    }

    return res.sendStatus(200);
  } catch (e) {
    console.error("Telegram webhook xato:", e.message);
    return res.sendStatus(200);
  }
});

// ════ MILLENIUM WEBHOOK ═══════════════════════════════════════════════════════

router.get("/webhook/millenium", (req, res) => {
  res.json({
    status: "ok",
    message: "Millenium webhook ishlayapti ✅",
    method: "POST",
    tlsVerify: MILLENIUM_TLS_VERIFY, // SSL tekshiruvi yoqilganmi (ops/debug)
  });
});

router.post("/webhook/millenium", async (req, res) => {
  try {
    console.log("📩 Millenium webhook:", JSON.stringify(req.body, null, 2));

    const body = req.body || {};
    const data = body.data || {};

    const milleniumOrderId = String(pick(
      body.order_id,
      body.orderId,
      body.id_order,
      body.milleniumOrderId,
      data.order_id,
      data.orderId,
      data.id_order,
      data.milleniumOrderId,
      ""
    ));

    if (!milleniumOrderId) {
      return res.json({
        ok: false,
        message: "Millenium order_id topilmadi",
        received: body
      });
    }

    const driverName = pick(
      body.driver_name,
      body.driverName,
      body.driver?.name,
      data.driver_name,
      data.driverName,
      data.driver?.name,
      data.crew?.driver_name,
      data.crew?.driverName
    );

    const driverPhone = pick(
      body.driver_phone,
      body.driverPhone,
      body.driver?.phone,
      data.driver_phone,
      data.driverPhone,
      data.driver?.phone,
      data.crew?.driver_phone,
      data.crew?.driverPhone
    );

    const carModel = pick(
      body.car_model,
      body.carModel,
      body.car?.model,
      data.car_model,
      data.carModel,
      data.car?.model,
      data.crew?.car_model,
      data.crew?.carModel
    );

    const driverLat = pick(
      body.driver_lat,
      body.driverLat,
      body.driverLocation?.lat,
      data.driver_lat,
      data.driverLat,
      data.driverLocation?.lat,
      data.crew?.lat
    );

    const driverLng = pick(
      body.driver_lon,
      body.driver_lng,
      body.driverLng,
      body.driverLocation?.lng,
      data.driver_lon,
      data.driver_lng,
      data.driverLng,
      data.driverLocation?.lng,
      data.crew?.lon,
      data.crew?.lng
    );

    const mappedStatus = mapMilleniumStatus(body);

    const update = {};

    if (driverName) update.driverName = String(driverName);
    if (driverPhone) update.driverPhone = String(driverPhone);
    if (carModel) update.carModel = String(carModel);

    if (driverLat && driverLng) {
      update.driverLocation = {
        lat: Number(driverLat),
        lng: Number(driverLng),
      };
    }

    if (mappedStatus) {
      update.status = mappedStatus;
    }

    const order = await Order.findOneAndUpdate(
      { milleniumOrderId },
      { $set: update },
      { new: true }
    );

    if (!order) {
      return res.json({
        ok: false,
        message: "Bu Millenium order_id bilan lokal order topilmadi",
        milleniumOrderId
      });
    }

    console.log("✅ Millenium webhook order yangilandi:", order._id);

    res.json({
      ok: true,
      message: "Order yangilandi",
      order
    });
  } catch (e) {
    console.error("Millenium webhook xato:", e.message);
    res.status(500).json({
      ok: false,
      message: e.message
    });
  }
});

module.exports = router;
