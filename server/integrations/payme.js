// Payme Merchant API yordamchilari
const toTiyin = (amount) => Math.round(Number(amount || 0) * 100);
const nowMs = () => Date.now();

const paymeError = (id, code, message, data = null) => {
  console.log("PAYME ERROR:", code, message, data);
  return {
    jsonrpc: "2.0",
    id,
    error: { code, message: String(message), data },
  };
};

const paymeResult = (id, result) => ({ jsonrpc: "2.0", id, result });

const checkPaymeAuth = (req) => {
  const auth = req.headers.authorization || "";
  const expected = Buffer.from(
    `${process.env.PAYME_LOGIN || "Paycom"}:${process.env.PAYME_KEY || ""}`
  ).toString("base64");
  return auth === `Basic ${expected}`;
};

const makePaymePaymentUrl = (order) => {
  const merchantId = process.env.PAYME_MERCHANT_ID;
  if (!merchantId) return "";

  const amountTiyin = toTiyin(order.paymentAmount || order.totalPrice);
  const returnUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  const params = [
    `m=${merchantId}`,
    `ac.order_num=${order._id}`,
    `a=${amountTiyin}`,
    `l=uz`,
    `c=${encodeURIComponent(`${returnUrl}/orders`)}`,
  ].join(";");

  const encoded = Buffer.from(params).toString("base64");
  return `https://checkout.paycom.uz/${encoded}`;
};

module.exports = { toTiyin, nowMs, paymeError, paymeResult, checkPaymeAuth, makePaymePaymentUrl };
