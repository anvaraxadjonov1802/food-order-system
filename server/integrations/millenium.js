// Millenium Taxi integratsiyasi
const crypto = require("crypto");
const https = require("https");
const fetch = require("../lib/fetch");
const { getSelectedFilial, getFilial } = require("../services/filials");

// SSL sertifikatini tekshirish DEFAULT yoqilgan (MITM himoyasi).
// Millenium self-signed sertifikat ishlatsa: MILLENIUM_INSECURE_TLS=true qo'ying.
const MILLENIUM_TLS_VERIFY = process.env.MILLENIUM_INSECURE_TLS !== "true";
const milleniumHttpsAgent = new https.Agent({ rejectUnauthorized: MILLENIUM_TLS_VERIFY });
if (!MILLENIUM_TLS_VERIFY) {
  console.warn("⚠️  MILLENIUM_INSECURE_TLS=true — Millenium SSL tekshiruvi O'CHIRILGAN (MITM xavfi).");
}

const makeSourceTime = () => {
  const now = new Date();
  return now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");
};

const normalizeMilleniumPhone = (phone) => {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9) digits = "998" + digits;
  return digits;
};

const getMilleniumBaseUrl = () => {
  const milUrl = process.env.MILLENIUM_API_URL || "";
  if (!milUrl) throw new Error("MILLENIUM_API_URL sozlanmagan");
  return milUrl.startsWith("http") ? milUrl : `https://${milUrl}`;
};

const makeMilleniumHeaders = (jsonBody) => {
  const apiKey = process.env.MILLENIUM_API_KEY || "";
  if (!apiKey) throw new Error("MILLENIUM_API_KEY sozlanmagan");
  const signature = crypto.createHash("md5").update(jsonBody + apiKey).digest("hex");
  const headers = { "Content-Type": "application/json", "Signature": signature };
  if (process.env.MILLENIUM_USER_ID) headers["X-User-Id"] = process.env.MILLENIUM_USER_ID;
  return headers;
};

