// Markazlashtirilgan konstantalar va asosiy konfiguratsiya
const JWT_SECRET = process.env.JWT_SECRET || "restoran_secret_key_2024";
if (!process.env.JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET env o'rnatilmagan — default ishlatilmoqda. Produksiyada ALBATTA o'rnating!");
}

const ORDER_STATUSES = ["new", "preparing", "on_way", "delivered", "cancelled"];

const STATUS_LABELS = {
  new: "🆕 Yangi",
  preparing: "🍳 Tayyorlanmoqda",
  on_way: "🚕 Yo'lda",
  delivered: "✅ Yetkazildi",
  cancelled: "❌ Bekor qilingan",
};

const STAFF_HELP =
  "🤖 <b>Xodimlar uchun komandalar</b>\n\n" +
  "/active — aktiv buyurtmalar ro'yxati\n" +
  "/find &lt;ID-oxiri yoki telefon&gt; — buyurtma qidirish\n" +
  "/stats — bugungi statistika\n" +
  "/id — guruh ID raqami\n\n" +
  "Buyurtma ostidagi tugmalar orqali holatni o'zgartirasiz.";

module.exports = { JWT_SECRET, ORDER_STATUSES, STATUS_LABELS, STAFF_HELP };
