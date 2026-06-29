const router = require("express").Router();
const { auth } = require("../middleware/auth");
const Order = require("../models/Order");
const BotSubscriber = require("../models/BotSubscriber");
const { broadcast } = require("../services/broadcast");

// ── CRM: mijozlarni telefon bo'yicha guruhlab statistika (buyurtmalardan aggregatsiya) ──
router.get("/api/customers", auth, async (req, res) => {
  try {
    const rows = await Order.aggregate([
      {
        $group: {
          _id: "$customerPhone",
          name: { $last: "$customerName" },
          orders: { $sum: 1 },
          paid: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } },
          totalSpent: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, { $ifNull: ["$paymentAmount", "$totalPrice"] }, 0] } },
          lastOrder: { $max: "$createdAt" },
        },
      },
      { $sort: { lastOrder: -1 } },
      { $limit: 1000 },
    ]);
    res.json(rows.map(r => ({
      phone: r._id, name: r.name, orders: r.orders, paid: r.paid,
      totalSpent: r.totalSpent || 0, lastOrder: r.lastOrder,
    })));
  } catch (e) { res.status(500).json({ message: "Xato: " + e.message }); }
});

// ── Bot obunachilari soni ──
router.get("/api/broadcast/count", auth, async (req, res) => {
  try {
    const active = await BotSubscriber.countDocuments({ active: true });
    const total = await BotSubscriber.countDocuments();
    res.json({ active, total });
  } catch (e) { res.status(500).json({ message: "Xato: " + e.message }); }
});

// ── Barcha obunachilarga xabar yuborish ──
router.post("/api/broadcast", auth, async (req, res) => {
  try {
    const { text, photoUrl } = req.body || {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "Xabar matni bo'sh bo'lmasin." });
    }
    const result = await broadcast(String(text).trim(), photoUrl ? String(photoUrl) : null);
    res.json({ ok: true, ...result });
  } catch (e) { res.status(500).json({ message: "Xato: " + e.message }); }
});

module.exports = router;
