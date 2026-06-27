// Buyurtma statusi → ko'rinish (rang/emoji/qadam) mapping.
// CommonJS: ham CRA/webpack import qiladi, ham Node to'g'ridan-to'g'ri test qiladi.
const STATUS_COLOR = {
  new: "#3b82f6",
  preparing: "#f59e0b",
  on_way: "#0ea5e9",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

// 4 bosqichli stepper: new(1) → preparing(2) → on_way(3) → delivered(4). cancelled=0.
function buildStatusMap(t) {
  return {
    new:       { label: t.statusNew,       emoji: "🕐",  color: STATUS_COLOR.new,       bg: "#eff6ff", step: 1 },
    preparing: { label: t.statusPreparing, emoji: "👨‍🍳", color: STATUS_COLOR.preparing, bg: "#fffbeb", step: 2 },
    on_way:    { label: t.statusOnWay,     emoji: "🚕",  color: STATUS_COLOR.on_way,    bg: "#eff6ff", step: 3 },
    delivered: { label: t.statusDelivered, emoji: "🎉",  color: STATUS_COLOR.delivered, bg: "#ecfdf5", step: 4 },
    cancelled: { label: t.statusCancelled, emoji: "❌",  color: STATUS_COLOR.cancelled, bg: "#fef2f2", step: 0 },
  };
}

function buildSteps(t) {
  return [
    { key: "new",       emoji: "✅",  label: t.step1 },
    { key: "preparing", emoji: "👨‍🍳", label: t.step2 },
    { key: "on_way",    emoji: "🚕",  label: t.stepOnWay },
    { key: "delivered", emoji: "🚀",  label: t.step3 },
  ];
}

// Noma'lum status uchun ham xavfsiz: new ga emas, balki o'zini ko'rsatadi (fallback faqat haqiqatan noma'lumda)
function getStatusInfo(status, t) {
  const map = buildStatusMap(t);
  return map[status] || map.new;
}

module.exports = { STATUS_COLOR, buildStatusMap, buildSteps, getStatusInfo };
