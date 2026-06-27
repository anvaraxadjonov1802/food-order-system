const mongoose = require("mongoose");

const BannerSchema = new mongoose.Schema({
  title:       { type: String, default: "Mazali taomlar" },
  subtitle:    { type: String, default: "Yalpiz restoranidan" },
  description: { type: String, default: "" },
  buttonText:  { type: String, default: "" },
  buttonLink:  { type: String, default: "" },

  // Media
  mediaType:   { type: String, enum: ["none","image","video"], default: "none" },
  mediaUrl:    { type: String, default: "" },
  bgColor:     { type: String, default: "#1a5c30" },

  // Slider tartib
  order:       { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },

  // Muddatli aksiya
  startDate:   { type: Date, default: null },
  endDate:     { type: Date, default: null },

  // Aksiya taomlar - kategoriya nomi
  promoCategory: { type: String, default: "" },
  promoLabel:    { type: String, default: "Aksiya taomlar" },

  // Events/chips (banner ichidagi taglar)
  events: [{
    id:    { type: String },
    label: { type: String },
    emoji: { type: String, default: "🔥" },
  }],
}, { timestamps: true });

// Indeks: faol bannerlar tartib bo'yicha
BannerSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model("Banner", BannerSchema);