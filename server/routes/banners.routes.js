const router = require("express").Router();
const { auth, superAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");
const Banner = require("../models/Banner");
const { saveBuffer } = require("../services/storage");

router.get("/api/banners", async (req, res) => {
  try {
    const now = new Date();
    const all = await Banner.find().sort({ order: 1, createdAt: -1 });
    const active = all.filter(b => {
      if (!b.isActive) return false;
      if (b.startDate && new Date(b.startDate) > now) return false;
      if (b.endDate && new Date(b.endDate) < now) return false;
      return true;
    });
    if (active.length === 0) {
      return res.json([{ _id:"default", title:"Mazali taomlar", subtitle:"Yalpiz restoranidan 🚀", description:"Tez, yangi va arzon", bgColor:"#1a5c30", mediaType:"none", mediaUrl:"", events:[], isActive:true }]);
    }
    res.json(active);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// GET all - admin uchun (hammasi)
router.get("/api/banners/all", auth, async (req, res) => {
  try { res.json(await Banner.find().sort({ order: 1, createdAt: -1 })); }
  catch(e) { res.status(500).json({ message: e.message }); }
});

// POST - yangi banner (faqat superadmin)
router.post("/api/banners", auth, superAdmin, upload.single("media"), async (req, res) => {
  try {
    const { title, subtitle, description, bgColor, events, mediaType, imageUrl, buttonText, buttonLink, startDate, endDate, order, isActive } = req.body;
    let mediaUrl = imageUrl || "";
    if (req.file && mediaType !== "none") {
      mediaUrl = await saveBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
    }
    const banner = await new Banner({
      title: title || "Yangi banner",
      subtitle: subtitle || "",
      description: description || "",
      bgColor: bgColor || "#1a5c30",
      mediaType: mediaType || "none",
      mediaUrl,
      buttonText: buttonText || "",
      buttonLink: buttonLink || "",
      events: events ? JSON.parse(events) : [],
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      order: order ? parseInt(order) : 0,
      isActive: isActive === "false" ? false : true,
    }).save();
    res.status(201).json(banner);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// PUT - bannerni yangilash (faqat superadmin)
router.put("/api/banners/:id", auth, superAdmin, upload.single("media"), async (req, res) => {
  try {
    const { title, subtitle, description, bgColor, events, mediaType, imageUrl, buttonText, buttonLink, startDate, endDate, order, isActive } = req.body;
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Topilmadi" });
    if (title !== undefined) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (description !== undefined) banner.description = description;
    if (bgColor !== undefined) banner.bgColor = bgColor;
    if (mediaType !== undefined) banner.mediaType = mediaType;
    if (buttonText !== undefined) banner.buttonText = buttonText;
    if (buttonLink !== undefined) banner.buttonLink = buttonLink;
    if (events !== undefined) banner.events = JSON.parse(events);
    if (startDate !== undefined) banner.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) banner.endDate = endDate ? new Date(endDate) : null;
    if (order !== undefined) banner.order = parseInt(order);
    if (isActive !== undefined) banner.isActive = isActive === "true" || isActive === true;
    if (mediaType === "none") { banner.mediaUrl = ""; }
    else if (imageUrl) { banner.mediaUrl = imageUrl; }
    else if (req.file) {
      banner.mediaUrl = await saveBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
    }
    await banner.save();
    res.json(banner);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// DELETE banner (faqat superadmin)
router.delete("/api/banners/:id", auth, superAdmin, async (req, res) => {
  try { await Banner.findByIdAndDelete(req.params.id); res.json({ message: "O'chirildi" }); }
  catch(e) { res.status(500).json({ message: e.message }); }
});

// Eski endpoint - backwards compat
router.get("/api/banner", async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
    res.json(banners[0] || { title:"Mazali taomlar", subtitle:"Yalpiz restoranidan", bgColor:"#1a5c30" });
  } catch { res.status(500).json({ message: "Xato" }); }
});

router.put("/api/banner", auth, upload.single("media"), async (req, res) => {
  try {
    const { title, subtitle, description, bgColor, events, mediaType, imageUrl } = req.body;
    let banner = await Banner.findOne();
    if (!banner) banner = new Banner({});
    if (title !== undefined) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (description !== undefined) banner.description = description;
    if (bgColor !== undefined) banner.bgColor = bgColor;
    if (mediaType !== undefined) banner.mediaType = mediaType;
    if (events !== undefined) banner.events = JSON.parse(events);
    if (mediaType === "none") { banner.mediaUrl = ""; }
    else if (imageUrl) { banner.mediaUrl = imageUrl; }
    else if (req.file) {
      banner.mediaUrl = await saveBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
    }
    await banner.save();
    res.json(banner);
  } catch (e) { res.status(500).json({ message: "Xato: " + e.message }); }
});

module.exports = router;
