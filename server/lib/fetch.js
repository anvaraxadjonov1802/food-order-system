// node-fetch (ESM) ni CommonJS'da ishlatish uchun yagona wrapper
module.exports = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
