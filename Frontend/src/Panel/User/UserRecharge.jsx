import React, { useState, useEffect } from "react";
import { message, Card, Row, Col, Button, Tag } from "antd";
import { UserGet, UserUpdate, UserTransactionsPost, UserTotalRevenuePost, UserDataGetwt, PlanGet } from "../../Api/CoreApi";
import { useNavigate } from "react-router-dom";
import {
  CheckOutlined,
  CrownOutlined,
  ThunderboltFilled,
  SafetyCertificateOutlined,
  PhoneOutlined,
  CustomerServiceOutlined,
  InfoCircleOutlined,
  CreditCardOutlined,
  BankOutlined,
} from "@ant-design/icons";
import UserNav from "./UserNav";
import siteConfig from "../../Config/Config";

const UserRecharge = () => {
  const navigate = useNavigate();
  const baseurl = siteConfig?.apiBaseURL || (typeof window !== "undefined" && window.location.origin ? window.location.origin + "/" : "https://vaivahikmanch.in/");
  const id = localStorage.getItem("user_id");
  const int_id = String(id);
  const user_id = int_id;
  const [user, setUser] = useState(null);
  const [referuser, setReferUser] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(null);

  const user_role = localStorage.getItem("role");
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  useEffect(() => {
    if (!user_role || user_role !== "user") {
      navigate("/");
    }
  }, [user_role, navigate]);

  // Plans strictly fetched from backend Plans model
  const [plans, setPlans] = useState([]);

  const fetchUser = async () => {
    try {
      const [allUsers, uData, backendPlans] = await Promise.all([
        UserGet().catch(() => []),
        UserDataGetwt().catch(() => []),
        PlanGet().catch(() => []),
      ]);

      if (Array.isArray(backendPlans)) {
        setPlans(backendPlans.filter((p) => p.Active !== false));
      } else {
        setPlans([]);
      }

      const currentUser = Array.isArray(allUsers)
        ? allUsers.find((u) => String(u.id) === int_id)
        : null;
      const currentUData = Array.isArray(uData)
        ? uData.find((u) => String(u.User_id) === int_id)
        : null;

      if (currentUser || currentUData) {
        setUser({ ...(currentUser || {}), ...(currentUData || {}) });
      }

      if (currentUser?.ref) {
        const refUser = Array.isArray(allUsers)
          ? allUsers.find((u) => u.refer === currentUser.ref)
          : null;
        if (refUser) setReferUser(refUser);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  const addrefercommision = async (amount) => {
    if (!referuser?.id) return;
    const referuser_id = referuser.id;
    const commision = 30;
    const updatedBalance = parseInt(referuser.balance || 0) + parseInt(commision);
    const response = await UserUpdate(referuser_id, { balance: updatedBalance });
    const refUser = Array.isArray(response)
      ? response.filter((u) => u.refer === user?.ref)
      : [];
    if (refUser.length > 0) setReferUser(refUser[0]);
    await UserTotalRevenuePost({
      user_amount: commision,
      total_amount: amount,
      date: today,
      month: month,
      user_id: referuser_id,
    });
  };

  useEffect(() => {
    fetchUser();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (paymentData, plan) => {
    try {
      const planPrice = plan.Amount || plan.price || 100;
      const planTitle = plan.Plan || plan.title || "Membership Plan";
      const effectiveUserId = user?.id || user?.User_id || int_id || localStorage.getItem("user_id");

      const payload = {
        ...paymentData,
        user_id: effectiveUserId,
        User_id: effectiveUserId,
        plan: planTitle,
        Plan: planTitle,
        plan_id: plan.id,
        Plan_id: plan.id,
        amount: planPrice,
        Amount: planPrice,
      };
      const res = await fetch(`${baseurl}verify-payment/`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(payload),
      });
      const result = await res.json();

      if (result.status === "Payment verified") {
        // Update user state ONLY after payment success
        await fetchUser();
        try {
          await addrefercommision(planPrice);
        } catch (_) {}
        message.success(`🎉 ${planTitle} activated successfully!`);
        navigate("/UserTransactions");
      } else {
        message.error(result.error || "Payment verification failed.");
      }
    } catch (err) {
      console.error("Verification Error:", err);
      message.error("Something went wrong during payment verification.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const makePayment = async (plan) => {
    const planId = plan.id || plan.Plan;
    setLoadingPlan(planId);
    try {
      const planPrice = plan.Amount || plan.price || 100;
      const planTitle = plan.Plan || plan.title || "Membership Plan";

      let res;
      try {
        res = await fetch(`${baseurl}create-order/`, {
          method: "POST",
          body: new URLSearchParams({ amount: planPrice }),
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
      } catch (netErr) {
        setLoadingPlan(null);
        console.error("Order creation network error:", netErr);
        return message.error("Cannot connect to payment server. Please verify your connection.");
      }

      if (!res.ok) {
        setLoadingPlan(null);
        return message.error("Server error creating payment order. Status: " + res.status);
      }

      const order = await res.json();

      if (!order.id) {
        setLoadingPlan(null);
        return message.error("Error creating payment order!");
      }

      const options = {
        key: order.key || "rzp_test_TmLM4pKiwrBfmy",
        amount: order.amount,
        currency: order.currency || "INR",
        order_id: order.id,
        name: "Vaivaheek Manch Matrimonial",
        description: `${planTitle} Membership Plan (Test Mode)`,
        modal: {
          ondismiss: () => {
            setLoadingPlan(null);
            message.info("Payment window closed. You can also use '⚡ Instant Test / Dummy Pay'.");
          },
        },
        handler: (response) => handleVerify(response, plan),
        prefill: {
          name: user?.firstname || user?.Full_Name || user?.username || "Matrimony Member",
          email: user?.email || user?.Email || "user@matrimony.com",
          contact: user?.contact || user?.WP_Contact || "9876543210",
        },
        theme: { color: "#e11d48" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setLoadingPlan(null);
        message.warning("Payment cancelled. You can use '⚡ Instant Test / Dummy Pay' to simulate activation.");
      });
      rzp.open();
    } catch (err) {
      console.error("Payment Error:", err);
      message.error("Unable to initiate online payment.");
      setLoadingPlan(null);
    }
  };

  const handleDummyTestPayment = async (plan) => {
    const dummyKey = `dummy_${plan.id || plan.Plan}`;
    setLoadingPlan(dummyKey);
    try {
      const planPrice = plan.Amount || plan.price || 100;
      const planTitle = plan.Plan || plan.title || "Membership Plan";
      const dummyOrderId = `order_dummy_${Date.now()}`;
      const dummyPaymentId = `pay_test_dummy_${Date.now()}`;
      const dummySignature = "dummy_test_success";

      const effectiveUserId = user?.id || user?.User_id || user_id || localStorage.getItem("user_id");

      const vPayload = {
        razorpay_order_id: dummyOrderId,
        razorpay_payment_id: dummyPaymentId,
        razorpay_signature: dummySignature,
        user_id: effectiveUserId,
        User_id: effectiveUserId,
        plan: planTitle,
        Plan: planTitle,
        plan_id: plan.id,
        Plan_id: plan.id,
        amount: planPrice,
        Amount: planPrice,
      };

      const res = await fetch(`${baseurl}verify-payment/`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(vPayload),
      });

      const data = await res.json();
      if (data.status === "Payment verified") {
        // Update user state ONLY after payment success
        await fetchUser();
        try {
          await addrefercommision(planPrice);
        } catch (_) {}
        message.success(`🎉 Test Payment Successful! ${planTitle} activated.`);
        navigate("/UserTransactions");
      } else {
        message.error("Payment verification failed: " + (data.error || "Unknown"));
      }
    } catch (err) {
      console.error("Dummy Verification Error:", err);
      message.error("Something went wrong during dummy payment.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff8f9",
        paddingTop: "40px",
        paddingBottom: "80px",
      }}
    >
      <UserNav activeTab="recharge" userProfile={user} />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px" }}>
        {/* Header Title */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <Tag
            style={{
              background: "#ffe4e6",
              color: "#be123c",
              border: "1px solid #fecdd3",
              borderRadius: "20px",
              padding: "4px 14px",
              fontWeight: "700",
              fontSize: "12px",
              marginBottom: "12px",
            }}
          >
            <CrownOutlined /> Premium Matrimonial Plans
          </Tag>
          <h1
            style={{
              fontSize: "clamp(24px, 5vw, 34px)",
              fontWeight: "900",
              color: "#881337",
              margin: "0 0 10px",
              letterSpacing: "-0.5px",
            }}
          >
            Upgrade Your Membership & Connect Faster
          </h1>
          <p
            style={{
              color: "#64748b",
              fontSize: "15px",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Unlock direct phone numbers, WhatsApp chats, and horoscopes of verified brides & grooms.
          </p>
        </div>

        {/* Test Mode / Dummy Payment Guide Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
            border: "1.5px solid #bfdbfe",
            borderRadius: "16px",
            padding: "16px 20px",
            marginBottom: "32px",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                background: "#2563eb",
                color: "#ffffff",
                borderRadius: "20px",
                padding: "3px 12px",
                fontSize: "12px",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <InfoCircleOutlined /> Razorpay Test Mode
            </span>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
              How to complete a Dummy / Test Payment:
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "12px",
              fontSize: "13px",
              color: "#334155",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ fontWeight: "700", color: "#d97706", marginBottom: "4px" }}>
                ⚡ Method 1: Instant 1-Click Test (Recommended)
              </div>
              <div style={{ lineHeight: "1.5" }}>
                Click the amber <b>"⚡ Instant Dummy / Test Pay"</b> button on any plan below. It bypasses payment gateways and activates membership immediately!
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ fontWeight: "700", color: "#2563eb", marginBottom: "4px" }}>
                💳 Method 2: Inside Razorpay Popup Window
              </div>
              <div style={{ lineHeight: "1.5" }}>
                If you clicked <b>"Get Plan (Razorpay)"</b> and the payment modal is open:
                <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
                  <li>
                    <b>Netbanking:</b> Select <i>Netbanking</i> ➔ Pick any bank (SBI/HDFC) ➔ Click <i>Pay</i> ➔ Click the green <b>[Success]</b> button!
                  </li>
                  <li>
                    <b>Card:</b> Number <code>4111 1111 1111 1111</code>, Expiry <code>12/28</code>, CVV <code>123</code> ➔ OTP <code>1234</code>.
                  </li>
                  <li>
                    <b>UPI:</b> Type UPI ID <code>success@razorpay</code>. <i>(Do not scan QR code with real phone apps like PhonePe/GPay)</i>.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards (Loaded Dynamically From Backend Plans Model) */}
        <Row gutter={[24, 28]} justify="center">
          {plans.map((plan, idx) => {
            const planTitle = plan.Plan || plan.title || "Membership Plan";
            const planPrice = plan.Amount || plan.price || 100;
            const planValidity = plan.Validity || "30 Days";
            const planMsg = plan.Msg || "Verified Matrimonial Contact Access";
            const isPopular = idx === 1 || String(planTitle).toLowerCase().includes("gold");
            const accentColor = isPopular ? "#d97706" : idx === 2 ? "#2563eb" : "#64748b";
            const gradient = isPopular
              ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
              : idx === 2
              ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
              : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)";

            const validityText =
              typeof planValidity === "number" || (!isNaN(Number(planValidity)) && planValidity !== null && planValidity !== "")
                ? `${planValidity} Days`
                : String(planValidity || "30 Days");

            const features = [
              "Unlimited matrimonial profile browsing",
              `Direct contact unlock for verified candidates`,
              `Plan details: ${planMsg}`,
              `Validity: ${validityText}`,
              "WhatsApp & Phone calling access",
              "100% verified & authentic profiles",
            ];

            return (
              <Col xs={24} md={8} key={plan.id || idx}>
                <Card
                  variant="borderless"
                  style={{
                    borderRadius: "24px",
                    overflow: "hidden",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    boxShadow: isPopular
                      ? "0 16px 40px rgba(225, 29, 72, 0.16)"
                      : "0 8px 24px rgba(0, 0, 0, 0.05)",
                    border: isPopular
                      ? "2.5px solid #e11d48"
                      : "1.5px solid rgba(225, 29, 72, 0.12)",
                    background: gradient,
                    transform: isPopular ? "scale(1.03)" : "none",
                    transition: "all 0.3s ease",
                  }}
                  styles={{
                    body: {
                      padding: "32px 24px",
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                    },
                  }}
                >
                  {/* Popular Ribbon */}
                  {isPopular && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        background: "linear-gradient(135deg, #e11d48, #be123c)",
                        color: "#ffffff",
                        padding: "6px 20px",
                        borderBottomLeftRadius: "16px",
                        fontWeight: "800",
                        fontSize: "11.5px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        boxShadow: "0 4px 10px rgba(225, 29, 72, 0.3)",
                      }}
                    >
                      ⭐ Most Popular
                    </div>
                  )}

                  {/* Plan Header */}
                  <div style={{ marginBottom: "20px" }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: accentColor,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        marginBottom: "6px",
                      }}
                    >
                      {planTitle}
                    </div>

                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                      <span style={{ fontSize: "42px", fontWeight: "900", color: "#0f172a" }}>
                        ₹{planPrice}
                      </span>
                      <span style={{ color: "#64748b", fontSize: "14px", fontWeight: "600" }}>
                        / {validityText}
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop: "10px",
                        display: "inline-block",
                        background: "rgba(255, 255, 255, 0.8)",
                        padding: "4px 12px",
                        borderRadius: "14px",
                        fontSize: "12.5px",
                        fontWeight: "700",
                        color: "#881337",
                        border: "1px solid rgba(225, 29, 72, 0.15)",
                      }}
                    >
                      🎯 {planMsg}
                    </div>
                  </div>

                  {/* Features List */}
                  <div style={{ flex: 1, margin: "16px 0 28px" }}>
                    {features.map((feature, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          marginBottom: "12px",
                          fontSize: "13.5px",
                          color: "#334155",
                        }}
                      >
                        <span
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background: "#ecfdf5",
                            color: "#059669",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                        >
                          <CheckOutlined />
                        </span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Buy Button */}
                  <Button
                    type="primary"
                    size="large"
                    block
                    loading={loadingPlan === (plan.id || plan.Plan)}
                    onClick={() => makePayment(plan)}
                    style={{
                      height: "48px",
                      borderRadius: "24px",
                      fontWeight: "800",
                      fontSize: "15px",
                      background: isPopular
                        ? "linear-gradient(135deg, #e11d48, #be123c)"
                        : "#0f172a",
                      borderColor: isPopular ? "#e11d48" : "#0f172a",
                      boxShadow: isPopular
                        ? "0 6px 20px rgba(225, 29, 72, 0.35)"
                        : "none",
                    }}
                  >
                    Get {planTitle} (Razorpay)
                  </Button>

                  <Button
                    size="middle"
                    block
                    loading={loadingPlan === `dummy_${plan.id || plan.Plan}`}
                    onClick={() => handleDummyTestPayment(plan)}
                    style={{
                      marginTop: "10px",
                      height: "42px",
                      borderRadius: "21px",
                      fontWeight: "700",
                      fontSize: "13px",
                      border: "1.5px dashed #f59e0b",
                      background: "#fffbeb",
                      color: "#b45309",
                    }}
                  >
                    ⚡ Instant Dummy / Test Pay
                  </Button>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Trust Badges */}
        <div
          style={{
            marginTop: "50px",
            background: "#ffffff",
            borderRadius: "20px",
            padding: "24px 30px",
            border: "1.5px solid rgba(225, 29, 72, 0.1)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
            <SafetyCertificateOutlined style={{ fontSize: "28px", color: "#059669" }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>
                100% Secure Payment
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                256-Bit SSL Encrypted Razorpay
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
            <ThunderboltFilled style={{ fontSize: "28px", color: "#e11d48" }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>
                Instant Activation
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Contacts unlocked immediately
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
            <CustomerServiceOutlined style={{ fontSize: "28px", color: "#d97706" }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>
                Dedicated Support
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Assistance with every step
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRecharge;
