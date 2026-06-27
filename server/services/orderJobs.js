// To'lanmagan onlayn buyurtmalarni avto-bekor qilish (naqd buyurtmaga tegmaydi)
const Order = require("../models/Order");

const _acmEnv = Number(process.env.AUTO_CANCEL_MINUTES);
const AUTO_CANCEL_MINUTES = Number.isFinite(_acmEnv) ? _acmEnv : 30;
const autoCancelUnpaidOrders = async () => {
  try {
    const cutoff = new Date(Date.now() - AUTO_CANCEL_MINUTES * 60 * 1000);
    const result = await Order.updateMany(
      {
        status: "new",
        paymentType: { $ne: "cash" }, // naqd (pickup) buyurtmalar to'lov kutmaydi — bekor qilinmaydi
        paymentStatus: { $in: ["unpaid", "pending"] },
        paymeState: { $ne: 1 },
        createdAt: { $lt: cutoff },
      },
      { $set: { status: "cancelled", paymentStatus: "cancelled" } }
    );
    if (result.modifiedCount) {
      console.log(`⏱ ${result.modifiedCount} ta to'lanmagan buyurtma avto-bekor qilindi (>${AUTO_CANCEL_MINUTES} daqiqa)`);
    }
    return result.modifiedCount || 0;
  } catch (e) {
    console.error("Avto-bekor xato:", e.message);
    return 0;
  }
};

module.exports = { autoCancelUnpaidOrders, AUTO_CANCEL_MINUTES };
