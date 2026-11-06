import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, Button, Typography, message } from "antd";
import {
    CrownFilled,
    CheckCircleFilled,
    ArrowRightOutlined,
    ReloadOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
} from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import API from "../../Api/Api";

const { Title } = Typography;

// ── API helpers ──────────────────────────────────────────────────────────────

const sendOTP = async (contact) => {
    const response = await API.post("send-otp/", { Contact: contact });
    return response.data;
};

const verifyOTPOnly = async (contact, otp) => {
    const response = await API.post("verify-otp/", {
        Contact: contact,
        OTP: otp,
        verify_only: true,
    });
    return response.data;
};

const completeRegistration = async (contact, otp, password) => {
    const response = await API.post("verify-otp/", {
        Contact: contact,
        OTP: otp,
        password: password,
        Role: "admin",
    });
    return response.data;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const OTP_LENGTH = 6;
const RESEND_SECONDS = 120; // 2 minutes

// ── Component ─────────────────────────────────────────────────────────────────

const AdminRegister = () => {
    const navigate = useNavigate();

    // Steps: 0 = phone, 1 = otp, 2 = set password, 3 = success
    const [step, setStep] = useState(0);
    const [phone, setPhone] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
    const [otpError, setOtpError] = useState("");

    // Password step state
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(RESEND_SECONDS);
    const [canResend, setCanResend] = useState(false);

    const otpRefs = useRef([]);
    const timerRef = useRef(null);

    // ── Countdown timer ──────────────────────────────────────────────────────

    const startCountdown = useCallback(() => {
        setCountdown(RESEND_SECONDS);
        setCanResend(false);
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        const role = localStorage.getItem("role");
        if (token && (role === "admin" || role === "superadmin")) {
            navigate("/UserPanel");
        }
        return () => clearInterval(timerRef.current);
    }, [navigate]);

    const formatTime = (s) =>
        `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    // ── Step 0 → Send OTP ────────────────────────────────────────────────────

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setPhoneError("");

        if (!/^\d{10}$/.test(phone.trim())) {
            setPhoneError("Enter a valid 10-digit mobile number.");
            return;
        }

        setLoading(true);
        try {
            await sendOTP(phone.trim());
            message.success("OTP sent! Check your phone.");
            setStep(1);
            startCountdown();
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (err) {
            const msg = err.response?.data?.error || "Failed to send OTP. Try again.";
            setPhoneError(msg);
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── Step 1 → Verify OTP ───────────────────────────────────────────────────

    const handleOtpChange = (value, index) => {
        if (!/^\d?$/.test(value)) return;
        const updated = [...otp];
        updated[index] = value;
        setOtp(updated);
        setOtpError("");
        if (value && index < OTP_LENGTH - 1) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
        if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
        if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpPaste = (e) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (pasted.length > 0) {
            const updated = Array(OTP_LENGTH).fill("");
            [...pasted].forEach((ch, i) => (updated[i] = ch));
            setOtp(updated);
            otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
        }
        e.preventDefault();
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const fullOtp = otp.join("");
        setOtpError("");

        if (fullOtp.length < OTP_LENGTH) {
            setOtpError("Enter the complete 6-digit OTP.");
            return;
        }

        setLoading(true);
        try {
            await verifyOTPOnly(phone.trim(), fullOtp);
            clearInterval(timerRef.current);
            message.success("OTP verified! Now create your administrator password. 🔐");
            setStep(2);
        } catch (err) {
            const msg = err.response?.data?.error || "Invalid OTP. Please try again.";
            setOtpError(msg);
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── Resend OTP ────────────────────────────────────────────────────────────

    const handleResend = async () => {
        setOtp(Array(OTP_LENGTH).fill(""));
        setOtpError("");
        setLoading(true);
        try {
            await sendOTP(phone.trim());
            message.success("OTP resent successfully!");
            startCountdown();
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (err) {
            const msg = err.response?.data?.error || "Failed to resend OTP.";
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToPhone = () => {
        clearInterval(timerRef.current);
        setOtp(Array(OTP_LENGTH).fill(""));
        setOtpError("");
        setStep(0);
    };

    const handleBackToOtp = () => {
        setPasswordError("");
        setPassword("");
        setConfirmPassword("");
        setStep(1);
    };

    // ── Step 2 → Set Password & Finalize Registration ────────────────────────

    const handleSetPassword = async (e) => {
        e.preventDefault();
        setPasswordError("");

        if (!password) {
            setPasswordError("Password is required.");
            return;
        }

        if (password.length < 8) {
            setPasswordError("Password must be at least 8 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setPasswordError("Passwords do not match.");
            return;
        }

        const fullOtp = otp.join("");
        setLoading(true);
        try {
            await completeRegistration(
                phone.trim(),
                fullOtp,
                password
            );

            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");

            message.success("Administrator account registered successfully! Redirecting to login... 👑");
            setTimeout(() => {
                navigate("/AdminLogin");
            }, 800);
        } catch (err) {
            const msg =
                err.response?.data?.error ||
                err.response?.data?.detail ||
                "Failed to set password. Please try again.";
            setPasswordError(msg);
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const stepMeta = [
        { title: "Administrator Registration", subtitle: "Create an authorized system administrator account" },
        { title: "Admin Phone Verification", subtitle: `Enter the 6-digit OTP sent to +91 ${phone}` },
        { title: "Set Administrator Password", subtitle: "Configure master access credentials" },
    ];

    return (
        <div className="ar-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

                * { box-sizing: border-box; }

                .ar-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 16px;
                    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
                }

                .ar-card {
                    width: 100%;
                    max-width: 440px;
                    background: #ffffff !important;
                    border-radius: 24px !important;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
                    overflow: hidden;
                    border: none !important;
                }

                .ar-header {
                    background: linear-gradient(135deg, #090d16 0%, #1e293b 60%, #0f172a 100%);
                    padding: 34px 28px 26px;
                    text-align: center;
                    position: relative;
                }
                .ar-header::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    right: 0;
                    height: 14px;
                    background: #ffffff;
                    border-radius: 14px 14px 0 0;
                }
                .ar-logo {
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
                .ar-header-title {
                    color: #ffffff !important;
                    font-weight: 800 !important;
                    font-size: 21px !important;
                    margin: 0 0 4px !important;
                }
                .ar-header-sub {
                    color: #94a3b8;
                    font-size: 13px;
                    margin: 0;
                }

                .ar-steps {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 14px;
                }
                .ar-step-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.2);
                    transition: all 0.3s ease;
                }
                .ar-step-dot.active {
                    width: 24px;
                    border-radius: 4px;
                    background: #f59e0b;
                }
                .ar-step-dot.done {
                    background: rgba(255, 255, 255, 0.7);
                }

                .ar-body {
                    padding: 24px 28px 32px;
                }
                .ar-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 8px;
                }
                .ar-input-wrap {
                    position: relative;
                    margin-bottom: 6px;
                }
                .ar-input {
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
                .ar-input:focus {
                    border-color: #f59e0b;
                    background: #fff;
                    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.15);
                }
                .ar-input.has-prefix {
                    padding-left: 56px;
                }
                .ar-input.has-suffix {
                    padding-right: 44px;
                }
                .ar-prefix {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-weight: 700;
                    font-size: 14px;
                    color: #64748b;
                    user-select: none;
                }
                .ar-eye {
                    position: absolute;
                    right: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #64748b;
                    cursor: pointer;
                    font-size: 16px;
                }
                .ar-eye:hover { color: #d97706; }

                .ar-error-msg {
                    color: #dc2626;
                    font-size: 12px;
                    margin-top: 5px;
                    display: block;
                }

                .ar-btn {
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
                .ar-btn:hover {
                    background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
                    transform: translateY(-1px);
                }

                .ar-otp-row {
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                    margin-bottom: 8px;
                }
                .ar-otp-box {
                    width: 48px;
                    height: 54px;
                    text-align: center;
                    font-size: 22px;
                    font-weight: 800;
                    color: #0f172a;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 12px;
                    background: #f8fafc;
                    outline: none;
                    transition: all 0.2s;
                }
                .ar-otp-box:focus {
                    border-color: #f59e0b;
                    background: #fff;
                    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.15);
                }

                .ar-resend-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 14px;
                    font-size: 13px;
                }
                .ar-resend-btn {
                    background: none;
                    border: none;
                    color: #d97706;
                    font-weight: 700;
                    cursor: pointer;
                    padding: 0;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .ar-resend-btn:disabled {
                    color: #94a3b8;
                    cursor: not-allowed;
                }
                .ar-back {
                    text-align: center;
                    color: #64748b;
                    font-size: 13px;
                    margin-top: 16px;
                    cursor: pointer;
                    font-weight: 600;
                }
                .ar-back:hover { color: #0f172a; }

                .ar-success {
                    text-align: center;
                    padding: 12px 0 6px;
                }
                .ar-success-icon {
                    font-size: 58px;
                    color: #f59e0b;
                    margin-bottom: 14px;
                }
                .ar-success-badge {
                    display: inline-block;
                    background: #fef3c7;
                    color: #b45309;
                    border: 1px solid #fde68a;
                    border-radius: 20px;
                    padding: 4px 14px;
                    font-size: 12px;
                    font-weight: 700;
                    margin-bottom: 12px;
                }
                .ar-success-number {
                    font-size: 20px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 4px 0 16px;
                    letter-spacing: 0.5px;
                }

                .ar-footer-links {
                    margin-top: 20px;
                    text-align: center;
                    font-size: 13px;
                    color: #64748b;
                }
                .ar-footer-links a {
                    color: #d97706;
                    font-weight: 700;
                    text-decoration: none;
                }
                .ar-footer-links a:hover {
                    text-decoration: underline;
                }

                @media (max-width: 480px) {
                    .ar-body    { padding: 20px 20px 28px; }
                    .ar-header  { padding: 26px 20px 22px; }
                    .ar-otp-box { width: 42px; height: 50px; font-size: 20px; }
                    .ar-otp-row { gap: 6px; }
                }
            `}</style>

            <Card className="ar-card" variant="borderless">
                <div className="ar-header">
                    <div className="ar-logo">
                        <CrownFilled />
                    </div>

                    <Title level={3} className="ar-header-title">
                        {stepMeta[step]?.title}
                    </Title>
                    <p className="ar-header-sub">{stepMeta[step]?.subtitle}</p>

                    {step < 3 && (
                        <div className="ar-steps">
                            {[0, 1, 2].map((s) => (
                                <div
                                    key={s}
                                    className={`ar-step-dot ${
                                        step === s ? "active" : step > s ? "done" : "idle"
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="ar-body">
                    {/* STEP 0: Phone number */}
                    {step === 0 && (
                        <form onSubmit={handleSendOTP} noValidate>
                            <label className="ar-label" htmlFor="ar-phone">
                                Admin Mobile Number
                            </label>
                            <div className="ar-input-wrap">
                                <span className="ar-prefix">+91</span>
                                <input
                                    id="ar-phone"
                                    className="ar-input has-prefix"
                                    type="tel"
                                    maxLength={10}
                                    placeholder="Enter 10-digit number"
                                    value={phone}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "");
                                        setPhone(val);
                                        setPhoneError("");
                                    }}
                                    autoFocus
                                />
                            </div>
                            {phoneError && <span className="ar-error-msg">{phoneError}</span>}

                            <Button className="ar-btn" htmlType="submit" loading={loading}>
                                {!loading && (
                                    <>
                                        Get Admin Verification Code <ArrowRightOutlined />
                                    </>
                                )}
                            </Button>

                            <div className="ar-footer-links">
                                Already registered as Administrator?{" "}
                                <Link to="/AdminLogin">Admin Login</Link>
                            </div>
                        </form>
                    )}

                    {/* STEP 1: Verify OTP */}
                    {step === 1 && (
                        <form onSubmit={handleVerifyOTP} noValidate>
                            <label className="ar-label">Enter 6-Digit Verification Code</label>
                            <div className="ar-otp-row" onPaste={handleOtpPaste}>
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => (otpRefs.current[i] = el)}
                                        className="ar-otp-box"
                                        type="tel"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(e.target.value, i)}
                                        onKeyDown={(e) => handleOtpKeyDown(e, i)}
                                    />
                                ))}
                            </div>
                            {otpError && <span className="ar-error-msg">{otpError}</span>}

                            <div className="ar-resend-row">
                                <span style={{ color: "#64748b" }}>
                                    {countdown > 0 ? `Resend code in ${formatTime(countdown)}` : "Didn't receive code?"}
                                </span>
                                <button
                                    type="button"
                                    className="ar-resend-btn"
                                    onClick={handleResend}
                                    disabled={!canResend || loading}
                                >
                                    <ReloadOutlined /> Resend OTP
                                </button>
                            </div>

                            <Button className="ar-btn" htmlType="submit" loading={loading}>
                                {!loading && (
                                    <>
                                        Verify Admin Code <ArrowRightOutlined />
                                    </>
                                )}
                            </Button>

                            <div className="ar-back" onClick={handleBackToPhone}>
                                ← Change mobile number
                            </div>
                        </form>
                    )}

                    {/* STEP 2: Set Password */}
                    {step === 2 && (
                        <form onSubmit={handleSetPassword} noValidate>
                            <label className="ar-label" htmlFor="ar-password">
                                Master Password
                            </label>
                            <div className="ar-input-wrap">
                                <input
                                    id="ar-password"
                                    className="ar-input has-suffix"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="At least 8 characters"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setPasswordError("");
                                    }}
                                    autoFocus
                                />
                                <span
                                    className="ar-eye"
                                    onClick={() => setShowPassword((p) => !p)}
                                >
                                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                </span>
                            </div>

                            <label className="ar-label" htmlFor="ar-confirm-pwd" style={{ marginTop: 14 }}>
                                Confirm Master Password
                            </label>
                            <div className="ar-input-wrap">
                                <input
                                    id="ar-confirm-pwd"
                                    className="ar-input has-suffix"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setPasswordError("");
                                    }}
                                />
                                <span
                                    className="ar-eye"
                                    onClick={() => setShowConfirmPassword((p) => !p)}
                                >
                                    {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                </span>
                            </div>

                            {passwordError && <span className="ar-error-msg">{passwordError}</span>}

                            <Button className="ar-btn" htmlType="submit" loading={loading}>
                                {!loading && (
                                    <>
                                        Grant Admin Access <CheckCircleFilled />
                                    </>
                                )}
                            </Button>

                            <div className="ar-back" onClick={handleBackToOtp}>
                                ← Re-verify OTP
                            </div>
                        </form>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default AdminRegister;
