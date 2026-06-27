const multer = require("multer");
const path = require("path");

// Rasm/video yuklash — xotirada saqlanadi (keyin base64 sifatida DB'ga)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    /jpeg|jpg|png|webp|gif|mp4|webm/.test(path.extname(file.originalname).toLowerCase())
      ? cb(null, true) : cb(new Error("Faqat rasm yoki video!"));
  },
});

module.exports = upload;
