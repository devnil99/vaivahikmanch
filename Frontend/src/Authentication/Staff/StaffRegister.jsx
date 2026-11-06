import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, Button, Typography, message } from "antd";
import {
    IdcardFilled,
    CheckCircleFilled,
    ArrowRightOutlined,
    ReloadOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
} from "@ant-design/icons";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
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

const completeRegistration = async (contact, otp, password, refCode, role = "staff") => {
    const response = await API.post("verify-otp/", {
        Contact: contact,
        OTP: otp,
        password: password,
        Refered_By: refCode || undefined,
        Role: role,
    });
    return response.data;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const OTP_LENGTH = 6;
const RESEND_SECONDS = 120; // 2 minutes

// ── Component ─────────────────────────────────────────────────────────────────

const StaffRegister = () => {
    const { refCode: routeRefCode } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Check refCode from route params or search query params (?refCode=... or ?ref=... or ?refer=...)
    const paramRefCode = (
        routeRefCode ||
        searchParams.get("refCode") ||
        searchParams.get("ref") ||
        searchParams.get("refer") ||
        ""
    ).trim();

    const [adminRefCode, setAdminRefCode] = useState(null);

    // If refCode is not present in URL params, fetch default admin reference code from backend
    useEffect(() => {
        if (!paramRefCode) {
            const fetchAdminDetails = async () => {
                try {
                    const response = await API.get("users/?role=admin");
                    const adminList = Array.isArray(response?.data) ? response.data : [];
                    const adminUser =
                        adminList.find(
                            (u) =>
                                (u.Role === "admin" || u.role === "admin" || u.Role === "superadmin") &&
                                (u.Reference_Code || u.refer)
                        ) || adminList[0];

                    if (adminUser) {
                        const code = adminUser.Reference_Code || adminUser.refer;
                        if (code) {
                            setAdminRefCode(String(code));
                        }
                    }
                } catch (err) {
                    console.warn("Could not fetch admin reference code:", err);
                }
            };

            fetchAdminDetails();
        }
    }, [paramRefCode]);

    const [referralInput, setReferralInput] = useState(paramRefCode);
    const effectiveRefCode = (referralInput || paramRefCode || adminRefCode || "").trim();

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
        if (token && role === "staff") {
            navigate("/StaffPanel");
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
            message.success("OTP verified! Create your staff password. 🔐");
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
            const res = await completeRegistration(
                phone.trim(),
                fullOtp,
                password,
                effectiveRefCode,
                "staff" // 🌟 Role is by default 'staff'
            );

            const u = res?.user || res || {};
            if (res?.access) {
                localStorage.setItem("access_token", res.access);
            }
            if (res?.refresh) {
                localStorage.setItem("refresh_token", res.refresh);
            }
            localStorage.setItem("user_id", res?.id || u.id || "");
            localStorage.setItem("contact", res?.Contact || u.Contact || phone.trim());
            localStorage.setItem("username", res?.username || u.username || phone.trim());
            localStorage.setItem("role", u.Role || "staff");
            localStorage.setItem("ref_code", u.Reference_Code ?? "");
            localStorage.setItem("amount", u.Amount ?? 0);
            localStorage.setItem("refered_by", u.Refered_By ?? "");

            message.success("Staff account registered successfully! 💼 Please complete your Staff Profile & KYC.");
            setTimeout(() => {
                navigate("/StaffPanel");
            }, 600);
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
        { title: "Staff Member Registration", subtitle: "Join the organizational operations team" },
        { title: "Staff Verification", subtitle: `Enter the 6-digit OTP sent to +91 ${phone}` },
        { title: "Set Staff Password", subtitle: "Create your staff portal access credentials" },
    ];

    return (
        <div className="st-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

                * { box-sizing: border-box; }

                .st-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f172a 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 16px;
                    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
                }

                .st-card {
                    width: 100%;
                    max-width: 440px;
                    background: #ffffff !important;
                    border-radius: 24px !important;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
                    overflow: hidden;
                    border: none !important;
                }

                .st-header {
                    background: linear-gradient(135deg, #065f46 0%, #059669 60%, #0d9488 100%);
                    padding: 34px 28px 26px;
                    text-align: center;
                    position: relative;
                }
                .st-header::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    right: 0;
                    height: 14px;
                    background: #ffffff;
                    border-radius: 14px 14px 0 0;
                }
                .st-logo {
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
                .st-header-title {
                    color: #ffffff !important;
                    font-weight: 800 !important;
                    font-size: 21px !important;
                    margin: 0 0 4px !important;
                }
                .st-header-sub {
                    color: rgba(255, 255, 255, 0.85);
                    font-size: 13px;
                    margin: 0;
                }

                .st-steps {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 14px;
                }
                .st-step-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.3);
                    transition: all 0.3s ease;
                }
                .st-step-dot.active {
                    width: 24px;
                    border-radius: 4px;
                    background: #a7f3d0;
                }
                .st-step-dot.done {
                    background: rgba(255, 255, 255, 0.8);
                }

                .st-body {
                    padding: 24px 28px 32px;
                }
                .st-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 8px;
                }
                .st-input-wrap {
                    position: relative;
                    margin-bottom: 6px;
                }
                .st-input {
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
                .st-input:focus {
                    border-color: #059669;
                    background: #fff;
                    box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.12);
                }
                .st-input.has-prefix {
                    padding-left: 56px;
                }
                .st-input.has-suffix {
                    padding-right: 44px;
                }
                .st-prefix {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-weight: 700;
                    font-size: 14px;
                    color: #64748b;
                    user-select: none;
                }
                .st-eye {
                    position: absolute;
                    right: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #64748b;
                    cursor: pointer;
                    font-size: 16px;
                }
                .st-eye:hover { color: #065f46; }

                .st-error-msg {
                    color: #dc2626;
                    font-size: 12px;
                    margin-top: 5px;
                    display: block;
                }

                .st-btn {
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
                .st-btn:hover {
                    opacity: 0.95;
                    transform: translateY(-1px);
                }

                .st-otp-row {
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                    margin-bottom: 8px;
                }
                .st-otp-box {
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
                .st-otp-box:focus {
                    border-color: #059669;
                    background: #fff;
                    box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.12);
                }

                .st-resend-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 14px;
                    font-size: 13px;
                }
                .st-resend-btn {
                    background: none;
                    border: none;
                    color: #059669;
                    font-weight: 700;
                    cursor: pointer;
                    padding: 0;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .st-resend-btn:disabled {
                    color: #94a3b8;
                    cursor: not-allowed;
                }
                .st-back {
                    text-align: center;
                    color: #64748b;
                    font-size: 13px;
                    margin-top: 16px;
                    cursor: pointer;
                    font-weight: 600;
                }
                .st-back:hover { color: #065f46; }

                .st-success {
                    text-align: center;
                    padding: 12px 0 6px;
                }
                .st-success-icon {
                    font-size: 58px;
                    color: #059669;
                    margin-bottom: 14px;
                }
                .st-success-badge {
                    display: inline-block;
                    background: #ecfdf5;
                    color: #047857;
                    border: 1px solid #a7f3d0;
                    border-radius: 20px;
                    padding: 4px 14px;
                    font-size: 12px;
                    font-weight: 700;
                    margin-bottom: 12px;
                }
                .st-success-number {
                    font-size: 20px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 4px 0 16px;
                    letter-spacing: 0.5px;
                }

                .st-footer-links {
                    margin-top: 20px;
                    text-align: center;
                    font-size: 13px;
                    color: #64748b;
                }
                .st-footer-links a {
                    color: #059669;
                    font-weight: 700;
                    text-decoration: none;
                }
                .st-footer-links a:hover {
                    text-decoration: underline;
                }

                @media (max-width: 480px) {
                    .st-body    { padding: 20px 20px 28px; }
                    .st-header  { padding: 26px 20px 22px; }
                    .st-otp-box { width: 42px; height: 50px; font-size: 20px; }
                    .st-otp-row { gap: 6px; }
                }
            `}</style>

            <Card className="st-card" variant="borderless">
                <div className="st-header">
                    <div className="st-logo">
                        <IdcardFilled />
                    </div>

                    <Title level={3} className="st-header-title">
                        {stepMeta[step]?.title}
                    </Title>
                    <p className="st-header-sub">{stepMeta[step]?.subtitle}</p>

                    {step < 3 && (
                        <div className="st-steps">
                            {[0, 1, 2].map((s) => (
                                <div
                                    key={s}
                                    className={`st-step-dot ${
                                        step === s ? "active" : step > s ? "done" : "idle"
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="st-body">
                    {/* STEP 0: Phone number */}
                    {step === 0 && (
                        <form onSubmit={handleSendOTP} noValidate>
                            <label className="st-label" htmlFor="st-phone">
                                Staff Mobile Number
                            </label>
                            <div className="st-input-wrap">
                                <span className="st-prefix">+91</span>
                                <input
                                    id="st-phone"
                                    className="st-input has-prefix"
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
                            {phoneError && <span className="st-error-msg">{phoneError}</span>}

                            <label className="st-label" htmlFor="st-refcode" style={{ marginTop: 14 }}>
                                Referral Code <span style={{ fontWeight: 400, color: "#64748b" }}>(Staff or Admin Code)</span>
                            </label>
                            <div className="st-input-wrap">
                                <span className="st-prefix">🔑</span>
                                <input
                                    id="st-refcode"
                                    className="st-input has-prefix"
                                    type="text"
                                    placeholder={paramRefCode ? `Staff Code: ${paramRefCode}` : adminRefCode ? `Default Admin: ${adminRefCode}` : "Enter 6-digit referral code (Optional)"}
                                    value={referralInput}
                                    onChange={(e) => setReferralInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                />
                            </div>

                            <Button className="st-btn" htmlType="submit" loading={loading} style={{ marginTop: 18 }}>
                                {!loading && (
                                    <>
                                        Get Staff Verification OTP <ArrowRightOutlined />
                                    </>
                                )}
                            </Button>

                            <div className="st-footer-links">
                                Already registered as Staff?{" "}
                                <Link to="/StaffLogin">Staff Login</Link>
                            </div>
                        </form>
                    )}

                    {/* STEP 1: Verify OTP */}
                    {step === 1 && (
                        <form onSubmit={handleVerifyOTP} noValidate>
                            <label className="st-label">Enter 6-Digit Verification Code</label>
                            <div className="st-otp-row" onPaste={handleOtpPaste}>
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => (otpRefs.current[i] = el)}
                                        className="st-otp-box"
                                        type="tel"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(e.target.value, i)}
                                        onKeyDown={(e) => handleOtpKeyDown(e, i)}
                                    />
                                ))}
                            </div>
                            {otpError && <span className="st-error-msg">{otpError}</span>}

                            <div className="st-resend-row">
                                <span style={{ color: "#64748b" }}>
                                    {countdown > 0 ? `Resend code in ${formatTime(countdown)}` : "Didn't receive code?"}
                                </span>
                                <button
                                    type="button"
                                    className="st-resend-btn"
                                    onClick={handleResend}
                                    disabled={!canResend || loading}
                                >
                                    <ReloadOutlined /> Resend OTP
                                </button>
                            </div>

                            <Button className="st-btn" htmlType="submit" loading={loading}>
                                {!loading && (
                                    <>
                                        Verify Staff Code <ArrowRightOutlined />
                                    </>
                                )}
                            </Button>

                            <div className="st-back" onClick={handleBackToPhone}>
                                ← Change mobile number
                            </div>
                        </form>
                    )}

                    {/* STEP 2: Set Password */}
                    {step === 2 && (
                        <form onSubmit={handleSetPassword} noValidate>
                            <label className="st-label" htmlFor="st-password">
                                Staff Password
                            </label>
                            <div className="st-input-wrap">
                                <input
                                    id="st-password"
                                    className="st-input has-suffix"
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
                                    className="st-eye"
                                    onClick={() => setShowPassword((p) => !p)}
                                >
                                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                </span>
                            </div>

                            <label className="st-label" htmlFor="st-confirm-pwd" style={{ marginTop: 14 }}>
                                Confirm Password
                            </label>
                            <div className="st-input-wrap">
                                <input
                                    id="st-confirm-pwd"
                                    className="st-input has-suffix"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setPasswordError("");
                                    }}
                                />
                                <span
                                    className="st-eye"
                                    onClick={() => setShowConfirmPassword((p) => !p)}
                                >
                                    {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                </span>
                            </div>

                            {passwordError && <span className="st-error-msg">{passwordError}</span>}

                            <Button className="st-btn" htmlType="submit" loading={loading}>
                                {!loading && (
                                    <>
                                        Complete Staff Registration <CheckCircleFilled />
                                    </>
                                )}
                            </Button>

                            <div className="st-back" onClick={handleBackToOtp}>
                                ← Re-verify OTP
                            </div>
                        </form>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default StaffRegister;
