import React, { useMemo } from "react";
import { Button, Tag, Image, message } from "antd";
import { getMediaUrl } from "../../Config/Config";
import {
  EyeOutlined,
  HeartOutlined,
  HeartFilled,
  LockOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  PhoneOutlined,
  PhoneFilled,
  WhatsAppOutlined,
  CopyOutlined,
  EnvironmentOutlined,
  UserOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  FireOutlined,
  ShopOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

/**
 * UserBiodataModal (Standalone Biodata Component View)
 * ----------------------------------------------------
 * 1. Dedicated component view (not a cramped card popup).
 * 2. Full-fit centered profile picture on mobile view, with stacked details.
 * 3. Partner preference section removed as requested.
 * 4. Print option removed as requested.
 * 5. Related match profiles in enhanced cards in a horizontal scrollable row with NO scrollbar line.
 * 6. District wedding & matrimonial services sequenced by Services category model ID (e.g. DJ id 1 first), in a horizontal scrollable row with NO scrollbar line.
 * 7. Clicking cards opens them in their respective view components.
 */
const getCategoryIcon = (categoryName) => {
  const c = String(categoryName || "").toLowerCase();
  if (c.includes("dj") || c.includes("sound") || c.includes("music")) return "🎵";
  if (c.includes("photo") || c.includes("video") || c.includes("studio") || c.includes("camera")) return "📸";
  if (c.includes("hall") || c.includes("venue") || c.includes("lawn") || c.includes("garden") || c.includes("resort") || c.includes("banquet")) return "🏛️";
  if (c.includes("cater") || c.includes("food") || c.includes("sweet") || c.includes("halwai")) return "🍛";
  if (c.includes("decor") || c.includes("flower") || c.includes("mandap") || c.includes("stage")) return "🌸";
  if (c.includes("makeup") || c.includes("beauty") || c.includes("parlour") || c.includes("salon")) return "💄";
  if (c.includes("mehendi") || c.includes("mehndi")) return "✨";
  if (c.includes("band") || c.includes("baaja") || c.includes("dhol") || c.includes("shehnai")) return "🎺";
  if (c.includes("pandit") || c.includes("priest") || c.includes("jyotish") || c.includes("puja")) return "🕉️";
  if (c.includes("planner") || c.includes("event")) return "📋";
  if (c.includes("car") || c.includes("transport") || c.includes("travel")) return "🚗";
  if (c.includes("card") || c.includes("invite") || c.includes("print")) return "💌";
  if (c.includes("jewel") || c.includes("cloth") || c.includes("dress") || c.includes("sherwani")) return "👑";
  return "🛍️";
};

const formatRelationBadge = (info, defaultName = "") => {
  const rel = info?.relation || "Self";
  const rawName = String(info?.personName || defaultName || "").trim();
  const lowerName = rawName.toLowerCase();
  const isGeneric = !rawName || ["female", "male", "candidate", "user", "self", "none", "null"].includes(lowerName);

  if (rel === "Self") {
    return isGeneric ? "Self (स्वयं)" : `Self (${rawName})`;
  }
  if (rel === "Father") return isGeneric ? "Father (पिताजी)" : `Father (${rawName})`;
  if (rel === "Mother") return isGeneric ? "Mother (माताजी)" : `Mother (${rawName})`;
  if (rel === "Brother") return isGeneric ? "Brother (भाई)" : `Brother (${rawName})`;
  if (rel === "Sister") return isGeneric ? "Sister (बहन)" : `Sister (${rawName})`;
  if (rel === "Guardian") return isGeneric ? "Guardian (अभिभावक)" : `Guardian (${rawName})`;
  if (rel === "Relative") return isGeneric ? "Relative (रिश्तेदार)" : `Relative (${rawName})`;
  return isGeneric ? rel : `${rel} (${rawName})`;
};

const formatPhoneNumber = (phone) => {
  const p = String(phone || "").replace(/\D/g, "");
  if (!p) return phone || "Not specified";
  const num = p.length > 10 ? p.slice(-10) : p;
  if (num.length === 10) {
    return `${num.slice(0, 5)} ${num.slice(5)}`;
  }
  return phone;
};

const cleanPhoneForAction = (phone) => {
  const p = String(phone || "").replace(/\D/g, "");
  return p.length > 10 ? p.slice(-10) : p;
};

const handleCopyContact = (phone, label = "Contact") => {
  const clean = cleanPhoneForAction(phone);
  if (!clean) return;
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(clean);
    message.success(`${label} number copied! 📋`);
  } else {
    message.info(`Contact: ${clean}`);
  }
};

