import React, { useState, useEffect } from "react";
import { Card, Button, Typography, message } from "antd";
import {
  IdcardFilled,
  ArrowRightOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { UserLogin } from "../../Api/CoreApi";

const { Title } = Typography;

function StaffLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");
    if (token && role === "staff") {
      navigate("/StaffPanel");
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
      // Pass Role: "staff" to enforce staff role login
      const response = await UserLogin({
        Contact: phone.trim(),
        password,
        Role: "staff",
      });

      if (response?.access) {
        const u = response.user || {};
        localStorage.setItem("user_id", u.id || "");
        localStorage.setItem("contact", u.Contact || phone.trim());
        localStorage.setItem("username", u.username || phone.trim());
        localStorage.setItem("role", u.Role || "staff");
        localStorage.setItem("ref_code", u.Reference_Code ?? "");
        localStorage.setItem("amount", u.Amount ?? 0);
        localStorage.setItem("refered_by", u.Refered_By ?? "");
        localStorage.setItem("first_name", u.first_name || "");
        localStorage.setItem("last_name", u.last_name || "");
        localStorage.setItem("email", u.email || "");

        message.success("Welcome back, Staff Member! 💼");
        navigate("/StaffPanel");
      } else {
        const errMsg = response?.error || "Invalid staff login credentials.";
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
    <div className="stl-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        .stl-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f172a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        }

        .stl-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff !important;
          border-radius: 24px !important;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
          overflow: hidden;
          border: none !important;
        }

        .stl-header {
          background: linear-gradient(135deg, #065f46 0%, #059669 60%, #0d9488 100%);
          padding: 34px 28px 26px;
          text-align: center;
          position: relative;
        }
        .stl-header::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 14px;
          background: #ffffff;
          border-radius: 14px 14px 0 0;
        }
        .stl-logo {
          width: 56px;
          height: 56px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          color: #a7f3d0;
          margin-bottom: 12px;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        .stl-header-title {
          color: #ffffff !important;
          font-weight: 800 !important;
          font-size: 22px !important;
          margin: 0 0 4px !important;
        }
        .stl-header-sub {
          color: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          margin: 0;
        }

        .stl-body {
          padding: 24px 28px 32px;
        }
        .stl-label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .stl-input-wrap {
          position: relative;
          margin-bottom: 6px;
        }
        .stl-input {
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
        .stl-input:focus {
          border-color: #059669;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.12);
        }
        .stl-input.has-prefix {
          padding-left: 56px;
        }
        .stl-input.has-suffix {
          padding-right: 44px;
        }
        .stl-prefix {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-weight: 700;
          font-size: 14px;
          color: #64748b;
          user-select: none;
        }
        .stl-eye {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          cursor: pointer;
          font-size: 16px;
        }
        .stl-eye:hover { color: #065f46; }

        .stl-error-msg {
          color: #dc2626;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }
        .stl-api-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 16px;
          text-align: center;
        }

        .stl-btn {
          width: 100%;
          height: 48px !important;
          background: linear-gradient(135deg, #065f46 0%, #059669 100%) !important;
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
          box-shadow: 0 6px 20px rgba(5, 150, 105, 0.35) !important;
        }
        .stl-btn:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        .stl-footer {
          margin-top: 22px;
          text-align: center;
          font-size: 13px;
          color: #64748b;
        }
        .stl-footer a {
          color: #059669;
          font-weight: 700;
          text-decoration: none;
        }
        .stl-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .stl-body   { padding: 20px 20px 28px; }
          .stl-header { padding: 26px 20px 22px; }
        }
      `}</style>

      <Card className="stl-card" variant="borderless">
        <div className="stl-header">
          <div className="stl-logo">
            <IdcardFilled />
          </div>
          <Title level={3} className="stl-header-title">
            Staff Portal Login
          </Title>
          <p className="stl-header-sub">Authorized staff workspace authentication</p>
        </div>

        <div className="stl-body">
          {apiError && (
            <div className="stl-api-error">
              <div>{apiError}</div>
              {apiError.toLowerCase().includes("registered as a 'user'") && (
                <div style={{ marginTop: 8 }}>
                  <Link
                    to="/UserLogin"
                    style={{
                      display: "inline-block",
                      background: "#059669",
                      color: "#fff",
                      padding: "5px 14px",
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: 12.5,
                      textDecoration: "none",
                    }}
                  >
                    Go to User / Candidate Login &rarr;
                  </Link>
                </div>
              )}
              {apiError.toLowerCase().includes("registered as a 'service'") && (
                <div style={{ marginTop: 8 }}>
                  <Link
                    to="/ServiceLogin"
                    style={{
                      display: "inline-block",
                      background: "#059669",
                      color: "#fff",
                      padding: "5px 14px",
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: 12.5,
                      textDecoration: "none",
                    }}
                  >
                    Go to Service Login &rarr;
                  </Link>
                </div>
              )}
              {apiError.toLowerCase().includes("registered as a 'admin'") && (
                <div style={{ marginTop: 8 }}>
                  <Link
                    to="/AdminLogin"
                    style={{
                      display: "inline-block",
                      background: "#059669",
                      color: "#fff",
                      padding: "5px 14px",
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: 12.5,
                      textDecoration: "none",
                    }}
                  >
                    Go to Admin Login &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <label className="stl-label" htmlFor="stl-phone">
              Staff Mobile Number
            </label>
            <div className="stl-input-wrap">
              <span className="stl-prefix">+91</span>
              <input
                id="stl-phone"
                className="stl-input has-prefix"
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
            {phoneError && <span className="stl-error-msg">{phoneError}</span>}

            <label className="stl-label" htmlFor="stl-password" style={{ marginTop: 14 }}>
              Staff Password
            </label>
            <div className="stl-input-wrap">
              <input
                id="stl-password"
                className="stl-input has-suffix"
                type={showPwd ? "text" : "password"}
                placeholder="Enter your staff password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPwdError("");
                  setApiError("");
                }}
              />
              <span className="stl-eye" onClick={() => setShowPwd((p) => !p)}>
                {showPwd ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </span>
            </div>
            {pwdError && <span className="stl-error-msg">{pwdError}</span>}

            <Button className="stl-btn" htmlType="submit" loading={loading}>
              {!loading && (
                <>
                  Access Staff Portal <ArrowRightOutlined />
                </>
              )}
            </Button>

            <div className="stl-footer">
              New staff member?{" "}
              <Link to="/StaffRegister">Register as Staff</Link>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default StaffLogin;
