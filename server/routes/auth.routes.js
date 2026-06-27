const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/constants");
const { auth, superAdmin } = require("../middleware/auth");
const { rateLimit } = require("../middleware/rateLimit");
const AdminUser = require("../models/AdminUser");

const loginMax = Number(process.env.LOGIN_MAX) || 10;
const loginWindow = Number(process.env.LOGIN_WINDOW_MS) || 10 * 60 * 1000;
router.post("/auth/login", rateLimit({ windowMs: loginWindow, max: loginMax }), async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await AdminUser.findOne({ username });
    if (!user || !await bcrypt.compare(password, user.password))
      return res.status(401).json({ message: "Username yoki parol xato!" });
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch { res.status(500).json({ message: "Server xatosi" }); }
});

router.post("/auth/create-admin", auth, superAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (await AdminUser.findOne({ username })) return res.status(400).json({ message: "Username band!" });
    const a = await new AdminUser({ username, password: await bcrypt.hash(password, 10), role }).save();
    res.status(201).json({ message: "Admin yaratildi", admin: { username: a.username, role: a.role } });
  } catch { res.status(500).json({ message: "Xato" }); }
});

router.get("/auth/admins", auth, superAdmin, async (req, res) => {
  try { res.json(await AdminUser.find().select("-password")); } catch { res.status(500).json({ message: "Xato" }); }
});

router.delete("/auth/admins/:id", auth, superAdmin, async (req, res) => {
  try {
    const a = await AdminUser.findById(req.params.id);
    if (!a) return res.status(404).json({ message: "Topilmadi" });
    if (a.role === "superadmin") return res.status(403).json({ message: "Superadminni o'chirib bo'lmaydi!" });
    await AdminUser.findByIdAndDelete(req.params.id);
    res.json({ message: "O'chirildi" });
  } catch { res.status(500).json({ message: "Xato" }); }
});

module.exports = router;
