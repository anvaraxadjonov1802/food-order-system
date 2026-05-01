import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { getLang, setLangStore, TRANSLATIONS } from "./i18n";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Yalpiz logo — base64
const YALPIZ_LOGO = "data:image/png;base64,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";

const CAT_EMOJI = {
  "fast food":"🍔","burger":"🍔","pizza":"🍕","salat":"🥗","salatlar":"🥗",
  "desert":"🍦","desertlar":"🍦","ichimliklar":"🥤","sho'rvalar":"🍲",
  "hamir ovqat":"🥟","grill":"🔥","quyuq ovqat":"🍛",
  "ikkinchi taomlar":"🍛","birinchi taomlar":"🍲","pide":"🫓","bar":"🍺",
  "go'shtli asortiment":"🥩","suyuq taomlar":"🍲","default":"🍽"
};
const getEmoji = (cat) => CAT_EMOJI[cat?.toLowerCase()] || CAT_EMOJI.default;

const getField = (field, lang) => {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[lang] || field.uz || field.ru || field.en || "";
};

const getCart = () => { try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; } };
const saveCart = (cart) => { localStorage.setItem("cart", JSON.stringify(cart)); window.dispatchEvent(new Event("cartUpdated")); };
const getProfile = () => { try { return JSON.parse(localStorage.getItem("profile") || "null"); } catch { return null; } };

