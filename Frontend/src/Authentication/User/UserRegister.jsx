import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, Button, Typography, message } from "antd";
import {
    HeartFilled,
    CheckCircleFilled,
    ArrowRightOutlined,
    ReloadOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    LockOutlined,
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

const completeRegistration = async (contact, otp, password, refCode, role = "user") => {
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

const UserRegister = () => {
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
        if (token) {
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
            // Verify OTP without creating user yet
            await verifyOTPOnly(phone.trim(), fullOtp);
            clearInterval(timerRef.current);
            message.success("OTP verified! Now create your password. 🔐");
            setStep(2); // Proceed to Set Password step
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

    // ── Back to phone step ─────────────────────────────────────────────────────

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
                "user"
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
            localStorage.setItem("role", u.Role || "user");
            localStorage.setItem("ref_code", u.Reference_Code ?? "");
            localStorage.setItem("amount", u.Amount ?? 0);
            localStorage.setItem("refered_by", u.Refered_By ?? "");

            message.success("Account created successfully! Please complete your profile to access all partner features 💖");
            setTimeout(() => {
                navigate("/UserPanel?tab=edit&newUser=true");
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

    // ── Step headers ──────────────────────────────────────────────────────────

    const stepMeta = [
        { title: "Create Account", subtitle: "Enter your mobile number to get started." },
        { title: "Verify OTP", subtitle: `A 6-digit code was sent to +91 ${phone}` },
        { title: "Set Password", subtitle: "Create a secure password to protect your account." },
    ];

    // ─────────────────────────────────────────────────────────────────────────
    //  RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="ur-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

                * { box-sizing: border-box; }

                .ur-page {
                    min-height: 100vh;
                    padding: 24px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #fff0f5 0%, #ffdce7 50%, #ffcaca 100%);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                }

                /* Card */
                .ur-card {
                    width: 100%;
                    max-width: 440px;
                    border-radius: 24px !important;
                    overflow: hidden;
                    border: none !important;
                    box-shadow: 0 24px 60px rgba(184, 13, 59, 0.18);
                }
                .ur-card .ant-card-body { padding: 0 !important; }

                /* Header */
                .ur-header {
                    padding: 32px 30px 28px;
                    text-align: center;
                    color: white;
                    background: linear-gradient(135deg, #ff5b91 0%, #f52f5d 55%, #df174b 100%);
                    position: relative;
                    overflow: hidden;
                }
                .ur-header::before {
                    content: '';
                    position: absolute;
                    top: -40px; right: -40px;
                    width: 120px; height: 120px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.08);
                }
                .ur-header::after {
                    content: '';
                    position: absolute;
                    bottom: -30px; left: -30px;
                    width: 90px; height: 90px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.06);
                }

                .ur-logo {
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
                }
                .ur-header-title {
                    color: #fff !important;
                    margin: 0 0 8px !important;
                    font-size: 22px !important;
                    font-weight: 800 !important;
                    position: relative; z-index: 1;
                }
                .ur-header-sub {
                    color: rgba(255,255,255,0.88);
                    font-size: 13.5px;
                    line-height: 1.6;
                    margin: 0;
                    position: relative; z-index: 1;
                }

                /* Step dots */
                .ur-steps {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    margin-top: 16px;
                    position: relative; z-index: 1;
                }
                .ur-step-dot {
                    height: 6px;
                    border-radius: 3px;
                    background: rgba(255,255,255,0.35);
                    transition: all 0.35s ease;
                }
                .ur-step-dot.active { width: 24px; background: #fff; }
                .ur-step-dot.done   { width: 12px; background: rgba(255,255,255,0.7); }
                .ur-step-dot.idle   { width: 8px;  background: rgba(255,255,255,0.3); }

                /* Referral badge */
                .ur-ref-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.4);
                    color: #fff;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    padding: 3px 10px;
                    border-radius: 20px;
                    margin-top: 10px;
                    position: relative; z-index: 1;
                }

                /* Body */
                .ur-body {
                    padding: 30px;
                    background: #fff;
                }

                /* Field label */
                .ur-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 700;
                    color: #41303b;
                    margin-bottom: 8px;
                }

                /* Input wrap */
                .ur-input-wrap {
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
                .ur-input-wrap:focus-within {
                    border-color: #f04476;
                    box-shadow: 0 0 0 3px rgba(240,68,118,0.09);
                }
                .ur-input-icon {
                    font-size: 16px;
                    color: #e83d70;
                    flex-shrink: 0;
                }
                .ur-input-divider {
                    width: 1px; height: 24px;
                    background: #f0dce4;
                    flex-shrink: 0;
                }
                .ur-text-input {
                    border: none;
                    outline: none;
                    flex: 1;
                    font-size: 14.5px;
                    font-weight: 600;
                    color: #2d1520;
                    background: transparent;
                    font-family: inherit;
                }
                .ur-text-input::placeholder { color: #c8a8b5; font-weight: 400; }

                .ur-eye-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #b80d3b;
                    padding: 0;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    opacity: 0.75;
                    transition: opacity 0.2s;
                }
                .ur-eye-btn:hover { opacity: 1; }

                /* Error */
                .ur-error {
                    color: #c0334a;
                    font-size: 12.5px;
                    font-weight: 600;
                    margin-top: 7px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                /* OTP boxes */
                .ur-otp-row {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                    margin-top: 4px;
                }
                .ur-otp-box {
                    width: 48px; height: 54px;
                    border: 1.5px solid #f0dce4;
                    border-radius: 12px;
                    background: #fffafb;
                    font-size: 22px;
                    font-weight: 800;
                    color: #b80d3b;
                    text-align: center;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
                    caret-color: #b80d3b;
                    cursor: text;
                    font-family: inherit;
                }
                .ur-otp-box:focus {
                    border-color: #f04476;
                    box-shadow: 0 0 0 3px rgba(240,68,118,0.12);
                    transform: scale(1.06);
                }
                .ur-otp-box.filled {
                    border-color: #b80d3b;
                    background: #fff5f7;
                }

                /* Countdown */
                .ur-countdown {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    margin: 14px 0;
                    font-size: 13px;
                    color: #968894;
                }
                .ur-countdown-time {
                    font-weight: 800;
                    color: #b80d3b;
                    font-variant-numeric: tabular-nums;
                }
                .ur-resend-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #b80d3b;
                    font-weight: 700;
                    font-size: 13px;
                    padding: 0;
                    font-family: inherit;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    transition: opacity 0.2s;
                }
                .ur-resend-btn:hover { opacity: 0.75; }

                /* Password requirements helper */
                .ur-pwd-hint {
                    margin: 10px 0 16px;
                    font-size: 12px;
                    color: #8c7b84;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .ur-pwd-hint-valid {
                    color: #16a34a;
                    font-weight: 600;
                }

                /* Primary button */
                .ur-btn {
                    width: 100%;
                    height: 50px !important;
                    border: none !important;
                    border-radius: 12px !important;
                    font-weight: 700 !important;
                    font-size: 15px !important;
                    background: linear-gradient(100deg, #ff5b91, #ed2857) !important;
                    box-shadow: 0 8px 20px rgba(237,40,87,0.22);
                    transition: opacity 0.2s, transform 0.15s !important;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .ur-btn:hover:not(:disabled) {
                    opacity: 0.90;
                    transform: translateY(-1px);
                    box-shadow: 0 10px 24px rgba(237,40,87,0.28) !important;
                }
                .ur-btn:disabled { opacity: 0.55 !important; cursor: not-allowed; }

                /* Back link */
                .ur-back {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    font-size: 12.5px;
                    color: #968894;
                    cursor: pointer;
                    margin-top: 14px;
                    transition: color 0.2s;
                }
                .ur-back:hover { color: #b80d3b; }

                /* Success state */
                .ur-success {
                    text-align: center;
                    padding: 10px 0 20px;
                }
                .ur-success-icon {
                    font-size: 64px;
                    color: #b80d3b;
                    display: block;
                    margin: 0 auto 20px;
                    animation: ur-pop 0.5s cubic-bezier(0.34,1.56,0.64,1);
                }
                @keyframes ur-pop {
                    from { transform: scale(0); opacity: 0; }
                    to   { transform: scale(1); opacity: 1; }
                }
                .ur-success-number {
                    display: inline-flex;
                    align-items: center;
                    background: #fff0f5;
                    border: 1.5px solid #ffd6e5;
                    color: #b80d3b;
                    font-size: 14px;
                    font-weight: 700;
                    padding: 6px 18px;
                    border-radius: 20px;
                    margin: 10px 0 22px;
                    letter-spacing: 0.5px;
                }

                /* Note */
                .ur-note {
                    margin-top: 18px;
                    text-align: center;
                    color: #b8a4ae;
                    font-size: 12px;
                    line-height: 1.7;
                }
                .ur-note a { color: #b80d3b; font-weight: 600; text-decoration: none; }
                .ur-note a:hover { text-decoration: underline; }

                /* Animations */
                .ur-step-enter {
                    animation: ur-slide-in 0.3s cubic-bezier(0.25,0.46,0.45,0.94) both;
                }
                @keyframes ur-slide-in {
                    from { opacity: 0; transform: translateX(20px); }
                    to   { opacity: 1; transform: translateX(0);    }
                }

                @media (max-width: 480px) {
                    .ur-body       { padding: 24px 20px; }
                    .ur-header     { padding: 26px 20px 22px; }
                    .ur-otp-box    { width: 42px; height: 50px; font-size: 20px; }
                    .ur-otp-row    { gap: 6px; }
                }
            `}</style>

            <Card className="ur-card" variant="borderless">
                {/* HEADER */}
                <div className="ur-header">
                    <div className="ur-logo">
                        {step === 3
                            ? <CheckCircleFilled style={{ color: "#ffd700" }} />
                            : <HeartFilled />
                        }
                    </div>

                    <Title level={3} className="ur-header-title">
                        {stepMeta[step]?.title}
                    </Title>
                    <p className="ur-header-sub">{stepMeta[step]?.subtitle}</p>

                    {/* Step dots (0: Phone, 1: OTP, 2: Set Password) */}
                    {step < 3 && (
                        <div className="ur-steps">
                            {[0, 1, 2].map((s) => (
                                <div
                                    key={s}
                                    className={`ur-step-dot ${
                                        step === s ? "active" : step > s ? "done" : "idle"
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* BODY */}
                <div className="ur-body">
                    {/* STEP 0: Phone number */}
                    {step === 0 && (
                        <form className="ur-step-enter" onSubmit={handleSendOTP} noValidate>
                            <label className="ur-label" htmlFor="ur-phone">
                                Mobile Number
                            </label>
                            <div className="ur-input-wrap">
                                <span className="ur-input-icon">📱</span>
                                <div className="ur-input-divider" />
                                <input
                                    id="ur-phone"
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={10}
                                    className="ur-text-input"
                                    placeholder="Enter 10-digit number"
                                    value={phone}
                                    onChange={(e) => {
                                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                                        setPhoneError("");
                                    }}
                                    autoFocus
                                />
                            </div>
                            {phoneError && (
                                <div className="ur-error">⚠ {phoneError}</div>
                            )}


                            <div style={{ marginTop: 24 }}>
                                <Button
                                    htmlType="submit"
                                    className="ur-btn"
                                    loading={loading}
                                    disabled={phone.length !== 10}
                                >
                                    {!loading && <>Send OTP <ArrowRightOutlined /></>}
                                </Button>
                            </div>

                            <div className="ur-note">
                                Already have an account?{" "}
                                <Link to="/UserLogin/">Login here</Link>
                            </div>
                        </form>
                    )}

                    {/* STEP 1: OTP verification */}
                    {step === 1 && (
                        <form className="ur-step-enter" onSubmit={handleVerifyOTP} noValidate>
                            <label className="ur-label" style={{ textAlign: "center", display: "block" }}>
                                Enter 6-digit OTP
                            </label>

                            <div className="ur-otp-row" onPaste={handleOtpPaste}>
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => (otpRefs.current[i] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        className={`ur-otp-box${digit ? " filled" : ""}`}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(e.target.value, i)}
                                        onKeyDown={(e) => handleOtpKeyDown(e, i)}
                                        aria-label={`OTP digit ${i + 1}`}
                                    />
                                ))}
                            </div>

                            {otpError && (
                                <div className="ur-error" style={{ justifyContent: "center", marginTop: 10 }}>
                                    ⚠ {otpError}
                                </div>
                            )}

                            {/* Countdown / Resend */}
                            <div className="ur-countdown">
                                {canResend ? (
                                    <button
                                        type="button"
                                        className="ur-resend-btn"
                                        onClick={handleResend}
                                        disabled={loading}
                                    >
                                        <ReloadOutlined spin={loading} />
                                        Resend OTP
                                    </button>
                                ) : (
                                    <>
                                        <span>Resend in</span>
                                        <span className="ur-countdown-time">{formatTime(countdown)}</span>
                                    </>
                                )}
                            </div>

                            <Button
                                htmlType="submit"
                                className="ur-btn"
                                loading={loading}
                                disabled={otp.join("").length < OTP_LENGTH}
                            >
                                {!loading && <>Verify OTP <CheckCircleFilled /></>}
                            </Button>

                            <div className="ur-back" onClick={handleBackToPhone}>
                                ← Change mobile number
                            </div>
                        </form>
                    )}

                    {/* STEP 2: Set Password (after OTP verified) */}
                    {step === 2 && (
                        <form className="ur-step-enter" onSubmit={handleSetPassword} noValidate>
                            <div style={{ marginBottom: 16 }}>
                                <label className="ur-label" htmlFor="ur-password">
                                    Create Password
                                </label>
                                <div className="ur-input-wrap">
                                    <LockOutlined className="ur-input-icon" />
                                    <div className="ur-input-divider" />
                                    <input
                                        id="ur-password"
                                        type={showPassword ? "text" : "password"}
                                        className="ur-text-input"
                                        placeholder="At least 8 characters"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setPasswordError("");
                                        }}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        className="ur-eye-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <label className="ur-label" htmlFor="ur-confirm-password">
                                    Confirm Password
                                </label>
                                <div className="ur-input-wrap">
                                    <LockOutlined className="ur-input-icon" />
                                    <div className="ur-input-divider" />
                                    <input
                                        id="ur-confirm-password"
                                        type={showConfirmPassword ? "text" : "password"}
                                        className="ur-text-input"
                                        placeholder="Re-enter your password"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            setPasswordError("");
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="ur-eye-btn"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex={-1}
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                    </button>
                                </div>
                            </div>

                            {/* Password requirements hint */}
                            <div className="ur-pwd-hint">
                                <span className={password.length >= 8 ? "ur-pwd-hint-valid" : ""}>
                                    {password.length >= 8 ? "✓" : "•"} Minimum 8 characters
                                </span>
                                {confirmPassword && (
                                    <span style={{ marginLeft: 8 }} className={password === confirmPassword ? "ur-pwd-hint-valid" : ""}>
                                        {password === confirmPassword ? "✓ Passwords match" : "• Passwords must match"}
                                    </span>
                                )}
                            </div>

                            {passwordError && (
                                <div className="ur-error" style={{ marginBottom: 14 }}>
                                    ⚠ {passwordError}
                                </div>
                            )}

                            <Button
                                htmlType="submit"
                                className="ur-btn"
                                loading={loading}
                                disabled={password.length < 8 || password !== confirmPassword}
                            >
                                {!loading && <>Set Password &amp; Finish <CheckCircleFilled /></>}
                            </Button>

                            <div className="ur-back" onClick={handleBackToOtp}>
                                ← Re-verify OTP
                            </div>
                        </form>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default UserRegister;
