const router = require("express").Router();
const { auth } = require("../middleware/auth");
const Filial = require("../models/Filial");
const { makeFilialSlug, reloadFilialsCache } = require("../services/filials");

router.get("/api/filials", async (req, res) => {
  try {
    const list = await Filial.find({}).sort({ order: 1, createdAt: 1 });
    res.json(list.map(f => ({
      id: f.slug,
      name: f.name,
      address: f.address || "",
      lat: f.lat,
      lng: f.lng,
      isActive: f.isActive !== false,
    })));
  } catch (e) { res.status(500).json({ message: "Xato: " + e.message }); }
});

// Admin uchun — barcha filiallar (to'liq, _id bilan)
router.get("/api/filials/all", auth, async (req, res) => {
  try {
    const list = await Filial.find({}).sort({ order: 1, createdAt: 1 });
    res.json(list);
  } catch (e) { res.status(500).json({ message: "Xato: " + e.message }); }
});

// Yangi filial qo'shish
router.post("/api/filials", auth, async (req, res) => {
  try {
    const { name, address, lat, lng, isActive, order } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Filial nomi shart" });
    }
    const filial = await new Filial({
      slug: makeFilialSlug(name),
      name: String(name).trim(),
      address: address || "",
      lat: lat === "" || lat === undefined ? null : Number(lat),
      lng: lng === "" || lng === undefined ? null : Number(lng),
      isActive: isActive !== false && isActive !== "false",
      order: Number(order) || 0,
    }).save();
    await reloadFilialsCache();
    res.status(201).json(filial);
  } catch (e) { res.status(500).json({ message: "Xato: " + e.message }); }
});

// Filialni tahrirlash (slug o'zgarmaydi — eski buyurtmalar saqlanadi)
router.put("/api/filials/:id", auth, async (req, res) => {
  try {
    const { name, address, lat, lng, isActive, order } = req.body;
    const update = {};
    if (name !== undefined) update.name = String(name).trim();
    if (address !== undefined) update.address = address;
    if (lat !== undefined) update.lat = lat === "" ? null : Number(lat);
    if (lng !== undefined) update.lng = lng === "" ? null : Number(lng);
    if (isActive !== undefined) update.isActive = isActive !== false && isActive !== "false";
    if (order !== undefined) update.order = Number(order) || 0;
    const filial = await Filial.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!filial) return res.status(404).json({ message: "Topilmadi" });
    await reloadFilialsCache();
    res.json(filial);
  } catch (e) { res.status(500).json({ message: "Xato: " + e.message }); }
});

// Yoqish / o'chirish (vaqtincha yopish)
router.patch("/api/filials/:id/toggle", auth, async (req, res) => {
  try {
    const { isActive } = req.body;
    const filial = await Filial.findByIdAndUpdate(
      req.params.id,
      { isActive: isActive !== false && isActive !== "false" },
      { new: true }
    );
    if (!filial) return res.status(404).json({ message: "Topilmadi" });
    await reloadFilialsCache();
    res.json(filial);
  } catch (e) { res.status(500).json({ message: "Xato: " + e.message }); }
});

// O'chirish
router.delete("/api/filials/:id", auth, async (req, res) => {
  try {
    const filial = await Filial.findByIdAndDelete(req.params.id);
    if (!filial) return res.status(404).json({ message: "Topilmadi" });
    await reloadFilialsCache();
    res.json({ message: "O'chirildi" });
  } catch (e) { res.status(500).json({ message: "Xato: " + e.message }); }
});

module.exports = router;