export default function Menu() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(false);
  const [cart, setCart] = useState(getCart);
  const [banner, setBanner] = useState(null);
  const [profile, setProfile] = useState(getProfile);
  const [lang, setLang] = useState(getLang);
  const catRefs = useRef({});
  const navigate = useNavigate();

  const t = TRANSLATIONS[lang] || TRANSLATIONS.uz;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/foods`).then(r => r.json()),
      fetch(`${API}/api/banner`).then(r => r.json()).catch(() => null),
    ]).then(([foodData, bannerData]) => {
      const arr = Array.isArray(foodData) ? foodData : [];
      setFoods(arr);
      if (arr.length > 0) {
        const firstCat = arr[0].category;
        setActiveCategory(typeof firstCat === "object" ? firstCat.uz : firstCat);
      }
      if (bannerData) setBanner(bannerData);
      setLoading(false);
      setTimeout(() => setVisible(true), 50);
    }).catch(() => setLoading(false));

    const onCart = () => setCart(getCart());
    const onProfile = () => setProfile(getProfile());
    const onLang = () => setLang(getLang());
    window.addEventListener("cartUpdated", onCart);
    window.addEventListener("storage", onCart);
    window.addEventListener("profileUpdated", onProfile);
    window.addEventListener("langChanged", onLang);
    return () => {
      window.removeEventListener("cartUpdated", onCart);
      window.removeEventListener("storage", onCart);
      window.removeEventListener("profileUpdated", onProfile);
      window.removeEventListener("langChanged", onLang);
    };
  }, []);

  // Kategoriyalar — takrorsiz
  const categoriesRaw = [...new Map(foods.map(f => {
    const key = typeof f.category === "object" ? f.category.uz : f.category;
    return [key, f.category];
  })).values()];

  const getCatKey = (cat) => typeof cat === "object" ? cat.uz : cat;
  const getCatDisplay = (cat) => getField(cat, lang);

  const foodsByCategory = categoriesRaw.reduce((acc, cat) => {
    const key = getCatKey(cat);
    acc[key] = foods.filter(f => {
      const fk = typeof f.category === "object" ? f.category.uz : f.category;
      return fk === key;
    });
    return acc;
  }, {});

  const filteredFoods = search
    ? foods.filter(f =>
        getField(f.title, lang).toLowerCase().includes(search.toLowerCase()) ||
        getField(f.title, "uz").toLowerCase().includes(search.toLowerCase())
      )
    : null;

  const scrollToCategory = (key) => {
    setActiveCategory(key);
    catRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const addToCart = (food, e) => {
    e.stopPropagation();
    const nc = [...cart, { ...food, qty: 1 }];
    setCart(nc); saveCart(nc);
  };
  const changeQty = (id, delta, e) => {
    e.stopPropagation();
    const nc = cart.map(i => i._id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0);
    setCart(nc); saveCart(nc);
  };
  const changeLang = (l) => { setLang(l); setLangStore(l); };

  const initials = profile?.name
    ? profile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : null;

  if (loading) return (
    <div className="g-loading">
      <div className="g-spinner-wrap">
        <div className="g-spinner-ring" />
        <img src={YALPIZ_LOGO} alt="Yalpiz" style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8 }} />
      </div>
      <p className="g-loading-text">{t.loading}</p>
    </div>
  );

  return (
    <div className={`g-root ${visible ? "visible" : ""}`}>
      <header className="g-header">
        <div className="g-header-inner">
          {/* YALPIZ LOGO */}
          <div className="g-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <img
              src={YALPIZ_LOGO}
              alt="Yalpiz"
              style={{ height: 44, width: 44, objectFit: "contain", borderRadius: 8, background: "white", padding: 2 }}
            />
            <div>
              <div className="g-logo-name" style={{ fontWeight: 900, letterSpacing: "-0.5px" }}>YALPIZ</div>
              <div className="g-logo-sub">{t.delivery}</div>
            </div>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="g-header-actions">
            {/* Til tanlash */}
            <div className="pf-lang-switcher">
              {["uz", "ru", "en"].map(l => (
                <button key={l} className={`pf-lang-btn ${lang === l ? "active" : ""}`} onClick={() => changeLang(l)}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button className="g-orders-btn" onClick={() => navigate("/orders")} title={t.myOrders}>📦</button>
            {initials ? (
              <button className="g-profile-btn" onClick={() => navigate("/profile")}>{initials}</button>
            ) : (
              <button className="g-login-btn" onClick={() => navigate("/login-user")}>{t.login}</button>
            )}
            <button className="g-cart-nav" onClick={() => navigate("/cart")}>
              <span className="g-cart-icon">🛒</span>
              {cartCount > 0 && <span className="g-cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="g-search-bar">
          <span>🔍</span>
          <input className="g-search-input" placeholder={t.search}
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="g-search-clear" onClick={() => setSearch("")}>✕</button>}
        </div>

        {/* CATEGORY TABS */}
        {!search && (
          <div className="g-cat-tabs-wrap">
            <div className="g-cat-tabs">
              {categoriesRaw.map((cat, i) => {
                const key = getCatKey(cat);
                return (
                  <button key={i}
                    className={`g-cat-tab ${activeCategory === key ? "active" : ""}`}
                    onClick={() => scrollToCategory(key)}>
                    <span className="g-cat-tab-emoji">{getEmoji(getCatDisplay(cat))}</span>
                    <span>{getCatDisplay(cat)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* FLOAT CART */}
      {cartCount > 0 && (
        <div className="g-float-cart" onClick={() => navigate("/cart")}>
          <span className="g-float-cart-text">🛒 {cartCount} {t.pieces}</span>
          <span className="g-float-cart-price">{cartTotal.toLocaleString()} so'm</span>
          <span className="g-float-cart-btn">{t.goCart}</span>
        </div>
      )}

      {/* SEARCH RESULTS */}
      {search ? (
        <main className="g-main">
          <div className="g-section-title">
            <span>🔍 "{search}" ({filteredFoods.length})</span>
          </div>
          <div className="g-grid">
            {filteredFoods.length === 0
              ? <div className="g-empty">{t.noResults}</div>
              : filteredFoods.map((food, i) => (
                <FoodCard key={food._id} food={food} index={i} cart={cart} lang={lang}
                  onOpen={() => navigate(`/food/${food._id}`)}
                  onAdd={addToCart} onChangeQty={changeQty} t={t} />
              ))}
          </div>
        </main>
      ) : (
        <main className="g-main">
          <HeroBanner banner={banner} t={t} foods={foods} logo={YALPIZ_LOGO} />
          {categoriesRaw.map((cat, idx) => {
            const key = getCatKey(cat);
            return (
              <div key={idx} className="g-cat-section" ref={el => catRefs.current[key] = el}>
                <div className="g-section-header">
                  <span className="g-section-emoji">{getEmoji(getCatDisplay(cat))}</span>
                  <h2 className="g-section-title-text">{getCatDisplay(cat)}</h2>
                  <span className="g-section-count">{foodsByCategory[key]?.length} {t.pieces}</span>
                </div>
                <div className="g-grid">
                  {(foodsByCategory[key] || []).map((food, i) => (
                    <FoodCard key={food._id} food={food} index={i} cart={cart} lang={lang}
                      onOpen={() => navigate(`/food/${food._id}`)}
                      onAdd={addToCart} onChangeQty={changeQty} t={t} />
                  ))}
                </div>
              </div>
            );
          })}
        </main>
      )}
    </div>
  );
}

function HeroBanner({ banner, t, foods, logo }) {
  const b = banner || {
    title: "Mazali taomlar", subtitle: "Yalpiz restorani", description: "Yangi, tez va arzon yetkazib berish",
    bgColor: "#1a5c30", mediaType: "none", mediaUrl: "", events: []
  };
  return (
    <div className="g-hero" style={{ background: b.bgColor, position: "relative", overflow: "hidden" }}>
      {b.mediaType === "image" && b.mediaUrl && (
        <img src={b.mediaUrl} alt="banner" style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.3,zIndex:0 }} />
      )}
      {b.mediaType === "video" && b.mediaUrl && (
        <video autoPlay muted loop playsInline style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.3,zIndex:0 }}>
          <source src={b.mediaUrl} />
        </video>
      )}
      {/* Dekorativ yashil chiziq */}
      <div style={{ position:"absolute",bottom:0,left:0,right:0,height:3,background:"rgba(163,212,91,0.6)",zIndex:1 }} />

      <div style={{ position:"relative", zIndex:2, display:"flex", alignItems:"center", gap:16 }}>
        <img src={logo} alt="Yalpiz" style={{ width:60,height:60,objectFit:"contain",borderRadius:10,background:"rgba(255,255,255,0.95)",padding:4,flexShrink:0 }} />
        <div>
          <h1 className="g-hero-title">{b.title}<br /><span className="g-hero-accent">{b.subtitle}</span></h1>
          <p className="g-hero-desc">{b.description}</p>
          {b.events?.length > 0 && (
            <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginTop:10 }}>
              {b.events.map(ev => (
                <span key={ev.id} style={{ background:"rgba(255,255,255,0.15)",color:"white",padding:"4px 12px",borderRadius:20,fontSize:"0.82rem",fontWeight:700 }}>
                  {ev.emoji} {ev.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="g-hero-stats" style={{ position:"relative",zIndex:2 }}>
        <div className="g-stat"><span className="g-stat-num">{foods.length}+</span><span className="g-stat-label">{t.pieces}</span></div>
        <div className="g-stat-divider" />
        <div className="g-stat"><span className="g-stat-num">30'</span><span className="g-stat-label">{t.deliveryTime}</span></div>
      </div>
    </div>
  );
}

function FoodCard({ food, index, cart, lang, onOpen, onAdd, onChangeQty, t }) {
  const [imgErr, setImgErr] = useState(false);
  const inCart = cart.find(i => i._id === food._id);
  const title = getField(food.title, lang);
  const desc = getField(food.description, lang);
  return (
    <div className="g-card" style={{ animationDelay:`${index * 0.05}s`}} onClick={onOpen}>
      <div className="g-card-img-wrap">
        {!imgErr && food.image ? (
          <img src={food.image} alt={title} className="g-card-img" onError={() => setImgErr(true)} />
        ) : (
          <div className="g-card-img-placeholder">🍽</div>
        )}
        {inCart && <span className="g-card-in-cart">✓ {inCart.qty}</span>}
      </div>
      <div className="g-card-body">
        <h3 className="g-card-title">{title}</h3>
        <p className="g-card-desc">{desc}</p>
        <div className="g-card-footer">
          <span className="g-card-price">{food.price.toLocaleString()} so'm</span>
          {inCart ? (
            <div className="g-card-qty" onClick={e => e.stopPropagation()}>
              <button className="g-card-qty-btn minus" onClick={e => onChangeQty(food._id, -1, e)}>−</button>
              <span className="g-card-qty-num">{inCart.qty}</span>
              <button className="g-card-qty-btn plus" onClick={e => onChangeQty(food._id, +1, e)}>+</button>
            </div>
          ) : (
            <button className="g-card-add-btn" onClick={e => onAdd(food, e)}>+</button>
          )}
        </div>
      </div>
    </div>
  );
}