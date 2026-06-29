import { useEffect, useState } from "react";
import { api } from "../api";

// Mijozlar (CRM) — buyurtmalardan telefon bo'yicha aggregatsiya
export default function CustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/api/customers", true).then(setCustomers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c =>
    !q || (c.name || "").toLowerCase().includes(q.toLowerCase()) || (c.phone || "").includes(q)
  );
  const totalRevenue = customers.reduce((s, c) => s + (c.totalSpent || 0), 0);

  return (
    <div className="admin-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>👥 Mijozlar ({customers.length})</h2>
        <span style={{ fontSize: "0.85rem", color: "var(--gray)" }}>
          Jami tushum: <strong style={{ color: "var(--g)" }}>{totalRevenue.toLocaleString()} so'm</strong>
        </span>
      </div>

      <input className="login-input" style={{ marginBottom: 14 }} placeholder="🔍 Ism yoki telefon bo'yicha qidirish..."
        value={q} onChange={e => setQ(e.target.value)} />

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 50, color: "var(--gray)" }}>Mijoz topilmadi</div>
      ) : (
        <div className="admins-list">
          {filtered.map(c => (
            <div key={c.phone} className="admin-row">
              <div className="admin-avatar">{(c.name || "?")[0].toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="admin-row-name">{c.name || "—"}</p>
                <p className="admin-row-role">📞 {c.phone}</p>
              </div>
              <div style={{ textAlign: "right", fontSize: "0.8rem" }}>
                <div style={{ fontWeight: 800, color: "var(--g4)" }}>{c.orders} buyurtma <span style={{ color: "var(--gray)", fontWeight: 600 }}>({c.paid} to'langan)</span></div>
                <div style={{ color: "var(--g)", fontWeight: 800 }}>{(c.totalSpent || 0).toLocaleString()} so'm</div>
                {c.lastOrder && <div style={{ color: "var(--gray)", fontSize: "0.72rem" }}>oxirgi: {new Date(c.lastOrder).toLocaleDateString("uz-UZ")}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
