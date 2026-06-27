import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { LOGO_GREEN } from "./i18n";
import { AppIcon } from "./icons";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/admin");
      } else setError(data.message || "Noto'g'ri login yoki parol");
    } catch { setError("Server bilan bog'lanishda xatolik"); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <img src={LOGO_GREEN} alt="Yalpiz" style={{ height: 60, width: "auto", objectFit: "contain", marginBottom: 8 }} />
        <h1 className="login-title">Admin Panel</h1>
        <p className="login-sub">Yalpiz Restaurant</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <input className="login-input" type="text" placeholder="Username"
            value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
          <input className="login-input" type="password" placeholder="Parol"
            value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="login-error"><AppIcon name="warning" size={16} /> {error}</p>}
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Kirish..." : <><AppIcon name="lock" size={18} /> Kirish</>}
          </button>
        </form>
      </div>
    </div>
  );
}