const UserBiodataModal = ({
  open,
  onClose,
  candidate,
  user = {},
  user_id,
  baseurl = "",
  allCandidates = [],
  servicesList = [],
  serviceCategories = [],
  wishlistIds = [],
  approvedWishlistItems = [],
  incomingWishlistItems = [],
  toggleWishlist = () => {},
  handleSendRequest = () => {},
  handleWishlistResponse = () => {},
  handleSensitiveClick = () => {},
  getSensitiveAccessStatus = () => ({ allowed: false, label: "Restricted", help: "" }),
  getContactRelationDisplay = () => ({ relation: "Contact", personName: "" }),
  switchTab = () => {},
  setIsStatusModalOpen = () => {},
  onSelectCandidate = () => {},
  onSelectService = () => {},
}) => {
  const m = candidate || {};
  const candId = m.User_id || m.id;
  const candName = m.firstname || m.Full_Name || m.first_name || "Candidate";
  const candGender = m.gender || m.Gender || "Candidate";
  const candCaste = m.caste || m.Caste || "Community";
  const candGotra = m.gotra || m.Gotra || "";
  const candReligion = m.religion || m.Religion || "Hindu";
  const candAge = m.age || m.Age;
  const candDob = m.dob || m.DOB ? String(m.dob || m.DOB).slice(0, 10) : "";
  const candHeight = m.height || m.Height;
  const candWeight = m.weight || m.Weight;
  const candColor = m.color || m.Color || m.complexion || m.Complexion || "";
  const candMarital = m.marrige_status || m.Marrige_status || "Never Married";
  const candMotherTongue = m.mother_tongue || m.Mother_tongue || "Hindi";
  const candDisability =
    m.disability !== undefined
      ? m.disability
        ? "Yes (Physically Challenged)"
        : "None"
      : m.Disability
      ? "Yes"
      : "None";
  const candManglik =
    m.manglik !== undefined
      ? m.manglik
        ? "Yes (Manglik)"
        : "No (Non-Manglik)"
      : m.Manglik
      ? "Yes"
      : "No (Non-Manglik)";
  const candDiet = m.vegeterian || m.Vegeterian || "Vegetarian";
  const candQual = m.qualification || m.Qualification || m.course || "";
  const candProf = m.profession || m.Profession || m.job_title || "";
  const candJobType = m.job_type || m.Job_type || "Private";
  const candSalary = m.salary !== undefined ? m.salary : m.Salary;
  const isNotWorking =
    candJobType === "Not Working" ||
    String(candJobType || "").toLowerCase().includes("not work") ||
    String(candProf || "").toLowerCase() === "not working" ||
    String(candProf || "").toLowerCase() === "unemployed" ||
    String(candProf || "").toLowerCase() === "housewife" ||
    String(candProf || "").toLowerCase() === "homemaker";
  const hasSalary =
    !isNotWorking &&
    candSalary !== undefined &&
    candSalary !== null &&
    candSalary !== "" &&
    Number(candSalary) > 0;
  const candFatherName = m.father_name || m.Father_name || "";
  const candFatherAge = m.father_age || m.Father_Age || "";
  const candFatherProf = m.father_profession || m.Father_Profession || "";
  const candMotherName = m.mother_name || m.Mother_name || "";
  const candMotherAge = m.mother_age || m.Mother_Age || "";
  const candMotherProf = m.mother_profession || m.Mother_Profession || "";
  const candBrothers = m.brothers || m.Brothers || m.brother || "0";
  const candBrothersMarried = m.brothers_marrige || m.Brothers_marrige || "0";
  const candSisters = m.sisters || m.Sisters || m.sister || "0";
  const candSistersMarried = m.sisters_marrige || m.Sisters_marrige || "0";
  const candHouse = m.house || m.House || "Self Owned";
  const candCity = m.city || m.City || "";
  const candDistrict = m.district || m.District || "";
  const candState = m.state || m.State || "";
  const candCountry = m.country || m.Country || "India";
  const candAddress = m.full_address || m.Full_Address || "";
  const candContact = m.contact || m.WP_Contact || m.Contact || "";
  const candContactRelation = m.wp_contact_relation || m.WP_Contact_Relation || "";
  const candContactName = m.wp_contact_name || m.Wp_Contact_Name || "";
  const candContactInfo = getContactRelationDisplay(
    candContactRelation,
    candContactName,
    candContact,
    candName,
    candFatherName,
    candMotherName
  );
  const candAltContact = m.alt_contact || m.Alt_Contact || "";
  const candAltContactRelation = m.alt_contact_relation || m.Alt_Contact_Relation || "";
  const candAltContactName = m.alt_contact_name || m.Alt_Contact_Name || "";
  const candAltContactInfo = getContactRelationDisplay(
    candAltContactRelation,
    candAltContactName,
    candAltContact,
    candName,
    candFatherName,
    candMotherName
  );
  const candEmail = m.email || m.Email || "";
  const modalAccessStatus = getSensitiveAccessStatus(m);
  const hasAccess = modalAccessStatus.allowed;

  const candPic = getMediaUrl(
    m.pic || m.Profile_Pic,
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
  );


  // 1. Related Profile Suggestions (Filtered for compatible community, gender, or district)
  const relatedProfiles = useMemo(() => {
    if (!Array.isArray(allCandidates) || allCandidates.length === 0) return [];
    const currentIdStr = String(candId);
    const myIdStr = String(user_id);
    const targetGender = String(candGender).toLowerCase();
    const todayStr = new Date().toISOString().split("T")[0];

    // Candidates of same search pool (e.g. if viewing a bride, suggest other brides)
    const pool = allCandidates.filter((c) => {
      if (!c) return false;
      const cId = String(c.User_id || c.id);
      if (cId === currentIdStr || cId === myIdStr) return false;

      // 1. Exclude inactive / disabled profiles
      if (c.Active === false || c.active === false || c.is_active === false) return false;
      if (c.user_account && c.user_account.is_active === false) return false;
      const statusStr = String(c.Status || c.status || "").trim().toLowerCase();
      if (["deactive", "inactive", "deactivated", "disabled"].includes(statusStr)) return false;

      // 2. Exclude admin approval pending profiles
      if (c.is_approved === false || c.Admin_Approval === false) return false;
      if (statusStr === "pending") return false;

      // 3. Strictly exclude Null or expired Valid_Upto
      if (!c.Valid_Upto) return false;
      const vu = String(c.Valid_Upto).trim().split("T")[0];
      if (!vu || vu < todayStr) return false;

      const cGender = String(c.gender || c.Gender || "").toLowerCase();
      if (targetGender && cGender && cGender !== targetGender) return false;
      return true;
    });

    // Score by: Same Caste (+5), Same District (+3), Same Religion (+2), Same State (+1)
    const scored = pool.map((c) => {
      let score = 0;
      const cCaste = String(c.caste || c.Caste || "").toLowerCase();
      const cReligion = String(c.religion || c.Religion || "").toLowerCase();
      const cDistrict = String(c.district || c.District || "").toLowerCase();
      const cState = String(c.state || c.State || "").toLowerCase();

      if (candCaste && cCaste && cCaste === candCaste.toLowerCase()) score += 5;
      if (candReligion && cReligion && cReligion === candReligion.toLowerCase()) score += 2;
      if (candDistrict && cDistrict && cDistrict === candDistrict.toLowerCase()) score += 3;
      if (candState && cState && cState === candState.toLowerCase()) score += 1;

      return { candidate: c, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 10).map((item) => item.candidate);
  }, [allCandidates, candId, user_id, candGender, candCaste, candReligion, candDistrict, candState]);

    // 2. Services Related to Candidate's District, grouped row-wise strictly based on Services model data sequence
  const districtServicesGroupedByCategory = useMemo(() => {
    if (!Array.isArray(servicesList) || servicesList.length === 0) return [];
    const targetDist = String(candDistrict || candCity || "").toLowerCase().trim();

    // Map category ID ordering from Services model (e.g. DJ id 1 first, then 2, 3...)
    const categoryOrderMap = {};
    (serviceCategories || []).forEach((cat, index) => {
      const catId = cat.id !== undefined && cat.id !== null ? Number(cat.id) : index + 1;
      const sName = String(cat.Service_Name || "").toLowerCase().trim();
      const sType = String(cat.Service_Type || "").toLowerCase().trim();
      if (sName) categoryOrderMap[sName] = catId;
      if (sType) categoryOrderMap[sType] = catId;
    });

    const todayStr = new Date().toISOString().split("T")[0];
    const isServiceAvailable = (s) => {
      if (!s) return false;
      if (s.Active === false || s.is_active === false || !s.Active) return false;
      const statusStr = String(s.Status || s.status || "").trim().toLowerCase();
      if (["deactive", "inactive", "deactivated", "disabled"].includes(statusStr)) return false;
      if (s.Admin_Approval !== true || statusStr === "pending") return false;
      if (!s.Valid_Upto) return false;
      const vu = String(s.Valid_Upto).trim().split("T")[0];
      if (vu < todayStr) return false;
      return true;
    };

    // Filter services strictly matching candidate's district or zone
    const matches = servicesList.filter((s) => {
      if (!isServiceAvailable(s)) return false;
      const sDist = String(s.District || s.district || s.City || s.city || "").toLowerCase().trim();
      const rawZones = s.Available_Zone;
      let parsedZones = [];
      if (Array.isArray(rawZones)) parsedZones = rawZones;
      else if (typeof rawZones === "string") {
        try {
          parsedZones = JSON.parse(rawZones);
        } catch {
          parsedZones = rawZones.split(",").map((z) => z.trim());
        }
      }
      const zoneMatch = parsedZones.some((z) => {
        const zStr = String(z).toLowerCase().trim();
        return zStr === "all" || (targetDist && zStr === targetDist);
      });

      if (!targetDist) return true;
      return sDist === targetDist || sDist.includes(targetDist) || targetDist.includes(sDist) || zoneMatch;
    });

    const resultList = matches.length > 0 ? matches : servicesList.filter((s) => isServiceAvailable(s));

    // Sort serviceCategories strictly by Services model ID sequence
    const sortedCats = [...(serviceCategories || [])].sort(
      (a, b) => (Number(a.id) || 0) - (Number(b.id) || 0)
    );

    const groups = [];
    const assignedIds = new Set();

    // Iterate through each category in Services model sequence
    sortedCats.forEach((cat, index) => {
      const catName = cat.Service_Type || cat.Service_Name || "";
      const catLower = catName.trim().toLowerCase();
      if (!catLower) return;

      const matched = resultList.filter((s) => {
        const sType = (s.Service_Type || "").trim().toLowerCase();
        const sName = (s.Service_Name || "").trim().toLowerCase();
        return (
          sType === catLower ||
          sName.includes(catLower) ||
          (catLower.length > 3 && (sType.includes(catLower) || catLower.includes(sType)))
        );
      });

      if (matched.length > 0) {
        matched.forEach((s) => assignedIds.add(s.id));
        groups.push({
          category: cat,
          catId: cat.id !== undefined ? cat.id : index + 1,
          catName: catName,
          icon: getCategoryIcon(catName),
          services: matched,
        });
      }
    });

    // Catch any remaining services that may not match defined master categories
    const remaining = resultList.filter((s) => !assignedIds.has(s.id));
    if (remaining.length > 0) {
      groups.push({
        category: { id: 9999, Service_Name: "Other Wedding Services", Service_Type: "Other Wedding Services" },
        catId: 9999,
        catName: "Other Wedding Services",
        icon: "🌟",
        services: remaining,
      });
    }

    return groups;
  }, [servicesList, serviceCategories, candDistrict, candCity]);

  const hasSpecificDistrictServices = useMemo(() => {
    if (!Array.isArray(servicesList) || servicesList.length === 0) return false;
    const targetDist = String(candDistrict || candCity || "").toLowerCase().trim();
    if (!targetDist) return false;
    const todayStr = new Date().toISOString().split("T")[0];
    return servicesList.some((s) => {
      if (!s) return false;
      if (s.Active === false || s.is_active === false || !s.Active) return false;
      if (s.Admin_Approval !== true) return false;
      if (!s.Valid_Upto) return false;
      const vu = String(s.Valid_Upto).trim().split("T")[0];
      if (vu < todayStr) return false;
      const sDist = String(s.District || s.district || s.City || s.city || "").toLowerCase().trim();
      return sDist === targetDist || sDist.includes(targetDist) || targetDist.includes(sDist);
    });
  }, [servicesList, candDistrict, candCity]);

  if (!open || !candidate) return null;

  return (
    <div className="up-biodata-page-view">


      <div className="up-biodata-modal-body">
        {/* ============================================================== */}
        {/* 1. HEADER PROFILE HERO (Modern Full Component Showcase)       */}
        {/* ============================================================== */}
        <div className="up-biodata-hero">
          {/* Profile Image with Portrait Showcase */}
          <div className="up-biodata-avatar-wrap">
            <div className="up-biodata-avatar">
              <Image
                src={candPic}
                alt={candName}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center top",
                  cursor: "pointer",
                }}
                preview={{
                  mask: (
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        color: "#ffffff",
                      }}
                    >
                      <EyeOutlined /> Full Photo
                    </div>
                  ),
                }}
                fallback="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
              />
            </div>
          </div>

          {/* Profile Details (Full Identity Details & Quick Highlights) */}
          <div className="up-biodata-hero-info">
            <div className="up-biodata-hero-title-row">
              <h2 className="up-biodata-hero-name">{candName}</h2>
              <Tag
                color="magenta"
                style={{ borderRadius: "14px", fontWeight: "800", padding: "2px 10px" }}
              >
                {candGender}
              </Tag>
              <span className="up-biodata-hero-id">ID: #{candId}</span>
            </div>

            <div className="up-biodata-hero-community">
              {candCaste} {candGotra ? `• Gotra: ${candGotra}` : ""} • {candReligion}
            </div>

            <div className="up-biodata-hero-location">
              <EnvironmentOutlined style={{ marginRight: 4, color: "#e11d48" }} />
              {(hasAccess
                ? [candCity, candDistrict, candState, candCountry]
                : [candDistrict, candState, candCountry]
              )
                .filter(Boolean)
                .join(", ")}
            </div>

            {/* Quick Key Highlights Bar */}
            <div className="up-biodata-hero-highlights">
              {Boolean(candAge && Number(candAge) > 0) && (
                <span className="up-hero-hl-chip">
                  🎂 <strong>{candAge} Yrs</strong>
                </span>
              )}
              {Boolean(candHeight && Number(candHeight) > 0) && (
                <span className="up-hero-hl-chip">
                  📏 <strong>{candHeight} cm</strong>
                </span>
              )}
              {Boolean(candMarital) && (
                <span className="up-hero-hl-chip">
                  💍 <strong>{candMarital}</strong>
                </span>
              )}
              {Boolean(candQual) && (
                <span className="up-hero-hl-chip">
                  🎓 <strong>{candQual}</strong>
                </span>
              )}
              {Boolean(candProf) && (
                <span className="up-hero-hl-chip">
                  💼 <strong>{candProf}</strong>
                </span>
              )}
              {Boolean(hasSalary) && (
                <span className="up-hero-hl-chip">
                  💰 <strong>₹{Number(candSalary).toLocaleString("en-IN")}/mo</strong>
                </span>
              )}
              {Boolean(candDistrict || candState) && (
                <span className="up-hero-hl-chip">
                  📍 <strong>{[candDistrict, candState].filter(Boolean).join(", ")}</strong>
                </span>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="up-biodata-hero-actions">
              <Button
                icon={
                  wishlistIds.includes(String(candId)) ? (
                    <HeartFilled style={{ color: "#e11d48" }} />
                  ) : (
                    <HeartOutlined />
                  )
                }
                onClick={() => toggleWishlist(candId)}
                className="up-biodata-hero-btn up-biodata-shortlist-btn"
                style={{ borderRadius: "14px", fontWeight: "700" }}
              >
                {wishlistIds.includes(String(candId)) ? "Shortlisted" : "Shortlist"}
              </Button>

              {hasAccess && candContact ? (
                <>
                  <a
                    href={`tel:${cleanPhoneForAction(candContact)}`}
                    className="up-biodata-hero-btn up-biodata-hero-call-btn"
                  >
                    <PhoneFilled /> Call
                  </a>
                  <a
                    href={`https://wa.me/91${cleanPhoneForAction(candContact)}?text=${encodeURIComponent(
                      candContactInfo.relation === "Self"
                        ? `Hello ${candName}! I came across your matrimonial biodata on Vaivaheek Manch under our ${candCaste} community.`
                        : `Hello! I came across ${candName}'s matrimonial biodata on Vaivaheek Manch under our ${candCaste} community.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="up-biodata-hero-btn up-biodata-hero-wa-btn"
                  >
                    <WhatsAppOutlined /> WhatsApp
                  </a>
                </>
              ) : !hasAccess ? (
                <>
                  {modalAccessStatus.reason === "RESTRICTED" ? (
                    <Button
                      type="primary"
                      onClick={() => {
                        onClose();
                        setIsStatusModalOpen(true);
                      }}
                      className="up-biodata-hero-btn up-biodata-main-action-btn"
                      style={{
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #d97706, #b45309)",
                        borderColor: "#d97706",
                        fontWeight: "700",
                      }}
                    >
                      ⚡ Activate Profile
                    </Button>
                  ) : modalAccessStatus.reason === "INCOMING_PENDING" ? (
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => {
                        handleWishlistResponse(modalAccessStatus.incomingReqId, "Approved");
                      }}
                      className="up-biodata-hero-btn up-biodata-main-action-btn"
                      style={{
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #059669, #047857)",
                        borderColor: "#059669",
                        fontWeight: "700",
                      }}
                    >
                      ✅ Approve Request
                    </Button>
                  ) : modalAccessStatus.reason === "NOT_APPROVED" ? (
                    <Button
                      type="primary"
                      icon={<HeartOutlined />}
                      onClick={() => handleSendRequest(candId, candName)}
                      className="up-biodata-hero-btn up-biodata-main-action-btn"
                      style={{
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #e11d48, #be123c)",
                        fontWeight: "700",
                      }}
                    >
                      💌 Send Request
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      icon={<CrownOutlined />}
                      onClick={() => {
                        onClose();
                        switchTab("plans");
                      }}
                      className="up-biodata-hero-btn up-biodata-main-action-btn"
                      style={{
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #e11d48, #be123c)",
                        fontWeight: "700",
                      }}
                    >
                      👑 View Plans
                    </Button>
                  )}

                  <Button
                    onClick={() => handleSensitiveClick(m, "Contact / Call")}
                    className="up-biodata-hero-btn"
                    style={{
                      borderRadius: "14px",
                      fontWeight: "700",
                      borderColor: "#fecdd3",
                      color: "#e11d48",
                    }}
                  >
                    <LockOutlined style={{ color: "#e11d48" }} /> Call
                  </Button>
                  <Button
                    onClick={() => handleSensitiveClick(m, "WhatsApp")}
                    className="up-biodata-hero-btn"
                    style={{
                      borderRadius: "14px",
                      fontWeight: "700",
                      borderColor: "#bbf7d0",
                      color: "#15803d",
                    }}
                  >
                    <LockOutlined style={{ color: "#15803d" }} /> WhatsApp
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. CORE BIODATA SECTIONS (Partner Preference Removed)          */}
        {/* ============================================================== */}
        {/* Section 1: Basic & Physical Details */}
        <div className="up-biodata-section-card">
          <h3 className="up-biodata-section-title">
            <UserOutlined style={{ color: "#e11d48" }} /> 1. व्यक्तिगत एवं शारीरिक विवरण (Basic & Personal Details)
          </h3>
          <div className="up-biodata-grid">
            <div className="up-biodata-item">
              <span className="up-biodata-label">Age / जन्म आयु</span>
              <span className="up-biodata-val">{candAge ? `${candAge} Years` : "Not specified"}</span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Birth Date / जन्म तिथि</span>
              <span className="up-biodata-val">{candDob || "Not specified"}</span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Height / कद-ऊंचाई</span>
              <span className="up-biodata-val">{candHeight ? `${candHeight} cm` : "Not specified"}</span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Weight / वजन</span>
              <span className="up-biodata-val">{candWeight ? `${candWeight} kg` : "Not specified"}</span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Marital Status / वैवाहिक स्थिति</span>
              <span className="up-biodata-val" style={{ color: "#be123c" }}>
                {candMarital}
              </span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Complexion / रंग</span>
              <span className="up-biodata-val">{candColor || "Not specified"}</span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Mother Tongue / मातृभाषा</span>
              <span className="up-biodata-val">{candMotherTongue}</span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Diet / आहार</span>
              <span className="up-biodata-val">{candDiet}</span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Manglik / मांगलिक स्थिति</span>
              <span className="up-biodata-val">{candManglik}</span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Disability / दिव्यांगता</span>
              <span className="up-biodata-val">{candDisability}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Education & Professional Details */}
        <div className="up-biodata-section-card">
          <h3 className="up-biodata-section-title">
            <BookOutlined style={{ color: "#e11d48" }} /> 2. शिक्षा एवं व्यवसाय विवरण (Education & Profession)
          </h3>
          <div className="up-biodata-grid">
            <div className="up-biodata-item">
              <span className="up-biodata-label">Qualification / उच्चतम शिक्षा</span>
              <span className="up-biodata-val">{candQual || "Not specified"}</span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Profession / व्यवसाय</span>
              <span className="up-biodata-val" style={{ color: isNotWorking ? "#64748b" : "#059669" }}>
                {candProf || (isNotWorking ? "Not working" : "Not specified")}
              </span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Employment Type / कार्य का प्रकार</span>
              <span className="up-biodata-val">{candJobType}</span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Income / आय (प्रति माह)</span>
              <span className="up-biodata-val">
                {isNotWorking || !hasSalary
                  ? (isNotWorking ? "Not Applicable (Not Working)" : "Not disclosed")
                  : `₹${Number(candSalary).toLocaleString("en-IN")}/month`}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Family Details */}
        <div className="up-biodata-section-card">
          <h3 className="up-biodata-section-title">
            <TeamOutlined style={{ color: "#e11d48" }} /> 3. पारिवारिक पृष्ठभूमि (Family Details)
          </h3>
          <div className="up-biodata-grid">
            <div className="up-biodata-item">
              <span className="up-biodata-label">Father's Name / पिता का नाम</span>
              <span className="up-biodata-val">{candFatherName || "Not specified"}</span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Father's Profession / पिता का व्यवसाय</span>
              <span className="up-biodata-val">
                {candFatherProf || "Not specified"}
                {candFatherAge ? ` (Age: ${candFatherAge} yrs)` : ""}
              </span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Mother's Name / माता का नाम</span>
              <span className="up-biodata-val">{candMotherName || "Not specified"}</span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Mother's Profession / माता का व्यवसाय</span>
              <span className="up-biodata-val">
                {candMotherProf || "Homemaker"}
                {candMotherAge ? ` (Age: ${candMotherAge} yrs)` : ""}
              </span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Brothers / भाई</span>
              <span className="up-biodata-val">
                {candBrothers} {Number(candBrothersMarried) > 0 ? `(${candBrothersMarried} Married)` : ""}
              </span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Sisters / बहनें</span>
              <span className="up-biodata-val">
                {candSisters} {Number(candSistersMarried) > 0 ? `(${candSistersMarried} Married)` : ""}
              </span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Residence / घर का स्वामित्व</span>
              <span className="up-biodata-val">{candHouse}</span>
            </div>
          </div>
        </div>

        {/* Section 4: Contact & Residential Details */}
        <div className="up-biodata-section-card">
          <h3 className="up-biodata-section-title">
            <SafetyCertificateOutlined style={{ color: "#e11d48" }} /> 4. संपर्क एवं पता विवरण (Contact & Location)
          </h3>
          <div className="up-biodata-grid">
            <div className="up-biodata-item">
              <span className="up-biodata-label">City / Town (शहर)</span>
              <span className="up-biodata-val">{candCity || "Not specified"}</span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">District (जिला)</span>
              <span className="up-biodata-val" style={{ color: "#be123c", fontWeight: 800 }}>
                {candDistrict || "Not specified"}
              </span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">State / राज्य</span>
              <span className="up-biodata-val">{candState || "Not specified"}</span>
            </div>
            <div className="up-biodata-item">
              <span className="up-biodata-label">Country / देश</span>
              <span className="up-biodata-val">{candCountry}</span>
            </div>

            {hasAccess ? (
              <>
                <div className="up-biodata-item-full">
                  <span className="up-biodata-label">Full Residential Address / स्थायी पता</span>
                  <span className="up-biodata-val">{candAddress || "Available on mutual consent"}</span>
                </div>

                {candEmail && (
                  <div className="up-biodata-item-full">
                    <span className="up-biodata-label">Email Address / ईमेल</span>
                    <span className="up-biodata-val">{candEmail}</span>
                  </div>
                )}

                <div className="up-biodata-item-full">
                  <div className="up-biodata-contact-box">
                    <div className="up-biodata-contact-box-left">
                      <div className="up-biodata-contact-badge-row">
                        <span className="up-biodata-label" style={{ color: "#15803d", margin: 0 }}>
                          Primary Contact Number / प्राथमिक संपर्क
                        </span>
                        <Tag
                          color={candContactInfo.relation === "Self" ? "green" : "blue"}
                          style={{
                            borderRadius: "10px",
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "2px 10px",
                            margin: 0,
                          }}
                        >
                          {formatRelationBadge(candContactInfo, candName)}
                        </Tag>
                      </div>

                      <div className="up-biodata-contact-num-row">
                        <span className="up-biodata-contact-phone">
                          <PhoneFilled style={{ color: "#16a34a", fontSize: "16px" }} />
                          {formatPhoneNumber(candContact)}
                        </span>
                        {candContact && (
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => handleCopyContact(candContact, "Primary contact")}
                            style={{
                              borderRadius: "8px",
                              color: "#166534",
                              fontWeight: "600",
                              fontSize: "12px",
                              background: "rgba(22, 163, 74, 0.1)",
                              padding: "2px 8px",
                              height: "26px",
                            }}
                          >
                            Copy
                          </Button>
                        )}
                      </div>
                    </div>

                    {candContact && (
                      <div className="up-biodata-contact-box-actions">
                        <a
                          href={`tel:${cleanPhoneForAction(candContact)}`}
                          className="up-biodata-action-call-btn"
                        >
                          <PhoneFilled /> Call
                        </a>
                        <a
                          href={`https://wa.me/91${cleanPhoneForAction(candContact)}?text=${encodeURIComponent(
                            candContactInfo.relation === "Self"
                              ? `Hello ${candName}! I came across your matrimonial biodata on Vaivaheek Manch under our ${candCaste} community.`
                              : `Hello! I came across ${candName}'s matrimonial biodata on Vaivaheek Manch under our ${candCaste} community.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="up-biodata-action-wa-btn"
                        >
                          <WhatsAppOutlined /> WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {candAltContact && (
                  <div className="up-biodata-item-full">
                    <div className="up-biodata-alt-contact-box">
                      <div className="up-biodata-contact-box-left">
                        <div className="up-biodata-contact-badge-row">
                          <span className="up-biodata-label" style={{ color: "#0369a1", margin: 0 }}>
                            Alternate Contact / वैकल्पिक संपर्क
                          </span>
                          <Tag
                            color="cyan"
                            style={{
                              borderRadius: "10px",
                              fontSize: "11px",
                              fontWeight: "700",
                              padding: "2px 10px",
                              margin: 0,
                            }}
                          >
                            {formatRelationBadge(candAltContactInfo, candName)}
                          </Tag>
                        </div>

                        <div className="up-biodata-contact-num-row">
                          <span className="up-biodata-alt-contact-phone">
                            <PhoneFilled style={{ color: "#0284c7", fontSize: "16px" }} />
                            {formatPhoneNumber(candAltContact)}
                          </span>
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => handleCopyContact(candAltContact, "Alternate contact")}
                            style={{
                              borderRadius: "8px",
                              color: "#0369a1",
                              fontWeight: "600",
                              fontSize: "12px",
                              background: "rgba(2, 132, 199, 0.1)",
                              padding: "2px 8px",
                              height: "26px",
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>

                      <div className="up-biodata-contact-box-actions">
                        <a
                          href={`tel:${cleanPhoneForAction(candAltContact)}`}
                          className="up-biodata-action-call-btn"
                          style={{
                            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                            borderColor: "#0284c7",
                          }}
                        >
                          <PhoneFilled /> Call
                        </a>
                        <a
                          href={`https://wa.me/91${cleanPhoneForAction(candAltContact)}?text=${encodeURIComponent(
                            `Hello! I came across ${candName}'s matrimonial biodata on Vaivaheek Manch.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="up-biodata-action-wa-btn"
                        >
                          <WhatsAppOutlined /> WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="up-biodata-item-full">
                  <span className="up-biodata-label">Contact & Address Visibility</span>
                  <span
                    style={{
                      color:
                        modalAccessStatus.reason === "RESTRICTED"
                          ? "#b45309"
                          : modalAccessStatus.reason === "INCOMING_PENDING"
                          ? "#1d4ed8"
                          : "#e11d48",
                      fontWeight: "700",
                    }}
                  >
                    {modalAccessStatus.label}
                  </span>
                </div>

                {/* Sensitive Lock Box with Responsive Non-Overflowing Buttons */}
                <div
                  className="up-biodata-lock-card"
                  style={{
                    background:
                      modalAccessStatus.reason === "RESTRICTED"
                        ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"
                        : modalAccessStatus.reason === "INCOMING_PENDING"
                        ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
                        : "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
                    border:
                      modalAccessStatus.reason === "RESTRICTED"
                        ? "1.5px solid #fcd34d"
                        : modalAccessStatus.reason === "INCOMING_PENDING"
                        ? "1.5px solid #bfdbfe"
                        : "1.5px solid #fecdd3",
                    boxShadow:
                      modalAccessStatus.reason === "INCOMING_PENDING"
                        ? "0 4px 14px rgba(37, 99, 235, 0.12)"
                        : "0 4px 14px rgba(225, 29, 72, 0.08)",
                  }}
                >
                  <div
                    className="up-biodata-lock-title"
                    style={{
                      color:
                        modalAccessStatus.reason === "RESTRICTED"
                          ? "#92400e"
                          : modalAccessStatus.reason === "INCOMING_PENDING"
                          ? "#1d4ed8"
                          : "#be123c",
                    }}
                  >
                    <LockOutlined />{" "}
                    {modalAccessStatus.reason === "RESTRICTED"
                      ? "Profile Deactivated — Activate to Unlock Details"
                      : modalAccessStatus.reason === "INCOMING_PENDING"
                      ? "Approve Request to Unlock Contact"
                      : modalAccessStatus.reason === "NOT_APPROVED"
                      ? "Partner Approval Required"
                      : "Membership Plan Required"}
                  </div>

                  {modalAccessStatus.reason === "RESTRICTED" ? (
                    <Button
                      type="primary"
                      className="up-biodata-lock-btn"
                      onClick={() => {
                        onClose();
                        setIsStatusModalOpen(true);
                      }}
                      style={{
                        background: "linear-gradient(135deg, #d97706, #b45309)",
                        borderColor: "#d97706",
                        color: "#ffffff",
                        boxShadow: "0 4px 14px rgba(217, 119, 6, 0.35)",
                      }}
                    >
                      ⚡ Activate Profile
                    </Button>
                  ) : modalAccessStatus.reason === "INCOMING_PENDING" ? (
                    <div className="up-biodata-lock-btn-wrap">
                      <Button
                        type="primary"
                        className="up-biodata-lock-btn"
                        icon={<CheckCircleOutlined />}
                        onClick={() => {
                          handleWishlistResponse(modalAccessStatus.incomingReqId, "Approved");
                        }}
                        style={{
                          background: "linear-gradient(135deg, #059669, #047857)",
                          borderColor: "#059669",
                          color: "#ffffff",
                          boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                        }}
                      >
                        ✅ Approve Connection Request
                      </Button>
                      <Button
                        className="up-biodata-lock-btn"
                        onClick={() => {
                          handleWishlistResponse(modalAccessStatus.incomingReqId, "Rejected");
                          onClose();
                        }}
                        style={{
                          borderColor: "#fecaca",
                          color: "#b91c1c",
                          background: "#ffffff",
                        }}
                      >
                        Decline Request
                      </Button>
                    </div>
                  ) : modalAccessStatus.reason === "NOT_APPROVED" ? (
                    <Button
                      type="primary"
                      className="up-biodata-lock-btn"
                      icon={<HeartOutlined />}
                      onClick={() => {
                        handleSendRequest(candId, candName);
                      }}
                      style={{
                        background: "linear-gradient(135deg, #e11d48, #be123c)",
                        borderColor: "#e11d48",
                        color: "#ffffff",
                        boxShadow: "0 4px 14px rgba(225, 29, 72, 0.35)",
                      }}
                    >
                      💌 Send Connection Request
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      className="up-biodata-lock-btn"
                      icon={<CrownOutlined />}
                      onClick={() => {
                        onClose();
                        switchTab("plans");
                      }}
                      style={{
                        background: "linear-gradient(135deg, #e11d48, #be123c)",
                        borderColor: "#e11d48",
                        color: "#ffffff",
                        boxShadow: "0 4px 14px rgba(225, 29, 72, 0.35)",
                      }}
                    >
                      👑 View Membership Plans
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. RELATED PROFILE SUGGESTIONS — PROPER CARDS, NO SCROLL LINE  */}
        {/* ============================================================== */}
        <div
          className="up-biodata-section-card"
          style={{
            background: "linear-gradient(180deg, #fffbfb 0%, #ffffff 100%)",
            border: "1.5px solid #fecdd3",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "14px",
            }}
          >
            <div>
              <h3 className="up-biodata-section-title" style={{ margin: 0 }}>
                <FireOutlined style={{ color: "#e11d48" }} /> संबंधित प्रोफाइल सुझाव (Related Profile Suggestions)
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                Compatible matches from {candCaste ? `${candCaste} Community` : "nearby districts"}
              </p>
            </div>
            <Tag color="magenta" style={{ borderRadius: "12px", fontWeight: "700" }}>
              {relatedProfiles.length} Matches Found
            </Tag>
          </div>

          {relatedProfiles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px", color: "#94a3b8", fontSize: "13px" }}>
              No other active candidates currently match this community filter.
            </div>
          ) : (
            /* Horizontal Scrollable Row without Scrollbar Line */
            <div className="up-no-scrollbar-row">
              {relatedProfiles.map((relCand) => {
                const relId = relCand.User_id || relCand.id;
                const relName = relCand.firstname || relCand.Full_Name || "Candidate";
                const relPic = getMediaUrl(
                  relCand.pic || relCand.Profile_Pic,
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                );
                const relAge = relCand.age || relCand.Age;
                const relHeight = relCand.height || relCand.Height;
                const relDist = relCand.district || relCand.District || relCand.city || "";
                const relState = relCand.state || relCand.State || "";
                const relCaste = relCand.caste || relCand.Caste || "";
                const relProf = relCand.profession || relCand.Profession || relCand.job_title || "";
                const isShortlisted = wishlistIds.includes(String(relId));

                return (
                  <div
                    key={relId}
                    className="up-related-card"
                    onClick={() => onSelectCandidate(relCand)}
                  >
                    <div>
                      {/* Photo Header */}
                      <div
                        style={{
                          height: "160px",
                          borderRadius: "14px",
                          overflow: "hidden",
                          position: "relative",
                          marginBottom: "10px",
                          background: "#ffe4e6",
                        }}
                      >
                        <img
                          src={relPic}
                          alt={relName}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center top",
                            display: "block",
                          }}
                        />
                        {relCaste && (
                          <span
                            style={{
                              position: "absolute",
                              top: "8px",
                              left: "8px",
                              background: "rgba(136, 19, 55, 0.85)",
                              color: "#ffffff",
                              padding: "2px 8px",
                              borderRadius: "10px",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            {relCaste}
                          </span>
                        )}
                        {(relAge || relHeight) && (
                          <span
                            style={{
                              position: "absolute",
                              bottom: "8px",
                              left: "8px",
                              background: "rgba(15, 23, 42, 0.8)",
                              color: "#ffffff",
                              padding: "2px 8px",
                              borderRadius: "10px",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            {relAge ? `${relAge} yrs` : ""}{relHeight ? ` • ${relHeight} cm` : ""}
                          </span>
                        )}
                      </div>

                      {/* Candidate Name & Info */}
                      <div
                        style={{
                          fontWeight: "800",
                          fontSize: "15px",
                          color: "#881337",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginBottom: "4px",
                        }}
                      >
                        {relName}
                      </div>

                      {relProf && (
                        <div
                          style={{
                            fontSize: "11.5px",
                            color: "#059669",
                            fontWeight: "700",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            marginBottom: "4px",
                          }}
                        >
                          💼 {relProf}
                        </div>
                      )}

                      {relDist && (
                        <div
                          style={{
                            fontSize: "11.5px",
                            color: "#64748b",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <EnvironmentOutlined style={{ color: "#e11d48" }} />
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {relDist}{relState ? `, ${relState}` : ""}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Strip */}
                    <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
                      <Button
                        type="primary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCandidate(relCand);
                        }}
                        style={{
                          flex: 1,
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "700",
                          height: "34px",
                          background: "linear-gradient(135deg, #e11d48, #be123c)",
                        }}
                      >
                        View Biodata →
                      </Button>
                      <Button
                        size="small"
                        icon={isShortlisted ? <HeartFilled style={{ color: "#e11d48" }} /> : <HeartOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(relId);
                        }}
                        style={{
                          borderRadius: "12px",
                          height: "34px",
                          width: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title={isShortlisted ? "Remove from Shortlist" : "Add to Shortlist"}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 4. DISTRICT SERVICES — ROW-WISE BASED ON SERVICES MODEL SEQUENCE */}
        {/* ============================================================== */}
        <div
          className="up-biodata-section-card"
          style={{
            background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
            border: "1.5px solid #cbd5e1",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <div>
              <h3 className="up-biodata-section-title" style={{ margin: 0, color: "#1e293b", borderBottom: "none", paddingBottom: 0 }}>
                <ShopOutlined style={{ color: "#0284c7" }} /> विवाह एवं आयोजन सेवाएं —{" "}
                {candDistrict ? `${candDistrict} जिला` : "स्थानीय सेवाएं"}
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#64748b" }}>
                {hasSpecificDistrictServices
                  ? `Verified wedding vendors & banquet halls in ${candDistrict}`
                  : `Top verified wedding partners available in ${candDistrict || "your area"}`}
              </p>
            </div>
            {candDistrict && (
              <Tag color="blue" style={{ borderRadius: "12px", fontWeight: "700", padding: "4px 12px" }}>
                📍 {candDistrict}
              </Tag>
            )}
          </div>

          {districtServicesGroupedByCategory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "13.5px" }}>
              No wedding service partners currently registered for this district.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {districtServicesGroupedByCategory.map((group) => (
                <div key={group.catId || group.catName} className="up-biodata-service-category-row">
                  {/* Category Header Row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                      paddingBottom: "8px",
                      borderBottom: "1.5px solid #e2e8f0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "18px" }}>{group.icon}</span>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "15px",
                          fontWeight: "800",
                          color: "#1e293b",
                        }}
                      >
                        {group.catName}
                      </h4>
                    </div>
                    <Tag
                      color="geekblue"
                      style={{
                        borderRadius: "10px",
                        fontWeight: "700",
                        fontSize: "11.5px",
                        margin: 0,
                      }}
                    >
                      {group.services.length} {group.services.length === 1 ? "Partner" : "Partners"}
                    </Tag>
                  </div>

                  {/* Horizontal Scrollable Row for this category without scrollbar line */}
                  <div className="up-no-scrollbar-row">
                    {group.services.map((service) => {
                      const sPic = getMediaUrl(service.Picture, null);

                      const contactNum = String(service.WP_Contact || service.Alt_Contact || "").replace(/\D/g, "");

                      return (
                        <div
                          key={service.id}
                          className="up-service-h-card"
                          onClick={() => onSelectService(service)}
                          style={{ cursor: "pointer" }}
                        >
                          <div>
                            {/* Service Photo with Badges */}
                            <div
                              style={{
                                height: "120px",
                                borderRadius: "14px",
                                overflow: "hidden",
                                background: "linear-gradient(135deg, #0284c7, #0369a1)",
                                position: "relative",
                                marginBottom: "10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {sPic ? (
                                <img
                                  src={sPic}
                                  alt={service.Service_Name}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                <div style={{ textAlign: "center", color: "#ffffff" }}>
                                  <ShopOutlined style={{ fontSize: "36px", opacity: 0.85 }} />
                                  <div style={{ fontSize: "12px", fontWeight: "700", marginTop: "4px" }}>
                                    {service.Service_Type || group.catName}
                                  </div>
                                </div>
                              )}
                              <span
                                style={{
                                  position: "absolute",
                                  top: "8px",
                                  left: "8px",
                                  background: "rgba(15, 23, 42, 0.85)",
                                  backdropFilter: "blur(4px)",
                                  color: "#ffffff",
                                  padding: "3px 10px",
                                  borderRadius: "10px",
                                  fontSize: "11px",
                                  fontWeight: "800",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                {group.icon} {service.Service_Type || group.catName}
                              </span>
                              {Boolean(service.Service_Price && Number(service.Service_Price) > 0) && (
                                <span
                                  style={{
                                    position: "absolute",
                                    bottom: "8px",
                                    right: "8px",
                                    background: "#059669",
                                    color: "#ffffff",
                                    padding: "2px 8px",
                                    borderRadius: "10px",
                                    fontSize: "11px",
                                    fontWeight: "800",
                                  }}
                                >
                                  ₹{Number(service.Service_Price).toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>

                            <div
                              style={{
                                fontWeight: "800",
                                fontSize: "14.5px",
                                color: "#0f172a",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                marginBottom: "4px",
                              }}
                            >
                              {service.Service_Name || "Service Partner"}
                            </div>

                            <div
                              style={{
                                fontSize: "11.5px",
                                color: "#64748b",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                marginBottom: "8px",
                              }}
                            >
                              <EnvironmentOutlined style={{ color: "#0284c7" }} />
                              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {service.City || service.District || "District Partner"}
                                {service.State ? `, ${service.State}` : ""}
                              </span>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                            <Button
                              type="primary"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectService(service);
                              }}
                              style={{
                                borderRadius: "10px",
                                fontSize: "12px",
                                fontWeight: "800",
                                height: "34px",
                                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                                borderColor: "transparent",
                                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                              }}
                            >
                              <BookOutlined /> View Service Biodata →
                            </Button>

                            <div style={{ display: "grid", gridTemplateColumns: contactNum ? "1fr 1fr" : "1fr", gap: "6px" }}>
                              {contactNum && (
                                <>
                                  <a
                                    href={`https://wa.me/91${contactNum}?text=${encodeURIComponent(
                                      `Hello! I am inquiring about your ${service.Service_Type || "wedding service"} in ${candDistrict || "district"} from Vaivaheek Manch.`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="ant-btn ant-btn-primary"
                                    style={{
                                      background: "#10b981",
                                      borderColor: "#10b981",
                                      color: "#ffffff",
                                      borderRadius: "10px",
                                      height: "30px",
                                      fontSize: "11px",
                                      fontWeight: "700",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: "4px",
                                      padding: "0 4px",
                                      textDecoration: "none",
                                    }}
                                  >
                                    <WhatsAppOutlined /> WhatsApp
                                  </a>
                                  <a
                                    href={`tel:${contactNum}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="ant-btn ant-btn-primary"
                                    style={{
                                      background: "#0284c7",
                                      borderColor: "#0284c7",
                                      color: "#ffffff",
                                      borderRadius: "10px",
                                      height: "30px",
                                      fontSize: "11px",
                                      fontWeight: "700",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: "4px",
                                      padding: "0 4px",
                                      textDecoration: "none",
                                    }}
                                  >
                                    <PhoneOutlined /> Call
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 5. FOOTER BAR (Print Option Removed)                           */}
        {/* ============================================================== */}
        <div className="up-biodata-footer-bar">
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={onClose}
              style={{
                borderRadius: "14px",
                fontWeight: "700",
                height: "38px",
              }}
            >
              Back to Profiles
            </Button>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
              Vaivaheek Manch Matrimonial ID: #{candId}
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Button
              type="primary"
              onClick={onClose}
              style={{
                borderRadius: "14px",
                fontWeight: "700",
                height: "38px",
                padding: "0 24px",
                background: "linear-gradient(135deg, #e11d48, #be123c)",
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Back to Profiles Button (Positioned above mobile footer menu) */}
      <div className="up-biodata-floating-back-wrap">
        <button
          type="button"
          className="up-biodata-floating-back-btn"
          onClick={onClose}
          aria-label="Back to Profiles"
        >
          <ArrowLeftOutlined style={{ fontSize: "14px" }} />
          <span>Back to Profiles</span>
        </button>
      </div>
    </div>
  );
};

export default UserBiodataModal;
