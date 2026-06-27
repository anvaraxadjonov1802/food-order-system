// Click Shop API yordamchilari
const crypto = require("crypto");

const makeClickPaymentUrl = (order) => {
  const merchantId = process.env.CLICK_MERCHANT_ID;
  const serviceId = process.env.CLICK_SERVICE_ID;
  if (!merchantId || !serviceId) return "";

  const returnUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  const params = new URLSearchParams({
    service_id: String(serviceId),
    merchant_id: String(merchantId),
    amount: String(Number(order.paymentAmount || order.totalPrice || 0)),
    transaction_param: String(order._id),
    return_url: `${returnUrl}/orders`,
  });

  return `https://my.click.uz/services/pay?${params.toString()}`;
};

const checkClickSign = (body) => {
  const secretKey = process.env.CLICK_SECRET_KEY || "";
  const {
    click_trans_id, service_id, merchant_trans_id, merchant_prepare_id,
    amount, action, sign_time, sign_string,
  } = body;

  const base = action === "1" || action === 1
    ? `${click_trans_id}${service_id}${secretKey}${merchant_trans_id}${merchant_prepare_id}${amount}${action}${sign_time}`
    : `${click_trans_id}${service_id}${secretKey}${merchant_trans_id}${amount}${action}${sign_time}`;

  const calculated = crypto.createHash("md5").update(base).digest("hex");
  return calculated === sign_string;
};

const clickOk = (data) => ({ error: 0, error_note: "Success", ...data });
const clickError = (code, note, data = {}) => ({ error: code, error_note: note, ...data });

module.exports = { makeClickPaymentUrl, checkClickSign, clickOk, clickError };
