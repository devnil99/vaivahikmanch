import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Row,
  Col,
  Space,
  Popconfirm,
  message,
  Drawer,
  Image,
  Radio,
  Divider,
  Tooltip,
  Tabs,
  Steps,
  Alert,
  Segmented,
} from "antd";
import {
  LeftOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  UserOutlined,
  TeamOutlined,
  ShopOutlined,
  WalletOutlined,
  IdcardOutlined,
  CrownOutlined,
  AppstoreOutlined,
  CustomerServiceOutlined,
  SettingOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuOutlined,
  SafetyCertificateOutlined,
  DollarCircleOutlined,
  HeartOutlined,
  GlobalOutlined,
  ApartmentOutlined,
  SmileOutlined,
  PhoneOutlined,
  UserAddOutlined,
  CreditCardOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  FilterOutlined,
  ClearOutlined,
  WhatsAppOutlined,
  DownloadOutlined,
  CopyOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../../Api/Api";
import {
  UserGet,
  UserUpdate,
  UserRemove,
  UserDataGetwt,
  UserDataUpdate,
  UserDataToggleActive,
  UserDataRemove,
  WishListGet,
  WishListUpdate,
  WishListRemove,
  StaffDataGet,
  StaffDataUpdate,
  StaffDataRemove,
  StaffTransactionsGet,
  StaffTransactionsPost,
  StaffTransactionsUpdate,
  StaffCommissionGet,
  ServiceDataGet,
  ServiceDataUpdate,
  ServiceDataRemove,
  ServicesGet,
  ServicesPost,
  ServicesUpdate,
  ServicesRemove,
  ServiceChargeGet,
  ServiceChargePost,
  ServiceChargeUpdate,
  ServiceChargeRemove,
  User_StateGet,
  User_StatePost,
  User_StateUpdate,
  User_StateRemove,
  NearDistGet,
  NearDistPost,
  NearDistUpdate,
  NearDistRemove,
  PlansGet,
  PlansPost,
  PlansUpdate,
  PlansRemove,
  HelpGet,
  HelpUpdate,
  HelpRemove,
  SuccessStoryGet,
  SuccessStoryPost,
  SuccessStoryUpdate,
  SuccessStoryRemove,
  UserTransactionsGet,
  UserTransactionsPost,
  ServiceTransactionsGet,
  ProfessionGet,
  ProfessionPost,
  ProfessionUpdate,
  ProfessionRemove,
  ReligionGet,
  ReligionPost,
  ReligionUpdate,
  ReligionRemove,
  User_CasteGet,
  User_CastePost,
  User_CasteUpdate,
  User_CasteRemove,
  LanguageGet,
  LanguagePost,
  LanguageUpdate,
  LanguageRemove,
  ColorGet,
  ColorPost,
  ColorUpdate,
  ColorRemove,
  PhoneOTPGet,
  PhoneOTPRemove,
} from "../../Api/CoreApi";
import "./AdminPanel.css";

const { Option } = Select;
const { TextArea } = Input;

const S3_MEDIA_BASE_URL = "https://risteybucket.s3.ap-south-1.amazonaws.com/";

// Backend Media Asset Absolute URL Resolver (Maps directly to S3)
const getMediaUrl = (url) => {
  if (!url) return "";
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:")) return trimmed;
  const localMatch = trimmed.match(/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\/(?:media\/)?(.*)$/i);
  if (localMatch && localMatch[1]) {
    return `${S3_MEDIA_BASE_URL}${localMatch[1].replace(/^\/+/, "")}`;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const cleanPath = trimmed.replace(/^\/+/, "").replace(/^media\//, "");
  return `${S3_MEDIA_BASE_URL}${cleanPath}`;
};

// Matrimonial Date Formatter matching UserPanel
const formatDate = (dateVal) => {
  if (!dateVal) return "";
  try {
    const s = String(dateVal).trim();
    const ymd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymd) {
      const year = ymd[1];
      const month = ymd[2].padStart(2, "0");
      const day = ymd[3].padStart(2, "0");
      return `${day}-${month}-${year}`;
    }
    const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
    if (dmy) {
      const day = dmy[1].padStart(2, "0");
      const month = dmy[2].padStart(2, "0");
      const year = dmy[3];
      return `${day}-${month}-${year}`;
    }
    return s.slice(0, 10);
  } catch {
    return String(dateVal);
  }
};

// Helper to determine contact relation and clean contact person name matching UserPanel
const getContactRelationDisplay = (
  relation,
  name,
  phone,
  candidateName = "",
  fatherName = "",
  motherName = ""
) => {
  const phoneStr = String(phone || "").trim();
  const rawNameStr = String(name || "").trim();
  const candNameStr = String(candidateName || "").trim();
  const isNumericOnly = /^\d+$/.test(rawNameStr);
  const isSameAsPhone = phoneStr && rawNameStr.includes(phoneStr);
  const cleanName = rawNameStr && !isNumericOnly && !isSameAsPhone ? rawNameStr : null;

  const KNOWN_RELATIONS = ["Self", "Father", "Mother", "Brother", "Sister", "Guardian", "Relative"];
  let rel = relation;
  if (!rel && cleanName && KNOWN_RELATIONS.includes(cleanName)) {
    rel = cleanName;
  }
  if (!rel) {
    rel = "Self";
  }

  const relLabels = {
    Self: "Self (कैंडिडेट स्वयं)",
    Father: "Father (पिताजी)",
    Mother: "Mother (माताजी)",
    Brother: "Brother (भाई)",
    Sister: "Sister (बहन)",
    Guardian: "Guardian (अभिभावक)",
    Relative: "Relative (रिश्तेदार)",
  };

  const relationLabel = relLabels[rel] || rel || "Self (स्वयं)";

  let personName = null;
  if (rel === "Self") {
    personName = cleanName && cleanName !== "Self" ? cleanName : candNameStr || "Candidate";
  } else if (cleanName && cleanName !== rel) {
    personName = cleanName;
  } else if (rel === "Father" && fatherName) {
    personName = String(fatherName).trim();
  } else if (rel === "Mother" && motherName) {
    personName = String(motherName).trim();
  }

  return {
    relation: rel,
    relationLabel,
    personName,
  };
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Authentication & Admin Role Gatekeeper
  const token = localStorage.getItem("access_token");
  const role = (localStorage.getItem("role") || "").toLowerCase().trim();
  const username = localStorage.getItem("username") || "Administrator";

  useEffect(() => {
    if (!token || (role !== "admin" && role !== "superadmin")) {
      message.warning("Administrator access required. Please login.");
      navigate("/AdminLogin");
    }
  }, [token, role, navigate]);

  // Backwards-Compatible Active Tab Resolver
  const rawTab = searchParams.get("tab") || "dashboard";
  const activeTab = useMemo(() => {
    if (["platform_finance", "revenue", "treasury", "ledger"].includes(rawTab)) return "platform_finance";
    if (rawTab === "candidates") return "user_profiles";
    if (rawTab === "matchmaking") return "user_matchmaking";
    if (rawTab === "staff") return "staff_counselors";
    if (rawTab === "finance") return "staff_withdrawals";
    if (rawTab === "services") return "service_partners";
    if (rawTab === "plans") return "user_subscriptions";
    if (rawTab === "locations") return "master_geography";
    if (rawTab === "attributes") return "master_attributes";
    if (rawTab === "help") return "master_help";
    if (rawTab === "stories") return "master_stories";
    if (rawTab === "system") return "master_security";
    return rawTab;
  }, [rawTab]);

  const switchTab = (newTab) => {
    setSearchParams({ tab: newTab });
    setMobileDrawerOpen(false);
  };

  // Active High-Level Management Portal (executive | user | staff | service | criteria | geography | engagement | security | explorer)
  const activePortal = useMemo(() => {
    if (activeTab === "dashboard") return "executive";
    if (activeTab === "platform_finance") return "finance";
    if (activeTab.startsWith("user_")) return "user";
    if (activeTab.startsWith("staff_")) return "staff";
    if (activeTab.startsWith("service_")) return "service";
    if (activeTab === "master_attributes") return "criteria";
    if (activeTab === "master_geography") return "geography";
    if (["master_help", "master_stories"].includes(activeTab)) return "engagement";
    if (activeTab === "master_security") return "security";
    if (activeTab === "model_explorer") return "explorer";
    if (activeTab.startsWith("master_")) return "criteria";
    return "executive";
  }, [activeTab]);

  const switchPortal = (portalKey) => {
    if (portalKey === "executive") switchTab("dashboard");
    else if (portalKey === "finance") switchTab("platform_finance");
    else if (portalKey === "user") switchTab("user_dashboard");
    else if (portalKey === "staff") switchTab("staff_dashboard");
    else if (portalKey === "service") switchTab("service_dashboard");
    else if (portalKey === "criteria") switchTab("master_attributes");
    else if (portalKey === "geography") switchTab("master_geography");
    else if (portalKey === "engagement") switchTab("master_help");
    else if (portalKey === "security") switchTab("master_security");
    else if (portalKey === "explorer") switchTab("model_explorer");
    else if (portalKey === "master") switchTab("master_attributes");
  };

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  // Sub-tabs states for multi-sub views
  const [locationSubTab, setLocationSubTab] = useState("states"); // states | neardist
  const [attributeSubTab, setAttributeSubTab] = useState("religion"); // religion | caste | profession | language | color
  const [systemSubTab, setSystemSubTab] = useState("users"); // users | otp

  // Universal Model & Field Explorer State
  const [selectedExplorerModel, setSelectedExplorerModel] = useState("User_Data");
  const [explorerSearch, setExplorerSearch] = useState("");
  const [inspectRecord, setInspectRecord] = useState(null);
  const [isInspectDrawerOpen, setIsInspectDrawerOpen] = useState(false);
  const [inspectRawJsonView, setInspectRawJsonView] = useState(false);
  const [drawerFieldSearch, setDrawerFieldSearch] = useState("");
  const [dashboardActionFilter, setDashboardActionFilter] = useState("all"); // "all" | "staff" | "service" | "payout" | "help"

  // -------------------------------------------------------------
  // ALL 22 BACKEND MODELS DATA STATES
  // -------------------------------------------------------------
  const [usersList, setUsersList] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [wishlists, setWishlists] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [staffTxns, setStaffTxns] = useState([]);
  const [staffCommission, setStaffCommission] = useState(null);
  const [servicesList, setServicesList] = useState([]);
  const [serviceTxns, setServiceTxns] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [serviceCharges, setServiceCharges] = useState([]);
  const [userTxns, setUserTxns] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [nearDistList, setNearDistList] = useState([]);
  const [plansList, setPlansList] = useState([]);
  const [successStories, setSuccessStories] = useState([]);
  const [religions, setReligions] = useState([]);
  const [castes, setCastes] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [colors, setColors] = useState([]);
  const [helpTickets, setHelpTickets] = useState([]);
  const [phoneOtps, setPhoneOtps] = useState([]);

  // -------------------------------------------------------------
  // FETCH ALL DATA ACROSS ALL MODELS
  // -------------------------------------------------------------
  const fetchAllData = useCallback(async () => {
    setRefreshLoading(true);
    try {
      const results = await Promise.allSettled([
        UserGet(),
        UserDataGetwt({ scope: "all" }),
        WishListGet({ scope: "all" }),
        StaffDataGet({ scope: "all" }),
        StaffTransactionsGet({ scope: "all" }),
        StaffCommissionGet(),
        ServiceDataGet({ scope: "all" }),
        ServiceTransactionsGet({ scope: "all" }),
        ServicesGet(),
        ServiceChargeGet(),
        UserTransactionsGet({ scope: "all" }),
        User_StateGet(),
        NearDistGet(),
        PlansGet({ scope: "all" }),
        SuccessStoryGet(),
        ReligionGet(),
        User_CasteGet(),
        ProfessionGet(),
        LanguageGet(),
        ColorGet(),
        HelpGet({ scope: "all" }),
        PhoneOTPGet(),
      ]);

      const [
        usersRes,
        candidatesRes,
        wishlistRes,
        staffRes,
        staffTxnRes,
        commRes,
        serviceRes,
        serviceTxnRes,
        catRes,
        chargeRes,
        userTxnRes,
        stateRes,
        nearRes,
        planRes,
        storyRes,
        relRes,
        casteRes,
        profRes,
        langRes,
        colRes,
        helpRes,
        otpRes,
      ] = results;

      if (usersRes.status === "fulfilled") setUsersList(Array.isArray(usersRes.value) ? usersRes.value : usersRes.value?.results || []);
      if (candidatesRes.status === "fulfilled") setCandidates(Array.isArray(candidatesRes.value) ? candidatesRes.value : candidatesRes.value?.results || []);
      if (wishlistRes.status === "fulfilled") setWishlists(Array.isArray(wishlistRes.value) ? wishlistRes.value : wishlistRes.value?.results || []);
      if (staffRes.status === "fulfilled") setStaffList(Array.isArray(staffRes.value) ? staffRes.value : staffRes.value?.results || []);
      if (staffTxnRes.status === "fulfilled") setStaffTxns(Array.isArray(staffTxnRes.value) ? staffTxnRes.value : staffTxnRes.value?.results || []);
      if (commRes.status === "fulfilled") {
        const commData = commRes.value;
        setStaffCommission(Array.isArray(commData) ? commData[0] : commData);
      }
      if (serviceRes.status === "fulfilled") setServicesList(Array.isArray(serviceRes.value) ? serviceRes.value : serviceRes.value?.results || []);
      if (serviceTxnRes.status === "fulfilled") setServiceTxns(Array.isArray(serviceTxnRes.value) ? serviceTxnRes.value : serviceTxnRes.value?.results || []);
      if (catRes.status === "fulfilled") setServiceCategories(Array.isArray(catRes.value) ? catRes.value : catRes.value?.results || []);
      if (chargeRes.status === "fulfilled") setServiceCharges(Array.isArray(chargeRes.value) ? chargeRes.value : chargeRes.value?.results || []);
      if (userTxnRes.status === "fulfilled") setUserTxns(Array.isArray(userTxnRes.value) ? userTxnRes.value : userTxnRes.value?.results || []);
      if (stateRes.status === "fulfilled") setStatesList(Array.isArray(stateRes.value) ? stateRes.value : stateRes.value?.results || []);
      if (nearRes.status === "fulfilled") setNearDistList(Array.isArray(nearRes.value) ? nearRes.value : nearRes.value?.results || []);
      if (planRes.status === "fulfilled") setPlansList(Array.isArray(planRes.value) ? planRes.value : planRes.value?.results || []);
      if (storyRes.status === "fulfilled") setSuccessStories(Array.isArray(storyRes.value) ? storyRes.value : storyRes.value?.results || []);
      if (relRes.status === "fulfilled") setReligions(Array.isArray(relRes.value) ? relRes.value : relRes.value?.results || []);
      if (casteRes.status === "fulfilled") setCastes(Array.isArray(casteRes.value) ? casteRes.value : casteRes.value?.results || []);
      if (profRes.status === "fulfilled") setProfessions(Array.isArray(profRes.value) ? profRes.value : profRes.value?.results || []);
      if (langRes.status === "fulfilled") setLanguages(Array.isArray(langRes.value) ? langRes.value : langRes.value?.results || []);
      if (colRes.status === "fulfilled") setColors(Array.isArray(colRes.value) ? colRes.value : colRes.value?.results || []);
      if (helpRes.status === "fulfilled") setHelpTickets(Array.isArray(helpRes.value) ? helpRes.value : helpRes.value?.results || []);
      if (otpRes.status === "fulfilled") setPhoneOtps(Array.isArray(otpRes.value) ? otpRes.value : otpRes.value?.results || []);
    } catch (err) {
      console.error("Error loading complete platform models:", err);
    } finally {
      setRefreshLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // -------------------------------------------------------------
  // COMPUTED EXECUTIVE METRICS
  // -------------------------------------------------------------
  const pendingStaffCount = useMemo(() => staffList.filter((s) => !s.is_approved).length, [staffList]);
  const pendingServiceCount = useMemo(() => servicesList.filter((s) => s.Admin_Approval === false).length, [servicesList]);
  const pendingWithdrawalCount = useMemo(() => staffTxns.filter((t) => (t.Type === "Withdrawal" || !t.Type) && t.Status === "Pending").length, [staffTxns]);
  const unansweredHelpCount = useMemo(() => helpTickets.filter((h) => !h.Answer || !h.Answer.trim()).length, [helpTickets]);

  // Track seen Help & Support tickets by Admin (only unread/unseen inquiries show count in side menu)
  const [seenAdminHelpIds, setSeenAdminHelpIds] = useState(() => {
    try {
      const stored = localStorage.getItem("ap_seen_help_tickets");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const unreadHelpCount = useMemo(() => {
    if (!Array.isArray(helpTickets)) return 0;
    return helpTickets.filter(
      (h) => (!h.Answer || !h.Answer.trim()) && !seenAdminHelpIds.includes(String(h.id))
    ).length;
  }, [helpTickets, seenAdminHelpIds]);

  // When admin opens Helpdesk tab, mark currently pending/unanswered tickets as seen
  useEffect(() => {
    if (activeTab === "master_help" && Array.isArray(helpTickets) && helpTickets.length > 0) {
      const pendingIds = helpTickets
        .filter((h) => !h.Answer || !h.Answer.trim())
        .map((h) => String(h.id));
      if (pendingIds.length > 0) {
        setSeenAdminHelpIds((prev) => {
          const merged = Array.from(new Set([...prev, ...pendingIds]));
          if (merged.length !== prev.length) {
            try {
              localStorage.setItem("ap_seen_help_tickets", JSON.stringify(merged));
            } catch (e) {
              console.error("Failed to save seen admin tickets:", e);
            }
            return merged;
          }
          return prev;
        });
      }
    }
  }, [activeTab, helpTickets]);

  // Helpdesk Filter Suite States
  const [helpSearch, setHelpSearch] = useState("");
  const [helpAssigneeFilter, setHelpAssigneeFilter] = useState("all"); // "all" | "admin" | "staff"
  const [helpStatusFilter, setHelpStatusFilter] = useState("all"); // "all" | "pending" | "answered"
  const [helpSenderFilter, setHelpSenderFilter] = useState("all"); // "all" | "user" | "staff" | "service"

  // -------------------------------------------------------------
  // COMPREHENSIVE PLATFORM FINANCIAL & TREASURY ANALYTICS
  // -------------------------------------------------------------
  const [financialYearFilter, setFinancialYearFilter] = useState("all");
  const [financialSearch, setFinancialSearch] = useState("");
  const [financialMonthModal, setFinancialMonthModal] = useState(null);

  // 1. Overall All-Time Candidate / User Revenue
  const totalCandidateRevenue = useMemo(() => {
    return userTxns
      .filter((t) => String(t.status || t.Status || "").toLowerCase() === "success")
      .reduce((acc, curr) => acc + (Number(curr.Amount) || 0), 0);
  }, [userTxns]);

  const totalCandidateTxnCount = useMemo(() => {
    return userTxns.filter((t) => String(t.status || t.Status || "").toLowerCase() === "success").length;
  }, [userTxns]);

  // 2. Overall All-Time Wedding Service Vendor Revenue
  const totalVendorRevenue = useMemo(() => {
    return serviceTxns
      .filter((t) => String(t.Status || t.status || "").toLowerCase() === "success")
      .reduce((acc, curr) => acc + (Number(curr.Amount) || 0), 0);
  }, [serviceTxns]);

  const totalVendorTxnCount = useMemo(() => {
    return serviceTxns.filter((t) => String(t.Status || t.status || "").toLowerCase() === "success").length;
  }, [serviceTxns]);

  // 3. Overall All-Time Gross Platform Revenue (Inflow)
  const totalGrossRevenue = useMemo(() => {
    return totalCandidateRevenue + totalVendorRevenue;
  }, [totalCandidateRevenue, totalVendorRevenue]);

  const totalGrossTxnCount = useMemo(() => {
    return totalCandidateTxnCount + totalVendorTxnCount;
  }, [totalCandidateTxnCount, totalVendorTxnCount]);

  // 4. Overall All-Time Staff Counselor Withdrawals Paid (Outflow)
  const totalStaffWithdrawalsPaid = useMemo(() => {
    return staffTxns
      .filter(
        (t) =>
          (t.Type === "Withdrawal" || !t.Type) &&
          (String(t.Status).toLowerCase() === "approved" || String(t.Status).toLowerCase() === "success")
      )
      .reduce((acc, curr) => acc + (Number(curr.Amount) || 0), 0);
  }, [staffTxns]);

  const totalStaffPaidTxnCount = useMemo(() => {
    return staffTxns.filter(
      (t) =>
        (t.Type === "Withdrawal" || !t.Type) &&
        (String(t.Status).toLowerCase() === "approved" || String(t.Status).toLowerCase() === "success")
    ).length;
  }, [staffTxns]);

  // 5. Overall All-Time Staff Counselor Withdrawals Pending (In Review)
  const totalPendingWithdrawals = useMemo(() => {
    return staffTxns
      .filter(
        (t) =>
          (t.Type === "Withdrawal" || !t.Type) &&
          String(t.Status).toLowerCase() === "pending"
      )
      .reduce((acc, curr) => acc + (Number(curr.Amount) || 0), 0);
  }, [staffTxns]);

  const totalPendingWithdrawalsCount = useMemo(() => {
    return staffTxns.filter(
      (t) =>
        (t.Type === "Withdrawal" || !t.Type) &&
        String(t.Status).toLowerCase() === "pending"
    ).length;
  }, [staffTxns]);

  // 6. Net Platform Remaining Balance After Withdrawals (Retained Profit)
  const netPlatformRemaining = useMemo(() => {
    return totalGrossRevenue - totalStaffWithdrawalsPaid;
  }, [totalGrossRevenue, totalStaffWithdrawalsPaid]);

  const overallMarginPercent = useMemo(() => {
    if (totalGrossRevenue <= 0) return totalStaffWithdrawalsPaid > 0 ? "-100" : "0";
    return ((netPlatformRemaining / totalGrossRevenue) * 100).toFixed(1);
  }, [totalGrossRevenue, netPlatformRemaining, totalStaffWithdrawalsPaid]);

  // 7. Monthly Reconciled Ledger Breakdown
  const monthlyFinancials = useMemo(() => {
    const monthMap = {};

    const parseMonthKey = (val) => {
      if (!val) return null;
      const str = String(val).trim();
      if (str.length >= 7 && /^\d{4}-\d{2}/.test(str)) {
        return str.slice(0, 7);
      }
      try {
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
          return d.toISOString().slice(0, 7);
        }
      } catch {
        // fallback
      }
      return null;
    };

    const getBucket = (key) => {
      if (!monthMap[key]) {
        let label = key;
        try {
          const parts = key.split("-");
          if (parts.length === 2) {
            const yr = parseInt(parts[0], 10);
            const mo = parseInt(parts[1], 10) - 1;
            const dt = new Date(yr, mo, 1);
            label = dt.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
          }
        } catch {
          label = key;
        }

        monthMap[key] = {
          monthKey: key,
          year: key.split("-")[0] || "Unknown",
          monthLabel: label,
          userRevenue: 0,
          userCount: 0,
          userTxns: [],
          serviceRevenue: 0,
          serviceCount: 0,
          serviceTxns: [],
          staffPaid: 0,
          staffPaidCount: 0,
          staffPaidTxns: [],
          staffPending: 0,
          staffPendingCount: 0,
          staffPendingTxns: [],
        };
      }
      return monthMap[key];
    };

    // User / Candidate Subscriptions
    (userTxns || []).forEach((tx) => {
      const isSuccess = String(tx.status || tx.Status || "").toLowerCase() === "success";
      if (!isSuccess) return;
      const mKey = parseMonthKey(tx.Create_date || tx.create_date || tx.date || tx.timestamp) || "Unscheduled";
      const bucket = getBucket(mKey);
      const amt = Number(tx.Amount) || 0;
      bucket.userRevenue += amt;
      bucket.userCount += 1;
      bucket.userTxns.push(tx);
    });

    // Wedding Services
    (serviceTxns || []).forEach((tx) => {
      const isSuccess = String(tx.Status || tx.status || "").toLowerCase() === "success";
      if (!isSuccess) return;
      const mKey = parseMonthKey(tx.Create_date || tx.create_date || tx.date) || "Unscheduled";
      const bucket = getBucket(mKey);
      const amt = Number(tx.Amount) || 0;
      bucket.serviceRevenue += amt;
      bucket.serviceCount += 1;
      bucket.serviceTxns.push(tx);
    });

    // Staff Withdrawals (Paid & Pending)
    (staffTxns || []).forEach((tx) => {
      const isWithdrawal = tx.Type === "Withdrawal" || !tx.Type;
      if (!isWithdrawal) return;
      const mKey = parseMonthKey(tx.Create_date || tx.create_date || tx.date) || "Unscheduled";
      const bucket = getBucket(mKey);
      const amt = Number(tx.Amount) || 0;
      const st = String(tx.Status || "Pending").toLowerCase();
      if (st === "approved" || st === "success") {
        bucket.staffPaid += amt;
        bucket.staffPaidCount += 1;
        bucket.staffPaidTxns.push(tx);
      } else if (st === "pending") {
        bucket.staffPending += amt;
        bucket.staffPendingCount += 1;
        bucket.staffPendingTxns.push(tx);
      }
    });

    const rows = Object.values(monthMap).map((m) => {
      const gross = m.userRevenue + m.serviceRevenue;
      const net = gross - m.staffPaid;
      const margin = gross > 0 ? ((net / gross) * 100).toFixed(1) : (m.staffPaid > 0 ? "-100" : "0");
      return {
        ...m,
        grossRevenue: gross,
        totalTxnCount: m.userCount + m.serviceCount,
        netRemain: net,
        marginPercent: margin,
      };
    });

    rows.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    return rows;
  }, [userTxns, serviceTxns, staffTxns]);

  // Available Years for filter dropdown
  const availableFinancialYears = useMemo(() => {
    const years = new Set();
    monthlyFinancials.forEach((m) => {
      if (m.year && m.year !== "Unknown" && m.year !== "Unscheduled") {
        years.add(m.year);
      }
    });
    return Array.from(years).sort().reverse();
  }, [monthlyFinancials]);

  // Filtered Monthly Rows
  const filteredMonthlyFinancials = useMemo(() => {
    return monthlyFinancials.filter((m) => {
      const matchesYear = financialYearFilter === "all" || m.year === financialYearFilter;
      const matchesSearch =
        !financialSearch.trim() ||
        m.monthLabel.toLowerCase().includes(financialSearch.toLowerCase().trim()) ||
        m.monthKey.includes(financialSearch.trim());
      return matchesYear && matchesSearch;
    });
  }, [monthlyFinancials, financialYearFilter, financialSearch]);

  // Totals of Filtered Rows (for Table Footer and Active Filter Scope)
  const filteredFinancialTotals = useMemo(() => {
    const totals = filteredMonthlyFinancials.reduce(
      (acc, r) => {
        acc.userRevenue += r.userRevenue;
        acc.userCount += r.userCount;
        acc.serviceRevenue += r.serviceRevenue;
        acc.serviceCount += r.serviceCount;
        acc.grossRevenue += r.grossRevenue;
        acc.totalTxnCount += r.totalTxnCount;
        acc.staffPaid += r.staffPaid;
        acc.staffPaidCount += r.staffPaidCount;
        acc.staffPending += r.staffPending;
        acc.staffPendingCount += r.staffPendingCount;
        acc.netRemain += r.netRemain;
        return acc;
      },
      {
        userRevenue: 0,
        userCount: 0,
        serviceRevenue: 0,
        serviceCount: 0,
        grossRevenue: 0,
        totalTxnCount: 0,
        staffPaid: 0,
        staffPaidCount: 0,
        staffPending: 0,
        staffPendingCount: 0,
        netRemain: 0,
      }
    );
    totals.marginPercent =
      totals.grossRevenue > 0
        ? ((totals.netRemain / totals.grossRevenue) * 100).toFixed(1)
        : totals.staffPaid > 0
        ? "-100"
        : "0";
    return totals;
  }, [filteredMonthlyFinancials]);

  // -------------------------------------------------------------
  // SECTION 1: USER (CANDIDATE) PORTAL MANAGEMENT & FEATURES
  // -------------------------------------------------------------
  // Advanced Filter Suite States
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateGenderFilter, setCandidateGenderFilter] = useState("all");
  const [candidateMaritalFilter, setCandidateMaritalFilter] = useState("all");
  const [candidateReligionFilter, setCandidateReligionFilter] = useState("all");
  const [candidateCasteFilter, setCandidateCasteFilter] = useState("all");
  const [candidateStateFilter, setCandidateStateFilter] = useState("all");
  const [candidateDistrictFilter, setCandidateDistrictFilter] = useState("all");
  const [candidateValidityFilter, setCandidateValidityFilter] = useState("all"); // all | active_plan | expired
  const [candidateStatusFilter, setCandidateStatusFilter] = useState("all"); // all | active | inactive
  const [candidateManglikFilter, setCandidateManglikFilter] = useState("all"); // all | manglik | non_manglik
  const [candidateDietFilter, setCandidateDietFilter] = useState("all"); // all | vegeterian | non-vegeterian | both
  const [candidateAgeFilter, setCandidateAgeFilter] = useState("all");
  const [candidateIncomeFilter, setCandidateIncomeFilter] = useState("all");
  const [candidateSortBy, setCandidateSortBy] = useState("newest");

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);

  // Candidate Create & Edit Modal
  const [isCreateCandidateOpen, setIsCreateCandidateOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [candidateForm] = Form.useForm();
  const [createCandidateForm] = Form.useForm();

  // Candidate Stepped Registration (Step 0: Phone & OTP, Step 1: Verify OTP, Step 2: Password, Step 3: Biodata Profile)
  const [candidateRegStep, setCandidateRegStep] = useState(0);
  const [candPhone, setCandPhone] = useState("");
  const [candPhoneError, setCandPhoneError] = useState("");
  const [candOtp, setCandOtp] = useState(Array(6).fill(""));
  const [candOtpError, setCandOtpError] = useState("");
  const [candPassword, setCandPassword] = useState("");
  const [candConfirmPassword, setCandConfirmPassword] = useState("");
  const [candShowPass, setCandShowPass] = useState(false);
  const [candPasswordError, setCandPasswordError] = useState("");
  const [candRefCode, setCandRefCode] = useState("");
  const [candCountdown, setCandCountdown] = useState(120);
  const [candCanResend, setCandCanResend] = useState(false);
  const [candLoading, setCandLoading] = useState(false);
  const [candCreatedUser, setCandCreatedUser] = useState(null);
  const candOtpRefs = useRef([]);
  const candTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (candTimerRef.current) clearInterval(candTimerRef.current);
      if (staffTimerRef.current) clearInterval(staffTimerRef.current);
      if (serviceTimerRef.current) clearInterval(serviceTimerRef.current);
    };
  }, []);

  // Membership Validity Extension Modal
  const [validityModalCandidate, setValidityModalCandidate] = useState(null);
  const [extensionDays, setExtensionDays] = useState(30);
  const [extendingLoading, setExtendingLoading] = useState(false);

  // Dynamic Available Districts for Filter
  const availableDistrictsForFilter = useMemo(() => {
    if (candidateStateFilter === "all") {
      const allDists = new Set();
      statesList.forEach((s) => {
        if (Array.isArray(s.Districts)) {
          s.Districts.forEach((d) => d && allDists.add(d.trim()));
        }
      });
      return Array.from(allDists).sort();
    }
    const matchedState = statesList.find(
      (s) => (s.State || "").toLowerCase() === candidateStateFilter.toLowerCase()
    );
    if (matchedState && Array.isArray(matchedState.Districts)) {
      return [...matchedState.Districts].map((d) => d.trim()).sort();
    }
    return [];
  }, [statesList, candidateStateFilter]);

  // Dynamic Available Castes for Filter
  const availableCastesForFilter = useMemo(() => {
    const casteSet = new Set();
    candidates.forEach((c) => {
      if (c.Caste && c.Caste.trim()) casteSet.add(c.Caste.trim());
    });
    castes.forEach((item) => {
      if (Array.isArray(item.Caste_Name)) {
        item.Caste_Name.forEach((cn) => {
          if (cn && typeof cn === "string" && cn.trim()) casteSet.add(cn.trim());
        });
      }
    });
    return Array.from(casteSet).sort();
  }, [candidates, castes]);

  // Reset All Candidate Filters
  const resetCandidateFilters = () => {
    setCandidateSearch("");
    setCandidateGenderFilter("all");
    setCandidateMaritalFilter("all");
    setCandidateReligionFilter("all");
    setCandidateCasteFilter("all");
    setCandidateStateFilter("all");
    setCandidateDistrictFilter("all");
    setCandidateValidityFilter("all");
    setCandidateStatusFilter("all");
    setCandidateManglikFilter("all");
    setCandidateDietFilter("all");
    setCandidateAgeFilter("all");
    setCandidateIncomeFilter("all");
    setCandidateSortBy("newest");
  };

  // Count active applied filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (candidateSearch) count++;
    if (candidateGenderFilter !== "all") count++;
    if (candidateMaritalFilter !== "all") count++;
    if (candidateReligionFilter !== "all") count++;
    if (candidateCasteFilter !== "all") count++;
    if (candidateStateFilter !== "all") count++;
    if (candidateDistrictFilter !== "all") count++;
    if (candidateValidityFilter !== "all") count++;
    if (candidateStatusFilter !== "all") count++;
    if (candidateManglikFilter !== "all") count++;
    if (candidateDietFilter !== "all") count++;
    if (candidateAgeFilter !== "all") count++;
    if (candidateIncomeFilter !== "all") count++;
    return count;
  }, [
    candidateSearch,
    candidateGenderFilter,
    candidateMaritalFilter,
    candidateReligionFilter,
    candidateCasteFilter,
    candidateStateFilter,
    candidateDistrictFilter,
    candidateValidityFilter,
    candidateStatusFilter,
    candidateManglikFilter,
    candidateDietFilter,
    candidateAgeFilter,
    candidateIncomeFilter,
  ]);

  // Filtered & Sorted Candidates Directory
  const filteredCandidates = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return candidates
      .filter((c) => {
        const q = candidateSearch.toLowerCase().trim();
        const name = (c.Full_Name || "").toLowerCase();
        const userId = String(c.User_id || "");
        const caste = (c.Caste || "").toLowerCase();
        const gotra = (c.Gotra || "").toLowerCase();
        const religion = (c.Religion || "").toLowerCase();
        const state = (c.State || "").toLowerCase();
        const dist = (c.District || "").toLowerCase();
        const city = (c.City || "").toLowerCase();
        const phone = (c.WP_Contact || "").toLowerCase();
        const altPhone = (c.Alt_Contact || "").toLowerCase();
        const prof = (c.Profession || c.Job_type || "").toLowerCase();
        const qual = (c.Qualification || "").toLowerCase();

        // 1. Text Search across 12 candidate dimensions
        const matchesQ =
          !q ||
          name.includes(q) ||
          userId.includes(q) ||
          caste.includes(q) ||
          gotra.includes(q) ||
          religion.includes(q) ||
          state.includes(q) ||
          dist.includes(q) ||
          city.includes(q) ||
          phone.includes(q) ||
          altPhone.includes(q) ||
          prof.includes(q) ||
          qual.includes(q);

        // 2. Gender Filter
        const matchesGender =
          candidateGenderFilter === "all" ||
          (c.Gender || "").toLowerCase() === candidateGenderFilter.toLowerCase();

        // 3. Marital Status Filter
        let matchesMarital = true;
        if (candidateMaritalFilter !== "all") {
          const cms = (c.Marrige_status || "").toLowerCase();
          const target = candidateMaritalFilter.toLowerCase();
          if (target === "never married" || target === "unmarried") {
            matchesMarital = cms.includes("never") || cms.includes("unmarried") || cms.includes("single");
          } else {
            matchesMarital = cms.includes(target);
          }
        }

        // 4. Religion Filter
        const matchesReligion =
          candidateReligionFilter === "all" ||
          (c.Religion || "").toLowerCase() === candidateReligionFilter.toLowerCase();

        // 5. Caste Filter
        const matchesCaste =
          candidateCasteFilter === "all" ||
          (c.Caste || "").toLowerCase() === candidateCasteFilter.toLowerCase();

        // 6. State Filter
        const matchesState =
          candidateStateFilter === "all" ||
          (c.State || "").toLowerCase() === candidateStateFilter.toLowerCase();

        // 7. District Filter
        const matchesDistrict =
          candidateDistrictFilter === "all" ||
          (c.District || "").toLowerCase() === candidateDistrictFilter.toLowerCase();

        // 8. Validity / Plan Filter
        const isValid = c.Valid_Upto && c.Valid_Upto >= todayStr;
        const matchesValidity =
          candidateValidityFilter === "all" ||
          (candidateValidityFilter === "active_plan" && isValid) ||
          ((candidateValidityFilter === "expired" || candidateValidityFilter === "expired_plan") && !isValid);

        // 9. Profile Active Filter
        const matchesStatus =
          candidateStatusFilter === "all" ||
          (candidateStatusFilter === "active" ? c.Active !== false : c.Active === false);

        // 10. Manglik Filter
        const isManglik = c.Manglik === true || c.Manglik === "Yes" || c.Manglik === "true" || String(c.Manglik).toLowerCase() === "yes";
        const matchesManglik =
          candidateManglikFilter === "all" ||
          (candidateManglikFilter === "manglik" && isManglik) ||
          (candidateManglikFilter === "non_manglik" && !isManglik);

        // 11. Diet Filter
        let matchesDiet = true;
        if (candidateDietFilter !== "all") {
          const cd = (c.Vegeterian || "").toLowerCase();
          if (candidateDietFilter === "vegetarian") {
            matchesDiet = cd.includes("veg") && !cd.includes("non");
          } else if (candidateDietFilter === "non_vegetarian") {
            matchesDiet = cd.includes("non");
          } else {
            matchesDiet = cd.includes(candidateDietFilter.toLowerCase());
          }
        }

        // 12. Age Filter
        const age = Number(c.Age) || 0;
        let matchesAge = true;
        if (candidateAgeFilter === "18_25") matchesAge = age >= 18 && age <= 25;
        else if (candidateAgeFilter === "26_30") matchesAge = age >= 26 && age <= 30;
        else if (candidateAgeFilter === "31_35") matchesAge = age >= 31 && age <= 35;
        else if (candidateAgeFilter === "36_40") matchesAge = age >= 36 && age <= 40;
        else if (candidateAgeFilter === "41_50") matchesAge = age >= 41 && age <= 50;
        else if (candidateAgeFilter === "50_plus") matchesAge = age > 50;

        // 13. Income Filter
        const salary = Number(c.Salary) || 0;
        let matchesIncome = true;
        if (candidateIncomeFilter === "under_3") matchesIncome = salary < 300000;
        else if (candidateIncomeFilter === "3_6") matchesIncome = salary >= 300000 && salary <= 600000;
        else if (candidateIncomeFilter === "6_12") matchesIncome = salary > 600000 && salary <= 1200000;
        else if (candidateIncomeFilter === "12_25") matchesIncome = salary > 1200000 && salary <= 2500000;
        else if (candidateIncomeFilter === "25_plus") matchesIncome = salary > 2500000;

        return (
          matchesQ &&
          matchesGender &&
          matchesMarital &&
          matchesReligion &&
          matchesCaste &&
          matchesState &&
          matchesDistrict &&
          matchesValidity &&
          matchesStatus &&
          matchesManglik &&
          matchesDiet &&
          matchesAge &&
          matchesIncome
        );
      })
      .sort((a, b) => {
        if (candidateSortBy === "newest") return (b.id || 0) - (a.id || 0);
        if (candidateSortBy === "oldest") return (a.id || 0) - (b.id || 0);
        if (candidateSortBy === "ageAsc") return (Number(a.Age) || 0) - (Number(b.Age) || 0);
        if (candidateSortBy === "ageDesc") return (Number(b.Age) || 0) - (Number(a.Age) || 0);
        if (candidateSortBy === "salaryDesc") return (Number(b.Salary) || 0) - (Number(a.Salary) || 0);
        return 0;
      });
  }, [
    candidates,
    candidateSearch,
    candidateGenderFilter,
    candidateMaritalFilter,
    candidateReligionFilter,
    candidateCasteFilter,
    candidateStateFilter,
    candidateDistrictFilter,
    candidateValidityFilter,
    candidateStatusFilter,
    candidateManglikFilter,
    candidateDietFilter,
    candidateAgeFilter,
    candidateIncomeFilter,
    candidateSortBy,
  ]);

  // Executive KPI summary metrics for Candidate Directory
  const candidateMetrics = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const total = candidates.length;
    const active = candidates.filter((c) => c.Active !== false).length;
    const validPlan = candidates.filter((c) => c.Valid_Upto && c.Valid_Upto >= today).length;
    const expiredPlan = candidates.filter((c) => !c.Valid_Upto || c.Valid_Upto < today).length;
    const grooms = candidates.filter((c) => (c.Gender || "").toLowerCase() === "male").length;
    const brides = candidates.filter((c) => (c.Gender || "").toLowerCase() === "female").length;
    return { total, active, validPlan, expiredPlan, grooms, brides };
  }, [candidates]);

  // 1-Click Excel/CSV Candidate Directory Export
  const handleExportCandidatesCSV = () => {
    if (!filteredCandidates || filteredCandidates.length === 0) {
      message.warning("No candidate records to export with the current filter settings.");
      return;
    }

    const headers = [
      "User ID",
      "Full Name",
      "Gender",
      "Age",
      "Marital Status",
      "Religion",
      "Caste",
      "Gotra",
      "Manglik",
      "City",
      "District",
      "State",
      "Profession",
      "Qualification",
      "Annual Salary",
      "WhatsApp Contact",
      "Contact Relation",
      "Plan Valid Upto",
      "Active Status",
    ];

    const rows = filteredCandidates.map((c) => {
      const isManglik = c.Manglik === true || c.Manglik === "Yes" || c.Manglik === "true" || String(c.Manglik).toLowerCase() === "yes";
      return [
        `"${c.User_id || c.id || ""}"`,
        `"${(c.Full_Name || "").replace(/"/g, '""')}"`,
        `"${c.Gender || ""}"`,
        `"${c.Age || ""}"`,
        `"${(c.Marrige_status || "").replace(/"/g, '""')}"`,
        `"${(c.Religion || "").replace(/"/g, '""')}"`,
        `"${(c.Caste || "").replace(/"/g, '""')}"`,
        `"${(c.Gotra || "").replace(/"/g, '""')}"`,
        `"${isManglik ? "Yes" : "No"}"`,
        `"${(c.City || "").replace(/"/g, '""')}"`,
        `"${(c.District || "").replace(/"/g, '""')}"`,
        `"${(c.State || "").replace(/"/g, '""')}"`,
        `"${(c.Profession || "").replace(/"/g, '""')}"`,
        `"${(c.Qualification || "").replace(/"/g, '""')}"`,
        `"${c.Salary || ""}"`,
        `"${c.WP_Contact || ""}"`,
        `"${(c.WP_Contact_Relation || "").replace(/"/g, '""')}"`,
        `"${c.Valid_Upto || ""}"`,
        `"${c.Active !== false ? "Active" : "Inactive"}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `VaivaheekManch_Candidates_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`📥 Successfully exported ${filteredCandidates.length} candidate profiles to CSV!`);
  };

  const formatOtpCountdown = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startCandCountdown = useCallback(() => {
    setCandCountdown(120);
    setCandCanResend(false);
    if (candTimerRef.current) clearInterval(candTimerRef.current);
    candTimerRef.current = setInterval(() => {
      setCandCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(candTimerRef.current);
          setCandCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetCandidateWizard = useCallback(() => {
    if (candTimerRef.current) clearInterval(candTimerRef.current);
    setCandidateRegStep(0);
    setCandPhone("");
    setCandPhoneError("");
    setCandOtp(Array(6).fill(""));
    setCandOtpError("");
    setCandPassword("");
    setCandConfirmPassword("");
    setCandShowPass(false);
    setCandPasswordError("");
    setCandRefCode("");
    setCandCountdown(120);
    setCandCanResend(false);
    setCandLoading(false);
    setCandCreatedUser(null);
    createCandidateForm.resetFields();
  }, [createCandidateForm]);

  const handleOpenCreateCandidate = () => {
    resetCandidateWizard();
    setIsCreateCandidateOpen(true);
  };

  const handleCancelCreateCandidate = () => {
    if (candCreatedUser?.id && candidateRegStep === 3) {
      message.info(`Candidate user account (#${candCreatedUser.id}) was registered. Profile can be updated anytime from the candidate table.`);
    }
    resetCandidateWizard();
    setIsCreateCandidateOpen(false);
  };

  const recentCandOtp = useMemo(() => {
    if (!candPhone || candPhone.length < 10) return null;
    const match = phoneOtps.find((o) => String(o.Contact || "").trim() === candPhone.trim());
    return match?.OTP || null;
  }, [candPhone, phoneOtps]);

  const handleCandSendOTP = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setCandPhoneError("");
    const cleanPhone = String(candPhone || "").trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      setCandPhoneError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setCandLoading(true);
    try {
      await API.post("send-otp/", { Contact: cleanPhone });
      message.success(`OTP sent successfully to +91 ${cleanPhone}`);
      try {
        const otpRes = await PhoneOTPGet();
        setPhoneOtps(Array.isArray(otpRes) ? otpRes : otpRes?.results || []);
      } catch {
        // background sync
      }
      setCandidateRegStep(1);
      startCandCountdown();
      setTimeout(() => candOtpRefs.current[0]?.focus(), 150);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.Contact?.[0] || "Failed to send OTP.";
      setCandPhoneError(typeof msg === "string" ? msg : JSON.stringify(msg));
      message.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setCandLoading(false);
    }
  };

  const handleCandOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...candOtp];
    updated[index] = value;
    setCandOtp(updated);
    setCandOtpError("");
    if (value && index < 5) {
      candOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleCandOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !candOtp[index] && index > 0) {
      candOtpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) candOtpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) candOtpRefs.current[index + 1]?.focus();
  };

  const handleCandOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const updated = Array(6).fill("");
      [...pasted].forEach((ch, i) => {
        if (i < 6) updated[i] = ch;
      });
      setCandOtp(updated);
      setCandOtpError("");
      candOtpRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  const handleCandResendOTP = async () => {
    setCandOtp(Array(6).fill(""));
    setCandOtpError("");
    setCandLoading(true);
    try {
      await API.post("send-otp/", { Contact: candPhone.trim() });
      message.success("OTP resent successfully to +91 " + candPhone.trim());
      try {
        const otpRes = await PhoneOTPGet();
        setPhoneOtps(Array.isArray(otpRes) ? otpRes : otpRes?.results || []);
      } catch {
        // background sync
      }
      startCandCountdown();
      setTimeout(() => candOtpRefs.current[0]?.focus(), 100);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to resend OTP.";
      message.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setCandLoading(false);
    }
  };

  const handleCandVerifyOTP = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const fullOtp = candOtp.join("");
    setCandOtpError("");
    if (fullOtp.length < 6) {
      setCandOtpError("Please enter complete 6-digit OTP code.");
      return;
    }
    setCandLoading(true);
    try {
      await API.post("verify-otp/", {
        Contact: candPhone.trim(),
        OTP: fullOtp,
        verify_only: true,
      });
      if (candTimerRef.current) clearInterval(candTimerRef.current);
      message.success("Mobile number verified! Please set account credentials.");
      const defaultPass = "Vm@" + candPhone.trim().slice(-4);
      if (!candPassword) {
        setCandPassword(defaultPass);
        setCandConfirmPassword(defaultPass);
      }
      setCandidateRegStep(2);
    } catch (err) {
      const msg = err.response?.data?.error || "Invalid OTP code. Please try again.";
      setCandOtpError(typeof msg === "string" ? msg : JSON.stringify(msg));
      message.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setCandLoading(false);
    }
  };

  const handleCandCreateAccount = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setCandPasswordError("");
    if (!candPassword) {
      setCandPasswordError("Password is required.");
      return;
    }
    if (candPassword.length < 8) {
      setCandPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (candPassword !== candConfirmPassword) {
      setCandPasswordError("Passwords do not match.");
      return;
    }
    const fullOtp = candOtp.join("");
    setCandLoading(true);
    try {
      const res = await API.post("verify-otp/", {
        Contact: candPhone.trim(),
        OTP: fullOtp,
        password: candPassword,
        Refered_By: candRefCode ? String(candRefCode).trim() : undefined,
        Role: "user",
      });
      const newUser = res?.data?.user || res?.data || {};
      setCandCreatedUser(newUser);
      message.success("User account registered! Now complete candidate profile.");
      try {
        const uRes = await UserGet();
        setUsersList(Array.isArray(uRes) ? uRes : uRes?.results || []);
      } catch {
        // background sync
      }
      createCandidateForm.setFieldsValue({
        WP_Contact: candPhone.trim(),
        Gender: "Male",
        Religion: "Hindu",
        Marrige_status: "Never Married",
      });
      setCandidateRegStep(3);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || "Failed to register user account.";
      setCandPasswordError(typeof msg === "string" ? msg : JSON.stringify(msg));
      message.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setCandLoading(false);
    }
  };

  const handleCreateCandidateSubmit = async (values) => {
    const userId = candCreatedUser?.id;
    if (!userId) {
      message.error("Candidate account reference missing. Please restart registration.");
      return;
    }
    setCandLoading(true);
    try {
      await API.post("user-data/", {
        User_id: userId,
        Full_Name: values.Full_Name,
        Gender: values.Gender || "Male",
        Age: values.Age || null,
        DOB: values.DOB || "",
        WP_Contact: candPhone.trim(),
        WP_Contact_Relation: "Self",
        Caste: values.Caste || "",
        Gotra: values.Gotra || "",
        Religion: values.Religion || "Hindu",
        Qualification: values.Qualification || "",
        Profession: values.Profession || "",
        Salary: values.Salary || 0,
        City: values.City || "",
        District: values.District || "",
        State: values.State || "",
        Marrige_status: values.Marrige_status || "Never Married",
        About_MySelf: values.About_MySelf || "",
        Partner_Expectations: values.Partner_Expectations || "",
        Active: true,
      });

      message.success("Candidate biodata profile created successfully! 👤");
      setIsCreateCandidateOpen(false);
      resetCandidateWizard();
      const res = await UserDataGetwt({ scope: "all" });
      setCandidates(Array.isArray(res) ? res : res?.results || []);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || "Failed to create candidate";
      message.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setCandLoading(false);
    }
  };

  const selectedCreateCandState = Form.useWatch("State", createCandidateForm);
  const candCreateDistricts = useMemo(() => {
    if (!selectedCreateCandState) return [];
    const matched = statesList.find(
      (s) => (s.State || "").toLowerCase() === selectedCreateCandState.toLowerCase()
    );
    return Array.isArray(matched?.Districts) ? matched.Districts : [];
  }, [statesList, selectedCreateCandState]);

  const handleOpenEditCandidate = (c) => {
    setEditingCandidate(c);
    const uAcc = usersList.find((u) => String(u.id) === String(c.User_id?.id || c.User_id));
    candidateForm.setFieldsValue({
      // User account model fields
      user_Contact: uAcc?.Contact || c.WP_Contact || "",
      user_password: "",
      user_Refered_By: uAcc?.Refered_By || c.Refer || 0,
      user_Role: uAcc?.Role || "user",
      user_is_active: uAcc?.is_active !== false,

      // UserData profile model fields (all fields)
      Full_Name: c.Full_Name || "",
      Gender: c.Gender || "Male",
      Age: c.Age || null,
      DOB: c.DOB || "",
      WP_Contact: c.WP_Contact || "",
      WP_Contact_Relation: c.WP_Contact_Relation || "Self",
      Wp_Contact_Name: c.Wp_Contact_Name || "",
      Alt_Contact: c.Alt_Contact || "",
      Alt_Contact_Relation: c.Alt_Contact_Relation || "Relative",
      Alt_Contact_Name: c.Alt_Contact_Name || "",
      Email: c.Email || "",
      Full_Address: c.Full_Address || "",
      City: c.City || "",
      District: c.District || "",
      State: c.State || "",
      Country: c.Country || "India",
      Nearestdist: Array.isArray(c.Nearestdist) ? c.Nearestdist.join(", ") : (c.Nearestdist || ""),
      Caste: c.Caste || "",
      Gotra: c.Gotra || "",
      Religion: c.Religion || "",
      Mother_tongue: c.Mother_tongue || "",
      Height: c.Height || null,
      Weight: c.Weight || null,
      Color: c.Color || "",
      Manglik: Boolean(c.Manglik),
      Disability: Boolean(c.Disability),
      Vegeterian: c.Vegeterian || "Vegeterian",
      Marrige_status: c.Marrige_status || "Never Married",
      Qualification: c.Qualification || "",
      Profession: c.Profession || "",
      Job_type: c.Job_type || "",
      Salary: c.Salary || null,
      Father_name: c.Father_name || "",
      Father_Age: c.Father_Age || null,
      Father_Profession: c.Father_Profession || "",
      Mother_name: c.Mother_name || "",
      Mother_Age: c.Mother_Age || null,
      Mother_Profession: c.Mother_Profession || "",
      House: c.House || "Self",
      Brothers: c.Brothers ? String(c.Brothers) : "0",
      Brothers_marrige: c.Brothers_marrige ? String(c.Brothers_marrige) : "0",
      Sisters: c.Sisters ? String(c.Sisters) : "0",
      Sisters_marrige: c.Sisters_marrige ? String(c.Sisters_marrige) : "0",
      Accept_Profiles: Array.isArray(c.Accept_Profiles) ? c.Accept_Profiles.join(", ") : (c.Accept_Profiles || ""),
      Valid_Upto: c.Valid_Upto || "",
      Active: c.Active !== false,
    });
  };

  const handleSaveEditCandidate = async (values) => {
    try {
      const {
        user_Contact,
        user_password,
        user_Refered_By,
        user_Role,
        user_is_active,
        Nearestdist,
        Accept_Profiles,
        ...profileFields
      } = values;

      if (typeof Nearestdist === "string") {
        profileFields.Nearestdist = Nearestdist.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (typeof Accept_Profiles === "string") {
        profileFields.Accept_Profiles = Accept_Profiles.split(",").map((s) => s.trim()).filter(Boolean);
      }

      // Robust Membership Expiry Date normalization (handles YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, empty string -> null)
      if (profileFields.Valid_Upto !== undefined) {
        if (!profileFields.Valid_Upto || typeof profileFields.Valid_Upto !== "string" || !profileFields.Valid_Upto.trim()) {
          profileFields.Valid_Upto = null;
        } else {
          let vDate = profileFields.Valid_Upto.trim();
          const ddmmyyyyMatch = vDate.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
          if (ddmmyyyyMatch) {
            const [, d, m, y] = ddmmyyyyMatch;
            vDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          }
          profileFields.Valid_Upto = vDate;
        }
      }

      const userId = editingCandidate.User_id?.id || editingCandidate.User_id;
      if (userId) {
        const userPayload = {};
        if (user_Contact && user_Contact.trim()) {
          userPayload.Contact = user_Contact.trim();
          userPayload.username = user_Contact.trim();
        }
        if (user_password && user_password.trim()) {
          userPayload.password = user_password.trim();
        }
        if (user_Refered_By !== undefined && user_Refered_By !== null && user_Refered_By !== "") {
          userPayload.Refered_By = Number(user_Refered_By) || 0;
        }
        if (user_Role) {
          userPayload.Role = user_Role;
        }
        if (user_is_active !== undefined) {
          userPayload.is_active = Boolean(user_is_active);
        }

        if (Object.keys(userPayload).length > 0) {
          await API.patch(`users/${userId}/`, userPayload).catch((e) => {
            console.warn("User account update error:", e);
          });
          setUsersList((prev) =>
            prev.map((u) => (String(u.id) === String(userId) ? { ...u, ...userPayload } : u))
          );
        }
      }

      const updateRes = await UserDataUpdate(editingCandidate.id, profileFields);
      if (updateRes && updateRes.error) {
        throw new Error(typeof updateRes.error === "string" ? updateRes.error : JSON.stringify(updateRes.error));
      }

      message.success("Candidate account and profile updated successfully! ✅");
      setEditingCandidate(null);
      const updatedCandidate = {
        ...editingCandidate,
        ...profileFields,
        ...(updateRes && updateRes.id ? updateRes : {}),
      };
      setCandidates((prev) =>
        prev.map((c) => (c.id === editingCandidate.id ? updatedCandidate : c))
      );
      if (selectedCandidate && selectedCandidate.id === editingCandidate.id) {
        setSelectedCandidate((prev) => (prev ? { ...prev, ...updatedCandidate } : prev));
      }
    } catch (err) {
      console.error("Save candidate error:", err);
      message.error(err.message || "Failed to update candidate profile");
    }
  };

  const handleExtendValidity = async () => {
    if (!validityModalCandidate) return;
    setExtendingLoading(true);
    try {
      const today = new Date();
      today.setDate(today.getDate() + Number(extensionDays));
      const formattedDate = today.toISOString().split("T")[0];

      const res = await UserDataUpdate(validityModalCandidate.id, { Valid_Upto: formattedDate });
      if (res && res.error) {
        throw new Error(typeof res.error === "string" ? res.error : JSON.stringify(res.error));
      }

      const candUserId = validityModalCandidate.User_id?.id || validityModalCandidate.User_id;
      if (candUserId) {
        await UserTransactionsPost({
          User_id: candUserId,
          Plan: `Admin Extension (${extensionDays} Days)`,
          Amount: 0,
          status: "Success",
        }).catch((e) => console.warn("User txn log error:", e));
      }

      message.success(`Membership extended until ${formattedDate}! 👑`);
      setCandidates((prev) =>
        prev.map((c) => (c.id === validityModalCandidate.id ? { ...c, Valid_Upto: formattedDate } : c))
      );
      if (selectedCandidate && selectedCandidate.id === validityModalCandidate.id) {
        setSelectedCandidate((prev) => (prev ? { ...prev, Valid_Upto: formattedDate } : prev));
      }
      setValidityModalCandidate(null);
      const utxns = await UserTransactionsGet({ scope: "all" });
      setUserTxns(Array.isArray(utxns) ? utxns : utxns?.results || []);
    } catch (e) {
      console.error("Extend validity error:", e);
      message.error(e.message || "Failed to extend membership validity");
    } finally {
      setExtendingLoading(false);
    }
  };

  const handleToggleCandidateActive = async (candidate) => {
    try {
      const newStatus = candidate.Active === false;
      await UserDataToggleActive(candidate.id, newStatus);
      message.success(`Candidate ${candidate.Full_Name || ""} is now ${newStatus ? "Active" : "Inactive"}`);
      setCandidates((prev) => prev.map((item) => (item.id === candidate.id ? { ...item, Active: newStatus } : item)));
    } catch {
      message.error("Failed to update candidate status");
    }
  };

  const handleDeleteCandidate = async (id) => {
    try {
      await UserDataRemove(id);
      message.success("Candidate record removed");
      setCandidates((prev) => prev.filter((item) => item.id !== id));
    } catch {
      message.error("Failed to delete candidate");
    }
  };

  // Candidate Matchmaking & Wishlists
  const [wishlistSearch, setWishlistSearch] = useState("");
  const [wishlistStatusFilter, setWishlistStatusFilter] = useState("all");

  const filteredWishlists = useMemo(() => {
    return wishlists.filter((w) => {
      const q = wishlistSearch.toLowerCase().trim();
      const status = (w.Status || "Pending").toLowerCase();
      const matchesStatus = wishlistStatusFilter === "all" || status === wishlistStatusFilter.toLowerCase();
      const matchesQ = !q || String(w.User_id || "").includes(q) || String(w.Wish_User_id || "").includes(q);
      return matchesStatus && matchesQ;
    });
  }, [wishlists, wishlistSearch, wishlistStatusFilter]);

  const handleUpdateWishlistStatus = async (id, newStatus) => {
    try {
      await WishListUpdate(id, { Status: newStatus });
      message.success(`Match request status updated to ${newStatus}`);
      setWishlists((prev) => prev.map((w) => (w.id === id ? { ...w, Status: newStatus } : w)));
    } catch {
      message.error("Failed to update wishlist status");
    }
  };

  const handleDeleteWishlist = async (id) => {
    try {
      await WishListRemove(id);
      message.success("Wishlist record deleted");
      setWishlists((prev) => prev.filter((w) => w.id !== id));
    } catch {
      message.error("Failed to delete wishlist record");
    }
  };

  // Candidate Membership Plans CRUD
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm] = Form.useForm();

  const handleOpenPlanModal = (plan = null) => {
    setEditingPlan(plan);
    if (plan) {
      planForm.setFieldsValue({
        Plan: plan.Plan,
        Type: plan.Type || "Recharge",
        Amount: plan.Amount,
        Validity: plan.Validity,
        Discount_Amount: plan.Discount_Amount,
        Coupon_Code: plan.Coupon_Code,
        Msg: plan.Msg,
        Active: plan.Active !== false,
      });
    } else {
      planForm.resetFields();
      planForm.setFieldsValue({ Type: "Recharge", Active: true, Validity: 30, Amount: 100 });
    }
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (values) => {
    try {
      if (editingPlan) {
        await PlansUpdate(editingPlan.id, values);
        message.success("Membership package updated");
      } else {
        await PlansPost(values);
        message.success("Membership package created");
      }
      setIsPlanModalOpen(false);
      const res = await PlansGet();
      setPlansList(Array.isArray(res) ? res : res?.results || []);
    } catch {
      message.error("Failed to save plan");
    }
  };

  const handleDeletePlan = async (id) => {
    try {
      await PlansRemove(id);
      message.success("Membership package deleted");
      setPlansList((prev) => prev.filter((p) => p.id !== id));
    } catch {
      message.error("Failed to delete plan");
    }
  };

  // Manual Offline Subscription
  const [isManualTxnOpen, setIsManualTxnOpen] = useState(false);
  const [manualTxnForm] = Form.useForm();
  const [manualTxnLoading, setManualTxnLoading] = useState(false);

  const handleSaveManualTxn = async (values) => {
    setManualTxnLoading(true);
    try {
      await UserTransactionsPost({
        User_id: values.User_id,
        Plan: values.Plan || "Manual VIP Package",
        Amount: Number(values.Amount || 0),
        status: "Success",
      });

      message.success("Offline package activated successfully for user! 💳");
      setIsManualTxnOpen(false);
      manualTxnForm.resetFields();
      const utxns = await UserTransactionsGet({ scope: "all" });
      setUserTxns(Array.isArray(utxns) ? utxns : utxns?.results || []);
      const cands = await UserDataGetwt({ scope: "all" });
      setCandidates(Array.isArray(cands) ? cands : cands?.results || []);
    } catch {
      message.error("Failed to activate manual transaction");
    } finally {
      setManualTxnLoading(false);
    }
  };

  // -------------------------------------------------------------
  // SECTION 2: STAFF COUNSELOR PORTAL MANAGEMENT & FEATURES
  // -------------------------------------------------------------
  const [staffSearch, setStaffSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  const [isCreateStaffOpen, setIsCreateStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm] = Form.useForm();
  const [createStaffForm] = Form.useForm();

  // Staff Stepped Registration (Step 0: Phone & OTP, Step 1: Verify OTP, Step 2: Password, Step 3: Staff Profile)
  const [staffRegStep, setStaffRegStep] = useState(0);
  const [staffPhone, setStaffPhone] = useState("");
  const [staffPhoneError, setStaffPhoneError] = useState("");
  const [staffOtp, setStaffOtp] = useState(Array(6).fill(""));
  const [staffOtpError, setStaffOtpError] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffConfirmPassword, setStaffConfirmPassword] = useState("");
  const [staffShowPass, setStaffShowPass] = useState(false);
  const [staffPasswordError, setStaffPasswordError] = useState("");
  const [staffRefCode, setStaffRefCode] = useState("");
  const [staffCountdown, setStaffCountdown] = useState(120);
  const [staffCanResend, setStaffCanResend] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffCreatedUser, setStaffCreatedUser] = useState(null);
  const staffOtpRefs = useRef([]);
  const staffTimerRef = useRef(null);

  // Staff Wallet Adjustment Modal
  const [walletStaff, setWalletStaff] = useState(null);
  const [walletAmount, setWalletAmount] = useState(500);
  const [walletType, setWalletType] = useState("Credit");
  const [walletRemark, setWalletRemark] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);

  // Staff Payout Review Modal
  const [reviewWithdrawalModal, setReviewWithdrawalModal] = useState(null);
  const [withdrawalRemark, setWithdrawalRemark] = useState("");
  const [withdrawalActionLoading, setWithdrawalActionLoading] = useState(false);
  const [withdrawalFilter, setWithdrawalFilter] = useState("all");

  const filteredStaffWithdrawals = useMemo(() => {
    return staffTxns.filter((tx) => {
      if (withdrawalFilter === "pending") return tx.Status === "Pending";
      if (withdrawalFilter === "approved") return tx.Status === "Approved" || tx.Status === "Success";
      if (withdrawalFilter === "rejected") return tx.Status === "Rejected" || tx.Status === "Failed";
      return true;
    });
  }, [staffTxns, withdrawalFilter]);

  // Commission Rate
  const [commissionAmount, setCommissionAmount] = useState(50);
  const [savingCommission, setSavingCommission] = useState(false);

  useEffect(() => {
    if (staffCommission) {
      setCommissionAmount(staffCommission.Amount || 50);
    }
  }, [staffCommission]);

  const handleSaveCommissionRate = async () => {
    setSavingCommission(true);
    try {
      if (staffCommission && staffCommission.id) {
        await API.put(`staff-commission/${staffCommission.id}/`, {
          Amount: commissionAmount,
          Active: true,
        });
      } else {
        await API.post("staff-commission/", {
          Amount: commissionAmount,
          Active: true,
        });
      }
      message.success(`Staff commission rate locked at ₹${commissionAmount} per candidate.`);
    } catch {
      message.error("Failed to update commission rate");
    } finally {
      setSavingCommission(false);
    }
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const q = staffSearch.toLowerCase().trim();
      const name = (s.Full_Name || "").toLowerCase();
      const phone = (s.WP_Contact || "").toLowerCase();
      const email = (s.Email || "").toLowerCase();
      const ref = String(s.Refer || "").toLowerCase();
      return !q || name.includes(q) || phone.includes(q) || email.includes(q) || ref.includes(q);
    });
  }, [staffList, staffSearch]);

  const startStaffCountdown = useCallback(() => {
    setStaffCountdown(120);
    setStaffCanResend(false);
    if (staffTimerRef.current) clearInterval(staffTimerRef.current);
    staffTimerRef.current = setInterval(() => {
      setStaffCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(staffTimerRef.current);
          setStaffCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetStaffWizard = useCallback(() => {
    if (staffTimerRef.current) clearInterval(staffTimerRef.current);
    setStaffRegStep(0);
    setStaffPhone("");
    setStaffPhoneError("");
    setStaffOtp(Array(6).fill(""));
    setStaffOtpError("");
    setStaffPassword("");
    setStaffConfirmPassword("");
    setStaffShowPass(false);
    setStaffPasswordError("");
    setStaffRefCode("");
    setStaffCountdown(120);
    setStaffCanResend(false);
    setStaffLoading(false);
    setStaffCreatedUser(null);
    createStaffForm.resetFields();
  }, [createStaffForm]);

  const handleOpenCreateStaff = () => {
    resetStaffWizard();
    setIsCreateStaffOpen(true);
  };

  const handleCancelCreateStaff = () => {
    if (staffCreatedUser?.id && staffRegStep === 3) {
      message.info(`Staff counselor user account (#${staffCreatedUser.id}) was registered. Profile can be updated anytime from the staff table.`);
    }
    resetStaffWizard();
    setIsCreateStaffOpen(false);
  };

  const recentStaffOtp = useMemo(() => {
    if (!staffPhone || staffPhone.length < 10) return null;
    const match = phoneOtps.find((o) => String(o.Contact || "").trim() === staffPhone.trim());
    return match?.OTP || null;
  }, [staffPhone, phoneOtps]);

  const handleStaffSendOTP = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setStaffPhoneError("");
    const cleanPhone = String(staffPhone || "").trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      setStaffPhoneError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setStaffLoading(true);
    try {
      await API.post("send-otp/", { Contact: cleanPhone });
      message.success(`OTP sent successfully to +91 ${cleanPhone}`);
      try {
        const otpRes = await PhoneOTPGet();
        setPhoneOtps(Array.isArray(otpRes) ? otpRes : otpRes?.results || []);
      } catch {
        // background sync
      }
      setStaffRegStep(1);
      startStaffCountdown();
      setTimeout(() => staffOtpRefs.current[0]?.focus(), 150);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.Contact?.[0] || "Failed to send OTP.";
      setStaffPhoneError(typeof msg === "string" ? msg : JSON.stringify(msg));
      message.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setStaffLoading(false);
    }
  };

  const handleStaffOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...staffOtp];
    updated[index] = value;
    setStaffOtp(updated);
    setStaffOtpError("");
    if (value && index < 5) {
      staffOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleStaffOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !staffOtp[index] && index > 0) {
      staffOtpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) staffOtpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) staffOtpRefs.current[index + 1]?.focus();
  };

  const handleStaffOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const updated = Array(6).fill("");
      [...pasted].forEach((ch, i) => {
        if (i < 6) updated[i] = ch;
      });
      setStaffOtp(updated);
      setStaffOtpError("");
      staffOtpRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  const handleStaffResendOTP = async () => {
    setStaffOtp(Array(6).fill(""));
    setStaffOtpError("");
    setStaffLoading(true);
    try {
      await API.post("send-otp/", { Contact: staffPhone.trim() });
      message.success("OTP resent successfully to +91 " + staffPhone.trim());
      try {
        const otpRes = await PhoneOTPGet();
        setPhoneOtps(Array.isArray(otpRes) ? otpRes : otpRes?.results || []);
      } catch {
        // background sync
      }
      startStaffCountdown();
      setTimeout(() => staffOtpRefs.current[0]?.focus(), 100);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to resend OTP.";
      message.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setStaffLoading(false);
    }
  };

  const handleStaffVerifyOTP = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const fullOtp = staffOtp.join("");
    setStaffOtpError("");
    if (fullOtp.length < 6) {
      setStaffOtpError("Please enter complete 6-digit OTP code.");
      return;
    }
    setStaffLoading(true);
    try {
      await API.post("verify-otp/", {
        Contact: staffPhone.trim(),
        OTP: fullOtp,
        verify_only: true,
      });
      if (staffTimerRef.current) clearInterval(staffTimerRef.current);
      message.success("Mobile number verified! Please set staff counselor credentials.");
      const defaultPass = "Staff@" + staffPhone.trim().slice(-4);
      if (!staffPassword) {
        setStaffPassword(defaultPass);
        setStaffConfirmPassword(defaultPass);
      }
      setStaffRegStep(2);
    } catch (err) {
      const msg = err.response?.data?.error || "Invalid OTP code. Please try again.";
      setStaffOtpError(typeof msg === "string" ? msg : JSON.stringify(msg));
      message.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setStaffLoading(false);
    }
  };

  const handleStaffCreateAccount = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setStaffPasswordError("");
    if (!staffPassword) {
      setStaffPasswordError("Password is required.");
      return;
    }
    if (staffPassword.length < 8) {
      setStaffPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (staffPassword !== staffConfirmPassword) {
      setStaffPasswordError("Passwords do not match.");
      return;
    }
    const fullOtp = staffOtp.join("");
    setStaffLoading(true);
    try {
      const res = await API.post("verify-otp/", {
        Contact: staffPhone.trim(),
        OTP: fullOtp,
        password: staffPassword,
        Refered_By: staffRefCode ? String(staffRefCode).trim() : undefined,
        Role: "staff",
      });
      const newUser = res?.data?.user || res?.data || {};
      setStaffCreatedUser(newUser);
      message.success("Staff account registered! Now complete counselor profile.");
      try {
        const uRes = await UserGet();
        setUsersList(Array.isArray(uRes) ? uRes : uRes?.results || []);
      } catch {
        // background sync
      }
      createStaffForm.setFieldsValue({
        WP_Contact: staffPhone.trim(),
        Refer: staffPhone.trim().slice(-6),
      });
      setStaffRegStep(3);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || "Failed to register staff account.";
      setStaffPasswordError(typeof msg === "string" ? msg : JSON.stringify(msg));
      message.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setStaffLoading(false);
    }
  };

  const handleCreateStaffSubmit = async (values) => {
    const userId = staffCreatedUser?.id;
    if (!userId) {
      message.error("Staff account reference missing. Please restart registration.");
      return;
    }
    setStaffLoading(true);
    try {
      const fd = new FormData();
      fd.append("Staff_id", userId);
      fd.append("Full_Name", values.Full_Name);
      fd.append("WP_Contact", staffPhone.trim());
      fd.append("Email", values.Email || "");
      fd.append("Full_Address", values.Full_Address || "");
      fd.append("District", values.District || "");
      fd.append("State", values.State || "");
      fd.append("Bank_Name", values.Bank_Name || "");
      fd.append("Bank_Account_Number", values.Bank_Account_Number || "");
      fd.append("Bank_IFSC_Code", values.Bank_IFSC_Code || "");
      fd.append("UPI_ID", values.UPI_ID || "");
      fd.append("Refer", staffPhone.trim().slice(-6));
      fd.append("is_approved", "true");
      fd.append("Active", "true");

      await API.post("staff-data/", fd);
      message.success("Staff counselor account & profile created and approved! 🧑‍💼");
      setIsCreateStaffOpen(false);
      resetStaffWizard();
      const res = await StaffDataGet();
      setStaffList(Array.isArray(res) ? res : res?.results || []);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || "Failed to create staff";
      message.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setStaffLoading(false);
    }
  };

  const selectedCreateStaffState = Form.useWatch("State", createStaffForm);
  const staffCreateDistricts = useMemo(() => {
    if (!selectedCreateStaffState) return [];
    const matched = statesList.find(
      (s) => (s.State || "").toLowerCase() === selectedCreateStaffState.toLowerCase()
    );
    return Array.isArray(matched?.Districts) ? matched.Districts : [];
  }, [statesList, selectedCreateStaffState]);

  const handleOpenEditStaff = (s) => {
    setEditingStaff(s);
    const uAcc = usersList.find((u) => String(u.id) === String(s.Staff_id?.id || s.Staff_id));
    staffForm.setFieldsValue({
      // User account model fields
      user_Contact: uAcc?.Contact || s.WP_Contact || "",
      user_password: "",
      user_Refered_By: uAcc?.Refered_By || 0,
      user_Role: uAcc?.Role || "staff",
      user_is_active: uAcc?.is_active !== false,

      // StaffData profile model fields (all fields)
      Full_Name: s.Full_Name || "",
      Age: s.Age || null,
      WP_Contact: s.WP_Contact || "",
      Email: s.Email || "",
      Full_Address: s.Full_Address || "",
      District: s.District || "",
      State: s.State || "",
      City: s.City || "",
      Country: s.Country || "India",
      Adhar_Number: s.Adhar_Number || "",
      PAN_Number: s.PAN_Number || "",
      Bank_Name: s.Bank_Name || "",
      Bank_Account_Number: s.Bank_Account_Number || "",
      Bank_IFSC_Code: s.Bank_IFSC_Code || "",
      Bank_Account_Holder_Name: s.Bank_Account_Holder_Name || "",
      UPI_ID: s.UPI_ID || "",
      Amount: s.Amount !== undefined ? s.Amount : 0,
      Refer: s.Refer || "",
      is_approved: s.is_approved !== false,
      Active: s.Active !== false,
    });
  };

  const handleSaveEditStaff = async (values) => {
    try {
      const {
        user_Contact,
        user_password,
        user_Refered_By,
        user_Role,
        user_is_active,
        ...profileFields
      } = values;

      const userId = editingStaff.Staff_id?.id || editingStaff.Staff_id;
      if (userId) {
        const userPayload = {};
        if (user_Contact && user_Contact.trim()) {
          userPayload.Contact = user_Contact.trim();
          userPayload.username = user_Contact.trim();
        }
        if (user_password && user_password.trim()) {
          userPayload.password = user_password.trim();
        }
        if (user_Refered_By !== undefined && user_Refered_By !== null && user_Refered_By !== "") {
          userPayload.Refered_By = Number(user_Refered_By) || 0;
        }
        if (user_Role) {
          userPayload.Role = user_Role;
        }
        if (user_is_active !== undefined) {
          userPayload.is_active = Boolean(user_is_active);
        }

        if (Object.keys(userPayload).length > 0) {
          await API.patch(`users/${userId}/`, userPayload).catch((e) => {
            console.warn("User account update error:", e);
          });
          setUsersList((prev) =>
            prev.map((u) => (String(u.id) === String(userId) ? { ...u, ...userPayload } : u))
          );
        }
      }

      const fd = new FormData();
      Object.keys(profileFields).forEach((k) => {
        if (profileFields[k] !== undefined && profileFields[k] !== null) {
          fd.append(k, String(profileFields[k]));
        }
      });
      await StaffDataUpdate(editingStaff.id, fd);
      message.success("Staff counselor account and profile updated successfully! ✅");
      setEditingStaff(null);
      setStaffList((prev) =>
        prev.map((s) => (s.id === editingStaff.id ? { ...s, ...profileFields } : s))
      );
    } catch (err) {
      console.error("Save staff error:", err);
      message.error("Failed to update staff profile");
    }
  };

  const handleAdjustWalletSubmit = async () => {
    if (!walletStaff || !walletAmount || walletAmount <= 0) {
      message.error("Please enter a valid adjustment amount");
      return;
    }
    setWalletLoading(true);
    try {
      const currentAmt = Number(walletStaff.Amount || 0);
      const newAmt = walletType === "Credit" ? currentAmt + Number(walletAmount) : Math.max(0, currentAmt - Number(walletAmount));

      const fd = new FormData();
      fd.append("Amount", String(newAmt));
      await StaffDataUpdate(walletStaff.id, fd);

      await StaffTransactionsPost({
        Staff_id: walletStaff.Staff_id_id || walletStaff.Staff_id,
        Amount: Number(walletAmount),
        Type: walletType === "Credit" ? "Commission" : "Withdrawal",
        Status: "Approved",
        Msg: `Admin Adjustment (${walletType}): ${walletRemark || "Manual balance adjustment"}`,
      });

      message.success(`Wallet ${walletType}ed ₹${walletAmount}. New balance: ₹${newAmt} 💰`);
      setStaffList((prev) => prev.map((s) => (s.id === walletStaff.id ? { ...s, Amount: newAmt } : s)));
      setWalletStaff(null);
      setWalletRemark("");
      const stxns = await StaffTransactionsGet();
      setStaffTxns(Array.isArray(stxns) ? stxns : stxns?.results || []);
    } catch {
      message.error("Failed to adjust staff wallet balance");
    } finally {
      setWalletLoading(false);
    }
  };

  const handleUpdateWithdrawalStatus = async (txnId, newStatus) => {
    setWithdrawalActionLoading(true);
    try {
      const existingTxn = staffTxns.find((t) => t.id === txnId) || reviewWithdrawalModal || {};
      const staffRef = existingTxn.Staff_id?.id || existingTxn.Staff_id;
      const remarkText =
        (withdrawalRemark || "").trim() ||
        existingTxn.Msg ||
        (newStatus === "Approved" ? "Payout transferred via Bank/UPI" : "Rejected by Admin");

      await StaffTransactionsUpdate(txnId, {
        Staff_id: staffRef,
        Amount: existingTxn.Amount,
        Type: existingTxn.Type || "Withdrawal",
        Status: newStatus,
        Msg: remarkText,
      });

      message.success(`Withdrawal request marked as ${newStatus} (Auto-balance updated)`);
      setStaffTxns((prev) =>
        prev.map((t) => (t.id === txnId ? { ...t, Status: newStatus, Msg: remarkText } : t))
      );
      setReviewWithdrawalModal(null);
      setWithdrawalRemark("");

      const staffRes = await StaffDataGet();
      setStaffList(Array.isArray(staffRes) ? staffRes : staffRes?.results || []);
      const stxns = await StaffTransactionsGet();
      if (Array.isArray(stxns) || stxns?.results) {
        setStaffTxns(Array.isArray(stxns) ? stxns : stxns.results);
      }
    } catch (err) {
      console.error("Staff transaction update failed:", err);
    } finally {
      setWithdrawalActionLoading(false);
    }
  };

  const handleApproveStaff = async (staffId, isApproved) => {
    try {
      const fd = new FormData();
      fd.append("is_approved", String(isApproved));
      await StaffDataUpdate(staffId, fd);
      message.success(`Staff counselor ${isApproved ? "Approved" : "Unapproved"}`);
      setStaffList((prev) => prev.map((s) => (s.id === staffId ? { ...s, is_approved: isApproved } : s)));
    } catch {
      message.error("Failed to update staff approval");
    }
  };

  const handleToggleStaffActive = async (staffId, isActive) => {
    try {
      const fd = new FormData();
      fd.append("Active", String(isActive));
      await StaffDataUpdate(staffId, fd);
      message.success(`Staff account is now ${isActive ? "Active" : "Disabled"}`);
      setStaffList((prev) => prev.map((s) => (s.id === staffId ? { ...s, Active: isActive } : s)));
    } catch {
      message.error("Failed to update staff status");
    }
  };

  const handleDeleteStaff = async (id) => {
    try {
      await StaffDataRemove(id);
      message.success("Staff profile removed");
      setStaffList((prev) => prev.filter((s) => s.id !== id));
    } catch {
      message.error("Failed to delete staff");
    }
  };

  // -------------------------------------------------------------
  // SECTION 3: SERVICE PARTNER PORTAL MANAGEMENT & FEATURES
  // -------------------------------------------------------------
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState("all");
  const [serviceApprovalFilter, setServiceApprovalFilter] = useState("all");
  const [selectedService, setSelectedService] = useState(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceDetailTab, setServiceDetailTab] = useState("overview");

  // Service User Partner Dossier & Multi-Service Grouping States
  const [servicePartnerViewMode, setServicePartnerViewMode] = useState("users"); // "users" | "listings"
  const [serviceUserSearch, setServiceUserSearch] = useState("");
  const [selectedServiceUserModal, setSelectedServiceUserModal] = useState(null);
  const [isServiceUserModalOpen, setIsServiceUserModalOpen] = useState(false);
  const [serviceUserDetailTab, setServiceUserDetailTab] = useState("user_overview");

  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm] = Form.useForm();
  const [createServiceForm] = Form.useForm();

  // Service Stepped Registration (Step 0: Phone & OTP, Step 1: Verify OTP, Step 2: Password, Step 3: Service Profile)
  const [serviceRegStep, setServiceRegStep] = useState(0);
  const [servicePhone, setServicePhone] = useState("");
  const [servicePhoneError, setServicePhoneError] = useState("");
  const [serviceOtp, setServiceOtp] = useState(Array(6).fill(""));
  const [serviceOtpError, setServiceOtpError] = useState("");
  const [servicePassword, setServicePassword] = useState("");
  const [serviceConfirmPassword, setServiceConfirmPassword] = useState("");
  const [serviceShowPass, setServiceShowPass] = useState(false);
  const [servicePasswordError, setServicePasswordError] = useState("");
  const [serviceRefCode, setServiceRefCode] = useState("");
  const [serviceCountdown, setServiceCountdown] = useState(120);
  const [serviceCanResend, setServiceCanResend] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceCreatedUser, setServiceCreatedUser] = useState(null);
  const serviceOtpRefs = useRef([]);
  const serviceTimerRef = useRef(null);

  // Extend Service Partner Listing Validity Modal
  const [validityService, setValidityService] = useState(null);
  const [serviceValidityDays, setServiceValidityDays] = useState(365);
  const [extendingServiceLoading, setExtendingServiceLoading] = useState(false);

  // Categories & Charges Modals
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catalogForm] = Form.useForm();

  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState(null);
  const [chargeForm] = Form.useForm();

  const filteredServices = useMemo(() => {
    return servicesList.filter((s) => {
      const q = serviceSearch.toLowerCase().trim();
      const name = (s.Service_Name || "").toLowerCase();
      const type = (s.Service_Type || "").toLowerCase();
      const city = (s.City || "").toLowerCase();
      const dist = (s.District || "").toLowerCase();
      const wp = (s.WP_Contact || "").toLowerCase();
      const alt = (s.Alt_Contact || "").toLowerCase();
      const sid = String(s.id);
      const uid = String(s.Service_id?.id || s.Service_id || "");
      const matchesQ =
        !q ||
        name.includes(q) ||
        type.includes(q) ||
        city.includes(q) ||
        dist.includes(q) ||
        wp.includes(q) ||
        alt.includes(q) ||
        sid.includes(q) ||
        uid.includes(q);
      const matchesCat = serviceCategoryFilter === "all" || type === serviceCategoryFilter.toLowerCase();
      const matchesApproval =
        serviceApprovalFilter === "all"
          ? true
          : serviceApprovalFilter === "approved"
          ? s.Admin_Approval === true
          : s.Admin_Approval === false;
      return matchesQ && matchesCat && matchesApproval;
    });
  }, [servicesList, serviceSearch, serviceCategoryFilter, serviceApprovalFilter]);

  // Grouping: Distinct Service Users with their associated Service offerings
  const serviceUsersList = useMemo(() => {
    const serviceUserMap = new Map();

    // 1. Collect all registered users whose Role is service
    usersList.forEach((u) => {
      if (String(u.Role || "").toLowerCase() === "service") {
        serviceUserMap.set(String(u.id), {
          user: u,
          services: [],
        });
      }
    });

    // 2. Also map any services whose Service_id points to a user
    servicesList.forEach((s) => {
      const uId = String(s.Service_id?.id || s.Service_id || "");
      if (uId) {
        if (!serviceUserMap.has(uId)) {
          const userObj = usersList.find((u) => String(u.id) === uId) || {
            id: uId,
            username: s.WP_Contact ? `Partner (${s.WP_Contact})` : `User #${uId}`,
            Contact: s.WP_Contact || "",
            Role: "service",
            is_active: true,
          };
          serviceUserMap.set(uId, {
            user: userObj,
            services: [],
          });
        }
        serviceUserMap.get(uId).services.push(s);
      }
    });

    // 3. Compile full profile objects with computed metrics
    return Array.from(serviceUserMap.values()).map(({ user, services }) => {
      const primaryService = services[0] || null;
      const totalTxns = serviceTxns.filter((t) =>
        services.some((s) => String(s.id) === String(t.Service_id?.id || t.Service_id || "")) ||
        String(t.User_id?.id || t.User_id || "") === String(user.id)
      );
      const totalAmount = totalTxns.reduce((sum, t) => sum + (Number(t.Amount) || 0), 0);
      const approvedCount = services.filter((s) => s.Admin_Approval).length;
      const pendingCount = services.filter((s) => !s.Admin_Approval).length;

      return {
        id: user.id,
        user,
        username: user.username || `User #${user.id}`,
        phone: user.Contact || primaryService?.WP_Contact || "",
        altContact: primaryService?.Alt_Contact || "",
        city: primaryService?.City || "",
        district: primaryService?.District || "",
        state: primaryService?.State || "",
        country: primaryService?.Country || "India",
        services,
        servicesCount: services.length,
        approvedCount,
        pendingCount,
        totalTxns,
        totalAmount,
        primaryService,
        date_joined: user.date_joined || primaryService?.Create_date || "",
        is_active: user.is_active !== false,
      };
    });
  }, [usersList, servicesList, serviceTxns]);

  const filteredServiceUsers = useMemo(() => {
    return serviceUsersList.filter((su) => {
      if (serviceUserSearch.trim()) {
        const q = serviceUserSearch.trim().toLowerCase();
        const matchesUsername = String(su.username || "").toLowerCase().includes(q);
        const matchesPhone = String(su.phone || "").toLowerCase().includes(q);
        const matchesCity = String(su.city || "").toLowerCase().includes(q);
        const matchesServices = su.services.some(
          (s) =>
            String(s.Service_Name || "").toLowerCase().includes(q) ||
            String(s.Service_Type || "").toLowerCase().includes(q)
        );
        if (!matchesUsername && !matchesPhone && !matchesCity && !matchesServices) {
          return false;
        }
      }
      return true;
    });
  }, [serviceUsersList, serviceUserSearch]);

  const handleOpenServiceUserProfile = useCallback((input) => {
    if (!input) return;
    let targetUid = "";
    if (typeof input === "string") {
      targetUid = input;
    } else if (input.id && input.username && input.services !== undefined) {
      setSelectedServiceUserModal(input);
      setServiceUserDetailTab("user_overview");
      setIsServiceUserModalOpen(true);
      return;
    } else if (input.Service_id) {
      targetUid = String(input.Service_id?.id || input.Service_id || "");
    } else if (input.id) {
      targetUid = String(input.id);
    }

    const found = serviceUsersList.find((su) => String(su.id) === String(targetUid));
    if (found) {
      setSelectedServiceUserModal(found);
    } else {
      const userObj = usersList.find((u) => String(u.id) === String(targetUid));
      const srvs = servicesList.filter((s) => String(s.Service_id?.id || s.Service_id) === String(targetUid));
      setSelectedServiceUserModal({
        id: targetUid,
        user: userObj || { id: targetUid, username: `User #${targetUid}`, Role: "service" },
        username: userObj?.username || `User #${targetUid}`,
        phone: userObj?.Contact || srvs[0]?.WP_Contact || "",
        services: srvs,
        servicesCount: srvs.length,
        approvedCount: srvs.filter((s) => s.Admin_Approval).length,
        pendingCount: srvs.filter((s) => !s.Admin_Approval).length,
        city: srvs[0]?.City || "",
        state: srvs[0]?.State || "",
        totalTxns: [],
        totalAmount: 0,
        is_active: userObj ? userObj.is_active !== false : true,
      });
    }
    setServiceUserDetailTab("user_overview");
    setIsServiceUserModalOpen(true);
  }, [serviceUsersList, usersList, servicesList]);

  // Derived state for selectedService detailed modal
  const selectedServiceUser = useMemo(() => {
    if (!selectedService) return null;
    const targetUserId = String(selectedService.Service_id?.id || selectedService.Service_id || "");
    return usersList.find((u) => String(u.id) === targetUserId) || null;
  }, [selectedService, usersList]);

  const selectedServiceOfferings = useMemo(() => {
    if (!selectedService) return [];
    const targetUserId = String(selectedService.Service_id?.id || selectedService.Service_id || "");
    const targetServiceId = String(selectedService.id);
    const targetPhone = (selectedService.WP_Contact || "").trim();
    return servicesList.filter((s) => {
      const uId = String(s.Service_id?.id || s.Service_id || "");
      const sId = String(s.id);
      const sPhone = (s.WP_Contact || "").trim();
      return (
        (targetUserId && uId === targetUserId) ||
        sId === targetServiceId ||
        (targetPhone && sPhone === targetPhone)
      );
    });
  }, [selectedService, servicesList]);

  const selectedServiceTxns = useMemo(() => {
    if (!selectedService) return [];
    const targetUserId = String(selectedService.Service_id?.id || selectedService.Service_id || "");
    const targetServiceId = String(selectedService.id);
    return serviceTxns.filter((t) => {
      const tServiceId = String(t.Service_id?.id || t.Service_id || "");
      const tUserId = String(t.User_id?.id || t.User_id || "");
      return tServiceId === targetServiceId || (targetUserId && tUserId === targetUserId);
    });
  }, [selectedService, serviceTxns]);

  const selectedServiceTxnStats = useMemo(() => {
    const total = selectedServiceTxns.reduce((sum, t) => sum + (Number(t.Amount) || 0), 0);
    const success = selectedServiceTxns.filter((t) => (t.Status || "Success").toLowerCase() === "success");
    const successTotal = success.reduce((sum, t) => sum + (Number(t.Amount) || 0), 0);
    const pending = selectedServiceTxns.filter((t) => (t.Status || "").toLowerCase() === "pending");
    return {
      total,
      successCount: success.length,
      successTotal,
      pendingCount: pending.length,
    };
  }, [selectedServiceTxns]);

  const startServiceCountdown = useCallback(() => {
    setServiceCountdown(120);
    setServiceCanResend(false);
    if (serviceTimerRef.current) clearInterval(serviceTimerRef.current);
    serviceTimerRef.current = setInterval(() => {
      setServiceCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(serviceTimerRef.current);
          setServiceCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetServiceWizard = useCallback(() => {
    if (serviceTimerRef.current) clearInterval(serviceTimerRef.current);
    setServiceRegStep(0);
    setServicePhone("");
    setServicePhoneError("");
    setServiceOtp(Array(6).fill(""));
    setServiceOtpError("");
    setServicePassword("");
    setServiceConfirmPassword("");
    setServiceShowPass(false);
    setServicePasswordError("");
    setServiceRefCode("");
    setServiceCountdown(120);
    setServiceCanResend(false);
    setServiceLoading(false);
    setServiceCreatedUser(null);
    createServiceForm.resetFields();
  }, [createServiceForm]);

  const handleOpenCreateService = () => {
    resetServiceWizard();
    setIsCreateServiceOpen(true);
  };

  const handleCancelCreateService = () => {
    if (serviceCreatedUser?.id && serviceRegStep === 3) {
      message.info(`Service partner user account (#${serviceCreatedUser.id}) was registered. Profile can be updated anytime from the service table.`);
    }
    resetServiceWizard();
    setIsCreateServiceOpen(false);
  };

  const recentServiceOtp = useMemo(() => {
    if (!servicePhone || servicePhone.length < 10) return null;
    const match = phoneOtps.find((o) => String(o.Contact || "").trim() === servicePhone.trim());
    return match?.OTP || null;
  }, [servicePhone, phoneOtps]);

  const handleServiceSendOTP = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setServicePhoneError("");
    const cleanPhone = String(servicePhone || "").trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      setServicePhoneError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setServiceLoading(true);
    try {
      await API.post("send-otp/", { Contact: cleanPhone });
      message.success(`OTP sent successfully to +91 ${cleanPhone}`);
      try {
        const otpRes = await PhoneOTPGet();
        setPhoneOtps(Array.isArray(otpRes) ? otpRes : otpRes?.results || []);
      } catch {
        // background sync
      }
      setServiceRegStep(1);
      startServiceCountdown();
      setTimeout(() => serviceOtpRefs.current[0]?.focus(), 150);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.Contact?.[0] || "Failed to send OTP.";
      setServicePhoneError(typeof msg === "string" ? msg : JSON.stringify(msg));
      message.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setServiceLoading(false);
    }
  };

  const handleServiceOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...serviceOtp];
    updated[index] = value;
    setServiceOtp(updated);
    setServiceOtpError("");
    if (value && index < 5) {
      serviceOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleServiceOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !serviceOtp[index] && index > 0) {
      serviceOtpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) serviceOtpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) serviceOtpRefs.current[index + 1]?.focus();
  };

  const handleServiceOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const updated = Array(6).fill("");
      [...pasted].forEach((ch, i) => {
        if (i < 6) updated[i] = ch;
      });
      setServiceOtp(updated);
      setServiceOtpError("");
      serviceOtpRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  const handleServiceResendOTP = async () => {
    setServiceOtp(Array(6).fill(""));
    setServiceOtpError("");
    setServiceLoading(true);
    try {
      await API.post("send-otp/", { Contact: servicePhone.trim() });
      message.success("OTP resent successfully to +91 " + servicePhone.trim());
      try {
        const otpRes = await PhoneOTPGet();
        setPhoneOtps(Array.isArray(otpRes) ? otpRes : otpRes?.results || []);
      } catch {
        // background sync
      }
      startServiceCountdown();
      setTimeout(() => serviceOtpRefs.current[0]?.focus(), 100);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to resend OTP.";
      message.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setServiceLoading(false);
    }
  };

  const handleServiceVerifyOTP = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const fullOtp = serviceOtp.join("");
    setServiceOtpError("");
    if (fullOtp.length < 6) {
      setServiceOtpError("Please enter complete 6-digit OTP code.");
      return;
    }
    setServiceLoading(true);
    try {
      await API.post("verify-otp/", {
        Contact: servicePhone.trim(),
        OTP: fullOtp,
        verify_only: true,
      });
      if (serviceTimerRef.current) clearInterval(serviceTimerRef.current);
      message.success("Mobile number verified! Please set service partner credentials.");
      const defaultPass = "Serv@" + servicePhone.trim().slice(-4);
      if (!servicePassword) {
        setServicePassword(defaultPass);
        setServiceConfirmPassword(defaultPass);
      }
      setServiceRegStep(2);
    } catch (err) {
      const msg = err.response?.data?.error || "Invalid OTP code. Please try again.";
      setServiceOtpError(typeof msg === "string" ? msg : JSON.stringify(msg));
      message.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setServiceLoading(false);
    }
  };

  const handleServiceCreateAccount = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setServicePasswordError("");
    if (!servicePassword) {
      setServicePasswordError("Password is required.");
      return;
    }
    if (servicePassword.length < 8) {
      setServicePasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (servicePassword !== serviceConfirmPassword) {
      setServicePasswordError("Passwords do not match.");
      return;
    }
    const fullOtp = serviceOtp.join("");
    setServiceLoading(true);
    try {
      const res = await API.post("verify-otp/", {
        Contact: servicePhone.trim(),
        OTP: fullOtp,
        password: servicePassword,
        Refered_By: serviceRefCode ? String(serviceRefCode).trim() : undefined,
        Role: "service",
      });
      const newUser = res?.data?.user || res?.data || {};
      setServiceCreatedUser(newUser);
      message.success("Service account registered! Now complete business profile.");
      try {
        const uRes = await UserGet();
        setUsersList(Array.isArray(uRes) ? uRes : uRes?.results || []);
      } catch {
        // background sync
      }
      createServiceForm.setFieldsValue({
        WP_Contact: servicePhone.trim(),
        Service_Price: 15000,
      });
      setServiceRegStep(3);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || "Failed to register service account.";
      setServicePasswordError(typeof msg === "string" ? msg : JSON.stringify(msg));
      message.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setServiceLoading(false);
    }
  };

  const handleCreateServiceSubmit = async (values) => {
    const userId = serviceCreatedUser?.id;
    if (!userId) {
      message.error("Service partner account reference missing. Please restart registration.");
      return;
    }
    setServiceLoading(true);
    try {
      await API.post("service-data/", {
        Service_id: userId,
        Service_Name: values.Service_Name,
        Service_Type: values.Service_Type,
        Service_Price: values.Service_Price || 0,
        WP_Contact: servicePhone.trim(),
        Alt_Contact: values.Alt_Contact || "",
        City: values.City || "",
        District: values.District || "",
        State: values.State || "",
        Full_Address: values.Full_Address || "",
        Service_Description: values.Service_Description || "",
        Admin_Approval: true,
        Active: true,
      });

      message.success("Wedding service partner registered & approved! 🏪");
      setIsCreateServiceOpen(false);
      resetServiceWizard();
      const res = await ServiceDataGet({});
      setServicesList(Array.isArray(res) ? res : res?.results || []);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || "Failed to create service partner";
      message.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setServiceLoading(false);
    }
  };

  const selectedCreateServiceState = Form.useWatch("State", createServiceForm);
  const serviceCreateDistricts = useMemo(() => {
    if (!selectedCreateServiceState) return [];
    const matched = statesList.find(
      (s) => (s.State || "").toLowerCase() === selectedCreateServiceState.toLowerCase()
    );
    return Array.isArray(matched?.Districts) ? matched.Districts : [];
  }, [statesList, selectedCreateServiceState]);

  const handleOpenEditService = (s) => {
    setEditingService(s);
    const uAcc = usersList.find((u) => String(u.id) === String(s.Service_id?.id || s.Service_id));
    serviceForm.setFieldsValue({
      // User account model fields
      user_Contact: uAcc?.Contact || s.WP_Contact || "",
      user_password: "",
      user_Refered_By: uAcc?.Refered_By || 0,
      user_Role: uAcc?.Role || "service",
      user_is_active: uAcc?.is_active !== false,

      // ServiceData profile model fields (all fields)
      Service_Name: s.Service_Name || "",
      Service_Type: s.Service_Type || "",
      Service_Price: s.Service_Price || 0,
      WP_Contact: s.WP_Contact || "",
      Alt_Contact: s.Alt_Contact || "",
      City: s.City || "",
      District: s.District || "",
      State: s.State || "",
      Country: s.Country || "India",
      Full_Address: s.Full_Address || "",
      Service_Description: s.Service_Description || "",
      Available_Zone: Array.isArray(s.Available_Zone) ? s.Available_Zone.join(", ") : (s.Available_Zone || ""),
      Valid_Upto: s.Valid_Upto || "",
      Admin_Approval: s.Admin_Approval !== false,
      Active: s.Active !== false,
    });
  };

  const handleSaveEditService = async (values) => {
    try {
      const {
        user_Contact,
        user_password,
        user_Refered_By,
        user_Role,
        user_is_active,
        Available_Zone,
        ...profileFields
      } = values;

      if (typeof Available_Zone === "string") {
        profileFields.Available_Zone = Available_Zone.split(",").map((x) => x.trim()).filter(Boolean);
      }

      const userId = editingService.Service_id?.id || editingService.Service_id;
      if (userId) {
        const userPayload = {};
        if (user_Contact && user_Contact.trim()) {
          userPayload.Contact = user_Contact.trim();
          userPayload.username = user_Contact.trim();
        }
        if (user_password && user_password.trim()) {
          userPayload.password = user_password.trim();
        }
        if (user_Refered_By !== undefined && user_Refered_By !== null && user_Refered_By !== "") {
          userPayload.Refered_By = Number(user_Refered_By) || 0;
        }
        if (user_Role) {
          userPayload.Role = user_Role;
        }
        if (user_is_active !== undefined) {
          userPayload.is_active = Boolean(user_is_active);
        }

        if (Object.keys(userPayload).length > 0) {
          await API.patch(`users/${userId}/`, userPayload).catch((e) => {
            console.warn("User account update error:", e);
          });
          setUsersList((prev) =>
            prev.map((u) => (String(u.id) === String(userId) ? { ...u, ...userPayload } : u))
          );
        }
      }

      await ServiceDataUpdate(editingService.id, profileFields);
      message.success("Service vendor account and business profile updated successfully! ✅");
      setEditingService(null);
      setServicesList((prev) =>
        prev.map((s) => (s.id === editingService.id ? { ...s, ...profileFields } : s))
      );
    } catch (err) {
      console.error("Save service error:", err);
      message.error("Failed to update service partner");
    }
  };

  const handleExtendServiceValiditySubmit = async () => {
    if (!validityService) return;
    setExtendingServiceLoading(true);
    try {
      const today = new Date();
      today.setDate(today.getDate() + Number(serviceValidityDays));
      const formattedDate = today.toISOString().split("T")[0];

      await ServiceDataUpdate(validityService.id, { Valid_Upto: formattedDate });
      message.success(`Vendor listing validity extended until ${formattedDate}! 📅`);
      setServicesList((prev) =>
        prev.map((s) => (s.id === validityService.id ? { ...s, Valid_Upto: formattedDate } : s))
      );
      setValidityService(null);
    } catch {
      message.error("Failed to extend vendor listing validity");
    } finally {
      setExtendingServiceLoading(false);
    }
  };

  const handleApproveService = async (serviceId, isApproved) => {
    try {
      await ServiceDataUpdate(serviceId, { Admin_Approval: isApproved, Active: isApproved });
      message.success(`Wedding service ${isApproved ? "Approved & Activated" : "Unapproved"}`);
      setServicesList((prev) => prev.map((s) => (s.id === serviceId ? { ...s, Admin_Approval: isApproved, Active: isApproved } : s)));
    } catch {
      message.error("Failed to update service partner approval");
    }
  };

  const handleDeleteService = async (id) => {
    try {
      await ServiceDataRemove(id);
      message.success("Wedding service partner removed");
      setServicesList((prev) => prev.filter((s) => s.id !== id));
    } catch {
      message.error("Failed to delete partner");
    }
  };

  const handleOpenCatalogModal = (cat = null) => {
    setEditingCategory(cat);
    if (cat) {
      catalogForm.setFieldsValue({
        Service_Name: cat.Service_Name,
        Service_Type: cat.Service_Type,
        Active: cat.Active !== false,
      });
    } else {
      catalogForm.resetFields();
      catalogForm.setFieldsValue({ Active: true });
    }
    setIsCatalogModalOpen(true);
  };

  const handleSaveCatalogCategory = async (values) => {
    try {
      if (editingCategory) {
        await ServicesUpdate(editingCategory.id, values);
        message.success("Service category updated");
      } else {
        await ServicesPost(values);
        message.success("Service category created");
      }
      setIsCatalogModalOpen(false);
      const res = await ServicesGet();
      setServiceCategories(Array.isArray(res) ? res : res?.results || []);
    } catch {
      message.error("Failed to save service category");
    }
  };

  const handleDeleteCatalogCategory = async (id) => {
    try {
      await ServicesRemove(id);
      message.success("Service category removed");
      setServiceCategories((prev) => prev.filter((c) => c.id !== id));
    } catch {
      message.error("Failed to delete category");
    }
  };

  const handleOpenChargeModal = (ch = null) => {
    setEditingCharge(ch);
    if (ch) {
      chargeForm.setFieldsValue({
        Amount: ch.Amount,
        Service_Type: ch.Service_Type,
        Validity: ch.Validity,
        Active: ch.Active !== false,
      });
    } else {
      chargeForm.resetFields();
      chargeForm.setFieldsValue({ Active: true, Validity: 365, Amount: 500 });
    }
    setIsChargeModalOpen(true);
  };

  const handleSaveCharge = async (values) => {
    try {
      if (editingCharge) {
        await ServiceChargeUpdate(editingCharge.id, values);
        message.success("Vendor listing charge updated");
      } else {
        await ServiceChargePost(values);
        message.success("Vendor listing charge created");
      }
      setIsChargeModalOpen(false);
      const res = await ServiceChargeGet();
      setServiceCharges(Array.isArray(res) ? res : res?.results || []);
    } catch {
      message.error("Failed to save listing charge");
    }
  };

  const handleDeleteCharge = async (id) => {
    try {
      await ServiceChargeRemove(id);
      message.success("Listing charge removed");
      setServiceCharges((prev) => prev.filter((c) => c.id !== id));
    } catch {
      message.error("Failed to delete listing charge");
    }
  };

  // -------------------------------------------------------------
  // SECTION 4: PLATFORM MASTER OPERATIONS
  // -------------------------------------------------------------
  // Geographies
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [editingState, setEditingState] = useState(null);
  const [stateForm] = Form.useForm();

  const handleOpenStateModal = (st = null) => {
    setEditingState(st);
    if (st) {
      stateForm.setFieldsValue({
        State: st.State,
        Districts: Array.isArray(st.Districts) ? st.Districts.join(", ") : st.Districts,
        Active: st.Active !== false,
      });
    } else {
      stateForm.resetFields();
      stateForm.setFieldsValue({ Active: true });
    }
    setIsStateModalOpen(true);
  };

  const handleSaveState = async (values) => {
    try {
      const distList = (values.Districts || "").split(",").map((s) => s.trim()).filter(Boolean);
      const payload = { State: values.State, Districts: distList, Active: values.Active !== false };
      if (editingState) {
        await User_StateUpdate(editingState.id, payload);
        message.success("State & district list updated");
      } else {
        await User_StatePost(payload);
        message.success("State added successfully");
      }
      setIsStateModalOpen(false);
      const res = await User_StateGet();
      setStatesList(Array.isArray(res) ? res : res?.results || []);
    } catch {
      message.error("Failed to save state");
    }
  };

  const handleDeleteState = async (id) => {
    try {
      await User_StateRemove(id);
      message.success("State deleted");
      setStatesList((prev) => prev.filter((s) => s.id !== id));
    } catch {
      message.error("Failed to delete state");
    }
  };

  const [isNearDistModalOpen, setIsNearDistModalOpen] = useState(false);
  const [editingNearDist, setEditingNearDist] = useState(null);
  const [nearDistForm] = Form.useForm();

  const handleOpenNearDistModal = (nd = null) => {
    setEditingNearDist(nd);
    if (nd) {
      nearDistForm.setFieldsValue({
        State: nd.State,
        District: nd.District,
        Neardist: Array.isArray(nd.Neardist) ? nd.Neardist.join(", ") : nd.Neardist,
        Active: nd.Active !== false,
      });
    } else {
      nearDistForm.resetFields();
      nearDistForm.setFieldsValue({ Active: true });
    }
    setIsNearDistModalOpen(true);
  };

  const handleSaveNearDist = async (values) => {
    try {
      const distArray = (values.Neardist || "").split(",").map((s) => s.trim()).filter(Boolean);
      const payload = {
        State: values.State,
        District: values.District,
        Neardist: distArray,
        Active: values.Active !== false,
      };
      if (editingNearDist) {
        await NearDistUpdate(editingNearDist.id, payload);
        message.success("Nearby district mapping updated");
      } else {
        await NearDistPost(payload);
        message.success("Nearby district mapping added");
      }
      setIsNearDistModalOpen(false);
      const res = await NearDistGet();
      setNearDistList(Array.isArray(res) ? res : res?.results || []);
    } catch {
      message.error("Failed to save nearby district mapping");
    }
  };

  const handleDeleteNearDist = async (id) => {
    try {
      await NearDistRemove(id);
      message.success("Nearby district record removed");
      setNearDistList((prev) => prev.filter((n) => n.id !== id));
    } catch {
      message.error("Failed to delete record");
    }
  };

  // Attributes
  const [attrModalOpen, setAttrModalOpen] = useState(false);
  const [attrType, setAttrType] = useState("");
  const [editingAttr, setEditingAttr] = useState(null);
  const [attrForm] = Form.useForm();

  const handleOpenAttrModal = (type, item = null) => {
    setAttrType(type);
    setEditingAttr(item);
    attrForm.resetFields();
    if (item) {
      if (type === "religion") attrForm.setFieldsValue({ Religion_Name: item.Religion_Name, Active: item.Active !== false });
      if (type === "caste") {
        attrForm.setFieldsValue({
          Caste_Name: Array.isArray(item.Caste_Name) ? item.Caste_Name.join(", ") : item.Caste_Name,
          Religion: item.Religion,
          State: item.State,
          Active: item.Active !== false,
        });
      }
      if (type === "profession") attrForm.setFieldsValue({ Profession_Name: item.Profession_Name, Active: item.Active !== false });
      if (type === "language") attrForm.setFieldsValue({ Language: item.Language, State: item.State, Active: item.Active !== false });
      if (type === "color") attrForm.setFieldsValue({ Color: item.Color, Active: item.Active !== false });
    } else {
      attrForm.setFieldsValue({ Active: true });
    }
    setAttrModalOpen(true);
  };

  const handleSaveAttribute = async (values) => {
    try {
      if (attrType === "religion") {
        if (editingAttr) await ReligionUpdate(editingAttr.id, values);
        else await ReligionPost(values);
        const res = await ReligionGet();
        setReligions(Array.isArray(res) ? res : res?.results || []);
      } else if (attrType === "caste") {
        const casteArray = (values.Caste_Name || "").split(",").map((s) => s.trim()).filter(Boolean);
        const payload = { ...values, Caste_Name: casteArray };
        if (editingAttr) await User_CasteUpdate(editingAttr.id, payload);
        else await User_CastePost(payload);
        const res = await User_CasteGet();
        setCastes(Array.isArray(res) ? res : res?.results || []);
      } else if (attrType === "profession") {
        if (editingAttr) await ProfessionUpdate(editingAttr.id, values);
        else await ProfessionPost(values);
        const res = await ProfessionGet();
        setProfessions(Array.isArray(res) ? res : res?.results || []);
      } else if (attrType === "language") {
        if (editingAttr) await LanguageUpdate(editingAttr.id, values);
        else await LanguagePost(values);
        const res = await LanguageGet();
        setLanguages(Array.isArray(res) ? res : res?.results || []);
      } else if (attrType === "color") {
        if (editingAttr) await ColorUpdate(editingAttr.id, values);
        else await ColorPost(values);
        const res = await ColorGet();
        setColors(Array.isArray(res) ? res : res?.results || []);
      }
      message.success(`Master ${attrType} updated successfully`);
      setAttrModalOpen(false);
    } catch {
      message.error(`Failed to save ${attrType}`);
    }
  };

  const handleDeleteAttribute = async (type, id) => {
    try {
      if (type === "religion") {
        await ReligionRemove(id);
        setReligions((prev) => prev.filter((i) => i.id !== id));
      } else if (type === "caste") {
        await User_CasteRemove(id);
        setCastes((prev) => prev.filter((i) => i.id !== id));
      } else if (type === "profession") {
        await ProfessionRemove(id);
        setProfessions((prev) => prev.filter((i) => i.id !== id));
      } else if (type === "language") {
        await LanguageRemove(id);
        setLanguages((prev) => prev.filter((i) => i.id !== id));
      } else if (type === "color") {
        await ColorRemove(id);
        setColors((prev) => prev.filter((i) => i.id !== id));
      }
      message.success("Item removed");
    } catch {
      message.error("Failed to delete item");
    }
  };

  // Support
  const [replyTicketModal, setReplyTicketModal] = useState(null);
  const [ticketAnswer, setTicketAnswer] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [selectedDetailTicket, setSelectedDetailTicket] = useState(null);
  const [isTicketDetailModalOpen, setIsTicketDetailModalOpen] = useState(false);

  const handleOpenTicketDetails = (ticket) => {
    setSelectedDetailTicket(ticket);
    setIsTicketDetailModalOpen(true);
    if (ticket?.id) {
      setSeenAdminHelpIds((prev) => {
        if (!prev.includes(String(ticket.id))) {
          const merged = [...prev, String(ticket.id)];
          try {
            localStorage.setItem("ap_seen_help_tickets", JSON.stringify(merged));
          } catch (e) {
            console.error("Failed to save seen admin ticket:", e);
          }
          return merged;
        }
        return prev;
      });
    }
  };

  const handleReplyTicket = async () => {
    if (!ticketAnswer.trim()) {
      message.error("Please enter a response before sending.");
      return;
    }
    setSubmittingReply(true);
    try {
      await HelpUpdate(replyTicketModal.id, {
        Answer: ticketAnswer.trim(),
        Role: "Admin",
        updated_date: new Date().toISOString(),
      });
      message.success("Support solution transmitted to member successfully! ✉");
      setHelpTickets((prev) =>
        prev.map((t) => (t.id === replyTicketModal.id ? { ...t, Answer: ticketAnswer.trim(), Role: "Admin" } : t))
      );
      setReplyTicketModal(null);
      setTicketAnswer("");
    } catch {
      message.error("Failed to transmit reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  // Stories
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [storyForm] = Form.useForm();

  const handleOpenStoryModal = (story = null) => {
    setEditingStory(story);
    if (story) {
      storyForm.setFieldsValue({
        Male_Name: story.Male_Name,
        Female_Name: story.Female_Name,
        City: story.City,
        Success_Story_Text: story.Success_Story_Text,
        Active: story.Active !== false,
      });
    } else {
      storyForm.resetFields();
      storyForm.setFieldsValue({ Active: true });
    }
    setIsStoryModalOpen(true);
  };

  const handleSaveStory = async (values) => {
    try {
      if (editingStory) {
        await SuccessStoryUpdate(editingStory.Success_id || editingStory.id, values);
        message.success("Success Story Updated");
      } else {
        await SuccessStoryPost(values);
        message.success("Success Story Published");
      }
      setIsStoryModalOpen(false);
      const res = await SuccessStoryGet();
      setSuccessStories(Array.isArray(res) ? res : res?.results || []);
    } catch {
      message.error("Failed to save success story");
    }
  };

  const handleDeleteStory = async (id) => {
    try {
      await SuccessStoryRemove(id);
      message.success("Success story removed");
      setSuccessStories((prev) => prev.filter((s) => (s.Success_id || s.id) !== id));
    } catch {
      message.error("Failed to delete story");
    }
  };

  // Security & Users
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  const handleToggleUserActive = async (userObj) => {
    try {
      const newActive = !userObj.is_active;
      await UserUpdate(userObj.id, { is_active: newActive });
      message.success(`User ${userObj.username} is now ${newActive ? "Active" : "Inactive"}`);
      setUsersList((prev) => prev.map((u) => (u.id === userObj.id ? { ...u, is_active: newActive } : u)));
    } catch {
      message.error("Failed to toggle user status");
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      await UserUpdate(userId, { Role: newRole });
      message.success(`User role changed to ${newRole}`);
      setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, Role: newRole } : u)));
    } catch {
      message.error("Failed to update user role");
    }
  };

  const handleDeleteUserAccount = async (userId) => {
    try {
      await UserRemove(userId);
      message.success("User account deleted");
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      message.error("Failed to delete user account");
    }
  };

  const handleDeletePhoneOtp = async (otpId) => {
    try {
      await PhoneOTPRemove(otpId);
      message.success("OTP record cleared");
      setPhoneOtps((prev) => prev.filter((o) => o.id !== otpId));
    } catch {
      message.error("Failed to delete OTP record");
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.clear();
    message.success("Logged out from Administrator session");
    navigate("/");
  };

  // Field Inspector & Modal Helpers
  const handleInspectRecord = (modelKey, record) => {
    setInspectRecord({ modelKey, data: record });
    setIsInspectDrawerOpen(true);
    setInspectRawJsonView(false);
    setDrawerFieldSearch("");
  };

  const handleOpenBiodata = async (cand) => {
    if (!cand) return;
    setSelectedCandidate(cand);
    setIsCandidateModalOpen(true);
    try {
      const candId = cand.id || cand.User_id;
      if (candId) {
        const res = await API.get(`user-data/${candId}/`).catch(() => null);
        if (res && res.data) {
          setSelectedCandidate((prev) => ({ ...(prev || {}), ...res.data }));
        }
      }
    } catch (e) {
      console.error("Failed to fetch fresh candidate biodata from backend:", e);
    }
  };

  const getInquirerInfo = useCallback((ticket) => {
    if (!ticket) return { name: "Platform Member", roleType: "Candidate", phone: "" };
    const uid = typeof ticket.User_id === "object" ? ticket.User_id?.id : ticket.User_id;
    const userRole = String(ticket.User_Role || "").toLowerCase();

    if (userRole === "staff") {
      const staff = staffList.find((s) => String(s.Staff_id || s.id) === String(uid));
      if (staff?.Full_Name) return { name: staff.Full_Name, roleType: "Staff Counselor", phone: staff.WP_Contact || "" };
    }
    if (userRole === "service") {
      const user = usersList.find((u) => String(u.id) === String(uid));
      const srv = servicesList.find((s) => String(s.Service_id || s.id) === String(uid));
      const srvUsername = user?.username || ticket.sender_name || (srv?.WP_Contact ? `Service Partner (${srv.WP_Contact})` : `Service Partner #${uid}`);
      return {
        name: srvUsername,
        roleType: "Service Partner",
        phone: srv?.WP_Contact || user?.Contact || ticket.sender_contact || "",
        serviceName: srv?.Service_Name || "",
      };
    }

    const cand = candidates.find((c) => String(c.User_id || c.id) === String(uid));
    if (cand?.Full_Name) return { name: cand.Full_Name, roleType: "Candidate", phone: cand.WP_Contact || "" };

    const user = usersList.find((u) => String(u.id) === String(uid));
    if (user) {
      const r = String(user.Role || "").toLowerCase();
      const typeLabel = r === "staff" ? "Staff Counselor" : r === "service" ? "Service Partner" : "Candidate";
      return { name: user.username || `Member #${uid}`, roleType: typeLabel, phone: user.Contact || "" };
    }

    return { name: ticket.sender_name || `Member #${uid || "Guest"}`, roleType: "Candidate", phone: ticket.sender_contact || "" };
  }, [candidates, staffList, servicesList, usersList]);

  const isStaffAssignee = useCallback((ticket) => {
    if (!ticket) return false;
    const explicitRole = String(ticket.target_role || ticket.Role || ticket.target || "").toLowerCase();

    // 1. Explicit admin routing always takes precedence
    if (explicitRole === "admin" || explicitRole === "superadmin") {
      return false;
    }

    // 2. Check if Target_User_id belongs to a staff counselor
    const targetId = typeof ticket.Target_User_id === "object" ? ticket.Target_User_id?.id : ticket.Target_User_id;
    if (targetId) {
      const isStaffInList = staffList.some(
        (s) => String(s.Staff_id?.id || s.Staff_id || s.id) === String(targetId)
      );
      if (isStaffInList) return true;

      const user = usersList.find((u) => String(u.id) === String(targetId));
      if (user && String(user.Role || "").toLowerCase() === "staff") return true;
      if (user && ["admin", "superadmin"].includes(String(user.Role || "").toLowerCase())) return false;
    }

    // 3. If explicitRole is staff
    if (explicitRole === "staff") {
      return true;
    }

    // 4. Default to Admin
    return false;
  }, [staffList, usersList]);

  const getTargetAssigneeName = useCallback((ticket) => {
    if (!ticket) return "Assign to Admin";
    const isStaff = isStaffAssignee(ticket);

    if (isStaff) {
      const targetId = typeof ticket.Target_User_id === "object" ? ticket.Target_User_id?.id : ticket.Target_User_id;
      if (targetId) {
        const staff = staffList.find(
          (s) => String(s.Staff_id?.id || s.Staff_id || s.id) === String(targetId)
        );
        if (staff?.Full_Name) return `Assign to Staff (${staff.Full_Name})`;
        const user = usersList.find((u) => String(u.id) === String(targetId));
        if (user?.Full_Name || user?.username) return `Assign to Staff (${user.Full_Name || user.username})`;
      }
      if (ticket.target_name && !["admin", "staff counselor", "staff"].includes(String(ticket.target_name).toLowerCase())) {
        return `Assign to Staff (${ticket.target_name})`;
      }
      return "Assign to Staff";
    }

    return "Assign to Admin";
  }, [isStaffAssignee, staffList, usersList]);

  const getReplierName = (ticket) => {
    if (!ticket || (!ticket.Answer && !ticket.is_answered)) return null;
    const replierId = typeof ticket.Reply_By === "object" ? ticket.Reply_By?.id : ticket.Reply_By;
    if (replierId) {
      const staff = staffList.find((s) => String(s.Staff_id || s.id) === String(replierId));
      if (staff?.Full_Name) return staff.Full_Name;
      const user = usersList.find((u) => String(u.id) === String(replierId));
      if (user?.Role === "staff") return user.username || "Staff Counselor";
      if (user?.Role === "admin" || user?.Role === "superadmin") return "Head Office Admin";
    }
    return ticket.Role === "staff" ? "Staff Counselor" : "Head Office Admin";
  };

  const handleDeleteTicket = async (ticketId) => {
    try {
      await HelpRemove(ticketId);
      message.success("Support ticket deleted successfully! 🗑️");
      setHelpTickets((prev) => prev.filter((t) => t.id !== ticketId));
    } catch (err) {
      console.error("Failed to delete support ticket:", err);
      message.error("Failed to delete support ticket.");
    }
  };

  const filteredHelpTickets = useMemo(() => {
    return helpTickets.filter((t) => {
      // 1. Search query
      if (helpSearch.trim()) {
        const q = helpSearch.trim().toLowerCase();
        const inq = getInquirerInfo(t);
        const matchesQ = String(t.Question || "").toLowerCase().includes(q);
        const matchesAns = String(t.Answer || "").toLowerCase().includes(q);
        const matchesName = inq.name.toLowerCase().includes(q) || (inq.serviceName && inq.serviceName.toLowerCase().includes(q));
        const matchesId = String(t.id).includes(q);
        if (!matchesQ && !matchesAns && !matchesName && !matchesId) return false;
      }

      // 2. Assignee / Target filter
      const isStaffTarget = isStaffAssignee(t);

      if (helpAssigneeFilter === "admin" && isStaffTarget) return false;
      if (helpAssigneeFilter === "staff" && !isStaffTarget) return false;

      // 3. Status filter
      const isAnswered = Boolean(t.Answer && t.Answer.trim());
      if (helpStatusFilter === "pending" && isAnswered) return false;
      if (helpStatusFilter === "answered" && !isAnswered) return false;

      // 4. Sender filter
      if (helpSenderFilter !== "all") {
        const inq = getInquirerInfo(t);
        const rType = inq.roleType.toLowerCase();
        if (helpSenderFilter === "user" && !rType.includes("candidate")) return false;
        if (helpSenderFilter === "staff" && !rType.includes("staff")) return false;
        if (helpSenderFilter === "service" && !rType.includes("service")) return false;
      }

      return true;
    });
  }, [helpTickets, helpSearch, helpAssigneeFilter, helpStatusFilter, helpSenderFilter, getInquirerInfo, isStaffAssignee]);

  const handleOpenStaffKyc = (staff) => {
    setSelectedStaff(staff);
    setIsStaffModalOpen(true);
  };

  const handleOpenServiceKyc = (srv) => {
    setSelectedService(srv);
    setServiceDetailTab("overview");
    setIsServiceModalOpen(true);
  };

  const handleOpenTicketReply = (ticket) => {
    setReplyTicketModal(ticket);
    setTicketAnswer(ticket?.Answer || "");
  };

  // -------------------------------------------------------------
  // UNIVERSAL REPOSITORIES METADATA FOR ALL 22 DJANGO BACKEND MODELS
  // -------------------------------------------------------------
  const allModelsMeta = [
    {
      key: "User_Data",
      name: "User_Data (Candidate Matrimonial Profiles)",
      category: "User & Candidates",
      data: candidates,
      fields: ['id', 'User_id', 'Full_Name', 'Profile_Pic', 'Caste', 'Gotra', 'Religion', 'Gender', 'DOB', 'Age', 'WP_Contact', 'WP_Contact_Relation', 'Wp_Contact_Name', 'Alt_Contact', 'Alt_Contact_Relation', 'Alt_Contact_Name', 'Full_Address', 'Email', 'District', 'Nearestdist', 'State', 'City', 'Country', 'Accept_Profiles', 'Marrige_status', 'Qualification', 'Profession', 'Job_type', 'Salary', 'Disability', 'Manglik', 'Vegeterian', 'Father_name', 'Father_Age', 'Father_Profession', 'Mother_name', 'Mother_Age', 'Mother_Profession', 'House', 'Brothers', 'Brothers_marrige', 'Sisters', 'Sisters_marrige', 'Mother_tongue', 'Height', 'Weight', 'Color', 'Create_date', 'Valid_Upto', 'Active'],
      primaryCols: ['User_id', 'Full_Name', 'Gender', 'Age', 'Caste', 'City', 'WP_Contact', 'Active'],
      onInspect: (r) => handleOpenBiodata(r),
    },
    {
      key: "Plans",
      name: "Plans (Recharge & Membership Packages)",
      category: "User & Candidates",
      data: plansList,
      fields: ['id', 'Plan', 'Type', 'Coupon_Code', 'Discount_Amount', 'Amount', 'Validity', 'Msg', 'Create_date', 'Active'],
      primaryCols: ['id', 'Plan', 'Type', 'Amount', 'Validity', 'Discount_Amount', 'Coupon_Code', 'Active'],
      onEdit: (r) => handleOpenPlanModal(r),
    },
    {
      key: "User_Transactions",
      name: "User_Transactions (Candidate Recharges & Orders)",
      category: "User & Candidates",
      data: userTxns,
      fields: ['id', 'User_id', 'Plan', 'Amount', 'status', 'Create_date'],
      primaryCols: ['id', 'User_id', 'Plan', 'Amount', 'status', 'Create_date'],
    },
    {
      key: "Wish_List",
      name: "Wish_List (Candidate Matchmaking Connections)",
      category: "User & Candidates",
      data: wishlists,
      fields: ['id', 'User_id', 'Wish_User_id', 'Status', 'is_shortlisted', 'Create_date'],
      primaryCols: ['id', 'User_id', 'Wish_User_id', 'Status', 'is_shortlisted', 'Create_date'],
    },
    {
      key: "Staff_Data",
      name: "Staff_Data (Marriage Counselors Directory & KYC)",
      category: "Staff Counselors",
      data: staffList,
      fields: ['id', 'Staff_id', 'Full_Name', 'Profile_Pic', 'WP_Contact', 'Age', 'Full_Address', 'District', 'State', 'City', 'Country', 'Email', 'Adhar_Number', 'Adhar_Image', 'PAN_Number', 'PAN_Image', 'Bank_Name', 'Bank_Account_Number', 'Bank_IFSC_Code', 'Bank_Account_Holder_Name', 'Bank_Passbook_Image', 'UPI_ID', 'Amount', 'Refer', 'Create_date', 'Active', 'is_approved'],
      primaryCols: ['Staff_id', 'Full_Name', 'WP_Contact', 'District', 'State', 'Amount', 'is_approved', 'Active'],
      onInspect: (r) => handleOpenStaffKyc(r),
    },
    {
      key: "Staff_Transactions",
      name: "Staff_Transactions (Counselor Payout Requests)",
      category: "Staff Counselors",
      data: staffTxns,
      fields: ['id', 'Staff_id', 'Amount', 'Type', 'Status', 'Msg', 'Create_date'],
      primaryCols: ['id', 'Staff_id', 'Amount', 'Type', 'Status', 'Msg', 'Create_date'],
    },
    {
      key: "Staff_Commission",
      name: "Staff_Commission (Per-Referral Commission Rate)",
      category: "Staff Counselors",
      data: staffCommission ? [staffCommission] : [],
      fields: ['id', 'Amount', 'Active', 'Create_date'],
      primaryCols: ['id', 'Amount', 'Active', 'Create_date'],
    },
    {
      key: "Service_Data",
      name: "Service_Data (Wedding Vendors Directory & Profiles)",
      category: "Wedding Services",
      data: servicesList,
      fields: ['id', 'Service_id', 'Service_Name', 'Picture', 'Service_Type', 'Service_Description', 'Service_Price', 'WP_Contact', 'Alt_Contact', 'City', 'State', 'District', 'Country', 'Available_Zone', 'Full_Address', 'Like', 'DisLike', 'Valid_Upto', 'Admin_Approval', 'Active', 'Create_date'],
      primaryCols: ['Service_id', 'Service_Name', 'Service_Type', 'Service_Price', 'City', 'WP_Contact', 'Admin_Approval', 'Active'],
      onInspect: (r) => handleOpenServiceKyc(r),
    },
    {
      key: "Services",
      name: "Services (Wedding Service Categories Catalog)",
      category: "Wedding Services",
      data: serviceCategories,
      fields: ['id', 'Service_Name', 'Service_Type', 'Create_date', 'Active'],
      primaryCols: ['id', 'Service_Name', 'Service_Type', 'Active', 'Create_date'],
    },
    {
      key: "Service_Charge",
      name: "Service_Charge (Vendor Listing Fee Charges)",
      category: "Wedding Services",
      data: serviceCharges,
      fields: ['id', 'Amount', 'Service_Type', 'Active', 'Create_date', 'Validity'],
      primaryCols: ['id', 'Amount', 'Service_Type', 'Validity', 'Active', 'Create_date'],
    },
    {
      key: "Service_Transactions",
      name: "Service_Transactions (Vendor Fee Payment Invoices)",
      category: "Wedding Services",
      data: serviceTxns,
      fields: ['id', 'User_id', 'Service_id', 'Amount', 'Status', 'Create_date'],
      primaryCols: ['id', 'User_id', 'Service_id', 'Amount', 'Status', 'Create_date'],
    },
    {
      key: "Religion",
      name: "Religion (Matrimonial Religions Master)",
      category: "Match Criteria",
      data: religions,
      fields: ['id', 'Religion_Name', 'Create_date', 'Active'],
      primaryCols: ['id', 'Religion_Name', 'Active', 'Create_date'],
      onEdit: (r) => handleOpenAttrModal("religion", r),
    },
    {
      key: "Caste",
      name: "Caste (Castes & Sub-castes / Gotras Master)",
      category: "Match Criteria",
      data: castes,
      fields: ['id', 'Caste_Name', 'Religion', 'State', 'Create_date', 'Active'],
      primaryCols: ['id', 'Religion', 'State', 'Caste_Name', 'Active'],
      onEdit: (r) => handleOpenAttrModal("caste", r),
    },
    {
      key: "Profession",
      name: "Profession (Professions & Careers Master)",
      category: "Match Criteria",
      data: professions,
      fields: ['id', 'Profession_Name', 'Create_date', 'Active'],
      primaryCols: ['id', 'Profession_Name', 'Active', 'Create_date'],
      onEdit: (r) => handleOpenAttrModal("profession", r),
    },
    {
      key: "Language",
      name: "Language (Languages & Mother Tongues Master)",
      category: "Match Criteria",
      data: languages,
      fields: ['id', 'State', 'Language', 'Create_date', 'Active'],
      primaryCols: ['id', 'State', 'Language', 'Active', 'Create_date'],
      onEdit: (r) => handleOpenAttrModal("language", r),
    },
    {
      key: "Color",
      name: "Color (Complexions & Skin Tones Master)",
      category: "Match Criteria",
      data: colors,
      fields: ['id', 'Color', 'Create_date', 'Active'],
      primaryCols: ['id', 'Color', 'Active', 'Create_date'],
      onEdit: (r) => handleOpenAttrModal("color", r),
    },
    {
      key: "States_With_Districts",
      name: "States_With_Districts (States & Districts Directory)",
      category: "Geographies",
      data: statesList,
      fields: ['id', 'State', 'Districts', 'Active', 'Ceated_date'],
      primaryCols: ['id', 'State', 'Districts', 'Active', 'Ceated_date'],
      onEdit: (r) => handleOpenStateModal(r),
    },
    {
      key: "NearDist",
      name: "NearDist (Proximity & Nearby Matching Districts)",
      category: "Geographies",
      data: nearDistList,
      fields: ['id', 'State', 'District', 'Neardist', 'Active', 'Ceated_date'],
      primaryCols: ['id', 'State', 'District', 'Neardist', 'Active'],
      onEdit: (r) => handleOpenNearDistModal(r),
    },
    {
      key: "Help",
      name: "Help (Customer Support Inquiries & Tickets)",
      category: "Support & Stories",
      data: helpTickets,
      fields: ['id', 'User_id', 'User_Role', 'Target_User_id', 'Reply_By', 'Question', 'Answer', 'Role', 'created_date', 'updated_date', 'Create_date', 'Active'],
      primaryCols: ['id', 'User_id', 'Role', 'Question', 'Answer', 'Active', 'created_date'],
      onEdit: (r) => handleOpenTicketReply(r),
    },
    {
      key: "Success_Story",
      name: "Success_Story (Wedding Stories & Testimonials)",
      category: "Support & Stories",
      data: successStories,
      fields: ['Success_id', 'Male_Name', 'Female_Name', 'Success_Story_Text', 'Success_Story_Image', 'City', 'Create_date', 'Active'],
      primaryCols: ['Success_id', 'Male_Name', 'Female_Name', 'City', 'Active', 'Create_date'],
      onEdit: (r) => handleOpenStoryModal(r),
    },
    {
      key: "User",
      name: "User (Authentication Accounts & Role Access)",
      category: "Accounts & Security",
      data: usersList,
      fields: ['id', 'username', 'email', 'first_name', 'last_name', 'Role', 'Reference_Code', 'Contact', 'Refered_By', 'is_active', 'is_staff', 'is_superuser', 'date_joined', 'last_login'],
      primaryCols: ['id', 'username', 'email', 'Role', 'Contact', 'is_active', 'date_joined'],
    },
    {
      key: "PhoneOTP",
      name: "PhoneOTP (SMS Verification Tokens & Audit Logs)",
      category: "Accounts & Security",
      data: phoneOtps,
      fields: ['id', 'phone', 'otp', 'created_at'],
      primaryCols: ['id', 'phone', 'otp', 'created_at'],
    },
  ];

  // -------------------------------------------------------------
  // SEPARATED MANAGEMENT MODULES (ONLY UNSEEN / ACTION COUNTS)
  // -------------------------------------------------------------
  const totalPendingActions = pendingStaffCount + pendingServiceCount + pendingWithdrawalCount + unansweredHelpCount;

  const navSections = [
    {
      title: "Core Operations",
      items: [
        {
          key: "dashboard",
          portal: "executive",
          label: "Action Dashboard",
          icon: <DashboardOutlined />,
          badge: null,
        },
        {
          key: "platform_finance",
          portal: "finance",
          label: "Platform Revenue & Treasury",
          icon: <DollarCircleOutlined />,
          badge: pendingWithdrawalCount > 0 ? pendingWithdrawalCount : null,
          alert: pendingWithdrawalCount > 0,
        },
        {
          key: "user_dashboard",
          portal: "user",
          label: "User Management",
          icon: <UserOutlined />,
          badge: null,
        },
        {
          key: "staff_dashboard",
          portal: "staff",
          label: "Staff Counselors",
          icon: <TeamOutlined />,
          badge: null,
        },
        {
          key: "service_dashboard",
          portal: "service",
          label: "Wedding Services",
          icon: <ShopOutlined />,
          badge: null,
        },
      ],
    },
    {
      title: "Platform Masters & Systems",
      items: [
        {
          key: "master_attributes",
          portal: "criteria",
          label: "Match Criteria",
          icon: <ApartmentOutlined />,
          badge: null,
        },
        {
          key: "master_geography",
          portal: "geography",
          label: "States & Districts",
          icon: <GlobalOutlined />,
          badge: null,
        },
        {
          key: "master_help",
          portal: "engagement",
          label: "Support Helpdesk",
          icon: <CustomerServiceOutlined />,
          badge: unreadHelpCount > 0 ? unreadHelpCount : null,
          alert: unreadHelpCount > 0,
        },
        {
          key: "master_security",
          portal: "security",
          label: "Accounts & Security",
          icon: <SafetyCertificateOutlined />,
          badge: null,
        },
        {
          key: "model_explorer",
          portal: "explorer",
          label: "Model & Field Explorer",
          icon: <DatabaseOutlined />,
          badge: null,
        },
      ],
    },
  ];

  return (
    <div className="ap-wrapper">
      {/* ============================================================== */}
      {/* 1. PERSISTENT DESKTOP SIDEBAR                                  */}
      {/* ============================================================== */}
      <aside className="ap-sidebar">
        {/* Brand Header */}
        <div className="ap-sidebar-brand">
          <div className="ap-brand-badge">👑</div>
          <div>
            <div className="ap-brand-title">वैवाहिक मंच</div>
            <div className="ap-brand-tag">EXECUTIVE COMMAND</div>
          </div>
        </div>

        {/* Admin Profile Card */}
        <div className="ap-sidebar-profile">
          <div className="ap-profile-avatar">{username.charAt(0).toUpperCase()}</div>
          <div className="ap-profile-meta">
            <div className="ap-profile-name">{username}</div>
            <div className="ap-profile-role">
              <SafetyCertificateOutlined /> SuperAdmin Access
            </div>
          </div>
        </div>

        {/* Navigation List with Distinct Section Separators */}
        <div className="ap-nav-menu">
          {navSections.map((sec, secIdx) => (
            <div key={secIdx}>
              <div className="ap-nav-section-title">{sec.title}</div>
              {sec.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`ap-nav-btn ${
                    activeTab === item.key ||
                    (item.key === "user_dashboard" && activeTab.startsWith("user_")) ||
                    (item.key === "staff_dashboard" && activeTab.startsWith("staff_")) ||
                    (item.key === "service_dashboard" && activeTab.startsWith("service_"))
                      ? "active"
                      : ""
                  }`}
                  onClick={() => switchTab(item.key)}
                >
                  <span className="ap-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge !== null && (
                    <span className={`ap-nav-badge ${item.alert ? "ap-nav-badge-alert" : ""}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
        {/* Sidebar Footer */}
        <div className="ap-sidebar-footer">
          <button type="button" className="ap-home-action-btn" onClick={() => navigate("/")}>
            <HomeOutlined /> Homepage
          </button>
          <button type="button" className="ap-logout-action-btn" onClick={handleLogout}>
            <LogoutOutlined /> Logout Session
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MOBILE SLIDE-OUT DRAWER                                     */}
      {/* ============================================================== */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>👑</span>
            <div>
              <div style={{ fontWeight: 900, color: "var(--ap-text-main, #ffffff)", fontSize: 16 }}>वैवाहिक मंच</div>
              <div style={{ fontSize: 10, color: "#2563eb", fontWeight: 800 }}>EXECUTIVE ADMIN</div>
            </div>
          </div>
        }
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        width={typeof window !== "undefined" ? Math.min(320, window.innerWidth - 32) : 300}
        styles={{ body: { padding: "14px", background: "#f8fafc" }, header: { background: "#ffffff", borderBottom: "1px solid #e2e8f0" } }}
      >
        {/* Middle Vertical Close Arrow Button (Mobile Drawer) */}
        <button
          type="button"
          className="ap-drawer-close-btn"
          onClick={() => setMobileDrawerOpen(false)}
          title="Close Side Menu"
          aria-label="Close Side Menu"
        >
          <LeftOutlined />
        </button>
        <div className="ap-sidebar-profile" style={{ margin: "0 0 16px" }}>
          <div className="ap-profile-avatar">{username.charAt(0).toUpperCase()}</div>
          <div className="ap-profile-meta">
            <div className="ap-profile-name">{username}</div>
            <div className="ap-profile-role"><SafetyCertificateOutlined /> SuperAdmin</div>
          </div>
        </div>



        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {navSections.map((sec, sIdx) => (
            <div key={sIdx}>
              <div className="ap-nav-section-title">{sec.title}</div>
              {sec.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`ap-nav-btn ${
                    activeTab === item.key ||
                    (item.key === "user_dashboard" && activeTab.startsWith("user_")) ||
                    (item.key === "staff_dashboard" && activeTab.startsWith("staff_")) ||
                    (item.key === "service_dashboard" && activeTab.startsWith("service_"))
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    switchTab(item.key);
                  }}
                >
                  <span className="ap-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge !== null && (
                    <span className={`ap-nav-badge ${item.alert ? "ap-nav-badge-alert" : ""}`}>{item.badge}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
          <button
            type="button"
            className="ap-home-action-btn"
            style={{ marginBottom: 8 }}
            onClick={() => {
              setMobileDrawerOpen(false);
              navigate("/");
            }}
          >
            <HomeOutlined /> Homepage
          </button>
          <button type="button" className="ap-logout-action-btn" onClick={handleLogout}>
            <LogoutOutlined /> Logout Session
          </button>
        </div>
      </Drawer>

      {/* ============================================================== */}
      {/* 3. MAIN EXECUTIVE CONTENT CANVAS                               */}
      {/* ============================================================== */}
      <main className="ap-main-content">
        {/* Top App Header */}
        <header className="ap-topbar">
          <div className="ap-topbar-left">
            <button type="button" className="ap-mobile-toggle-btn" onClick={() => setMobileDrawerOpen(true)}>
              <MenuOutlined />
            </button>
            <div>
              <h1 className="ap-topbar-title">
                {activePortal === "executive" && "Dashboard & Executive Operations"}
                {activePortal === "user" && "User & Candidate Management"}
                {activePortal === "staff" && "Staff Counselors & Verification"}
                {activePortal === "service" && "Wedding Services & Vendor Partners"}
                {activePortal === "criteria" && "Matrimonial Criteria & Attributes"}
                {activePortal === "geography" && "Geographies & Proximity Directory"}
                {activePortal === "engagement" && "Helpdesk Support & Success Stories"}
                {activePortal === "security" && "Accounts, Permissions & OTP Security"}
                {activePortal === "explorer" && "Universal Model & Field Explorer Studio"}
              </h1>
              <div className="ap-topbar-subtitle">
                {activePortal === "executive" && "📊 Real-time platform pulse across all 22 backend models and financial ledger"}
                {activePortal === "user" && "👤 Candidates, full biodata verification, subscription packages, and connections"}
                {activePortal === "staff" && "🧑‍💼 Counselor directory, KYC documents verification, and payout processing"}
                {activePortal === "service" && "🏪 Wedding vendors, service categories catalog, and listing fee invoices"}
                {activePortal === "criteria" && "🕉️ Religions, castes & gotras, professions, languages, and complexions"}
                {activePortal === "geography" && "🗺️ States, districts, and nearby matching geographical zones"}
                {activePortal === "engagement" && "🎧 User helpdesk tickets resolution and homepage wedding testimonials"}
                {activePortal === "security" && "🛡️ User authentication accounts, role assignments, and OTP audit logs"}
                {activePortal === "explorer" && "🗄️ Complete field-level access, search, and deep inspection across all 22 Django models"}
              </div>
              <div className="ap-topbar-breadcrumb">
                <span>Executive Command</span>
                <span className="ap-crumb-sep">/</span>
                <span className="ap-crumb-active">
                  {activePortal === "executive" && "DASHBOARD"}
                  {activePortal === "user" && "USER MANAGEMENT"}
                  {activePortal === "staff" && "STAFF MANAGEMENT"}
                  {activePortal === "service" && "SERVICE MANAGEMENT"}
                  {activePortal === "criteria" && "CRITERIA MASTER"}
                  {activePortal === "geography" && "GEOGRAPHY MASTER"}
                  {activePortal === "engagement" && "SUPPORT & STORIES"}
                  {activePortal === "security" && "ACCOUNTS & SECURITY"}
                  {activePortal === "explorer" && "MODEL & FIELD EXPLORER"}
                </span>
              </div>
            </div>
          </div>

          <div className="ap-topbar-right">
            <div className="ap-system-status-pill">
              <span className="ap-pulse-dot" />
              <span>Backend Connected (Port 8000)</span>
            </div>
            <Button
              className="ap-topbar-btn ap-topbar-btn-outline"
              icon={<ReloadOutlined spin={refreshLoading} />}
              onClick={async () => {
                await fetchAllData();
                message.success("Live backend models accurately synchronized! 🔄");
              }}
            >
              <span className="ap-btn-text-full">Sync Live Data</span>
              <span className="ap-btn-text-mobile">Sync</span>
            </Button>
          </div>
        </header>

        {/* Content Body */}
        <div className="ap-page-body">
          {/* ========================================================== */}
          {/* SLEEK MINIMALIST SUB-NAVIGATION BAR (WHEN IN SUB-MODULES)  */}
          {/* ========================================================== */}
          {activePortal !== "executive" && (
            <div className="ap-modern-subnav">
              <div className="ap-modern-subnav-left">
                <div className="ap-subnav-portal-badge">
                  {activePortal === "finance" && <><DollarCircleOutlined className="portal-icon finance" /> <span>Platform Revenue &amp; Treasury</span></>}
                  {activePortal === "user" && <><UserOutlined className="portal-icon user" /> <span>User Management</span></>}
                  {activePortal === "staff" && <><TeamOutlined className="portal-icon staff" /> <span>Staff Counselors</span></>}
                  {activePortal === "service" && <><ShopOutlined className="portal-icon service" /> <span>Wedding Services</span></>}
                  {activePortal === "criteria" && <><ApartmentOutlined className="portal-icon criteria" /> <span>Match Criteria</span></>}
                  {activePortal === "geography" && <><GlobalOutlined className="portal-icon geo" /> <span>Geography Master</span></>}
                  {activePortal === "engagement" && <><CustomerServiceOutlined className="portal-icon engage" /> <span>Support &amp; Stories</span></>}
                  {activePortal === "security" && <><SafetyCertificateOutlined className="portal-icon sec" /> <span>Security &amp; Accounts</span></>}
                  {activePortal === "explorer" && <><DatabaseOutlined className="portal-icon exp" /> <span>22-Model DB Studio</span></>}
                </div>

                <div className="ap-subnav-pills">
                  {activePortal === "finance" && (
                    <>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "platform_finance" ? "active" : ""}`}
                        onClick={() => switchTab("platform_finance")}
                      >
                        <DashboardOutlined /> Monthly Ledger &amp; Treasury
                      </button>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "user_invoices" ? "active" : ""}`}
                        onClick={() => switchTab("user_invoices")}
                      >
                        <CreditCardOutlined /> User Subscriptions
                      </button>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "service_transactions" ? "active" : ""}`}
                        onClick={() => switchTab("service_transactions")}
                      >
                        <ShopOutlined /> Wedding Service Fees
                      </button>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "staff_withdrawals" ? "active" : ""}`}
                        onClick={() => switchTab("staff_withdrawals")}
                      >
                        <WalletOutlined /> Staff Withdrawals
                        {pendingWithdrawalCount > 0 && <span className="pill-alert danger">{pendingWithdrawalCount}</span>}
                      </button>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "staff_commission" ? "active" : ""}`}
                        onClick={() => switchTab("staff_commission")}
                      >
                        <DollarCircleOutlined /> Counselor Commission
                      </button>
                    </>
                  )}

                  {activePortal === "user" && (
                    <>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "user_dashboard" ? "active" : ""}`}
                        onClick={() => switchTab("user_dashboard")}
                      >
                        <DashboardOutlined /> User Dashboard
                      </button>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "user_profiles" ? "active" : ""}`}
                        onClick={() => switchTab("user_profiles")}
                      >
                        <UserOutlined /> Candidate Profiles
                      </button>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "user_subscriptions" ? "active" : ""}`}
                        onClick={() => switchTab("user_subscriptions")}
                      >
                        <CrownOutlined /> Plans &amp; Packages
                      </button>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "user_invoices" ? "active" : ""}`}
                        onClick={() => switchTab("user_invoices")}
                      >
                        <CreditCardOutlined /> Recharge Orders
                      </button>
                    </>
                  )}

                  {activePortal === "staff" && (
                    <>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "staff_dashboard" ? "active" : ""}`}
                        onClick={() => switchTab("staff_dashboard")}
                      >
                        <DashboardOutlined /> Staff Dashboard
                      </button>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "staff_counselors" ? "active" : ""}`}
                        onClick={() => switchTab("staff_counselors")}
                      >
                        <TeamOutlined /> Staff Directory
                        {pendingStaffCount > 0 && <span className="pill-alert warning">{pendingStaffCount}</span>}
                      </button>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "staff_withdrawals" ? "active" : ""}`}
                        onClick={() => switchTab("staff_withdrawals")}
                      >
                        <WalletOutlined /> Payout Requests
                        {pendingWithdrawalCount > 0 && <span className="pill-alert danger">{pendingWithdrawalCount}</span>}
                      </button>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "staff_commission" ? "active" : ""}`}
                        onClick={() => switchTab("staff_commission")}
                      >
                        <DollarCircleOutlined /> Commission &amp; Wallets
                      </button>
                    </>
                  )}

                  {activePortal === "service" && (
                    <>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "service_dashboard" ? "active" : ""}`}
                        onClick={() => switchTab("service_dashboard")}
                      >
                        <DashboardOutlined /> Service Dashboard
                      </button>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "service_partners" ? "active" : ""}`}
                        onClick={() => switchTab("service_partners")}
                      >
                        <ShopOutlined /> Vendors Directory
                        {pendingServiceCount > 0 && <span className="pill-alert warning">{pendingServiceCount}</span>}
                      </button>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "service_catalog" ? "active" : ""}`}
                        onClick={() => switchTab("service_catalog")}
                      >
                        <AppstoreOutlined /> Categories Catalog
                      </button>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "service_charges" ? "active" : ""}`}
                        onClick={() => switchTab("service_charges")}
                      >
                        <CreditCardOutlined /> Listing Charges
                      </button>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "service_transactions" ? "active" : ""}`}
                        onClick={() => switchTab("service_transactions")}
                      >
                        <DollarCircleOutlined /> Vendor Invoices
                      </button>
                    </>
                  )}

                  {activePortal === "criteria" && (
                    <div className="ap-subnav-pill-group">
                      {['religion', 'caste', 'profession', 'language', 'color'].map((attr) => (
                        <button
                          key={attr}
                          type="button"
                          className={`ap-subnav-pill ${attributeSubTab === attr ? "active" : ""}`}
                          onClick={() => setAttributeSubTab(attr)}
                        >
                          {attr.charAt(0).toUpperCase() + attr.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}

                  {activePortal === "geography" && (
                    <>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${locationSubTab === "states" ? "active" : ""}`}
                        onClick={() => setLocationSubTab("states")}
                      >
                        <GlobalOutlined /> States &amp; Districts
                      </button>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${locationSubTab === "neardist" ? "active" : ""}`}
                        onClick={() => setLocationSubTab("neardist")}
                      >
                        <GlobalOutlined /> Proximity Districts
                      </button>
                    </>
                  )}

                  {activePortal === "engagement" && (
                    <>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "master_help" ? "active" : ""}`}
                        onClick={() => switchTab("master_help")}
                      >
                        <CustomerServiceOutlined /> Support Helpdesk
                        {unansweredHelpCount > 0 && <span className="pill-alert warning">{unansweredHelpCount}</span>}
                      </button>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${activeTab === "master_stories" ? "active" : ""}`}
                        onClick={() => switchTab("master_stories")}
                      >
                        <SmileOutlined /> Success Stories
                      </button>
                    </>
                  )}

                  {activePortal === "security" && (
                    <>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${systemSubTab === "users" ? "active" : ""}`}
                        onClick={() => setSystemSubTab("users")}
                      >
                        <SafetyCertificateOutlined /> System Users
                      </button>
                      <button
                        type="button"
                        className={`ap-subnav-pill ${systemSubTab === "otp" ? "active" : ""}`}
                        onClick={() => setSystemSubTab("otp")}
                      >
                        <PhoneOutlined /> OTP Verification Logs
                      </button>
                    </>
                  )}

                  {activePortal === "explorer" && (
                    <div className="ap-subnav-pill-group scrollable">
                      {allModelsMeta.map((model) => (
                        <button
                          key={model.key}
                          type="button"
                          className={`ap-subnav-pill ${selectedExplorerModel === model.key ? "active" : ""}`}
                          onClick={() => {
                            setSelectedExplorerModel(model.key);
                            setExplorerSearch("");
                          }}
                        >
                          <DatabaseOutlined /> {model.key}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="ap-modern-subnav-right">
                <button
                  type="button"
                  className="ap-subnav-quick-btn"
                  onClick={() => switchTab("dashboard")}
                  title="Return to Executive Cockpit"
                >
                  <DashboardOutlined /> <span>Dashboard</span>
                </button>
                <button
                  type="button"
                  className="ap-subnav-quick-btn"
                  onClick={() => switchTab("model_explorer")}
                  title="Open Universal 22-Model DB Studio"
                >
                  <DatabaseOutlined /> <span>DB Explorer</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* HUB 0: EXECUTIVE APPROVALS & OPERATIONS DASHBOARD          */}
          {/* ========================================================== */}
          {activeTab === "dashboard" && (
            <div className="ap-dashboard-cockpit">
              {/* Executive Welcome & Live Connection Banner */}
              <div className="ap-cockpit-banner">
                <div className="ap-cockpit-banner-text">
                  <div className="ap-cockpit-tag">EXECUTIVE COMMAND &amp; APPROVALS</div>
                  <h2 className="ap-cockpit-title">Platform Master Command Dashboard</h2>
                  <p className="ap-cockpit-sub">
                    Centralized management across User Profiles, Marriage Counselors, and Wedding Service Partners with live approval queues.
                  </p>
                </div>
                <div className="ap-cockpit-banner-actions">
                  <div className="ap-cockpit-status-chip">
                    <span className="ap-pulse-dot" />
                    <span>
                      {totalPendingActions > 0
                        ? `${totalPendingActions} Actions Require Attention`
                        : "All Approvals Up to Date ✓"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="ap-cockpit-action-btn primary"
                    onClick={() => switchTab("model_explorer")}
                  >
                    <DatabaseOutlined /> 22-Model Studio &rarr;
                  </button>
                  <button
                    type="button"
                    className="ap-cockpit-action-btn"
                    onClick={async () => {
                      await fetchAllData();
                      message.success("Platform models refreshed live! 🔄");
                    }}
                  >
                    <ReloadOutlined spin={refreshLoading} /> Refresh Data
                  </button>
                </div>
              </div>

              {/* 3 Dedicated Portal Gateway Dashboards */}
              <div className="ap-portal-gateways-grid">
                {/* 1. User Management Portal Gateway */}
                <div
                  className="ap-portal-gateway-card user"
                  role="button"
                  tabIndex={0}
                  onClick={() => switchTab("user_dashboard")}
                  title="Click to open dedicated User / Candidate Dashboard"
                >
                  <div className="ap-gateway-header">
                    <div className="ap-gateway-icon-box user">
                      <UserOutlined />
                    </div>
                    <span className="ap-gateway-link">User Dashboard &rarr;</span>
                  </div>
                  <h3 className="ap-gateway-title">User Management Portal</h3>
                  <p className="ap-gateway-desc">Candidate profiles, active memberships, recharge packages &amp; biodata verification.</p>
                  <div className="ap-gateway-stats">
                    <div className="stat-item">
                      <span className="val">{candidates.length}</span>
                      <span className="lbl">Candidates</span>
                    </div>
                    <div className="stat-item">
                      <span className="val highlight">{candidates.filter(c => c.Active !== false).length}</span>
                      <span className="lbl">Active Dossiers</span>
                    </div>
                    <div className="stat-item">
                      <span className="val">₹{totalCandidateRevenue.toLocaleString("en-IN")}</span>
                      <span className="lbl">Subscriptions</span>
                    </div>
                  </div>
                </div>

                {/* 2. Staff Counselor Portal Gateway */}
                <div
                  className="ap-portal-gateway-card staff"
                  role="button"
                  tabIndex={0}
                  onClick={() => switchTab("staff_dashboard")}
                  title="Click to open dedicated Staff Counselor Dashboard"
                >
                  <div className="ap-gateway-header">
                    <div className="ap-gateway-icon-box staff">
                      <TeamOutlined />
                    </div>
                    <span className="ap-gateway-link">Staff Dashboard &rarr;</span>
                  </div>
                  <h3 className="ap-gateway-title">Staff Counselors Portal</h3>
                  <p className="ap-gateway-desc">Marriage counselors directory, KYC approvals, referral commission &amp; payout queue.</p>
                  <div className="ap-gateway-stats">
                    <div className="stat-item">
                      <span className="val">{staffList.length}</span>
                      <span className="lbl">Counselors</span>
                    </div>
                    <div className="stat-item">
                      <span className={`val ${pendingStaffCount > 0 ? "warn" : ""}`}>
                        {pendingStaffCount > 0 ? `${pendingStaffCount} KYC Req` : "All Verified"}
                      </span>
                      <span className="lbl">KYC Status</span>
                    </div>
                    <div className="stat-item">
                      <span className={`val ${pendingWithdrawalCount > 0 ? "danger" : ""}`}>
                        {pendingWithdrawalCount}
                      </span>
                      <span className="lbl">Pending Payouts</span>
                    </div>
                  </div>
                </div>

                {/* 3. Wedding Service Portal Gateway */}
                <div
                  className="ap-portal-gateway-card service"
                  role="button"
                  tabIndex={0}
                  onClick={() => switchTab("service_dashboard")}
                  title="Click to open dedicated Wedding Service Dashboard"
                >
                  <div className="ap-gateway-header">
                    <div className="ap-gateway-icon-box service">
                      <ShopOutlined />
                    </div>
                    <span className="ap-gateway-link">Service Dashboard &rarr;</span>
                  </div>
                  <h3 className="ap-gateway-title">Wedding Services Portal</h3>
                  <p className="ap-gateway-desc">Wedding service vendors, business listing approvals, category catalog &amp; listing fees.</p>
                  <div className="ap-gateway-stats">
                    <div className="stat-item">
                      <span className="val">{servicesList.length}</span>
                      <span className="lbl">Vendors</span>
                    </div>
                    <div className="stat-item">
                      <span className={`val ${pendingServiceCount > 0 ? "warn" : ""}`}>
                        {pendingServiceCount > 0 ? `${pendingServiceCount} Need Appr` : "All Verified"}
                      </span>
                      <span className="lbl">Listings Status</span>
                    </div>
                    <div className="stat-item">
                      <span className="val">{serviceCategories.length}</span>
                      <span className="lbl">Categories</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* PRIMARY ACTION & APPROVAL CENTER                               */}
              {/* ============================================================== */}
              <div className="ap-action-center-container">
                {/* Header & Filter Pill Tabs */}
                <div className="ap-action-center-header">
                  <div className="ap-action-center-title-box">
                    <div className="ap-action-pulse-badge">
                      <span className="ap-pulse-dot" />
                      <span>{totalPendingActions} ACTIONS REQUIRING MONITORING</span>
                    </div>
                    <h3 className="ap-action-center-title">Live Requests &amp; Approvals Queue</h3>
                    <p className="ap-action-center-sub">
                      Review, verify, and resolve all pending administrative requests directly from this console.
                    </p>
                  </div>

                  <div className="ap-action-filter-pills">
                    <button
                      type="button"
                      className={`ap-action-filter-pill ${dashboardActionFilter === "all" ? "active" : ""}`}
                      onClick={() => setDashboardActionFilter("all")}
                    >
                      All Tasks ({totalPendingActions})
                    </button>
                    <button
                      type="button"
                      className={`ap-action-filter-pill ${dashboardActionFilter === "staff" ? "active" : ""}`}
                      onClick={() => setDashboardActionFilter("staff")}
                    >
                      Staff KYC ({pendingStaffCount})
                    </button>
                    <button
                      type="button"
                      className={`ap-action-filter-pill ${dashboardActionFilter === "service" ? "active" : ""}`}
                      onClick={() => setDashboardActionFilter("service")}
                    >
                      Vendors ({pendingServiceCount})
                    </button>
                    <button
                      type="button"
                      className={`ap-action-filter-pill ${dashboardActionFilter === "payout" ? "active" : ""}`}
                      onClick={() => setDashboardActionFilter("payout")}
                    >
                      Payouts ({pendingWithdrawalCount})
                    </button>
                    <button
                      type="button"
                      className={`ap-action-filter-pill ${dashboardActionFilter === "help" ? "active" : ""}`}
                      onClick={() => setDashboardActionFilter("help")}
                    >
                      Support ({unansweredHelpCount})
                    </button>
                  </div>
                </div>

                {/* 1. Staff Counselors KYC Verification Queue */}
                {(dashboardActionFilter === "all" || dashboardActionFilter === "staff") && (
                  <div className="ap-approval-queue-card">
                    <div className="ap-queue-header">
                      <div className="ap-queue-title-wrap">
                        <TeamOutlined className="ap-queue-icon staff" />
                        <div>
                          <h4 className="ap-queue-title">Marriage Counselors Awaiting KYC Approval</h4>
                          <span className="ap-queue-meta">
                            {pendingStaffCount > 0
                              ? `${pendingStaffCount} counselor profiles requiring document verification`
                              : "All counselors verified"}
                          </span>
                        </div>
                      </div>
                      <Button size="small" type="link" onClick={() => switchTab("staff_counselors")}>
                        Open Directory &rarr;
                      </Button>
                    </div>

                    <div className="ap-queue-items-list">
                      {staffList.filter((s) => !s.is_approved).map((s) => {
                        const picUrl = getMediaUrl(s.Profile_Pic);
                        return (
                          <div key={s.id} className="ap-queue-item-row">
                            <div className="ap-queue-item-profile">
                              <img
                                src={picUrl}
                                alt={s.Full_Name || "Staff"}
                                className="ap-queue-avatar"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src =
                                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
                                }}
                              />
                              <div>
                                <div className="ap-queue-name">
                                  {s.Full_Name || "Counselor Applicant"}
                                  <span className="ap-queue-ref">ID #{s.Staff_id || s.id}</span>
                                </div>
                                <div className="ap-queue-contacts">
                                  <span>📞 {s.WP_Contact || "No Phone"}</span>
                                  {s.State && <span>• {s.District ? `${s.District}, ` : ""}{s.State}</span>}
                                </div>
                                <div className="ap-queue-docs-tags">
                                  <Tag color={s.Adhar_Number ? "blue" : "default"}>
                                    Aadhaar: {s.Adhar_Number || "Pending"}
                                  </Tag>
                                  <Tag color={s.PAN_Number ? "purple" : "default"}>
                                    PAN: {s.PAN_Number || "Pending"}
                                  </Tag>
                                  {s.Bank_Name && (
                                    <Tag color="cyan">Bank: {s.Bank_Name}</Tag>
                                  )}
                                  {s.UPI_ID && (
                                    <Tag color="green">UPI: {s.UPI_ID}</Tag>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="ap-queue-actions">
                              <Button
                                type="primary"
                                style={{ background: "#10b981", borderColor: "#10b981", fontWeight: 700 }}
                                onClick={() => handleApproveStaff(s.id, true)}
                              >
                                ✓ Approve KYC
                              </Button>
                              <Button
                                style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", color: "var(--ap-text-main, #ffffff)" }}
                                onClick={() => handleOpenStaffKyc(s)}
                              >
                                Inspect Docs
                              </Button>
                              <Popconfirm
                                title="Reject counselor KYC application?"
                                onConfirm={() => handleDeleteStaff(s.id)}
                              >
                                <Button danger>Reject</Button>
                              </Popconfirm>
                            </div>
                          </div>
                        );
                      })}

                      {pendingStaffCount === 0 && (
                        <div className="ap-queue-empty">
                          <span className="empty-check">✓</span>
                          <span>Zero pending counselor KYC applications. All registered staff are approved!</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Wedding Vendor Partners Approval Queue */}
                {(dashboardActionFilter === "all" || dashboardActionFilter === "service") && (
                  <div className="ap-approval-queue-card">
                    <div className="ap-queue-header">
                      <div className="ap-queue-title-wrap">
                        <ShopOutlined className="ap-queue-icon service" />
                        <div>
                          <h4 className="ap-queue-title">Wedding Service Vendors Awaiting Approval</h4>
                          <span className="ap-queue-meta">
                            {pendingServiceCount > 0
                              ? `${pendingServiceCount} vendor business listings waiting for activation`
                              : "All vendor listings approved"}
                          </span>
                        </div>
                      </div>
                      <Button size="small" type="link" onClick={() => switchTab("service_partners")}>
                        Open Vendors &rarr;
                      </Button>
                    </div>

                    <div className="ap-queue-items-list">
                      {servicesList.filter((s) => s.Admin_Approval === false).map((srv) => (
                        <div key={srv.id} className="ap-queue-item-row">
                          <div className="ap-queue-item-profile">
                            <div className="ap-vendor-icon-box">
                              <ShopOutlined style={{ fontSize: 20, color: "#10b981" }} />
                            </div>
                            <div>
                              <div className="ap-queue-name">
                                {srv.Service_Name || "Wedding Vendor"}
                                <Tag color="gold" style={{ marginLeft: 8 }}>{srv.Service_Type || "General Service"}</Tag>
                              </div>
                              <div className="ap-queue-contacts">
                                <span>📞 {srv.WP_Contact || "No Phone"}</span>
                                {srv.City && <span>• {srv.City}{srv.State ? `, ${srv.State}` : ""}</span>}
                                {srv.Service_Price && <span>• ₹{Number(srv.Service_Price).toLocaleString("en-IN")}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="ap-queue-actions">
                            <Button
                              type="primary"
                              style={{ background: "#10b981", borderColor: "#10b981", fontWeight: 700 }}
                              onClick={() => handleApproveService(srv.id, true)}
                            >
                              ✓ Approve &amp; Activate
                            </Button>
                            <Button
                              style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", color: "var(--ap-text-main, #ffffff)" }}
                              onClick={() => handleOpenServiceKyc(srv)}
                            >
                              Inspect Profile
                            </Button>
                            <Popconfirm
                              title="Reject and delete vendor listing?"
                              onConfirm={() => handleDeleteService(srv.id)}
                            >
                              <Button danger>Reject</Button>
                            </Popconfirm>
                          </div>
                        </div>
                      ))}

                      {pendingServiceCount === 0 && (
                        <div className="ap-queue-empty">
                          <span className="empty-check">✓</span>
                          <span>Zero pending vendor listings. All registered wedding partners are approved!</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Counselor Payout Requests Queue */}
                {(dashboardActionFilter === "all" || dashboardActionFilter === "payout") && (
                  <div className="ap-approval-queue-card">
                    <div className="ap-queue-header">
                      <div className="ap-queue-title-wrap">
                        <WalletOutlined className="ap-queue-icon payout" />
                        <div>
                          <h4 className="ap-queue-title">Counselor Withdrawal Payout Requests</h4>
                          <span className="ap-queue-meta">
                            {pendingWithdrawalCount > 0
                              ? `${pendingWithdrawalCount} payout disbursements waiting for bank transfer`
                              : "All payouts settled"}
                          </span>
                        </div>
                      </div>
                      <Button size="small" type="link" onClick={() => switchTab("staff_withdrawals")}>
                        Payout Ledger &rarr;
                      </Button>
                    </div>

                    <div className="ap-queue-items-list">
                      {staffTxns.filter((t) => (t.Type === "Withdrawal" || !t.Type) && t.Status === "Pending").map((txn) => (
                        <div key={txn.id} className="ap-queue-item-row">
                          <div className="ap-queue-item-profile">
                            <div className="ap-payout-amount-box">
                              <span className="currency">₹</span>
                              <span className="val">{Number(txn.Amount || 0).toLocaleString("en-IN")}</span>
                            </div>
                            <div>
                              <div className="ap-queue-name">
                                Staff ID: #{txn.Staff_id}
                                <span className="ap-queue-ref">Txn #{txn.id}</span>
                              </div>
                              <div className="ap-queue-contacts">
                                <span>Requested on: {txn.Create_date ? new Date(txn.Create_date).toLocaleDateString() : "Recent"}</span>
                                {txn.Msg && <span>• Note: {txn.Msg}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="ap-queue-actions">
                            <Button
                              type="primary"
                              style={{ background: "#10b981", borderColor: "#10b981", fontWeight: 700 }}
                              onClick={() => handleUpdateWithdrawalStatus(txn.id, "Approved")}
                            >
                              ✓ Approve Payout
                            </Button>
                            <Button
                              style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", color: "var(--ap-text-main, #ffffff)" }}
                              onClick={() => handleInspectRecord("Staff_Transactions", txn)}
                            >
                              Inspect Txn
                            </Button>
                            <Popconfirm
                              title="Decline this withdrawal request? Funds will remain in counselor wallet."
                              onConfirm={() => handleUpdateWithdrawalStatus(txn.id, "Rejected")}
                            >
                              <Button danger>Decline</Button>
                            </Popconfirm>
                          </div>
                        </div>
                      ))}

                      {pendingWithdrawalCount === 0 && (
                        <div className="ap-queue-empty">
                          <span className="empty-check">✓</span>
                          <span>Zero pending payout requests. All staff withdrawal requests have been processed!</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Customer Support Inquiries Queue */}
                {(dashboardActionFilter === "all" || dashboardActionFilter === "help") && (
                  <div className="ap-approval-queue-card">
                    <div className="ap-queue-header">
                      <div className="ap-queue-title-wrap">
                        <CustomerServiceOutlined className="ap-queue-icon help" />
                        <div>
                          <h4 className="ap-queue-title">Customer Support Helpdesk Inquiries</h4>
                          <span className="ap-queue-meta">
                            {unansweredHelpCount > 0
                              ? `${unansweredHelpCount} support tickets waiting for administrator answer`
                              : "All inquiries answered"}
                          </span>
                        </div>
                      </div>
                      <Button size="small" type="link" onClick={() => switchTab("master_help")}>
                        Open Helpdesk &rarr;
                      </Button>
                    </div>

                    <div className="ap-queue-items-list">
                      {helpTickets.filter((h) => !h.Answer || !h.Answer.trim()).map((t) => {
                        const inq = getInquirerInfo(t);
                        const isStaff = isStaffAssignee(t);
                        return (
                          <div key={t.id} className="ap-queue-item-row">
                            <div className="ap-queue-item-profile">
                              <div className="ap-ticket-icon-box">
                                <CustomerServiceOutlined style={{ fontSize: 20, color: "#6366f1" }} />
                              </div>
                              <div>
                                <div className="ap-queue-name">
                                  {inq.name}
                                  <Tag color={inq.roleType === "Staff Counselor" ? "cyan" : inq.roleType === "Service Partner" ? "orange" : "blue"} style={{ marginLeft: 6, fontSize: 11 }}>
                                    {inq.roleType}
                                  </Tag>
                                  {inq.serviceName && (
                                    <Tag color="volcano" style={{ marginLeft: 4, fontSize: 10.5 }}>
                                      {inq.serviceName}
                                    </Tag>
                                  )}
                                  <Tag color={isStaff ? "purple" : "geekblue"} style={{ marginLeft: 6, fontWeight: 700 }}>
                                    {getTargetAssigneeName(t)}
                                  </Tag>
                                </div>
                                <div className="ap-ticket-question">
                                  &ldquo;{t.Question || "No question text provided"}&rdquo;
                                </div>
                                <div className="ap-queue-contacts">
                                  <span>Ticket #{t.id}</span>
                                  {inq.phone && <span>• 📞 {inq.phone}</span>}
                                  <span>• {t.created_date || t.Create_date ? new Date(t.created_date || t.Create_date).toLocaleDateString() : "Recent"}</span>
                                </div>
                              </div>
                            </div>

                            <div className="ap-queue-actions">
                              <Button
                                style={{ background: "#0284c7", borderColor: "#0284c7", color: "var(--ap-text-main, #ffffff)", fontWeight: 700 }}
                                icon={<EyeOutlined />}
                                onClick={() => handleOpenTicketDetails(t)}
                              >
                                Details
                              </Button>
                              <Button
                                type="primary"
                                style={{ background: "#6366f1", borderColor: "#6366f1", fontWeight: 700 }}
                                onClick={() => handleOpenTicketReply(t)}
                              >
                                💬 Reply
                              </Button>
                              <Button
                                style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", color: "var(--ap-text-main, #ffffff)" }}
                                onClick={() => handleInspectRecord("Help", t)}
                              >
                                Inspect
                              </Button>
                              <Popconfirm
                                title="Delete this support inquiry permanently?"
                                onConfirm={() => handleDeleteTicket(t.id)}
                                okText="Delete"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true }}
                              >
                                <Button size="middle" danger icon={<DeleteOutlined />} title="Delete Ticket" />
                              </Popconfirm>
                            </div>
                          </div>
                        );
                      })}

                      {unansweredHelpCount === 0 && (
                        <div className="ap-queue-empty">
                          <span className="empty-check">✓</span>
                          <span>Zero unanswered support tickets. All customer inquiries have been addressed!</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Platform Core Metrics Strip (Clickable) */}
              <div className="ap-financial-overview-bar" style={{ marginTop: 24 }}>
                <div
                  className="ap-fin-col ap-clickable-fin-box"
                  role="button"
                  tabIndex={0}
                  onClick={() => switchTab("platform_finance")}
                  title="Click to view Platform Treasury"
                >
                  <span className="ap-fin-title">NET REMAINING TREASURY</span>
                  <span className="ap-fin-amount" style={{ color: netPlatformRemaining >= 0 ? "#10b981" : "#ef4444" }}>
                    {netPlatformRemaining >= 0 ? "+" : ""}₹{netPlatformRemaining.toLocaleString("en-IN")}
                  </span>
                  <span className="ap-fin-sub">
                    {overallMarginPercent}% Net Profit Retained &rarr;
                  </span>
                </div>
                <div className="ap-fin-divider" />
                <div
                  className="ap-fin-col ap-clickable-fin-box"
                  role="button"
                  tabIndex={0}
                  onClick={() => switchTab("platform_finance")}
                  title="Click to view Gross Transactions"
                >
                  <span className="ap-fin-title">GROSS PLATFORM VOLUME</span>
                  <span className="ap-fin-amount ap-fin-total">
                    ₹{totalGrossRevenue.toLocaleString("en-IN")}
                  </span>
                  <span className="ap-fin-sub">
                    {totalGrossTxnCount} Txns (₹{totalCandidateRevenue.toLocaleString("en-IN")} user + ₹{totalVendorRevenue.toLocaleString("en-IN")} svc) &rarr;
                  </span>
                </div>
                <div className="ap-fin-divider" />
                <div
                  className="ap-fin-col ap-clickable-fin-box"
                  role="button"
                  tabIndex={0}
                  onClick={() => switchTab("staff_withdrawals")}
                  title="Click to view Counselor Payouts"
                >
                  <span className="ap-fin-title">COUNSELOR PAYOUTS</span>
                  <span className="ap-fin-amount ap-fin-staff">
                    ₹{totalStaffWithdrawalsPaid.toLocaleString("en-IN")}
                  </span>
                  <span className="ap-fin-sub">
                    {totalStaffPaidTxnCount} Paid {totalPendingWithdrawalsCount > 0 ? `(₹${totalPendingWithdrawals.toLocaleString("en-IN")} queue)` : "• No queue"} &rarr;
                  </span>
                </div>
                <div className="ap-fin-divider" />
                <div
                  className="ap-fin-col ap-clickable-fin-box"
                  role="button"
                  tabIndex={0}
                  onClick={() => switchTab("user_profiles")}
                  title="Click to view Candidate Directory"
                >
                  <span className="ap-fin-title">CANDIDATE PROFILES</span>
                  <span className="ap-fin-amount ap-fin-cands">
                    {candidates.length}
                  </span>
                  <span className="ap-fin-sub">
                    {candidates.filter((c) => c.Active !== false).length} Active Dossiers &rarr;
                  </span>
                </div>
                <div className="ap-fin-divider" />
                <div
                  className="ap-fin-col ap-clickable-fin-box"
                  role="button"
                  tabIndex={0}
                  onClick={() => switchTab("service_partners")}
                  title="Click to view Wedding Service Vendors"
                >
                  <span className="ap-fin-title">WEDDING VENDORS</span>
                  <span className="ap-fin-amount ap-fin-vendors">
                    {servicesList.length}
                  </span>
                  <span className="ap-fin-sub">
                    {pendingServiceCount > 0 ? `${pendingServiceCount} Verification Req &rarr;` : "All Verified &rarr;"}
                  </span>
                </div>
              </div>

              {/* ============================================================== */}
              {/* PLATFORM FINANCIAL TREASURY & MONTHLY REVENUE LEDGER CARD      */}
              {/* ============================================================== */}
              <div className="ap-card ap-treasury-card">
                <div className="ap-card-header">
                  <div>
                    <h3 className="ap-card-title">
                      <DollarCircleOutlined className="ap-card-title-icon" style={{ color: "#10b981" }} />
                      Platform Financial Treasury &amp; Monthly Revenue Ledger
                    </h3>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                      Reconciled multi-channel financial statement: Candidate subscriptions, wedding service fees, counselor payouts &amp; net platform retained funds.
                    </div>
                  </div>
                  <Space wrap>
                    <Select
                      value={financialYearFilter}
                      onChange={setFinancialYearFilter}
                      style={{ width: 140 }}
                      size="middle"
                    >
                      <Select.Option value="all">All Recorded Years</Select.Option>
                      {availableFinancialYears.map((yr) => (
                        <Select.Option key={yr} value={yr}>Year {yr}</Select.Option>
                      ))}
                    </Select>

                    <Input
                      placeholder="Filter month (e.g. November)..."
                      prefix={<SearchOutlined />}
                      value={financialSearch}
                      onChange={(e) => setFinancialSearch(e.target.value)}
                      allowClear
                      style={{ width: 180 }}
                    />

                    <Button
                      type="primary"
                      style={{ background: "#10b981", borderColor: "#10b981", fontWeight: 700 }}
                      onClick={() => switchTab("platform_finance")}
                    >
                      Full Financial Hub &rarr;
                    </Button>
                  </Space>
                </div>

                {/* 6 Executive Treasury Stat Cards */}
                <div className="ap-treasury-stats-grid">
                  <div
                    className="ap-treasury-stat-box clickable-box"
                    role="button"
                    tabIndex={0}
                    onClick={() => switchTab("user_invoices")}
                    title="Click to view Candidate Recharge Orders"
                  >
                    <span className="lbl">👤 User Subscriptions</span>
                    <span className="val" style={{ color: "#38bdf8" }}>
                      ₹{filteredFinancialTotals.userRevenue.toLocaleString("en-IN")}
                    </span>
                    <span className="sub">{filteredFinancialTotals.userCount} candidate recharges</span>
                    <span className="action-hint">View Invoices &rarr;</span>
                  </div>

                  <div
                    className="ap-treasury-stat-box clickable-box"
                    role="button"
                    tabIndex={0}
                    onClick={() => switchTab("service_transactions")}
                    title="Click to view Wedding Service Listing Fees"
                  >
                    <span className="lbl">🏪 Wedding Services</span>
                    <span className="val" style={{ color: "#a855f7" }}>
                      ₹{filteredFinancialTotals.serviceRevenue.toLocaleString("en-IN")}
                    </span>
                    <span className="sub">{filteredFinancialTotals.serviceCount} vendor listings</span>
                    <span className="action-hint">View Fees &rarr;</span>
                  </div>

                  <div className="ap-treasury-stat-box">
                    <span className="lbl">💳 Gross Platform Inflow</span>
                    <span className="val" style={{ color: "#f59e0b" }}>
                      ₹{filteredFinancialTotals.grossRevenue.toLocaleString("en-IN")}
                    </span>
                    <span className="sub">{filteredFinancialTotals.totalTxnCount} total paid collections</span>
                    <span className="sub" style={{ fontSize: 10, color: "#64748b" }}>User + Service Inflow</span>
                  </div>

                  <div
                    className="ap-treasury-stat-box clickable-box"
                    role="button"
                    tabIndex={0}
                    onClick={() => switchTab("staff_withdrawals")}
                    title="Click to view Counselor Withdrawals"
                  >
                    <span className="lbl">💸 Staff Withdrawals Paid</span>
                    <span className="val" style={{ color: "#f43f5e" }}>
                      ₹{filteredFinancialTotals.staffPaid.toLocaleString("en-IN")}
                    </span>
                    <span className="sub">{filteredFinancialTotals.staffPaidCount} payouts settled</span>
                    <span className="action-hint">Manage Payouts &rarr;</span>
                  </div>

                  <div
                    className="ap-treasury-stat-box clickable-box"
                    role="button"
                    tabIndex={0}
                    onClick={() => switchTab("staff_withdrawals")}
                    title="Click to review Pending Counselor Payouts"
                  >
                    <span className="lbl">⏳ Pending Staff Payouts</span>
                    <span className="val" style={{ color: filteredFinancialTotals.staffPending > 0 ? "#eab308" : "#94a3b8" }}>
                      ₹{filteredFinancialTotals.staffPending.toLocaleString("en-IN")}
                    </span>
                    <span className="sub">{filteredFinancialTotals.staffPendingCount} in queue</span>
                    {filteredFinancialTotals.staffPendingCount > 0 ? (
                      <span className="action-hint" style={{ color: "#eab308" }}>Settle Requests &rarr;</span>
                    ) : (
                      <span className="sub" style={{ fontSize: 10, color: "#10b981" }}>All Clear</span>
                    )}
                  </div>

                  <div className="ap-treasury-stat-box highlight-net">
                    <span className="lbl" style={{ color: "#34d399" }}>💰 Net Remaining Funds</span>
                    <span className="val" style={{ color: filteredFinancialTotals.netRemain >= 0 ? "#10b981" : "#ef4444" }}>
                      {filteredFinancialTotals.netRemain >= 0 ? "+" : ""}₹{filteredFinancialTotals.netRemain.toLocaleString("en-IN")}
                    </span>
                    <span className="sub" style={{ color: "#6ee7b7", fontWeight: 700 }}>
                      {filteredFinancialTotals.marginPercent}% Net Profit Retained
                    </span>
                    <span className="sub" style={{ fontSize: 10, color: "#94a3b8" }}>After Counselor Payouts</span>
                  </div>
                </div>

                {/* Monthly Ledger Table */}
                <div className="ap-table-wrap">
                  <Table
                    dataSource={filteredMonthlyFinancials}
                    rowKey="monthKey"
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: 1000 }}
                    columns={[
                      {
                        title: "Billing Period",
                        render: (_, m) => (
                          <div>
                            <div style={{ fontWeight: 800, color: "var(--ap-text-main, #ffffff)", fontSize: 14 }}>{m.monthLabel}</div>
                            <Tag color="geekblue" style={{ fontSize: 10, margin: "2px 0 0 0" }}>{m.monthKey}</Tag>
                          </div>
                        ),
                      },
                      {
                        title: "Candidate Revenue (User)",
                        render: (_, m) => (
                          <div>
                            <div style={{ fontWeight: 800, color: "#38bdf8", fontSize: 14 }}>
                              ₹{m.userRevenue.toLocaleString("en-IN")}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>
                              {m.userCount} candidate recharge{m.userCount === 1 ? "" : "s"}
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: "Wedding Service Revenue",
                        render: (_, m) => (
                          <div>
                            <div style={{ fontWeight: 800, color: "#a855f7", fontSize: 14 }}>
                              ₹{m.serviceRevenue.toLocaleString("en-IN")}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>
                              {m.serviceCount} vendor listing{m.serviceCount === 1 ? "" : "s"}
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: "Gross Platform Inflow",
                        render: (_, m) => (
                          <div>
                            <div style={{ fontWeight: 800, color: "#f59e0b", fontSize: 14 }}>
                              ₹{m.grossRevenue.toLocaleString("en-IN")}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>
                              {m.totalTxnCount} total collection{m.totalTxnCount === 1 ? "" : "s"}
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: "Staff Withdrawals Paid",
                        render: (_, m) => (
                          <div>
                            <div style={{ fontWeight: 800, color: m.staffPaid > 0 ? "#f43f5e" : "#64748b", fontSize: 14 }}>
                              {m.staffPaid > 0 ? "-" : ""}₹{m.staffPaid.toLocaleString("en-IN")}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>
                              {m.staffPaidCount} payout{m.staffPaidCount === 1 ? "" : "s"} settled
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: "Pending Staff Payouts",
                        render: (_, m) => (
                          <div>
                            <div style={{ fontWeight: 700, color: m.staffPending > 0 ? "#eab308" : "#64748b", fontSize: 13 }}>
                              ₹{m.staffPending.toLocaleString("en-IN")}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>
                              {m.staffPendingCount} in review
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: "Net Remaining Balance",
                        render: (_, m) => {
                          const isPos = m.netRemain >= 0;
                          return (
                            <div>
                              <div style={{ fontWeight: 900, color: isPos ? "#10b981" : "#ef4444", fontSize: 15 }}>
                                {isPos ? "+" : ""}₹{m.netRemain.toLocaleString("en-IN")}
                              </div>
                              <div style={{ marginTop: 2 }}>
                                <Tag color={isPos ? "success" : "error"} style={{ fontSize: 10, margin: 0 }}>
                                  {m.marginPercent}% Retained
                                </Tag>
                              </div>
                            </div>
                          );
                        },
                      },
                      {
                        title: "Audit Details",
                        render: (_, m) => (
                          <Button
                            size="small"
                            type="primary"
                            icon={<EyeOutlined />}
                            style={{ background: "#334155", borderColor: "#475569", fontWeight: 700 }}
                            onClick={() => setFinancialMonthModal(m)}
                          >
                            Inspect Details
                          </Button>
                        ),
                      },
                    ]}
                    summary={() => (
                      <Table.Summary fixed>
                        <Table.Summary.Row style={{ background: "#f1f5f9", fontWeight: 800 }}>
                          <Table.Summary.Cell index={0}>
                            <strong style={{ color: "#2563eb" }}>TOTAL ({filteredMonthlyFinancials.length} Months)</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>
                            <span style={{ color: "#38bdf8", fontSize: 14 }}>
                              ₹{filteredFinancialTotals.userRevenue.toLocaleString("en-IN")}
                            </span>
                            <div style={{ fontSize: 10, color: "#94a3b8" }}>
                              ({filteredFinancialTotals.userCount} recharges)
                            </div>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2}>
                            <span style={{ color: "#a855f7", fontSize: 14 }}>
                              ₹{filteredFinancialTotals.serviceRevenue.toLocaleString("en-IN")}
                            </span>
                            <div style={{ fontSize: 10, color: "#94a3b8" }}>
                              ({filteredFinancialTotals.serviceCount} listings)
                            </div>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={3}>
                            <span style={{ color: "#f59e0b", fontSize: 14 }}>
                              ₹{filteredFinancialTotals.grossRevenue.toLocaleString("en-IN")}
                            </span>
                            <div style={{ fontSize: 10, color: "#94a3b8" }}>
                              ({filteredFinancialTotals.totalTxnCount} txns)
                            </div>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={4}>
                            <span style={{ color: "#f43f5e", fontSize: 14 }}>
                              -₹{filteredFinancialTotals.staffPaid.toLocaleString("en-IN")}
                            </span>
                            <div style={{ fontSize: 10, color: "#94a3b8" }}>
                              ({filteredFinancialTotals.staffPaidCount} payouts)
                            </div>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={5}>
                            <span style={{ color: "#eab308", fontSize: 13 }}>
                              ₹{filteredFinancialTotals.staffPending.toLocaleString("en-IN")}
                            </span>
                            <div style={{ fontSize: 10, color: "#94a3b8" }}>
                              ({filteredFinancialTotals.staffPendingCount} pending)
                            </div>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={6}>
                            <span style={{ color: filteredFinancialTotals.netRemain >= 0 ? "#10b981" : "#ef4444", fontSize: 15 }}>
                              {filteredFinancialTotals.netRemain >= 0 ? "+" : ""}₹{filteredFinancialTotals.netRemain.toLocaleString("en-IN")}
                            </span>
                            <div style={{ fontSize: 10, color: "#10b981" }}>
                              ({filteredFinancialTotals.marginPercent}% Retained Margin)
                            </div>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={7}>
                            <span style={{ color: "#64748b" }}>—</span>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    )}
                  />
                </div>
              </div>

              {/* 22 Platform Database Models - Interactive Jump-Pad */}
              <div className="ap-card ap-model-jumppad-card">
                <div className="ap-card-header">
                  <div>
                    <h3 className="ap-card-title">
                      <DatabaseOutlined className="ap-card-title-icon" style={{ color: "#38bdf8" }} />
                      All 22 Backend Models — 1-Click Interactive Jump Pad
                    </h3>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                      Click any model chip to jump directly into its full schema, field search, and JSON inspector
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ap-jumppad-all-btn"
                    onClick={() => switchTab("model_explorer")}
                  >
                    Open Model Studio &rarr;
                  </button>
                </div>
                <div className="ap-model-jumppad-grid">
                  {allModelsMeta.map((m) => (
                    <div
                      key={m.key}
                      className="ap-model-jump-chip"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedExplorerModel(m.key);
                        setExplorerSearch("");
                        switchTab("model_explorer");
                      }}
                      title={`Click to inspect ${m.name}`}
                    >
                      <div className="chip-left">
                        <DatabaseOutlined className="chip-icon" />
                        <span className="chip-name">{m.key}</span>
                      </div>
                      <div className="chip-right">
                        <span className="chip-arrow">&rarr;</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Administrative Speed-Dial Actions */}
              <div className="ap-card ap-cockpit-speeddial-card">
                <div className="ap-card-header">
                  <h3 className="ap-card-title">
                    <ThunderboltOutlined className="ap-card-title-icon" style={{ color: "#2563eb" }} />
                    Administrative Speed-Dial Actions
                  </h3>
                </div>
                <div className="ap-speeddial-grid">
                  <button
                    type="button"
                    className="ap-speeddial-btn"
                    onClick={() => handleOpenCreateCandidate()}
                  >
                    <UserAddOutlined className="ap-speeddial-icon" style={{ color: "#38bdf8" }} />
                    <span className="ap-speeddial-text">+ Register Candidate</span>
                  </button>
                  <button
                    type="button"
                    className="ap-speeddial-btn"
                    onClick={() => handleOpenPlanModal()}
                  >
                    <CrownOutlined className="ap-speeddial-icon" style={{ color: "#2563eb" }} />
                    <span className="ap-speeddial-text">+ Create Package</span>
                  </button>
                  <button
                    type="button"
                    className="ap-speeddial-btn"
                    onClick={() => setIsManualTxnOpen(true)}
                  >
                    <CreditCardOutlined className="ap-speeddial-icon" style={{ color: "#10b981" }} />
                    <span className="ap-speeddial-text">Offline Recharge</span>
                  </button>
                  <button
                    type="button"
                    className="ap-speeddial-btn"
                    onClick={() => handleOpenCreateStaff()}
                  >
                    <TeamOutlined className="ap-speeddial-icon" style={{ color: "#ec4899" }} />
                    <span className="ap-speeddial-text">+ Add Counselor</span>
                  </button>
                  <button
                    type="button"
                    className="ap-speeddial-btn"
                    onClick={() => handleOpenCreateService()}
                  >
                    <ShopOutlined className="ap-speeddial-icon" style={{ color: "#06b6d4" }} />
                    <span className="ap-speeddial-text">+ Onboard Vendor</span>
                  </button>
                  <button
                    type="button"
                    className="ap-speeddial-btn"
                    onClick={() => switchTab("staff_withdrawals")}
                  >
                    <WalletOutlined className="ap-speeddial-icon" style={{ color: "#f43f5e" }} />
                    <span className="ap-speeddial-text">Review Payouts</span>
                  </button>
                  <button
                    type="button"
                    className="ap-speeddial-btn"
                    onClick={() => switchTab("master_attributes")}
                  >
                    <ApartmentOutlined className="ap-speeddial-icon" style={{ color: "#8b5cf6" }} />
                    <span className="ap-speeddial-text">Match Criteria</span>
                  </button>
                  <button
                    type="button"
                    className="ap-speeddial-btn"
                    onClick={() => switchTab("master_geography")}
                  >
                    <GlobalOutlined className="ap-speeddial-icon" style={{ color: "#14b8a6" }} />
                    <span className="ap-speeddial-text">Geography Zones</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* USER MANAGEMENT SEPARATE DASHBOARD                         */}
          {/* ========================================================== */}
          {activeTab === "user_dashboard" && (
            <div className="ap-dashboard-cockpit">
              <div className="ap-cockpit-banner" style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)", borderColor: "#bae6fd" }}>
                <div className="ap-cockpit-banner-text">
                  <div className="ap-cockpit-tag" style={{ color: "#38bdf8" }}>USER MANAGEMENT DASHBOARD</div>
                  <h2 className="ap-cockpit-title">Candidate Profiles &amp; Subscription Intelligence</h2>
                  <p className="ap-cockpit-sub">
                    Monitor candidate registrations, active profiles, gender ratios, membership packages, and offline recharges.
                  </p>
                </div>
                <div className="ap-cockpit-banner-actions">
                  <button
                    type="button"
                    className="ap-cockpit-action-btn primary"
                    onClick={() => handleOpenCreateCandidate()}
                  >
                    <UserAddOutlined /> + Register Candidate
                  </button>
                  <button
                    type="button"
                    className="ap-cockpit-action-btn"
                    onClick={() => switchTab("user_profiles")}
                  >
                    <UserOutlined /> Profiles Directory &rarr;
                  </button>
                </div>
              </div>

              {/* 4 Dedicated User KPI Stat Cards */}
              <div className="ap-stats-grid">
                <div className="ap-stat-card ap-stat-gold ap-clickable-kpi" onClick={() => switchTab("user_profiles")}>
                  <div className="ap-stat-info">
                    <span className="ap-stat-label">Candidate Dossiers</span>
                    <span className="ap-stat-value">{candidates.length}</span>
                    <span className="ap-stat-trend">Total Registered Candidates &rarr;</span>
                  </div>
                  <div className="ap-stat-icon-wrap ap-stat-icon-gold"><UserOutlined /></div>
                </div>

                <div className="ap-stat-card ap-stat-emerald ap-clickable-kpi" onClick={() => switchTab("user_profiles")}>
                  <div className="ap-stat-info">
                    <span className="ap-stat-label">Active vs Private</span>
                    <span className="ap-stat-value">{candidates.filter(c => c.Active !== false).length} Active</span>
                    <span className="ap-stat-trend">{candidates.filter(c => c.Active === false).length} Private Profiles &rarr;</span>
                  </div>
                  <div className="ap-stat-icon-wrap ap-stat-icon-emerald"><CheckCircleFilled /></div>
                </div>

                <div className="ap-stat-card ap-stat-gold ap-clickable-kpi" onClick={() => switchTab("user_subscriptions")}>
                  <div className="ap-stat-info">
                    <span className="ap-stat-label">Membership Packages</span>
                    <span className="ap-stat-value">{plansList.length} Plans</span>
                    <span className="ap-stat-trend">Pricing &amp; Benefits CRUD &rarr;</span>
                  </div>
                  <div className="ap-stat-icon-wrap ap-stat-icon-gold"><CrownOutlined /></div>
                </div>

                <div className="ap-stat-card ap-stat-indigo ap-clickable-kpi" onClick={() => switchTab("user_invoices")}>
                  <div className="ap-stat-info">
                    <span className="ap-stat-label">Subscription Revenue</span>
                    <span className="ap-stat-value">₹{totalCandidateRevenue.toLocaleString("en-IN")}</span>
                    <span className="ap-stat-trend">{userTxns.length} Invoiced Orders &rarr;</span>
                  </div>
                  <div className="ap-stat-icon-wrap ap-stat-icon-indigo"><DollarCircleOutlined /></div>
                </div>
              </div>

              {/* User Demographics & Recent Registrations Split */}
              <div className="ap-cockpit-split-grid">
                {/* Demographic Breakdown */}
                <div className="ap-card">
                  <div className="ap-card-header">
                    <h3 className="ap-card-title"><UserOutlined className="ap-card-title-icon" style={{ color: "#38bdf8" }} /> Candidate Gender &amp; Community Split</h3>
                  </div>
                  <div style={{ padding: "10px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
                      <span style={{ color: "#38bdf8" }}>♂ Groom (Male): {candidates.filter(c => c.Gender === "Male").length}</span>
                      <span style={{ color: "#ec4899" }}>♀ Bride (Female): {candidates.filter(c => c.Gender === "Female").length}</span>
                    </div>
                    <div style={{ height: 12, borderRadius: 6, background: "#ec4899", overflow: "hidden", display: "flex", marginBottom: 18 }}>
                      <div
                        style={{
                          height: "100%",
                          background: "#38bdf8",
                          width: candidates.length > 0 ? `${(candidates.filter(c => c.Gender === "Male").length / candidates.length) * 100}%` : "50%",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div className="ap-metric-row">
                        <span style={{ color: "#94a3b8" }}>Active Subscribed Profiles:</span>
                        <strong style={{ color: "#34d399" }}>{candidates.filter(c => c.Valid_Upto && new Date(c.Valid_Upto) > new Date()).length} Profiles</strong>
                      </div>
                      <div className="ap-metric-row">
                        <span style={{ color: "#94a3b8" }}>Expired Subscriptions:</span>
                        <strong style={{ color: "#f59e0b" }}>{candidates.filter(c => c.Valid_Upto && new Date(c.Valid_Upto) <= new Date()).length} Profiles</strong>
                      </div>
                      <div className="ap-metric-row">
                        <span style={{ color: "#94a3b8" }}>Total States Represented:</span>
                        <strong style={{ color: "var(--ap-text-main, #ffffff)" }}>{new Set(candidates.map(c => c.State).filter(Boolean)).size} States</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                      <Button type="primary" block style={{ background: "#38bdf8", borderColor: "#38bdf8", color: "#000", fontWeight: 700 }} onClick={() => switchTab("user_profiles")}>
                        View All Candidate Dossiers &rarr;
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Latest Candidate Registrations */}
                <div className="ap-card ap-cockpit-recent-card">
                  <div className="ap-card-header">
                    <h3 className="ap-card-title"><ClockCircleFilled className="ap-card-title-icon" style={{ color: "#38bdf8" }} /> Latest Registered Candidates</h3>
                    <button type="button" className="ap-card-header-link" onClick={() => switchTab("user_profiles")}>All ({candidates.length}) &rarr;</button>
                  </div>
                  <div className="ap-recent-candidates-list">
                    {candidates.slice(0, 4).map((c) => {
                      const picUrl = getMediaUrl(c.Profile_Pic || c.User_Pic);
                      return (
                        <div
                          key={c.id || c.User_id}
                          className="ap-recent-candidate-item ap-clickable-row"
                          role="button"
                          tabIndex={0}
                          onClick={() => handleOpenBiodata(c)}
                          title="Click to view full biodata dossier"
                        >
                          <img
                            src={picUrl}
                            alt={c.Full_Name || "Candidate"}
                            className="ap-recent-candidate-avatar"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
                            }}
                          />
                          <div className="ap-recent-candidate-details">
                            <div className="ap-recent-candidate-name">
                              {c.Full_Name || "Candidate Dossier"}
                              <Tag color={c.Active !== false ? "success" : "default"} style={{ marginLeft: 8, fontSize: 10 }}>
                                {c.Active !== false ? "Active" : "Private"}
                              </Tag>
                            </div>
                            <div className="ap-recent-candidate-meta">
                              {c.Age ? `${c.Age} yrs` : ""}{c.Gender ? ` • ${c.Gender}` : ""}{c.City ? ` • ${c.City}` : ""}{c.Caste ? ` • ${c.Caste}` : ""}
                            </div>
                          </div>
                          <span className="ap-row-arrow-indicator">Dossier &rarr;</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* STAFF COUNSELORS SEPARATE DASHBOARD                        */}
          {/* ========================================================== */}
          {activeTab === "staff_dashboard" && (
            <div className="ap-dashboard-cockpit">
              <div className="ap-cockpit-banner" style={{ background: "linear-gradient(135deg, #fdf2f8 0%, #ffffff 100%)", borderColor: "#fbcfe8" }}>
                <div className="ap-cockpit-banner-text">
                  <div className="ap-cockpit-tag" style={{ color: "#ec4899" }}>STAFF COUNSELORS DASHBOARD</div>
                  <h2 className="ap-cockpit-title">Marriage Counselors Network &amp; Payouts Intelligence</h2>
                  <p className="ap-cockpit-sub">
                    Direct oversight for counselor onboarding, KYC document approvals, referral commissions, and wallet balance settlements.
                  </p>
                </div>
                <div className="ap-cockpit-banner-actions">
                  <button
                    type="button"
                    className="ap-cockpit-action-btn primary"
                    onClick={() => handleOpenCreateStaff()}
                  >
                    <TeamOutlined /> + Onboard Staff Counselor
                  </button>
                  <button
                    type="button"
                    className="ap-cockpit-action-btn"
                    onClick={() => switchTab("staff_counselors")}
                  >
                    Staff Directory &rarr;
                  </button>
                </div>
              </div>

              {/* 4 Dedicated Staff KPI Stat Cards */}
              <div className="ap-stats-grid">
                <div className="ap-stat-card ap-stat-ruby ap-clickable-kpi" onClick={() => switchTab("staff_counselors")}>
                  <div className="ap-stat-info">
                    <span className="ap-stat-label">Counselor Network</span>
                    <span className="ap-stat-value">{staffList.length}</span>
                    <span className="ap-stat-trend">Registered Marriage Counselors &rarr;</span>
                  </div>
                  <div className="ap-stat-icon-wrap ap-stat-icon-ruby"><TeamOutlined /></div>
                </div>

                <div className="ap-stat-card ap-stat-gold ap-clickable-kpi" onClick={() => switchTab("staff_counselors")} style={{ borderColor: pendingStaffCount > 0 ? "rgba(245, 158, 11, 0.5)" : undefined }}>
                  <div className="ap-stat-info">
                    <span className="ap-stat-label">Pending KYC Approvals</span>
                    <span className="ap-stat-value" style={{ color: pendingStaffCount > 0 ? "#fbbf24" : undefined }}>{pendingStaffCount}</span>
                    <span className="ap-stat-trend">{pendingStaffCount > 0 ? "Counselors Awaiting Approval &rarr;" : "All Counselors Verified ✓"}</span>
                  </div>
                  <div className="ap-stat-icon-wrap ap-stat-icon-gold"><CheckCircleFilled /></div>
                </div>

                <div className="ap-stat-card ap-stat-ruby ap-clickable-kpi" onClick={() => switchTab("staff_withdrawals")} style={{ borderColor: pendingWithdrawalCount > 0 ? "rgba(239, 68, 68, 0.5)" : undefined }}>
                  <div className="ap-stat-info">
                    <span className="ap-stat-label">Payout Requests</span>
                    <span className="ap-stat-value" style={{ color: pendingWithdrawalCount > 0 ? "#f87171" : undefined }}>{pendingWithdrawalCount}</span>
                    <span className="ap-stat-trend">{pendingWithdrawalCount > 0 ? "Pending Transfer Review &rarr;" : "All Payouts Settled ✓"}</span>
                  </div>
                  <div className="ap-stat-icon-wrap ap-stat-icon-ruby"><WalletOutlined /></div>
                </div>

                <div className="ap-stat-card ap-stat-emerald ap-clickable-kpi" onClick={() => switchTab("staff_commission")}>
                  <div className="ap-stat-info">
                    <span className="ap-stat-label">Referral Commission</span>
                    <span className="ap-stat-value">₹{commissionAmount}</span>
                    <span className="ap-stat-trend">Rate per Verified Candidate &rarr;</span>
                  </div>
                  <div className="ap-stat-icon-wrap ap-stat-icon-emerald"><DollarCircleOutlined /></div>
                </div>
              </div>

              {/* Staff KYC Approval Queue directly on Staff Dashboard */}
              <div className="ap-approval-queue-card" style={{ marginTop: 10 }}>
                <div className="ap-queue-header">
                  <div className="ap-queue-title-wrap">
                    <TeamOutlined className="ap-queue-icon staff" />
                    <div>
                      <h4 className="ap-queue-title">Counselor KYC Applications Requiring Approval ({pendingStaffCount})</h4>
                      <span className="ap-queue-meta">Review Aadhaar, PAN and Bank passbook documents before approving counselor referral access</span>
                    </div>
                  </div>
                  <Button size="small" type="link" onClick={() => switchTab("staff_counselors")}>Open Full Directory &rarr;</Button>
                </div>

                <div className="ap-queue-items-list">
                  {staffList.filter(s => !s.is_approved).map((s) => {
                    const picUrl = getMediaUrl(s.Profile_Pic);
                    return (
                      <div key={s.id} className="ap-queue-item-row">
                        <div className="ap-queue-item-profile">
                          <img
                            src={picUrl}
                            alt={s.Full_Name || "Staff"}
                            className="ap-queue-avatar"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
                            }}
                          />
                          <div>
                            <div className="ap-queue-name">
                              {s.Full_Name || "Counselor"} <span className="ap-queue-ref">ID #{s.Staff_id || s.id}</span>
                            </div>
                            <div className="ap-queue-contacts">
                              <span>📞 {s.WP_Contact || "No Phone"}</span>
                              {s.State && <span>• {s.District ? `${s.District}, ` : ""}{s.State}</span>}
                            </div>
                            <div className="ap-queue-docs-tags">
                              <Tag color={s.Adhar_Number ? "blue" : "default"}>Aadhaar: {s.Adhar_Number || "Pending"}</Tag>
                              <Tag color={s.PAN_Number ? "purple" : "default"}>PAN: {s.PAN_Number || "Pending"}</Tag>
                              {s.Bank_Name && <Tag color="cyan">Bank: {s.Bank_Name}</Tag>}
                            </div>
                          </div>
                        </div>

                        <div className="ap-queue-actions">
                          <Button type="primary" style={{ background: "#10b981", borderColor: "#10b981", fontWeight: 700 }} onClick={() => handleApproveStaff(s.id, true)}>
                            ✓ Approve KYC
                          </Button>
                          <Button style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", color: "var(--ap-text-main, #ffffff)" }} onClick={() => handleOpenStaffKyc(s)}>
                            Inspect Docs
                          </Button>
                          <Popconfirm title="Reject counselor application?" onConfirm={() => handleDeleteStaff(s.id)}>
                            <Button danger>Reject</Button>
                          </Popconfirm>
                        </div>
                      </div>
                    );
                  })}

                  {pendingStaffCount === 0 && (
                    <div className="ap-queue-empty">
                      <span className="empty-check">✓</span>
                      <span>All counselors verified! Zero pending KYC applications.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* WEDDING SERVICES SEPARATE DASHBOARD                        */}
          {/* ========================================================== */}
          {activeTab === "service_dashboard" && (
            <div className="ap-dashboard-cockpit">
              <div className="ap-cockpit-banner" style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)", borderColor: "#a7f3d0" }}>
                <div className="ap-cockpit-banner-text">
                  <div className="ap-cockpit-tag" style={{ color: "#34d399" }}>WEDDING SERVICES DASHBOARD</div>
                  <h2 className="ap-cockpit-title">Wedding Service Partners &amp; Catalog Intelligence</h2>
                  <p className="ap-cockpit-sub">
                    Direct oversight for vendor partner verifications, category catalog definitions, and listing fee invoice collections.
                  </p>
                </div>
                <div className="ap-cockpit-banner-actions">
                  <button
                    type="button"
                    className="ap-cockpit-action-btn primary"
                    onClick={() => handleOpenCreateService()}
                  >
                    <ShopOutlined /> + Onboard Wedding Vendor
                  </button>
                  <button
                    type="button"
                    className="ap-cockpit-action-btn"
                    onClick={() => switchTab("service_partners")}
                  >
                    Vendors Directory &rarr;
                  </button>
                </div>
              </div>

              {/* 4 Dedicated Service KPI Stat Cards */}
              <div className="ap-stats-grid">
                <div className="ap-stat-card ap-stat-emerald ap-clickable-kpi" onClick={() => switchTab("service_partners")}>
                  <div className="ap-stat-info">
                    <span className="ap-stat-label">Wedding Vendors</span>
                    <span className="ap-stat-value">{servicesList.length}</span>
                    <span className="ap-stat-trend">Registered Service Partners &rarr;</span>
                  </div>
                  <div className="ap-stat-icon-wrap ap-stat-icon-emerald"><ShopOutlined /></div>
                </div>

                <div className="ap-stat-card ap-stat-gold ap-clickable-kpi" onClick={() => switchTab("service_partners")} style={{ borderColor: pendingServiceCount > 0 ? "rgba(245, 158, 11, 0.5)" : undefined }}>
                  <div className="ap-stat-info">
                    <span className="ap-stat-label">Pending Verifications</span>
                    <span className="ap-stat-value" style={{ color: pendingServiceCount > 0 ? "#fbbf24" : undefined }}>{pendingServiceCount}</span>
                    <span className="ap-stat-trend">{pendingServiceCount > 0 ? "Listings Awaiting Approval &rarr;" : "All Vendors Verified ✓"}</span>
                  </div>
                  <div className="ap-stat-icon-wrap ap-stat-icon-gold"><CheckCircleFilled /></div>
                </div>

                <div className="ap-stat-card ap-stat-indigo ap-clickable-kpi" onClick={() => switchTab("service_catalog")}>
                  <div className="ap-stat-info">
                    <span className="ap-stat-label">Service Categories</span>
                    <span className="ap-stat-value">{serviceCategories.length}</span>
                    <span className="ap-stat-trend">Photography, Catering, Venue &rarr;</span>
                  </div>
                  <div className="ap-stat-icon-wrap ap-stat-icon-indigo"><AppstoreOutlined /></div>
                </div>

                <div className="ap-stat-card ap-stat-emerald ap-clickable-kpi" onClick={() => switchTab("service_transactions")}>
                  <div className="ap-stat-info">
                    <span className="ap-stat-label">Vendor Listing Revenue</span>
                    <span className="ap-stat-value">₹{totalVendorRevenue.toLocaleString("en-IN")}</span>
                    <span className="ap-stat-trend">{serviceTxns.length} Paid Service Listings &rarr;</span>
                  </div>
                  <div className="ap-stat-icon-wrap ap-stat-icon-emerald"><DollarCircleOutlined /></div>
                </div>
              </div>

              {/* Vendor Business Approvals Queue directly on Service Dashboard */}
              <div className="ap-approval-queue-card" style={{ marginTop: 10 }}>
                <div className="ap-queue-header">
                  <div className="ap-queue-title-wrap">
                    <ShopOutlined className="ap-queue-icon service" />
                    <div>
                      <h4 className="ap-queue-title">Wedding Service Vendors Awaiting Listing Approval ({pendingServiceCount})</h4>
                      <span className="ap-queue-meta">Review vendor profile, services offered, and pricing before publishing on matrimonial app</span>
                    </div>
                  </div>
                  <Button size="small" type="link" onClick={() => switchTab("service_partners")}>Open Full Directory &rarr;</Button>
                </div>

                <div className="ap-queue-items-list">
                  {servicesList.filter(s => s.Admin_Approval === false).map((srv) => (
                    <div key={srv.id} className="ap-queue-item-row">
                      <div className="ap-queue-item-profile">
                        <div className="ap-vendor-icon-box">
                          <ShopOutlined style={{ fontSize: 20, color: "#10b981" }} />
                        </div>
                        <div>
                          <div className="ap-queue-name">
                            {srv.Service_Name || "Wedding Vendor"}
                            <Tag color="gold" style={{ marginLeft: 8 }}>{srv.Service_Type || "General Service"}</Tag>
                          </div>
                          <div className="ap-queue-contacts">
                            <span>📞 {srv.WP_Contact || "No Phone"}</span>
                            {srv.City && <span>• {srv.City}{srv.State ? `, ${srv.State}` : ""}</span>}
                            {srv.Service_Price && <span>• ₹{Number(srv.Service_Price).toLocaleString("en-IN")}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="ap-queue-actions">
                        <Button
                          type="primary"
                          style={{ background: "#10b981", borderColor: "#10b981", fontWeight: 700 }}
                          onClick={() => handleApproveService(srv.id, true)}
                        >
                          ✓ Approve &amp; Activate
                        </Button>
                        <Button
                          style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", color: "var(--ap-text-main, #ffffff)" }}
                          onClick={() => handleOpenServiceKyc(srv)}
                        >
                          Inspect Profile
                        </Button>
                        <Popconfirm
                          title="Reject and delete vendor listing?"
                          onConfirm={() => handleDeleteService(srv.id)}
                        >
                          <Button danger>Reject</Button>
                        </Popconfirm>
                      </div>
                    </div>
                  ))}

                  {pendingServiceCount === 0 && (
                    <div className="ap-queue-empty">
                      <span className="empty-check">✓</span>
                      <span>Zero pending vendor listings. All registered wedding partners are active!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Partner Vendors Directory Preview Grid */}
              <div className="ap-approval-queue-card" style={{ marginTop: 24 }}>
                <div className="ap-queue-header">
                  <div className="ap-queue-title-wrap">
                    <ShopOutlined className="ap-queue-icon service" />
                    <div>
                      <h4 className="ap-queue-title">Wedding Service Partners ({serviceUsersList.length})</h4>
                      <span className="ap-queue-meta">Click any service partner card or their service cards to inspect complete details and services list</span>
                    </div>
                  </div>
                  <Button size="small" type="link" onClick={() => switchTab("service_partners")}>
                    Open All Partners ({serviceUsersList.length}) &rarr;
                  </Button>
                </div>

                <div style={{ padding: "16px 20px" }}>
                  {serviceUsersList.length === 0 ? (
                    <div className="ap-queue-empty">
                      <span>No wedding service partners registered yet.</span>
                    </div>
                  ) : (
                    <div className="ap-service-cards-grid">
                      {serviceUsersList.slice(0, 6).map((su) => (
                        <div
                          key={su.id}
                          className="ap-service-user-card"
                          onClick={() => handleOpenServiceUserProfile(su)}
                        >
                          <div>
                            {/* Top Profile Header */}
                            <div className="ap-service-card-top">
                              <div className="ap-service-card-avatar-fallback" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                                <ShopOutlined />
                              </div>
                              <div className="ap-service-card-main">
                                <h4 className="ap-service-card-title">
                                  {su.username}
                                </h4>
                                <div className="ap-service-card-badges">
                                  <Tag color="orange">Service Partner</Tag>
                                  <Tag color="purple">#USR-{su.id}</Tag>
                                  {su.is_active ? (
                                    <Tag color="success">✓ Active Account</Tag>
                                  ) : (
                                    <Tag color="error">Disabled</Tag>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Details Info Box */}
                            <div className="ap-service-card-details" style={{ marginTop: 12 }}>
                              <div className="ap-service-card-detail-item">
                                <span>📞 Contact</span>
                                <span className="ap-service-card-detail-val">
                                  {su.phone || "—"}
                                  {su.phone && (
                                    <a
                                      href={`https://wa.me/91${su.phone.replace(/\D/g, "")}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ marginLeft: 6, color: "#25d366" }}
                                      title="WhatsApp Message"
                                    >
                                      <WhatsAppOutlined />
                                    </a>
                                  )}
                                </span>
                              </div>
                              <div className="ap-service-card-detail-item">
                                <span>📍 Location</span>
                                <span className="ap-service-card-detail-val">
                                  {su.city ? `${su.city}${su.state ? `, ${su.state}` : ""}` : "Not set"}
                                </span>
                              </div>
                            </div>

                            {/* No. of Services (Card format) Separately Clickable */}
                            <div
                              style={{
                                marginTop: 12,
                                background: su.servicesCount > 0 ? "rgba(99, 102, 241, 0.12)" : "rgba(148, 163, 184, 0.08)",
                                border: su.servicesCount > 0 ? "1px solid rgba(99, 102, 241, 0.3)" : "1px dashed #475569",
                                borderRadius: 8,
                                padding: "8px 10px",
                                cursor: su.servicesCount > 0 ? "pointer" : "default",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (su.servicesCount > 0) {
                                  setSelectedServiceUserModal(su);
                                  setServiceUserDetailTab("user_services");
                                  setIsServiceUserModalOpen(true);
                                }
                              }}
                              title="Click to view all registered services for this user"
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: su.servicesCount > 0 ? "#a5b4fc" : "#94a3b8" }}>
                                  📦 Services Registered
                                </span>
                                <Tag color={su.servicesCount > 0 ? "purple" : "default"} style={{ margin: 0, fontWeight: 800 }}>
                                  {su.servicesCount} {su.servicesCount === 1 ? "Service" : "Services"}
                                </Tag>
                              </div>
                              {su.servicesCount > 0 ? (
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                                  {su.services.map((s) => (
                                    <span
                                      key={s.id}
                                      style={{
                                        background: "rgba(255, 255, 255, 0.1)",
                                        padding: "2px 6px",
                                        borderRadius: 4,
                                        fontSize: 10.5,
                                        color: "#f8fafc",
                                        fontWeight: 600,
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenServiceKyc(s);
                                      }}
                                      title={`Inspect ${s.Service_Name || s.Service_Type}`}
                                    >
                                      🏷️ {s.Service_Name || s.Service_Type}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>No service packages listed</div>
                              )}
                            </div>
                          </div>

                          {/* Card Footer & Action Buttons */}
                          <div className="ap-service-card-footer" style={{ marginTop: 12 }}>
                            <span className="ap-service-card-cta">
                              Service User Details &amp; Services &rarr;
                            </span>
                            <div className="ap-service-card-actions" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="small"
                                type="primary"
                                style={{ background: "#6366f1", borderColor: "#6366f1", fontWeight: 700 }}
                                onClick={() => handleOpenServiceUserProfile(su)}
                              >
                                User Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {serviceUsersList.length > 6 && (
                    <div style={{ textAlign: "center", marginTop: 16 }}>
                      <Button
                        type="default"
                        style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.15)", color: "var(--ap-text-main, #ffffff)" }}
                        onClick={() => switchTab("service_partners")}
                      >
                        View All {serviceUsersList.length} Wedding Service Partners in Full Directory &rarr;
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* HUB 1: USER PORTAL - CANDIDATE PROFILES                    */}
          {/* ========================================================== */}
          {activeTab === "user_profiles" && (
            <div className="ap-card">
              <div className="ap-card-header">
                <div>
                  <h3 className="ap-card-title">
                    <UserOutlined className="ap-card-title-icon" /> Candidate Profiles Directory
                  </h3>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                    Showing <strong>{filteredCandidates.length}</strong> of {candidates.length} registered candidate dossiers
                  </div>
                </div>
                <Space wrap>
                  <Button
                    type="primary"
                    style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                    icon={<UserAddOutlined />}
                    onClick={() => handleOpenCreateCandidate()}
                  >
                    + Register New Candidate
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleExportCandidatesCSV}
                    style={{
                      background: "#059669",
                      borderColor: "#059669",
                      color: "var(--ap-text-main, #ffffff)",
                      fontWeight: 700,
                    }}
                  >
                    Export Filtered CSV ({filteredCandidates.length})
                  </Button>
                  {activeFiltersCount > 0 && (
                    <Button
                      icon={<ClearOutlined />}
                      onClick={resetCandidateFilters}
                      style={{ background: "rgba(225, 29, 72, 0.15)", borderColor: "#e11d48", color: "#f43f5e", fontWeight: 700 }}
                    >
                      Reset All Filters ({activeFiltersCount})
                    </Button>
                  )}
                </Space>
              </div>

              {/* Quick KPI Metric Pills */}
              <div className="ap-candidate-kpi-bar">
                <div
                  className={`ap-kpi-pill ${activeFiltersCount === 0 ? "active" : ""}`}
                  onClick={resetCandidateFilters}
                  title="Click to view all candidates"
                >
                  <span className="ap-kpi-label">Total Profiles</span>
                  <span className="ap-kpi-val">{candidateMetrics.total}</span>
                </div>
                <div
                  className={`ap-kpi-pill kpi-active ${candidateStatusFilter === "active" ? "active" : ""}`}
                  onClick={() => setCandidateStatusFilter(candidateStatusFilter === "active" ? "all" : "active")}
                  title="Filter active profiles"
                >
                  <span className="ap-kpi-label">🟢 Active Profiles</span>
                  <span className="ap-kpi-val">{candidateMetrics.active}</span>
                </div>
                <div
                  className={`ap-kpi-pill kpi-valid ${candidateValidityFilter === "active_plan" ? "active" : ""}`}
                  onClick={() => setCandidateValidityFilter(candidateValidityFilter === "active_plan" ? "all" : "active_plan")}
                  title="Filter active paid plans"
                >
                  <span className="ap-kpi-label">👑 Valid Membership</span>
                  <span className="ap-kpi-val">{candidateMetrics.validPlan}</span>
                </div>
                <div
                  className={`ap-kpi-pill kpi-expired ${candidateValidityFilter === "expired_plan" ? "active" : ""}`}
                  onClick={() => setCandidateValidityFilter(candidateValidityFilter === "expired_plan" ? "all" : "expired_plan")}
                  title="Filter expired or free profiles"
                >
                  <span className="ap-kpi-label">⚠️ Expired / Free</span>
                  <span className="ap-kpi-val">{candidateMetrics.expiredPlan}</span>
                </div>
                <div
                  className={`ap-kpi-pill kpi-groom ${candidateGenderFilter === "male" ? "active" : ""}`}
                  onClick={() => setCandidateGenderFilter(candidateGenderFilter === "male" ? "all" : "male")}
                  title="Filter male candidates (grooms)"
                >
                  <span className="ap-kpi-label">🤵 Grooms (Male)</span>
                  <span className="ap-kpi-val">{candidateMetrics.grooms}</span>
                </div>
                <div
                  className={`ap-kpi-pill kpi-bride ${candidateGenderFilter === "female" ? "active" : ""}`}
                  onClick={() => setCandidateGenderFilter(candidateGenderFilter === "female" ? "all" : "female")}
                  title="Filter female candidates (brides)"
                >
                  <span className="ap-kpi-label">👰 Brides (Female)</span>
                  <span className="ap-kpi-val">{candidateMetrics.brides}</span>
                </div>
              </div>

              {/* Advanced Multi-Criteria Filter Card */}
              <div className="ap-advanced-filter-card">
                <div className="ap-filter-card-header">
                  <div className="ap-filter-title">
                    <FilterOutlined style={{ color: "#2563eb" }} />
                    <span>Candidate Search &amp; Multi-Criteria Filters</span>
                    {activeFiltersCount > 0 && (
                      <span className="ap-filter-badge">{activeFiltersCount} Active</span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>Sort By:</span>
                    <Select
                      value={candidateSortBy}
                      onChange={setCandidateSortBy}
                      style={{ width: 185 }}
                      size="small"
                    >
                      <Option value="newest">Newest Registered</Option>
                      <Option value="oldest">Oldest Registered</Option>
                      <Option value="expiring_soon">Validity: Expiring Soon</Option>
                      <Option value="longest_validity">Validity: Longest First</Option>
                      <Option value="age_asc">Age: Youngest First</Option>
                      <Option value="age_desc">Age: Eldest First</Option>
                      <Option value="salary_desc">Package: Highest First</Option>
                      <Option value="name_asc">Name: A to Z</Option>
                    </Select>
                  </div>
                </div>

                {/* Primary Search Bar across 12 dimensions */}
                <div style={{ marginBottom: 14 }}>
                  <Input
                    prefix={<SearchOutlined style={{ color: "#2563eb" }} />}
                    placeholder="Search candidate by name, Candidate ID (#102), Gotra, Caste, Religion, City, State, Phone, Qualification, Profession..."
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    allowClear
                    style={{
                      borderRadius: 10,
                      background: "#ffffff",
                      borderColor: "#cbd5e1",
                      color: "var(--ap-text-main, #0f172a)",
                      fontSize: 13.5,
                      padding: "8px 14px",
                    }}
                  />
                </div>

                {/* 12-Dimensional Filters Grid */}
                <div className="ap-filter-grid">
                  {/* 1. Gender */}
                  <div className="ap-filter-field">
                    <label className="ap-filter-label">Gender / Profile</label>
                    <Select value={candidateGenderFilter} onChange={setCandidateGenderFilter} style={{ width: "100%" }}>
                      <Option value="all">All Genders</Option>
                      <Option value="male">Male (Grooms / वर)</Option>
                      <Option value="female">Female (Brides / वधू)</Option>
                    </Select>
                  </div>

                  {/* 2. Marital Status */}
                  <div className="ap-filter-field">
                    <label className="ap-filter-label">Marital Status</label>
                    <Select value={candidateMaritalFilter} onChange={setCandidateMaritalFilter} style={{ width: "100%" }}>
                      <Option value="all">All Marital Statuses</Option>
                      <Option value="Never Married">Never Married / Single</Option>
                      <Option value="Divorced">Divorced</Option>
                      <Option value="Widowed">Widowed</Option>
                      <Option value="Awaiting Divorce">Awaiting Divorce</Option>
                    </Select>
                  </div>

                  {/* 3. Religion */}
                  <div className="ap-filter-field">
                    <label className="ap-filter-label">Religion</label>
                    <Select value={candidateReligionFilter} onChange={setCandidateReligionFilter} style={{ width: "100%" }}>
                      <Option value="all">All Religions</Option>
                      <Option value="Hindu">Hindu (हिन्दू)</Option>
                      <Option value="Jain">Jain (जैन)</Option>
                      <Option value="Sikh">Sikh (सिख)</Option>
                      <Option value="Muslim">Muslim (मुस्लिम)</Option>
                      <Option value="Christian">Christian (ईसाई)</Option>
                      <Option value="Buddhist">Buddhist (बौद्ध)</Option>
                    </Select>
                  </div>

                  {/* 4. Community / Caste */}
                  <div className="ap-filter-field">
                    <label className="ap-filter-label">Community / Caste</label>
                    <Select
                      showSearch
                      optionFilterProp="children"
                      value={candidateCasteFilter}
                      onChange={setCandidateCasteFilter}
                      style={{ width: "100%" }}
                    >
                      <Option value="all">All Castes ({availableCastesForFilter.length})</Option>
                      {availableCastesForFilter.map((caste) => (
                        <Option key={caste} value={caste}>{caste}</Option>
                      ))}
                    </Select>
                  </div>

                  {/* 5. State */}
                  <div className="ap-filter-field">
                    <label className="ap-filter-label">State / Region</label>
                    <Select
                      showSearch
                      optionFilterProp="children"
                      value={candidateStateFilter}
                      onChange={(val) => {
                        setCandidateStateFilter(val);
                        setCandidateDistrictFilter("all");
                      }}
                      style={{ width: "100%" }}
                    >
                      <Option value="all">All States</Option>
                      {statesList.map((s) => (
                        <Option key={s.id || s.State} value={s.State}>{s.State}</Option>
                      ))}
                    </Select>
                  </div>

                  {/* 6. District */}
                  <div className="ap-filter-field">
                    <label className="ap-filter-label">District / Mandal</label>
                    <Select
                      showSearch
                      optionFilterProp="children"
                      value={candidateDistrictFilter}
                      onChange={setCandidateDistrictFilter}
                      style={{ width: "100%" }}
                    >
                      <Option value="all">All Districts ({availableDistrictsForFilter.length})</Option>
                      {availableDistrictsForFilter.map((d) => (
                        <Option key={d} value={d}>{d}</Option>
                      ))}
                    </Select>
                  </div>

                  {/* 7. Membership Validity */}
                  <div className="ap-filter-field">
                    <label className="ap-filter-label">Plan Validity</label>
                    <Select value={candidateValidityFilter} onChange={setCandidateValidityFilter} style={{ width: "100%" }}>
                      <Option value="all">All Memberships</Option>
                      <Option value="active_plan">🟢 Active Valid Plan</Option>
                      <Option value="expired">🔴 Expired / Unpaid</Option>
                    </Select>
                  </div>

                  {/* 8. Profile Status */}
                  <div className="ap-filter-field">
                    <label className="ap-filter-label">Profile Status</label>
                    <Select value={candidateStatusFilter} onChange={setCandidateStatusFilter} style={{ width: "100%" }}>
                      <Option value="all">All Statuses</Option>
                      <Option value="active">Active Profiles Only</Option>
                      <Option value="inactive">Disabled / Inactive Only</Option>
                    </Select>
                  </div>

                  {/* 9. Manglik Dosha */}
                  <div className="ap-filter-field">
                    <label className="ap-filter-label">Manglik Kundali</label>
                    <Select value={candidateManglikFilter} onChange={setCandidateManglikFilter} style={{ width: "100%" }}>
                      <Option value="all">All Horoscopes</Option>
                      <Option value="manglik">🔴 Manglik Only (मांगलिक)</Option>
                      <Option value="non_manglik">🟢 Non-Manglik (अमांगलिक)</Option>
                    </Select>
                  </div>

                  {/* 10. Diet Preference */}
                  <div className="ap-filter-field">
                    <label className="ap-filter-label">Diet Preference</label>
                    <Select value={candidateDietFilter} onChange={setCandidateDietFilter} style={{ width: "100%" }}>
                      <Option value="all">All Diets</Option>
                      <Option value="vegetarian">🥦 Vegetarian (शाकाहारी)</Option>
                      <Option value="non_vegetarian">🍗 Non-Vegetarian (मांसाहारी)</Option>
                    </Select>
                  </div>

                  {/* 11. Age Bracket */}
                  <div className="ap-filter-field">
                    <label className="ap-filter-label">Age Group</label>
                    <Select value={candidateAgeFilter} onChange={setCandidateAgeFilter} style={{ width: "100%" }}>
                      <Option value="all">All Age Groups</Option>
                      <Option value="18_25">18 - 25 Years</Option>
                      <Option value="26_30">26 - 30 Years</Option>
                      <Option value="31_35">31 - 35 Years</Option>
                      <Option value="36_40">36 - 40 Years</Option>
                      <Option value="41_50">41 - 50 Years</Option>
                      <Option value="50_plus">50+ Years</Option>
                    </Select>
                  </div>

                  {/* 12. Annual Income */}
                  <div className="ap-filter-field">
                    <label className="ap-filter-label">Annual Package (Salary)</label>
                    <Select value={candidateIncomeFilter} onChange={setCandidateIncomeFilter} style={{ width: "100%" }}>
                      <Option value="all">All Income Brackets</Option>
                      <Option value="under_3">Under ₹3 LPA</Option>
                      <Option value="3_6">₹3 LPA - ₹6 LPA</Option>
                      <Option value="6_12">₹6 LPA - ₹12 LPA</Option>
                      <Option value="12_25">₹12 LPA - ₹25 LPA</Option>
                      <Option value="25_plus">₹25 LPA+</Option>
                    </Select>
                  </div>
                </div>

                {/* Active Filter Tags Row & Clear Bar */}
                {activeFiltersCount > 0 && (
                  <div className="ap-filter-actions-bar">
                    <div className="ap-filter-tags-row">
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Active:</span>
                      {candidateSearch && (
                        <span className="ap-filter-tag">
                          Keyword: "{candidateSearch}"
                          <span className="ap-filter-tag-remove" onClick={() => setCandidateSearch("")}>✕</span>
                        </span>
                      )}
                      {candidateGenderFilter !== "all" && (
                        <span className="ap-filter-tag">
                          Gender: {candidateGenderFilter === "male" ? "Groom" : "Bride"}
                          <span className="ap-filter-tag-remove" onClick={() => setCandidateGenderFilter("all")}>✕</span>
                        </span>
                      )}
                      {candidateMaritalFilter !== "all" && (
                        <span className="ap-filter-tag">
                          Marital: {candidateMaritalFilter}
                          <span className="ap-filter-tag-remove" onClick={() => setCandidateMaritalFilter("all")}>✕</span>
                        </span>
                      )}
                      {candidateReligionFilter !== "all" && (
                        <span className="ap-filter-tag">
                          Religion: {candidateReligionFilter}
                          <span className="ap-filter-tag-remove" onClick={() => setCandidateReligionFilter("all")}>✕</span>
                        </span>
                      )}
                      {candidateCasteFilter !== "all" && (
                        <span className="ap-filter-tag">
                          Caste: {candidateCasteFilter}
                          <span className="ap-filter-tag-remove" onClick={() => setCandidateCasteFilter("all")}>✕</span>
                        </span>
                      )}
                      {candidateStateFilter !== "all" && (
                        <span className="ap-filter-tag">
                          State: {candidateStateFilter}
                          <span className="ap-filter-tag-remove" onClick={() => setCandidateStateFilter("all")}>✕</span>
                        </span>
                      )}
                      {candidateDistrictFilter !== "all" && (
                        <span className="ap-filter-tag">
                          District: {candidateDistrictFilter}
                          <span className="ap-filter-tag-remove" onClick={() => setCandidateDistrictFilter("all")}>✕</span>
                        </span>
                      )}
                      {candidateValidityFilter !== "all" && (
                        <span className="ap-filter-tag">
                          Plan: {candidateValidityFilter === "active_plan" ? "Active" : "Expired"}
                          <span className="ap-filter-tag-remove" onClick={() => setCandidateValidityFilter("all")}>✕</span>
                        </span>
                      )}
                      {candidateStatusFilter !== "all" && (
                        <span className="ap-filter-tag">
                          Status: {candidateStatusFilter === "active" ? "Active Only" : "Disabled Only"}
                          <span className="ap-filter-tag-remove" onClick={() => setCandidateStatusFilter("all")}>✕</span>
                        </span>
                      )}
                      {candidateManglikFilter !== "all" && (
                        <span className="ap-filter-tag">
                          Horoscope: {candidateManglikFilter === "manglik" ? "Manglik" : "Non-Manglik"}
                          <span className="ap-filter-tag-remove" onClick={() => setCandidateManglikFilter("all")}>✕</span>
                        </span>
                      )}
                      {candidateDietFilter !== "all" && (
                        <span className="ap-filter-tag">
                          Diet: {candidateDietFilter === "vegetarian" ? "Vegetarian" : "Non-Veg"}
                          <span className="ap-filter-tag-remove" onClick={() => setCandidateDietFilter("all")}>✕</span>
                        </span>
                      )}
                      {candidateAgeFilter !== "all" && (
                        <span className="ap-filter-tag">
                          Age: {candidateAgeFilter.replace("_", "-")} Yrs
                          <span className="ap-filter-tag-remove" onClick={() => setCandidateAgeFilter("all")}>✕</span>
                        </span>
                      )}
                      {candidateIncomeFilter !== "all" && (
                        <span className="ap-filter-tag">
                          Income: {candidateIncomeFilter}
                          <span className="ap-filter-tag-remove" onClick={() => setCandidateIncomeFilter("all")}>✕</span>
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="ap-filter-count-text">
                        Found <strong>{filteredCandidates.length}</strong> matching candidates
                      </span>
                      <Button
                        size="small"
                        type="link"
                        danger
                        onClick={resetCandidateFilters}
                        style={{ fontWeight: 800 }}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Candidates Table */}
              <div className="ap-table-wrap">
                <Table scroll={{ x: "max-content" }}
                  dataSource={filteredCandidates}
                  rowKey={(r) => r.id}
                  pagination={{ pageSize: 12, showSizeChanger: true, pageSizeOptions: ["12", "24", "48", "100"] }}
                  locale={{
                    emptyText: (
                      <div style={{ padding: "40px 20px", textAlign: "center" }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                        <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 16 }}>No candidate profiles match your filter criteria</div>
                        <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4, marginBottom: 16 }}>
                          Try adjusting or clearing your filters to see more candidate dossiers.
                        </div>
                        {activeFiltersCount > 0 && (
                          <Button
                            type="primary"
                            style={{ background: "#e11d48", borderColor: "#e11d48", fontWeight: 700 }}
                            onClick={resetCandidateFilters}
                          >
                            Reset All Filters ({activeFiltersCount})
                          </Button>
                        )}
                      </div>
                    ),
                  }}
                  columns={[
                    {
                      title: "Candidate Profile",
                      render: (_, r) => (
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <Image
                            src={getMediaUrl(r.Profile_Pic)}
                            fallback="https://via.placeholder.com/44"
                            width={44}
                            height={44}
                            style={{ borderRadius: "50%", objectFit: "cover", objectPosition: "center top", border: "2px solid rgba(245, 158, 11, 0.4)" }}
                          />
                          <div>
                            <div style={{ fontWeight: 800, color: "var(--ap-text-main, #ffffff)", fontSize: 14 }}>
                              {r.Full_Name || "Unnamed"}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>
                                #{r.id} ({r.user_account?.username || r.User_id})
                              </span>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                                {r.Gender || "—"} &bull; {r.Age ? `${r.Age} yrs` : ""}
                              </span>
                              <Tag color="geekblue" style={{ fontSize: 10, padding: "0 5px", lineHeight: "18px" }}>
                                {r.Marrige_status || "Never Married"}
                              </Tag>
                            </div>
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Community & Kundali",
                      render: (_, r) => {
                        const isManglik = r.Manglik === true || r.Manglik === "Yes" || r.Manglik === "true" || String(r.Manglik).toLowerCase() === "yes";
                        return (
                          <div>
                            <div>
                              <strong style={{ color: "#f8fafc" }}>{r.Caste || "—"}</strong>
                              {r.Gotra && <span style={{ fontSize: 11, color: "#94a3b8" }}> ({r.Gotra})</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                              <span style={{ fontSize: 11, color: "#cbd5e1" }}>{r.Religion || "Hindu"}</span>
                              {isManglik ? (
                                <Tag color="error" style={{ fontSize: 10, padding: "0 4px", lineHeight: "17px" }}>Manglik</Tag>
                              ) : (
                                <Tag color="success" style={{ fontSize: 10, padding: "0 4px", lineHeight: "17px" }}>Non-Manglik</Tag>
                              )}
                            </div>
                          </div>
                        );
                      },
                    },
                    {
                      title: "Location & Residence",
                      render: (_, r) => (
                        <div>
                          <div style={{ color: "#f8fafc", fontWeight: 700 }}>{r.City || r.District || "—"}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>
                            {r.District ? `${r.District}, ` : ""}{r.State || "India"}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Profession & Salary",
                      render: (_, r) => (
                        <div>
                          <div style={{ color: "#e2e8f0" }}>{r.Profession || r.Job_type || "—"}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.Qualification || ""}</div>
                          <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 800, marginTop: 2 }}>
                            {r.Salary ? `₹${Number(r.Salary).toLocaleString("en-IN")}/yr` : "—"}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Contact & WhatsApp",
                      render: (_, r) => (
                        <div>
                          <div style={{ fontWeight: 700 }}>
                            <a
                              href={`https://wa.me/91${String(r.WP_Contact || "").replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "#34d399", display: "inline-flex", alignItems: "center", gap: 4 }}
                            >
                              <span>📱</span> {r.WP_Contact || "—"}
                            </a>
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>
                            Relation: <strong>{r.WP_Contact_Relation || "Self"}</strong>
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Membership Valid Upto",
                      render: (_, r) => {
                        const todayStr = new Date().toISOString().split("T")[0];
                        const isValid = r.Valid_Upto && r.Valid_Upto >= todayStr;
                        return (
                          <div>
                            {isValid ? (
                              <Tag color="cyan" style={{ fontWeight: 800 }}>{r.Valid_Upto}</Tag>
                            ) : (
                              <Tag color="error" style={{ fontWeight: 700 }}>{r.Valid_Upto ? `Expired (${r.Valid_Upto})` : "Free / Expired"}</Tag>
                            )}
                            <div>
                              <Button
                                type="link"
                                size="small"
                                style={{ padding: 0, fontSize: 11, color: "#fbbf24", fontWeight: 700 }}
                                onClick={() => {
                                  setValidityModalCandidate(r);
                                  setExtensionDays(30);
                                }}
                              >
                                + Extend Validity
                              </Button>
                            </div>
                          </div>
                        );
                      },
                    },
                    {
                      title: "Active",
                      width: 80,
                      render: (_, r) => (
                        <Switch
                          checked={r.Active !== false}
                          checkedChildren="On"
                          unCheckedChildren="Off"
                          onChange={() => handleToggleCandidateActive(r)}
                        />
                      ),
                    },
                    {
                      title: "Biodata & Actions",
                      width: 200,
                      render: (_, r) => (
                        <Space wrap>
                          <Button
                            size="small"
                            type="primary"
                            icon={<EyeOutlined />}
                            style={{ background: "#4f46e5", borderColor: "#4f46e5", fontWeight: 700, fontSize: 11 }}
                            onClick={() => {
                              setSelectedCandidate(r);
                              setIsCandidateModalOpen(true);
                            }}
                          >
                            Full Biodata
                          </Button>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenEditCandidate(r)}
                          />
                          <Popconfirm
                            title="Delete this candidate profile permanently?"
                            onConfirm={() => handleDeleteCandidate(r.id)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <Button size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* HUB 1: USER PORTAL - RECHARGE PLANS & PACKAGES             */}
          {/* ========================================================== */}
          {activeTab === "user_subscriptions" && (
            <div className="ap-card">
              <div className="ap-card-header">
                <div>
                  <h3 className="ap-card-title">
                    <CrownOutlined className="ap-card-title-icon" style={{ color: "#2563eb" }} /> Candidate Recharge Plans &amp; Packages ({plansList.length})
                  </h3>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                    Active membership subscription tiers, validity limits, and coupon discounts
                  </div>
                </div>
                <Space>
                  <Button
                    type="primary"
                    style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                    icon={<PlusOutlined />}
                    onClick={() => handleOpenPlanModal()}
                  >
                    + Create Plan
                  </Button>
                  <Button
                    style={{ borderColor: "rgba(255,255,255,0.2)", color: "var(--ap-text-main, #ffffff)", fontWeight: 700 }}
                    icon={<CreditCardOutlined />}
                    onClick={() => setIsManualTxnOpen(true)}
                  >
                    + Offline Recharge
                  </Button>
                </Space>
              </div>
              <div className="ap-table-wrap">
                <Table scroll={{ x: "max-content" }}
                  dataSource={plansList}
                  rowKey={(r) => r.id}
                  pagination={false}
                  columns={[
                    { title: "Plan Name", render: (_, r) => <strong>{r.Plan}</strong> },
                    {
                      title: "Type",
                      render: (_, r) => <Tag color={r.Type === "Coupon" ? "purple" : "gold"}>{r.Type || "Recharge"}</Tag>,
                    },
                    {
                      title: "Price (₹)",
                      render: (_, r) => (
                        <span style={{ fontSize: 16, fontWeight: 900, color: "#2563eb" }}>
                          ₹{Number(r.Amount || 0).toLocaleString("en-IN")}
                        </span>
                      ),
                    },
                    { title: "Validity", render: (_, r) => `${r.Validity || 30} Days` },
                    { title: "Discount", render: (_, r) => (r.Discount_Amount ? `₹${r.Discount_Amount}` : "None") },
                    { title: "Coupon Code", render: (_, r) => (r.Coupon_Code ? <Tag color="orange">{r.Coupon_Code}</Tag> : "—") },
                    { title: "Description", dataIndex: "Msg", render: (m) => m || "—" },
                    {
                      title: "Active",
                      render: (_, r) => (
                        <Tag color={r.Active !== false ? "success" : "default"}>
                          {r.Active !== false ? "Active" : "Disabled"}
                        </Tag>
                      ),
                    },
                    {
                      title: "Actions",
                      render: (_, r) => (
                        <Space>
                          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenPlanModal(r)}>Edit</Button>
                          <Popconfirm title="Delete plan?" onConfirm={() => handleDeletePlan(r.id)}>
                            <Button size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* HUB 1: USER PORTAL - RECHARGES & INVOICES LEDGER           */}
          {/* ========================================================== */}
          {activeTab === "user_invoices" && (
            <div className="ap-card">
              <div className="ap-card-header">
                <div>
                  <h3 className="ap-card-title">
                    <CreditCardOutlined className="ap-card-title-icon" style={{ color: "#10b981" }} /> Candidate Recharges &amp; Invoices Ledger ({userTxns.length})
                  </h3>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                    Total Invoiced Revenue: <strong style={{ color: "#2563eb" }}>₹{totalCandidateRevenue.toLocaleString("en-IN")}</strong>
                  </div>
                </div>
                <Button
                  type="primary"
                  style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                  icon={<CreditCardOutlined />}
                  onClick={() => setIsManualTxnOpen(true)}
                >
                  + Manual Offline Recharge
                </Button>
              </div>
              <div className="ap-table-wrap">
                <Table scroll={{ x: "max-content" }}
                  dataSource={userTxns}
                  rowKey={(r) => r.id}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: "Candidate / Subscriber",
                      render: (_, r) => (
                        <div>
                          <strong>{r.candidate_name || r.candidate_username || `Candidate #${r.User_id}`}</strong>
                          {r.candidate_contact && (
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>
                              📱 {r.candidate_contact}
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: "#64748b" }}>ID: {r.User_id}</div>
                        </div>
                      ),
                    },
                    { title: "Plan / Recharge", dataIndex: "Plan", render: (p) => <Tag color="gold" style={{ fontWeight: 700 }}>{p || "Standard Plan"}</Tag> },
                    {
                      title: "Amount Paid",
                      render: (_, r) => (
                        <span style={{ fontSize: 16, fontWeight: 900, color: "#10b981" }}>
                          ₹{Number(r.Amount || 0).toLocaleString("en-IN")}
                        </span>
                      ),
                    },
                    {
                      title: "Payment Status",
                      render: (_, r) => (
                        <Tag color={String(r.status).toLowerCase() === "success" ? "success" : "default"}>
                          {r.status || "Success"}
                        </Tag>
                      ),
                    },
                    { title: "Recharge Date", dataIndex: "Create_date", render: (d) => d || "—" },
                  ]}
                />
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* HUB 1: USER PORTAL - MATCHMAKING & WISHLISTS               */}
          {/* ========================================================== */}
          {activeTab === "user_matchmaking" && (
            <div className="ap-card">
              <div className="ap-card-header">
                <h3 className="ap-card-title"><HeartOutlined className="ap-card-title-icon" /> Candidate Matches &amp; Shortlists ({wishlists.length})</h3>
                <Input
                  prefix={<SearchOutlined />}
                  placeholder="Filter by user ID..."
                  value={wishlistSearch}
                  onChange={(e) => setWishlistSearch(e.target.value)}
                  style={{ width: 220 }}
                  allowClear
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <Select value={wishlistStatusFilter} onChange={setWishlistStatusFilter} style={{ width: 160 }}>
                  <Option value="all">All Match Statuses</Option>
                  <Option value="shortlisted">Shortlisted</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="approved">Approved</Option>
                  <Option value="rejected">Rejected</Option>
                </Select>
              </div>

              <div className="ap-table-wrap">
                <Table scroll={{ x: "max-content" }}
                  dataSource={filteredWishlists}
                  rowKey={(r) => r.id}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: "Sender Profile",
                      render: (_, r) => (
                        <div>
                          <strong>{r.sender_name || `User #${r.User_id}`}</strong>
                          {r.sender_contact && <div style={{ fontSize: 11, color: "#94a3b8" }}>📱 {r.sender_contact}</div>}
                          <div style={{ fontSize: 10, color: "#64748b" }}>ID: {r.User_id}</div>
                        </div>
                      ),
                    },
                    {
                      title: "Target Partner Profile",
                      render: (_, r) => (
                        <div>
                          <strong>{r.receiver_name || `Candidate #${r.Wish_User_id}`}</strong>
                          {r.receiver_contact && <div style={{ fontSize: 11, color: "#94a3b8" }}>📱 {r.receiver_contact}</div>}
                          <div style={{ fontSize: 10, color: "#64748b" }}>ID: {r.Wish_User_id}</div>
                        </div>
                      ),
                    },
                    {
                      title: "Connection Status",
                      render: (_, r) => {
                        const s = r.Status || "Pending";
                        const col = s === "Approved" ? "success" : s === "Rejected" ? "error" : "gold";
                        return <Tag color={col} style={{ fontWeight: 800 }}>{s.toUpperCase()}</Tag>;
                      },
                    },
                    { title: "Created Date", dataIndex: "Create_date", render: (d) => d || "—" },
                    {
                      title: "Admin Controls",
                      render: (_, r) => (
                        <Space>
                          <Button size="small" type="primary" onClick={() => handleUpdateWishlistStatus(r.id, "Approved")}>
                            Force Approve
                          </Button>
                          <Button size="small" danger onClick={() => handleUpdateWishlistStatus(r.id, "Rejected")}>
                            Force Reject
                          </Button>
                          <Popconfirm title="Delete this match record?" onConfirm={() => handleDeleteWishlist(r.id)}>
                            <Button size="small" icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* HUB 2: STAFF COUNSELOR PORTAL - DIRECTORY & KYC            */}
          {/* ========================================================== */}
          {activeTab === "staff_counselors" && (
            <div className="ap-card">
              <div className="ap-card-header">
                <h3 className="ap-card-title"><TeamOutlined className="ap-card-title-icon" /> Staff Counselors Directory &amp; Verification ({staffList.length})</h3>
                <Space>
                  <Button
                    type="primary"
                    style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                    icon={<UserAddOutlined />}
                    onClick={() => handleOpenCreateStaff()}
                  >
                    + Add Staff Counselor
                  </Button>
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search staff, phone, referral code..."
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    style={{ width: 260 }}
                    allowClear
                  />
                </Space>
              </div>

              <div className="ap-table-wrap">
                <Table scroll={{ x: "max-content" }}
                  dataSource={filteredStaff}
                  rowKey={(r) => r.id}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: "Counselor",
                      render: (_, r) => (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Image src={getMediaUrl(r.Profile_Pic)} fallback="https://via.placeholder.com/40" width={38} height={38} style={{ borderRadius: "50%", objectFit: "cover", objectPosition: "center top" }} />
                          <div>
                            <div style={{ fontWeight: 800, color: "var(--ap-text-main, #ffffff)" }}>{r.Full_Name || "Unnamed Staff"}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.Email || "No Email"}</div>
                          </div>
                        </div>
                      ),
                    },
                    { title: "Phone & WhatsApp", dataIndex: "WP_Contact", render: (p) => p || "—" },
                    { title: "Referral Code", render: (_, r) => <Tag color="gold" style={{ fontWeight: 800 }}>{r.Refer || "—"}</Tag> },
                    {
                      title: "Wallet Balance",
                      render: (_, r) => (
                        <div>
                          <span style={{ fontSize: 15, fontWeight: 900, color: "#10b981" }}>
                            ₹{Number(r.Amount || 0).toLocaleString("en-IN")}
                          </span>
                          <div>
                            <Button
                              type="link"
                              size="small"
                              style={{ padding: 0, fontSize: 11, color: "#38bdf8" }}
                              onClick={() => {
                                setWalletStaff(r);
                                setWalletAmount(500);
                                setWalletType("Credit");
                                setWalletRemark("");
                              }}
                            >
                              &plusmn; Adjust Wallet
                            </Button>
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "KYC Approval",
                      render: (_, r) => (
                        <Button
                          size="small"
                          type={r.is_approved ? "primary" : "default"}
                          style={{
                            background: r.is_approved ? "#10b981" : "#f59e0b",
                            borderColor: r.is_approved ? "#10b981" : "#f59e0b",
                            color: r.is_approved ? "#ffffff" : "#000000",
                            fontWeight: 800,
                          }}
                          onClick={() => handleApproveStaff(r.id, !r.is_approved)}
                        >
                          {r.is_approved ? "✓ Approved" : "Pending Approval"}
                        </Button>
                      ),
                    },
                    {
                      title: "Active",
                      render: (_, r) => (
                        <Switch checked={r.Active !== false} onChange={(chk) => handleToggleStaffActive(r.id, chk)} />
                      ),
                    },
                    {
                      title: "Actions",
                      render: (_, r) => (
                        <Space>
                          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEditStaff(r)}>Edit</Button>
                          <Button
                            size="small"
                            icon={<SafetyOutlined />}
                            onClick={() => {
                              setSelectedStaff(r);
                              setIsStaffModalOpen(true);
                            }}
                          >
                            KYC Docs
                          </Button>
                          <Popconfirm title="Delete staff profile?" onConfirm={() => handleDeleteStaff(r.id)}>
                            <Button size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* HUB 2: STAFF COUNSELOR PORTAL - WALLET & WITHDRAWALS       */}
          {/* ========================================================== */}
          {activeTab === "staff_withdrawals" && (
            <div className="ap-card">
              <div className="ap-card-header">
                <div>
                  <h3 className="ap-card-title">
                    <WalletOutlined className="ap-card-title-icon" /> Staff Counselor Wallet &amp; Withdrawal Payouts ({filteredStaffWithdrawals.length})
                  </h3>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                    Manage staff counselor withdrawal requests, review bank/UPI transfer credentials, and record settlement UTR references.
                  </div>
                </div>
                <Space wrap>
                  <Radio.Group
                    value={withdrawalFilter}
                    onChange={(e) => setWithdrawalFilter(e.target.value)}
                    size="middle"
                    buttonStyle="solid"
                  >
                    <Radio.Button value="all">All ({staffTxns.length})</Radio.Button>
                    <Radio.Button value="pending">
                      ⏳ Pending ({pendingWithdrawalCount})
                    </Radio.Button>
                    <Radio.Button value="approved">✓ Paid / Approved</Radio.Button>
                    <Radio.Button value="rejected">✕ Rejected</Radio.Button>
                  </Radio.Group>
                </Space>
              </div>
              <div className="ap-table-wrap">
                <Table scroll={{ x: "max-content" }}
                  dataSource={filteredStaffWithdrawals}
                  rowKey={(r) => r.id}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: "Counselor",
                      render: (_, r) => {
                        const sInfo = staffList.find(
                          (s) => String(s.Staff_id?.id || s.Staff_id) === String(r.Staff_id?.id || r.Staff_id)
                        );
                        const sName = r.staff_name || sInfo?.Full_Name || "Staff Counselor";
                        const sPhone = r.staff_contact || sInfo?.WP_Contact;
                        return (
                          <div>
                            <div style={{ fontWeight: 800, color: "var(--ap-text-main, #ffffff)" }}>{sName}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                              <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>Staff #{r.Staff_id}</Tag>
                              {sPhone && <span style={{ marginLeft: 6 }}>📞 {sPhone}</span>}
                            </div>
                          </div>
                        );
                      },
                    },
                    {
                      title: "Payout Destination",
                      render: (_, r) => {
                        const sInfo = staffList.find(
                          (s) => String(s.Staff_id?.id || s.Staff_id) === String(r.Staff_id?.id || r.Staff_id)
                        );
                        const bankAcc = r.staff_bank_account || sInfo?.Bank_Account_Number;
                        const bankName = r.staff_bank_name || sInfo?.Bank_Name;
                        const ifsc = r.staff_bank_ifsc || sInfo?.Bank_IFSC_Code;
                        const upi = r.staff_upi_id || sInfo?.UPI_ID;
                        return (
                          <div style={{ fontSize: 11, lineHeight: "1.5" }}>
                            {bankAcc ? (
                              <div>
                                <strong style={{ color: "#e2e8f0" }}>{bankName || "Bank"}</strong>
                                <div style={{ color: "#94a3b8" }}>A/C: {bankAcc} {ifsc ? `(${ifsc})` : ""}</div>
                              </div>
                            ) : upi ? (
                              <div>
                                <span style={{ color: "#64748b" }}>UPI:</span>{" "}
                                <strong style={{ color: "#34d399" }}>{upi}</strong>
                              </div>
                            ) : (
                              <span style={{ color: "#64748b" }}>No bank details on profile</span>
                            )}
                          </div>
                        );
                      },
                    },
                    {
                      title: "Amount",
                      render: (_, r) => (
                        <span style={{ fontSize: 16, fontWeight: 900, color: "#10b981" }}>
                          ₹{Number(r.Amount || 0).toLocaleString("en-IN")}
                        </span>
                      ),
                    },
                    {
                      title: "Type",
                      dataIndex: "Type",
                      render: (t) => <Tag color={t === "Withdrawal" ? "volcano" : "green"}>{t || "Withdrawal"}</Tag>,
                    },
                    {
                      title: "Status",
                      render: (_, r) => {
                        const s = r.Status || "Pending";
                        const color =
                          s === "Approved" || s === "Success"
                            ? "success"
                            : s === "Rejected" || s === "Failed"
                            ? "error"
                            : "gold";
                        return <Tag color={color} style={{ fontWeight: 800 }}>{s}</Tag>;
                      },
                    },
                    {
                      title: "Admin Remark / UTR Reference",
                      dataIndex: "Msg",
                      render: (m) => m ? <span style={{ color: "#cbd5e1" }}>{m}</span> : <span style={{ color: "#64748b" }}>—</span>,
                    },
                    { title: "Date", dataIndex: "Create_date", render: (d) => d || "—" },
                    {
                      title: "Action",
                      render: (_, r) => (
                        <Space>
                          {r.Status === "Pending" ? (
                            <Button
                              size="small"
                              type="primary"
                              style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                              onClick={() => {
                                setReviewWithdrawalModal(r);
                                setWithdrawalRemark(r.Msg || "");
                              }}
                            >
                              Review &amp; Settle
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.15)", color: "var(--ap-text-main, #ffffff)" }}
                              onClick={() => {
                                setReviewWithdrawalModal(r);
                                setWithdrawalRemark(r.Msg || "");
                              }}
                            >
                              View / Update UTR
                            </Button>
                          )}
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* HUB 2: STAFF COUNSELOR PORTAL - REFERRAL COMMISSION RATE   */}
          {/* ========================================================== */}
          {activeTab === "staff_commission" && (
            <div className="ap-card" style={{ maxWidth: 650 }}>
              <div className="ap-card-header">
                <h3 className="ap-card-title"><SettingOutlined className="ap-card-title-icon" /> Staff Referral Commission Setting</h3>
              </div>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>
                Configure the automated wallet credit given to Staff Counselors whenever a candidate registers or purchases using their referral code.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <InputNumber
                  min={0}
                  value={commissionAmount}
                  onChange={setCommissionAmount}
                  prefix="₹"
                  style={{ width: 180 }}
                />
                <Button
                  type="primary"
                  style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                  loading={savingCommission}
                  onClick={handleSaveCommissionRate}
                >
                  Save Commission Rate
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* HUB 3: SERVICE PARTNER PORTAL - VENDORS & VERIFICATION     */}
          {/* ========================================================== */}
          {activeTab === "service_partners" && (
            <div className="ap-card">
              <div className="ap-card-header">
                <div>
                  <h3 className="ap-card-title">
                    <ShopOutlined className="ap-card-title-icon" /> Wedding Service Partners ({serviceUsersList.length})
                  </h3>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                    Showing <strong>{filteredServiceUsers.length}</strong> registered partner accounts (offering {servicesList.length} wedding services)
                  </div>
                </div>
                <Space wrap>
                  <Button
                    type="primary"
                    style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                    icon={<UserAddOutlined />}
                    onClick={() => handleOpenCreateService()}
                  >
                    + Register Vendor Partner
                  </Button>
                  <Segmented
                    value={servicePartnerViewMode}
                    onChange={setServicePartnerViewMode}
                    options={[
                      { label: `👥 Service Users (${serviceUsersList.length})`, value: "users" },
                      { label: `📦 All Services (${servicesList.length})`, value: "listings" },
                    ]}
                  />
                  {servicePartnerViewMode === "users" ? (
                    <Input
                      prefix={<SearchOutlined />}
                      placeholder="Search username, phone, service, city..."
                      value={serviceUserSearch}
                      onChange={(e) => setServiceUserSearch(e.target.value)}
                      style={{ width: 260 }}
                      allowClear
                    />
                  ) : (
                    <Input
                      prefix={<SearchOutlined />}
                      placeholder="Search service name, category, city..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      style={{ width: 260 }}
                      allowClear
                    />
                  )}
                </Space>
              </div>

              {servicePartnerViewMode === "users" ? (
                /* SERVICE USERS DIRECTORY (Grouped by User with Clickable Services Cards) */
                <div className="ap-table-wrap">
                  <Table scroll={{ x: "max-content" }}
                    dataSource={filteredServiceUsers}
                    rowKey={(r) => r.id}
                    pagination={{ pageSize: 10 }}
                    columns={[
                      {
                        title: "Service Partner User",
                        render: (_, r) => (
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: 10,
                                background: "rgba(245, 158, 11, 0.15)",
                                color: "#f59e0b",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 20,
                              }}
                            >
                              <ShopOutlined />
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: "var(--ap-text-main, #ffffff)", fontSize: 14 }}>
                                {r.username}
                              </div>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                                User ID: #{r.id} • {r.date_joined ? `Joined ${new Date(r.date_joined).toLocaleDateString()}` : "Active"}
                              </div>
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: "Contact & Phone",
                        render: (_, r) => (
                          <div>
                            <div style={{ fontWeight: 600, color: "#e2e8f0" }}>
                              {r.phone ? `+91 ${r.phone}` : "—"}
                            </div>
                            {r.phone && (
                              <a
                                href={`https://wa.me/91${r.phone.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#25d366", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4, marginTop: 2 }}
                              >
                                <WhatsAppOutlined /> WhatsApp
                              </a>
                            )}
                          </div>
                        ),
                      },
                      {
                        title: "Primary Location",
                        render: (_, r) => (
                          <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                            {r.city ? `${r.city}${r.state ? `, ${r.state}` : ""}` : "—"}
                          </div>
                        ),
                      },
                      {
                        title: "Registered Services (Clickable Cards)",
                        render: (_, r) => (
                          <div
                            style={{
                              background: r.servicesCount > 0 ? "rgba(99, 102, 241, 0.1)" : "rgba(148, 163, 184, 0.08)",
                              border: r.servicesCount > 0 ? "1px solid rgba(99, 102, 241, 0.3)" : "1px dashed #475569",
                              borderRadius: 8,
                              padding: "6px 10px",
                              cursor: r.servicesCount > 0 ? "pointer" : "default",
                              minWidth: 160,
                            }}
                            onClick={() => {
                              if (r.servicesCount > 0) {
                                setSelectedServiceUserModal(r);
                                setServiceUserDetailTab("user_services");
                                setIsServiceUserModalOpen(true);
                              }
                            }}
                            title={r.servicesCount > 0 ? "Click to view full services list for this partner" : "No services registered yet"}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: r.servicesCount > 0 ? "#a5b4fc" : "#94a3b8" }}>
                                📦 Services ({r.servicesCount})
                              </span>
                              <Tag color={r.servicesCount > 0 ? "purple" : "default"} style={{ margin: 0, fontSize: 10.5, fontWeight: 800 }}>
                                {r.servicesCount} {r.servicesCount === 1 ? "Item" : "Items"}
                              </Tag>
                            </div>
                            {r.servicesCount > 0 ? (
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                                {r.services.map((s) => (
                                  <span
                                    key={s.id}
                                    style={{
                                      background: "rgba(255, 255, 255, 0.1)",
                                      padding: "2px 6px",
                                      borderRadius: 4,
                                      fontSize: 10.5,
                                      color: "#f8fafc",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenServiceKyc(s);
                                    }}
                                    title={`Click to inspect ${s.Service_Name || s.Service_Type}`}
                                  >
                                    🏷️ {s.Service_Name || s.Service_Type}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>No services registered</span>
                            )}
                          </div>
                        ),
                      },
                      {
                        title: "Account Status",
                        render: (_, r) => (
                          <Tag color={r.is_active ? "success" : "error"} style={{ fontWeight: 700 }}>
                            {r.is_active ? "Active Account" : "Disabled"}
                          </Tag>
                        ),
                      },
                      {
                        title: "Management Actions",
                        render: (_, r) => (
                          <Space>
                            <Button
                              size="small"
                              type="primary"
                              style={{ background: "#6366f1", borderColor: "#6366f1", fontWeight: 700 }}
                              icon={<EyeOutlined />}
                              onClick={() => handleOpenServiceUserProfile(r)}
                            >
                              User Details
                            </Button>
                            <Button
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={() => handleOpenCreateService()}
                              title="Register new service for this user"
                            >
                              + Service
                            </Button>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              ) : (
                /* ALL SERVICE LISTINGS VIEW (Catalog Granular View) */
                <div>
                  {/* Filter Toolbar for listings */}
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
                    <Select value={serviceCategoryFilter} onChange={setServiceCategoryFilter} style={{ width: 190 }}>
                      <Option value="all">All Service Categories</Option>
                      {serviceCategories.map((cat) => (
                        <Option key={cat.id} value={cat.Service_Type || cat.Service_Name}>
                          {cat.Service_Name || cat.Service_Type}
                        </Option>
                      ))}
                    </Select>

                    <Select value={serviceApprovalFilter} onChange={setServiceApprovalFilter} style={{ width: 190 }}>
                      <Option value="all">All Verification Statuses</Option>
                      <Option value="approved">✓ Verified &amp; Approved</Option>
                      <Option value="pending">⏳ Pending Approval</Option>
                    </Select>

                    {(serviceSearch || serviceCategoryFilter !== "all" || serviceApprovalFilter !== "all") && (
                      <Button
                        icon={<ClearOutlined />}
                        onClick={() => {
                          setServiceSearch("");
                          setServiceCategoryFilter("all");
                          setServiceApprovalFilter("all");
                        }}
                        style={{ background: "rgba(239, 68, 68, 0.15)", borderColor: "#ef4444", color: "#f87171", fontWeight: 700 }}
                      >
                        Reset Filters
                      </Button>
                    )}
                  </div>

                  <div className="ap-table-wrap">
                    <Table scroll={{ x: "max-content" }}
                      dataSource={filteredServices}
                      rowKey={(r) => r.id}
                      pagination={{ pageSize: 10 }}
                      columns={[
                        {
                          title: "Vendor Business",
                          render: (_, r) => (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Image
                                src={getMediaUrl(r.Picture)}
                                fallback="https://via.placeholder.com/40"
                                width={38}
                                height={38}
                                style={{ borderRadius: 8, objectFit: "cover" }}
                              />
                              <div>
                                <div style={{ fontWeight: 800, color: "var(--ap-text-main, #ffffff)" }}>{r.Service_Name || "Unnamed Service"}</div>
                                <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.City || "—"}, {r.District || "—"}</div>
                              </div>
                            </div>
                          ),
                        },
                        { title: "Category", dataIndex: "Service_Type", render: (t) => <Tag color="blue">{t || "General"}</Tag> },
                        {
                          title: "Contact",
                          render: (_, r) => (
                            <div>
                              <div>{r.WP_Contact || "—"}</div>
                              {r.WP_Contact && (
                                <a
                                  href={`https://wa.me/91${r.WP_Contact.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "#25d366", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}
                                >
                                  <WhatsAppOutlined /> WhatsApp
                                </a>
                              )}
                            </div>
                          ),
                        },
                        {
                          title: "Base Price",
                          render: (_, r) => (
                            <span style={{ fontWeight: 800, color: "#f59e0b" }}>
                              ₹{Number(r.Service_Price || 0).toLocaleString("en-IN")}
                            </span>
                          ),
                        },
                        {
                          title: "Listing Validity",
                          render: (_, r) => (
                            <div>
                              {r.Valid_Upto ? <Tag color="green">{r.Valid_Upto}</Tag> : <Tag>Standard</Tag>}
                              <div>
                                <Button
                                  type="link"
                                  size="small"
                                  style={{ padding: 0, fontSize: 11, color: "#fbbf24" }}
                                  onClick={() => {
                                    setValidityService(r);
                                    setServiceValidityDays(365);
                                  }}
                                >
                                  + Extend Validity
                                </Button>
                              </div>
                            </div>
                          ),
                        },
                        {
                          title: "Admin Approval",
                          render: (_, r) => (
                            <Button
                              size="small"
                              type={r.Admin_Approval ? "primary" : "default"}
                              style={{
                                background: r.Admin_Approval ? "#10b981" : "#f59e0b",
                                borderColor: r.Admin_Approval ? "#10b981" : "#f59e0b",
                                color: r.Admin_Approval ? "#ffffff" : "#000000",
                                fontWeight: 800,
                              }}
                              onClick={() => handleApproveService(r.id, !r.Admin_Approval)}
                            >
                              {r.Admin_Approval ? "✓ Verified" : "Pending"}
                            </Button>
                          ),
                        },
                        {
                          title: "Management Actions",
                          render: (_, r) => (
                            <Space>
                              <Button
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => handleOpenServiceKyc(r)}
                              >
                                Details
                              </Button>
                              <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEditService(r)}>Edit</Button>
                              <Popconfirm title="Delete service partner?" onConfirm={() => handleDeleteService(r.id)}>
                                <Button size="small" danger icon={<DeleteOutlined />} />
                              </Popconfirm>
                            </Space>
                          ),
                        },
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* HUB 3: SERVICE PARTNER PORTAL - SERVICES CATALOG           */}
          {/* ========================================================== */}
          {activeTab === "service_catalog" && (
            <div className="ap-card">
              <div className="ap-card-header">
                <h3 className="ap-card-title"><AppstoreOutlined className="ap-card-title-icon" /> Wedding Service Categories Catalog ({serviceCategories.length})</h3>
                <Button
                  type="primary"
                  style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenCatalogModal()}
                >
                  Add Category
                </Button>
              </div>
              <div className="ap-table-wrap">
                <Table scroll={{ x: "max-content" }}
                  dataSource={serviceCategories}
                  rowKey={(r) => r.id}
                  pagination={false}
                  columns={[
                    { title: "Category Title", render: (_, r) => <strong>{r.Service_Name || r.Service_Type}</strong> },
                    { title: "Type Tag", dataIndex: "Service_Type", render: (t) => <Tag color="blue">{t || "—"}</Tag> },
                    {
                      title: "Status",
                      render: (_, r) => (
                        <Tag color={r.Active !== false ? "success" : "default"}>
                          {r.Active !== false ? "Active" : "Disabled"}
                        </Tag>
                      ),
                    },
                    {
                      title: "Actions",
                      render: (_, r) => (
                        <Space>
                          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenCatalogModal(r)}>Edit</Button>
                          <Popconfirm title="Delete this category?" onConfirm={() => handleDeleteCatalogCategory(r.id)}>
                            <Button size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* HUB 3: SERVICE PARTNER PORTAL - LISTING FEES & PACKAGES    */}
          {/* ========================================================== */}
          {activeTab === "service_charges" && (
            <div className="ap-card">
              <div className="ap-card-header">
                <h3 className="ap-card-title"><DollarCircleOutlined className="ap-card-title-icon" /> Vendor Listing Pricing Packages ({serviceCharges.length})</h3>
                <Button
                  type="primary"
                  style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenChargeModal()}
                >
                  Add Listing Fee
                </Button>
              </div>
              <div className="ap-table-wrap">
                <Table scroll={{ x: "max-content" }}
                  dataSource={serviceCharges}
                  rowKey={(r) => r.id}
                  pagination={false}
                  columns={[
                    { title: "Category / Service ID", render: (_, r) => <Tag color="purple">Category #{r.Service_Type}</Tag> },
                    {
                      title: "Fee Amount",
                      render: (_, r) => (
                        <span style={{ fontSize: 16, fontWeight: 900, color: "#10b981" }}>
                          ₹{Number(r.Amount || 0).toLocaleString("en-IN")}
                        </span>
                      ),
                    },
                    { title: "Validity (Days)", render: (_, r) => `${r.Validity || 365} Days` },
                    {
                      title: "Active",
                      render: (_, r) => (
                        <Tag color={r.Active !== false ? "success" : "default"}>
                          {r.Active !== false ? "Active" : "Disabled"}
                        </Tag>
                      ),
                    },
                    {
                      title: "Actions",
                      render: (_, r) => (
                        <Space>
                          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenChargeModal(r)}>Edit</Button>
                          <Popconfirm title="Delete this listing charge?" onConfirm={() => handleDeleteCharge(r.id)}>
                            <Button size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* HUB 3: SERVICE PARTNER PORTAL - TRANSACTIONS               */}
          {/* ========================================================== */}
          {activeTab === "service_transactions" && (
            <div className="ap-card">
              <div className="ap-card-header">
                <h3 className="ap-card-title"><CreditCardOutlined className="ap-card-title-icon" /> Vendor Listing Fee Transactions ({serviceTxns.length})</h3>
              </div>
              <div className="ap-table-wrap">
                <Table scroll={{ x: "max-content" }}
                  dataSource={serviceTxns}
                  rowKey={(r) => r.id}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    {
                      title: "Vendor / Account",
                      render: (_, r) => (
                        <div>
                          <strong>{r.vendor_contact || r.vendor_username || `User #${r.User_id}`}</strong>
                          <div style={{ fontSize: 10, color: "#64748b" }}>ID: {r.User_id}</div>
                        </div>
                      ),
                    },
                    {
                      title: "Service Listing",
                      render: (_, r) => (
                        <div>
                          <strong>{r.service_title || `Service #${r.Service_id}`}</strong>
                          {r.service_type && <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.service_type}</div>}
                          <div style={{ fontSize: 10, color: "#64748b" }}>Listing #{r.Service_id}</div>
                        </div>
                      ),
                    },
                    {
                      title: "Amount",
                      render: (_, r) => (
                        <span style={{ fontSize: 15, fontWeight: 900, color: "#10b981" }}>
                          ₹{Number(r.Amount || 0).toLocaleString("en-IN")}
                        </span>
                      ),
                    },
                    {
                      title: "Status",
                      render: (_, r) => {
                        const s = r.Status || "Success";
                        return <Tag color={s === "Success" ? "success" : "gold"}>{s}</Tag>;
                      },
                    },
                    { title: "Date", dataIndex: "Create_date", render: (d) => d || "—" },
                  ]}
                />
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* HUB 4: PLATFORM MASTER - GEOGRAPHIES & PROXIMITY           */}
          {/* ========================================================== */}
          {activeTab === "master_geography" && (
            <div>
              <div className="ap-subnav-bar">
                <button
                  type="button"
                  className={`ap-subnav-pill ${locationSubTab === "states" ? "active" : ""}`}
                  onClick={() => setLocationSubTab("states")}
                >
                  <GlobalOutlined /> States &amp; Districts
                  <span className="ap-count-tag">{statesList.length}</span>
                </button>
                <button
                  type="button"
                  className={`ap-subnav-pill ${locationSubTab === "neardist" ? "active" : ""}`}
                  onClick={() => setLocationSubTab("neardist")}
                >
                  <ApartmentOutlined /> Nearby Districts Mapping
                  <span className="ap-count-tag">{nearDistList.length}</span>
                </button>
              </div>

              {locationSubTab === "states" && (
                <div className="ap-card">
                  <div className="ap-card-header">
                    <h3 className="ap-card-title"><GlobalOutlined className="ap-card-title-icon" /> States &amp; Districts Hierarchy</h3>
                    <Button
                      type="primary"
                      style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                      icon={<PlusOutlined />}
                      onClick={() => handleOpenStateModal()}
                    >
                      Add State
                    </Button>
                  </div>
                  <div className="ap-table-wrap">
                    <Table scroll={{ x: "max-content" }}
                      dataSource={statesList}
                      rowKey={(r) => r.id}
                      pagination={{ pageSize: 10 }}
                      columns={[
                        { title: "State Name", render: (_, r) => <strong>{r.State}</strong> },
                        {
                          title: "Configured Districts",
                          render: (_, r) => {
                            const dList = Array.isArray(r.Districts) ? r.Districts : [];
                            return (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 600 }}>
                                {dList.slice(0, 10).map((d, i) => (
                                  <Tag key={i}>{d}</Tag>
                                ))}
                                {dList.length > 10 && <Tag color="blue">+{dList.length - 10} more</Tag>}
                              </div>
                            );
                          },
                        },
                        {
                          title: "Status",
                          render: (_, r) => (
                            <Tag color={r.Active !== false ? "success" : "default"}>
                              {r.Active !== false ? "Active" : "Disabled"}
                            </Tag>
                          ),
                        },
                        {
                          title: "Actions",
                          render: (_, r) => (
                            <Space>
                              <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenStateModal(r)}>Edit</Button>
                              <Popconfirm title="Delete state?" onConfirm={() => handleDeleteState(r.id)}>
                                <Button size="small" danger icon={<DeleteOutlined />} />
                              </Popconfirm>
                            </Space>
                          ),
                        },
                      ]}
                    />
                  </div>
                </div>
              )}

              {locationSubTab === "neardist" && (
                <div className="ap-card">
                  <div className="ap-card-header">
                    <h3 className="ap-card-title"><ApartmentOutlined className="ap-card-title-icon" /> Regional Matchmaking Proximity Maps</h3>
                    <Button
                      type="primary"
                      style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                      icon={<PlusOutlined />}
                      onClick={() => handleOpenNearDistModal()}
                    >
                      Add District Proximity
                    </Button>
                  </div>
                  <div className="ap-table-wrap">
                    <Table scroll={{ x: "max-content" }}
                      dataSource={nearDistList}
                      rowKey={(r) => r.id}
                      pagination={{ pageSize: 10 }}
                      columns={[
                        { title: "State", dataIndex: "State", render: (s) => <strong>{s}</strong> },
                        { title: "Primary District", dataIndex: "District", render: (d) => <Tag color="gold">{d}</Tag> },
                        {
                          title: "Nearby Connected Districts",
                          render: (_, r) => {
                            const dList = Array.isArray(r.Neardist) ? r.Neardist : [];
                            return (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {dList.map((d, i) => (
                                  <Tag key={i} color="cyan">{d}</Tag>
                                ))}
                              </div>
                            );
                          },
                        },
                        {
                          title: "Actions",
                          render: (_, r) => (
                            <Space>
                              <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenNearDistModal(r)}>Edit</Button>
                              <Popconfirm title="Delete mapping?" onConfirm={() => handleDeleteNearDist(r.id)}>
                                <Button size="small" danger icon={<DeleteOutlined />} />
                              </Popconfirm>
                            </Space>
                          ),
                        },
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* HUB 4: PLATFORM MASTER - MATRIMONIAL CRITERIA               */}
          {/* ========================================================== */}
          {activeTab === "master_attributes" && (
            <div>
              <div className="ap-subnav-bar">
                <button
                  type="button"
                  className={`ap-subnav-pill ${attributeSubTab === "religion" ? "active" : ""}`}
                  onClick={() => setAttributeSubTab("religion")}
                >
                  🕉️ Religions <span className="ap-count-tag">{religions.length}</span>
                </button>
                <button
                  type="button"
                  className={`ap-subnav-pill ${attributeSubTab === "caste" ? "active" : ""}`}
                  onClick={() => setAttributeSubTab("caste")}
                >
                  🏷️ Castes &amp; Gotras <span className="ap-count-tag">{castes.length}</span>
                </button>
                <button
                  type="button"
                  className={`ap-subnav-pill ${attributeSubTab === "profession" ? "active" : ""}`}
                  onClick={() => setAttributeSubTab("profession")}
                >
                  💼 Professions <span className="ap-count-tag">{professions.length}</span>
                </button>
                <button
                  type="button"
                  className={`ap-subnav-pill ${attributeSubTab === "language" ? "active" : ""}`}
                  onClick={() => setAttributeSubTab("language")}
                >
                  🗣️ Languages <span className="ap-count-tag">{languages.length}</span>
                </button>
                <button
                  type="button"
                  className={`ap-subnav-pill ${attributeSubTab === "color" ? "active" : ""}`}
                  onClick={() => setAttributeSubTab("color")}
                >
                  🎨 Complexions <span className="ap-count-tag">{colors.length}</span>
                </button>
              </div>

              {attributeSubTab === "religion" && (
                <div className="ap-card">
                  <div className="ap-card-header">
                    <h3 className="ap-card-title">🕉️ Master Religions ({religions.length})</h3>
                    <Button
                      type="primary"
                      style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                      icon={<PlusOutlined />}
                      onClick={() => handleOpenAttrModal("religion")}
                    >
                      Add Religion
                    </Button>
                  </div>
                  <Table scroll={{ x: "max-content" }}
                    dataSource={religions}
                    rowKey={(r) => r.id}
                    pagination={false}
                    columns={[
                      { title: "Religion Name", dataIndex: "Religion_Name", render: (n) => <strong>{n}</strong> },
                      { title: "Status", render: (_, r) => <Tag color={r.Active !== false ? "success" : "default"}>{r.Active !== false ? "Active" : "Disabled"}</Tag> },
                      {
                        title: "Actions",
                        render: (_, r) => (
                          <Space>
                            <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenAttrModal("religion", r)}>Edit</Button>
                            <Popconfirm title="Delete religion?" onConfirm={() => handleDeleteAttribute("religion", r.id)}>
                              <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              )}

              {attributeSubTab === "caste" && (
                <div className="ap-card">
                  <div className="ap-card-header">
                    <h3 className="ap-card-title">🏷️ Master Castes &amp; Gotras ({castes.length})</h3>
                    <Button
                      type="primary"
                      style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                      icon={<PlusOutlined />}
                      onClick={() => handleOpenAttrModal("caste")}
                    >
                      Add Caste
                    </Button>
                  </div>
                  <Table scroll={{ x: "max-content" }}
                    dataSource={castes}
                    rowKey={(r) => r.id}
                    pagination={{ pageSize: 12 }}
                    columns={[
                      { title: "Religion", dataIndex: "Religion", render: (r) => <Tag color="blue">{r || "—"}</Tag> },
                      { title: "State", dataIndex: "State", render: (s) => <Tag color="gold">{s || "All"}</Tag> },
                      {
                        title: "Castes / Sub-castes",
                        render: (_, r) => {
                          const cList = Array.isArray(r.Caste_Name) ? r.Caste_Name : [r.Caste_Name];
                          return cList.map((c, i) => <Tag key={i}>{c}</Tag>);
                        },
                      },
                      {
                        title: "Actions",
                        render: (_, r) => (
                          <Space>
                            <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenAttrModal("caste", r)}>Edit</Button>
                            <Popconfirm title="Delete caste entry?" onConfirm={() => handleDeleteAttribute("caste", r.id)}>
                              <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              )}

              {attributeSubTab === "profession" && (
                <div className="ap-card">
                  <div className="ap-card-header">
                    <h3 className="ap-card-title">💼 Master Professions ({professions.length})</h3>
                    <Button
                      type="primary"
                      style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                      icon={<PlusOutlined />}
                      onClick={() => handleOpenAttrModal("profession")}
                    >
                      Add Profession
                    </Button>
                  </div>
                  <Table scroll={{ x: "max-content" }}
                    dataSource={professions}
                    rowKey={(r) => r.id}
                    pagination={{ pageSize: 12 }}
                    columns={[
                      { title: "Profession", dataIndex: "Profession_Name", render: (p) => <strong>{p}</strong> },
                      { title: "Status", render: (_, r) => <Tag color={r.Active !== false ? "success" : "default"}>{r.Active !== false ? "Active" : "Disabled"}</Tag> },
                      {
                        title: "Actions",
                        render: (_, r) => (
                          <Space>
                            <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenAttrModal("profession", r)}>Edit</Button>
                            <Popconfirm title="Delete profession?" onConfirm={() => handleDeleteAttribute("profession", r.id)}>
                              <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              )}

              {attributeSubTab === "language" && (
                <div className="ap-card">
                  <div className="ap-card-header">
                    <h3 className="ap-card-title">🗣️ Master Languages &amp; Mother Tongues ({languages.length})</h3>
                    <Button
                      type="primary"
                      style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                      icon={<PlusOutlined />}
                      onClick={() => handleOpenAttrModal("language")}
                    >
                      Add Language
                    </Button>
                  </div>
                  <Table scroll={{ x: "max-content" }}
                    dataSource={languages}
                    rowKey={(r) => r.id}
                    pagination={{ pageSize: 12 }}
                    columns={[
                      { title: "Language", dataIndex: "Language", render: (l) => <strong>{l}</strong> },
                      { title: "State Region", dataIndex: "State", render: (s) => <Tag color="cyan">{s || "All"}</Tag> },
                      {
                        title: "Actions",
                        render: (_, r) => (
                          <Space>
                            <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenAttrModal("language", r)}>Edit</Button>
                            <Popconfirm title="Delete language?" onConfirm={() => handleDeleteAttribute("language", r.id)}>
                              <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              )}

              {attributeSubTab === "color" && (
                <div className="ap-card">
                  <div className="ap-card-header">
                    <h3 className="ap-card-title">🎨 Complexions / Colors ({colors.length})</h3>
                    <Button
                      type="primary"
                      style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                      icon={<PlusOutlined />}
                      onClick={() => handleOpenAttrModal("color")}
                    >
                      Add Complexion
                    </Button>
                  </div>
                  <Table scroll={{ x: "max-content" }}
                    dataSource={colors}
                    rowKey={(r) => r.id}
                    pagination={false}
                    columns={[
                      { title: "Complexion Value", dataIndex: "Color", render: (c) => <strong>{c}</strong> },
                      {
                        title: "Actions",
                        render: (_, r) => (
                          <Space>
                            <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenAttrModal("color", r)}>Edit</Button>
                            <Popconfirm title="Delete complexion option?" onConfirm={() => handleDeleteAttribute("color", r.id)}>
                              <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* HUB 4: PLATFORM MASTER - HELPDESK & INQUIRIES              */}
          {/* ========================================================== */}
          {activeTab === "master_help" && (
            <div className="ap-card">
              <div className="ap-card-header" style={{ flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 className="ap-card-title">
                    <CustomerServiceOutlined className="ap-card-title-icon" /> Member, Staff &amp; Vendor Support Inquiries ({helpTickets.length})
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#94a3b8" }}>
                    Review, filter, answer and manage support tickets routed to Central Administration or assigned Marriage Counselors.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Tag color="geekblue" style={{ fontWeight: 700, padding: "4px 10px" }}>
                    👑 Admin Assigned: {helpTickets.filter((t) => !(String(t.Role || t.target || "").toLowerCase() === "staff" || Boolean(t.Target_User_id))).length}
                  </Tag>
                  <Tag color="purple" style={{ fontWeight: 700, padding: "4px 10px" }}>
                    👤 Staff Assigned: {helpTickets.filter((t) => String(t.Role || t.target || "").toLowerCase() === "staff" || Boolean(t.Target_User_id)).length}
                  </Tag>
                  <Tag color="warning" style={{ fontWeight: 700, padding: "4px 10px" }}>
                    ⏳ Pending: {unansweredHelpCount}
                  </Tag>
                </div>
              </div>

              {/* Dedicated Helpdesk Filter Suite */}
              <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: 12, margin: "0 16px 16px", border: "1px solid #e2e8f0" }}>
                <Row gutter={[12, 12]} align="middle">
                  <Col xs={24} sm={12} md={7}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>Search Inquiries</label>
                    <Input
                      placeholder="Search question, inquirer name, or ticket ID..."
                      value={helpSearch}
                      onChange={(e) => setHelpSearch(e.target.value)}
                      allowClear
                      style={{ borderRadius: 8 }}
                    />
                  </Col>
                  <Col xs={12} sm={6} md={5}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>Assignment Target</label>
                    <Select value={helpAssigneeFilter} onChange={setHelpAssigneeFilter} style={{ width: "100%" }}>
                      <Option value="all">All Targets ({helpTickets.length})</Option>
                      <Option value="admin">👑 Assign to Admin Only</Option>
                      <Option value="staff">👤 Assign to Staff Only</Option>
                    </Select>
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>Reply Status</label>
                    <Select value={helpStatusFilter} onChange={setHelpStatusFilter} style={{ width: "100%" }}>
                      <Option value="all">All Status</Option>
                      <Option value="pending">⏳ Pending Reply ({unansweredHelpCount})</Option>
                      <Option value="answered">✅ Answered ({helpTickets.length - unansweredHelpCount})</Option>
                    </Select>
                  </Col>
                  <Col xs={12} sm={6} md={5}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>Inquirer Source</label>
                    <Select value={helpSenderFilter} onChange={setHelpSenderFilter} style={{ width: "100%" }}>
                      <Option value="all">All Senders</Option>
                      <Option value="user">Candidates / Members</Option>
                      <Option value="staff">Staff Counselors</Option>
                      <Option value="service">Service Partners</Option>
                    </Select>
                  </Col>
                  <Col xs={12} sm={6} md={3} style={{ display: "flex", alignItems: "flex-end" }}>
                    <Button
                      style={{ width: "100%", borderRadius: 8, marginTop: 18 }}
                      onClick={() => {
                        setHelpSearch("");
                        setHelpAssigneeFilter("all");
                        setHelpStatusFilter("all");
                        setHelpSenderFilter("all");
                      }}
                    >
                      Reset
                    </Button>
                  </Col>
                </Row>
              </div>

              <div className="ap-table-wrap">
                <Table scroll={{ x: "max-content" }}
                  dataSource={filteredHelpTickets}
                  rowKey={(r) => r.id}
                  pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ["10", "20", "50"] }}
                  columns={[
                    {
                      title: "Ticket & Inquirer",
                      render: (_, r) => {
                        const inq = getInquirerInfo(r);
                        return (
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <strong style={{ color: "var(--ap-text-main, #ffffff)", fontSize: 13.5 }}>{inq.name}</strong>
                              <Tag color={inq.roleType === "Staff Counselor" ? "cyan" : inq.roleType === "Service Partner" ? "orange" : "blue"} style={{ fontSize: 10, padding: "0 6px" }}>
                                {inq.roleType}
                              </Tag>
                              {inq.serviceName && (
                                <Tag color="volcano" style={{ fontSize: 10, padding: "0 6px" }}>
                                  {inq.serviceName}
                                </Tag>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                              Ticket #{r.id} {inq.phone ? `• 📞 ${inq.phone}` : ""}
                            </div>
                            <div style={{ fontSize: 10.5, color: "#64748b" }}>
                              {r.created_date || r.Create_date ? new Date(r.created_date || r.Create_date).toLocaleString() : ""}
                            </div>
                          </div>
                        );
                      },
                    },
                    {
                      title: "Assigned Recipient",
                      render: (_, r) => {
                        const isStaff = isStaffAssignee(r);
                        return (
                          <Tag color={isStaff ? "purple" : "geekblue"} style={{ fontWeight: 800, padding: "3px 10px", fontSize: 12 }}>
                            {getTargetAssigneeName(r)}
                          </Tag>
                        );
                      },
                    },
                    {
                      title: "Question / Inquiry",
                      dataIndex: "Question",
                      render: (q) => <div style={{ maxWidth: 320, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.4 }}>{q}</div>,
                    },
                    {
                      title: "Status & Response",
                      render: (_, r) => {
                        const answered = Boolean(r.Answer && r.Answer.trim());
                        const replier = getReplierName(r);
                        return answered ? (
                          <div>
                            <Tag color="success" style={{ fontWeight: 700 }}>Answered ✅</Tag>
                            <div style={{ fontSize: 12, color: "#10b981", marginTop: 4, maxHeight: 60, overflowY: "auto" }}>
                              {r.Answer}
                            </div>
                            <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>
                              Replied by: <strong>{replier}</strong>
                            </div>
                          </div>
                        ) : (
                          <Tag color="error" style={{ fontWeight: 700 }}>Pending Reply ⏳</Tag>
                        );
                      },
                    },
                    {
                      title: "Action",
                      render: (_, r) => (
                        <Space>
                          <Button
                            size="small"
                            icon={<EyeOutlined />}
                            style={{ background: "#0284c7", borderColor: "#0284c7", color: "var(--ap-text-main, #ffffff)", fontWeight: 700 }}
                            onClick={() => handleOpenTicketDetails(r)}
                          >
                            Details
                          </Button>
                          <Button
                            size="small"
                            type="primary"
                            style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                            onClick={() => {
                              setReplyTicketModal(r);
                              setTicketAnswer(r.Answer || "");
                            }}
                          >
                            {r.Answer ? "Edit Answer" : "Reply Ticket"}
                          </Button>
                          <Popconfirm
                            title="Delete this support inquiry permanently?"
                            onConfirm={() => handleDeleteTicket(r.id)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <Button size="small" danger icon={<DeleteOutlined />} title="Delete Ticket" />
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* HUB 4: PLATFORM MASTER - SUCCESS STORIES                   */}
          {/* ========================================================== */}
          {activeTab === "master_stories" && (
            <div className="ap-card">
              <div className="ap-card-header">
                <h3 className="ap-card-title"><SmileOutlined className="ap-card-title-icon" /> Wedding Success Stories ({successStories.length})</h3>
                <Button
                  type="primary"
                  style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenStoryModal()}
                >
                  Publish Story
                </Button>
              </div>
              <div className="ap-table-wrap">
                <Table scroll={{ x: "max-content" }}
                  dataSource={successStories}
                  rowKey={(r) => r.Success_id || r.id}
                  pagination={{ pageSize: 8 }}
                  columns={[
                    {
                      title: "Couple",
                      render: (_, r) => (
                        <div>
                          <strong>{r.Male_Name || "Groom"} &amp; {r.Female_Name || "Bride"}</strong>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.City || "India"}</div>
                        </div>
                      ),
                    },
                    {
                      title: "Testimonial",
                      dataIndex: "Success_Story_Text",
                      render: (t) => <div style={{ maxWidth: 450, fontSize: 12 }}>{t}</div>,
                    },
                    {
                      title: "Homepage Visibility",
                      render: (_, r) => (
                        <Tag color={r.Active !== false ? "success" : "default"}>
                          {r.Active !== false ? "Visible" : "Hidden"}
                        </Tag>
                      ),
                    },
                    {
                      title: "Actions",
                      render: (_, r) => (
                        <Space>
                          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenStoryModal(r)}>Edit</Button>
                          <Popconfirm title="Delete story?" onConfirm={() => handleDeleteStory(r.Success_id || r.id)}>
                            <Button size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* HUB 4: PLATFORM MASTER - ACCOUNTS & SECURITY               */}
          {/* ========================================================== */}
          {activeTab === "master_security" && (
            <div>
              <div className="ap-subnav-bar">
                <button
                  type="button"
                  className={`ap-subnav-pill ${systemSubTab === "users" ? "active" : ""}`}
                  onClick={() => setSystemSubTab("users")}
                >
                  <UserOutlined /> All User Accounts
                  <span className="ap-count-tag">{usersList.length}</span>
                </button>
                <button
                  type="button"
                  className={`ap-subnav-pill ${systemSubTab === "otp" ? "active" : ""}`}
                  onClick={() => setSystemSubTab("otp")}
                >
                  <PhoneOutlined /> Phone OTP Security Logs
                  <span className="ap-count-tag">{phoneOtps.length}</span>
                </button>
              </div>

              {systemSubTab === "users" && (
                <div className="ap-card">
                  <div className="ap-card-header">
                    <h3 className="ap-card-title"><UserOutlined className="ap-card-title-icon" /> Platform User Accounts &amp; Access Controls ({usersList.length})</h3>
                    <Select value={userRoleFilter} onChange={setUserRoleFilter} style={{ width: 160 }}>
                      <Option value="all">All Roles</Option>
                      <Option value="user">User (Candidate)</Option>
                      <Option value="staff">Staff Counselor</Option>
                      <Option value="service">Wedding Service</Option>
                      <Option value="admin">Administrator</Option>
                    </Select>
                  </div>
                  <div className="ap-table-wrap">
                    <Table scroll={{ x: "max-content" }}
                      dataSource={usersList.filter((u) => userRoleFilter === "all" || (u.Role || "user").toLowerCase() === userRoleFilter)}
                      rowKey={(r) => r.id}
                      pagination={{ pageSize: 10 }}
                      columns={[
                        {
                          title: "Account Username",
                          render: (_, r) => (
                            <div>
                              <strong>{r.username}</strong>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>ID: {r.id}</div>
                            </div>
                          ),
                        },
                        { title: "Phone / Contact", dataIndex: "Contact", render: (c) => c || "—" },
                        {
                          title: "Role & Permission",
                          render: (_, r) => (
                            <Select
                              size="small"
                              value={(r.Role || "user").toLowerCase()}
                              onChange={(newRole) => handleChangeUserRole(r.id, newRole)}
                              style={{ width: 130 }}
                            >
                              <Option value="user">User (Candidate)</Option>
                              <Option value="staff">Staff Counselor</Option>
                              <Option value="service">Service Partner</Option>
                              <Option value="admin">Administrator</Option>
                              <Option value="superadmin">SuperAdmin</Option>
                            </Select>
                          ),
                        },
                        { title: "Referral Code", render: (_, r) => <Tag color="orange">{r.Reference_Code || "—"}</Tag> },
                        { title: "Referred By", render: (_, r) => r.Refered_By || "Direct / Admin" },
                        {
                          title: "Account Active",
                          render: (_, r) => (
                            <Switch checked={r.is_active !== false} onChange={() => handleToggleUserActive(r)} />
                          ),
                        },
                        {
                          title: "Actions",
                          render: (_, r) => (
                            <Popconfirm title="Delete this user account?" onConfirm={() => handleDeleteUserAccount(r.id)}>
                              <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          ),
                        },
                      ]}
                    />
                  </div>
                </div>
              )}

              {systemSubTab === "otp" && (
                <div className="ap-card">
                  <div className="ap-card-header">
                    <h3 className="ap-card-title"><PhoneOutlined className="ap-card-title-icon" /> Phone OTP Authentication Logs ({phoneOtps.length})</h3>
                  </div>
                  <div className="ap-table-wrap">
                    <Table scroll={{ x: "max-content" }}
                      dataSource={phoneOtps}
                      rowKey={(r) => r.id}
                      pagination={{ pageSize: 10 }}
                      columns={[
                        { title: "Mobile Number", dataIndex: "phone", render: (p) => <strong>{p}</strong> },
                        { title: "OTP Code", dataIndex: "otp", render: (c) => <Tag color="cyan" style={{ fontSize: 14, fontWeight: 900 }}>{c}</Tag> },
                        { title: "Created At", dataIndex: "created_at", render: (d) => d || "—" },
                        {
                          title: "Action",
                          render: (_, r) => (
                            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeletePhoneOtp(r.id)}>
                              Clear
                            </Button>
                          ),
                        },
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* PLATFORM FINANCIAL TREASURY, REVENUE & PAYOUTS HUB         */}
          {/* ========================================================== */}
          {activeTab === "platform_finance" && (
            <div className="ap-card ap-treasury-card">
              <div className="ap-card-header">
                <div>
                  <h3 className="ap-card-title">
                    <DollarCircleOutlined className="ap-card-title-icon" style={{ color: "#10b981" }} />
                    Platform Financial Treasury, Monthly Ledger &amp; Payouts Hub
                  </h3>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                    Comprehensive reconciled audit statement: Candidate subscriptions, wedding service vendor fees, counselor payouts &amp; net platform retained treasury funds.
                  </div>
                </div>
                <Space wrap>
                  <Button
                    icon={<ReloadOutlined />}
                    loading={refreshLoading}
                    onClick={fetchAllData}
                    style={{ fontWeight: 600 }}
                  >
                    Sync Live Balances
                  </Button>
                </Space>
              </div>

              {/* 6 Treasury Stat KPI Cards */}
              <div className="ap-treasury-stats-grid">
                <div
                  className="ap-treasury-stat-box clickable-box"
                  role="button"
                  tabIndex={0}
                  onClick={() => switchTab("user_invoices")}
                  title="Click to view all Candidate Recharges"
                >
                  <span className="lbl">👤 User Subscriptions</span>
                  <span className="val" style={{ color: "#38bdf8" }}>
                    ₹{filteredFinancialTotals.userRevenue.toLocaleString("en-IN")}
                  </span>
                  <span className="sub">{filteredFinancialTotals.userCount} candidate recharges</span>
                  <span className="action-hint">View Invoices &rarr;</span>
                </div>

                <div
                  className="ap-treasury-stat-box clickable-box"
                  role="button"
                  tabIndex={0}
                  onClick={() => switchTab("service_transactions")}
                  title="Click to view all Wedding Vendor Listing Fees"
                >
                  <span className="lbl">🏪 Wedding Services</span>
                  <span className="val" style={{ color: "#a855f7" }}>
                    ₹{filteredFinancialTotals.serviceRevenue.toLocaleString("en-IN")}
                  </span>
                  <span className="sub">{filteredFinancialTotals.serviceCount} vendor listings</span>
                  <span className="action-hint">View Fees &rarr;</span>
                </div>

                <div className="ap-treasury-stat-box">
                  <span className="lbl">💳 Gross Platform Inflow</span>
                  <span className="val" style={{ color: "#f59e0b" }}>
                    ₹{filteredFinancialTotals.grossRevenue.toLocaleString("en-IN")}
                  </span>
                  <span className="sub">{filteredFinancialTotals.totalTxnCount} total paid collections</span>
                  <span className="sub" style={{ fontSize: 10, color: "#64748b" }}>User + Service Inflow</span>
                </div>

                <div
                  className="ap-treasury-stat-box clickable-box"
                  role="button"
                  tabIndex={0}
                  onClick={() => switchTab("staff_withdrawals")}
                  title="Click to view Staff Counselor Payouts"
                >
                  <span className="lbl">💸 Staff Withdrawals Paid</span>
                  <span className="val" style={{ color: "#f43f5e" }}>
                    ₹{filteredFinancialTotals.staffPaid.toLocaleString("en-IN")}
                  </span>
                  <span className="sub">{filteredFinancialTotals.staffPaidCount} payouts settled</span>
                  <span className="action-hint">Manage Payouts &rarr;</span>
                </div>

                <div
                  className="ap-treasury-stat-box clickable-box"
                  role="button"
                  tabIndex={0}
                  onClick={() => switchTab("staff_withdrawals")}
                  title="Click to review Pending Counselor Payouts"
                >
                  <span className="lbl">⏳ Pending Staff Payouts</span>
                  <span className="val" style={{ color: filteredFinancialTotals.staffPending > 0 ? "#eab308" : "#94a3b8" }}>
                    ₹{filteredFinancialTotals.staffPending.toLocaleString("en-IN")}
                  </span>
                  <span className="sub">{filteredFinancialTotals.staffPendingCount} requests in review</span>
                  {filteredFinancialTotals.staffPendingCount > 0 ? (
                    <span className="action-hint" style={{ color: "#eab308" }}>Settle Requests &rarr;</span>
                  ) : (
                    <span className="sub" style={{ fontSize: 10, color: "#10b981" }}>All Settled</span>
                  )}
                </div>

                <div className="ap-treasury-stat-box highlight-net">
                  <span className="lbl" style={{ color: "#34d399" }}>💰 Net Remaining Funds</span>
                  <span className="val" style={{ color: filteredFinancialTotals.netRemain >= 0 ? "#10b981" : "#ef4444" }}>
                    {filteredFinancialTotals.netRemain >= 0 ? "+" : ""}₹{filteredFinancialTotals.netRemain.toLocaleString("en-IN")}
                  </span>
                  <span className="sub" style={{ color: "#6ee7b7", fontWeight: 700 }}>
                    {filteredFinancialTotals.marginPercent}% Net Profit Retained
                  </span>
                  <span className="sub" style={{ fontSize: 10, color: "#94a3b8" }}>After Staff Counselor Payouts</span>
                </div>
              </div>

              {/* Monthly Filter Toolbar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <Space wrap>
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>SELECT YEAR:</span>
                  <Select
                    value={financialYearFilter}
                    onChange={setFinancialYearFilter}
                    style={{ width: 140 }}
                  >
                    <Select.Option value="all">All Recorded Years</Select.Option>
                    {availableFinancialYears.map((yr) => (
                      <Select.Option key={yr} value={yr}>Year {yr}</Select.Option>
                    ))}
                  </Select>

                  <Input
                    placeholder="Search by month or period..."
                    prefix={<SearchOutlined />}
                    value={financialSearch}
                    onChange={(e) => setFinancialSearch(e.target.value)}
                    allowClear
                    style={{ width: 220 }}
                  />
                  {(financialYearFilter !== "all" || financialSearch) && (
                    <Button
                      size="small"
                      onClick={() => {
                        setFinancialYearFilter("all");
                        setFinancialSearch("");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </Space>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  Reconciled Across <strong>{filteredMonthlyFinancials.length}</strong> Months • Showing Live Cashflow
                </div>
              </div>

              {/* Monthly Financial Table */}
              <div className="ap-table-wrap">
                <Table
                  dataSource={filteredMonthlyFinancials}
                  rowKey="monthKey"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1000 }}
                  columns={[
                    {
                      title: "Billing Period",
                      render: (_, m) => (
                        <div>
                          <div style={{ fontWeight: 800, color: "var(--ap-text-main, #ffffff)", fontSize: 14 }}>{m.monthLabel}</div>
                          <Tag color="geekblue" style={{ fontSize: 10, margin: "2px 0 0 0" }}>{m.monthKey}</Tag>
                        </div>
                      ),
                    },
                    {
                      title: "Candidate (User) Revenue",
                      render: (_, m) => (
                        <div>
                          <div style={{ fontWeight: 800, color: "#38bdf8", fontSize: 14 }}>
                            ₹{m.userRevenue.toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>
                            {m.userCount} candidate recharge{m.userCount === 1 ? "" : "s"}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Wedding Service Revenue",
                      render: (_, m) => (
                        <div>
                          <div style={{ fontWeight: 800, color: "#a855f7", fontSize: 14 }}>
                            ₹{m.serviceRevenue.toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>
                            {m.serviceCount} vendor listing{m.serviceCount === 1 ? "" : "s"}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Gross Platform Inflow",
                      render: (_, m) => (
                        <div>
                          <div style={{ fontWeight: 800, color: "#f59e0b", fontSize: 14 }}>
                            ₹{m.grossRevenue.toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>
                            {m.totalTxnCount} total collection{m.totalTxnCount === 1 ? "" : "s"}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Staff Withdrawals Paid",
                      render: (_, m) => (
                        <div>
                          <div style={{ fontWeight: 800, color: m.staffPaid > 0 ? "#f43f5e" : "#64748b", fontSize: 14 }}>
                            {m.staffPaid > 0 ? "-" : ""}₹{m.staffPaid.toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>
                            {m.staffPaidCount} payout{m.staffPaidCount === 1 ? "" : "s"} settled
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Pending Counselor Queue",
                      render: (_, m) => (
                        <div>
                          <div style={{ fontWeight: 700, color: m.staffPending > 0 ? "#eab308" : "#64748b", fontSize: 13 }}>
                            ₹{m.staffPending.toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>
                            {m.staffPendingCount} in review
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Net Remaining Funds",
                      render: (_, m) => {
                        const isPos = m.netRemain >= 0;
                        return (
                          <div>
                            <div style={{ fontWeight: 900, color: isPos ? "#10b981" : "#ef4444", fontSize: 15 }}>
                              {isPos ? "+" : ""}₹{m.netRemain.toLocaleString("en-IN")}
                            </div>
                            <div style={{ marginTop: 2 }}>
                              <Tag color={isPos ? "success" : "error"} style={{ fontSize: 10, margin: 0 }}>
                                {m.marginPercent}% Retained
                              </Tag>
                            </div>
                          </div>
                        );
                      },
                    },
                    {
                      title: "Audit Details",
                      render: (_, m) => (
                        <Button
                          size="small"
                          type="primary"
                          icon={<EyeOutlined />}
                          style={{ background: "#334155", borderColor: "#475569", fontWeight: 700 }}
                          onClick={() => setFinancialMonthModal(m)}
                        >
                          Inspect Details
                        </Button>
                      ),
                    },
                  ]}
                  summary={() => (
                    <Table.Summary fixed>
                      <Table.Summary.Row style={{ background: "#f1f5f9", fontWeight: 800 }}>
                        <Table.Summary.Cell index={0}>
                          <strong style={{ color: "#2563eb" }}>TOTAL ({filteredMonthlyFinancials.length} Months)</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          <span style={{ color: "#38bdf8", fontSize: 14 }}>
                            ₹{filteredFinancialTotals.userRevenue.toLocaleString("en-IN")}
                          </span>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>
                            ({filteredFinancialTotals.userCount} recharges)
                          </div>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2}>
                          <span style={{ color: "#a855f7", fontSize: 14 }}>
                            ₹{filteredFinancialTotals.serviceRevenue.toLocaleString("en-IN")}
                          </span>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>
                            ({filteredFinancialTotals.serviceCount} listings)
                          </div>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3}>
                          <span style={{ color: "#f59e0b", fontSize: 14 }}>
                            ₹{filteredFinancialTotals.grossRevenue.toLocaleString("en-IN")}
                          </span>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>
                            ({filteredFinancialTotals.totalTxnCount} txns)
                          </div>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>
                          <span style={{ color: "#f43f5e", fontSize: 14 }}>
                            -₹{filteredFinancialTotals.staffPaid.toLocaleString("en-IN")}
                          </span>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>
                            ({filteredFinancialTotals.staffPaidCount} payouts)
                          </div>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5}>
                          <span style={{ color: "#eab308", fontSize: 13 }}>
                            ₹{filteredFinancialTotals.staffPending.toLocaleString("en-IN")}
                          </span>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>
                            ({filteredFinancialTotals.staffPendingCount} pending)
                          </div>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={6}>
                          <span style={{ color: filteredFinancialTotals.netRemain >= 0 ? "#10b981" : "#ef4444", fontSize: 15 }}>
                            {filteredFinancialTotals.netRemain >= 0 ? "+" : ""}₹{filteredFinancialTotals.netRemain.toLocaleString("en-IN")}
                          </span>
                          <div style={{ fontSize: 10, color: "#10b981" }}>
                            ({filteredFinancialTotals.marginPercent}% Retained Margin)
                          </div>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={7}>
                          <span style={{ color: "#64748b" }}>—</span>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* UNIVERSAL MODEL & FIELD EXPLORER STUDIO VIEW               */}
          {/* ========================================================== */}
          {activeTab === "model_explorer" && (() => {
            const curModel = allModelsMeta.find((m) => m.key === selectedExplorerModel) || allModelsMeta[0];
            const modelRecords = curModel?.data || [];
            const searchLower = (explorerSearch || "").toLowerCase().trim();

            const filteredData = searchLower
              ? modelRecords.filter((rec) => {
                  return Object.values(rec || {}).some((v) => {
                    if (v === null || v === undefined) return false;
                    return String(v).toLowerCase().includes(searchLower);
                  });
                })
              : modelRecords;

            // Generate dynamic primary columns for this model
            const dynamicCols = (curModel.primaryCols || []).map((colKey) => ({
              title: colKey,
              dataIndex: colKey,
              key: colKey,
              render: (val) => {
                if (val === null || val === undefined || val === "") return <span style={{ color: "#64748b" }}>—</span>;
                if (typeof val === "boolean") {
                  return <Tag color={val ? "success" : "default"}>{val ? "True" : "False"}</Tag>;
                }
                const lk = colKey.toLowerCase();
                if (typeof val === "string" && (lk.includes("pic") || lk.includes("image") || lk.includes("passbook") || lk.includes("picture"))) {
                  const imgUrl = getMediaUrl(val);
                  return (
                    <Image
                      src={imgUrl}
                      width={38}
                      height={38}
                      style={{ objectFit: "cover", borderRadius: 6 }}
                      fallback="https://placehold.co/50x50?text=No+Img"
                    />
                  );
                }
                if (["amount", "salary", "service_price", "discount_amount"].includes(lk)) {
                  return <strong style={{ color: "#10b981" }}>₹{Number(val).toLocaleString("en-IN")}</strong>;
                }
                if (lk.includes("date") || lk === "created_at" || lk === "valid_upto") {
                  return <span style={{ fontSize: 11, color: "#94a3b8" }}>{String(val).slice(0, 19).replace("T", " ")}</span>;
                }
                if (typeof val === "string" && val.length > 40) {
                  return <span title={val}>{val.slice(0, 40)}…</span>;
                }
                return String(val);
              },
            }));

            // Actions column
            const actionsCol = {
              title: "Field Access & Actions",
              key: "_model_actions",
              fixed: "right",
              width: 220,
              render: (_, record) => (
                <Space size={6} wrap>
                  <Button
                    size="small"
                    type="primary"
                    icon={<EyeOutlined />}
                    style={{ background: "#6366f1", borderColor: "#6366f1", fontWeight: 700, fontSize: 11 }}
                    onClick={() => handleInspectRecord(curModel.key, record)}
                  >
                    Inspect All Fields ({curModel.fields.length})
                  </Button>
                  {curModel.onEdit && (
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => curModel.onEdit(record)}
                      style={{ fontSize: 11 }}
                    >
                      Edit
                    </Button>
                  )}
                  {curModel.onInspect && curModel.key !== "Plans" && curModel.key !== "User_Transactions" && (
                    <Button
                      size="small"
                      style={{ fontSize: 11, background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)", color: "#f59e0b" }}
                      onClick={() => curModel.onInspect(record)}
                    >
                      Special View
                    </Button>
                  )}
                </Space>
              ),
            };

            const allCols = [...dynamicCols, actionsCol];

            const handleExportJson = () => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredData, null, 2));
              const downloadAnchor = document.createElement("a");
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `${curModel.key}_export.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
              message.success(`Exported ${filteredData.length} ${curModel.key} records to JSON! 💾`);
            };

            return (
              <div className="ap-model-explorer-view">
                {/* 1. Control Toolbar */}
                <div className="ap-card" style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", flex: 1 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Select Model:
                      </span>
                      <Select
                        value={selectedExplorerModel}
                        onChange={(val) => {
                          setSelectedExplorerModel(val);
                          setExplorerSearch("");
                        }}
                        style={{ minWidth: 260 }}
                        size="middle"
                      >
                        {allModelsMeta.map((m) => (
                          <Option key={m.key} value={m.key}>
                            {m.key} ({m.data?.length || 0} records • {m.fields.length} fields)
                          </Option>
                        ))}
                      </Select>

                      <Input
                        prefix={<SearchOutlined style={{ color: "#64748b" }} />}
                        placeholder={`Search all fields in ${curModel.key}...`}
                        value={explorerSearch}
                        onChange={(e) => setExplorerSearch(e.target.value)}
                        allowClear
                        style={{ minWidth: 240, maxWidth: 360 }}
                      />
                    </div>

                    <Space>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={handleExportJson}
                        style={{ fontWeight: 600 }}
                      >
                        Export JSON ({filteredData.length})
                      </Button>
                      <Button
                        icon={<ReloadOutlined />}
                        loading={refreshLoading}
                        onClick={fetchAllData}
                        style={{ fontWeight: 600 }}
                      >
                        Refresh All Models
                      </Button>
                    </Space>
                  </div>
                </div>

                {/* 2. Model Schema Definition & Fields Cloud */}
                <div className="ap-card" style={{ marginBottom: 16, background: "#ffffff", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Tag color="purple" style={{ fontWeight: 800, fontSize: 12, padding: "2px 8px" }}>{curModel.category}</Tag>
                      <strong style={{ fontSize: 15, color: "var(--ap-text-main, #ffffff)" }}>{curModel.name}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
                      Showing <strong style={{ color: "#38bdf8" }}>{filteredData.length}</strong> of <strong>{modelRecords.length}</strong> records • <strong style={{ color: "#34d399" }}>100% Access to All {curModel.fields.length} Schema Fields</strong>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>
                    Schema Fields in this Model ({curModel.fields.length} fields):
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {curModel.fields.map((fName) => (
                      <Tag
                        key={fName}
                        style={{
                          margin: 0,
                          fontSize: 11,
                          padding: "2px 8px",
                          background: (curModel.primaryCols || []).includes(fName) ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.04)",
                          borderColor: (curModel.primaryCols || []).includes(fName) ? "rgba(99, 102, 241, 0.5)" : "rgba(255, 255, 255, 0.1)",
                          color: (curModel.primaryCols || []).includes(fName) ? "#a5b4fc" : "#cbd5e1",
                          borderRadius: 4,
                          cursor: "default",
                        }}
                      >
                        {(curModel.primaryCols || []).includes(fName) ? "★ " : ""}{fName}
                      </Tag>
                    ))}
                  </div>
                </div>

                {/* 3. Live Data Table */}
                <div className="ap-card">
                  <div className="ap-card-header">
                    <h3 className="ap-card-title">
                      <DatabaseOutlined className="ap-card-title-icon" style={{ color: "#6366f1" }} />
                      {curModel.key} Records ({filteredData.length})
                    </h3>
                    {searchLower && (
                      <Tag color="blue">
                        Filtered by "{explorerSearch}"
                      </Tag>
                    )}
                  </div>
                  <div className="ap-table-wrap">
                    <Table
                      dataSource={filteredData}
                      rowKey={(r, idx) => r.id || r.Success_id || idx}
                      columns={allCols}
                      pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ["10", "20", "50", "100"] }}
                      scroll={{ x: "max-content" }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </main>

      {/* ============================================================== */}
      {/* MONTHLY FINANCIAL AUDIT & TRANSACTION BREAKDOWN MODAL         */}
      {/* ============================================================== */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 24 }}>
            <div>
              <span style={{ fontSize: 18, fontWeight: 900, color: "var(--ap-text-main, #ffffff)" }}>
                💰 Monthly Financial Statement — {financialMonthModal?.monthLabel}
              </span>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                Reconciled audit report of all candidate subscriptions, wedding vendor listings, and counselor payouts.
              </div>
            </div>
            {financialMonthModal && (
              <Tag color="geekblue" style={{ fontSize: 12, padding: "4px 8px" }}>
                Period: {financialMonthModal.monthKey}
              </Tag>
            )}
          </div>
        }
        open={Boolean(financialMonthModal)}
        onCancel={() => setFinancialMonthModal(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setFinancialMonthModal(null)}>
            Close Statement
          </Button>,
        ]}
        width={950}
        styles={{
          body: { background: "#ffffff", padding: "20px 24px" },
          header: { background: "#ffffff", borderBottom: "1px solid #e2e8f0" },
        }}
      >
        {financialMonthModal && (
          <div>
            {/* Quick KPI Strip for this month */}
            <div className="ap-treasury-stats-grid" style={{ marginBottom: 20 }}>
              <div className="ap-treasury-stat-box">
                <span className="lbl">👤 User Revenue</span>
                <span className="val" style={{ color: "#38bdf8" }}>
                  ₹{financialMonthModal.userRevenue.toLocaleString("en-IN")}
                </span>
                <span className="sub">{financialMonthModal.userCount} candidate recharge{financialMonthModal.userCount === 1 ? "" : "s"}</span>
              </div>
              <div className="ap-treasury-stat-box">
                <span className="lbl">🏪 Service Revenue</span>
                <span className="val" style={{ color: "#a855f7" }}>
                  ₹{financialMonthModal.serviceRevenue.toLocaleString("en-IN")}
                </span>
                <span className="sub">{financialMonthModal.serviceCount} vendor listing{financialMonthModal.serviceCount === 1 ? "" : "s"}</span>
              </div>
              <div className="ap-treasury-stat-box">
                <span className="lbl">💸 Staff Paid</span>
                <span className="val" style={{ color: "#f43f5e" }}>
                  ₹{financialMonthModal.staffPaid.toLocaleString("en-IN")}
                </span>
                <span className="sub">{financialMonthModal.staffPaidCount} payout{financialMonthModal.staffPaidCount === 1 ? "" : "s"} settled</span>
              </div>
              <div className="ap-treasury-stat-box highlight-net">
                <span className="lbl" style={{ color: "#34d399" }}>💰 Net Remaining</span>
                <span className="val" style={{ color: financialMonthModal.netRemain >= 0 ? "#10b981" : "#ef4444" }}>
                  {financialMonthModal.netRemain >= 0 ? "+" : ""}₹{financialMonthModal.netRemain.toLocaleString("en-IN")}
                </span>
                <span className="sub" style={{ color: "#6ee7b7", fontWeight: 700 }}>
                  {financialMonthModal.marginPercent}% Profit Retained
                </span>
              </div>
            </div>

            <Tabs
              defaultActiveKey="users"
              items={[
                {
                  key: "users",
                  label: `👤 Candidate Subscriptions (${financialMonthModal.userTxns.length})`,
                  children: (
                    <Table scroll={{ x: "max-content" }}
                      dataSource={financialMonthModal.userTxns}
                      rowKey={(r) => r.id}
                      pagination={{ pageSize: 5 }}
                      columns={[
                        {
                          title: "Candidate / Subscriber",
                          render: (_, r) => (
                            <div>
                              <strong>{r.candidate_name || r.candidate_username || `Candidate #${r.User_id}`}</strong>
                              {r.candidate_contact && <div style={{ fontSize: 11, color: "#94a3b8" }}>📱 {r.candidate_contact}</div>}
                              <div style={{ fontSize: 10, color: "#64748b" }}>ID: {r.User_id}</div>
                            </div>
                          ),
                        },
                        { title: "Plan", dataIndex: "Plan", render: (p) => <Tag color="gold">{p || "Standard"}</Tag> },
                        {
                          title: "Amount Paid",
                          render: (_, r) => (
                            <span style={{ fontWeight: 800, color: "#10b981" }}>
                              ₹{Number(r.Amount || 0).toLocaleString("en-IN")}
                            </span>
                          ),
                        },
                        { title: "Status", dataIndex: "status", render: (s) => <Tag color="success">{s || "Success"}</Tag> },
                        { title: "Date", dataIndex: "Create_date", render: (d) => d || "—" },
                      ]}
                    />
                  ),
                },
                {
                  key: "services",
                  label: `🏪 Wedding Service Fees (${financialMonthModal.serviceTxns.length})`,
                  children: (
                    <Table scroll={{ x: "max-content" }}
                      dataSource={financialMonthModal.serviceTxns}
                      rowKey={(r) => r.id}
                      pagination={{ pageSize: 5 }}
                      columns={[
                        {
                          title: "Vendor / Account",
                          render: (_, r) => (
                            <div>
                              <strong>{r.vendor_contact || r.vendor_username || `User #${r.User_id}`}</strong>
                              <div style={{ fontSize: 10, color: "#64748b" }}>ID: {r.User_id}</div>
                            </div>
                          ),
                        },
                        {
                          title: "Listing Title",
                          render: (_, r) => (
                            <div>
                              <strong>{r.service_title || `Service #${r.Service_id}`}</strong>
                              {r.service_type && <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.service_type}</div>}
                            </div>
                          ),
                        },
                        {
                          title: "Amount Paid",
                          render: (_, r) => (
                            <span style={{ fontWeight: 800, color: "#10b981" }}>
                              ₹{Number(r.Amount || 0).toLocaleString("en-IN")}
                            </span>
                          ),
                        },
                        { title: "Status", dataIndex: "Status", render: (s) => <Tag color="success">{s || "Success"}</Tag> },
                        { title: "Date", dataIndex: "Create_date", render: (d) => d || "—" },
                      ]}
                    />
                  ),
                },
                {
                  key: "staff",
                  label: `💸 Staff Counselor Withdrawals (${financialMonthModal.staffPaidTxns.length + financialMonthModal.staffPendingTxns.length})`,
                  children: (
                    <Table scroll={{ x: "max-content" }}
                      dataSource={[...financialMonthModal.staffPaidTxns, ...financialMonthModal.staffPendingTxns]}
                      rowKey={(r) => r.id}
                      pagination={{ pageSize: 5 }}
                      columns={[
                        {
                          title: "Staff Counselor",
                          render: (_, r) => {
                            const sInfo = staffList.find(
                              (s) => String(s.Staff_id?.id || s.Staff_id) === String(r.Staff_id?.id || r.Staff_id)
                            );
                            return (
                              <div>
                                <strong>{r.staff_name || sInfo?.Full_Name || `Staff #${r.Staff_id}`}</strong>
                                {(r.staff_contact || sInfo?.WP_Contact) && (
                                  <div style={{ fontSize: 11, color: "#94a3b8" }}>📞 {r.staff_contact || sInfo?.WP_Contact}</div>
                                )}
                              </div>
                            );
                          },
                        },
                        {
                          title: "Amount",
                          render: (_, r) => (
                            <span style={{ fontWeight: 800, color: "#f43f5e" }}>
                              ₹{Number(r.Amount || 0).toLocaleString("en-IN")}
                            </span>
                          ),
                        },
                        {
                          title: "Status",
                          render: (_, r) => {
                            const s = r.Status || "Pending";
                            const color = (s === "Approved" || s === "Success") ? "success" : "gold";
                            return <Tag color={color}>{s}</Tag>;
                          },
                        },
                        { title: "Remark / UTR", dataIndex: "Msg", render: (m) => m || "—" },
                        { title: "Date", dataIndex: "Create_date", render: (d) => d || "—" },
                      ]}
                    />
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* CANDIDATE STEPPED ONBOARDING WIZARD MODAL                      */}
      {/* ============================================================== */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>👤</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Register Candidate Profile (Step-by-Step Onboarding)</div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>
                Follow candidate registration process: Mobile Verification &rarr; OTP &rarr; Credentials &rarr; Biodata Profile
              </div>
            </div>
          </div>
        }
        open={isCreateCandidateOpen}
        onCancel={handleCancelCreateCandidate}
        footer={null}
        width={candidateRegStep === 3 ? 840 : 580}
        destroyOnClose={false}
      >
        <div style={{ padding: "8px 4px 16px" }}>
          <Steps
            current={candidateRegStep}
            size="small"
            style={{ marginBottom: 24 }}
            items={[
              { title: "Mobile", description: "Send OTP" },
              { title: "Verify", description: "SMS Code" },
              { title: "Credentials", description: "Set Password" },
              { title: "Biodata", description: "Full Profile" },
            ]}
          />

          {/* STEP 0: PHONE NUMBER */}
          {candidateRegStep === 0 && (
            <div className="ap-wizard-step-body">
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 10 }}>
                  <PhoneOutlined />
                </div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                  Step 1: Enter Candidate Mobile Number
                </h4>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  An SMS verification code will be dispatched to verify this contact number.
                </p>
              </div>

              <div style={{ maxWidth: 380, margin: "0 auto" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  10-Digit Mobile Number *
                </label>
                <Input
                  size="large"
                  addonBefore="+91"
                  placeholder="9876543210"
                  maxLength={10}
                  value={candPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setCandPhone(val);
                    setCandPhoneError("");
                  }}
                  onPressEnter={handleCandSendOTP}
                  style={{ borderRadius: 8, fontSize: 16 }}
                />
                {candPhoneError && (
                  <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6, fontWeight: 500 }}>{candPhoneError}</div>
                )}

                <Button
                  type="primary"
                  size="large"
                  block
                  loading={candLoading}
                  onClick={handleCandSendOTP}
                  style={{ marginTop: 20, height: 44, borderRadius: 8, fontWeight: 700, background: "#2563eb" }}
                >
                  Send Verification OTP
                </Button>
              </div>
            </div>
          )}

          {/* STEP 1: VERIFY OTP */}
          {candidateRegStep === 1 && (
            <div className="ap-wizard-step-body">
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f0fdf4", color: "#16a34a", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 10 }}>
                  <SafetyCertificateOutlined />
                </div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                  Step 2: Enter 6-Digit SMS OTP
                </h4>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  Verification code sent to <strong>+91 {candPhone}</strong>
                </p>
              </div>

              <div style={{ maxWidth: 420, margin: "0 auto" }}>
                {recentCandOtp && (
                  <Alert
                    type="info"
                    showIcon
                    message={
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: 12 }}>
                          System OTP: <strong>{recentCandOtp}</strong>
                        </span>
                        <Button
                          size="small"
                          type="primary"
                          ghost
                          onClick={() => {
                            const digits = String(recentCandOtp).padStart(6, "0").slice(0, 6).split("");
                            setCandOtp(digits);
                            setCandOtpError("");
                          }}
                        >
                          Auto-fill
                        </Button>
                      </div>
                    }
                    style={{ marginBottom: 14, borderRadius: 8 }}
                  />
                )}

                <div className="ap-otp-container" onPaste={handleCandOtpPaste}>
                  {candOtp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (candOtpRefs.current[idx] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      className="ap-otp-input"
                      onChange={(e) => handleCandOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleCandOtpKeyDown(e.target.value, idx)}
                    />
                  ))}
                </div>

                {candOtpError && (
                  <div style={{ color: "#ef4444", fontSize: 12, textAlign: "center", marginBottom: 12, fontWeight: 500 }}>
                    {candOtpError}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      if (candTimerRef.current) clearInterval(candTimerRef.current);
                      setCandidateRegStep(0);
                    }}
                    style={{ padding: 0 }}
                  >
                    Change Number
                  </Button>
                  {candCanResend ? (
                    <Button type="link" size="small" onClick={handleCandResendOTP} style={{ padding: 0, fontWeight: 700 }}>
                      Resend OTP
                    </Button>
                  ) : (
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>
                      Resend in <strong>{formatOtpCountdown(candCountdown)}</strong>
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <Button
                    size="large"
                    onClick={() => {
                      if (candTimerRef.current) clearInterval(candTimerRef.current);
                      setCandidateRegStep(0);
                    }}
                    style={{ flex: 1, height: 42, borderRadius: 8 }}
                  >
                    Back
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    loading={candLoading}
                    onClick={handleCandVerifyOTP}
                    style={{ flex: 2, height: 42, borderRadius: 8, fontWeight: 700, background: "#2563eb" }}
                  >
                    Verify OTP
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SET PASSWORD & REFERRAL */}
          {candidateRegStep === 2 && (
            <div className="ap-wizard-step-body">
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef3c7", color: "#d97706", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 10 }}>
                  <UserAddOutlined />
                </div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                  Step 3: Set Candidate Login Credentials
                </h4>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  Verified contact: <strong>+91 {candPhone}</strong>. Set password to register user account.
                </p>
              </div>

              <div style={{ maxWidth: 420, margin: "0 auto" }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Candidate Password * (Min 8 characters)
                  </label>
                  <Input
                    size="large"
                    type={candShowPass ? "text" : "password"}
                    placeholder="e.g. Vm@1234"
                    value={candPassword}
                    onChange={(e) => {
                      setCandPassword(e.target.value);
                      setCandPasswordError("");
                    }}
                    suffix={
                      <span onClick={() => setCandShowPass(!candShowPass)} style={{ cursor: "pointer", color: "#64748b" }}>
                        {candShowPass ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      </span>
                    }
                    style={{ borderRadius: 8 }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Confirm Password *
                  </label>
                  <Input
                    size="large"
                    type={candShowPass ? "text" : "password"}
                    placeholder="Repeat password"
                    value={candConfirmPassword}
                    onChange={(e) => {
                      setCandConfirmPassword(e.target.value);
                      setCandPasswordError("");
                    }}
                    style={{ borderRadius: 8 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Staff / Counselor Referral Code (Optional)
                  </label>
                  <Input
                    size="large"
                    placeholder="e.g. Staff Referral Code"
                    value={candRefCode}
                    onChange={(e) => setCandRefCode(e.target.value)}
                    style={{ borderRadius: 8 }}
                  />
                </div>

                {candPasswordError && (
                  <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12, fontWeight: 500 }}>
                    {candPasswordError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <Button
                    size="large"
                    onClick={() => setCandidateRegStep(1)}
                    style={{ flex: 1, height: 42, borderRadius: 8 }}
                  >
                    Back
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    loading={candLoading}
                    onClick={handleCandCreateAccount}
                    style={{ flex: 2, height: 42, borderRadius: 8, fontWeight: 700, background: "#2563eb" }}
                  >
                    Create Account &amp; Proceed
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CANDIDATE BIODATA & PROFILE DATA */}
          {candidateRegStep === 3 && (
            <div className="ap-wizard-step-body">
              <div className="ap-wizard-account-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#16a34a" }}>✓ User Account Created Successfully</span>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      User ID: <strong>#{candCreatedUser?.id}</strong> | Mobile: <strong>+91 {candPhone}</strong> | Ref Code: <strong>{candCreatedUser?.Reference_Code || "—"}</strong>
                    </div>
                  </div>
                  <Tag color="green">Role: Candidate</Tag>
                </div>
              </div>

              <h4 style={{ margin: "0 0 14px 0", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                Step 4: Fill Matrimonial Biodata &amp; Partner Profile
              </h4>

              <Form form={createCandidateForm} layout="vertical" onFinish={handleCreateCandidateSubmit}>
                <Row gutter={12}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="Full_Name" label="Candidate Full Name" rules={[{ required: true, message: "Full Name is required" }]}>
                      <Input placeholder="e.g. Rahul Sharma" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item name="Gender" label="Gender" rules={[{ required: true }]} initialValue="Male">
                      <Select placeholder="Select">
                        <Option value="Male">Male</Option>
                        <Option value="Female">Female</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item name="Age" label="Age (Years)">
                      <InputNumber min={18} max={80} style={{ width: "100%" }} placeholder="26" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item name="DOB" label="Date of Birth">
                      <Input type="date" style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item name="Marrige_status" label="Marital Status" initialValue="Never Married">
                      <Select placeholder="Select">
                        <Option value="Never Married">Never Married</Option>
                        <Option value="Divorced">Divorced</Option>
                        <Option value="Widowed">Widowed</Option>
                        <Option value="Awaiting Divorce">Awaiting Divorce</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item name="Religion" label="Religion" initialValue="Hindu">
                      <Select placeholder="Select Religion">
                        {religions.map((r) => (
                          <Option key={r.id} value={r.Religion_Name || r.Religion}>{r.Religion_Name || r.Religion}</Option>
                        ))}
                        <Option value="Hindu">Hindu</Option>
                        <Option value="Muslim">Muslim</Option>
                        <Option value="Sikh">Sikh</Option>
                        <Option value="Jain">Jain</Option>
                        <Option value="Christian">Christian</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item name="Caste" label="Caste">
                      <Input placeholder="e.g. Brahmin, Rajput" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="Gotra" label="Gotra (गोत्र)">
                      <Input placeholder="e.g. Kashyap" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="Qualification" label="Highest Education">
                      <Input placeholder="e.g. B.Tech, MBA" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="Profession" label="Profession / Occupation">
                      <Input placeholder="e.g. Software Engineer" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="Salary" label="Annual Income (₹)">
                      <InputNumber min={0} style={{ width: "100%" }} placeholder="1200000" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="State" label="State">
                      <Select
                        showSearch
                        placeholder="Select State"
                        onChange={() => createCandidateForm.setFieldsValue({ District: undefined })}
                      >
                        {statesList.map((s) => (
                          <Option key={s.id || s.State} value={s.State}>{s.State}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="District" label="District">
                      <Select showSearch placeholder="Select District">
                        {candCreateDistricts.map((d, i) => (
                          <Option key={i} value={d}>{d}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="City" label="City / Town">
                      <Input placeholder="e.g. Jaipur" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={16}>
                    <Form.Item name="About_MySelf" label="Brief About Candidate">
                      <Input placeholder="Values, lifestyle, hobbies..." />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="Partner_Expectations" label="Partner Expectations / Preferences">
                  <TextArea rows={2} placeholder="Desired partner qualities, age range, location..." />
                </Form.Item>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                  <Button
                    onClick={() => {
                      message.info(`Account registered (#${candCreatedUser?.id}). You can complete the profile later from the candidates table.`);
                      resetCandidateWizard();
                      setIsCreateCandidateOpen(false);
                    }}
                  >
                    Finish Later
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    loading={candLoading}
                    htmlType="submit"
                    style={{ background: "#2563eb", borderRadius: 8, fontWeight: 700, padding: "0 28px" }}
                  >
                    Save Biodata &amp; Activate Profile
                  </Button>
                </div>
              </Form>
            </div>
          )}
        </div>
      </Modal>

      {/* CANDIDATE EDIT MODAL (ALL USER & USER_DATA FIELDS VIA TABS) */}
      <Modal
        title={`Edit Candidate Profile: ${editingCandidate?.Full_Name || ""} (User #${editingCandidate?.User_id})`}
        open={Boolean(editingCandidate)}
        onCancel={() => setEditingCandidate(null)}
        onOk={() => candidateForm.submit()}
        width={850}
        okText="Save All Changes"
      >
        <Form form={candidateForm} layout="vertical" onFinish={handleSaveEditCandidate}>
          <Tabs
            defaultActiveKey="account"
            items={[
              {
                key: "account",
                label: "🔐 User Account & Login",
                children: (
                  <div>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="user_Contact" label="Login Phone / Contact (User Model)" rules={[{ required: true }]}>
                          <Input placeholder="10-digit phone number" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="user_password" label="Reset Password (Leave blank to keep current)">
                          <Input.Password placeholder="Enter new password if changing" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="user_Refered_By" label="Referral Code (Refered_By)">
                          <Input placeholder="Staff counselor referral code" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="user_Role" label="User Role">
                          <Select>
                            <Option value="user">User / Candidate</Option>
                            <Option value="staff">Staff Counselor</Option>
                            <Option value="service">Service Partner</Option>
                            <Option value="admin">Administrator</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="user_is_active" label="Account Active Status" valuePropName="checked">
                          <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: "personal",
                label: "👤 Personal & Horoscope",
                children: (
                  <div>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Full_Name" label="Full Name" rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item name="Gender" label="Gender">
                          <Select>
                            <Option value="Male">Male</Option>
                            <Option value="Female">Female</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item name="Age" label="Age">
                          <InputNumber min={18} max={90} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="DOB" label="Date of Birth (DD-MM-YYYY)">
                          <Input placeholder="15-08-1995" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="Caste" label="Caste">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="Gotra" label="Gotra (गोत्र)">
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="Religion" label="Religion">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="Mother_tongue" label="Mother Tongue">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="Color" label="Complexion / वर्ण">
                          <Input placeholder="Fair, Wheatish, etc." />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item name="Height" label="Height (ft/inches)">
                          <InputNumber step={0.1} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item name="Weight" label="Weight (kg)">
                          <InputNumber step={0.5} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item name="Manglik" label="Manglik" valuePropName="checked">
                          <Switch checkedChildren="Manglik" unCheckedChildren="No" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item name="Disability" label="Special Needs / Disability" valuePropName="checked">
                          <Switch checkedChildren="Yes" unCheckedChildren="No" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: "contact",
                label: "📞 Contact & Address",
                children: (
                  <div>
                    <Row gutter={12}>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="WP_Contact" label="WhatsApp Number">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="WP_Contact_Relation" label="Relation">
                          <Select>
                            <Option value="Self">Self</Option>
                            <Option value="Father">Father</Option>
                            <Option value="Mother">Mother</Option>
                            <Option value="Brother">Brother</Option>
                            <Option value="Sister">Sister</Option>
                            <Option value="Guardian">Guardian</Option>
                            <Option value="Relative">Relative</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="Wp_Contact_Name" label="Contact Person Name">
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="Alt_Contact" label="Alternate Contact">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="Alt_Contact_Relation" label="Alternate Relation">
                          <Select>
                            <Option value="Self">Self</Option>
                            <Option value="Father">Father</Option>
                            <Option value="Mother">Mother</Option>
                            <Option value="Brother">Brother</Option>
                            <Option value="Sister">Sister</Option>
                            <Option value="Guardian">Guardian</Option>
                            <Option value="Relative">Relative</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="Alt_Contact_Name" label="Alternate Person Name">
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Email" label="Email Address">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Nearestdist" label="Proximity / Nearest Districts (comma separated)">
                          <Input placeholder="District1, District2" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="State" label="State">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="District" label="District">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="City" label="City">
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="Country" label="Country">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={16}>
                        <Form.Item name="Full_Address" label="Complete Residential Address">
                          <Input.TextArea rows={2} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: "career",
                label: "💼 Career & Education",
                children: (
                  <div>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Qualification" label="Educational Qualification">
                          <Input placeholder="e.g. B.Tech / MBA / MBBS" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Profession" label="Profession / Occupation">
                          <Input placeholder="e.g. Software Engineer / Doctor / Business" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Job_type" label="Job / Employment Type">
                          <Input placeholder="e.g. Private / Govt / Self-Employed" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Salary" label="Annual Income / Salary (₹)">
                          <InputNumber min={0} style={{ width: "100%" }} placeholder="e.g. 1200000" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: "family",
                label: "🏡 Family & Lifestyle",
                children: (
                  <div>
                    <Row gutter={12}>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="Father_name" label="Father's Name">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="Father_Age" label="Father's Age">
                          <InputNumber min={30} max={110} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="Father_Profession" label="Father's Occupation">
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="Mother_name" label="Mother's Name">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="Mother_Age" label="Mother's Age">
                          <InputNumber min={30} max={110} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="Mother_Profession" label="Mother's Occupation">
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item name="Brothers" label="Total Brothers">
                          <Select>
                            {["0", "1", "2", "3", "4", "5"].map((n) => <Option key={n} value={n}>{n}</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item name="Brothers_marrige" label="Married Brothers">
                          <Select>
                            {["0", "1", "2", "3", "4", "5"].map((n) => <Option key={n} value={n}>{n}</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item name="Sisters" label="Total Sisters">
                          <Select>
                            {["0", "1", "2", "3", "4", "5"].map((n) => <Option key={n} value={n}>{n}</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item name="Sisters_marrige" label="Married Sisters">
                          <Select>
                            {["0", "1", "2", "3", "4", "5"].map((n) => <Option key={n} value={n}>{n}</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="House" label="House Type">
                          <Select>
                            <Option value="Self">Self Owned (अपना मकान)</Option>
                            <Option value="Rental">Rented (किराये का)</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Vegeterian" label="Diet / Food Habit">
                          <Select>
                            <Option value="Vegeterian">Vegetarian (शाकाहारी)</Option>
                            <Option value="Non-Vegeterian">Non-Vegetarian (मांसाहारी)</Option>
                            <Option value="Both">Both (दोनों)</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: "status",
                label: "📜 Status & Preferences",
                children: (
                  <div>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Marrige_status" label="Marital Status">
                          <Select>
                            <Option value="Never Married">Never Married</Option>
                            <Option value="Divorced">Divorced</Option>
                            <Option value="Widowed">Widowed</Option>
                            <Option value="Awaiting Divorce">Awaiting Divorce</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="Valid_Upto"
                          label="Membership Expiry Date (YYYY-MM-DD)"
                          extra="Format: YYYY-MM-DD (e.g. 2026-12-31) or DD-MM-YYYY. Leave empty for none/expired."
                        >
                          <Input placeholder="2026-12-31" allowClear />
                        </Form.Item>
                        <div style={{ marginTop: -8, marginBottom: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <Button
                            size="small"
                            type="dashed"
                            onClick={() => {
                              const d = new Date();
                              d.setDate(d.getDate() + 30);
                              candidateForm.setFieldsValue({ Valid_Upto: d.toISOString().split("T")[0] });
                            }}
                          >
                            +30 Days
                          </Button>
                          <Button
                            size="small"
                            type="dashed"
                            onClick={() => {
                              const d = new Date();
                              d.setDate(d.getDate() + 90);
                              candidateForm.setFieldsValue({ Valid_Upto: d.toISOString().split("T")[0] });
                            }}
                          >
                            +90 Days
                          </Button>
                          <Button
                            size="small"
                            type="dashed"
                            onClick={() => {
                              const d = new Date();
                              d.setFullYear(d.getFullYear() + 1);
                              candidateForm.setFieldsValue({ Valid_Upto: d.toISOString().split("T")[0] });
                            }}
                          >
                            +1 Year
                          </Button>
                          <Button
                            size="small"
                            danger
                            type="text"
                            onClick={() => {
                              candidateForm.setFieldsValue({ Valid_Upto: "" });
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={18}>
                        <Form.Item name="Accept_Profiles" label="Accepted Partner Profile Categories (comma separated)">
                          <Input placeholder="General, OBC, etc." />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item name="Active" label="Profile Active" valuePropName="checked">
                          <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
            ]}
          />
        </Form>
      </Modal>

      {/* EXTEND VALIDITY MODAL */}
      <Modal
        title={`Extend Membership Validity: ${validityModalCandidate?.Full_Name || ""}`}
        open={Boolean(validityModalCandidate)}
        onCancel={() => setValidityModalCandidate(null)}
        onOk={handleExtendValidity}
        confirmLoading={extendingLoading}
        okText="Grant Validity"
      >
        <div style={{ marginBottom: 16 }}>
          <p><strong>Candidate:</strong> {validityModalCandidate?.Full_Name} (#{validityModalCandidate?.User_id})</p>
          <p><strong>Current Expiry:</strong> {validityModalCandidate?.Valid_Upto || "None / Expired"}</p>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Choose Extension Duration:</label>
          <Radio.Group value={extensionDays} onChange={(e) => setExtensionDays(e.target.value)} buttonStyle="solid">
            <Radio.Button value={30}>+30 Days</Radio.Button>
            <Radio.Button value={90}>+90 Days</Radio.Button>
            <Radio.Button value={180}>+180 Days</Radio.Button>
            <Radio.Button value={365}>+1 Year (VIP)</Radio.Button>
          </Radio.Group>
        </div>
      </Modal>

      {/* ============================================================== */}
      {/* STAFF COUNSELOR STEPPED ONBOARDING WIZARD MODAL                */}
      {/* ============================================================== */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🧑‍💼</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Onboard Staff Marriage Counselor (Step-by-Step)</div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>
                Follow staff registration process: Mobile Verification &rarr; OTP &rarr; Credentials &rarr; Counselor Profile &amp; Banking
              </div>
            </div>
          </div>
        }
        open={isCreateStaffOpen}
        onCancel={handleCancelCreateStaff}
        footer={null}
        width={staffRegStep === 3 ? 840 : 580}
        destroyOnClose={false}
      >
        <div style={{ padding: "8px 4px 16px" }}>
          <Steps
            current={staffRegStep}
            size="small"
            style={{ marginBottom: 24 }}
            items={[
              { title: "Mobile", description: "Send OTP" },
              { title: "Verify", description: "SMS Code" },
              { title: "Credentials", description: "Set Password" },
              { title: "Counselor Info", description: "Profile & Banking" },
            ]}
          />

          {/* STEP 0: PHONE NUMBER */}
          {staffRegStep === 0 && (
            <div className="ap-wizard-step-body">
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 10 }}>
                  <PhoneOutlined />
                </div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                  Step 1: Enter Staff Counselor Mobile Number
                </h4>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  An SMS verification code will be dispatched to verify this staff contact number.
                </p>
              </div>

              <div style={{ maxWidth: 380, margin: "0 auto" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  10-Digit Mobile Number *
                </label>
                <Input
                  size="large"
                  addonBefore="+91"
                  placeholder="9876543210"
                  maxLength={10}
                  value={staffPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setStaffPhone(val);
                    setStaffPhoneError("");
                  }}
                  onPressEnter={handleStaffSendOTP}
                  style={{ borderRadius: 8, fontSize: 16 }}
                />
                {staffPhoneError && (
                  <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6, fontWeight: 500 }}>{staffPhoneError}</div>
                )}

                <Button
                  type="primary"
                  size="large"
                  block
                  loading={staffLoading}
                  onClick={handleStaffSendOTP}
                  style={{ marginTop: 20, height: 44, borderRadius: 8, fontWeight: 700, background: "#2563eb" }}
                >
                  Send Verification OTP
                </Button>
              </div>
            </div>
          )}

          {/* STEP 1: VERIFY OTP */}
          {staffRegStep === 1 && (
            <div className="ap-wizard-step-body">
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f0fdf4", color: "#16a34a", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 10 }}>
                  <SafetyCertificateOutlined />
                </div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                  Step 2: Enter 6-Digit SMS OTP
                </h4>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  Verification code sent to <strong>+91 {staffPhone}</strong>
                </p>
              </div>

              <div style={{ maxWidth: 420, margin: "0 auto" }}>
                {recentStaffOtp && (
                  <Alert
                    type="info"
                    showIcon
                    message={
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: 12 }}>
                          System OTP: <strong>{recentStaffOtp}</strong>
                        </span>
                        <Button
                          size="small"
                          type="primary"
                          ghost
                          onClick={() => {
                            const digits = String(recentStaffOtp).padStart(6, "0").slice(0, 6).split("");
                            setStaffOtp(digits);
                            setStaffOtpError("");
                          }}
                        >
                          Auto-fill
                        </Button>
                      </div>
                    }
                    style={{ marginBottom: 14, borderRadius: 8 }}
                  />
                )}

                <div className="ap-otp-container" onPaste={handleStaffOtpPaste}>
                  {staffOtp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (staffOtpRefs.current[idx] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      className="ap-otp-input"
                      onChange={(e) => handleStaffOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleStaffOtpKeyDown(e.target.value, idx)}
                    />
                  ))}
                </div>

                {staffOtpError && (
                  <div style={{ color: "#ef4444", fontSize: 12, textAlign: "center", marginBottom: 12, fontWeight: 500 }}>
                    {staffOtpError}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      if (staffTimerRef.current) clearInterval(staffTimerRef.current);
                      setStaffRegStep(0);
                    }}
                    style={{ padding: 0 }}
                  >
                    Change Number
                  </Button>
                  {staffCanResend ? (
                    <Button type="link" size="small" onClick={handleStaffResendOTP} style={{ padding: 0, fontWeight: 700 }}>
                      Resend OTP
                    </Button>
                  ) : (
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>
                      Resend in <strong>{formatOtpCountdown(staffCountdown)}</strong>
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <Button
                    size="large"
                    onClick={() => {
                      if (staffTimerRef.current) clearInterval(staffTimerRef.current);
                      setStaffRegStep(0);
                    }}
                    style={{ flex: 1, height: 42, borderRadius: 8 }}
                  >
                    Back
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    loading={staffLoading}
                    onClick={handleStaffVerifyOTP}
                    style={{ flex: 2, height: 42, borderRadius: 8, fontWeight: 700, background: "#2563eb" }}
                  >
                    Verify OTP
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SET PASSWORD & REFERRAL */}
          {staffRegStep === 2 && (
            <div className="ap-wizard-step-body">
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef3c7", color: "#d97706", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 10 }}>
                  <UserAddOutlined />
                </div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                  Step 3: Set Staff Portal Credentials
                </h4>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  Verified contact: <strong>+91 {staffPhone}</strong>. Set password to register staff account.
                </p>
              </div>

              <div style={{ maxWidth: 420, margin: "0 auto" }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Staff Password * (Min 8 characters)
                  </label>
                  <Input
                    size="large"
                    type={staffShowPass ? "text" : "password"}
                    placeholder="e.g. Staff@1234"
                    value={staffPassword}
                    onChange={(e) => {
                      setStaffPassword(e.target.value);
                      setStaffPasswordError("");
                    }}
                    suffix={
                      <span onClick={() => setStaffShowPass(!staffShowPass)} style={{ cursor: "pointer", color: "#64748b" }}>
                        {staffShowPass ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      </span>
                    }
                    style={{ borderRadius: 8 }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Confirm Password *
                  </label>
                  <Input
                    size="large"
                    type={staffShowPass ? "text" : "password"}
                    placeholder="Repeat password"
                    value={staffConfirmPassword}
                    onChange={(e) => {
                      setStaffConfirmPassword(e.target.value);
                      setStaffPasswordError("");
                    }}
                    style={{ borderRadius: 8 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Supervisor / Admin Referral Code (Optional)
                  </label>
                  <Input
                    size="large"
                    placeholder="e.g. Admin Code"
                    value={staffRefCode}
                    onChange={(e) => setStaffRefCode(e.target.value)}
                    style={{ borderRadius: 8 }}
                  />
                </div>

                {staffPasswordError && (
                  <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12, fontWeight: 500 }}>
                    {staffPasswordError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <Button
                    size="large"
                    onClick={() => setStaffRegStep(1)}
                    style={{ flex: 1, height: 42, borderRadius: 8 }}
                  >
                    Back
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    loading={staffLoading}
                    onClick={handleStaffCreateAccount}
                    style={{ flex: 2, height: 42, borderRadius: 8, fontWeight: 700, background: "#2563eb" }}
                  >
                    Create Account &amp; Proceed
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: STAFF PROFILE & BANKING DATA */}
          {staffRegStep === 3 && (
            <div className="ap-wizard-step-body">
              <div className="ap-wizard-account-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#16a34a" }}>✓ Staff User Account Registered</span>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      User ID: <strong>#{staffCreatedUser?.id}</strong> | Mobile: <strong>+91 {staffPhone}</strong> | Counselor Ref Code: <strong>{staffPhone.slice(-6)}</strong>
                    </div>
                  </div>
                  <Tag color="purple">Role: Staff Counselor</Tag>
                </div>
              </div>

              <h4 style={{ margin: "0 0 14px 0", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                Step 4: Counselor Details, KYC &amp; Banking Payout
              </h4>

              <Form form={createStaffForm} layout="vertical" onFinish={handleCreateStaffSubmit}>
                <Row gutter={12}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="Full_Name" label="Counselor Full Name" rules={[{ required: true, message: "Required" }]}>
                      <Input placeholder="e.g. Meena Sharma" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="Email" label="Official Email Address">
                      <Input placeholder="counselor@vaivaheekmanch.com" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="State" label="Operating State">
                      <Select
                        showSearch
                        placeholder="Select State"
                        onChange={() => createStaffForm.setFieldsValue({ District: undefined })}
                      >
                        {statesList.map((s) => (
                          <Option key={s.id || s.State} value={s.State}>{s.State}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="District" label="Assigned District">
                      <Select showSearch placeholder="Select District">
                        {staffCreateDistricts.map((d, i) => (
                          <Option key={i} value={d}>{d}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="Full_Address" label="Full Address / Location">
                      <Input placeholder="Office or Residential address" />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider style={{ margin: "14px 0 16px" }}>Banking &amp; Commission Payout Setup</Divider>

                <Row gutter={12}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="Bank_Name" label="Bank Name">
                      <Input placeholder="State Bank of India, HDFC, etc." />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="Bank_Account_Number" label="Bank Account Number">
                      <Input placeholder="e.g. 309812345678" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="Bank_IFSC_Code" label="Bank IFSC Code">
                      <Input placeholder="e.g. SBIN0001234" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="UPI_ID" label="Payout UPI ID">
                      <Input placeholder="counselor@upi" />
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                  <Button
                    onClick={() => {
                      message.info(`Staff account registered (#${staffCreatedUser?.id}). Profile can be updated later from the staff counselors table.`);
                      resetStaffWizard();
                      setIsCreateStaffOpen(false);
                    }}
                  >
                    Finish Later
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    loading={staffLoading}
                    htmlType="submit"
                    style={{ background: "#7c3aed", borderColor: "#7c3aed", borderRadius: 8, fontWeight: 700, padding: "0 28px" }}
                  >
                    Save Staff Profile &amp; Verify
                  </Button>
                </div>
              </Form>
            </div>
          )}
        </div>
      </Modal>

      {/* STAFF COUNSELOR EDIT MODAL (ALL USER & STAFF_DATA FIELDS VIA TABS) */}
      <Modal
        title={`Edit Staff Counselor: ${editingStaff?.Full_Name || ""} (User #${editingStaff?.Staff_id})`}
        open={Boolean(editingStaff)}
        onCancel={() => setEditingStaff(null)}
        onOk={() => staffForm.submit()}
        width={800}
        okText="Save All Changes"
      >
        <Form form={staffForm} layout="vertical" onFinish={handleSaveEditStaff}>
          <Tabs
            defaultActiveKey="account"
            items={[
              {
                key: "account",
                label: "🔐 Counselor Login & Account",
                children: (
                  <div>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="user_Contact" label="Login Phone / Contact (User Model)" rules={[{ required: true }]}>
                          <Input placeholder="10-digit phone number" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="user_password" label="Reset Password (Leave blank to keep current)">
                          <Input.Password placeholder="Enter new password if changing" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="user_Refered_By" label="Referral Code (Refered_By)">
                          <Input placeholder="Optional referral code" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="user_Role" label="User Role">
                          <Select>
                            <Option value="staff">Staff Counselor</Option>
                            <Option value="user">User / Candidate</Option>
                            <Option value="service">Service Partner</Option>
                            <Option value="admin">Administrator</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="user_is_active" label="Account Active Status" valuePropName="checked">
                          <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: "personal",
                label: "👤 Personal & Address",
                children: (
                  <div>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Full_Name" label="Full Name" rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item name="Age" label="Age">
                          <InputNumber min={18} max={90} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item name="WP_Contact" label="WhatsApp Contact">
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Email" label="Email Address">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Country" label="Country">
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="State" label="State">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="District" label="District">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="City" label="City">
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item name="Full_Address" label="Full Residential Address">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: "kyc",
                label: "🪪 KYC & Identification",
                children: (
                  <div>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Adhar_Number" label="Aadhaar Card Number">
                          <Input placeholder="12-digit Aadhaar" maxLength={12} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="PAN_Number" label="PAN Card Number">
                          <Input placeholder="10-digit PAN" maxLength={10} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Refer" label="Counselor Referral Code (Refer)">
                          <Input placeholder="Code assigned to counselor" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: "banking",
                label: "🏦 Banking & Wallet",
                children: (
                  <div>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Bank_Name" label="Bank Name">
                          <Input placeholder="e.g. State Bank of India" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Bank_Account_Number" label="Account Number">
                          <Input placeholder="16-digit account number" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Bank_IFSC_Code" label="IFSC Code">
                          <Input placeholder="e.g. SBIN0001234" maxLength={11} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Bank_Account_Holder_Name" label="Account Holder Name">
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="UPI_ID" label="UPI VPA ID">
                          <Input placeholder="e.g. counselor@upi" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Amount" label="Wallet Balance (₹)">
                          <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: "status",
                label: "⚖️ Approvals & Access",
                children: (
                  <div>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="is_approved" label="KYC Document Approval Status" valuePropName="checked">
                          <Switch checkedChildren="KYC Approved" unCheckedChildren="Pending Approval" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Active" label="Counselor Profile Active Status" valuePropName="checked">
                          <Switch checkedChildren="Active Profile" unCheckedChildren="Suspended / Disabled" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
            ]}
          />
        </Form>
      </Modal>

      {/* STAFF WALLET ADJUSTMENT MODAL */}
      <Modal
        title={`Adjust Counselor Wallet: ${walletStaff?.Full_Name || ""}`}
        open={Boolean(walletStaff)}
        onCancel={() => setWalletStaff(null)}
        onOk={handleAdjustWalletSubmit}
        confirmLoading={walletLoading}
        okText="Apply Adjustment"
      >
        {walletStaff && (
          <div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: 12, borderRadius: 10, marginBottom: 16 }}>
              <div>Current Balance: <strong style={{ color: "#10b981", fontSize: 18 }}>₹{walletStaff.Amount || 0}</strong></div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Referral Code: {walletStaff.Refer}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Adjustment Type:</label>
              <Radio.Group value={walletType} onChange={(e) => setWalletType(e.target.value)} buttonStyle="solid">
                <Radio.Button value="Credit" style={{ color: walletType === "Credit" ? "#fff" : "#10b981" }}>+ Credit (Add Funds)</Radio.Button>
                <Radio.Button value="Debit" style={{ color: walletType === "Debit" ? "#fff" : "#ef4444" }}>- Debit (Deduct Funds)</Radio.Button>
              </Radio.Group>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Amount (₹):</label>
              <InputNumber min={1} value={walletAmount} onChange={setWalletAmount} prefix="₹" style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Adjustment Reason / Note:</label>
              <Input placeholder="e.g. Monthly performance bonus, offline cash settlement" value={walletRemark} onChange={(e) => setWalletRemark(e.target.value)} />
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* SERVICE PARTNER STEPPED ONBOARDING WIZARD MODAL                */}
      {/* ============================================================== */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🏪</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Register Wedding Service Partner (Step-by-Step)</div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>
                Follow vendor registration process: Mobile Verification &rarr; OTP &rarr; Credentials &rarr; Business Profile &amp; Services
              </div>
            </div>
          </div>
        }
        open={isCreateServiceOpen}
        onCancel={handleCancelCreateService}
        footer={null}
        width={serviceRegStep === 3 ? 840 : 580}
        destroyOnClose={false}
      >
        <div style={{ padding: "8px 4px 16px" }}>
          <Steps
            current={serviceRegStep}
            size="small"
            style={{ marginBottom: 24 }}
            items={[
              { title: "Mobile", description: "Send OTP" },
              { title: "Verify", description: "SMS Code" },
              { title: "Credentials", description: "Set Password" },
              { title: "Business Profile", description: "Services & Pricing" },
            ]}
          />

          {/* STEP 0: PHONE NUMBER */}
          {serviceRegStep === 0 && (
            <div className="ap-wizard-step-body">
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 10 }}>
                  <PhoneOutlined />
                </div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                  Step 1: Enter Partner Mobile Number
                </h4>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  An SMS verification code will be dispatched to verify this vendor contact number.
                </p>
              </div>

              <div style={{ maxWidth: 380, margin: "0 auto" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  10-Digit Mobile Number *
                </label>
                <Input
                  size="large"
                  addonBefore="+91"
                  placeholder="9876543210"
                  maxLength={10}
                  value={servicePhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setServicePhone(val);
                    setServicePhoneError("");
                  }}
                  onPressEnter={handleServiceSendOTP}
                  style={{ borderRadius: 8, fontSize: 16 }}
                />
                {servicePhoneError && (
                  <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6, fontWeight: 500 }}>{servicePhoneError}</div>
                )}

                <Button
                  type="primary"
                  size="large"
                  block
                  loading={serviceLoading}
                  onClick={handleServiceSendOTP}
                  style={{ marginTop: 20, height: 44, borderRadius: 8, fontWeight: 700, background: "#2563eb" }}
                >
                  Send Verification OTP
                </Button>
              </div>
            </div>
          )}

          {/* STEP 1: VERIFY OTP */}
          {serviceRegStep === 1 && (
            <div className="ap-wizard-step-body">
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f0fdf4", color: "#16a34a", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 10 }}>
                  <SafetyCertificateOutlined />
                </div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                  Step 2: Enter 6-Digit SMS OTP
                </h4>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  Verification code sent to <strong>+91 {servicePhone}</strong>
                </p>
              </div>

              <div style={{ maxWidth: 420, margin: "0 auto" }}>
                {recentServiceOtp && (
                  <Alert
                    type="info"
                    showIcon
                    message={
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: 12 }}>
                          System OTP: <strong>{recentServiceOtp}</strong>
                        </span>
                        <Button
                          size="small"
                          type="primary"
                          ghost
                          onClick={() => {
                            const digits = String(recentServiceOtp).padStart(6, "0").slice(0, 6).split("");
                            setServiceOtp(digits);
                            setServiceOtpError("");
                          }}
                        >
                          Auto-fill
                        </Button>
                      </div>
                    }
                    style={{ marginBottom: 14, borderRadius: 8 }}
                  />
                )}

                <div className="ap-otp-container" onPaste={handleServiceOtpPaste}>
                  {serviceOtp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (serviceOtpRefs.current[idx] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      className="ap-otp-input"
                      onChange={(e) => handleServiceOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleServiceOtpKeyDown(e.target.value, idx)}
                    />
                  ))}
                </div>

                {serviceOtpError && (
                  <div style={{ color: "#ef4444", fontSize: 12, textAlign: "center", marginBottom: 12, fontWeight: 500 }}>
                    {serviceOtpError}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      if (serviceTimerRef.current) clearInterval(serviceTimerRef.current);
                      setServiceRegStep(0);
                    }}
                    style={{ padding: 0 }}
                  >
                    Change Number
                  </Button>
                  {serviceCanResend ? (
                    <Button type="link" size="small" onClick={handleServiceResendOTP} style={{ padding: 0, fontWeight: 700 }}>
                      Resend OTP
                    </Button>
                  ) : (
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>
                      Resend in <strong>{formatOtpCountdown(serviceCountdown)}</strong>
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <Button
                    size="large"
                    onClick={() => {
                      if (serviceTimerRef.current) clearInterval(serviceTimerRef.current);
                      setServiceRegStep(0);
                    }}
                    style={{ flex: 1, height: 42, borderRadius: 8 }}
                  >
                    Back
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    loading={serviceLoading}
                    onClick={handleServiceVerifyOTP}
                    style={{ flex: 2, height: 42, borderRadius: 8, fontWeight: 700, background: "#2563eb" }}
                  >
                    Verify OTP
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SET PASSWORD & REFERRAL */}
          {serviceRegStep === 2 && (
            <div className="ap-wizard-step-body">
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef3c7", color: "#d97706", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 10 }}>
                  <UserAddOutlined />
                </div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                  Step 3: Set Service Partner Credentials
                </h4>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  Verified contact: <strong>+91 {servicePhone}</strong>. Set password to register vendor account.
                </p>
              </div>

              <div style={{ maxWidth: 420, margin: "0 auto" }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Account Password * (Min 8 characters)
                  </label>
                  <Input
                    size="large"
                    type={serviceShowPass ? "text" : "password"}
                    placeholder="e.g. Service@1234"
                    value={servicePassword}
                    onChange={(e) => {
                      setServicePassword(e.target.value);
                      setServicePasswordError("");
                    }}
                    suffix={
                      <span onClick={() => setServiceShowPass(!serviceShowPass)} style={{ cursor: "pointer", color: "#64748b" }}>
                        {serviceShowPass ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      </span>
                    }
                    style={{ borderRadius: 8 }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Confirm Password *
                  </label>
                  <Input
                    size="large"
                    type={serviceShowPass ? "text" : "password"}
                    placeholder="Repeat password"
                    value={serviceConfirmPassword}
                    onChange={(e) => {
                      setServiceConfirmPassword(e.target.value);
                      setServicePasswordError("");
                    }}
                    style={{ borderRadius: 8 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Referral Code (Optional)
                  </label>
                  <Input
                    size="large"
                    placeholder="e.g. Counselor or Admin Code"
                    value={serviceRefCode}
                    onChange={(e) => setServiceRefCode(e.target.value)}
                    style={{ borderRadius: 8 }}
                  />
                </div>

                {servicePasswordError && (
                  <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12, fontWeight: 500 }}>
                    {servicePasswordError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <Button
                    size="large"
                    onClick={() => setServiceRegStep(1)}
                    style={{ flex: 1, height: 42, borderRadius: 8 }}
                  >
                    Back
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    loading={serviceLoading}
                    onClick={handleServiceCreateAccount}
                    style={{ flex: 2, height: 42, borderRadius: 8, fontWeight: 700, background: "#2563eb" }}
                  >
                    Create Account &amp; Proceed
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SERVICE PARTNER BUSINESS PROFILE */}
          {serviceRegStep === 3 && (
            <div className="ap-wizard-step-body">
              <div className="ap-wizard-account-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#16a34a" }}>✓ Service Partner Account Registered</span>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      User ID: <strong>#{serviceCreatedUser?.id}</strong> | Mobile: <strong>+91 {servicePhone}</strong> | Ref Code: <strong>{serviceCreatedUser?.Reference_Code || "—"}</strong>
                    </div>
                  </div>
                  <Tag color="cyan">Role: Wedding Service Partner</Tag>
                </div>
              </div>

              <h4 style={{ margin: "0 0 14px 0", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                Step 4: Business Profile, Category Offerings &amp; Pricing
              </h4>

              <Form form={createServiceForm} layout="vertical" onFinish={handleCreateServiceSubmit}>
                <Row gutter={12}>
                  <Col xs={24} sm={14}>
                    <Form.Item name="Service_Name" label="Business / Service Name" rules={[{ required: true, message: "Required" }]}>
                      <Input placeholder="e.g. Royal Shahi Photography &amp; Films" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={10}>
                    <Form.Item name="Service_Type" label="Category / Offering" rules={[{ required: true, message: "Required" }]}>
                      <Select placeholder="Select Category">
                        {serviceCategories.map((c) => (
                          <Option key={c.id} value={c.Service_Type || c.Service_Name}>{c.Service_Name || c.Service_Type}</Option>
                        ))}
                        <Option value="Photography">Photography &amp; Videography</Option>
                        <Option value="Catering">Catering &amp; Food Services</Option>
                        <Option value="Decoration">Floral &amp; Mandap Decoration</Option>
                        <Option value="Venue">Marriage Gardens &amp; Banquet Halls</Option>
                        <Option value="Band_Baja">Band Baja, Dhol &amp; Orchestra</Option>
                        <Option value="Mehendi">Bridal Mehendi &amp; Makeup Artist</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="Service_Price" label="Starting Package Price (₹)">
                      <InputNumber min={0} style={{ width: "100%" }} placeholder="15000" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="Alt_Contact" label="Alternate Office Contact / Landline">
                      <Input placeholder="e.g. 0141-2345678 or 9829012345" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="State" label="Operating State">
                      <Select
                        showSearch
                        placeholder="Select State"
                        onChange={() => createServiceForm.setFieldsValue({ District: undefined })}
                      >
                        {statesList.map((s) => (
                          <Option key={s.id || s.State} value={s.State}>{s.State}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="District" label="District / Region">
                      <Select showSearch placeholder="Select District">
                        {serviceCreateDistricts.map((d, i) => (
                          <Option key={i} value={d}>{d}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="City" label="City / Town">
                      <Input placeholder="e.g. Jaipur" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col span={24}>
                    <Form.Item name="Full_Address" label="Studio / Office Address">
                      <Input placeholder="Complete studio / business address..." />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="Service_Description" label="Business Overview &amp; Packages Offered">
                  <TextArea rows={3} placeholder="Describe services, portfolio highlights, experience, equipment..." />
                </Form.Item>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                  <Button
                    onClick={() => {
                      message.info(`Service account registered (#${serviceCreatedUser?.id}). Profile can be completed later from the vendors directory.`);
                      resetServiceWizard();
                      setIsCreateServiceOpen(false);
                    }}
                  >
                    Finish Later
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    loading={serviceLoading}
                    htmlType="submit"
                    style={{ background: "#0284c7", borderColor: "#0284c7", borderRadius: 8, fontWeight: 700, padding: "0 28px" }}
                  >
                    Save Business Profile &amp; Verify
                  </Button>
                </div>
              </Form>
            </div>
          )}
        </div>
      </Modal>

      {/* SERVICE PARTNER EDIT MODAL (ALL USER & SERVICE_DATA FIELDS VIA TABS) */}
      <Modal
        title={`Edit Service Partner: ${editingService?.Service_Name || ""} (User #${editingService?.Service_id})`}
        open={Boolean(editingService)}
        onCancel={() => setEditingService(null)}
        onOk={() => serviceForm.submit()}
        width={800}
        okText="Save All Changes"
      >
        <Form form={serviceForm} layout="vertical" onFinish={handleSaveEditService}>
          <Tabs
            defaultActiveKey="account"
            items={[
              {
                key: "account",
                label: "🔐 Vendor Login & Account",
                children: (
                  <div>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="user_Contact" label="Login Phone / Contact (User Model)" rules={[{ required: true }]}>
                          <Input placeholder="10-digit phone number" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="user_password" label="Reset Password (Leave blank to keep current)">
                          <Input.Password placeholder="Enter new password if changing" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="user_Refered_By" label="Referral Code (Refered_By)">
                          <Input placeholder="Optional referral code" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="user_Role" label="User Role">
                          <Select>
                            <Option value="service">Service Partner</Option>
                            <Option value="user">User / Candidate</Option>
                            <Option value="staff">Staff Counselor</Option>
                            <Option value="admin">Administrator</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="user_is_active" label="Account Active Status" valuePropName="checked">
                          <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: "business",
                label: "🛍️ Business Profile & Pricing",
                children: (
                  <div>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Service_Name" label="Business / Vendor Name" rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Service_Type" label="Service Category" rules={[{ required: true }]}>
                          <Input placeholder="e.g. Photography, Catering, Mehndi, DJ" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Service_Price" label="Base Starting Price (₹)">
                          <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Valid_Upto" label="Listing Expiry Date (YYYY-MM-DD)">
                          <Input placeholder="2027-12-31" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item name="Service_Description" label="Business Description & Offerings">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: "location",
                label: "📍 Contact & Service Coverage",
                children: (
                  <div>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="WP_Contact" label="Primary Contact / WhatsApp Phone" rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Alt_Contact" label="Alternate Contact Phone">
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="State" label="State">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="District" label="District">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="City" label="City">
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={12}>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item name="Country" label="Country">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={16}>
                        <Form.Item name="Available_Zone" label="Service Delivery Zones (comma separated)">
                          <Input placeholder="e.g. North Delhi, South Delhi, Noida" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item name="Full_Address" label="Business Office / Store Address">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: "status",
                label: "⚖️ Approvals & Visibility",
                children: (
                  <div>
                    <Row gutter={12}>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Admin_Approval" label="Vendor Verification Approval" valuePropName="checked">
                          <Switch checkedChildren="Approved Vendor" unCheckedChildren="Pending Verification" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="Active" label="Listing Live Visibility" valuePropName="checked">
                          <Switch checkedChildren="Live on Platform" unCheckedChildren="Listing Hidden" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
            ]}
          />
        </Form>
      </Modal>

      {/* EXTEND VENDOR VALIDITY MODAL */}
      <Modal
        title={`Extend Vendor Listing: ${validityService?.Service_Name || ""}`}
        open={Boolean(validityService)}
        onCancel={() => setValidityService(null)}
        onOk={handleExtendServiceValiditySubmit}
        confirmLoading={extendingServiceLoading}
        okText="Extend Listing"
      >
        <div style={{ marginBottom: 16 }}>
          <p><strong>Vendor:</strong> {validityService?.Service_Name}</p>
          <p><strong>Current Validity:</strong> {validityService?.Valid_Upto || "Standard"}</p>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Choose Listing Extension:</label>
          <Radio.Group value={serviceValidityDays} onChange={(e) => setServiceValidityDays(e.target.value)} buttonStyle="solid">
            <Radio.Button value={90}>+90 Days</Radio.Button>
            <Radio.Button value={180}>+180 Days</Radio.Button>
            <Radio.Button value={365}>+1 Full Year</Radio.Button>
          </Radio.Group>
        </div>
      </Modal>

      {/* MANUAL SUBSCRIPTION MODAL */}
      <Modal
        title="Activate Manual / Offline Membership Subscription"
        open={isManualTxnOpen}
        onCancel={() => setIsManualTxnOpen(false)}
        onOk={() => manualTxnForm.submit()}
        confirmLoading={manualTxnLoading}
        okText="Activate Subscription"
      >
        <Form form={manualTxnForm} layout="vertical" onFinish={handleSaveManualTxn}>
          <Form.Item name="User_id" label="Candidate User ID" rules={[{ required: true }]}>
            <Select placeholder="Select Candidate">
              {candidates.map((c) => (
                <Option key={c.id} value={c.User_id}>
                  {c.Full_Name} (#{c.User_id}) - {c.WP_Contact}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="Plan" label="Membership Plan" rules={[{ required: true }]}>
            <Select placeholder="Select Plan">
              {plansList.map((p) => (
                <Option key={p.id} value={p.Plan}>
                  {p.Plan} (₹{p.Amount} - {p.Validity} Days)
                </Option>
              ))}
              <Option value="VIP Lifetime Membership">VIP Lifetime Membership (Custom)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="Amount" label="Payment Amount Received (₹)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: "100%" }} placeholder="e.g. 500" />
          </Form.Item>
        </Form>
      </Modal>

      {/* WITHDRAWAL REVIEW MODAL */}
      <Modal
        title="Review Staff Payout Request"
        open={Boolean(reviewWithdrawalModal)}
        onCancel={() => {
          setReviewWithdrawalModal(null);
          setWithdrawalRemark("");
        }}
        footer={
          reviewWithdrawalModal ? [
            <Button key="cancel" onClick={() => { setReviewWithdrawalModal(null); setWithdrawalRemark(""); }}>Cancel</Button>,
            reviewWithdrawalModal.Status !== "Rejected" && (
              <Button
                key="reject"
                danger
                loading={withdrawalActionLoading}
                onClick={() => handleUpdateWithdrawalStatus(reviewWithdrawalModal.id, "Rejected")}
              >
                Reject &amp; Refund to Wallet
              </Button>
            ),
            reviewWithdrawalModal.Status !== "Approved" ? (
              <Button
                key="approve"
                type="primary"
                style={{ background: "#10b981", borderColor: "#10b981", fontWeight: 700 }}
                loading={withdrawalActionLoading}
                onClick={() => handleUpdateWithdrawalStatus(reviewWithdrawalModal.id, "Approved")}
              >
                Approve &amp; Mark Paid
              </Button>
            ) : (
              <Button
                key="update-remark"
                type="primary"
                style={{ background: "#3b82f6", borderColor: "#3b82f6", fontWeight: 700 }}
                loading={withdrawalActionLoading}
                onClick={() => handleUpdateWithdrawalStatus(reviewWithdrawalModal.id, "Approved")}
              >
                Update UTR / Remark
              </Button>
            ),
          ].filter(Boolean) : []
        }
      >
        {reviewWithdrawalModal && (() => {
          const r = reviewWithdrawalModal;
          const staffInfo = staffList.find((s) => String(s.Staff_id?.id || s.Staff_id) === String(r.Staff_id?.id || r.Staff_id));
          const staffName = r.staff_name || staffInfo?.Full_Name || "Staff Counselor";
          const staffContact = r.staff_contact || staffInfo?.WP_Contact || "";
          const bankName = r.staff_bank_name || staffInfo?.Bank_Name;
          const bankAcc = r.staff_bank_account || staffInfo?.Bank_Account_Number;
          const bankIfsc = r.staff_bank_ifsc || staffInfo?.Bank_IFSC_Code;
          const bankHolder = staffInfo?.Bank_Account_Holder_Name || staffName;
          const upiId = r.staff_upi_id || staffInfo?.UPI_ID;

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: 0, color: "var(--ap-text-main, #ffffff)", fontSize: 16 }}>{staffName}</h4>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                      <span>Staff ID: #{r.Staff_id}</span>
                      {staffContact && <span style={{ marginLeft: 8 }}>📞 {staffContact}</span>}
                    </div>
                  </div>
                  <Tag color={r.Status === "Approved" ? "success" : r.Status === "Rejected" ? "error" : "gold"} style={{ fontWeight: 800, fontSize: 12, padding: "3px 10px" }}>
                    {r.Status || "Pending"}
                  </Tag>
                </div>
              </div>

              <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#94a3b8", fontWeight: 700 }}>Requested Payout Amount:</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#10b981" }}>₹{Number(r.Amount || 0).toLocaleString("en-IN")}</span>
              </div>

              {/* Bank & UPI Details */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", marginBottom: 8 }}>
                  Payout Transfer Destination
                </div>
                {bankAcc ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 12 }}>
                    <div><span style={{ color: "#64748b" }}>Bank:</span> <strong style={{ color: "var(--ap-text-main, #ffffff)" }}>{bankName || "—"}</strong></div>
                    <div><span style={{ color: "#64748b" }}>Holder:</span> <strong style={{ color: "var(--ap-text-main, #ffffff)" }}>{bankHolder || "—"}</strong></div>
                    <div><span style={{ color: "#64748b" }}>A/C Number:</span> <strong style={{ color: "var(--ap-text-main, #ffffff)" }}>{bankAcc}</strong></div>
                    <div><span style={{ color: "#64748b" }}>IFSC:</span> <strong style={{ color: "var(--ap-text-main, #ffffff)" }}>{bankIfsc || "—"}</strong></div>
                  </div>
                ) : (
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>No bank account details registered on profile.</div>
                )}
                {upiId && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed rgba(255,255,255,0.1)", fontSize: 12 }}>
                    <span style={{ color: "#64748b" }}>UPI ID:</span> <strong style={{ color: "#34d399", marginLeft: 6 }}>{upiId}</strong>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700, color: "#e2e8f0" }}>
                  Admin UTR / Bank Reference Number / Remark:
                </label>
                <TextArea
                  rows={2}
                  placeholder="Enter IMPS/NEFT/UPI UTR number (e.g. UTR-4938204820)..."
                  value={withdrawalRemark}
                  onChange={(e) => setWithdrawalRemark(e.target.value)}
                />
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* CANDIDATE PROFILE BIODATA & PROFILE PREVIEW MODAL (IDENTICAL TO USERPANEL) */}
      <Modal
        title={null}
        open={isCandidateModalOpen}
        onCancel={() => setIsCandidateModalOpen(false)}
        footer={null}
        width={780}
        centered
        style={{ maxWidth: "95vw" }}
        styles={{ body: { padding: "24px", maxHeight: "88vh", overflowY: "auto", background: "#fffdfa", borderRadius: "16px" } }}
      >
        {selectedCandidate && (() => {
          const m = selectedCandidate;
          const candId = m.User_id || m.id;
          const candName = m.Full_Name || m.firstname || m.first_name || "Candidate";
          const candGender = m.Gender || m.gender || "Candidate";
          const candCaste = m.Caste || m.caste || "Community";
          const candGotra = m.Gotra || m.gotra || "";
          const candReligion = m.Religion || m.religion || "Hindu";
          const candAge = m.Age || m.age;
          const candDob = m.DOB || m.dob ? String(m.DOB || m.dob).slice(0, 10) : "";
          const candHeight = m.Height || m.height;
          const candWeight = m.Weight || m.weight;
          const candColor = m.Color || m.color || m.Complexion || m.complexion || "";
          const candMarital = m.Marrige_status || m.marrige_status || "Never Married";
          const candMotherTongue = m.Mother_tongue || m.mother_tongue || "Hindi";
          const candDisability = m.Disability !== undefined && m.Disability !== null && m.Disability !== ""
            ? (m.Disability === true || m.Disability === "Yes" ? "Yes (Physically Challenged)" : m.Disability)
            : "None";
          const isManglik = m.Manglik === true || m.Manglik === "Yes" || m.Manglik === "true" || String(m.Manglik).toLowerCase() === "yes";
          const candManglik = isManglik ? "Yes (Manglik / मांगलिक)" : "No (Non-Manglik / अमांगलिक)";
          const candDiet = m.Vegeterian || m.vegeterian || "Vegetarian";
          const candQual = m.Qualification || m.qualification || "";
          const candProf = m.Profession || m.profession || "";
          const candJobType = m.Job_type || m.job_type || "Private Sector";
          const candSalary = m.Salary || m.salary;
          const candFatherName = m.Father_name || m.father_name || "";
          const candFatherAge = m.Father_Age || m.father_age || "";
          const candFatherProf = m.Father_Profession || m.father_profession || "";
          const candMotherName = m.Mother_name || m.mother_name || "";
          const candMotherAge = m.Mother_Age || m.mother_age || "";
          const candMotherProf = m.Mother_Profession || m.mother_profession || "";
          const candBrothers = m.Brothers || m.brothers || "0";
          const candBrothersMarried = m.Brothers_marrige || m.brothers_marrige || "0";
          const candSisters = m.Sisters || m.sisters || "0";
          const candSistersMarried = m.Sisters_marrige || m.sisters_marrige || "0";
          const candHouse = m.House || m.house || "Own House";
          const candCity = m.City || m.city || "";
          const candDistrict = m.District || m.district || "";
          const candState = m.State || m.state || "";
          const candCountry = m.Country || m.country || "India";
          const candAddress = m.Full_Address || m.full_address || "";
          const candContact = m.WP_Contact || m.contact || m.Contact || "";
          const candContactRelation = m.WP_Contact_Relation || m.wp_contact_relation || "";
          const candContactName = m.Wp_Contact_Name || m.wp_contact_name || "";
          const candContactInfo = getContactRelationDisplay(
            candContactRelation,
            candContactName,
            candContact,
            candName,
            candFatherName,
            candMotherName
          );
          const candAltContact = m.Alt_Contact || m.alt_contact || "";
          const candAltContactRelation = m.Alt_Contact_Relation || m.alt_contact_relation || "";
          const candAltContactName = m.Alt_Contact_Name || m.alt_contact_name || "";
          const candAltContactInfo = getContactRelationDisplay(
            candAltContactRelation,
            candAltContactName,
            candAltContact,
            candName,
            candFatherName,
            candMotherName
          );
          const candEmail = m.Email || m.email || "";
          const candPic = getMediaUrl(m.Profile_Pic || m.pic) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";
          const candRefer = m.Refer || m.refer || "";
          const candCreateDate = m.Create_date || m.create_date || "";

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
                {/* Profile Image with Big View Lightbox Preview Feature */}
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
                          <div style={{ fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", gap: 3, color: "var(--ap-text-main, #ffffff)" }}>
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
                    {selectedCandidate.Active !== false ? (
                      <Tag color="success" style={{ borderRadius: "14px", fontWeight: "800" }}>Active Profile</Tag>
                    ) : (
                      <Tag color="error" style={{ borderRadius: "14px", fontWeight: "800" }}>Disabled / Private</Tag>
                    )}
                  </div>

                  <div style={{ color: "#be123c", fontWeight: "700", fontSize: "14px", marginTop: "4px" }}>
                    {candCaste} {candGotra ? `• Gotra: ${candGotra}` : ""} • {candReligion}
                  </div>

                  <div style={{ color: "#64748b", fontSize: "13px", marginTop: "2px" }}>
                    {[candCity, candDistrict, candState, candCountry].filter(Boolean).join(", ")}
                  </div>
                </div>

                {/* Top Action Strip */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  {candContact && (
                    <>
                      <a
                        href={`https://wa.me/91${String(candContact).replace(/\D/g, "")}?text=${encodeURIComponent(
                          candContactInfo.relation === "Self"
                            ? `Hello ${candName}! Contacting regarding your matrimonial profile on Vaivaheek Manch.`
                            : `Hello! Contacting regarding ${candName}'s matrimonial profile on Vaivaheek Manch.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#25d366",
                          color: "var(--ap-text-main, #ffffff)",
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
                          color: "var(--ap-text-main, #ffffff)",
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
                  <Button
                    icon={<CopyOutlined />}
                    style={{
                      background: "#ffffff",
                      borderColor: "#fecdd3",
                      color: "#881337",
                      borderRadius: "14px",
                      fontWeight: "700",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                    }}
                    onClick={() => {
                      const idText = `Candidate #${selectedCandidate.User_id || selectedCandidate.id}: ${selectedCandidate.Full_Name || ""} (${selectedCandidate.Gender || ""}, ${selectedCandidate.Age ? `${selectedCandidate.Age} yrs` : ""}, ${selectedCandidate.Caste || ""}, ${selectedCandidate.City || selectedCandidate.District || ""})`;
                      navigator.clipboard?.writeText(idText);
                      message.success("📋 Candidate profile summary copied to clipboard!");
                    }}
                  >
                    Copy Info
                  </Button>
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
                    <span>👤</span> 1. Personal &amp; Physical Details (व्यक्तिगत एवं शारीरिक विवरण)
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
                      <strong style={{ color: "#1e293b" }}>{formatDate(candDob) || "Not specified"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Age:</span>
                      <strong style={{ color: "#1e293b" }}>{candAge ? `${candAge} yrs` : "N/A"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Height:</span>
                      <strong style={{ color: "#1e293b" }}>{candHeight ? `${candHeight}` : "Not specified"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Weight:</span>
                      <strong style={{ color: "#1e293b" }}>{candWeight ? `${candWeight}` : "Not specified"}</strong>
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
                    <span>🕉️</span> 2. Community &amp; Horoscope Details (धार्मिक एवं कुंडली विवरण)
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
                      <strong style={{ color: isManglik ? "#b91c1c" : "#15803d" }}>{candManglik}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Diet Preference:</span>
                      <strong style={{ color: "#1e293b" }}>{candDiet}</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Education & Career */}
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
                    <span>💼</span> 3. Education &amp; Career (शिक्षा एवं व्यवसाय)
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
                      <span style={{ color: "#64748b", display: "block" }}>Annual Income / Package:</span>
                      <strong style={{ color: "#0f766e" }}>{candJobType === "Not Working" || Number(candSalary) === 0 ? "Not Applicable (Not Working)" : (candSalary ? `₹${Number(candSalary).toLocaleString("en-IN")}/yr` : "Not specified")}</strong>
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
                    <span>📍</span> 5. Location &amp; Contact Details (निवास एवं संपर्क विवरण)
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

                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={{ color: "#64748b", display: "block" }}>Full Residential Address:</span>
                      <strong style={{ color: "#1e293b", fontSize: "14px" }}>
                        {candAddress ? candAddress : [candCity, candDistrict, candState].filter(Boolean).join(", ") || "Address on record"}
                      </strong>
                    </div>

                    <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "12px" }}>
                      {/* WhatsApp / Primary Contact with Call & WhatsApp Action Buttons */}
                      <div
                        style={{
                          background: "#f0fdf4",
                          padding: "14px 18px",
                          borderRadius: "14px",
                          border: "1px solid #bbf7d0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <span style={{ color: "#166534", display: "block", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            WhatsApp / Primary Contact:
                          </span>
                          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap", marginTop: "3px" }}>
                            <strong style={{ color: "#14532d", fontSize: "17px", letterSpacing: "0.5px" }}>
                              {candContact ? `+91 ${candContact}` : "Not provided"}
                            </strong>
                          </div>
                          {/* Contact Relation Badge */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "5px" }}>
                            <Tag
                              color={candContactInfo.relation === "Self" ? "success" : "processing"}
                              style={{ borderRadius: "8px", fontWeight: "700", padding: "2px 10px", fontSize: "12px", margin: 0 }}
                            >
                              👤 Number Belongs To: {candContactInfo.relationLabel}
                            </Tag>
                            <span style={{ color: "#166534", fontSize: "13.5px", fontWeight: "700" }}>
                              Contact Person: {candContactInfo.personName || candName} {candContactInfo.relation === "Self" ? "(Candidate स्वयं)" : ""}
                            </span>
                          </div>
                        </div>
                        {candContact && (
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <a
                              href={`tel:${candContact}`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "#0284c7",
                                color: "var(--ap-text-main, #ffffff)",
                                borderRadius: "12px",
                                fontWeight: "700",
                                padding: "7px 16px",
                                fontSize: "13px",
                                textDecoration: "none",
                                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)",
                              }}
                            >
                              <PhoneOutlined /> Call
                            </a>
                            <a
                              href={`https://wa.me/91${String(candContact).replace(/\D/g, "")}?text=${encodeURIComponent(
                                candContactInfo.relation === "Self"
                                  ? `Hello ${candName}! Contacting regarding your matrimonial profile on Vaivaheek Manch.`
                                  : `Hello! Contacting regarding ${candName}'s matrimonial profile on Vaivaheek Manch.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "#25d366",
                                color: "var(--ap-text-main, #ffffff)",
                                borderRadius: "12px",
                                fontWeight: "700",
                                padding: "7px 16px",
                                fontSize: "13px",
                                textDecoration: "none",
                                boxShadow: "0 3px 10px rgba(37, 211, 102, 0.3)",
                              }}
                            >
                              <WhatsAppOutlined /> WhatsApp
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Alternate Contact */}
                      {candAltContact ? (
                        <div
                          style={{
                            background: "#f0f9ff",
                            padding: "14px 18px",
                            borderRadius: "14px",
                            border: "1px solid #bae6fd",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "12px",
                          }}
                        >
                          <div>
                            <span style={{ color: "#0369a1", display: "block", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Alternate Contact:
                            </span>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap", marginTop: "3px" }}>
                              <strong style={{ color: "#0c4a6e", fontSize: "16px", letterSpacing: "0.5px" }}>
                                +91 {candAltContact}
                              </strong>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "5px" }}>
                              <Tag
                                color="cyan"
                                style={{ borderRadius: "8px", fontWeight: "700", padding: "2px 10px", fontSize: "12px", margin: 0 }}
                              >
                                👤 Number Belongs To: {candAltContactInfo.relationLabel}
                              </Tag>
                              <span style={{ color: "#0369a1", fontSize: "13.5px", fontWeight: "700" }}>
                                Contact Person: {candAltContactInfo.personName || candName}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <a
                              href={`tel:${candAltContact}`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "#0284c7",
                                color: "var(--ap-text-main, #ffffff)",
                                borderRadius: "12px",
                                fontWeight: "700",
                                padding: "7px 16px",
                                fontSize: "13px",
                                textDecoration: "none",
                                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)",
                              }}
                            >
                              <PhoneOutlined /> Call
                            </a>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Email Address:</span>
                      <strong style={{ color: "#1e293b", fontSize: "14px" }}>
                        {candEmail || "Not specified"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 6. Administrative & Membership Details */}
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
                    <span>🤝</span> 6. Administrative &amp; Membership Details (प्रशासनिक एवं सदस्यता विवरण)
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px 18px", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Candidate Account ID:</span>
                      <strong style={{ color: "#be123c" }}>#{candId}</strong>
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
                        <strong style={{ color: "#1e293b" }}>{formatDate(candCreateDate)}</strong>
                      </div>
                    )}
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Membership Validity:</span>
                      <div style={{ marginTop: 2 }}>
                        {selectedCandidate.Valid_Upto ? (
                          <Tag color="cyan" style={{ fontWeight: 800 }}>{selectedCandidate.Valid_Upto}</Tag>
                        ) : (
                          <Tag color="default">Expired / Free</Tag>
                        )}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block" }}>Account Visibility Status:</span>
                      <div style={{ marginTop: 2 }}>
                        <Switch
                          checked={selectedCandidate.Active !== false}
                          checkedChildren="Active"
                          unCheckedChildren="Disabled"
                          onChange={() => handleToggleCandidateActive(selectedCandidate)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Actions Toolbar */}
              <div
                style={{
                  marginTop: "22px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                  borderTop: "1.5px solid #ffe4e6",
                  paddingTop: "16px",
                }}
              >
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <Button
                    style={{
                      background: "#0284c7",
                      borderColor: "#0284c7",
                      color: "var(--ap-text-main, #ffffff)",
                      borderRadius: "14px",
                      fontWeight: "700",
                      height: "38px",
                      padding: "0 18px",
                    }}
                    onClick={() => {
                      setValidityModalCandidate(selectedCandidate);
                      setExtensionDays(30);
                    }}
                  >
                    + Extend Plan Validity
                  </Button>
                  <Button
                    icon={<EditOutlined />}
                    style={{
                      borderRadius: "14px",
                      fontWeight: "700",
                      height: "38px",
                      padding: "0 18px",
                    }}
                    onClick={() => {
                      handleOpenEditCandidate(selectedCandidate);
                      setIsCandidateModalOpen(false);
                    }}
                  >
                    Edit Bio
                  </Button>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Button
                    onClick={() => setIsCandidateModalOpen(false)}
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

      <Modal
        title="Staff Counselor KYC & Bank Verification"
        open={isStaffModalOpen}
        onCancel={() => setIsStaffModalOpen(false)}
        footer={[<Button key="close" onClick={() => setIsStaffModalOpen(false)}>Close</Button>]}
        width={650}
      >
        {selectedStaff && (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}><strong>Full Name:</strong> {selectedStaff.Full_Name}</Col>
            <Col xs={24} sm={12}><strong>Contact:</strong> {selectedStaff.WP_Contact}</Col>
            <Col xs={24} sm={12}><strong>Aadhaar Number:</strong> {selectedStaff.Adhar_Number || "—"}</Col>
            <Col xs={24} sm={12}><strong>PAN Number:</strong> {selectedStaff.PAN_Number || "—"}</Col>
            <Col xs={24} sm={12}><strong>Bank Name:</strong> {selectedStaff.Bank_Name || "—"}</Col>
            <Col xs={24} sm={12}><strong>Account Number:</strong> {selectedStaff.Bank_Account_Number || "—"}</Col>
            <Col xs={24} sm={12}><strong>IFSC Code:</strong> {selectedStaff.Bank_IFSC_Code || "—"}</Col>
            <Col xs={24} sm={12}><strong>UPI ID:</strong> {selectedStaff.UPI_ID || "—"}</Col>
            <Col xs={24} sm={12}><strong>Wallet Balance:</strong> ₹{selectedStaff.Amount || 0}</Col>
            <Col xs={24} sm={12}><strong>Referral Code:</strong> {selectedStaff.Refer || "—"}</Col>
            <Col span={24}>
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                {selectedStaff.Adhar_Image && <div><div>Aadhaar:</div><Image src={getMediaUrl(selectedStaff.Adhar_Image)} width={100} height={70} style={{ objectFit: "cover" }} /></div>}
                {selectedStaff.PAN_Image && <div><div>PAN:</div><Image src={getMediaUrl(selectedStaff.PAN_Image)} width={100} height={70} style={{ objectFit: "cover" }} /></div>}
                {selectedStaff.Bank_Passbook_Image && <div><div>Passbook:</div><Image src={getMediaUrl(selectedStaff.Bank_Passbook_Image)} width={100} height={70} style={{ objectFit: "cover" }} /></div>}
              </div>
            </Col>
          </Row>
        )}
      </Modal>

      {/* COMPREHENSIVE SERVICE USER & VENDOR DETAILS MODAL */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingRight: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShopOutlined style={{ fontSize: 22, color: "#10b981" }} />
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: "var(--ap-text-main, #ffffff)" }}>
                  {selectedService?.Service_Name || "Wedding Service Vendor Partner"}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  Listing #{selectedService?.id} • Category: {selectedService?.Service_Type || "General"}
                </div>
              </div>
            </div>
            {selectedService && (
              <Space>
                <Tag color={selectedService.Admin_Approval ? "success" : "gold"}>
                  {selectedService.Admin_Approval ? "✓ Verified & Approved" : "⏳ Pending Approval"}
                </Tag>
                <Tag color={selectedService.Active !== false ? "blue" : "default"}>
                  {selectedService.Active !== false ? "Active Listing" : "Inactive"}
                </Tag>
              </Space>
            )}
          </div>
        }
        open={isServiceModalOpen}
        onCancel={() => setIsServiceModalOpen(false)}
        width={940}
        styles={{ body: { padding: "16px 20px 24px", maxHeight: "80vh", overflowY: "auto" } }}
        footer={
          selectedService ? [
            <div key="footer-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <Space wrap>
                <Button
                  type={selectedService.Admin_Approval ? "default" : "primary"}
                  style={{
                    background: selectedService.Admin_Approval ? "rgba(245, 158, 11, 0.15)" : "#10b981",
                    borderColor: selectedService.Admin_Approval ? "#f59e0b" : "#10b981",
                    color: selectedService.Admin_Approval ? "#fbbf24" : "#ffffff",
                    fontWeight: 800,
                  }}
                  onClick={() => handleApproveService(selectedService.id, !selectedService.Admin_Approval)}
                >
                  {selectedService.Admin_Approval ? "Revoke Approval" : "✓ Approve & Publish Vendor"}
                </Button>
                <Button
                  icon={<ClockCircleFilled />}
                  style={{ background: "rgba(59, 130, 246, 0.15)", borderColor: "#3b82f6", color: "#60a5fa", fontWeight: 700 }}
                  onClick={() => {
                    setValidityService(selectedService);
                    setServiceValidityDays(365);
                  }}
                >
                  + Extend Validity (1 Yr)
                </Button>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    handleOpenEditService(selectedService);
                    setIsServiceModalOpen(false);
                  }}
                >
                  Edit Profile
                </Button>
              </Space>
              <Button onClick={() => setIsServiceModalOpen(false)}>Close</Button>
            </div>,
          ] : [
            <Button key="close" onClick={() => setIsServiceModalOpen(false)}>Close</Button>,
          ]
        }
      >
        {selectedService && (
          <div>
            {/* Top Identity Hero Banner */}
            <div className="ap-service-dossier-hero">
              <div className="ap-service-hero-identity">
                {selectedService.Picture ? (
                  <Image
                    src={getMediaUrl(selectedService.Picture)}
                    preview={false}
                    className="ap-service-hero-avatar"
                    fallback="https://via.placeholder.com/72"
                  />
                ) : (
                  <div className="ap-service-card-avatar-fallback" style={{ width: 72, height: 72, fontSize: 32 }}>
                    <ShopOutlined />
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: "var(--ap-text-main, #ffffff)", margin: 0 }}>
                    {selectedService.Service_Name || "Wedding Service Vendor"}
                  </h3>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                    <span>📍 {selectedService.City || "—"}{selectedService.District ? `, ${selectedService.District}` : ""}{selectedService.State ? `, ${selectedService.State}` : ""}</span>
                    <span style={{ margin: "0 8px" }}>•</span>
                    <span>📞 {selectedService.WP_Contact || "—"}</span>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Tag color="cyan">User Account #{selectedServiceUser?.id || selectedService.Service_id?.id || selectedService.Service_id || "—"}</Tag>
                    <Tag color="purple">Category: {selectedService.Service_Type || "General"}</Tag>
                    {selectedService.Valid_Upto && <Tag color="green">Valid Upto: {selectedService.Valid_Upto}</Tag>}
                  </div>
                </div>
              </div>

              <div className="ap-service-hero-stats">
                <div className="ap-service-hero-stat-pill">
                  <span className="ap-service-hero-stat-label">Starting Price</span>
                  <span className="ap-service-hero-stat-val" style={{ color: "#f59e0b" }}>
                    ₹{Number(selectedService.Service_Price || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="ap-service-hero-stat-pill">
                  <span className="ap-service-hero-stat-label">Their Services</span>
                  <span className="ap-service-hero-stat-val">
                    {selectedServiceOfferings.length}
                  </span>
                </div>
                <div className="ap-service-hero-stat-pill">
                  <span className="ap-service-hero-stat-label">Total Transacted</span>
                  <span className="ap-service-hero-stat-val" style={{ color: "#10b981" }}>
                    ₹{selectedServiceTxnStats.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Multi-Tab Navigation */}
            <Tabs
              activeKey={serviceDetailTab}
              onChange={setServiceDetailTab}
              items={[
                {
                  key: "overview",
                  label: (
                    <span>
                      <ShopOutlined /> Partner Profile &amp; Contact
                    </span>
                  ),
                  children: (
                    <div>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <div className="ap-service-section-box">
                            <div className="ap-service-section-title">
                              <UserOutlined /> Business &amp; Account Identity
                            </div>
                            <div className="ap-service-info-row">
                              <span className="ap-service-info-key">Business Name</span>
                              <span className="ap-service-info-value">{selectedService.Service_Name || "—"}</span>
                            </div>
                            <div className="ap-service-info-row">
                              <span className="ap-service-info-key">Service Category</span>
                              <span className="ap-service-info-value"><Tag color="blue">{selectedService.Service_Type || "General"}</Tag></span>
                            </div>
                            <div className="ap-service-info-row">
                              <span className="ap-service-info-key">Base Package Price</span>
                              <span className="ap-service-info-value" style={{ color: "#f59e0b", fontWeight: 800 }}>
                                ₹{Number(selectedService.Service_Price || 0).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="ap-service-info-row">
                              <span className="ap-service-info-key">User Account ID</span>
                              <span className="ap-service-info-value">
                                #{selectedServiceUser?.id || selectedService.Service_id?.id || selectedService.Service_id || "—"}
                              </span>
                            </div>
                            <div className="ap-service-info-row">
                              <span className="ap-service-info-key">Login Mobile</span>
                              <span className="ap-service-info-value">{selectedServiceUser?.Contact || selectedService.WP_Contact || "—"}</span>
                            </div>
                            <div className="ap-service-info-row">
                              <span className="ap-service-info-key">Referred By</span>
                              <span className="ap-service-info-value">
                                {selectedServiceUser?.Refered_By ? `Staff / Partner #${selectedServiceUser.Refered_By}` : "Direct Platform Registration"}
                              </span>
                            </div>
                          </div>
                        </Col>

                        <Col xs={24} md={12}>
                          <div className="ap-service-section-box">
                            <div className="ap-service-section-title">
                              <PhoneOutlined /> Contact &amp; Geographic Coverage
                            </div>
                            <div className="ap-service-info-row">
                              <span className="ap-service-info-key">WhatsApp Phone</span>
                              <span className="ap-service-info-value">
                                {selectedService.WP_Contact || "—"}
                                {selectedService.WP_Contact && (
                                  <a
                                    href={`https://wa.me/91${selectedService.WP_Contact.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ marginLeft: 8, color: "#25d366", fontSize: 14 }}
                                    title="Open WhatsApp Chat"
                                  >
                                    <WhatsAppOutlined /> Chat
                                  </a>
                                )}
                              </span>
                            </div>
                            <div className="ap-service-info-row">
                              <span className="ap-service-info-key">Alternate Contact</span>
                              <span className="ap-service-info-value">{selectedService.Alt_Contact || "—"}</span>
                            </div>
                            <div className="ap-service-info-row">
                              <span className="ap-service-info-key">City / District</span>
                              <span className="ap-service-info-value">{selectedService.City || "—"}, {selectedService.District || "—"}</span>
                            </div>
                            <div className="ap-service-info-row">
                              <span className="ap-service-info-key">State / Country</span>
                              <span className="ap-service-info-value">{selectedService.State || "—"}, {selectedService.Country || "India"}</span>
                            </div>
                            <div className="ap-service-info-row">
                              <span className="ap-service-info-key">Street Address</span>
                              <span className="ap-service-info-value">{selectedService.Full_Address || "—"}</span>
                            </div>
                            <div className="ap-service-info-row">
                              <span className="ap-service-info-key">Available Zones</span>
                              <span className="ap-service-info-value">
                                {Array.isArray(selectedService.Available_Zone)
                                  ? selectedService.Available_Zone.join(", ")
                                  : (selectedService.Available_Zone || "All Local Areas")}
                              </span>
                            </div>
                          </div>
                        </Col>

                        <Col span={24}>
                          <div className="ap-service-section-box">
                            <div className="ap-service-section-title">
                              <CalendarOutlined /> Dates, Listing Validity &amp; Approval Status
                            </div>
                            <Row gutter={[16, 12]}>
                              <Col xs={24} sm={8}>
                                <div className="ap-service-info-row">
                                  <span className="ap-service-info-key">Admin Approval:</span>
                                  <span className="ap-service-info-value">
                                    <Tag color={selectedService.Admin_Approval ? "success" : "gold"}>
                                      {selectedService.Admin_Approval ? "✓ Verified & Approved" : "⏳ Pending Approval"}
                                    </Tag>
                                  </span>
                                </div>
                              </Col>
                              <Col xs={24} sm={8}>
                                <div className="ap-service-info-row">
                                  <span className="ap-service-info-key">Listing Status:</span>
                                  <span className="ap-service-info-value">
                                    <Tag color={selectedService.Active !== false ? "green" : "default"}>
                                      {selectedService.Active !== false ? "Active (Visible)" : "Disabled (Hidden)"}
                                    </Tag>
                                  </span>
                                </div>
                              </Col>
                              <Col xs={24} sm={8}>
                                <div className="ap-service-info-row">
                                  <span className="ap-service-info-key">Listing Validity:</span>
                                  <span className="ap-service-info-value">
                                    {selectedService.Valid_Upto ? (
                                      <Tag color="cyan">{selectedService.Valid_Upto}</Tag>
                                    ) : (
                                      <Tag>Standard</Tag>
                                    )}
                                  </span>
                                </div>
                              </Col>
                            </Row>
                          </div>
                        </Col>

                        <Col span={24}>
                          <div className="ap-service-section-box">
                            <div className="ap-service-section-title">
                              <ShopOutlined /> Business Overview &amp; Description
                            </div>
                            <div style={{ color: "#e2e8f0", fontSize: 13, lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                              {selectedService.Service_Description || "No detailed business overview description has been entered for this service vendor partner yet."}
                            </div>
                          </div>
                        </Col>

                        {selectedService.Picture && (
                          <Col span={24}>
                            <div className="ap-service-section-box">
                              <div className="ap-service-section-title">
                                <EyeOutlined /> Visual Portfolio &amp; Photos
                              </div>
                              <Image.PreviewGroup>
                                <Space size={16} wrap>
                                  <Image
                                    src={getMediaUrl(selectedService.Picture)}
                                    width={120}
                                    height={120}
                                    style={{ objectFit: "cover", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }}
                                  />
                                </Space>
                              </Image.PreviewGroup>
                            </div>
                          </Col>
                        )}
                      </Row>
                    </div>
                  ),
                },
                {
                  key: "services",
                  label: (
                    <span>
                      <AppstoreOutlined /> Their Services ({selectedServiceOfferings.length})
                    </span>
                  ),
                  children: (
                    <div>
                      <div style={{ marginBottom: 14, color: "#94a3b8", fontSize: 13 }}>
                        All wedding service listings and catalog packages registered under this vendor partner:
                      </div>

                      <Table scroll={{ x: "max-content" }}
                        dataSource={selectedServiceOfferings}
                        rowKey={(s) => s.id}
                        pagination={false}
                        columns={[
                          {
                            title: "Service Package",
                            render: (_, s) => (
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <Image
                                  src={getMediaUrl(s.Picture)}
                                  fallback="https://via.placeholder.com/40"
                                  width={40}
                                  height={40}
                                  style={{ borderRadius: 8, objectFit: "cover" }}
                                />
                                <div>
                                  <div style={{ fontWeight: 800, color: "var(--ap-text-main, #ffffff)" }}>
                                    {s.Service_Name || "Primary Service Offering"}
                                  </div>
                                  <div style={{ fontSize: 11, color: "#94a3b8" }}>
                                    Listing ID: #{s.id}
                                  </div>
                                </div>
                              </div>
                            ),
                          },
                          {
                            title: "Category",
                            dataIndex: "Service_Type",
                            render: (type) => <Tag color="blue">{type || "General"}</Tag>,
                          },
                          {
                            title: "Base Price",
                            render: (_, s) => (
                              <span style={{ fontWeight: 800, color: "#f59e0b" }}>
                                ₹{Number(s.Service_Price || 0).toLocaleString("en-IN")}
                              </span>
                            ),
                          },
                          {
                            title: "Listing Validity",
                            render: (_, s) => (
                              s.Valid_Upto ? <Tag color="green">{s.Valid_Upto}</Tag> : <Tag>Standard</Tag>
                            ),
                          },
                          {
                            title: "Admin Approval",
                            render: (_, s) => (
                              <Tag color={s.Admin_Approval ? "success" : "gold"}>
                                {s.Admin_Approval ? "✓ Verified" : "Pending"}
                              </Tag>
                            ),
                          },
                          {
                            title: "Active",
                            render: (_, s) => (
                              <Tag color={s.Active !== false ? "green" : "default"}>
                                {s.Active !== false ? "Active" : "Disabled"}
                              </Tag>
                            ),
                          },
                          {
                            title: "Actions",
                            render: (_, s) => (
                              <Space>
                                <Button
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() => {
                                    handleOpenEditService(s);
                                    setIsServiceModalOpen(false);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  type={s.Admin_Approval ? "default" : "primary"}
                                  style={{
                                    background: s.Admin_Approval ? "rgba(245, 158, 11, 0.15)" : "#10b981",
                                    borderColor: s.Admin_Approval ? "#f59e0b" : "#10b981",
                                    color: s.Admin_Approval ? "#fbbf24" : "#ffffff",
                                    fontWeight: 700,
                                  }}
                                  onClick={() => handleApproveService(s.id, !s.Admin_Approval)}
                                >
                                  {s.Admin_Approval ? "Revoke" : "Approve"}
                                </Button>
                              </Space>
                            ),
                          },
                        ]}
                      />
                    </div>
                  ),
                },
                {
                  key: "transactions",
                  label: (
                    <span>
                      <CreditCardOutlined /> Their Transactions ({selectedServiceTxns.length})
                    </span>
                  ),
                  children: (
                    <div>
                      {/* Financial KPI Summary Chips */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Total Volume</div>
                          <div style={{ fontSize: 18, fontWeight: 900, color: "#10b981", marginTop: 4 }}>
                            ₹{selectedServiceTxnStats.total.toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{selectedServiceTxns.length} Total Transactions</div>
                        </div>

                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Successful Payments</div>
                          <div style={{ fontSize: 18, fontWeight: 900, color: "#34d399", marginTop: 4 }}>
                            ₹{selectedServiceTxnStats.successTotal.toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{selectedServiceTxnStats.successCount} Settled Invoices</div>
                        </div>

                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Pending Status</div>
                          <div style={{ fontSize: 18, fontWeight: 900, color: "#fbbf24", marginTop: 4 }}>
                            {selectedServiceTxnStats.pendingCount}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Awaiting Payment Confirmation</div>
                        </div>
                      </div>

                      {selectedServiceTxns.length === 0 ? (
                        <div style={{ padding: "32px 16px", textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>💳</div>
                          <div style={{ color: "#0f172a", fontWeight: 700 }}>No transaction records found for this vendor yet</div>
                          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
                            When this service vendor pays listing fees or package recharges, they will appear here automatically.
                          </div>
                        </div>
                      ) : (
                        <Table scroll={{ x: "max-content" }}
                          dataSource={selectedServiceTxns}
                          rowKey={(t) => t.id}
                          pagination={{ pageSize: 8 }}
                          columns={[
                            {
                              title: "Transaction Ref",
                              render: (_, t) => (
                                <div>
                                  <strong>#TXN-{t.id}</strong>
                                  {t.Txn_id && <div style={{ fontSize: 10, color: "#64748b" }}>{t.Txn_id}</div>}
                                </div>
                              ),
                            },
                            {
                              title: "Listing Offering",
                              render: (_, t) => (
                                <div>
                                  <div style={{ fontWeight: 700, color: "var(--ap-text-main, #ffffff)" }}>
                                    {t.service_title || selectedService.Service_Name || `Service #${t.Service_id}`}
                                  </div>
                                  {t.service_type && <div style={{ fontSize: 11, color: "#94a3b8" }}>{t.service_type}</div>}
                                </div>
                              ),
                            },
                            {
                              title: "Amount",
                              render: (_, t) => (
                                <span style={{ fontSize: 15, fontWeight: 900, color: "#10b981" }}>
                                  ₹{Number(t.Amount || 0).toLocaleString("en-IN")}
                                </span>
                              ),
                            },
                            {
                              title: "Status",
                              render: (_, t) => {
                                const st = t.Status || "Success";
                                return (
                                  <Tag color={st === "Success" ? "success" : st === "Pending" ? "gold" : "error"}>
                                    {st}
                                  </Tag>
                                );
                              },
                            },
                            {
                              title: "Date",
                              dataIndex: "Create_date",
                              render: (d) => d || "—",
                            },
                            {
                              title: "Invoiced User",
                              render: (_, t) => (
                                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                                  User #{t.User_id?.id || t.User_id || selectedServiceUser?.id || "—"}
                                </span>
                              ),
                            },
                          ]}
                        />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* SERVICE USER PARTNER DOSSIER & SERVICES LIST MODAL             */}
      {/* ============================================================== */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, paddingRight: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ap-text-main, #ffffff)", fontSize: 20 }}>
                <ShopOutlined />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: "var(--ap-text-main, #ffffff)" }}>
                  Service Partner • {selectedServiceUserModal?.username || "Vendor Account"}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  Account ID: #{selectedServiceUserModal?.id || "—"} • Role: Service Partner
                </div>
              </div>
            </div>
            {selectedServiceUserModal && (
              <Space>
                <Tag color={selectedServiceUserModal.is_active ? "success" : "error"}>
                  {selectedServiceUserModal.is_active ? "✓ Active Account" : "Disabled Account"}
                </Tag>
                <Tag color="purple">
                  {selectedServiceUserModal.servicesCount} {selectedServiceUserModal.servicesCount === 1 ? "Service" : "Services"}
                </Tag>
              </Space>
            )}
          </div>
        }
        open={isServiceUserModalOpen}
        onCancel={() => setIsServiceUserModalOpen(false)}
        width={960}
        styles={{ body: { padding: "16px 20px 24px", maxHeight: "80vh", overflowY: "auto" } }}
        footer={[
          <div key="su-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <Space wrap>
              {selectedServiceUserModal && (
                <Button
                  style={{
                    background: selectedServiceUserModal.is_active ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                    borderColor: selectedServiceUserModal.is_active ? "#ef4444" : "#10b981",
                    color: selectedServiceUserModal.is_active ? "#f87171" : "#34d399",
                    fontWeight: 700,
                  }}
                  onClick={() => {
                    if (selectedServiceUserModal.user) {
                      handleToggleUserActive(selectedServiceUserModal.user);
                      setSelectedServiceUserModal((prev) => prev ? { ...prev, is_active: !prev.is_active } : null);
                    }
                  }}
                >
                  {selectedServiceUserModal.is_active ? "Deactivate Account" : "Activate Account"}
                </Button>
              )}
              <Button
                type="primary"
                style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                icon={<UserAddOutlined />}
                onClick={() => {
                  handleOpenCreateService();
                  setIsServiceUserModalOpen(false);
                }}
              >
                + Register New Service for Partner
              </Button>
            </Space>
            <Button onClick={() => setIsServiceUserModalOpen(false)}>Close</Button>
          </div>
        ]}
      >
        {selectedServiceUserModal && (
          <div>
            {/* Top Identity Hero Banner */}
            <div className="ap-service-dossier-hero">
              <div className="ap-service-hero-identity">
                <div className="ap-service-card-avatar-fallback" style={{ width: 68, height: 68, fontSize: 30, background: "rgba(245, 158, 11, 0.2)", color: "#f59e0b" }}>
                  <ShopOutlined />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: "var(--ap-text-main, #ffffff)", margin: 0 }}>
                    {selectedServiceUserModal.username}
                  </h3>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                    <span>📞 +91 {selectedServiceUserModal.phone || "No Contact"}</span>
                    {selectedServiceUserModal.phone && (
                      <a
                        href={`https://wa.me/91${selectedServiceUserModal.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginLeft: 8, color: "#25d366", fontWeight: 700 }}
                      >
                        <WhatsAppOutlined /> WhatsApp
                      </a>
                    )}
                    <span style={{ margin: "0 8px" }}>•</span>
                    <span>📍 {selectedServiceUserModal.city ? `${selectedServiceUserModal.city}, ${selectedServiceUserModal.state}` : "Location not set"}</span>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Tag color="cyan">User Account #{selectedServiceUserModal.id}</Tag>
                    <Tag color="purple">Role: Service Partner</Tag>
                    <Tag color={selectedServiceUserModal.is_active ? "green" : "red"}>
                      {selectedServiceUserModal.is_active ? "Account Active 🟢" : "Account Disabled 🔴"}
                    </Tag>
                  </div>
                </div>
              </div>

              <div className="ap-service-hero-stats">
                <div className="ap-service-hero-stat-pill">
                  <span className="ap-service-hero-stat-label">Total Services</span>
                  <span className="ap-service-hero-stat-val" style={{ color: "#f59e0b" }}>
                    {selectedServiceUserModal.servicesCount}
                  </span>
                </div>
                <div className="ap-service-hero-stat-pill">
                  <span className="ap-service-hero-stat-label">Verified Listings</span>
                  <span className="ap-service-hero-stat-val" style={{ color: "#10b981" }}>
                    {selectedServiceUserModal.approvedCount}
                  </span>
                </div>
                <div className="ap-service-hero-stat-pill">
                  <span className="ap-service-hero-stat-label">Total Invoiced</span>
                  <span className="ap-service-hero-stat-val" style={{ color: "#38bdf8" }}>
                    ₹{selectedServiceUserModal.totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Multi-Tab Navigation */}
            <Tabs
              activeKey={serviceUserDetailTab}
              onChange={setServiceUserDetailTab}
              items={[
                {
                  key: "user_overview",
                  label: (
                    <span>
                      <UserOutlined /> Service User Profile
                    </span>
                  ),
                  children: (
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <div className="ap-service-section-box">
                          <div className="ap-service-section-title">
                            <IdcardOutlined /> Account &amp; Credentials
                          </div>
                          <div className="ap-service-info-row">
                            <span className="ap-service-info-key">Username / Login Mobile</span>
                            <span className="ap-service-info-value" style={{ fontWeight: 800, color: "var(--ap-text-main, #ffffff)" }}>
                              {selectedServiceUserModal.username}
                            </span>
                          </div>
                          <div className="ap-service-info-row">
                            <span className="ap-service-info-key">User Account ID</span>
                            <span className="ap-service-info-value">#{selectedServiceUserModal.id}</span>
                          </div>
                          <div className="ap-service-info-row">
                            <span className="ap-service-info-key">Account Role</span>
                            <span className="ap-service-info-value"><Tag color="orange">Service Partner</Tag></span>
                          </div>
                          <div className="ap-service-info-row">
                            <span className="ap-service-info-key">Primary Phone</span>
                            <span className="ap-service-info-value">{selectedServiceUserModal.phone || "—"}</span>
                          </div>
                          {selectedServiceUserModal.altContact && (
                            <div className="ap-service-info-row">
                              <span className="ap-service-info-key">Alternate Contact</span>
                              <span className="ap-service-info-value">{selectedServiceUserModal.altContact}</span>
                            </div>
                          )}
                          <div className="ap-service-info-row">
                            <span className="ap-service-info-key">Registration Date</span>
                            <span className="ap-service-info-value">
                              {selectedServiceUserModal.date_joined ? new Date(selectedServiceUserModal.date_joined).toLocaleDateString() : "—"}
                            </span>
                          </div>
                          <div className="ap-service-info-row">
                            <span className="ap-service-info-key">Referred By Code</span>
                            <span className="ap-service-info-value">
                              {selectedServiceUserModal.user?.Refered_By ? `Staff / Partner #${selectedServiceUserModal.user.Refered_By}` : "Direct Platform Registration"}
                            </span>
                          </div>
                        </div>
                      </Col>

                      <Col xs={24} md={12}>
                        <div className="ap-service-section-box">
                          <div className="ap-service-section-title">
                            <ShopOutlined /> Services Summary
                          </div>
                          <div className="ap-service-info-row">
                            <span className="ap-service-info-key">Registered Services</span>
                            <span className="ap-service-info-value" style={{ fontWeight: 800, color: "#f59e0b" }}>
                              {selectedServiceUserModal.servicesCount} Services
                            </span>
                          </div>
                          <div className="ap-service-info-row">
                            <span className="ap-service-info-key">Verified &amp; Published</span>
                            <span className="ap-service-info-value" style={{ color: "#10b981", fontWeight: 700 }}>
                              {selectedServiceUserModal.approvedCount}
                            </span>
                          </div>
                          <div className="ap-service-info-row">
                            <span className="ap-service-info-key">Pending Verification</span>
                            <span className="ap-service-info-value" style={{ color: selectedServiceUserModal.pendingCount > 0 ? "#fbbf24" : "#94a3b8" }}>
                              {selectedServiceUserModal.pendingCount}
                            </span>
                          </div>
                          <div className="ap-service-info-row">
                            <span className="ap-service-info-key">Primary Service City</span>
                            <span className="ap-service-info-value">
                              {selectedServiceUserModal.city || "—"}{selectedServiceUserModal.state ? `, ${selectedServiceUserModal.state}` : ""}
                            </span>
                          </div>
                          <div style={{ marginTop: 14 }}>
                            <Button
                              type="primary"
                              ghost
                              style={{ width: "100%", borderColor: "#6366f1", color: "#818cf8", fontWeight: 700 }}
                              onClick={() => setServiceUserDetailTab("user_services")}
                            >
                              View All {selectedServiceUserModal.servicesCount} Services &rarr;
                            </Button>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  ),
                },
                {
                  key: "user_services",
                  label: (
                    <span>
                      <AppstoreOutlined /> Services List ({selectedServiceUserModal.servicesCount})
                    </span>
                  ),
                  children: (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ color: "#94a3b8", fontSize: 13 }}>
                          All wedding service packages and categories registered under partner <strong>{selectedServiceUserModal.username}</strong>:
                        </div>
                        <Button
                          size="small"
                          type="primary"
                          style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }}
                          onClick={() => {
                            handleOpenCreateService();
                            setIsServiceUserModalOpen(false);
                          }}
                        >
                          + Add Service
                        </Button>
                      </div>

                      {selectedServiceUserModal.servicesCount === 0 ? (
                        <div style={{ textAlign: "center", padding: "36px 16px", background: "#f8fafc", borderRadius: 10, border: "1px dashed #cbd5e1" }}>
                          <ShopOutlined style={{ fontSize: 32, color: "#64748b", marginBottom: 8 }} />
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
                            No services registered yet for {selectedServiceUserModal.username}
                          </div>
                          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                            This service partner account has not published any wedding service listings.
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {selectedServiceUserModal.services.map((s) => (
                            <div
                              key={s.id}
                              style={{
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: 10,
                                padding: "12px 16px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 12,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <Image
                                  src={getMediaUrl(s.Picture)}
                                  fallback="https://via.placeholder.com/48"
                                  width={48}
                                  height={48}
                                  style={{ borderRadius: 8, objectFit: "cover" }}
                                />
                                <div>
                                  <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ap-text-main, #ffffff)", display: "flex", alignItems: "center", gap: 8 }}>
                                    {s.Service_Name || "Wedding Service"}
                                    <Tag color="blue">{s.Service_Type || "General"}</Tag>
                                    <Tag color="purple">#SRV-{s.id}</Tag>
                                  </div>
                                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2, display: "flex", gap: 12, flexWrap: "wrap" }}>
                                    <span>Base Price: <strong style={{ color: "#f59e0b" }}>₹{Number(s.Service_Price || 0).toLocaleString("en-IN")}</strong></span>
                                    {s.City && <span>📍 {s.City}{s.State ? `, ${s.State}` : ""}</span>}
                                    {s.WP_Contact && <span>📞 {s.WP_Contact}</span>}
                                    {s.Valid_Upto && <span>📅 Valid Upto: <Tag color="green" style={{ fontSize: 10 }}>{s.Valid_Upto}</Tag></span>}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Tag color={s.Admin_Approval ? "success" : "gold"} style={{ fontWeight: 700 }}>
                                  {s.Admin_Approval ? "✓ Verified" : "⏳ Pending"}
                                </Tag>
                                <Button
                                  size="small"
                                  icon={<EyeOutlined />}
                                  onClick={() => {
                                    setIsServiceUserModalOpen(false);
                                    handleOpenServiceKyc(s);
                                  }}
                                >
                                  Inspect Details
                                </Button>
                                <Button
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() => {
                                    setIsServiceUserModalOpen(false);
                                    handleOpenEditService(s);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  type={s.Admin_Approval ? "default" : "primary"}
                                  style={{
                                    background: s.Admin_Approval ? "rgba(245, 158, 11, 0.15)" : "#10b981",
                                    borderColor: s.Admin_Approval ? "#f59e0b" : "#10b981",
                                    color: s.Admin_Approval ? "#fbbf24" : "#ffffff",
                                    fontWeight: 700,
                                  }}
                                  onClick={() => handleApproveService(s.id, !s.Admin_Approval)}
                                >
                                  {s.Admin_Approval ? "Revoke" : "Approve"}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: "user_transactions",
                  label: (
                    <span>
                      <DollarCircleOutlined /> Invoices &amp; Billing ({selectedServiceUserModal.totalTxns.length})
                    </span>
                  ),
                  children: (
                    <div>
                      {selectedServiceUserModal.totalTxns.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px 16px", color: "#64748b" }}>
                          No invoice billing records on file for this service partner.
                        </div>
                      ) : (
                        <Table scroll={{ x: "max-content" }}
                          dataSource={selectedServiceUserModal.totalTxns}
                          rowKey={(t) => t.id}
                          pagination={false}
                          columns={[
                            {
                              title: "Invoice #",
                              render: (_, t) => <strong style={{ color: "var(--ap-text-main, #ffffff)" }}>INV-{t.id}</strong>,
                            },
                            {
                              title: "Amount",
                              render: (_, t) => <span style={{ color: "#10b981", fontWeight: 800 }}>₹{Number(t.Amount || 0).toLocaleString("en-IN")}</span>,
                            },
                            {
                              title: "Status",
                              render: (_, t) => <Tag color={(t.Status || "Success").toLowerCase() === "success" ? "success" : "gold"}>{t.Status || "Success"}</Tag>,
                            },
                            {
                              title: "Date",
                              render: (_, t) => <span style={{ fontSize: 11, color: "#94a3b8" }}>{t.created_at || t.Create_date || "—"}</span>,
                            },
                          ]}
                        />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>

      {/* PLAN MODAL */}
      <Modal
        title={editingPlan ? "Edit Membership Plan" : "Create New Plan"}
        open={isPlanModalOpen}
        onCancel={() => setIsPlanModalOpen(false)}
        onOk={() => planForm.submit()}
      >
        <Form form={planForm} layout="vertical" onFinish={handleSavePlan}>
          <Form.Item name="Plan" label="Plan Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Gold VIP Matchmaking (30 Days)" />
          </Form.Item>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="Type" label="Package Type" rules={[{ required: true }]}>
                <Select placeholder="Select Type">
                  <Option value="Recharge">Recharge</Option>
                  <Option value="Coupon">Coupon</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="Coupon_Code" label="Coupon Code">
                <Input placeholder="FESTIVE20" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} sm={12}><Form.Item name="Amount" label="Price (₹)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="Validity" label="Validity (Days)" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} sm={12}><Form.Item name="Discount_Amount" label="Discount Amount (₹)"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
          </Row>
          <Form.Item name="Msg" label="Features / Description"><TextArea rows={2} /></Form.Item>
          <Form.Item name="Active" label="Active Plan" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

      {/* SERVICE CATEGORY MODAL */}
      <Modal
        title={editingCategory ? "Edit Category" : "Add Service Category"}
        open={isCatalogModalOpen}
        onCancel={() => setIsCatalogModalOpen(false)}
        onOk={() => catalogForm.submit()}
      >
        <Form form={catalogForm} layout="vertical" onFinish={handleSaveCatalogCategory}>
          <Form.Item name="Service_Name" label="Category Title" rules={[{ required: true }]}><Input placeholder="e.g. Wedding Photography" /></Form.Item>
          <Form.Item name="Service_Type" label="Type Tag" rules={[{ required: true }]}><Input placeholder="Photography" /></Form.Item>
          <Form.Item name="Active" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

      {/* VENDOR CHARGE MODAL */}
      <Modal
        title={editingCharge ? "Edit Listing Fee" : "Add Listing Fee"}
        open={isChargeModalOpen}
        onCancel={() => setIsChargeModalOpen(false)}
        onOk={() => chargeForm.submit()}
      >
        <Form form={chargeForm} layout="vertical" onFinish={handleSaveCharge}>
          <Form.Item name="Service_Type" label="Category" rules={[{ required: true }]}>
            <Select placeholder="Select category">
              {serviceCategories.map((c) => (
                <Option key={c.id} value={c.id}>{c.Service_Name || c.Service_Type}</Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={12}>
            <Col xs={24} sm={12}><Form.Item name="Amount" label="Amount (₹)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="Validity" label="Validity (Days)" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item></Col>
          </Row>
          <Form.Item name="Active" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

      {/* STATE MODAL */}
      <Modal
        title={editingState ? "Edit State & Districts" : "Add State"}
        open={isStateModalOpen}
        onCancel={() => setIsStateModalOpen(false)}
        onOk={() => stateForm.submit()}
      >
        <Form form={stateForm} layout="vertical" onFinish={handleSaveState}>
          <Form.Item name="State" label="State Name" rules={[{ required: true }]}><Input placeholder="e.g. Rajasthan" /></Form.Item>
          <Form.Item name="Districts" label="Districts (Comma Separated)"><TextArea rows={3} placeholder="Jaipur, Jodhpur, Udaipur, Kota" /></Form.Item>
          <Form.Item name="Active" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

      {/* NEAR DISTRICT MODAL */}
      <Modal
        title={editingNearDist ? "Edit District Proximity" : "Add District Proximity"}
        open={isNearDistModalOpen}
        onCancel={() => setIsNearDistModalOpen(false)}
        onOk={() => nearDistForm.submit()}
      >
        <Form form={nearDistForm} layout="vertical" onFinish={handleSaveNearDist}>
          <Form.Item name="State" label="State Name" rules={[{ required: true }]}><Input placeholder="e.g. Rajasthan" /></Form.Item>
          <Form.Item name="District" label="Primary District" rules={[{ required: true }]}><Input placeholder="e.g. Jaipur" /></Form.Item>
          <Form.Item name="Neardist" label="Nearby Districts (Comma Separated)" rules={[{ required: true }]}><TextArea rows={3} placeholder="Dausa, Tonk, Ajmer, Sikar" /></Form.Item>
          <Form.Item name="Active" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

      {/* ATTRIBUTE MODAL */}
      <Modal
        title={`Manage ${attrType.toUpperCase()}`}
        open={attrModalOpen}
        onCancel={() => setAttrModalOpen(false)}
        onOk={() => attrForm.submit()}
      >
        <Form form={attrForm} layout="vertical" onFinish={handleSaveAttribute}>
          {attrType === "religion" && <Form.Item name="Religion_Name" label="Religion" rules={[{ required: true }]}><Input /></Form.Item>}
          {attrType === "caste" && (
            <>
              <Form.Item name="Religion" label="Religion"><Input placeholder="e.g. Hindu" /></Form.Item>
              <Form.Item name="State" label="State"><Input placeholder="e.g. Rajasthan" /></Form.Item>
              <Form.Item name="Caste_Name" label="Castes (Comma Separated)" rules={[{ required: true }]}><TextArea rows={3} /></Form.Item>
            </>
          )}
          {attrType === "profession" && <Form.Item name="Profession_Name" label="Profession" rules={[{ required: true }]}><Input /></Form.Item>}
          {attrType === "language" && (
            <>
              <Form.Item name="Language" label="Language Name" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="State" label="State"><Input /></Form.Item>
            </>
          )}
          {attrType === "color" && <Form.Item name="Color" label="Complexion / Color" rules={[{ required: true }]}><Input /></Form.Item>}
          <Form.Item name="Active" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

      {/* ============================================================== */}
      {/* SUPPORT TICKET COMPREHENSIVE DETAILS MODAL                     */}
      {/* ============================================================== */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CustomerServiceOutlined style={{ fontSize: 22, color: "#6366f1" }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>
                Support Inquiry Dossier — Ticket #HLP-{selectedDetailTicket?.id}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>
                Comprehensive ticket record, member details, assignment route, and resolution status
              </div>
            </div>
          </div>
        }
        open={isTicketDetailModalOpen}
        onCancel={() => {
          setIsTicketDetailModalOpen(false);
          setSelectedDetailTicket(null);
        }}
        width={780}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsTicketDetailModalOpen(false);
              setSelectedDetailTicket(null);
            }}
          >
            Close
          </Button>,
          selectedDetailTicket && (
            <Popconfirm
              key="delete"
              title="Permanently remove this support ticket?"
              onConfirm={() => {
                handleDeleteTicket(selectedDetailTicket.id);
                setIsTicketDetailModalOpen(false);
                setSelectedDetailTicket(null);
              }}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />}>
                Delete Ticket
              </Button>
            </Popconfirm>
          ),
          selectedDetailTicket && (
            <Button
              key="reply"
              type="primary"
              style={{ background: "#6366f1", borderColor: "#6366f1", fontWeight: 700 }}
              onClick={() => {
                const t = selectedDetailTicket;
                setIsTicketDetailModalOpen(false);
                handleOpenTicketReply(t);
              }}
            >
              {selectedDetailTicket.Answer ? "Edit Official Reply" : "Compose Official Reply"}
            </Button>
          ),
        ]}
      >
        {selectedDetailTicket && (() => {
          const inq = getInquirerInfo(selectedDetailTicket);
          const isStaff = isStaffAssignee(selectedDetailTicket);
          const assigneeText = getTargetAssigneeName(selectedDetailTicket);
          const replier = getReplierName(selectedDetailTicket);
          const isAnswered = Boolean(selectedDetailTicket.Answer && selectedDetailTicket.Answer.trim());
          const senderUid = typeof selectedDetailTicket.User_id === "object" ? selectedDetailTicket.User_id?.id : selectedDetailTicket.User_id;
          const targetUid = typeof selectedDetailTicket.Target_User_id === "object" ? selectedDetailTicket.Target_User_id?.id : selectedDetailTicket.Target_User_id;

          const candObj = candidates.find((c) => String(c.User_id?.id || c.User_id || c.id) === String(senderUid));
          const staffObj = staffList.find((s) => String(s.Staff_id?.id || s.Staff_id || s.id) === String(senderUid));
          const srvObj = servicesList.find((s) => String(s.Service_id?.id || s.Service_id || s.id) === String(senderUid));

          const targetStaffObj = staffList.find((s) => String(s.Staff_id?.id || s.Staff_id || s.id) === String(targetUid));

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* STATUS BAR */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Ticket Status:</span>
                  {isAnswered ? (
                    <Tag color="success" style={{ fontWeight: 800, padding: "2px 8px" }}>Answered &amp; Resolved ✅</Tag>
                  ) : (
                    <Tag color="error" style={{ fontWeight: 800, padding: "2px 8px" }}>Pending Action ⏳</Tag>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Assigned Target:</span>
                  <Tag color={isStaff ? "purple" : "geekblue"} style={{ fontWeight: 800, padding: "2px 8px" }}>
                    {assigneeText}
                  </Tag>
                </div>
              </div>

              {/* TWO COLUMN GRID: INQUIRER & ASSIGNEE */}
              <Row gutter={14}>
                {/* INQUIRER DETAILS */}
                <Col xs={24} sm={12}>
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, height: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: "#0f172a" }}>👤 Inquirer Information</span>
                      <Tag color={inq.roleType === "Staff Counselor" ? "cyan" : inq.roleType === "Service Partner" ? "orange" : "blue"} style={{ fontSize: 10.5 }}>
                        {inq.roleType}
                      </Tag>
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>
                      {inq.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                      User Account ID: <strong>#{senderUid}</strong>
                    </div>

                    {inq.phone && (
                      <div style={{ fontSize: 12.5, color: "#334155", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <PhoneOutlined style={{ color: "#2563eb" }} />
                        <strong>+91 {inq.phone}</strong>
                        <a
                          href={`https://wa.me/91${inq.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ marginLeft: 6, color: "#16a34a", fontWeight: 700, fontSize: 11.5 }}
                        >
                          <WhatsAppOutlined /> WhatsApp
                        </a>
                      </div>
                    )}

                    {candObj && (
                      <div style={{ background: "#f8fafc", padding: 8, borderRadius: 6, fontSize: 11.5, color: "#475569", marginTop: 8 }}>
                        <div>Gender: <strong>{candObj.Gender || "—"}</strong> | Age: <strong>{candObj.Age || "—"} Yrs</strong></div>
                        <div>Community: <strong>{candObj.Caste || "—"} ({candObj.Religion || "Hindu"})</strong></div>
                        <div>Location: <strong>{candObj.City || "—"}, {candObj.State || "—"}</strong></div>
                        <Button
                          size="small"
                          type="link"
                          icon={<EyeOutlined />}
                          onClick={() => {
                            setIsTicketDetailModalOpen(false);
                            handleOpenBiodata(candObj);
                          }}
                          style={{ padding: 0, marginTop: 4, fontWeight: 700 }}
                        >
                          View Full Matrimonial Biodata &rarr;
                        </Button>
                      </div>
                    )}

                    {staffObj && (
                      <div style={{ background: "#f8fafc", padding: 8, borderRadius: 6, fontSize: 11.5, color: "#475569", marginTop: 8 }}>
                        <div>Territory: <strong>{staffObj.District || "—"}, {staffObj.State || "—"}</strong></div>
                        <div>Counselor Code: <strong>{staffObj.Refer || "—"}</strong></div>
                        <Button
                          size="small"
                          type="link"
                          icon={<EyeOutlined />}
                          onClick={() => {
                            setIsTicketDetailModalOpen(false);
                            handleOpenStaffKyc(staffObj);
                          }}
                          style={{ padding: 0, marginTop: 4, fontWeight: 700 }}
                        >
                          View Staff KYC Dossier &rarr;
                        </Button>
                      </div>
                    )}

                    {(inq.roleType === "Service Partner" || srvObj) && (() => {
                      const su = serviceUsersList.find((s) => String(s.id) === String(senderUid)) || {
                        services: srvObj ? [srvObj] : [],
                        servicesCount: srvObj ? 1 : 0,
                      };
                      return (
                        <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, fontSize: 11.5, color: "#475569", marginTop: 8, border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontWeight: 800, color: "#0f172a" }}>👤 Service Partner Profile</span>
                            <Tag color="orange" style={{ margin: 0, fontWeight: 700 }}>
                              {su.servicesCount} {su.servicesCount === 1 ? "Service" : "Services"}
                            </Tag>
                          </div>
                          <div>Partner Account: <strong>{inq.name}</strong></div>
                          {inq.phone && <div>Login Phone: <strong>+91 {inq.phone}</strong></div>}
                          {su.servicesCount > 0 ? (
                            <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {su.services.map((s) => (
                                <span
                                  key={s.id}
                                  style={{
                                    background: "#e2e8f0",
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    fontSize: 10.5,
                                    color: "#1e293b",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                  onClick={() => {
                                    setIsTicketDetailModalOpen(false);
                                    handleOpenServiceKyc(s);
                                  }}
                                  title={`Inspect ${s.Service_Name || s.Service_Type}`}
                                >
                                  🏷️ {s.Service_Name || s.Service_Type}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>No services listed yet</div>
                          )}
                          <Button
                            size="small"
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => {
                              setIsTicketDetailModalOpen(false);
                              handleOpenServiceUserProfile(senderUid);
                            }}
                            style={{ padding: 0, marginTop: 8, fontWeight: 700, color: "#d97706" }}
                          >
                            View Service User Details &amp; Services List &rarr;
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                </Col>

                {/* ASSIGNED RECIPIENT */}
                <Col xs={24} sm={12}>
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, height: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: "#0f172a" }}>🎯 Assignment Target</span>
                      <Tag color={isStaff ? "purple" : "geekblue"} style={{ fontSize: 10.5 }}>
                        {isStaff ? "Staff Counselor Route" : "Direct Admin Route"}
                      </Tag>
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>
                      {assigneeText}
                    </div>

                    {isStaff ? (
                      <div style={{ background: "#faf5ff", border: "1px solid #f3e8ff", padding: 10, borderRadius: 8, fontSize: 12, color: "#581c87", marginTop: 8 }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Designated Counselor:</div>
                        <div>Name: <strong>{targetStaffObj?.Full_Name || "Assigned Counselor"}</strong></div>
                        {targetStaffObj?.WP_Contact && <div>Contact: <strong>+91 {targetStaffObj.WP_Contact}</strong></div>}
                        {targetStaffObj?.Email && <div>Email: <strong>{targetStaffObj.Email}</strong></div>}
                        <div>Region: <strong>{targetStaffObj?.District || "—"}, {targetStaffObj?.State || "—"}</strong></div>
                        {targetStaffObj && (
                          <Button
                            size="small"
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => {
                              setIsTicketDetailModalOpen(false);
                              handleOpenStaffKyc(targetStaffObj);
                            }}
                            style={{ padding: 0, marginTop: 4, fontWeight: 700, color: "#7c3aed" }}
                          >
                            Open Counselor Record &rarr;
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div style={{ background: "#eff6ff", border: "1px solid #dbeafe", padding: 10, borderRadius: 8, fontSize: 12, color: "#1e40af", marginTop: 8 }}>
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>Head Office Central Administration</div>
                        <div style={{ fontSize: 11.5, color: "#3b82f6" }}>
                          This inquiry was sent directly to Central Operations Admin. Action and reply should be submitted by the Admin team.
                        </div>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>

              {/* QUESTION / INQUIRY */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: "#0f172a" }}>❓ Member's Question / Support Inquiry</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    Submitted: {selectedDetailTicket.created_date || selectedDetailTicket.Create_date ? new Date(selectedDetailTicket.created_date || selectedDetailTicket.Create_date).toLocaleString() : "Recent"}
                  </span>
                </div>
                <div style={{ background: "#f1f5f9", padding: "12px 14px", borderRadius: 8, fontSize: 13.5, color: "#0f172a", lineHeight: 1.55, fontWeight: 500, whiteSpace: "pre-wrap" }}>
                  &ldquo;{selectedDetailTicket.Question || "No question text provided"}&rdquo;
                </div>
              </div>

              {/* OFFICIAL ANSWER / RESOLUTION */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: "#0f172a" }}>💬 Official Support Response</span>
                  {isAnswered && replier && (
                    <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>
                      Answered by: {replier}
                    </span>
                  )}
                </div>

                {isAnswered ? (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 14px", borderRadius: 8, fontSize: 13, color: "#14532d", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                    {selectedDetailTicket.Answer}
                  </div>
                ) : (
                  <div style={{ background: "#fef2f2", border: "1px dashed #fca5a5", padding: "12px 14px", borderRadius: 8, fontSize: 12.5, color: "#991b1b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>⏳ No response has been submitted to the member yet.</span>
                    <Button
                      size="small"
                      type="primary"
                      style={{ background: "#dc2626", borderColor: "#dc2626" }}
                      onClick={() => {
                        const t = selectedDetailTicket;
                        setIsTicketDetailModalOpen(false);
                        handleOpenTicketReply(t);
                      }}
                    >
                      Reply Now
                    </Button>
                  </div>
                )}
              </div>

              {/* AUDIT METADATA */}
              <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11, color: "#64748b", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                <span>Record ID: <strong>{selectedDetailTicket.id}</strong></span>
                <span>User_Role: <strong>{selectedDetailTicket.User_Role || "user"}</strong></span>
                <span>Target_User_id: <strong>{targetUid || "none"}</strong></span>
                <span>Reply_By: <strong>{selectedDetailTicket.Reply_By || "none"}</strong></span>
                <span>Active: <strong>{String(selectedDetailTicket.Active !== false)}</strong></span>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* SUPPORT TICKET REPLY MODAL */}
      <Modal
        title="Reply to Support Ticket"
        open={Boolean(replyTicketModal)}
        onCancel={() => setReplyTicketModal(null)}
        footer={[
          <Button key="cancel" onClick={() => setReplyTicketModal(null)}>Cancel</Button>,
          <Button key="submit" type="primary" style={{ background: "#2563eb", borderColor: "#2563eb", color: "#ffffff", fontWeight: 700 }} loading={submittingReply} onClick={handleReplyTicket}>
            Send Reply
          </Button>,
        ]}
      >
        {replyTicketModal && (
          <div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: 12, borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Member Question:</div>
              <p style={{ margin: "4px 0 0", fontWeight: 700, color: "var(--ap-text-main, #ffffff)" }}>{replyTicketModal.Question}</p>
            </div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Administrator Answer:</label>
            <TextArea rows={4} placeholder="Type official response..." value={ticketAnswer} onChange={(e) => setTicketAnswer(e.target.value)} />
          </div>
        )}
      </Modal>

      {/* SUCCESS STORY MODAL */}
      <Modal
        title={editingStory ? "Edit Success Story" : "Publish Success Story"}
        open={isStoryModalOpen}
        onCancel={() => setIsStoryModalOpen(false)}
        onOk={() => storyForm.submit()}
      >
        <Form form={storyForm} layout="vertical" onFinish={handleSaveStory}>
          <Row gutter={12}>
            <Col xs={24} sm={12}><Form.Item name="Male_Name" label="Groom Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="Female_Name" label="Bride Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="City" label="Wedding / City" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="Success_Story_Text" label="Testimonial Story" rules={[{ required: true }]}><TextArea rows={4} /></Form.Item>
          <Form.Item name="Active" label="Visible on Homepage" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

      {/* ============================================================== */}
      {/* 3.10 UNIVERSAL COMPLETE FIELD INSPECTOR DRAWER                  */}
      {/* Exposes 100% of all fields in every record across all 22 models */}
      {/* ============================================================== */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingRight: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#818cf8",
                fontSize: 16
              }}>
                <DatabaseOutlined />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ap-text-main, #ffffff)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{inspectRecord?.modelKey || "Model"}</span>
                  <Tag color="geekblue" style={{ fontSize: 11, margin: 0 }}>
                    ID: {inspectRecord?.data?.id || inspectRecord?.data?.Success_id || inspectRecord?.data?.User_id || "N/A"}
                  </Tag>
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  100% Field Inspector • {(allModelsMeta.find((m) => m.key === inspectRecord?.modelKey)?.fields || []).length} Schema Fields
                </div>
              </div>
            </div>
            <Space size={6}>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  if (inspectRecord?.data) {
                    navigator.clipboard.writeText(JSON.stringify(inspectRecord.data, null, 2));
                    message.success("Copied complete record JSON! 📋");
                  }
                }}
                style={{ fontSize: 12 }}
              >
                Copy JSON
              </Button>
              <Radio.Group
                size="small"
                value={inspectRawJsonView ? "json" : "fields"}
                onChange={(e) => setInspectRawJsonView(e.target.value === "json")}
              >
                <Radio.Button value="fields">Fields</Radio.Button>
                <Radio.Button value="json">Raw JSON</Radio.Button>
              </Radio.Group>
            </Space>
          </div>
        }
        open={isInspectDrawerOpen}
        onClose={() => setIsInspectDrawerOpen(false)}
        width={typeof window !== "undefined" && window.innerWidth < 768 ? "100vw" : 720}
        style={{ maxWidth: "100vw" }}
        styles={{
          body: { padding: "16px", background: "#f8fafc", color: "#0f172a" },
          header: { background: "#ffffff", borderBottom: "1px solid #e2e8f0" }
        }}
      >
        {inspectRecord && (() => {
          const mKey = inspectRecord.modelKey;
          const rData = inspectRecord.data || {};
          const meta = allModelsMeta.find((m) => m.key === mKey);
          const definedFields = meta?.fields || [];
          const allKeys = Array.from(new Set([...definedFields, ...Object.keys(rData)]));

          const q = (drawerFieldSearch || "").toLowerCase().trim();
          const filteredKeys = q
            ? allKeys.filter((k) => k.toLowerCase().includes(q) || String(rData[k] ?? "").toLowerCase().includes(q))
            : allKeys;

          if (inspectRawJsonView) {
            return (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>Raw Data Payload ({allKeys.length} fields):</span>
                  <Button
                    size="small"
                    type="primary"
                    icon={<CopyOutlined />}
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(rData, null, 2));
                      message.success("Copied raw JSON! 📋");
                    }}
                  >
                    Copy All
                  </Button>
                </div>
                <pre style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: 16,
                  color: "#0369a1",
                  fontSize: 12,
                  lineHeight: 1.6,
                  overflowX: "auto",
                  maxHeight: "78vh",
                  fontFamily: "Consolas, Monaco, monospace"
                }}>
                  {JSON.stringify(rData, null, 2)}
                </pre>
              </div>
            );
          }

          return (
            <div>
              {/* Top Search & Filter Bar inside Drawer */}
              <div style={{ marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}>
                <Input
                  prefix={<SearchOutlined style={{ color: "#64748b" }} />}
                  placeholder="Filter fields by name or value..."
                  value={drawerFieldSearch}
                  onChange={(e) => setDrawerFieldSearch(e.target.value)}
                  allowClear
                  style={{ flex: 1 }}
                />
                <Tag color="blue" style={{ margin: 0, padding: "4px 8px" }}>
                  {filteredKeys.length} / {allKeys.length} Fields
                </Tag>
              </div>

              {/* Quick Actions Bar */}
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8
              }}>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  Model: <strong style={{ color: "var(--ap-text-main, #ffffff)" }}>{mKey}</strong> • Category: <strong style={{ color: "#818cf8" }}>{meta?.category || "Platform"}</strong>
                </div>
                <Space>
                  {meta?.onEdit && (
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setIsInspectDrawerOpen(false);
                        meta.onEdit(rData);
                      }}
                      style={{ fontSize: 11 }}
                    >
                      Open Form Editor
                    </Button>
                  )}
                  {meta?.onInspect && meta.key !== "Plans" && meta.key !== "User_Transactions" && (
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        setIsInspectDrawerOpen(false);
                        meta.onInspect(rData);
                      }}
                      style={{ fontSize: 11, color: "#f59e0b", borderColor: "rgba(245,158,11,0.4)" }}
                    >
                      Open Specialized Modal
                    </Button>
                  )}
                </Space>
              </div>

              {/* 100% Fields Grid / Key-Value List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredKeys.map((fKey) => {
                  const val = rData[fKey];
                  const isNullOrEmpty = val === null || val === undefined || val === "";
                  const lk = fKey.toLowerCase();
                  const isImg = typeof val === "string" && (lk.includes("pic") || lk.includes("image") || lk.includes("passbook") || lk.includes("picture"));
                  const isBool = typeof val === "boolean";
                  const isPrice = ["amount", "salary", "service_price", "discount_amount"].includes(lk);
                  const isDate = lk.includes("date") || lk === "created_at" || lk === "valid_upto";

                  return (
                    <div
                      key={fKey}
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 8,
                        padding: "10px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#cbd5e1" }}>
                            {fKey}
                          </span>
                          <Tag style={{
                            fontSize: 10,
                            padding: "0 5px",
                            margin: 0,
                            background: "rgba(255,255,255,0.05)",
                            borderColor: "rgba(255,255,255,0.1)",
                            color: "#94a3b8"
                          }}>
                            {isImg ? "image url" : isBool ? "boolean" : isPrice ? "currency" : isDate ? "date" : typeof val}
                          </Tag>
                          {(meta?.primaryCols || []).includes(fKey) && (
                            <Tag color="cyan" style={{ fontSize: 9, padding: "0 4px", margin: 0 }}>Primary</Tag>
                          )}
                        </div>
                        <Tooltip title="Copy value to clipboard">
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined style={{ fontSize: 12, color: "#64748b" }} />}
                            onClick={() => {
                              navigator.clipboard.writeText(String(val ?? ""));
                              message.success(`Copied ${fKey}!`);
                            }}
                          />
                        </Tooltip>
                      </div>

                      <div style={{ fontSize: 13, wordBreak: "break-all" }}>
                        {isNullOrEmpty ? (
                          <span style={{ color: "#64748b", fontStyle: "italic", fontSize: 12 }}>null / empty</span>
                        ) : isImg ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                            <Image
                              src={getMediaUrl(val)}
                              width={70}
                              height={70}
                              style={{ objectFit: "cover", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)" }}
                              fallback="https://placehold.co/100x100?text=No+Preview"
                            />
                            <div>
                              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Image Path / URL:</div>
                              <code style={{ fontSize: 11, color: "#38bdf8" }}>{val}</code>
                            </div>
                          </div>
                        ) : isBool ? (
                          <Tag color={val ? "success" : "default"} style={{ fontWeight: 700 }}>
                            {val ? "True / Active" : "False / Inactive"}
                          </Tag>
                        ) : isPrice ? (
                          <span style={{ color: "#10b981", fontWeight: 800, fontSize: 14 }}>
                            ₹{Number(val).toLocaleString("en-IN")}
                          </span>
                        ) : isDate ? (
                          <span style={{ color: "#f59e0b", fontWeight: 600 }}>
                            {String(val).replace("T", " ")}
                          </span>
                        ) : typeof val === "object" ? (
                          <pre style={{ margin: 0, padding: 8, background: "#f1f5f9", borderRadius: 6, fontSize: 11, color: "#4338ca" }}>
                            {JSON.stringify(val, null, 2)}
                          </pre>
                        ) : (
                          <span style={{ color: "#0f172a" }}>{String(val)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </Drawer>
      {/* ============================================================== */}
      {/* 4. MOBILE BOTTOM NAVIGATION DOCK — Phone App Feel               */}
      {/* ============================================================== */}
      <nav className="ap-mobile-bottom-nav">
        <button
          type="button"
          className={`ap-mobile-bottom-nav-btn ${activePortal === "executive" ? "active" : ""}`}
          onClick={() => switchPortal("executive")}
        >
          <span className="ap-mobile-bottom-nav-icon"><DashboardOutlined /></span>
          <span>Cockpit</span>
        </button>
        <button
          type="button"
          className={`ap-mobile-bottom-nav-btn ${activePortal === "user" ? "active" : ""}`}
          onClick={() => switchPortal("user")}
        >
          <span className="ap-mobile-bottom-nav-icon"><UserOutlined /></span>
          <span>Users</span>
          {candidates.length > 0 && <span className="ap-mobile-bottom-nav-badge">{candidates.length > 99 ? "99+" : candidates.length}</span>}
        </button>
        <button
          type="button"
          className={`ap-mobile-bottom-nav-btn ${activePortal === "staff" ? "active" : ""}`}
          onClick={() => switchPortal("staff")}
        >
          <span className="ap-mobile-bottom-nav-icon"><TeamOutlined /></span>
          <span>Staff</span>
          {pendingStaffCount > 0 && <span className="ap-mobile-bottom-nav-badge">{pendingStaffCount}</span>}
        </button>
        <button
          type="button"
          className={`ap-mobile-bottom-nav-btn ${activePortal === "service" ? "active" : ""}`}
          onClick={() => switchPortal("service")}
        >
          <span className="ap-mobile-bottom-nav-icon"><ShopOutlined /></span>
          <span>Services</span>
          {pendingServiceCount > 0 && <span className="ap-mobile-bottom-nav-badge">{pendingServiceCount}</span>}
        </button>
        <button
          type="button"
          className={`ap-mobile-bottom-nav-btn ${["criteria", "geography", "engagement", "security"].includes(activePortal) ? "active" : ""}`}
          onClick={() => switchPortal("criteria")}
        >
          <span className="ap-mobile-bottom-nav-icon"><AppstoreOutlined /></span>
          <span>Masters</span>
        </button>
      </nav>
    </div>
  );
};

export default AdminPanel;
