const mongoose = require("mongoose");

const FoodSchema = new mongoose.Schema({
  // Ko'p tilli nom va tavsif
  title: {
    uz: { type: String, required: true },
    ru: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  price:    { type: Number, required: true },
  category: {
    uz: { type: String, required: true },
    ru: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  description: {
    uz: { type: String, default: "" },
    ru: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  image: { type: String, default: "" },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

// Indekslar: kategoriya filtri + ro'yxat sort
FoodSchema.index({ "category.uz": 1 });
FoodSchema.index({ createdAt: -1 });

// Virtual: tanlangan tilda nom
FoodSchema.methods.getTitle = function(lang = "uz") {
  return this.title[lang] || this.title.uz || "";
};

module.exports = mongoose.model("Food", FoodSchema);