// Fayl saqlash xizmati.
// IMGBB_API_KEY bo'lsa → rasm ImgBB'ga yuboriladi (doimiy, CDN; Render redeploy'da yo'qolmaydi).
// Kalit bo'lmasa → local diskka yoziladi (faqat lokal ishlab chiqish uchun;
//   Render'da local disk vaqtinchalik — redeploy'da o'chadi).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const fetchFn = require("../lib/fetch"); // node-fetch wrapper

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || "";

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── ImgBB'ga yuklash → doimiy public URL ──
async function uploadToImgbb(buffer, originalname) {
  const form = new URLSearchParams();
  form.set("image", buffer.toString("base64")); // ImgBB base64 qabul qiladi (data: prefikssiz)
  const cleanName = (originalname || "").replace(/\.[^.]+$/, "").slice(0, 60);
  if (cleanName) form.set("name", cleanName);

  const res = await fetchFn(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || !data.success) {
    throw new Error("ImgBB xato: " + JSON.stringify(data && data.error ? data.error : { status: res.status }));
  }
  // data.data.url — to'g'ridan-to'g'ri rasm havolasi (display_url ham bor)
  return data.data.url;
}

// ── Local diskka yozish (fallback) ──
async function saveToDisk(buffer, originalname, mimetype) {
  const ext = path.extname(originalname || "").replace(".", "").toLowerCase()
    || (mimetype && mimetype.split("/")[1]) || "bin";
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  await fs.promises.writeFile(path.join(UPLOAD_DIR, name), buffer);
  const base = process.env.BACKEND_URL || "";
  return `${base}/uploads/${name}`;
}

// Buferni saqlaydi → public URL qaytaradi. (Interfeys o'zgarmaydi — images.routes shuni chaqiradi.)
const saveBuffer = async (buffer, originalname, mimetype) => {
  if (IMGBB_API_KEY) {
    return await uploadToImgbb(buffer, originalname);
  }
  console.warn("[storage] IMGBB_API_KEY yo'q — local diskka yozildi (Render'da redeploy'da yo'qoladi!)");
  return await saveToDisk(buffer, originalname, mimetype);
};

module.exports = { saveBuffer, UPLOAD_DIR };
