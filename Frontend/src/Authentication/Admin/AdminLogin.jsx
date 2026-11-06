import React, { useState, useEffect } from "react";
import { Card, Button, Typography, message } from "antd";
import {
  CrownFilled,
  ArrowRightOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { UserLogin } from "../../Api/CoreApi";

const { Title } = Typography;

function AdminLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");
    if (token && (role === "admin" || role === "superadmin")) {
      navigate("/AdminPanel");
    }
  }, [navigate]);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let ok = true;
    setPhoneError("");
    setPwdError("");
    setApiError("");

    if (!/^\d{10}$/.test(phone.trim())) {
      setPhoneError("Enter a valid 10-digit mobile number.");
      ok = false;
    }

    if (!password) {
      setPwdError("Password is required.");
      ok = false;
    }

    return ok;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Pass Role: "admin" to enforce admin role login
      const response = await UserLogin({
        Contact: phone.trim(),
        password,
        Role: "admin",
      });

      if (response?.access) {
        const u = response.user || {};
        localStorage.setItem("user_id", u.id || "");
        localStorage.setItem("contact", u.Contact || phone.trim());
        localStorage.setItem("username", u.username || phone.trim());
        localStorage.setItem("role", u.Role || "admin");
        localStorage.setItem("ref_code", u.Reference_Code ?? "");
        localStorage.setItem("amount", u.Amount ?? 0);
        localStorage.setItem("refered_by", u.Refered_By ?? "");
        localStorage.setItem("first_name", u.first_name || "");
        localStorage.setItem("last_name", u.last_name || "");
        localStorage.setItem("email", u.email || "");

        message.success("Welcome back, Administrator! 👑");
        navigate("/AdminPanel");
      } else {
        const errMsg = response?.error || "Invalid administrator credentials.";
        setApiError(errMsg);
      }
    } catch (err) {
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Login failed. Please check your credentials.";
      setApiError(errMsg);
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="al-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        .al-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        }

        .al-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff !important;
          border-radius: 24px !important;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
          overflow: hidden;
          border: none !important;
        }

        .al-header {
          background: linear-gradient(135deg, #090d16 0%, #1e293b 60%, #0f172a 100%);
          padding: 34px 28px 26px;
          text-align: center;
          position: relative;
        }
        .al-header::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 14px;
          background: #ffffff;
          border-radius: 14px 14px 0 0;
        }
        .al-logo {
          width: 58px;
          height: 58px;
          background: linear-gradient(135deg, #d97706 0%, #fbbf24 100%);
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          color: #0f172a;
          margin-bottom: 12px;
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
        }
        .al-header-title {
          color: #ffffff !important;
          font-weight: 800 !important;
          font-size: 22px !important;
          margin: 0 0 4px !important;
        }
        .al-header-sub {
          color: #94a3b8;
          font-size: 13px;
          margin: 0;
        }

        .al-body {
          padding: 24px 28px 32px;
        }
        .al-label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .al-input-wrap {
          position: relative;
          margin-bottom: 6px;
        }
        .al-input {
          width: 100%;
          height: 48px;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          padding: 0 16px;
          font-size: 15px;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .al-input:focus {
          border-color: #f59e0b;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.15);
        }
        .al-input.has-prefix {
          padding-left: 56px;
        }
        .al-input.has-suffix {
          padding-right: 44px;
        }
        .al-prefix {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-weight: 700;
          font-size: 14px;
          color: #64748b;
          user-select: none;
        }
        .al-eye {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          cursor: pointer;
          font-size: 16px;
        }
        .al-eye:hover { color: #d97706; }

        .al-error-msg {
          color: #dc2626;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }
        .al-api-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 16px;
          text-align: center;
        }

        .al-btn {
          width: 100%;
          height: 48px !important;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
          color: #fbbf24 !important;
          border: 1px solid #f59e0b !important;
          border-radius: 12px !important;
          font-size: 15px !important;
          font-weight: 700 !important;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 18px;
          transition: all 0.2s !important;
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.3) !important;
        }
        .al-btn:hover {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
          transform: translateY(-1px);
        }

        .al-footer {
          margin-top: 22px;
          text-align: center;
          font-size: 13px;
          color: #64748b;
        }
        .al-footer a {
          color: #d97706;
          font-weight: 700;
          text-decoration: none;
        }
        .al-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .al-body   { padding: 20px 20px 28px; }
          .al-header { padding: 26px 20px 22px; }
        }
      `}</style>

      <Card className="al-card" variant="borderless">
        <div className="al-header">
          <div className="al-logo">
            <CrownFilled />
          </div>
          <Title level={3} className="al-header-title">
            Administrator Login
          </Title>
          <p className="al-header-sub">Secure access to administrative controls</p>
        </div>

        <div className="al-body">
          {apiError && <div className="al-api-error">{apiError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <label className="al-label" htmlFor="al-phone">
              Administrator Mobile Number
            </label>
            <div className="al-input-wrap">
              <span className="al-prefix">+91</span>
              <input
                id="al-phone"
                className="al-input has-prefix"
                type="tel"
                maxLength={10}
                placeholder="Enter 10-digit number"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""));
                  setPhoneError("");
                  setApiError("");
                }}
                autoFocus
              />
            </div>
            {phoneError && <span className="al-error-msg">{phoneError}</span>}

            <label className="al-label" htmlFor="al-password" style={{ marginTop: 14 }}>
              Master Password
            </label>
            <div className="al-input-wrap">
              <input
                id="al-password"
                className="al-input has-suffix"
                type={showPwd ? "text" : "password"}
                placeholder="Enter your master password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPwdError("");
                  setApiError("");
                }}
              />
              <span className="al-eye" onClick={() => setShowPwd((p) => !p)}>
                {showPwd ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </span>
            </div>
            {pwdError && <span className="al-error-msg">{pwdError}</span>}

            <Button className="al-btn" htmlType="submit" loading={loading}>
              {!loading && (
                <>
                  Authenticate as Admin <ArrowRightOutlined />
                </>
              )}
            </Button>

            <div className="al-footer">
              Need new administrator registration?{" "}
              <Link to="/AdminRegister">Register Admin</Link>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default AdminLogin;
