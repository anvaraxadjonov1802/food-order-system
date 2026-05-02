import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { getLang, TRANSLATIONS, LOGO_GREEN } from "./i18n";

const fmtPhone = (v) => {
  const d = v.replace(/\D/g,"").replace(/^998/,"").slice(0,9);
  let r=""; if(d.length>0)r+=d.slice(0,2); if(d.length>2)r+=" "+d.slice(2,5);
  if(d.length>5)r+=" "+d.slice(5,7); if(d.length>7)r+=" "+d.slice(7,9); return r;
};
const isValid = (f) => f.replace(/\s/g,"").length === 9;

export default function UserAuth() {
  const navigate = useNavigate();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [lang, setLang] = useState(getLang);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.uz;

  useEffect(() => {
    const p = JSON.parse(localStorage.getItem("profile") || "null");
    if (p?.phone && p?.name) navigate("/");
    const onLang = () => setLang(getLang());
    window.addEventListener("langChanged", onLang);
    return () => window.removeEventListener("langChanged", onLang);
  }, [navigate]);

  const handlePhone = (e) => {
    e.preventDefault();
    if (!isValid(phone)) { alert("9 ta raqam kiriting!"); return; }
    const p = JSON.parse(localStorage.getItem("profile") || "null");
    if (p?.name) {
      localStorage.setItem("profile", JSON.stringify({ ...p, phone: "+998" + phone.replace(/\s/g,"") }));
      window.dispatchEvent(new Event("profileUpdated"));
      navigate("/");
    } else setStep("name");
  };

  const handleName = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const fullPhone = "+998" + phone.replace(/\s/g,"");
    localStorage.setItem("profile", JSON.stringify({ name: name.trim(), phone: fullPhone }));
    window.dispatchEvent(new Event("profileUpdated"));
    navigate("/");
  };

  return (
    <div className="ua-root">
      <div className="ua-card">
        <img src={LOGO_GREEN} alt="Yalpiz" style={{ height: 56, width: "auto", objectFit: "contain", marginBottom: 4 }} />
        <h1 className="ua-title">Yalpiz</h1>
        <p className="ua-desc">
          {step === "phone" ? t.enterPhone : t.enterName}
        </p>

        {step === "phone" ? (
          <form className="ua-form" onSubmit={handlePhone}>
            <div className="pf-phone-wrap">
              <span className="pf-phone-prefix">+998</span>
              <input type="tel" className="pf-phone-input" placeholder="90 123 45 67"
                value={phone} onChange={e => setPhone(fmtPhone(e.target.value))} maxLength={12} autoFocus />
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--gray)", textAlign: "center" }}>
              {phone.replace(/\s/g,"").length}/9 {isValid(phone) ? "✅" : ""}
            </p>
            <button type="submit" className="cp-next-btn" disabled={!isValid(phone)}>
              {t.continue}
            </button>
            <button type="button" className="cp-continue-btn" onClick={() => navigate("/")}>
              Tizimga kirmay davom etish
            </button>
          </form>
        ) : (
          <form className="ua-form" onSubmit={handleName}>
            <div className="ua-phone-badge">📞 +998 {phone}</div>
            <input type="text" className="login-input" placeholder={t.namePlaceholder || "Isim Familiya"}
              value={name} onChange={e => setName(e.target.value)} required autoFocus />
            <button type="submit" className="cp-next-btn">{t.continue}</button>
          </form>
        )}
      </div>
    </div>
  );
}