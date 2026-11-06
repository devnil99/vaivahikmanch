import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserDataGetwt, UserRegGet } from "../../Api/CoreApi";
import {
  UserOutlined,
  EditOutlined,
  HeartOutlined,
  HeartFilled,
  HistoryOutlined,
  CrownOutlined,
  WalletOutlined,
  SafetyCertificateOutlined,
  HomeOutlined,
} from "@ant-design/icons";

const UserNav = ({ activeTab, userProfile, onTabChange }) => {
  const location = useLocation();
  const userId = localStorage.getItem("user_id");
  const [profile, setProfile] = useState(userProfile || null);

  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const [userData, regData] = await Promise.all([
          UserDataGetwt().catch(() => []),
          UserRegGet().catch(() => []),
        ]);

        const uData = Array.isArray(userData)
          ? userData.find((i) => String(i.User_id) === String(userId))
          : null;
        const rData = Array.isArray(regData)
          ? regData.find((i) => String(i.id) === String(userId))
          : null;

        setProfile({
          ...(rData || {}),
          ...(uData || {}),
          caste: uData?.caste || uData?.Caste || rData?.caste || "",
        });
      } catch (err) {
        console.error("UserNav fetch error:", err);
      }
    };

    if (userId) {
      fetchUserInfo();
    }
  }, [userProfile, userId]);

  // Determine current active tab based on prop or route pathname
  const currentTab =
    activeTab ||
    (location.pathname.includes("Recharge")
      ? "recharge"
      : location.pathname.includes("Transactions")
      ? "transactions"
      : location.pathname.includes("Wish")
      ? "wishlist"
      : location.search.includes("matches")
      ? "matches"
      : location.search.includes("edit")
      ? "edit"
      : "profile");

  const tabs = [
    {
      id: "matches",
      label: profile?.caste ? `${profile.caste} Matches` : "Caste Matches",
      icon: <HeartFilled style={{ color: "#e11d48" }} />,
      path: "/UserPanel?tab=matches",
      isInternalTab: true,
    },
    {
      id: "profile",
      label: "My Profile",
      icon: <UserOutlined />,
      path: "/UserPanel",
      isInternalTab: true,
    },
    {
      id: "edit",
      label: "Edit Details",
      icon: <EditOutlined />,
      path: "/UserPanel?tab=edit",
      isInternalTab: true,
    },
    {
      id: "wishlist",
      label: "Shortlisted",
      icon: <HeartOutlined />,
      path: "/WishList",
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: <HistoryOutlined />,
      path: "/UserTransactions",
    },
    {
      id: "recharge",
      label: "Membership & Plans",
      icon: <CrownOutlined />,
      path: "/UserRecharge",
    },
  ];

  const S3_MEDIA_BASE_URL = "https://risteybucket.s3.ap-south-1.amazonaws.com/";
  const getMediaUrl = (path, fallback = "") => {
    if (!path) return fallback;
    if (typeof path !== "string") return fallback;
    const trimmed = path.trim();
    if (!trimmed) return fallback;
    if (trimmed.startsWith("data:")) return trimmed;
    const localMatch = trimmed.match(/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\/(?:media\/)?(.*)$/i);
    if (localMatch && localMatch[1]) {
      return `${S3_MEDIA_BASE_URL}${localMatch[1].replace(/^\/+/, "")}`;
    }
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    const cleanPath = trimmed.replace(/^\/+/, "").replace(/^media\//, "");
    return `${S3_MEDIA_BASE_URL}${cleanPath}`;
  };

  const avatarUrl = getMediaUrl(
    profile?.pic,
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
  );

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto 28px", padding: "0 16px" }}>
      {/* Top Profile Summary Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)",
          borderRadius: "22px",
          padding: "clamp(12px, 3vw, 20px) clamp(12px, 3vw, 24px)",
          border: "1.5px solid rgba(225, 29, 72, 0.15)",
          boxShadow: "0 12px 32px rgba(225, 29, 72, 0.08)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "14px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              position: "relative",
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "3px solid #e11d48",
              boxShadow: "0 4px 14px rgba(225, 29, 72, 0.25)",
              flexShrink: 0,
            }}
          >
            <img
              src={avatarUrl}
              alt="Profile"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
              onError={(e) => {
                e.target.src =
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";
              }}
            />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontWeight: "800",
                  color: "#881337",
                  letterSpacing: "-0.3px",
                }}
              >
                {profile?.firstname || profile?.first_name || profile?.Full_Name || "Member"}
              </h2>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "#ffe4e6",
                  color: "#be123c",
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  border: "1px solid #fecdd3",
                }}
              >
                <SafetyCertificateOutlined /> Matrimony ID: #{userId || "---"}
              </span>
            </div>

            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13.5px", fontWeight: "500" }}>
              {profile?.caste ? `${profile.caste} • ` : ""}
              {profile?.city || profile?.district || "India"}
              {profile?.marrige_status ? ` • ${profile.marrige_status}` : ""}
            </p>
          </div>
        </div>

        {/* Quick Badges: Wallet & Active Status */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              background: "#ffffff",
              padding: "8px 18px",
              borderRadius: "16px",
              border: "1.5px solid #fecdd3",
              boxShadow: "0 2px 8px rgba(225, 29, 72, 0.05)",
              display: "none",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <WalletOutlined style={{ color: "#e11d48", fontSize: "17px" }} />
            <div>
              <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" }}>
                Wallet Balance
              </div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#881337" }}>
                ₹ {profile?.balance || 0}
              </div>
            </div>
          </div>

          <Link
            to="/UserRecharge"
            style={{
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              color: "#78350f",
              padding: "8px 18px",
              borderRadius: "16px",
              fontWeight: "700",
              fontSize: "13px",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.2)",
              transition: "transform 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <CrownOutlined /> Upgrade Plan
          </Link>
        </div>
      </div>

      {/* Navigation Pills Bar */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          padding: "10px 14px",
          border: "1.5px solid rgba(225, 29, 72, 0.12)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          alignItems: "center",
        }}
      >
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;

          const buttonContent = (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 18px",
                borderRadius: "24px",
                fontSize: "13.5px",
                fontWeight: "700",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.25s ease",
                background: isActive
                  ? "linear-gradient(135deg, #e11d48 0%, #be123c 100%)"
                  : "transparent",
                color: isActive ? "#ffffff" : "#475569",
                border: isActive ? "none" : "1px solid transparent",
                boxShadow: isActive ? "0 4px 14px rgba(225, 29, 72, 0.3)" : "none",
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#fff1f2";
                  e.currentTarget.style.color = "#be123c";
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#475569";
                }
              }}
            >
              <span style={{ fontSize: "14px" }}>{tab.icon}</span>
              {tab.label}
            </span>
          );

          if (onTabChange && tab.isInternalTab) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {buttonContent}
              </button>
            );
          }

          return (
            <Link
              key={tab.id}
              to={tab.path}
              style={{ textDecoration: "none" }}
            >
              {buttonContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default UserNav;
