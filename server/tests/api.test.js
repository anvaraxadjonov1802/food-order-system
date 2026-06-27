// Rasmiy API testlari — node:test (kutubxonasiz). Ishlab turgan serverga qarshi.
// Ishga tushirish: BASE_URL=http://localhost:5000 node --test tests/
const { test, before } = require("node:test");
const assert = require("node:assert");

const BASE = process.env.BASE_URL || "http://localhost:5000";
let token;

before(async () => {
  // superadmin login (server createFirstAdmin yaratgan)
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "superadmin", password: "Admin123!" }),
  });
  const d = await r.json();
  token = d.token;
  assert.ok(token, "superadmin login token qaytarishi kerak");
});

test("health endpoint sog'lom", async () => {
  const r = await fetch(`${BASE}/health`);
  assert.strictEqual(r.status, 200);
  const d = await r.json();
  assert.strictEqual(d.status, "ok");
  assert.strictEqual(d.db, "connected");
});

test("security headerlari mavjud", async () => {
  const r = await fetch(`${BASE}/api/foods`);
  assert.strictEqual(r.headers.get("x-content-type-options"), "nosniff");
  assert.strictEqual(r.headers.get("x-frame-options"), "DENY");
  assert.ok(r.headers.get("content-security-policy"));
});

test("himoyalangan endpoint tokensiz 401", async () => {
  const r = await fetch(`${BASE}/api/orders`);
  assert.strictEqual(r.status, 401);
});

test("NoSQL injection /my/:phone bloklanadi", async () => {
  const r = await fetch(`${BASE}/api/orders/my/${encodeURIComponent('{"$ne":null}')}`);
  assert.strictEqual(r.status, 400);
});

test("narx serverda qayta hisoblanadi (manipulyatsiya himoyasi)", async () => {
  // taom yaratish
  const fr = await fetch(`${BASE}/api/foods`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title_uz: "CITest", price: "77000", category_uz: "CI", imageUrl: "http://x/i.png" }),
  });
  const food = await fr.json();
  assert.strictEqual(fr.status, 201);

  // zararli buyurtma: narx 1
  const or = await fetch(`${BASE}/api/orders`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "CI", customerPhone: "+998900000099",
      orderType: "pickup", paymentType: "cash", filialId: "rustaveli",
      items: [{ foodId: food._id, title: "CITest", price: 1, quantity: 2 }], totalPrice: 1,
    }),
  });
  const od = await or.json();
  assert.strictEqual(od.order.totalPrice, 154000, "server 77000*2 hisoblashi kerak");
  assert.strictEqual(od.order.paymentAmount, 154000);

  // tozalash
  await fetch(`${BASE}/api/foods/${food._id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
});
