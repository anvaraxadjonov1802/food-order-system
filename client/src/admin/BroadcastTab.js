import { useEffect, useState } from "react";
import { api } from "../api";

// Reklama/e'lon — barcha bot obunachilariga xabar yuborish
export default function BroadcastTab() {
  const [count, setCount] = useState({ active: 0, total: 0 });
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const loadCount = () => api.get("/api/broadcast/count", true).then(setCount).catch(() => {});
  useEffect(() => { loadCount(); }, []);

  const send = async () => {
    if (!text.trim()) { alert("Xabar matnini kiriting!"); return; }
    if (!window.confirm(`${count.active} ta obunachiga yuborilsinmi?`)) return;
    setSending(true); setResult(null);
    try {
      const r = await api.post("/api/broadcast", { text: text.trim() }, true);
      setResult(r);
      setText("");
      loadCount();
    } catch (e) { alert("Xato: " + e.message); }
    finally { setSending(false); }
  };

  return (
    <div className="admin-section">
      <h2 className="section-title">📢 Reklama / E'lon yuborish</h2>

      <div style={{ background: "var(--g3)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "1.6rem" }}>📨</span>
        <div>
          <div style={{ fontWeight: 800, color: "var(--g4)" }}>{count.active} ta faol obunachi</div>
          <div style={{ fontSize: "0.78rem", color: "var(--gray)" }}>Botni /start qilgan mijozlar (jami {count.total})</div>
        </div>
      </div>

      <div className="input-group">
        <label>Xabar matni (HTML qo'llab-quvvatlanadi: &lt;b&gt;, &lt;a&gt;)</label>
        <textarea rows={5} value={text} onChange={e => setText(e.target.value)}
          placeholder="🔥 Bugun barcha taomlarga 20% chegirma! Buyurtma bering..." />
      </div>

      <button className="btn-primary" onClick={send} disabled={sending || !text.trim() || count.active === 0}>
        {sending ? "📤 Yuborilmoqda..." : `📢 ${count.active} obunachiga yuborish`}
      </button>

      {count.active === 0 && (
        <p style={{ fontSize: "0.8rem", color: "#e53e3e", marginTop: 10 }}>
          ⚠️ Hali obunachi yo'q. Mijozlar botni <b>/start</b> qilganda ro'yxatga qo'shiladi.
        </p>
      )}

      {result && (
        <div style={{ marginTop: 16, padding: "12px 16px", background: "#d1fae5", borderRadius: 12 }}>
          <div style={{ fontWeight: 800, color: "#065f46" }}>✅ Yuborildi!</div>
          <div style={{ fontSize: "0.85rem", color: "#065f46" }}>
            Jami: {result.total} | Yetdi: {result.sent} | Xato: {result.failed}{result.blocked ? ` | Bloklagan: ${result.blocked}` : ""}
          </div>
        </div>
      )}
    </div>
  );
}
