import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Input,
  Select,
  Modal,
  Spin,
  Empty,
  Popconfirm,
  message,
  Image,
} from "antd";
import {
  HeartFilled,
  HeartOutlined,
  DeleteOutlined,
  EyeOutlined,
  WhatsAppOutlined,
  PhoneOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  ReadOutlined,
  BankOutlined,
  LockOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import {
  WishListGet,
  WishListRemove,
  WishListRequest,
  WishListDirectRequest,
  UserDataGetwt,
  UserRegGet,
} from "../../Api/CoreApi";
import UserNav from "./UserNav";

const { Option } = Select;

const Wish_List = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");
  const baseurl = (typeof window !== "undefined" && window.location.origin ? window.location.origin + "/" : "https://vaivahikmanch.in/");
const S3_MEDIA_BASE_URL = "https://risteybucket.s3.ap-south-1.amazonaws.com/";

// Universal S3 Media Resolver
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

  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [maritalStatusFilter, setMaritalStatusFilter] = useState("all");
  const [onlySameCaste, setOnlySameCaste] = useState(false);

  // Biodata Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isBiodataOpen, setIsBiodataOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/UserLogin/");
      return;
    }
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const [rawWishlist, allUsers, regUsers] = await Promise.all([
        WishListGet(userId ? { user_id: userId } : {}).catch(() => []),
        UserDataGetwt().catch(() => []),
        UserRegGet().catch(() => []),
      ]);

      // Filter wishlist items for current user
      const userWish = Array.isArray(rawWishlist)
        ? rawWishlist.filter(
            (w) =>
              (String(w.User_id || w.user_id) === String(userId) ||
                !w.User_id) &&
              w.is_shortlisted !== false &&
              w.Status !== "Rejected"
          )
        : [];

      // Map candidates with profile data & filter out deactivated profiles
      const enriched = userWish
        .map((item) => {
          const targetId = String(item.Wish_User_id || item.wish_user_id);
          const candidateData = Array.isArray(allUsers)
            ? allUsers.find((u) => String(u.User_id) === targetId)
            : null;
          const candidateReg = Array.isArray(regUsers)
            ? regUsers.find((r) => String(r.id) === targetId)
            : null;

          return {
            wishlistId: item.id,
            targetUserId: targetId,
            Status: item.Status,
            ...(candidateReg || {}),
            ...(candidateData || {}),
          };
        })
        .filter((c) => {
          if (!c) return false;
          // 1. Exclude inactive / disabled profiles
          if (c.Active === false || c.active === false || c.is_active === false) return false;
          if (c.user_account && c.user_account.is_active === false) return false;
          const candidateAccountStatus = String(c.account_status || c.user_account?.status || "").trim().toLowerCase();
          if (["deactive", "inactive", "deactivated", "disabled"].includes(candidateAccountStatus)) return false;

          // 2. Exclude admin approval pending profiles
          if (c.is_approved === false || c.Admin_Approval === false) return false;

          // 3. Strictly exclude Null or expired Valid_Upto
          if (!c.Valid_Upto) return false;
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, "0");
          const day = String(today.getDate()).padStart(2, "0");
          const todayStr = `${year}-${month}-${day}`;
          const vu = String(c.Valid_Upto).trim().split("T")[0];
          if (!vu || vu < todayStr) return false;

          return true;
        });

      setWishlistItems(enriched);

      // Current user profile
      const foundU = Array.isArray(allUsers)
        ? allUsers.find((u) => String(u.User_id) === String(userId))
        : null;
      const foundR = Array.isArray(regUsers)
        ? regUsers.find((r) => String(r.id) === String(userId))
        : null;
      setUserProfile({ ...(foundR || {}), ...(foundU || {}) });
    } catch (err) {
      console.error("Error loading wishlist:", err);
      message.error("Unable to load wishlist profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (wishlistId) => {
    try {
      const item = wishlistItems.find((i) => i.wishlistId === wishlistId);
      await WishListRemove(wishlistId);
      if (item?.Status === "Approved") {
        message.success(
          "Removed from shortlisted profiles. Approved connection preserved in Approved section."
        );
      } else {
        message.success("Removed from shortlisted profiles");
      }
      setWishlistItems((prev) => prev.filter((i) => i.wishlistId !== wishlistId));
    } catch (err) {
      message.error("Failed to remove profile");
    }
  };

  const isUserSubscribed = () => {
    if (localStorage.getItem("is_staff") === "true" || localStorage.getItem("is_superuser") === "true") {
      return true;
    }
    if (!userProfile) return false;
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const vu = userProfile.Valid_Upto || userProfile.valid_upto;
    if (vu) {
      const vuStr = String(vu).trim().split("T")[0];
      if (vuStr && vuStr >= todayIso) return true;
    }
    return false;
  };

  const handleSendRequest = async (cand) => {
    if (!isUserSubscribed()) {
      message.warning("🔒 Subscription Plan Required: An active membership subscription is required to send connection requests.");
      navigate("/UserRecharge");
      return;
    }
    const candName = cand.firstname || cand.Full_Name || cand.first_name || "candidate";
    try {
      let res;
      if (cand.wishlistId) {
        try {
          res = await WishListRequest(cand.wishlistId);
        } catch (subErr) {
          res = await WishListDirectRequest({ Wish_User_id: cand.targetUserId || cand.User_id || cand.id });
        }
      } else {
        res = await WishListDirectRequest({ Wish_User_id: cand.targetUserId || cand.User_id || cand.id });
      }
      if (res && res.id) {
        message.success(`🎉 Connection request sent to ${candName}!`);
        setWishlistItems((prev) =>
          prev.map((i) =>
            (cand.wishlistId && i.wishlistId === cand.wishlistId) ||
            (cand.targetUserId && i.targetUserId === cand.targetUserId)
              ? { ...i, Status: "Pending" }
              : i
          )
        );
      }
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.detail || "Unable to send connection request. Please try again.");
    }
  };

  // Filtered List
  const filteredList = wishlistItems.filter((candidate) => {
    const q = searchQuery.toLowerCase().trim();
    const fullName = String(candidate.firstname || candidate.Full_Name || "").toLowerCase();
    const caste = String(candidate.caste || candidate.Caste || "").toLowerCase();
    const city = String(candidate.city || candidate.district || "").toLowerCase();

    const matchesSearch = !q || fullName.includes(q) || caste.includes(q) || city.includes(q);

    const matchesMarital =
      maritalStatusFilter === "all" ||
      String(candidate.marrige_status || "").toLowerCase() === maritalStatusFilter.toLowerCase();

    const userCaste = (userProfile?.caste || "").toLowerCase().trim();
    if (onlySameCaste && userCaste && caste !== userCaste) {
      return false;
    }

    return matchesSearch && matchesMarital;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff8f9",
        paddingTop: "40px",
        paddingBottom: "80px",
      }}
    >
      <UserNav activeTab="wishlist" userProfile={userProfile} />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px" }}>
        {/* Header Section */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "22px",
            padding: "20px 24px",
            boxShadow: "0 8px 24px rgba(225, 29, 72, 0.05)",
            border: "1.5px solid rgba(225, 29, 72, 0.12)",
            marginBottom: "28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: "800",
                color: "#881337",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <HeartFilled style={{ color: "#e11d48" }} /> Shortlisted Matches ({wishlistItems.length})
            </h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13.5px" }}>
              Profiles you have saved for further consideration and family discussion.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <Input
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Search by name, caste, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "220px", borderRadius: "18px" }}
              allowClear
            />

            {userProfile?.caste && (
              <Button
                type={onlySameCaste ? "primary" : "default"}
                onClick={() => setOnlySameCaste(!onlySameCaste)}
                style={{
                  borderRadius: "18px",
                  background: onlySameCaste ? "linear-gradient(135deg, #e11d48, #be123c)" : "#ffffff",
                  borderColor: "#fecdd3",
                  color: onlySameCaste ? "#ffffff" : "#be123c",
                  fontWeight: "700",
                }}
              >
                {onlySameCaste ? `✓ ${userProfile.caste} Only` : `Same Caste: ${userProfile.caste}`}
              </Button>
            )}

            <Select
              value={maritalStatusFilter}
              onChange={setMaritalStatusFilter}
              style={{ width: "140px" }}
              dropdownStyle={{ borderRadius: "12px" }}
            >
              <Option value="all">All Status</Option>
              <Option value="unmarried">Never Married</Option>
              <Option value="divorced">Divorced</Option>
            </Select>

            <Link
              to="/"
              style={{
                background: "linear-gradient(135deg, #e11d48, #be123c)",
                color: "#ffffff",
                padding: "8px 18px",
                borderRadius: "20px",
                fontWeight: "700",
                fontSize: "13px",
                textDecoration: "none",
                boxShadow: "0 4px 12px rgba(225, 29, 72, 0.25)",
              }}
            >
              + Find More
            </Link>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Spin size="large" tip="Loading shortlisted profiles..." />
          </div>
        ) : filteredList.length === 0 ? (
          <Card
            variant="borderless"
            style={{
              borderRadius: "24px",
              textAlign: "center",
              padding: "50px 20px",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.04)",
              border: "1px solid rgba(225, 29, 72, 0.1)",
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <h3 style={{ color: "#881337", fontWeight: "700", marginBottom: "8px" }}>
                    No Shortlisted Profiles Found
                  </h3>
                  <p style={{ color: "#64748b", fontSize: "14px", maxWidth: "450px", margin: "0 auto 20px" }}>
                    Discover compatible brides & grooms with our smart matrimonial search and save the ones you like.
                  </p>
                  <Link
                    to="/"
                    style={{
                      background: "linear-gradient(135deg, #e11d48, #be123c)",
                      color: "#ffffff",
                      padding: "10px 26px",
                      borderRadius: "24px",
                      fontWeight: "700",
                      fontSize: "14px",
                      textDecoration: "none",
                      display: "inline-block",
                      boxShadow: "0 4px 14px rgba(225, 29, 72, 0.25)",
                    }}
                  >
                    Browse Eligible Matches
                  </Link>
                </div>
              }
            />
          </Card>
        ) : (
          <Row gutter={[20, 24]}>
            {filteredList.map((cand) => {
              const photo = getMediaUrl(
                cand.pic,
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80"
              );

              return (
                <Col xs={24} sm={12} lg={8} key={cand.wishlistId || cand.targetUserId}>
                  <Card
                    variant="borderless"
                    hoverable
                    style={{
                      borderRadius: "22px",
                      overflow: "hidden",
                      border: "1.5px solid rgba(225, 29, 72, 0.12)",
                      boxShadow: "0 10px 26px rgba(0, 0, 0, 0.04)",
                      transition: "all 0.3s ease",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    bodyStyle={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column" }}
                  >
                    {/* Candidate Photo Header */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "230px",
                        borderRadius: "16px",
                        overflow: "hidden",
                        marginBottom: "14px",
                      }}
                    >
                      <img
                        src={photo}
                        alt={cand.firstname || "Candidate"}
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80";
                        }}
                      />

                      {/* Remove Button Badge */}
                      <Popconfirm
                        title="Remove Profile"
                        description="Remove this candidate from your shortlist?"
                        onConfirm={() => handleRemove(cand.wishlistId)}
                        okText="Remove"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <button
                          type="button"
                          style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            background: "rgba(255, 255, 255, 0.9)",
                            border: "none",
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
                            color: "#e11d48",
                            fontSize: "15px",
                            transition: "all 0.2s ease",
                          }}
                          title="Remove from wishlist"
                        >
                          <DeleteOutlined />
                        </button>
                      </Popconfirm>

                      {/* Same Caste Match Badge */}
                      {cand.caste && userProfile?.caste && cand.caste.toLowerCase().trim() === userProfile.caste.toLowerCase().trim() && (
                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            left: "12px",
                            background: "linear-gradient(135deg, #059669, #047857)",
                            color: "#ffffff",
                            padding: "3px 10px",
                            borderRadius: "14px",
                            fontSize: "11px",
                            fontWeight: "800",
                            boxShadow: "0 4px 10px rgba(5, 150, 105, 0.3)",
                          }}
                        >
                          ✓ {cand.caste} Match
                        </div>
                      )}

                      {/* Marital Status Tag */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: "10px",
                          left: "10px",
                        }}
                      >
                        <Tag
                          style={{
                            background: "rgba(0, 0, 0, 0.65)",
                            color: "#ffffff",
                            backdropFilter: "blur(6px)",
                            border: "none",
                            borderRadius: "12px",
                            padding: "3px 10px",
                            fontWeight: "600",
                            fontSize: "12px",
                          }}
                        >
                          {cand.marrige_status || "Unmarried"}
                        </Tag>
                      </div>
                    </div>

                    {/* Candidate Details */}
                    <div style={{ flex: 1 }}>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "18px",
                            fontWeight: "800",
                            color: "#881337",
                          }}
                        >
                          {cand.firstname || "Candidate"}
                        </h3>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: "#64748b" }}>
                          {cand.age ? `${cand.age} yrs` : ""}
                          {cand.height ? ` • ${cand.height} cm` : ""}
                        </span>
                      </div>

                      <div
                        style={{
                          margin: "6px 0 12px",
                          fontSize: "13px",
                          color: "#be123c",
                          fontWeight: "700",
                        }}
                      >
                        {cand.caste ? `${cand.caste}` : ""}
                        {cand.gotra || cand.Gotra ? ` (Gotra: ${cand.gotra || cand.Gotra})` : ""}
                        {cand.religion ? ` • ${cand.religion}` : ""}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#475569" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                          <EnvironmentOutlined style={{ color: "#e11d48", marginTop: "3px" }} />
                          <div>
                            <span style={{ fontWeight: 600 }}>Address: </span>
                            {cand.can_view_sensitive_details ? (
                              <span>{cand.full_address || cand.Full_Address || `${cand.city ? `${cand.city}, ` : ""}${cand.state || "India"}`}</span>
                            ) : (
                              <span>{cand.city ? `${cand.city}, ` : ""}{cand.state || "India"} • <span style={{ color: "#e11d48", fontWeight: 700 }}>🔒 Approval & Plan Required</span></span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <WhatsAppOutlined style={{ color: "#25d366" }} />
                          <div>
                            <span style={{ fontWeight: 600 }}>Contact / WP: </span>
                            {cand.can_view_sensitive_details && (cand.contact || cand.WP_Contact) ? (
                              <span style={{ color: "#0f766e", fontWeight: 700 }}>+91 {cand.contact || cand.WP_Contact}</span>
                            ) : (
                              <span style={{ color: "#e11d48", fontWeight: 700 }}>🔒 Approval & Plan Required</span>
                            )}
                          </div>
                        </div>

                        {cand.job_title && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <BankOutlined style={{ color: "#e11d48" }} />
                            <span>
                              {cand.job_title}
                              {cand.job_type ? ` (${cand.job_type})` : ""}
                            </span>
                          </div>
                        )}

                        {cand.course && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <ReadOutlined style={{ color: "#e11d48" }} />
                            <span>{cand.course}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginTop: "16px",
                        paddingTop: "14px",
                        borderTop: "1px solid #f1f5f9",
                      }}
                    >
                      <Button
                        type="default"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setSelectedCandidate(cand);
                          setIsBiodataOpen(true);
                        }}
                        style={{
                          borderRadius: "16px",
                          borderColor: "#fecdd3",
                          color: "#be123c",
                          fontWeight: "600",
                          background: "#fff1f2",
                          flex: "1 1 auto",
                        }}
                      >
                        Biodata
                      </Button>

                      {cand.Status === "Approved" && cand.can_view_sensitive_details && (cand.contact || cand.WP_Contact) ? (
                        <>
                          <a
                            href={`https://wa.me/91${cand.contact || cand.WP_Contact}?text=${encodeURIComponent(
                              `Hello! I saw your profile on Vaivaheek Manch Matrimonial.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              background: "#25d366",
                              color: "#ffffff",
                              borderRadius: "16px",
                              fontWeight: "700",
                              fontSize: "13px",
                              textDecoration: "none",
                              padding: "0 14px",
                              height: "32px",
                              flex: "1 1 auto",
                              boxShadow: "0 3px 8px rgba(37, 211, 102, 0.3)",
                            }}
                          >
                            <WhatsAppOutlined /> WhatsApp
                          </a>
                          <a
                            href={`tel:${cand.contact || cand.WP_Contact}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              background: "#0284c7",
                              color: "#ffffff",
                              borderRadius: "16px",
                              fontWeight: "700",
                              fontSize: "13px",
                              textDecoration: "none",
                              padding: "0 14px",
                              height: "32px",
                              flex: "1 1 auto",
                              boxShadow: "0 3px 8px rgba(2, 132, 199, 0.3)",
                            }}
                          >
                            <PhoneOutlined /> Call
                          </a>
                        </>
                      ) : cand.Status === "Approved" && !isUserSubscribed() ? (
                        <Link
                          to="/UserRecharge"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            background: "linear-gradient(135deg, #d97706, #b45309)",
                            color: "#ffffff",
                            borderRadius: "16px",
                            fontWeight: "700",
                            fontSize: "12px",
                            textDecoration: "none",
                            textAlign: "center",
                            padding: "0 14px",
                            height: "32px",
                            flex: "2 1 auto",
                          }}
                        >
                          👑 Subscription Required to View Contact
                        </Link>
                      ) : cand.Status === "Pending" ? (
                        <Button
                          disabled
                          style={{
                            borderRadius: "16px",
                            height: "32px",
                            background: "#ecfdf5",
                            color: "#059669",
                            borderColor: "#a7f3d0",
                            fontWeight: "700",
                            fontSize: "12px",
                            flex: "2 1 auto",
                          }}
                        >
                          ⏳ Request Sent (Pending)
                        </Button>
                      ) : isUserSubscribed() ? (
                        <Button
                          type="primary"
                          icon={<HeartOutlined />}
                          onClick={() => handleSendRequest(cand)}
                          style={{
                            borderRadius: "16px",
                            height: "32px",
                            background: "linear-gradient(135deg, #e11d48, #be123c)",
                            fontWeight: "700",
                            fontSize: "12px",
                            flex: "2 1 auto",
                          }}
                        >
                          💌 Send Request
                        </Button>
                      ) : (
                        <Button
                          type="default"
                          icon={<LockOutlined style={{ color: "#be123c" }} />}
                          onClick={() => {
                            message.warning("🔒 Subscription Plan Required: Please activate a membership subscription to send connection requests.");
                            navigate("/UserRecharge");
                          }}
                          style={{
                            borderRadius: "16px",
                            height: "32px",
                            borderColor: "#fecdd3",
                            color: "#be123c",
                            fontWeight: "700",
                            fontSize: "12px",
                            flex: "2 1 auto",
                          }}
                        >
                          🔒 Send Request (Plan Required)
                        </Button>
                      )}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>

      {/* Full Biodata Modal (Complete Profile Details) */}
      {/* Full Matrimonial Biodata & Profile Preview View Modal */}
      <Modal
        title={null}
        open={isBiodataOpen}
        onCancel={() => {
          setIsBiodataOpen(false);
          setSelectedCandidate(null);
        }}
        footer={null}
        width={780}
        centered
        style={{ maxWidth: "95vw" }}
        styles={{ body: { padding: "24px", maxHeight: "88vh", overflowY: "auto" } }}
      >
        {selectedCandidate && (() => {
          const c = selectedCandidate;
          const candId = c.User_id || c.id;
          const candName = c.firstname || c.Full_Name || c.first_name || "Candidate";
          const candGender = c.gender || c.Gender || "Candidate";
          const isFemale = candGender === "Female";
          const candCaste = c.caste || c.Caste || "Community";
          const candGotra = c.gotra || c.Gotra || "";
          const candReligion = c.religion || c.Religion || "Hindu";
          const candAge = c.age || c.Age;
          const candDob = c.dob || c.DOB ? String(c.dob || c.DOB).slice(0, 10) : "";
          const candHeight = c.height || c.Height;
          const candWeight = c.weight || c.Weight;
          const candColor = c.color || c.Color || c.complexion || c.Complexion || "";
          const candMarital = c.marrige_status || c.Marrige_status || "Never Married";
          const candMotherTongue = c.mother_tongue || c.Mother_tongue || "Hindi";
          const candDisability = c.disability !== undefined ? (c.disability ? "Yes (Physically Challenged)" : "None") : (c.Disability ? "Yes" : "None");
          const candManglik = c.manglik !== undefined ? (c.manglik ? "Yes (Manglik)" : "No (Non-Manglik)") : (c.Manglik ? "Yes" : "No (Non-Manglik)");
          const candDiet = c.vegeterian || c.Vegeterian || "Vegeterian";
          const candQual = c.qualification || c.Qualification || c.course || "";
          const candProf = c.profession || c.Profession || c.job_title || "";
          const candJobType = c.job_type || c.Job_type || "Private";
          const candSalary = c.salary || c.Salary;
          const candFatherName = c.father_name || c.Father_name || "";
          const candFatherAge = c.father_age || c.Father_Age || "";
          const candFatherProf = c.father_profession || c.Father_Profession || "";
          const candMotherName = c.mother_name || c.Mother_name || "";
          const candMotherAge = c.mother_age || c.Mother_Age || "";
          const candMotherProf = c.mother_profession || c.Mother_Profession || "";
          const candBrothers = c.brothers || c.Brothers || c.brother || "0";
          const candBrothersMarried = c.brothers_marrige || c.Brothers_marrige || "0";
          const candSisters = c.sisters || c.Sisters || c.sister || "0";
          const candSistersMarried = c.sisters_marrige || c.Sisters_marrige || "0";
          const candHouse = c.house || c.House || "Self Owned";
          const candCity = c.city || c.City || "";
          const candDistrict = c.district || c.District || "";
          const candState = c.state || c.State || "";
          const candCountry = c.country || c.Country || "India";
          const candAddress = c.full_address || c.Full_Address || "";
          const candContact = c.contact || c.WP_Contact || c.Contact || "";
          const candContactRelation = c.wp_contact_relation || c.WP_Contact_Relation || "";
          const candContactName = c.wp_contact_name || c.Wp_Contact_Name || "";
          const candAltContact = c.alt_contact || c.Alt_Contact || "";
          const candAltContactRelation = c.alt_contact_relation || c.Alt_Contact_Relation || "";
          const candAltContactName = c.alt_contact_name || c.Alt_Contact_Name || "";
          const candEmail = c.email || c.Email || "";
          const isPremium = isUserSubscribed();
          const hasAccess = Boolean(isPremium && c.Status === "Approved");
          const candPic = getMediaUrl(
            c.pic || c.Profile_Pic,
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
          );

          const rawAccept = c.accept_profiles || c.Accept_Profiles;
          let candAcceptProfiles = [];
          if (Array.isArray(rawAccept)) {
            candAcceptProfiles = rawAccept;
          } else if (typeof rawAccept === "string" && rawAccept.trim()) {
            try {
              const parsed = JSON.parse(rawAccept);
              candAcceptProfiles = Array.isArray(parsed) ? parsed : [rawAccept];
            } catch (e) {
              candAcceptProfiles = [rawAccept];
            }
          }

          const rawNearDist = c.nearestdist || c.Nearestdist;
          let candNearDist = [];
          if (Array.isArray(rawNearDist)) {
            candNearDist = rawNearDist;
          } else if (typeof rawNearDist === "string" && rawNearDist.trim()) {
            try {
              const parsed = JSON.parse(rawNearDist);
              candNearDist = Array.isArray(parsed) ? parsed : [rawNearDist];
            } catch (e) {
              candNearDist = [rawNearDist];
            }
          }

          const candRefer = c.refer || c.Refer || "";
          const candCreateDate = c.create_date || c.Create_date || "";

          return (
            <div>
              {/* Header Profile Identity */}
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  alignItems: "center",
                  marginBottom: "22px",
                  paddingBottom: "18px",
                  borderBottom: "1.5px solid #ffe4e6",
                  flexWrap: "wrap",
                }}
              >
                {/* Profile Image with Big View Lightbox Feature */}
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div
                    style={{
                      width: "92px",
                      height: "92px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "3.5px solid #e11d48",
                      boxShadow: "0 6px 18px rgba(225, 29, 72, 0.22)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      margin: "0 auto",
                    }}
                  >
                    <Image
                      src={candPic}
                      alt={candName}
                      width={92}
                      height={92}
                      style={{ width: "92px", height: "92px", objectFit: "cover", objectPosition: "center top", borderRadius: "50%", cursor: "pointer" }}
                      preview={{
                        mask: (
                          <div style={{ fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", gap: 3, color: "#ffffff" }}>
                            <EyeOutlined /> Preview
                          </div>
                        ),
                      }}
                      fallback="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                    />
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: "220px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "900", color: "#881337" }}>
                      {candName}
                    </h2>
                    <Tag color="magenta" style={{ borderRadius: "14px", fontWeight: "800" }}>
                      {candGender}
                    </Tag>
                    <span
                      style={{
                        background: "#ffe4e6",
                        color: "#be123c",
                        fontSize: "12px",
                        fontWeight: "800",
                        padding: "2px 10px",
                        borderRadius: "12px",
                      }}
                    >
                      ID: #{candId}
                    </span>
                  </div>

                  <div style={{ color: "#be123c", fontWeight: "700", fontSize: "14px", marginTop: "4px" }}>
                    {candCaste} {candGotra ? `• Gotra: ${candGotra}` : ""} • {candReligion}
                  </div>

                  <div style={{ color: "#64748b", fontSize: "13px", marginTop: "2px" }}>
                    {[candCity, candDistrict, candState, candCountry].filter(Boolean).join(", ")}
                  </div>
                </div>

                {/* Top Action Strip */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {hasAccess && candContact ? (
                    <>
                      <a
                        href={`https://wa.me/91${candContact}?text=${encodeURIComponent(
                          `Hello ${candName}! I came across your matrimonial biodata on Vaivaheek Manch under our ${candCaste} community.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#25d366",
                          color: "#ffffff",
                          borderRadius: "14px",
                          fontWeight: "700",
                          padding: "6px 14px",
                          textDecoration: "none",
                          fontSize: "13px",
                          boxShadow: "0 3px 10px rgba(37, 211, 102, 0.3)",
                        }}
                      >
                        <WhatsAppOutlined /> WhatsApp
                      </a>
                      <a
                        href={`tel:${candContact}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#0284c7",
                          color: "#ffffff",
                          borderRadius: "14px",
                          fontWeight: "700",
                          padding: "6px 14px",
                          textDecoration: "none",
                          fontSize: "13px",
                          boxShadow: "0 3px 10px rgba(2, 132, 199, 0.3)",
                        }}
                      >
                        <PhoneOutlined /> Call
                      </a>
                    </>
                  ) : !hasAccess ? (
                    <Link
                      to="/UserRecharge"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #e11d48, #be123c)",
                        color: "#ffffff",
                        fontWeight: "700",
                        fontSize: "13px",
                        padding: "6px 16px",
                        textDecoration: "none",
                        boxShadow: "0 3px 10px rgba(225, 29, 72, 0.3)",
                      }}
                    >
                      <CrownOutlined /> 👑 Premium Required (View Plans)
                    </Link>
                  ) : null}
                </div>
              </div>

              {/* Biodata Full Details Organized Sections */}
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                
                {/* 1. Personal & Physical Details */}
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1.5px solid #fecdd3",
                    padding: "16px 18px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}
                >
                  <h4 style={{ margin: "0 0 12px", color: "#881337", fontWeight: "800", fontSize: "14.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>👤</span> 1. Personal & Physical Details (व्यक्तिगत एवं शारीरिक विवरण)
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px 18px", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Full Name:</span>
                      <strong style={{ color: "#1e293b" }}>{candName}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Gender:</span>
                      <strong style={{ color: "#1e293b" }}>{candGender}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Date of Birth:</span>
                      <strong style={{ color: "#1e293b" }}>{candDob || "Not specified"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Age:</span>
                      <strong style={{ color: "#1e293b" }}>{candAge ? `${candAge} yrs` : "N/A"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Height:</span>
                      <strong style={{ color: "#1e293b" }}>{candHeight ? `${candHeight} cm` : "Not specified"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Weight:</span>
                      <strong style={{ color: "#1e293b" }}>{candWeight ? `${candWeight} kg` : "Not specified"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Complexion (रंग / वर्ण):</span>
                      <strong style={{ color: "#1e293b" }}>{candColor || "Not specified"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Marital Status:</span>
                      <strong style={{ color: "#1e293b" }}>{candMarital}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Mother Tongue:</span>
                      <strong style={{ color: "#1e293b" }}>{candMotherTongue}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Physical Disability:</span>
                      <strong style={{ color: "#1e293b" }}>{candDisability}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Community & Horoscope Details */}
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1.5px solid #fecdd3",
                    padding: "16px 18px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}
                >
                  <h4 style={{ margin: "0 0 12px", color: "#881337", fontWeight: "800", fontSize: "14.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🕉️</span> 2. Community & Horoscope Details (धार्मिक एवं कुंडली विवरण)
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px 18px", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Religion:</span>
                      <strong style={{ color: "#1e293b" }}>{candReligion}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Caste:</span>
                      <strong style={{ color: "#be123c" }}>{candCaste}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Gotra (गोत्र):</span>
                      <strong style={{ color: "#1e293b" }}>{candGotra || "Not specified"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Manglik Status:</span>
                      <strong style={{ color: "#1e293b" }}>{candManglik}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Diet Preference:</span>
                      <strong style={{ color: "#1e293b" }}>{candDiet}</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Education & Profession */}
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1.5px solid #fecdd3",
                    padding: "16px 18px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}
                >
                  <h4 style={{ margin: "0 0 12px", color: "#881337", fontWeight: "800", fontSize: "14.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>💼</span> 3. Education & Career (शिक्षा एवं व्यवसाय)
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px 18px", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Highest Qualification:</span>
                      <strong style={{ color: "#1e293b" }}>{candQual || "Not specified"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Profession / Designation:</span>
                      <strong style={{ color: "#1e293b" }}>{candProf || "Not specified"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Employment Type:</span>
                      <strong style={{ color: "#1e293b" }}>{candJobType || "Private Sector"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Monthly Income:</span>
                      <strong style={{ color: "#0f766e" }}>{candJobType === "Not Working" || Number(candSalary) === 0 ? "Not Applicable (Not Working)" : (candSalary ? `₹${Number(candSalary).toLocaleString("en-IN")}/month` : "Confidential")}</strong>
                    </div>
                  </div>
                </div>

                {/* 4. Family Background */}
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1.5px solid #fecdd3",
                    padding: "16px 18px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}
                >
                  <h4 style={{ margin: "0 0 12px", color: "#881337", fontWeight: "800", fontSize: "14.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>👨‍👩‍👦</span> 4. Family Background (पारिवारिक पृष्ठभूमि)
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px 18px", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Father's Name:</span>
                      <strong style={{ color: "#1e293b" }}>
                        {candFatherName || "Not specified"} {candFatherAge ? `(Age: ${candFatherAge} yrs)` : ""}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Father's Profession:</span>
                      <strong style={{ color: "#1e293b" }}>{candFatherProf || "Not specified"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Mother's Name:</span>
                      <strong style={{ color: "#1e293b" }}>
                        {candMotherName || "Not specified"} {candMotherAge ? `(Age: ${candMotherAge} yrs)` : ""}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Mother's Profession:</span>
                      <strong style={{ color: "#1e293b" }}>{candMotherProf || "Homemaker"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Brothers:</span>
                      <strong style={{ color: "#1e293b" }}>
                        {candBrothers} brother{candBrothers === "1" ? "" : "s"} ({candBrothersMarried} married)
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Sisters:</span>
                      <strong style={{ color: "#1e293b" }}>
                        {candSisters} sister{candSisters === "1" ? "" : "s"} ({candSistersMarried} married)
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>House Ownership:</span>
                      <strong style={{ color: "#1e293b" }}>{candHouse}</strong>
                    </div>
                  </div>
                </div>

                {/* 5. Location & Contact Details */}
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1.5px solid #fecdd3",
                    padding: "16px 18px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}
                >
                  <h4 style={{ margin: "0 0 12px", color: "#881337", fontWeight: "800", fontSize: "14.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>📍</span> 5. Location & Contact Details (निवास एवं संपर्क विवरण)
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px 18px", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>City / Native:</span>
                      <strong style={{ color: "#1e293b" }}>{candCity || "Not specified"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>District:</span>
                      <strong style={{ color: "#1e293b" }}>{candDistrict || "Not specified"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>State:</span>
                      <strong style={{ color: "#1e293b" }}>{candState || "Not specified"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Country:</span>
                      <strong style={{ color: "#1e293b" }}>{candCountry}</strong>
                    </div>

                    {/* Sensitive fields: Address, WhatsApp, Phone, Email */}
                    {hasAccess ? (
                      <>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <span style={{ color: "#64748b", display: "block" }}>Full Residential Address:</span>
                          <strong style={{ color: "#1e293b", fontSize: "14px" }}>
                            {candAddress ? candAddress : [candCity, candDistrict, candState].filter(Boolean).join(", ") || "Address on record"}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", display: "block" }}>WhatsApp / Primary Contact:</span>
                          <strong style={{ color: "#0f766e", fontSize: "14px" }}>
                            {candContact ? `+91 ${candContact}` : "Not provided"} {candContactName ? `(${candContactName})` : ""}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", display: "block" }}>Alternate Contact:</span>
                          <strong style={{ color: "#0f766e", fontSize: "14px" }}>
                            {candAltContact ? `+91 ${candAltContact}` : "Not specified"} {candAltContactName ? `(${candAltContactName})` : ""}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", display: "block" }}>Email Address:</span>
                          <strong style={{ color: "#1e293b", fontSize: "14px" }}>
                            {candEmail || "Not specified"}
                          </strong>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <span style={{ color: "#64748b", display: "block" }}>Full Residential Address:</span>
                          <span style={{ color: "#64748b", fontSize: "13.5px" }}>
                            {candCity ? `${candCity}, ` : ""}{candState || "India"} •{" "}
                            <Link
                              to="/UserRecharge"
                              style={{ color: "#e11d48", fontWeight: "700" }}
                            >
                              🔒 Premium Required (Click to view plans)
                            </Link>
                          </span>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", display: "block" }}>WhatsApp / Primary Contact:</span>
                          <Link
                            to="/UserRecharge"
                            style={{ color: "#e11d48", fontWeight: "700", fontSize: "13.5px" }}
                          >
                            🔒 Premium Required (Click to view plans)
                          </Link>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", display: "block" }}>Alternate Contact:</span>
                          <Link
                            to="/UserRecharge"
                            style={{ color: "#e11d48", fontWeight: "700", fontSize: "13.5px" }}
                          >
                            🔒 Premium Required
                          </Link>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", display: "block" }}>Email Address:</span>
                          <Link
                            to="/UserRecharge"
                            style={{ color: "#e11d48", fontWeight: "700", fontSize: "13.5px" }}
                          >
                            🔒 Premium Required
                          </Link>
                        </div>

                        <div
                          style={{
                            gridColumn: "1 / -1",
                            background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
                            border: "1.5px solid #fecdd3",
                            borderRadius: "16px",
                            padding: "18px 20px",
                            textAlign: "center",
                            marginTop: "10px",
                            boxShadow: "0 4px 14px rgba(225, 29, 72, 0.08)",
                          }}
                        >
                          <div
                            style={{
                              color: "#be123c",
                              fontWeight: 800,
                              fontSize: "15px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                            }}
                          >
                            <LockOutlined /> Premium Plan Required to View Contact Details & Address
                          </div>
                          <Link
                            to="/UserRecharge"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              borderRadius: "16px",
                              background: "linear-gradient(135deg, #e11d48, #be123c)",
                              color: "#ffffff",
                              fontWeight: "700",
                              fontSize: "13.5px",
                              padding: "10px 24px",
                              textDecoration: "none",
                              boxShadow: "0 4px 14px rgba(225, 29, 72, 0.35)",
                            }}
                          >
                            <CrownOutlined /> 👑 View Membership Plans & Activate Now →
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 6. Partner Preferences & Expectations */}
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1.5px solid #fecdd3",
                    padding: "16px 18px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}
                >
                  <h4 style={{ margin: "0 0 12px", color: "#881337", fontWeight: "800", fontSize: "14.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🤝</span> 6. Partner Preferences & Matching Expectations (जीवनसाथी प्राथमिकताएं एवं अतिरिक्त विवरण)
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px 18px", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Accepted Castes / Communities:</span>
                      <strong style={{ color: "#1e293b" }}>
                        {candAcceptProfiles.length > 0 ? candAcceptProfiles.join(", ") : "Open to compatible profiles"}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Preferred Nearby Districts:</span>
                      <strong style={{ color: "#1e293b" }}>
                        {candNearDist.length > 0 ? candNearDist.join(", ") : [candDistrict, candState].filter(Boolean).join(", ") || "All nearby districts"}
                      </strong>
                    </div>
                    {candRefer && (
                      <div>
                        <span style={{ color: "#64748b", display: "block" }}>Member Reference Code:</span>
                        <strong style={{ color: "#be123c" }}>#{candRefer}</strong>
                      </div>
                    )}
                    {candCreateDate && (
                      <div>
                        <span style={{ color: "#64748b", display: "block" }}>Profile Registered On:</span>
                        <strong style={{ color: "#1e293b" }}>{String(candCreateDate).slice(0, 10)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions Toolbar */}
              <div
                className="no-print"
                style={{
                  marginTop: "22px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: "16px",
                }}
              >
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  {hasAccess && candContact && (
                    <>
                      <a
                        href={`https://wa.me/91${candContact}?text=${encodeURIComponent(
                          `Hello ${candName}! I came across your matrimonial biodata on Vaivaheek Manch under our ${candCaste} community.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#25d366",
                          color: "#ffffff",
                          borderRadius: "14px",
                          fontWeight: "700",
                          padding: "6px 14px",
                          textDecoration: "none",
                          fontSize: "13px",
                          boxShadow: "0 3px 10px rgba(37, 211, 102, 0.3)",
                        }}
                      >
                        <WhatsAppOutlined /> WhatsApp
                      </a>
                      <a
                        href={`tel:${candContact}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#0284c7",
                          color: "#ffffff",
                          borderRadius: "14px",
                          fontWeight: "700",
                          padding: "6px 14px",
                          textDecoration: "none",
                          fontSize: "13px",
                          boxShadow: "0 3px 10px rgba(2, 132, 199, 0.3)",
                        }}
                      >
                        <PhoneOutlined /> Call
                      </a>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Button
                    onClick={() => setIsBiodataOpen(false)}
                    style={{
                      borderRadius: "14px",
                      fontWeight: "700",
                      height: "38px",
                      padding: "0 24px",
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      color: "#334155",
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default Wish_List;
