import React, { useMemo } from "react";
import { Button, Tag, Image, message } from "antd";
import { getMediaUrl } from "../../Config/Config";
import {
  EyeOutlined,
  PhoneOutlined,
  WhatsAppOutlined,
  EnvironmentOutlined,
  BookOutlined,
  ShopOutlined,
  ArrowLeftOutlined,
  ShareAltOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";

/**
 * Modern thematic emoji/icon helper for wedding vendor categories
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

/**
 * ServiceBiodataModal
 * --------------------------------------------------------------------------
 * Mobile-friendly wedding service vendor biodata view.
 * Strictly presents model data: Service_Name, Picture, Service_Type,
 * Service_Description, Service_Price, WP_Contact, Alt_Contact,
 * City, District, State, Country, Available_Zone, Full_Address, Like.
 * (valid_upto, register date, and service id removed from cards).
 */
const ServiceBiodataModal = ({
  open,
  onClose,
  service,
  user = {},
  user_id,
  baseurl = "",
  servicesList = [],
  serviceCategories = [],
  onSelectService = () => {},
  returnToCandidate = null,
  onBackToCandidate = () => {},
}) => {
  const s = service || {};
  const sId = s.id;
  const sName = s.Service_Name || "Wedding Service Partner";
  const sType = s.Service_Type || "Wedding Vendor";
  const sPrice = s.Service_Price;
  const sDesc = s.Service_Description || "";
  const sCity = s.City || "";
  const sDistrict = s.District || "";
  const sState = s.State || "";
  const sCountry = s.Country || "India";
  const sAddress = s.Full_Address || "";
  const sWpContact = String(s.WP_Contact || "").trim();
  const sAltContact = String(s.Alt_Contact || "").trim();
  const likesCount = Array.isArray(s.Like) ? s.Like.length : 0;

  // Parse covered zones from model
  const parsedZones = useMemo(() => {
    let zones = s.Available_Zone;
    if (typeof zones === "string") {
      try {
        zones = JSON.parse(zones);
      } catch {
        zones = zones.split(",").map((z) => z.trim());
      }
    }
    if (!Array.isArray(zones)) return [];
    return zones.filter(Boolean);
  }, [s.Available_Zone]);

  // Main Photo URL from Picture field
  const sPic = useMemo(() => {
    return getMediaUrl(s.Picture, null);
  }, [s.Picture]);

  // Phone numbers from WP_Contact and Alt_Contact
  const primaryPhone = sWpContact.replace(/\D/g, "") || sAltContact.replace(/\D/g, "");
  const callPhone = sAltContact.replace(/\D/g, "") || primaryPhone;

  // WhatsApp prefilled message
  const waMessage = useMemo(() => {
    const loc = [sCity, sDistrict].filter(Boolean).join(", ");
    return `Namaste ${sName}! I found your ${sType} listing on Vaivaheek Manch${loc ? ` (${loc})` : ""}. I would like to inquire about booking & availability.`;
  }, [sName, sType, sCity, sDistrict]);

  const handleShare = () => {
    const details = [
      `${sName} (${sType})`,
      [sCity, sDistrict, sState].filter(Boolean).join(", "),
      sPrice ? `Price: ₹${Number(sPrice).toLocaleString("en-IN")}` : "",
      primaryPhone ? `Contact: +91 ${primaryPhone}` : "",
    ].filter(Boolean).join("\n");

    if (navigator.clipboard) {
      navigator.clipboard.writeText(details);
      message.success("Service partner details copied to clipboard!");
    }
  };

  // Other wedding services in the same district, sorted strictly by Services model category sequence
  const relatedServices = useMemo(() => {
    if (!Array.isArray(servicesList) || servicesList.length === 0) return [];
    const targetDist = String(sDistrict || sCity || "").toLowerCase().trim();

    // Map category ID ordering from Services model (id: 1 first, then 2, 3...)
    const categoryOrderMap = {};
    (serviceCategories || []).forEach((cat, index) => {
      const catId = cat.id !== undefined ? Number(cat.id) : index + 1;
      const catName = String(cat.Service_Name || "").toLowerCase().trim();
      const catType = String(cat.Service_Type || "").toLowerCase().trim();
      if (catName) categoryOrderMap[catName] = catId;
      if (catType) categoryOrderMap[catType] = catId;
    });

    const pool = servicesList.filter((item) => {
      if (String(item.id) === String(sId)) return false;
      if (item.Active === false || item.is_active === false) return false;

      if (!targetDist) return true;
      const itemDist = String(item.District || item.City || "").toLowerCase().trim();
      let itemZones = item.Available_Zone;
      if (typeof itemZones === "string") {
        try {
          itemZones = JSON.parse(itemZones);
        } catch {
          itemZones = itemZones.split(",").map((z) => z.trim());
        }
      }
      const zoneMatch = Array.isArray(itemZones) && itemZones.some((z) => {
        const zStr = String(z).toLowerCase().trim();
        return zStr === "all" || zStr === targetDist;
      });

      return itemDist === targetDist || itemDist.includes(targetDist) || targetDist.includes(itemDist) || zoneMatch;
    });

    const listToOrder = pool.length > 0 ? pool : servicesList.filter((item) => String(item.id) !== String(sId));

    return [...listToOrder].sort((a, b) => {
      const typeA = String(a.Service_Type || a.Service_Name || "").toLowerCase().trim();
      const typeB = String(b.Service_Type || b.Service_Name || "").toLowerCase().trim();
      const orderA = categoryOrderMap[typeA] !== undefined ? categoryOrderMap[typeA] : 9999;
      const orderB = categoryOrderMap[typeB] !== undefined ? categoryOrderMap[typeB] : 9999;
      if (orderA !== orderB) return orderA - orderB;
      return (Number(a.id) || 0) - (Number(b.id) || 0);
    }).slice(0, 16);
  }, [servicesList, serviceCategories, sDistrict, sCity, sId]);

  if (!open || !service) return null;

  return (
    <div className="up-biodata-page-view up-service-biodata-view" style={{ minHeight: "100vh" }}>
      {/* ============================================================== */}
      {/* TOP STICKY HEADER NAVIGATION BAR (Desktop Only - Hidden on Mobile) */}
      {/* ============================================================== */}
      <div className="up-biodata-header-bar up-service-header-bar">
        <div className="up-biodata-header-left">
          {returnToCandidate ? (
            <Button
              className="up-biodata-back-btn"
              icon={<ArrowLeftOutlined />}
              onClick={onBackToCandidate}
            >
              <span>Back to Candidate Profile</span>
            </Button>
          ) : (
            <Button
              className="up-biodata-back-btn"
              icon={<ArrowLeftOutlined />}
              onClick={onClose}
            >
              <span>Back to Services</span>
            </Button>
          )}

          <Tag color="purple" style={{ borderRadius: "10px", fontWeight: "800", fontSize: "12px", padding: "3px 10px", margin: 0 }}>
            {getCategoryIcon(sType)} {sType}
          </Tag>
        </div>

        <div className="up-biodata-header-right">
          {s.Admin_Approval && (
            <Tag color="green" style={{ borderRadius: "10px", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: 4, margin: 0 }}>
              <CheckCircleFilled /> Verified
            </Tag>
          )}
          <Button
            type="primary"
            onClick={onClose}
            style={{
              borderRadius: "14px",
              fontWeight: "700",
              height: "36px",
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              borderColor: "transparent",
            }}
          >
            Close
          </Button>
        </div>
      </div>

      <div className="up-biodata-modal-body">
        {/* ============================================================== */}
        {/* 1. SERVICE HERO SHOWCASE (Mobile Friendly, Fit to Screen)      */}
        {/* ============================================================== */}
        <div
          className="up-biodata-hero"
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            borderLeft: "6px solid #4f46e5",
            boxShadow: "0 10px 32px rgba(79, 70, 229, 0.08)",
          }}
        >
          {/* Vendor Showcase Photo with Lightbox */}
          <div className="up-service-biodata-avatar-wrap">
            <div className="up-service-biodata-avatar">
              {sPic ? (
                <Image
                  src={sPic}
                  alt={sName}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
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
                        <EyeOutlined /> View Photo
                      </div>
                    ),
                  }}
                  fallback="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80"
                />
              ) : (
                <div style={{ textAlign: "center", color: "#ffffff", padding: "20px" }}>
                  <ShopOutlined style={{ fontSize: "52px", opacity: 0.9 }} />
                  <div style={{ fontSize: "15px", fontWeight: "800", marginTop: "8px" }}>
                    {sType}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Identity & Model Fields */}
          <div className="up-biodata-hero-info">
            <div className="up-biodata-hero-title-row">
              <h2 className="up-biodata-hero-name" style={{ color: "#0f172a", fontSize: "24px" }}>
                {sName}
              </h2>
              <Tag
                color="purple"
                style={{ borderRadius: "14px", fontWeight: "800", padding: "4px 12px", fontSize: "12.5px" }}
              >
                {getCategoryIcon(sType)} {sType}
              </Tag>
            </div>

            <div className="up-biodata-hero-location" style={{ fontSize: "13.5px", color: "#475569" }}>
              <EnvironmentOutlined style={{ marginRight: 6, color: "#e11d48", fontSize: "15px" }} />
              {[sCity, sDistrict, sState, sCountry].filter(Boolean).join(", ")}
            </div>

            {/* Model Data Chips (Removed Valid Upto, Register Date, Service ID) */}
            <div className="up-biodata-hero-highlights" style={{ marginTop: "12px" }}>
              {sPrice ? (
                <span className="up-hero-hl-chip" style={{ background: "#ecfdf5", borderColor: "#a7f3d0", color: "#047857", fontSize: "13px" }}>
                  💰 Starting Price: <strong>₹{Number(sPrice).toLocaleString("en-IN")}</strong>
                </span>
              ) : null}
              {sDistrict && (
                <span className="up-hero-hl-chip">
                  📍 District: <strong>{sDistrict}</strong>
                </span>
              )}
              {likesCount > 0 && (
                <span className="up-hero-hl-chip" style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}>
                  👍 <strong>{likesCount} Likes</strong>
                </span>
              )}
            </div>

            {/* Direct Action Booking Buttons from Model Contacts */}
            <div className="up-service-hero-actions">
              <div className="up-service-hero-primary-btns">
                {primaryPhone && (
                  <a
                    href={`https://wa.me/91${primaryPhone}?text=${encodeURIComponent(waMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="up-service-wa-btn"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "#ffffff",
                      borderRadius: "14px",
                      fontWeight: "800",
                      padding: "10px 16px",
                      textDecoration: "none",
                      fontSize: "13.5px",
                      boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                      flex: 1,
                    }}
                  >
                    <WhatsAppOutlined style={{ fontSize: "17px" }} /> WhatsApp Inquiry
                  </a>
                )}

                {callPhone && (
                  <a
                    href={`tel:${callPhone}`}
                    className="up-service-call-btn"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      background: "linear-gradient(135deg, #0284c7, #0369a1)",
                      color: "#ffffff",
                      borderRadius: "14px",
                      fontWeight: "800",
                      padding: "10px 16px",
                      textDecoration: "none",
                      fontSize: "13.5px",
                      boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
                      flex: 1,
                    }}
                  >
                    <PhoneOutlined style={{ fontSize: "16px" }} />
                    <span className="up-back-desktop-text">Call Partner (+91 {callPhone})</span>
                    <span className="up-back-mobile-text">Call Now</span>
                  </a>
                )}
              </div>

              <Button
                icon={<ShareAltOutlined />}
                onClick={handleShare}
                className="up-service-share-btn"
                style={{
                  borderRadius: "14px",
                  fontWeight: "700",
                  height: "42px",
                  borderColor: "#cbd5e1",
                  color: "#334155",
                }}
              >
                Share Profile
              </Button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. MODEL DATA SECTIONS                                         */}
        {/* ============================================================== */}
        <div className="up-biodata-sections">
          {/* Section 1: Service Information (Removed Valid Upto, Register Date, Service ID) */}
          <div className="up-biodata-section-card">
            <h3 className="up-biodata-section-title">
              <ShopOutlined style={{ color: "#4f46e5" }} /> विवरण एवं सेवा जानकारी (Service Details)
            </h3>
            <div className="up-biodata-grid">
              <div className="up-biodata-item up-biodata-item-full">
                <span className="up-biodata-label">Service Name (सेवा का नाम)</span>
                <span className="up-biodata-val" style={{ fontWeight: "800", color: "#0f172a" }}>
                  {sName}
                </span>
              </div>
              <div className="up-biodata-item">
                <span className="up-biodata-label">Service Type (सेवा का प्रकार)</span>
                <span className="up-biodata-val">
                  <Tag color="purple" style={{ borderRadius: "8px", fontWeight: "700", fontSize: "12px", margin: 0 }}>
                    {getCategoryIcon(sType)} {sType}
                  </Tag>
                </span>
              </div>
              <div className="up-biodata-item">
                <span className="up-biodata-label">Service Price (शुल्क)</span>
                <span className="up-biodata-val" style={{ color: "#059669", fontWeight: "800", fontSize: "15px" }}>
                  {sPrice ? `₹${Number(sPrice).toLocaleString("en-IN")}` : "—"}
                </span>
              </div>
              <div className="up-biodata-item">
                <span className="up-biodata-label">Status (स्थिति)</span>
                <span className="up-biodata-val" style={{ color: s.Active ? "#16a34a" : "#dc2626", fontWeight: "700" }}>
                  {s.Active ? "Active" : "Inactive"}
                </span>
              </div>
              {sDesc && (
                <div className="up-biodata-item up-biodata-item-full">
                  <span className="up-biodata-label">Service Description (सेवा का विवरण)</span>
                  <span className="up-biodata-val" style={{ whiteSpace: "pre-line", fontWeight: "500", lineHeight: "1.6" }}>
                    {sDesc}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Location & Service Coverage */}
          <div className="up-biodata-section-card">
            <h3 className="up-biodata-section-title">
              <EnvironmentOutlined style={{ color: "#e11d48" }} /> स्थान एवं कार्य क्षेत्र (Location & Coverage Areas)
            </h3>
            <div className="up-biodata-grid">
              <div className="up-biodata-item">
                <span className="up-biodata-label">City (शहर)</span>
                <span className="up-biodata-val">{sCity || "—"}</span>
              </div>
              <div className="up-biodata-item">
                <span className="up-biodata-label">District (जिला)</span>
                <span className="up-biodata-val">{sDistrict || "—"}</span>
              </div>
              <div className="up-biodata-item">
                <span className="up-biodata-label">State (राज्य)</span>
                <span className="up-biodata-val">{sState || "—"}</span>
              </div>
              <div className="up-biodata-item">
                <span className="up-biodata-label">Country (देश)</span>
                <span className="up-biodata-val">{sCountry || "India"}</span>
              </div>
              {sAddress && (
                <div className="up-biodata-item up-biodata-item-full">
                  <span className="up-biodata-label">Full Address (पूर्ण पता)</span>
                  <span className="up-biodata-val">{sAddress}</span>
                </div>
              )}
            </div>

            {/* Covered Booking Zones from Available_Zone */}
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                Available Service Zones (सेवा प्रदाय क्षेत्र):
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {parsedZones.length === 0 ? (
                  <Tag color="blue" style={{ borderRadius: "8px", padding: "3px 10px", fontWeight: "700" }}>
                    📍 {sDistrict || sCity || "Local District"}
                  </Tag>
                ) : (
                  parsedZones.map((z, idx) => (
                    <Tag
                      key={idx}
                      color={String(z).toLowerCase() === "all" ? "purple" : "default"}
                      style={{
                        borderRadius: "10px",
                        fontWeight: "600",
                        padding: "4px 12px",
                        fontSize: "12px",
                      }}
                    >
                      {String(z).toLowerCase() === "all" ? "🌐 All Districts" : `📍 ${z}`}
                    </Tag>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Contact Details */}
          <div className="up-biodata-section-card">
            <h3 className="up-biodata-section-title">
              <PhoneOutlined style={{ color: "#059669" }} /> संपर्क सूत्र (Contact Details)
            </h3>
            <div className="up-biodata-grid">
              <div className="up-biodata-item">
                <span className="up-biodata-label">WhatsApp Contact (व्हाट्सएप नंबर)</span>
                <span className="up-biodata-val">
                  {primaryPhone ? (
                    <a
                      href={`https://wa.me/91${primaryPhone}?text=${encodeURIComponent(waMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#059669", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: 6, fontSize: "15px" }}
                    >
                      <WhatsAppOutlined /> +91 {primaryPhone}
                    </a>
                  ) : "—"}
                </span>
              </div>
              <div className="up-biodata-item">
                <span className="up-biodata-label">Alternate Calling Contact (कॉलिंग नंबर)</span>
                <span className="up-biodata-val">
                  {callPhone ? (
                    <a
                      href={`tel:${callPhone}`}
                      style={{ color: "#0284c7", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: 6, fontSize: "15px" }}
                    >
                      <PhoneOutlined /> +91 {callPhone}
                    </a>
                  ) : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Related Wedding Services in District */}
          {relatedServices.length > 0 && (
            <div className="up-biodata-section-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <h3 className="up-biodata-section-title" style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>
                    <ShopOutlined style={{ color: "#7c3aed" }} /> इस जिले की अन्य सेवाएं (Other Services in {sDistrict || "District"})
                  </h3>
                </div>
                {sDistrict && (
                  <Tag color="purple" style={{ borderRadius: "12px", fontWeight: "800", padding: "3px 12px" }}>
                    📍 {sDistrict}
                  </Tag>
                )}
              </div>

              <div className="up-no-scrollbar-row">
                {relatedServices.map((rService) => {
                  const rPic = getMediaUrl(rService.Picture, null);
                  const rContact = String(rService.WP_Contact || rService.Alt_Contact || "").replace(/\D/g, "");

                  return (
                    <div
                      key={rService.id}
                      className="up-service-h-card"
                      onClick={() => onSelectService(rService)}
                      style={{ cursor: "pointer" }}
                    >
                      <div>
                        {/* Service Photo */}
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
                          {rPic ? (
                            <img
                              src={rPic}
                              alt={rService.Service_Name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <div style={{ textAlign: "center", color: "#ffffff" }}>
                              <ShopOutlined style={{ fontSize: "36px", opacity: 0.85 }} />
                              <div style={{ fontSize: "12px", fontWeight: "700", marginTop: "4px" }}>
                                {rService.Service_Type || "Wedding Service"}
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
                            {getCategoryIcon(rService.Service_Type)} {rService.Service_Type || "Vendor"}
                          </span>
                          {rService.Service_Price && (
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
                              ₹{Number(rService.Service_Price).toLocaleString("en-IN")}
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
                          {rService.Service_Name || "Service Partner"}
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
                            {rService.City || rService.District || "District Partner"}
                            {rService.State ? `, ${rService.State}` : ""}
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
                            onSelectService(rService);
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

                        <div style={{ display: "grid", gridTemplateColumns: rContact ? "1fr 1fr" : "1fr", gap: "6px" }}>
                          {rContact && (
                            <>
                              <a
                                href={`https://wa.me/91${rContact}?text=${encodeURIComponent(
                                  `Hello! I am inquiring about your ${rService.Service_Type || "wedding service"} in ${sDistrict || "district"} from Vaivaheek Manch.`
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
                                href={`tel:${rContact}`}
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
          )}
        </div>

        {/* ============================================================== */}
        {/* FOOTER BAR (Desktop Only)                                      */}
        {/* ============================================================== */}
        <div className="up-biodata-footer-bar">
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {returnToCandidate ? (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={onBackToCandidate}
                style={{ borderRadius: "14px", fontWeight: "700", height: "38px" }}
              >
                Back to Candidate Profile
              </Button>
            ) : (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={onClose}
                style={{ borderRadius: "14px", fontWeight: "700", height: "38px" }}
              >
                Back to Services
              </Button>
            )}
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
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                borderColor: "transparent",
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Back Button on mobile */}
      <div className="up-biodata-floating-back-wrap">
        <button
          type="button"
          className="up-biodata-floating-back-btn"
          onClick={returnToCandidate ? onBackToCandidate : onClose}
          aria-label="Back"
          style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
        >
          <ArrowLeftOutlined style={{ fontSize: "14px" }} />
          <span>{returnToCandidate ? "Back to Candidate" : "Back to Services"}</span>
        </button>
      </div>
    </div>
  );
};

export default ServiceBiodataModal;
