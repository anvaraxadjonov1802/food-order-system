import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { getLang, TRANSLATIONS, LOGO_GREEN } from "./i18n";

const fmtPhone = (v) => {
  const d = v.replace(/\D/g,"").replace(/^998/,"").slice(0,9);
  let r="";
  if(d.length>0) r+=d.slice(0,2);
  if(d.length>2) r+=" "+d.slice(2,5);
  if(d.length>5) r+=" "+d.slice(5,7);
  if(d.length>7) r+=" "+d.slice(7,9);
  return r;
};
const isValid = (f) => f.replace(/\s/g,"").length === 9;

export default function UserAuth() {
  const navigate = useNavigate();
  const [step, setStep] = useState("phone"); // phone | name
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [lang, setLang] = useState(getLang);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.uz;

  useEffect(() => {
    // Allaqachon kirgan bo'lsa — bosh sahifaga
    const p = JSON.parse(localStorage.getItem("profile") || "null");
    if (p?.phone && p?.name) { navigate("/"); return; }
    const onLang = () => setLang(getLang());
    window.addEventListener("langChanged", onLang);
    return () => window.removeEventListener("langChanged", onLang);
  }, [navigate]);

  const handlePhone = (e) => {
    e.preventDefault();
    if (!isValid(phone)) return;
    setStep("name");
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const fullPhone = "+998" + phone.replace(/\s/g,"");
    localStorage.setItem("profile", JSON.stringify({
      name: name.trim(),
      phone: fullPhone,
      createdAt: new Date().toISOString()
    }));
    window.dispatchEvent(new Event("profileUpdated"));
    navigate("/");
  };

  return (
    <div className="ua-root">
      <div className="ua-card">
        {/* Til tanlash */}
        <div style={{alignSelf:"flex-end"}}>
          <div className="pf-lang-switcher">
            {["uz","ru","en"].map(l => (
              <button key={l} className={`pf-lang-btn ${lang===l?"active":""}`}
                onClick={() => { setLang(l); localStorage.setItem("lang",l); window.dispatchEvent(new Event("langChanged")); }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Logo */}
        <img src={LOGO_GREEN} alt="Yalpiz" style={{height:56,width:"auto",objectFit:"contain"}} />
        <h1 style={{fontSize:"1.5rem",fontWeight:900,color:"var(--g)",textAlign:"center"}}>
          Yalpiz Restaurant
        </h1>

        {step === "phone" ? (
          <>
            <p style={{color:"var(--gray)",fontSize:"0.9rem",textAlign:"center",lineHeight:1.5}}>
              📱 {t.enterPhone}
            </p>
            <form className="ua-form" onSubmit={handlePhone}>
              <div className="pf-phone-wrap">
                <span className="pf-phone-prefix">+998</span>
                <input
                  type="tel"
                  className="pf-phone-input"
                  placeholder="90 123 45 67"
                  value={phone}
                  onChange={e => setPhone(fmtPhone(e.target.value))}
                  maxLength={12}
                  autoFocus
                />
              </div>
              <p style={{fontSize:"0.78rem",color:"var(--gray)",textAlign:"center"}}>
                {phone.replace(/\s/g,"").length}/9 {isValid(phone) ? "✅" : ""}
              </p>
              <button type="submit" className="cp-next-btn" disabled={!isValid(phone)}>
                {t.continue}
              </button>
              <button type="button" className="cp-continue-btn"
                onClick={() => navigate("/")}>
                {t.backToMenu}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{
              background:"var(--g3)",borderRadius:12,
              padding:"10px 18px",fontWeight:700,
              color:"var(--g)",fontSize:"0.9rem"
            }}>
              📞 +998 {phone}
            </div>
            <p style={{color:"var(--gray)",fontSize:"0.9rem",textAlign:"center"}}>
              👤 {t.enterName}
            </p>
            <form className="ua-form" onSubmit={handleSave}>
              <input
                type="text"
                className="login-input"
                placeholder="Isim Familiya"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
              <button type="submit" className="cp-next-btn" disabled={!name.trim()}>
                ✅ {t.save}
              </button>
              <button type="button" className="cp-continue-btn"
                onClick={() => setStep("phone")}>
                {t.back}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}