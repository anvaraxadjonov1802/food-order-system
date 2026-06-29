import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Admin from "./Admin";
import Menu from "./Menu";
import Login from "./Login";
import ProtectedRoute from "./ProtectedRoute";
import FoodDetail from "./FoodDetail";
import CartPage from "./CartPage";
import ProfilePage from "./ProfilePage";
import OrderStatus from "./OrderStatus";
import UserAuth from "./UserAuth";

// Har sahifa almashganda tepaga ko'tariladi (sahifa tepasidan ochiladi)
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/food/:id" element={<FoodDetail />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/orders" element={<OrderStatus />} />
        <Route path="/login-user" element={<UserAuth />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;