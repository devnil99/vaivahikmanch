import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt,
  FaBriefcase,
  FaTools,
  FaShieldAlt,
} from "react-icons/fa";

export const isPanelRoute = (pathname) => {
  if (!pathname) return false;
  const p = pathname.toLowerCase();
  return (
    p.startsWith("/userpanel") ||
    p === "/panel" ||
    p.startsWith("/panel/") ||
    p.startsWith("/staffpanel") ||
    p.startsWith("/servicepanel") ||
    p.startsWith("/service/panel") ||
    p.startsWith("/service/dashboard") ||
    p.startsWith("/staff/panel") ||
    p.startsWith("/adminpanel") ||
    p.startsWith("/admin/panel") ||
    p.startsWith("/admin/dashboard") ||
    p === "/admin" ||
    p.startsWith("/userrecharge") ||
    p.startsWith("/recharge") ||
    p.startsWith("/usertransactions") ||
    p.startsWith("/user_transactions") ||
    p.startsWith("/transactions") ||
    p.startsWith("/wishlist") ||
    p.startsWith("/userwishlist")
  );
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [role, setRole] = useState((localStorage.getItem("role") || "user").toLowerCase().trim());
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      setToken(localStorage.getItem("access_token"));
      setRole((localStorage.getItem("role") || "user").toLowerCase().trim());
      setUsername(localStorage.getItem("username") || "");
    };

    syncAuth();
    setMobileMenuOpen(false);

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setMobileMenuOpen(false);
    navigate("/");
  };

  if (isPanelRoute(location.pathname)) {
    return null;
  }

  const getDashboardPath = () => {
    if (role === "staff") return "/StaffPanel";
    if (role === "service") return "/ServicePanel";
    if (role === "admin" || role === "superadmin") return "/AdminPanel";
    return "/UserPanel";
  };

  const getRoleLabel = () => {
    if (role === "staff") return { label: "Staff Counselor", icon: <FaBriefcase />, color: "#10b981", bg: "#ecfdf5" };
    if (role === "service") return { label: "Service Partner", icon: <FaTools />, color: "#6366f1", bg: "#eef2ff" };
    if (role === "admin" || role === "superadmin") return { label: "Administrator", icon: <FaShieldAlt />, color: "#f59e0b", bg: "#fffbeb" };
    return { label: "Candidate", icon: <FaUser />, color: "#f43f5e", bg: "#fff1f2" };
  };

  const roleMeta = getRoleLabel();

  return (
    <>
      <style>{`
        .vm-main-header {
          background: linear-gradient(
            135deg,
            #9f1239 0%,
            #be123c 45%,
            #e11d48 100%
          );
          color: #ffffff;
          padding: 0 5%;
          padding-top: env(safe-area-inset-top, 0px);
          min-height: calc(68px + env(safe-area-inset-top, 0px));
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: nowrap !important;
          box-shadow: 0 4px 20px rgba(159, 18, 57, 0.25);
          position: sticky !important;
          top: 0 !important;
          width: 100% !important;
          box-sizing: border-box !important;
          z-index: 1000 !important;
          border-bottom: 1.5px solid rgba(255, 255, 255, 0.18);
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        /* Prevent anchor jumps from hiding section content behind sticky header */
        html {
          scroll-behavior: smooth;
        }

        [id] {
          scroll-margin-top: calc(85px + env(safe-area-inset-top, 0px));
        }

        /* Ensure Modals, Drawers & Popups appear smoothly OVER the header, never under */
        .ant-modal-root,
        .ant-modal-wrap,
        .ant-modal-mask {
          z-index: 1200 !important;
        }

        .ant-drawer-root,
        .ant-drawer-mask,
        .ant-drawer-content-wrapper {
          z-index: 1200 !important;
        }

        .ant-message,
        .ant-notification {
          z-index: 2000 !important;
        }

        .ant-select-dropdown,
        .ant-picker-dropdown,
        .ant-dropdown {
          z-index: 1150 !important;
        }

        /* Ensure auth pages (Login / Register cards) have healthy breathing room below fixed header */
        .ul-page,
        .ur-page,
        .sl-page,
        .sr-page,
        .al-page,
        .ar-page {
          padding-top: 36px !important;
          min-height: calc(100vh - 68px) !important;
          box-sizing: border-box !important;
        }

        .vm-header-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          transition: transform 0.2s ease, opacity 0.2s ease;
          flex-shrink: 0;
        }

        .vm-header-brand:hover {
          transform: translateY(-1px);
          opacity: 0.96;
        }

        .vm-header-logo-badge {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: linear-gradient(135deg, #ffffff 0%, #fff1f2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18), inset 0 0 0 1.5px rgba(254, 205, 211, 0.85);
          flex-shrink: 0;
        }

        .vm-header-logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }

        .vm-header-logo-primary {
          font-size: 21px;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.3px;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
        }

        .vm-header-logo-gold {
          color: #fef08a;
          text-shadow: 0 1px 4px rgba(202, 138, 4, 0.4);
        }

        .vm-header-logo-tagline {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.2px;
          color: #ffe4e6;
          text-transform: uppercase;
        }

        .vm-header-nav {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .vm-header-nav-link {
          color: #ffffff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          transition: all 0.2s ease;
          padding: 6px 10px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .vm-header-nav-link:hover {
          color: #fef08a;
          background: rgba(255, 255, 255, 0.12);
        }

        .vm-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .vm-header-role-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 800;
          border: 1px solid rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.18);
          color: #ffffff;
          backdrop-filter: blur(4px);
        }

        .vm-header-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 8px 18px;
          border-radius: 24px;
          font-size: 13.5px;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          outline: none;
          white-space: nowrap;
        }

        .vm-header-btn-primary {
          background: #ffffff;
          color: #be123c;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .vm-header-btn-primary:hover {
          background: #fff1f2;
          color: #9f1239;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
        }

        .vm-header-btn-outline {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          border: 1.5px solid rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(4px);
        }

        .vm-header-btn-outline:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: #ffffff;
          transform: translateY(-1px);
        }

        .vm-header-btn-logout {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.35);
          padding: 8px 16px;
        }

        .vm-header-btn-logout:hover {
          background: #fee2e2;
          color: #dc2626;
          border-color: #fca5a5;
          transform: translateY(-1px);
        }

        .vm-header-toggle {
          display: none;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.35);
          color: #ffffff;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .vm-header-toggle:hover {
          background: rgba(255, 255, 255, 0.28);
        }

        /* Mobile Dropdown Menu */
        .vm-mobile-drawer {
          display: none;
          position: fixed;
          top: 68px;
          left: 0;
          right: 0;
          background: #ffffff;
          border-bottom: 2px solid #e11d48;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.18);
          padding: 16px 20px 24px;
          z-index: 1040;
          animation: vmSlideDown 0.25s ease-out;
          max-height: calc(100vh - 68px);
          overflow-y: auto;
        }

        @keyframes vmSlideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .vm-mobile-nav-links {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }

        .vm-mobile-nav-link {
          color: #1e1b4b;
          font-size: 14.5px;
          font-weight: 700;
          padding: 10px 14px;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .vm-mobile-nav-link:hover {
          background: #fff1f2;
          color: #be123c;
        }

        .vm-mobile-portal-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding-top: 14px;
          border-top: 1px solid #f1f5f9;
          margin-bottom: 14px;
        }

        .vm-mobile-portal-btn {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 10px;
          border-radius: 10px;
          text-decoration: none;
          text-align: center;
        }

        .vm-mobile-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        @media (min-width: 992px) and (max-width: 1200px) {
          .vm-main-header {
            padding: 0 3%;
          }
          .vm-header-nav {
            gap: 12px;
          }
          .vm-header-nav-link {
            font-size: 13px;
            padding: 5px 8px;
          }
          .vm-header-btn {
            padding: 7px 12px;
            font-size: 12.5px;
          }
          .vm-header-role-pill {
            padding: 4px 8px;
            font-size: 11px;
          }
        }

        @media (max-width: 991px) {
          .vm-header-nav {
            display: none;
          }
          .vm-header-role-pill {
            display: none;
          }
          .vm-hide-mobile {
            display: none !important;
          }
          .vm-header-toggle {
            display: flex;
          }
          .vm-mobile-drawer.open {
            display: block;
          }
        }

        @media (max-width: 480px) {
          .vm-main-header {
            padding: 0 12px;
            padding-top: env(safe-area-inset-top, 0px);
            min-height: calc(58px + env(safe-area-inset-top, 0px));
          }
          .vm-mobile-drawer {
            top: calc(58px + env(safe-area-inset-top, 0px));
            max-height: calc(100vh - 58px - env(safe-area-inset-top, 0px));
          }
          .vm-header-logo-badge {
            width: 36px;
            height: 36px;
            font-size: 17px;
            border-radius: 10px;
          }
          .vm-header-logo-primary {
            font-size: 16px;
          }
          .vm-header-logo-tagline {
            font-size: 7.5px;
            letter-spacing: 0.6px;
          }
          .vm-header-actions {
            gap: 6px;
          }
          .vm-header-btn {
            padding: 6px 11px;
            font-size: 11.5px;
            gap: 5px;
          }
          .vm-header-btn-logout {
            padding: 6px 11px;
          }
        }
      `}</style>

      <header className="vm-main-header">
        <Link to="/" className="vm-header-brand">
          <div className="vm-header-logo-badge">
            💍
          </div>
          <div className="vm-header-logo-text">
            <div className="vm-header-logo-primary">
              वैवाहिक <span className="vm-header-logo-gold">मंच</span>
            </div>
            <div className="vm-header-logo-tagline">
              VAIVAHEEK MANCH MATRIMONIAL
            </div>
          </div>
        </Link>


        {/* Action Buttons */}
        <div className="vm-header-actions">
          {token ? (
            <>
              <Link
                to={getDashboardPath()}
                className="vm-header-btn vm-header-btn-primary vm-hide-mobile"
              >
                Dashboard ➔
              </Link>

              <button
                type="button"
                className="vm-header-btn vm-header-btn-logout vm-hide-mobile"
                onClick={handleLogout}
                title="Logout from session"
              >
                <FaSignOutAlt /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/UserLogin" className="vm-header-btn vm-header-btn-outline">
                Login
              </Link>
              <Link to="/UserRegister" className="vm-header-btn vm-header-btn-primary">
                Register Free
              </Link>
              <button
                type="button"
                className="vm-header-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <div className={`vm-mobile-drawer ${mobileMenuOpen ? "open" : ""}`}>
        <div className="vm-mobile-actions">
          {token ? null : (
            <>
              <Link
                to="/UserRegister"
                className="vm-header-btn vm-header-btn-primary"
                style={{ width: "100%", height: 42, background: "#be123c", color: "#ffffff" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Register Free
              </Link>
              <Link
                to="/UserLogin"
                className="vm-header-btn vm-header-btn-outline"
                style={{ width: "100%", height: 40, color: "#334155", borderColor: "#cbd5e1" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Candidate Login
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;