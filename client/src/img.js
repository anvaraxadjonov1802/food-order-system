// Rasm tezligi yordamchisi.
// Loyihadagi rasmlar sekin Render origin'da (1.3MB PNG, /api/images yoki /uploads).
// thumb() ularni tashqi rasm-CDN (wsrv.nl) orqali kichik WebP qilib beradi —
// CDN keshlaydi → keyingi yuklashlar tez va Render'ga urilmaydi (~29x kichik).
// data:/blob: va bo'sh URL'lar tegilmaydi. <img onError> da imgFallback originalga qaytaradi.

export const thumb = (url, w = 400) => {
  if (!url || typeof url !== "string" || url.startsWith("data:") || url.startsWith("blob:")) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&q=82&output=webp&we`;
};

// Proxy yiqilsa — bir marta originalga qaytadi (keyin qayta urinmaydi, tsikl bo'lmasin)
export const imgFallback = (e, original) => {
  if (e.currentTarget.dataset.fb || !original) return;
  e.currentTarget.dataset.fb = "1";
  e.currentTarget.src = original;
};