const callMillenium = async (endpoint, payload) => {
  const fullUrl = getMilleniumBaseUrl();
  const jsonBody = JSON.stringify(payload);
  const headers = makeMilleniumHeaders(jsonBody);
  const response = await fetch(`${fullUrl}${endpoint}`, {
    method: "POST", headers, body: jsonBody,
    agent: fullUrl.startsWith("https") ? milleniumHttpsAgent : undefined,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Millenium HTTP ${response.status}: ${JSON.stringify(data)}`);
  return data;
};

const extractMilleniumPrice = (data) => {
  const candidates = [
    data?.data?.sum, data?.data?.total_sum, data?.data?.total_cost, data?.data?.cost, data?.data?.price,
    data?.sum, data?.total_sum, data?.total_cost, data?.cost, data?.price,
  ];
  for (const value of candidates) {
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return 0;
};

const calcMilleniumDeliveryPrice = async ({ filialId, location }) => {
  if (process.env.MILLENIUM_ENABLED !== "true") throw new Error("Millenium integratsiyasi yoqilmagan");
  if (!location?.lat || !location?.lng) throw new Error("Mijoz lokatsiyasi kerak");

  const restaurant = getSelectedFilial(filialId);
  const clientId = Number(process.env.MILLENIUM_CLIENT_ID || 0);
  const crewGroupId = Number(process.env.MILLENIUM_CREW_GROUP_ID || 0);
  if (!clientId) throw new Error("MILLENIUM_CLIENT_ID env qo'yilmagan");
  if (!crewGroupId) throw new Error("MILLENIUM_CREW_GROUP_ID env qo'yilmagan");

  const payload = {
    crew_group_id: crewGroupId,
    client_id: clientId,
    analyze_route: true,
    source_time: makeSourceTime(),
    source_lon: Number(restaurant.lng),
    source_lat: Number(restaurant.lat),
    dest_lon: Number(location.lng),
    dest_lat: Number(location.lat),
  };

  const milData = await callMillenium("/common_api/1.0/calc_order_cost2", payload);
  console.log("Millenium calc_order_cost2 response:", JSON.stringify(milData, null, 2));
  if (!milData || Number(milData.code) !== 0) throw new Error(milData?.descr || "Millenium narx hisoblashda xato qaytardi");

  const price = extractMilleniumPrice(milData);
  if (!price) throw new Error("Millenium javobida narx topilmadi. Response fieldlarini tekshiring.");

  return { price, source: "millenium", restaurant, raw: milData };
};

// To'lov tasdiqlangach chaqiriladi (Payme PerformTransaction / Click complete)
const dispatchMilleniumOrder = async (order) => {
  try {
    if (process.env.MILLENIUM_ENABLED !== "true") return;
    if (!process.env.MILLENIUM_API_URL) return;
    if (order.orderType !== "delivery") return;
    if (order.milleniumOrderId) return; // allaqachon chaqirilgan

    const milUrl = process.env.MILLENIUM_API_URL;
    const apiKey = process.env.MILLENIUM_API_KEY || "";
    const userId = process.env.MILLENIUM_USER_ID || "";
    const fullUrl = milUrl.startsWith("http") ? milUrl : `https://${milUrl}`;
    const sourceTime = makeSourceTime();

    const selectedRestaurant = getFilial(order.filialId);
    const restaurantAddress = selectedRestaurant?.address || process.env.RESTAURANT_ADDRESS || "Yalpiz restoran, Toshkent";
    const restaurantLat = selectedRestaurant?.lat || Number(process.env.RESTAURANT_LAT || 41.261532);
    const restaurantLng = selectedRestaurant?.lng || Number(process.env.RESTAURANT_LNG || 69.228442);

    const milleniumPhone = normalizeMilleniumPhone(order.customerPhone);
    if (!milleniumPhone || milleniumPhone.length < 9) {
      console.log("⚠️ Millenium order yuborilmadi: telefon raqam noto‘g‘ri yoki bo‘sh");
      return;
    }

    const payload = {
      phone: milleniumPhone,
      phone_to_dial: milleniumPhone,
      source_time: sourceTime,
      is_prior: false,
      check_duplicate: true,
      customer: order.customerName,
      passenger: order.customerName,
      comment: `Yalpiz delivery order #${order._id}. Taomlar online to'langan: ${Number(order.totalPrice || 0).toLocaleString()} so'm. TAXI HAQI: ${Number(order.deliveryPrice || 0).toLocaleString()} so'm — MIJOZDAN NAQD OLINSIN.`,
      addresses: [
        { address: restaurantAddress, lat: restaurantLat, lon: restaurantLng },
        { address: order.address || "Mijoz manzili", lat: order.location?.lat ? Number(order.location.lat) : undefined, lon: order.location?.lng ? Number(order.location.lng) : undefined },
      ],
    };

    if (process.env.MILLENIUM_CREW_GROUP_ID) payload.crew_group_id = Number(process.env.MILLENIUM_CREW_GROUP_ID);

    payload.addresses = payload.addresses.map((addr) => {
      const clean = {};
      Object.keys(addr).forEach((key) => {
        if (addr[key] !== undefined && addr[key] !== null && addr[key] !== "") clean[key] = addr[key];
      });
      return clean;
    });

    const jsonBody = JSON.stringify(payload);
    const signature = crypto.createHash("md5").update(jsonBody + apiKey).digest("hex");
    const headers = { "Content-Type": "application/json", "Signature": signature };
    if (userId) headers["X-User-Id"] = userId;

    const milRes = await fetch(`${fullUrl}/common_api/1.0/create_order2`, {
      method: "POST", headers, body: jsonBody,
      agent: fullUrl.startsWith("https") ? milleniumHttpsAgent : undefined,
    });

    const milData = await milRes.json();
    console.log("Millenium create_order2 response:", JSON.stringify(milData, null, 2));

    if (milData && milData.code === 0 && milData.data?.order_id) {
      order.milleniumOrderId = String(milData.data.order_id);
      await order.save();
      console.log("✅ Millenium order yaratildi:", order.milleniumOrderId);
    } else {
      console.log("⚠️ Millenium order yaratilmadi:", milData?.descr || milData);
    }
  } catch (milErr) {
    console.error("⚠️ Millenium API xato:", milErr.message);
  }
};

// ── Webhook status mapping ──
const pick = (...values) => values.find(v => v !== undefined && v !== null && String(v).trim() !== "");
const parseIds = (envName) => (process.env[envName] || "").split(",").map(x => x.trim()).filter(Boolean);

const mapMilleniumStatus = (payload) => {
  const data = payload.data || {};
  const stateId = String(pick(payload.state_id, payload.stateId, payload.status_id, data.state_id, data.stateId, data.status_id, ""));
  const stateText = String(pick(payload.state, payload.status, payload.status_name, data.state, data.status, data.status_name, "")).toLowerCase();

  const preparingIds = parseIds("MILLENIUM_PREPARING_STATE_IDS");
  const deliveredIds = parseIds("MILLENIUM_DELIVERED_STATE_IDS");
  const cancelledIds = parseIds("MILLENIUM_CANCELLED_STATE_IDS");

  if (cancelledIds.includes(stateId)) return "cancelled";
  if (deliveredIds.includes(stateId)) return "delivered";
  if (preparingIds.includes(stateId)) return "preparing";

  if (stateText.includes("cancel") || stateText.includes("отмен") || stateText.includes("bekor")) return "cancelled";
  if (stateText.includes("delivered") || stateText.includes("complete") || stateText.includes("выполн") || stateText.includes("заверш") || stateText.includes("достав")) return "delivered";
  if (stateText.includes("driver") || stateText.includes("assigned") || stateText.includes("экипаж") || stateText.includes("назнач") || stateText.includes("way") || stateText.includes("в пути")) return "preparing";

  return null;
};

module.exports = {
  milleniumHttpsAgent, MILLENIUM_TLS_VERIFY,
  calcMilleniumDeliveryPrice, dispatchMilleniumOrder, mapMilleniumStatus, pick, parseIds,
};
