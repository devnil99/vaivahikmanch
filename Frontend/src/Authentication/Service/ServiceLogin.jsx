import React, { useState, useEffect } from "react";
import { Card, Button, Typography, message } from "antd";
import {
  SafetyCertificateFilled,
  ArrowRightOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { UserLogin } from "../../Api/CoreApi";

const { Title } = Typography;

function ServiceLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");
    if (token && role === "service") {
      navigate("/ServicePanel");
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
      // Pass Role: "service" to enforce service role login
      const response = await UserLogin({
        Contact: phone.trim(),
        password,
        Role: "service",
      });

      if (response?.access) {
        const u = response.user || {};
        localStorage.setItem("user_id", u.id || "");
        localStorage.setItem("contact", u.Contact || phone.trim());
        localStorage.setItem("username", u.username || phone.trim());
        localStorage.setItem("role", u.Role || "service");
        localStorage.setItem("ref_code", u.Reference_Code ?? "");
        localStorage.setItem("amount", u.Amount ?? 0);
        localStorage.setItem("refered_by", u.Refered_By ?? "");
        localStorage.setItem("first_name", u.first_name || "");
        localStorage.setItem("last_name", u.last_name || "");
        localStorage.setItem("email", u.email || "");

        message.success("Welcome back, Service Partner! 🎉");
        navigate("/ServicePanel");
      } else {
        const errMsg = response?.error || "Invalid service login credentials.";
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
    <div className="sl-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        .sl-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #091325 0%, #172554 50%, #0f172a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        }

        .sl-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff !important;
          border-radius: 24px !important;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
          overflow: hidden;
          border: none !important;
        }

        .sl-header {
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #1d4ed8 100%);
          padding: 34px 28px 26px;
          text-align: center;
          position: relative;
        }
        .sl-header::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 14px;
          background: #ffffff;
          border-radius: 14px 14px 0 0;
        }
        .sl-logo {
          width: 56px;
          height: 56px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: #fbbf24;
          margin-bottom: 12px;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        .sl-header-title {
          color: #ffffff !important;
          font-weight: 800 !important;
          font-size: 22px !important;
          margin: 0 0 4px !important;
        }
        .sl-header-sub {
          color: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          margin: 0;
        }

        .sl-body {
          padding: 24px 28px 32px;
        }
        .sl-label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .sl-input-wrap {
          position: relative;
          margin-bottom: 6px;
        }
        .sl-input {
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
        .sl-input:focus {
          border-color: #2563eb;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }
        .sl-input.has-prefix {
          padding-left: 56px;
        }
        .sl-input.has-suffix {
          padding-right: 44px;
        }
        .sl-prefix {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-weight: 700;
          font-size: 14px;
          color: #64748b;
          user-select: none;
        }
        .sl-eye {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          cursor: pointer;
          font-size: 16px;
        }
        .sl-eye:hover { color: #1e3a8a; }

        .sl-error-msg {
          color: #dc2626;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }
        .sl-api-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 16px;
          text-align: center;
        }

        .sl-btn {
          width: 100%;
          height: 48px !important;
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%) !important;
          color: #fff !important;
          border: none !important;
          border-radius: 12px !important;
          font-size: 15px !important;
          font-weight: 700 !important;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 18px;
          transition: opacity 0.2s, transform 0.1s !important;
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35) !important;
        }
        .sl-btn:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        .sl-footer {
          margin-top: 22px;
          text-align: center;
          font-size: 13px;
          color: #64748b;
        }
        .sl-footer a {
          color: #2563eb;
          font-weight: 700;
          text-decoration: none;
        }
        .sl-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .sl-body   { padding: 20px 20px 28px; }
          .sl-header { padding: 26px 20px 22px; }
        }
      `}</style>

      <Card className="sl-card" variant="borderless">
        <div className="sl-header">
          <div className="sl-logo">
            <SafetyCertificateFilled />
          </div>
          <Title level={3} className="sl-header-title">
            Service Partner Login
          </Title>
          <p className="sl-header-sub">Access your verified service provider dashboard</p>
        </div>

        <div className="sl-body">
          {apiError && <div className="sl-api-error">{apiError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <label className="sl-label" htmlFor="sl-phone">
              Registered Mobile Number
            </label>
            <div className="sl-input-wrap">
              <span className="sl-prefix">+91</span>
              <input
                id="sl-phone"
                className="sl-input has-prefix"
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
            {phoneError && <span className="sl-error-msg">{phoneError}</span>}

            <label className="sl-label" htmlFor="sl-password" style={{ marginTop: 14 }}>
              Password
            </label>
            <div className="sl-input-wrap">
              <input
                id="sl-password"
                className="sl-input has-suffix"
                type={showPwd ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPwdError("");
                  setApiError("");
                }}
              />
              <span className="sl-eye" onClick={() => setShowPwd((p) => !p)}>
                {showPwd ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </span>
            </div>
            {pwdError && <span className="sl-error-msg">{pwdError}</span>}

            <Button className="sl-btn" htmlType="submit" loading={loading}>
              {!loading && (
                <>
                  Login as Service Partner <ArrowRightOutlined />
                </>
              )}
            </Button>

            <div className="sl-footer">
              Don't have a service partner account?{" "}
              <Link to="/ServiceRegister">Register as Service Partner</Link>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default ServiceLogin;
