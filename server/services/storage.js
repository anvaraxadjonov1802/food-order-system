// Fayl saqlash xizmati — diskka yozadi, public URL qaytaradi (S3/CDN ekvivalenti).
// Kelajakda STORAGE_DRIVER=s3 bilan S3'ga ulanadi (interfeys o'zgarmaydi).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Buferni saqlaydi → public URL qaytaradi.
// Mongo'da base64 saqlash o'rniga (16MB hujjat limiti + DB shishishi muammosi yo'q).
const saveBuffer = async (buffer, originalname, mimetype) => {
  const ext = path.extname(originalname || "").replace(".", "").toLowerCase()
    || (mimetype && mimetype.split("/")[1]) || "bin";
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  await fs.promises.writeFile(path.join(UPLOAD_DIR, name), buffer);
  const base = process.env.BACKEND_URL || "";
  return `${base}/uploads/${name}`;
};

module.exports = { saveBuffer, UPLOAD_DIR };
