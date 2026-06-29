const mongoose = require("mongoose");

// Telegram bot obunachilari (mijozlar /start qilganda saqlanadi) — broadcast uchun
const BotSubscriberSchema = new mongoose.Schema({
  chatId:    { type: String, required: true, unique: true },
  firstName: { type: String, default: "" },
  username:  { type: String, default: "" },
  phone:     { type: String, default: "" },     // /start payload yoki keyin bog'lansa
  active:    { type: Boolean, default: true },   // bot bloklansa → false
}, { timestamps: true });

BotSubscriberSchema.index({ active: 1 });

module.exports = mongoose.model("BotSubscriber", BotSubscriberSchema);
