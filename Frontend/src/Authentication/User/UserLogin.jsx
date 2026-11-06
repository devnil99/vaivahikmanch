import React, { useState, useEffect } from "react";
import { Card, Button, Typography, message } from "antd";
import {
  HeartFilled,
  ArrowRightOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { FaShieldHalved } from "react-icons/fa6";
import { UserLogin } from "../../Api/CoreApi";

const { Title } = Typography;

function UserLog() {
  const id_navigate = localStorage.getItem("id_navigate");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      navigate("/UserPanel");
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
      setPwdError("Please enter your password.");
      ok = false;
    }
    return ok;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // CoreApi.UserLogin posts to /login/ and also stores tokens in localStorage
      const response = await UserLogin({ Contact: phone.trim(), password, Role: "user" });

      if (response?.access) {
        // ── Tokens (already stored by CoreApi.UserLogin) ──────────
        // Store full user session from response.user
        const u = response.user || {};
        localStorage.setItem("user_id", u.id || "");
        localStorage.setItem("contact", u.Contact || phone.trim());
        localStorage.setItem("username", u.username || phone.trim());
        localStorage.setItem("role", u.Role || "user");
        localStorage.setItem("ref_code", u.Reference_Code ?? "");
        localStorage.setItem("amount", u.Amount ?? 0);
        localStorage.setItem("refered_by", u.Refered_By ?? "");
        localStorage.setItem("first_name", u.first_name || "");
        localStorage.setItem("last_name", u.last_name || "");
        localStorage.setItem("email", u.email || "");
        message.success("Welcome back! Login Successful. 💖");

        if (id_navigate) {
          localStorage.removeItem("id_navigate");
          navigate(`/UserData/${id_navigate}`);
        } else {
          navigate("/UserPanel");
        }
      } else {
        // CoreApi may have already shown an error toast, but show inline too
        const errMsg = response?.error || "Invalid credentials. Please try again.";
        setApiError(errMsg);
      }
    } catch (err) {
      const errMsg = err?.response?.data?.error || "Login failed. Please check your connection.";
      setApiError(errMsg);
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ul-page">
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

                * { box-sizing: border-box; }

                .ul-page {
                    min-height: 100vh;
                    padding: 24px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #fff0f5 0%, #ffdce7 50%, #ffcaca 100%);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                }

                /* Card */
                .ul-card {
                    width: 100%;
                    max-width: 440px;
                    border-radius: 24px !important;
                    overflow: hidden;
                    border: none !important;
                    box-shadow: 0 24px 60px rgba(184, 13, 59, 0.18);
                }
                .ul-card .ant-card-body { padding: 0 !important; }

                /* Header */
                .ul-header {
                    padding: 32px 30px 28px;
                    text-align: center;
                    color: white;
                    background: linear-gradient(135deg, #ff5b91 0%, #f52f5d 55%, #df174b 100%);
                    position: relative;
                    overflow: hidden;
                }
                .ul-header::before {
                    content: '';
                    position: absolute;
                    top: -40px; right: -40px;
                    width: 120px; height: 120px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.08);
                }
                .ul-header::after {
                    content: '';
                    position: absolute;
                    bottom: -30px; left: -30px;
                    width: 90px; height: 90px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.06);
                }
                .ul-logo {
                    width: 64px; height: 64px;
                    margin: 0 auto 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 20px;
                    background: rgba(255,255,255,0.2);
                    border: 1.5px solid rgba(255,255,255,0.35);
                    font-size: 30px;
                    position: relative; z-index: 1;
                    animation: ul-beat 2s ease-in-out infinite;
                }
                @keyframes ul-beat {
                    0%, 100% { transform: scale(1); }
                    50%       { transform: scale(1.08); }
                }
                .ul-header-title {
                    color: #fff !important;
                    margin: 0 0 8px !important;
                    font-size: 22px !important;
                    font-weight: 800 !important;
                    position: relative; z-index: 1;
                }
                .ul-header-sub {
                    color: rgba(255,255,255,0.88);
                    font-size: 13.5px;
                    line-height: 1.6;
                    margin: 0;
                    position: relative; z-index: 1;
                }

                /* Body */
                .ul-body { padding: 30px; background: #fff; }

                /* Label */
                .ul-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 700;
                    color: #41303b;
                    margin-bottom: 8px;
                }

                /* Phone input */
                .ul-phone-wrap {
                    display: flex;
                    align-items: center;
                    border: 1.5px solid #f0dce4;
                    border-radius: 12px;
                    background: #fffafb;
                    padding: 0 14px;
                    height: 50px;
                    gap: 10px;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .ul-phone-wrap:focus-within {
                    border-color: #f04476;
                    box-shadow: 0 0 0 3px rgba(240,68,118,0.09);
                }
                .ul-phone-prefix {
                    font-size: 15px;
                    color: #e83d70;
                    flex-shrink: 0;
                }
                .ul-phone-divider {
                    width: 1px; height: 24px;
                    background: #f0dce4;
                    flex-shrink: 0;
                }
                .ul-phone-input {
                    border: none;
                    outline: none;
                    flex: 1;
                    font-size: 15px;
                    font-weight: 600;
                    color: #2d1520;
                    background: transparent;
                    letter-spacing: 0.5px;
                    font-family: inherit;
                }
                .ul-phone-input::placeholder { color: #c8a8b5; font-weight: 400; }

                /* Password input */
                .ul-pwd-wrap {
                    display: flex;
                    align-items: center;
                    border: 1.5px solid #f0dce4;
                    border-radius: 12px;
                    background: #fffafb;
                    padding: 0 14px;
                    height: 50px;
                    gap: 10px;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    margin-top: 18px;
                }
                .ul-pwd-wrap:focus-within {
                    border-color: #f04476;
                    box-shadow: 0 0 0 3px rgba(240,68,118,0.09);
                }
                .ul-pwd-icon {
                    font-size: 15px;
                    color: #e83d70;
                    flex-shrink: 0;
                }
                .ul-pwd-input {
                    border: none;
                    outline: none;
                    flex: 1;
                    font-size: 15px;
                    font-weight: 600;
                    color: #2d1520;
                    background: transparent;
                    font-family: inherit;
                }
                .ul-pwd-input::placeholder { color: #c8a8b5; font-weight: 400; }
                .ul-eye-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #c8a8b5;
                    font-size: 15px;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    transition: color 0.2s;
                    flex-shrink: 0;
                }
                .ul-eye-btn:hover { color: #b80d3b; }

                /* Error */
                .ul-error {
                    color: #c0334a;
                    font-size: 12.5px;
                    font-weight: 600;
                    margin-top: 7px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                /* API error banner */
                .ul-api-error {
                    background: #fff5f7;
                    border: 1.5px solid #ffd0dc;
                    border-radius: 10px;
                    padding: 10px 14px;
                    color: #c0334a;
                    font-size: 13px;
                    font-weight: 600;
                    margin-top: 16px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    animation: ul-shake 0.35s ease;
                }
                @keyframes ul-shake {
                    0%,100% { transform: translateX(0); }
                    20%,60%  { transform: translateX(-5px); }
                    40%,80%  { transform: translateX(5px);  }
                }

                /* Primary button */
                .ul-btn {
                    width: 100%;
                    height: 50px !important;
                    border: none !important;
                    border-radius: 12px !important;
                    font-weight: 700 !important;
                    font-size: 15px !important;
                    background: linear-gradient(100deg, #ff5b91, #ed2857) !important;
                    box-shadow: 0 8px 20px rgba(237,40,87,0.22);
                    transition: opacity 0.2s, transform 0.15s !important;
                    margin-top: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .ul-btn:hover:not(:disabled) {
                    opacity: 0.90;
                    transform: translateY(-1px);
                    box-shadow: 0 10px 24px rgba(237,40,87,0.28) !important;
                }
                .ul-btn:disabled { opacity: 0.55 !important; cursor: not-allowed; }

                /* Divider */
                .ul-divider {
                    border: none;
                    border-top: 1px solid #ffe5ec;
                    margin: 22px 0 18px;
                }

                /* Footer links */
                .ul-footer {
                    text-align: center;
                }
                .ul-footer-text { color: #8a6e76; font-size: 13.5px; }
                .ul-footer-link {
                    color: #b80d3b;
                    font-weight: 700;
                    text-decoration: none;
                    font-size: 13.5px;
                    transition: opacity 0.2s;
                }
                .ul-footer-link:hover { opacity: 0.75; }

                /* Security badge */
                .ul-security {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    margin-top: 14px;
                    font-size: 11.5px;
                    color: #b8a4ae;
                }

                /* Slide-in animation */
                .ul-body-inner {
                    animation: ul-slide-in 0.3s cubic-bezier(0.25,0.46,0.45,0.94) both;
                }
                @keyframes ul-slide-in {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 480px) {
                    .ul-body   { padding: 24px 20px; }
                    .ul-header { padding: 26px 20px 22px; }
                }
            `}</style>

      <Card className="ul-card" variant="borderless">
        {/* HEADER */}
        <div className="ul-header">
          <div className="ul-logo">
            <HeartFilled />
          </div>
          <Title level={3} className="ul-header-title">Welcome Back</Title>
          <p className="ul-header-sub">Sign in to your matrimonial account</p>
        </div>

        {/* BODY */}
        <div className="ul-body">
          <form className="ul-body-inner" onSubmit={handleLogin} noValidate>

            {/* Phone / Contact */}
            <label className="ul-label" htmlFor="ul-phone">Mobile Number</label>
            <div className="ul-phone-wrap">
              <span className="ul-phone-prefix">📱</span>
              <div className="ul-phone-divider" />
              <input
                id="ul-phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className="ul-phone-input"
                placeholder="Registered 10-digit number"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                  setPhoneError("");
                  setApiError("");
                }}
                autoFocus
              />
            </div>
            {phoneError && <div className="ul-error">⚠ {phoneError}</div>}

            {/* Password */}
            <label className="ul-label" htmlFor="ul-password" style={{ marginTop: 18, display: "block" }}>
              Password
            </label>
            <div className="ul-pwd-wrap" style={{ marginTop: 0 }}>
              <span className="ul-pwd-icon">🔒</span>
              <div className="ul-phone-divider" />
              <input
                id="ul-password"
                type={showPwd ? "text" : "password"}
                className="ul-pwd-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPwdError("");
                  setApiError("");
                }}
              />
              <button
                type="button"
                className="ul-eye-btn"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
            {pwdError && <div className="ul-error">⚠ {pwdError}</div>}

            {/* API error banner */}
            {apiError && (
              <div className="ul-api-error">
                ⚠ {apiError}
              </div>
            )}

            {/* Submit */}
            <Button
              htmlType="submit"
              className="ul-btn"
              loading={loading}
              disabled={phone.length !== 10 || !password}
            >
              {!loading && <>Sign In <ArrowRightOutlined /></>}
            </Button>

            {/* Footer */}
            <hr className="ul-divider" />
            <div className="ul-footer">
              <span className="ul-footer-text">New to MatchHearts? </span>
              <Link to="/UserRegister/" className="ul-footer-link">
                Register Free
              </Link>
            </div>

            {/* Security badge */}
            <div className="ul-security">
              <FaShieldHalved style={{ color: "#28a745" }} />
              256-Bit SSL Encrypted &amp; Confidential
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default UserLog;


