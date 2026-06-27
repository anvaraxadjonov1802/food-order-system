const router = require("express").Router();
const { auth } = require("../middleware/auth");
const upload = require("../middleware/upload");
const Image = require("../models/Image");
const { saveBuffer } = require("../services/storage");

// Yangi: rasm diskka saqlanadi (Mongo base64 emas) → /uploads/... URL
router.post("/api/upload", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Rasm shart!" });
    const url = await saveBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.json({ success: true, url });
  } catch (e) { res.status(500).json({ message: "Yuklashda xato: " + e.message }); }
});

// Eski base64 rasmlar uchun backward-compat (avval Mongo'da saqlanganlar)
router.get("/api/images/:id", async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).send("Not found");
    const buffer = Buffer.from(image.data.replace(/^data:[^;]+;base64,/, ""), "base64");
    res.set("Content-Type", image.mimeType);
    res.set("Cache-Control", "public, max-age=31536000");
    res.send(buffer);
  } catch { res.status(500).send("Error"); }
});

module.exports = router;
