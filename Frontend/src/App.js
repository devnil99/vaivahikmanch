import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ConfigProvider, App as AntApp } from "antd";
import "./App.css";

import Header from "./Header/Header";
import HomePage from "./HomePage/HomePage";
import Footer from "./Footer/Footer";

import UserRegister from "./Authentication/User/UserRegister";
import UserLogin from "./Authentication/User/UserLogin";
import ServiceRegister from "./Authentication/Service/ServiceRegister";
import ServiceLogin from "./Authentication/Service/ServiceLogin";
import AdminRegister from "./Authentication/Admin/AdminRegister";
import AdminLogin from "./Authentication/Admin/AdminLogin";
import StaffRegister from "./Authentication/Staff/StaffRegister";
import StaffLogin from "./Authentication/Staff/StaffLogin";
import StaffPanel from "./Panel/Staff/StaffPanel";
import ServicePanel from "./Panel/Service/ServicePanel";
import AdminPanel from "./Panel/Admin/AdminPanel";
import UserPanel from "./Panel/User/UserPanel";
import UserRecharge from "./Panel/User/UserRecharge";
import User_Transactions from "./Panel/User/User_Transactions";
import Wish_List from "./Panel/User/Wish_List";

const pinkRedTheme = {
  token: {
    colorPrimary: "#b80d3b",
    colorPrimaryHover: "#d81b50",
    colorPrimaryActive: "#8f0d2c",
    colorLink: "#e63968",
    colorLinkHover: "#ff4d79",
    colorSuccess: "#28a745",
    colorWarning: "#faad14",
    colorError: "#b80d3b",
    borderRadius: 10,
    fontFamily:
      "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Button: {
      colorPrimary: "#b80d3b",
      fontWeight: 600,
      borderRadius: 24,
    },
    Card: {
      borderRadiusLG: 16,
    },
    Input: {
      activeBorderColor: "#b80d3b",
      hoverBorderColor: "#e63968",
    },
  },
};

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <ConfigProvider theme={pinkRedTheme}>
      <AntApp>
        <BrowserRouter>
        <ScrollToTop />
        <Header />

        <Routes>
          {/* Main Pages */}
          <Route path="/" element={<HomePage />} />

          {/* User Authentication (Role: user by default) */}
          <Route path="/UserRegister/:refCode?" element={<UserRegister />} />
          <Route path="/UserLogin" element={<UserLogin />} />

          {/* Service Authentication (Role: service by default) */}
          <Route path="/ServiceRegister/:refCode?" element={<ServiceRegister />} />
          <Route path="/ServiceReg/:refCode?" element={<ServiceRegister />} />
          <Route path="/ServiceLogin" element={<ServiceLogin />} />

          {/* Admin Authentication (Role: admin by default) */}
          <Route path="/AdminRegister/:refCode?" element={<AdminRegister />} />
          <Route path="/AdminLogin" element={<AdminLogin />} />

          {/* Admin Dashboard & Features */}
          <Route path="/AdminPanel" element={<AdminPanel />} />
          <Route path="/adminpanel" element={<Navigate to="/AdminPanel" replace />} />
          <Route path="/admin/panel" element={<Navigate to="/AdminPanel" replace />} />
          <Route path="/admin/dashboard" element={<Navigate to="/AdminPanel" replace />} />

          {/* Staff Authentication (Role: staff by default) */}
          <Route path="/StaffRegister/:refCode?" element={<StaffRegister />} />
          <Route path="/StaffLogin" element={<StaffLogin />} />

          {/* Staff Dashboard & Features */}
          <Route path="/StaffPanel" element={<StaffPanel />} />
          <Route path="/staffpanel" element={<Navigate to="/StaffPanel" replace />} />
          <Route path="/staff/panel" element={<Navigate to="/StaffPanel" replace />} />

          {/* Service Dashboard & Features */}
          <Route path="/ServicePanel" element={<ServicePanel />} />
          <Route path="/servicepanel" element={<Navigate to="/ServicePanel" replace />} />
          <Route path="/service/panel" element={<Navigate to="/ServicePanel" replace />} />
          <Route path="/service/dashboard" element={<Navigate to="/ServicePanel" replace />} />

          {/* User Dashboard & Features */}
          <Route path="/UserPanel" element={<UserPanel />} />
          <Route path="/UserRecharge" element={<UserRecharge />} />
          <Route path="/UserTransactions" element={<User_Transactions />} />
          <Route path="/User_Transactions" element={<User_Transactions />} />
          <Route path="/WishList" element={<Wish_List />} />
          <Route path="/UserWishlist" element={<Wish_List />} />

          {/* Short URL Aliases */}
          <Route path="/register/:refCode?" element={<UserRegister />} />
          <Route path="/login" element={<Navigate to="/UserLogin" replace />} />
          <Route path="/service/register/:refCode?" element={<ServiceRegister />} />
          <Route path="/service/login" element={<Navigate to="/ServiceLogin" replace />} />
          <Route path="/admin/register/:refCode?" element={<AdminRegister />} />
          <Route path="/admin/login" element={<Navigate to="/AdminLogin" replace />} />
          <Route path="/admin" element={<Navigate to="/AdminPanel" replace />} />
          <Route path="/staff/register/:refCode?" element={<StaffRegister />} />
          <Route path="/staff/login" element={<Navigate to="/StaffLogin" replace />} />
          <Route path="/panel" element={<Navigate to="/UserPanel" replace />} />
          <Route path="/recharge" element={<Navigate to="/UserRecharge" replace />} />
          <Route path="/transactions" element={<Navigate to="/UserTransactions" replace />} />
          <Route path="/wishlist" element={<Navigate to="/WishList" replace />} />

          {/* Fallback for unknown URLs */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
