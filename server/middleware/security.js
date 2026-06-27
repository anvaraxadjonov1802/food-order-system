// Xavfsizlik headerlari (helmet ekvivalenti) + NoSQL injeksiya sanitatsiyasi

const securityHeaders = (req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "no-referrer");
  res.set("X-XSS-Protection", "0");
  res.set("X-Permitted-Cross-Domain-Policies", "none");
  res.set("Content-Security-Policy", "default-src 'none'; img-src 'self' data: https:; frame-ancestors 'none'");
  if (process.env.NODE_ENV === "production") {
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  res.removeHeader("X-Powered-By");
  next();
};

// $ bilan boshlanuvchi yoki . li kalitlarni rekursiv olib tashlash (NoSQL injection himoyasi)
const cleanObj = (obj) => {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) { delete obj[key]; continue; }
    if (obj[key] && typeof obj[key] === "object") cleanObj(obj[key]);
  }
};

const sanitize = (req, res, next) => {
  cleanObj(req.body);
  cleanObj(req.query);
  cleanObj(req.params);
  next();
};

module.exports = { securityHeaders, sanitize };
