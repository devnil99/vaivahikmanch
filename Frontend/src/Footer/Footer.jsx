import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
  FaHeart,
} from "react-icons/fa";
import {
  HomeOutlined,
  HeartFilled,
  HeartOutlined,
  CrownOutlined,
  UserOutlined,
  UserAddOutlined,
  TeamOutlined,
  SearchOutlined,
  WalletOutlined,
  IdcardFilled,
  ShopOutlined,
  AppstoreOutlined,
  CustomerServiceOutlined,
  SafetyCertificateFilled,
} from "@ant-design/icons";
import { isPanelRoute } from "../Header/Header";

function Footer() {
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [role, setRole] = useState((localStorage.getItem("role") || "").toLowerCase().trim());

  useEffect(() => {
    const syncAuth = () => {
      setToken(localStorage.getItem("access_token"));
      setRole((localStorage.getItem("role") || "").toLowerCase().trim());
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, [location.pathname]);

  // Hide website footer completely on all User, Staff, and Service panel routes
  if (isPanelRoute(location.pathname)) {
    return null;
  }

  const isUser = Boolean(token && (!role || role === "user" || role === "candidate"));
  const isStaff = Boolean(token && role === "staff");
  const isService = Boolean(token && role === "service");
  const isAdmin = Boolean(token && (role === "admin" || role === "superadmin"));
  const hasLoggedInDock = isUser || isStaff || isService || isAdmin;

  return (
    <>
      <style>{`
        .vm-footer {
          background: linear-gradient(
            135deg,
            #9f1239 0%,
            #be123c 40%,
            #db2777 75%,
            #e11d48 100%
          );
          color: #fff1f2;
          padding: 45px 20px 24px;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          text-align: center;
          border-top: 3px solid #fda4af;
          box-shadow: 0 -4px 20px rgba(190, 18, 60, 0.12);
          position: relative;
        }

        .vm-footer.has-dock {
          padding-bottom: 30px;
        }

        .vm-footer-top {
          margin-bottom: 22px;
        }

        .vm-footer-brand {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .vm-footer-heart {
          color: #fecdd3;
          font-size: 22px;
          display: inline-flex;
          animation: vm-heartbeat 1.8s infinite;
        }

        .vm-footer-logo {
          color: #ffffff;
          font-size: 23px;
          font-family: 'Cinzel', Georgia, serif;
          font-weight: 700;
          letter-spacing: 0.6px;
          margin: 0;
        }

        .vm-footer-tagline {
          font-size: 14px;
          color: #ffe4e6;
          margin: 10px auto 0;
          max-width: 520px;
          line-height: 1.7;
        }

        .vm-footer-socials {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 14px;
          margin: 24px 0;
        }

        .vm-footer-icon {
          color: #ffffff;
          font-size: 16px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 228, 230, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .vm-footer-icon:hover {
          background: #ffffff;
          color: #be123c;
          transform: translateY(-4px);
          box-shadow: 0 5px 14px rgba(76, 5, 25, 0.2);
        }

        .vm-footer-links {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 22px;
          flex-wrap: wrap;
          margin-top: 20px;
          font-size: 13.5px;
        }

        .vm-footer-link {
          color: #fff1f2;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.25s ease;
        }

        .vm-footer-link:hover {
          color: #ffffff;
          text-decoration: underline;
          text-underline-offset: 5px;
        }

        .vm-footer-portals {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 228, 230, 0.25);
          font-size: 13.5px;
        }

        .vm-footer-portal-link {
          color: #fef08a;
          text-decoration: none;
          font-weight: 700;
          transition: all 0.25s ease;
        }

        .vm-footer-portal-link:hover {
          color: #ffffff;
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .vm-footer-separator {
          color: rgba(255, 228, 230, 0.45);
          font-size: 12px;
        }

        .vm-footer-bottom {
          border-top: 1px solid rgba(255, 228, 230, 0.3);
          margin-top: 24px;
          padding-top: 18px;
          font-size: 12.5px;
          color: #ffe4e6;
          line-height: 1.8;
        }

        .vm-footer-bottom-heart {
          color: #fecdd3;
          display: inline-block;
          margin: 0 3px;
        }

        /* ========================================================= */
        /* ROLE-BASED MOBILE BOTTOM DOCK (Sticky on Homepage)        */
        /* ========================================================= */
        .vm-mobile-dock {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 -4px 25px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          justify-content: space-around;
          align-items: center;
          padding: 0 4px;
          padding-bottom: max(6px, env(safe-area-inset-bottom, 8px));
          box-sizing: border-box;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        }

        .vm-dock-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          height: 52px;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          text-decoration: none;
          border: none;
          background: transparent;
          cursor: pointer;
          position: relative;
          border-radius: 14px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          touch-action: manipulation;
          margin: 0 1px;
          -webkit-tap-highlight-color: transparent;
        }

        .vm-dock-btn:active {
          transform: scale(0.92);
        }

        .vm-dock-icon {
          font-size: 19px;
          transition: transform 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* 1. Candidate / User Dock Style (Rose Red) */
        .vm-dock-user {
          border-top: 1.5px solid rgba(225, 29, 72, 0.18);
        }
        .vm-dock-user .vm-dock-btn.active {
          color: #e11d48;
          background: #fff1f2;
        }
        .vm-dock-user .vm-dock-btn.active::after {
          content: "";
          position: absolute;
          bottom: 2px;
          width: 14px;
          height: 3px;
          border-radius: 2px;
          background: #e11d48;
        }
        .vm-dock-user .vm-dock-btn.active .vm-dock-icon {
          transform: translateY(-2px) scale(1.06);
          color: #e11d48;
        }

        /* 2. Staff Dock Style (Emerald Green) */
        .vm-dock-staff {
          border-top: 1.5px solid rgba(5, 150, 105, 0.2);
        }
        .vm-dock-staff .vm-dock-btn.active {
          color: #059669;
          background: #ecfdf5;
        }
        .vm-dock-staff .vm-dock-btn.active::after {
          content: "";
          position: absolute;
          bottom: 2px;
          width: 14px;
          height: 3px;
          border-radius: 2px;
          background: #059669;
        }
        .vm-dock-staff .vm-dock-btn.active .vm-dock-icon {
          transform: translateY(-2px) scale(1.06);
          color: #059669;
        }

        /* 3. Service Partner Dock Style (Royal Indigo) */
        .vm-dock-service {
          border-top: 1.5px solid rgba(79, 70, 229, 0.2);
        }
        .vm-dock-service .vm-dock-btn.active {
          color: #4f46e5;
          background: #eef2ff;
        }
        .vm-dock-service .vm-dock-btn.active::after {
          content: "";
          position: absolute;
          bottom: 2px;
          width: 14px;
          height: 3px;
          border-radius: 2px;
          background: #4f46e5;
        }
        .vm-dock-service .vm-dock-btn.active .vm-dock-icon {
          transform: translateY(-2px) scale(1.06);
          color: #4f46e5;
        }

        /* 4. Admin Dock Style (Amber Gold) */
        .vm-dock-admin {
          border-top: 1.5px solid rgba(217, 119, 6, 0.2);
        }
        .vm-dock-admin .vm-dock-btn.active {
          color: #d97706;
          background: #fffbeb;
        }
        .vm-dock-admin .vm-dock-btn.active::after {
          content: "";
          position: absolute;
          bottom: 2px;
          width: 14px;
          height: 3px;
          border-radius: 2px;
          background: #d97706;
        }

        @keyframes vm-heartbeat {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
        }

        @media (max-width: 991px) {
          .vm-mobile-dock {
            display: flex;
          }
          .vm-footer.has-dock {
            padding-bottom: calc(75px + env(safe-area-inset-bottom, 12px));
          }
        }

        @media (max-width: 600px) {
          .vm-footer {
            padding: 35px 16px 20px;
          }

          .vm-footer-logo {
            font-size: 19px;
          }

          .vm-footer-tagline {
            font-size: 13px;
          }

          .vm-footer-links {
            gap: 15px 20px;
            font-size: 13px;
          }

          .vm-footer-portals {
            gap: 14px;
            font-size: 13px;
          }

          .vm-footer-bottom {
            font-size: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .vm-footer-heart {
            animation: none;
          }

          .vm-footer-icon,
          .vm-footer-link,
          .vm-footer-portal-link {
            transition: none;
          }
        }
      `}</style>

      <footer className={`vm-footer ${hasLoggedInDock ? "has-dock" : ""}`}>
        {/* Brand + Tagline */}
        <div className="vm-footer-top">
          <div className="vm-footer-brand">
            <span className="vm-footer-heart">
              <FaHeart />
            </span>

            <h2 className="vm-footer-logo">
              वैवाहिक मंच (Vaivaheek Manch)
            </h2>
          </div>

          <p className="vm-footer-tagline">
            India’s trusted matrimonial sanctuary — connecting hearts &amp; uniting families with sacred trust and dignity.
          </p>
        </div>

        {/* Social Icons */}
        <div className="vm-footer-socials">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="vm-footer-icon"
            aria-label="Facebook"
          >
            <FaFacebookF />
          </a>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="vm-footer-icon"
            aria-label="Instagram"
          >
            <FaInstagram />
          </a>

          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="vm-footer-icon"
            aria-label="Twitter"
          >
            <FaTwitter />
          </a>

          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="vm-footer-icon"
            aria-label="LinkedIn"
          >
            <FaLinkedinIn />
          </a>
        </div>

        {/* Navigation Links */}
        <nav className="vm-footer-links" aria-label="Footer navigation">
          <a href="/#why-us" className="vm-footer-link">
            Why Choose Us
          </a>

          <a href="/#how-it-works" className="vm-footer-link">
            How It Works
          </a>

          <a href="/#stories" className="vm-footer-link">
            Success Stories
          </a>

          <a href="/#why-us" className="vm-footer-link">
            Safety Pledge
          </a>
        </nav>

        {/* Staff & Service Portals */}
        <div className="vm-footer-portals" aria-label="Partner portals">
          <Link to="/StaffLogin" className="vm-footer-portal-link">
            Staff Portal
          </Link>
          <span className="vm-footer-separator">•</span>
          <Link to="/ServiceLogin" className="vm-footer-portal-link">
            Service Partner Portal
          </Link>
        </div>

        {/* Copyright */}
        <div className="vm-footer-bottom">
          © {new Date().getFullYear()} Vaivaheek Manch.
          All rights reserved. Crafted with
          <span className="vm-footer-bottom-heart">❤</span>
          for sacred lifelong unions.
        </div>
      </footer>

      {/* ============================================================== */}
      {/* LOGGED-IN MOBILE BOTTOM NAVIGATION DOCK (Homepage & Public)    */}
      {/* ============================================================== */}
      {token && (
        <>
          {/* User / Candidate Mobile Dock (Same as UserPanel) */}
          {isUser && (
            <nav className="vm-mobile-dock vm-dock-user" aria-label="User Mobile Bottom Bar">
              <Link
                to="/"
                className={`vm-dock-btn ${location.pathname === "/" ? "active" : ""}`}
              >
                <HomeOutlined className="vm-dock-icon" />
                <span>Home</span>
              </Link>

              <Link to="/UserPanel?tab=matches" className="vm-dock-btn">
                <HeartFilled className="vm-dock-icon" />
                <span>Matches</span>
              </Link>

              <Link to="/UserPanel?tab=shortlist" className="vm-dock-btn">
                <HeartOutlined className="vm-dock-icon" />
                <span>Shortlist</span>
              </Link>

              <Link to="/UserPanel?tab=plans" className="vm-dock-btn">
                <CrownOutlined className="vm-dock-icon" style={{ color: "#d97706" }} />
                <span>Plans</span>
              </Link>

              <Link to="/UserPanel?tab=profile" className="vm-dock-btn">
                <UserOutlined className="vm-dock-icon" />
                <span>Profile</span>
              </Link>
            </nav>
          )}

          {/* Staff Counselor Mobile Dock (Same as StaffPanel) */}
          {isStaff && (
            <nav className="vm-mobile-dock vm-dock-staff" aria-label="Staff Mobile Bottom Bar">
              <Link
                to="/"
                className={`vm-dock-btn ${location.pathname === "/" ? "active" : ""}`}
              >
                <HomeOutlined className="vm-dock-icon" />
                <span>Home</span>
              </Link>

              <Link to="/StaffPanel?tab=dashboard" className="vm-dock-btn">
                <HomeOutlined className="vm-dock-icon" />
                <span>Panel</span>
              </Link>

              <Link to="/StaffPanel?tab=adduser" className="vm-dock-btn">
                <UserAddOutlined className="vm-dock-icon" />
                <span>Add</span>
              </Link>

              <Link to="/StaffPanel?tab=myusers" className="vm-dock-btn">
                <TeamOutlined className="vm-dock-icon" />
                <span>Members</span>
              </Link>

              <Link to="/StaffPanel?tab=usersearch" className="vm-dock-btn">
                <SearchOutlined className="vm-dock-icon" />
                <span>Search</span>
              </Link>

              <Link to="/StaffPanel?tab=transactions" className="vm-dock-btn">
                <WalletOutlined className="vm-dock-icon" />
                <span>Payout</span>
              </Link>

              <Link to="/StaffPanel?tab=profile" className="vm-dock-btn">
                <IdcardFilled className="vm-dock-icon" />
                <span>Profile</span>
              </Link>
            </nav>
          )}

          {/* Service Partner Mobile Dock (Same as ServicePanel) */}
          {isService && (
            <nav className="vm-mobile-dock vm-dock-service" aria-label="Service Partner Mobile Bottom Bar">
              <Link
                to="/"
                className={`vm-dock-btn ${location.pathname === "/" ? "active" : ""}`}
              >
                <HomeOutlined className="vm-dock-icon" />
                <span>Home</span>
              </Link>

              <Link to="/ServicePanel?tab=dashboard" className="vm-dock-btn">
                <ShopOutlined className="vm-dock-icon" />
                <span>Panel</span>
              </Link>

              <Link to="/ServicePanel?tab=myservices" className="vm-dock-btn">
                <AppstoreOutlined className="vm-dock-icon" />
                <span>Services</span>
              </Link>

              <Link to="/ServicePanel?tab=transactions" className="vm-dock-btn">
                <WalletOutlined className="vm-dock-icon" />
                <span>Orders</span>
              </Link>

              <Link to="/ServicePanel?tab=help" className="vm-dock-btn">
                <CustomerServiceOutlined className="vm-dock-icon" />
                <span>Help</span>
              </Link>
            </nav>
          )}

          {/* Admin Mobile Dock */}
          {isAdmin && (
            <nav className="vm-mobile-dock vm-dock-admin" aria-label="Admin Mobile Bottom Bar">
              <Link
                to="/"
                className={`vm-dock-btn ${location.pathname === "/" ? "active" : ""}`}
              >
                <HomeOutlined className="vm-dock-icon" />
                <span>Home</span>
              </Link>

              <Link to="/AdminLogin" className="vm-dock-btn">
                <SafetyCertificateFilled className="vm-dock-icon" />
                <span>Admin Panel</span>
              </Link>
            </nav>
          )}
        </>
      )}
    </>
  );
}

export default Footer;