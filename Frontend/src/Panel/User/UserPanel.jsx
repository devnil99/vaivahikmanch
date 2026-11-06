import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  Row,
  Col,
  Select,
  Spin,
  message,
  Progress,
  Tag,
  Empty,
  Modal,
  Drawer,
  Divider,
  Switch,
  AutoComplete,
  Pagination,
  Radio,
  Image,
} from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  UserRegGet,
  UserRegUpdate,
  UserUpdate,
  UserDataGetwt,
  UserDataUpdate,
  UserDataToggleActive,
  User_StateGet,
  User_CasteGet,
  WishListGet,
  WishListIncomingGet,
  WishListApprovedGet,
  WishListPost,
  WishListRequest,
  WishListDirectRequest,
  WishListUpdate,
  WishListRemove,
  PlanGet,
  ProfessionGet,
  ReligionGet,
  LanguageGet,
  ColorGet,
  NearDistGet,
  UserTransactionsGet,
  HelpGet,
  HelpTargetsGet,
  HelpPost,
  StaffDataGet,
  ServiceDataGet,
  ServiceGet,
} from "../../Api/CoreApi";
import {
  LeftOutlined,
  RightOutlined,
  UploadOutlined,
  EditOutlined,
  LockOutlined,
  UserOutlined,
  EnvironmentOutlined,
  BookOutlined,
  TeamOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  HeartOutlined,
  HeartFilled,
  EyeOutlined,
  WhatsAppOutlined,
  SearchOutlined,
  CrownOutlined,
  HistoryOutlined,
  MenuOutlined,
  FileTextOutlined,
  CalendarOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  CustomerServiceOutlined,
  SendOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  LogoutOutlined,
  FilterOutlined,
  HomeOutlined,
  IdcardOutlined,
  ShopOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import "./UserPanel.css";
import UserBiodataModal from "./UserBiodataModal";
import ServiceBiodataModal from "./ServiceBiodataModal";
import siteConfig from "../../Config/Config";

// Helper to get modern thematic icon for wedding service categories
const getServiceCategoryIcon = (categoryName) => {
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

const { Option } = Select;

const formatDate = (dateVal) => {
  if (!dateVal) return "";
  try {
    const s = String(dateVal).trim();
    // YYYY-MM-DD
    const ymd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymd) {
      const year = ymd[1];
      const month = ymd[2].padStart(2, "0");
      const day = ymd[3].padStart(2, "0");
      return `${day}-${month}-${year}`;
    }
    // DD-MM-YYYY or DD-MM-YY
    const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
    if (dmy) {
      const day = dmy[1].padStart(2, "0");
      const month = dmy[2].padStart(2, "0");
      const year = dmy[3];
      return `${day}-${month}-${year}`;
    }
    const dt = new Date(dateVal);
    if (!Number.isNaN(dt.getTime())) {
      const day = String(dt.getDate()).padStart(2, "0");
      const month = String(dt.getMonth() + 1).padStart(2, "0");
      const year = dt.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return s.slice(0, 10);
  } catch (err) {
    return String(dateVal).slice(0, 10);
  }
};

const formatDateTime = (dateVal) => {
  if (!dateVal) return "";
  try {
    const dt = new Date(dateVal);
    if (!Number.isNaN(dt.getTime())) {
      const day = String(dt.getDate()).padStart(2, "0");
      const month = String(dt.getMonth() + 1).padStart(2, "0");
      const year = dt.getFullYear();
      let hours = dt.getHours();
      const minutes = String(dt.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
    }
    return String(dateVal);
  } catch {
    return String(dateVal);
  }
};

const parseToDateInput = (val) => {
  if (!val) return undefined;
  const s = String(val).trim();
  const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  const ymdMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, "0");
    const day = ymdMatch[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const dt = new Date(s);
  if (!Number.isNaN(dt.getTime())) {
    return dt.toISOString().slice(0, 10);
  }
  return undefined;
};

// Helper to determine contact relation (Self vs Relative) and clean contact person name
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
  // Filter out invalid names that are pure digits or match/repeat phone numbers
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

  // If relation is Self, default to candidate's own name
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

// Helper to verify a candidate profile is active, approved, non-expired, and not self
const isCandidateProfileAvailable = (c, currentUserId) => {
  if (!c) return false;
  if (currentUserId && String(c.User_id || c.id) === String(currentUserId)) return false;

  // 1. Exclude inactive / disabled profiles
  if (c.Active === false || c.active === false || c.is_active === false) return false;
  if (c.user_account && c.user_account.is_active === false) return false;
  const statusStr = String(c.Status || c.status || "").trim().toLowerCase();
  if (["deactive", "inactive", "deactivated", "disabled"].includes(statusStr)) return false;

  // 2. Exclude admin approval pending profiles
  if (c.is_approved === false || c.Admin_Approval === false) return false;
  if (statusStr === "pending") return false;

  // 3. Strictly exclude Null, missing, or expired Valid_Upto profiles
  // A candidate MUST have an active validity date (Valid_Upto != null and Valid_Upto >= today)
  if (!c.Valid_Upto) return false;
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;
  const vu = String(c.Valid_Upto).trim().split("T")[0];
  if (!vu || vu < todayStr) return false;

  return true;
};

function UserPanel() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const baseurl = siteConfig?.apiBaseURL || (typeof window !== "undefined" && window.location.origin ? window.location.origin + "/" : "https://vaivahikmanch.in/");
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
  const user_id = localStorage.getItem("user_id");
  const userId = user_id;

  const [form] = Form.useForm();
  const [securityForm] = Form.useForm();

  // Watch contact relation fields to dynamically show/hide relation person name inputs
  const wpRelationWatch = Form.useWatch("wp_contact_relation", form);
  const altRelationWatch = Form.useWatch("alt_contact_relation", form);
  const selectedWpRelation = wpRelationWatch || form.getFieldValue("wp_contact_relation") || "Self";
  const selectedAltRelation = altRelationWatch || form.getFieldValue("alt_contact_relation") || "Father";
  const isWpSelf = selectedWpRelation === "Self";
  const isAltSelf = selectedAltRelation === "Self";

  // Navigation tab state:
  // "matches", "plans", "transactions", "shortlist", "requests", "approved", "profile", "edit", "security"
  const tabParam = searchParams.get("tab") || "matches";
  const [activeTab, setActiveTab] = useState(tabParam === "search" ? "matches" : tabParam);
  const [activeProfileSection, setActiveProfileSection] = useState("all");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Core Data States (Fetched strictly from Backend Models)
  const [data, setData] = useState([]);
  const [allCandidates, setAllCandidates] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [incomingWishlistItems, setIncomingWishlistItems] = useState([]);
  const [approvedWishlistItems, setApprovedWishlistItems] = useState([]);
  const [plansList, setPlansList] = useState([]);
  const [transactionsList, setTransactionsList] = useState([]);

  // Pagination States (10 to 15 items at a time, default 12)
  const [matchesPage, setMatchesPage] = useState(1);
  const [matchesPageSize, setMatchesPageSize] = useState(12);

  const [shortlistPage, setShortlistPage] = useState(1);
  const [shortlistPageSize, setShortlistPageSize] = useState(12);

  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsPageSize, setRequestsPageSize] = useState(12);

  const [approvedPage, setApprovedPage] = useState(1);
  const [approvedPageSize, setApprovedPageSize] = useState(12);

  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsPageSize, setTransactionsPageSize] = useState(10);

  // Wedding Services States (Service_Data & Services Models)
  const [servicesList, setServicesList] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isServiceBiodataOpen, setIsServiceBiodataOpen] = useState(false);
  const [serviceOpenedFromCandidate, setServiceOpenedFromCandidate] = useState(null);
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState("all");
  const [serviceDistrictFilter, setServiceDistrictFilter] = useState("all");
  const [serviceSearch, setServiceSearch] = useState("");

  // Help & Support States (Help model)
  const [helpTickets, setHelpTickets] = useState([]);
  const [supportTargets, setSupportTargets] = useState({
    has_staff: false,
    added_by_type: "admin",
    staff: null,
    admin: null,
  });
  const [selectedHelpTarget, setSelectedHelpTarget] = useState("admin");
  const [helpQuestion, setHelpQuestion] = useState("");
  const [isSubmittingHelp, setIsSubmittingHelp] = useState(false);
  const [helpFilter, setHelpFilter] = useState("all");
  const [helpPage, setHelpPage] = useState(1);
  const [helpPageSize] = useState(10);

  // Track seen Help & Support ticket answers (unseen count only in side menu)
  const [seenHelpIds, setSeenHelpIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`up_seen_help_answers_${user_id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const unseenHelpCount = useMemo(() => {
    if (!Array.isArray(helpTickets)) return 0;
    return helpTickets.filter(
      (t) =>
        (Boolean(t.Answer && t.Answer.trim()) || t.is_answered) &&
        !seenHelpIds.includes(String(t.id))
    ).length;
  }, [helpTickets, seenHelpIds]);

  // When user opens or is on Help & Support tab, mark answered tickets as seen
  useEffect(() => {
    if (activeTab === "help" && Array.isArray(helpTickets) && helpTickets.length > 0) {
      const answeredIds = helpTickets
        .filter((t) => Boolean(t.Answer && t.Answer.trim()) || t.is_answered)
        .map((t) => String(t.id));

      if (answeredIds.length > 0) {
        setSeenHelpIds((prev) => {
          const merged = Array.from(new Set([...prev, ...answeredIds]));
          if (merged.length !== prev.length) {
            try {
              localStorage.setItem(
                `up_seen_help_answers_${user_id}`,
                JSON.stringify(merged)
              );
            } catch (e) {
              console.error("Failed to save seen tickets:", e);
            }
            return merged;
          }
          return prev;
        });
      }
    }
  }, [activeTab, helpTickets, user_id]);

  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(true);
  const [isProfileActive, setIsProfileActive] = useState(true);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusToggleLoading, setStatusToggleLoading] = useState(false);

  // Dynamic States, Castes & Professions from Backend Models
  const [statesList, setStatesList] = useState([]);
  const [districtList, setDistrictList] = useState([]);
  const [rawCastesData, setRawCastesData] = useState([]);
  const [religionsList, setReligionsList] = useState([]);
  const [languagesList, setLanguagesList] = useState([]);
  const [colorsList, setColorsList] = useState([]);
  const [professionsList, setProfessionsList] = useState([]);

  // Dynamic Edit Form States (State -> District & State/Religion -> Caste)
  const [formSelectedState, setFormSelectedState] = useState("");
  const [formSelectedReligion, setFormSelectedReligion] = useState("Hindu");
  const [formFilteredCastes, setFormFilteredCastes] = useState([]);
  const [nearDistMasterList, setNearDistMasterList] = useState([]);
  const [internalNearDist, setInternalNearDist] = useState([]);
  const [formJobType, setFormJobType] = useState("Private");

  // Dynamic Caste Derivation based on selected State & Religion strictly from Backend Caste Model
  const computeCastesForForm = (religion, state, rawCastes, userCaste = "") => {
    const normRel = String(religion || "").trim().toLowerCase();
    const normState = String(state || "").trim().toLowerCase();
    const result = [];

    const appendItems = (source) => {
      if (!source) return;
      if (Array.isArray(source)) {
        source.forEach((c) => {
          if (c && typeof c === "string" && c.trim()) result.push(c.trim());
        });
      } else if (typeof source === "string" && source.trim()) {
        try {
          const parsed = JSON.parse(source);
          if (Array.isArray(parsed)) {
            parsed.forEach((c) => {
              if (c && typeof c === "string" && c.trim()) result.push(c.trim());
            });
          } else {
            result.push(source.trim());
          }
        } catch {
          if (source.includes(",")) {
            source.split(",").forEach((c) => {
              if (c.trim()) result.push(c.trim());
            });
          } else {
            result.push(source.trim());
          }
        }
      }
    };

    if (Array.isArray(rawCastes) && rawCastes.length > 0) {
      // 1. Strict Match: State and Religion from backend Caste model
      if (normState && normRel) {
        const exactMatches = rawCastes.filter((c) => {
          if (c.Active === false) return false;
          const r = String(c.Religion || c.religion || "").trim().toLowerCase();
          const s = String(c.State || c.state || "").trim().toLowerCase();
          return r === normRel && s === normState;
        });
        if (exactMatches.length > 0) {
          exactMatches.forEach((item) => appendItems(item.Caste_Name || item.caste));
        }
      }

      // 2. If no exact match and State is selected, look for backend records for this State
      if (result.length === 0 && normState) {
        const stateMatches = rawCastes.filter((c) => {
          if (c.Active === false) return false;
          const s = String(c.State || c.state || "").trim().toLowerCase();
          return s === normState;
        });
        if (stateMatches.length > 0) {
          stateMatches.forEach((item) => appendItems(item.Caste_Name || item.caste));
        }
      }

      // 3. For all-India non-Hindu religions (Jain, Sikh, Buddhist, Muslim, Christian) where State is None in backend
      if (result.length === 0 && normRel && normRel !== "hindu") {
        const relAllIndiaMatches = rawCastes.filter((c) => {
          if (c.Active === false) return false;
          const r = String(c.Religion || c.religion || "").trim().toLowerCase();
          const s = String(c.State || c.state || "").trim().toLowerCase();
          return r === normRel && (!s || s === "none" || s === "all");
        });
        if (relAllIndiaMatches.length > 0) {
          relAllIndiaMatches.forEach((item) => appendItems(item.Caste_Name || item.caste));
        }
      }
    }

    if (userCaste && result.includes(userCaste)) {
      // userCaste exists in mapped castes
    }

    return Array.from(new Set(result)).filter(Boolean).sort((a, b) => a.localeCompare(b));
  };

  // Community Caste Matches Comprehensive Search Filters
  const [matchSearch, setMatchSearch] = useState("");
  const [matchAgeFilter, setMatchAgeFilter] = useState("all");
  const [matchHeightFilter, setMatchHeightFilter] = useState("all");
  const [matchMaritalFilter, setMatchMaritalFilter] = useState("all");
  const [matchQualFilter, setMatchQualFilter] = useState("all");
  const [matchProfFilter, setMatchProfFilter] = useState("all");
  const [matchIncomeFilter, setMatchIncomeFilter] = useState("all");
  const [matchManglikFilter, setMatchManglikFilter] = useState("all");
  const [matchDietFilter, setMatchDietFilter] = useState("all");
  const [matchStateFilter, setMatchStateFilter] = useState("all");
  const [matchDistrictFilter, setMatchDistrictFilter] = useState("all");
  const [matchDistrictsList, setMatchDistrictsList] = useState([]);
  const [matchSubcasteFilter, setMatchSubcasteFilter] = useState("");

  // Reset pagination to page 1 whenever filter parameters change
  useEffect(() => {
    setMatchesPage(1);
  }, [
    matchSearch,
    matchAgeFilter,
    matchHeightFilter,
    matchMaritalFilter,
    matchQualFilter,
    matchProfFilter,
    matchIncomeFilter,
    matchManglikFilter,
    matchDietFilter,
    matchStateFilter,
    matchDistrictFilter,
    matchSubcasteFilter,
  ]);



  // Combined list of all districts across all states & candidates so district filtering is never restricted
  const allDistrictsList = useMemo(() => {
    const set = new Set();
    if (Array.isArray(statesList)) {
      statesList.forEach((s) => {
        const rawDist = s.disttrict || s.district || s.Districts || s.districts || [];
        if (Array.isArray(rawDist)) {
          rawDist.forEach((d) => {
            if (d && typeof d === "string" && d.trim()) set.add(d.trim());
          });
        }
      });
    }
    if (Array.isArray(allCandidates)) {
      allCandidates.forEach((c) => {
        const d = (c.district || c.District || "").trim();
        if (d) set.add(d);
      });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [statesList, allCandidates]);



  // Biodata Modal for full candidate details
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isBiodataOpen, setIsBiodataOpen] = useState(false);
  const [savedScrollPos, setSavedScrollPos] = useState(0);
  const [lastOpenedCandidateId, setLastOpenedCandidateId] = useState(null);

  const restoreProfileScrollPosition = (candIdOverride) => {
    setTimeout(() => {
      const targetId = candIdOverride || lastOpenedCandidateId;
      const candCardId = targetId ? `profile-card-${targetId}` : null;
      const el = candCardId ? document.getElementById(candCardId) : null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("up-cand-card-highlighted");
        setTimeout(() => {
          el.classList.remove("up-cand-card-highlighted");
        }, 2200);
      } else if (savedScrollPos) {
        window.scrollTo({ top: savedScrollPos, behavior: "smooth" });
      }
    }, 60);
  };

  const openCandidateBiodata = (cand) => {
    if (!hasCompletedProfile) {
      message.warning("⚠️ Please complete your profile details first to view candidate biodata.");
      switchTab("edit");
      return;
    }
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    setSavedScrollPos(currentScrollY);
    const cid = cand.User_id || cand.id;
    setLastOpenedCandidateId(cid);
    setSelectedMatch(cand);
    setIsBiodataOpen(true);
    if (!window.history.state || !window.history.state.biodataOpen) {
      window.history.pushState({ biodataOpen: true }, "");
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const closeCandidateBiodata = () => {
    setIsBiodataOpen(false);
    setSelectedMatch(null);
    if (window.history.state && window.history.state.biodataOpen) {
      window.history.back();
    } else {
      restoreProfileScrollPosition();
    }
  };

  const openServiceBiodata = (service, fromCandidate = null) => {
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    setSavedScrollPos(currentScrollY);
    setSelectedService(service);
    setServiceOpenedFromCandidate(fromCandidate);
    setIsBiodataOpen(false);
    setIsServiceBiodataOpen(true);
    setActiveTab("services");
    setSearchParams({ tab: "services" }, { replace: true });
    if (!window.history.state || !window.history.state.serviceBiodataOpen) {
      window.history.pushState({ serviceBiodataOpen: true }, "");
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const closeServiceBiodata = () => {
    const prevCand = serviceOpenedFromCandidate;
    setIsServiceBiodataOpen(false);
    setSelectedService(null);
    setServiceOpenedFromCandidate(null);
    if (prevCand) {
      setActiveTab("matches");
      setSearchParams({ tab: "matches" }, { replace: true });
      setSelectedMatch(prevCand);
      setIsBiodataOpen(true);
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    if (window.history.state && window.history.state.serviceBiodataOpen) {
      window.history.back();
    } else {
      restoreProfileScrollPosition();
    }
  };

  const backFromServiceToCandidate = () => {
    const prevCand = serviceOpenedFromCandidate;
    setIsServiceBiodataOpen(false);
    setSelectedService(null);
    setServiceOpenedFromCandidate(null);
    if (prevCand) {
      setActiveTab("matches");
      setSearchParams({ tab: "matches" }, { replace: true });
      setSelectedMatch(prevCand);
      setIsBiodataOpen(true);
      window.scrollTo({ top: 0, behavior: "instant" });
    } else {
      restoreProfileScrollPosition();
    }
  };

  // Listen to popstate (e.g. mobile hardware back button or browser back)
  useEffect(() => {
    const handlePopState = () => {
      if (isServiceBiodataOpen) {
        setIsServiceBiodataOpen(false);
        setSelectedService(null);
        if (serviceOpenedFromCandidate) {
          setActiveTab("matches");
          setSearchParams({ tab: "matches" }, { replace: true });
          setSelectedMatch(serviceOpenedFromCandidate);
          setIsBiodataOpen(true);
          setServiceOpenedFromCandidate(null);
        } else {
          restoreProfileScrollPosition();
        }
        return;
      }
      if (isBiodataOpen) {
        setIsBiodataOpen(false);
        setSelectedMatch(null);
        restoreProfileScrollPosition();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBiodataOpen, isServiceBiodataOpen, serviceOpenedFromCandidate, lastOpenedCandidateId, savedScrollPos]);

  // Transaction Receipt Modal
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Razorpay payment loader
  const [buyingPlanId, setBuyingPlanId] = useState(null);

  // Sync tab with URL on URL parameter changes (e.g. browser back/forward or external links)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (searchParams.get("newUser") === "true") {
      setActiveTab("edit");
    } else if (tab === "search") {
      setActiveTab("matches");
      setSearchParams({ tab: "matches" }, { replace: true });
    } else if (tab) {
      setActiveTab((prev) => (prev !== tab ? tab : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const switchTab = (tabKey) => {
    setMobileDrawerOpen(false);
    setIsBiodataOpen(false);
    setSelectedMatch(null);
    if (tabKey !== "services") {
      setIsServiceBiodataOpen(false);
      setSelectedService(null);
      setServiceOpenedFromCandidate(null);
    }
    if (!tabKey) return;
    if (tabKey !== activeTab) {
      setActiveTab(tabKey);
      setSearchParams({ tab: tabKey }, { replace: true });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // -------------------------------------------------------------
  // Data Fetching: Strictly from Backend Models
  // -------------------------------------------------------------
  const Get = async () => {
    setIsLoading(true);
    try {
      const [
        userdata,
        USerResponse,
        statesData,
        castesData,
        rawProfessions,
        rawReligions,
        rawLanguages,
        rawColors,
        rawNearDist,
        rawWishlist,
        rawIncomingWishlist,
        rawApprovedWishlist,
        rawPlans,
        rawTxns,
        rawHelpTickets,
        rawSupportTargets,
        rawStaffData,
        rawServicesMaster,
        rawServicesData,
      ] = await Promise.all([
        UserDataGetwt().catch(() => []),
        UserRegGet().catch(() => []),
        User_StateGet().catch(() => []),
        User_CasteGet().catch(() => []),
        ProfessionGet().catch(() => []),
        ReligionGet().catch(() => []),
        LanguageGet().catch(() => []),
        ColorGet().catch(() => []),
        NearDistGet().catch(() => []),
        WishListGet().catch(() => []),
        WishListIncomingGet().catch(() => []),
        WishListApprovedGet().catch(() => []),
        PlanGet().catch(() => []),
        UserTransactionsGet(user_id).catch(() => []),
        HelpGet().catch(() => []),
        HelpTargetsGet().catch(() => ({ has_staff: false, added_by_type: "admin" })),
        StaffDataGet().catch(() => []),
        ServiceGet().catch(() => []),
        ServiceDataGet({ active_only: true }).catch(() => []),
      ]);

      // 0. Active services master categories from Services model (sequenced strictly by Services model ID)
      const activeMasterCats = (Array.isArray(rawServicesMaster) ? rawServicesMaster : [])
        .filter((s) => s.Active !== false && s.is_active !== false)
        .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
      setServiceCategories(activeMasterCats);

      const activeCatSet = new Set(
        activeMasterCats
          .flatMap((c) => [c.Service_Type, c.Service_Name])
          .filter(Boolean)
          .map((str) => String(str).trim().toLowerCase())
      );

      // Filter rawServicesData according to strict user rules:
      // 1. Must be Active (not disabled or inactive)
      // 2. Must be Admin Approved (Admin_Approval === true and not pending)
      // 3. Valid_Upto must not be expired / in past (do not show exited date from Valid_Upto)
      // 4. Service category must be active in services model
      const todayStr = new Date().toISOString().split("T")[0];
      const validServices = (Array.isArray(rawServicesData) ? rawServicesData : []).filter((item) => {
        if (!item) return false;
        if (item.Active === false || item.is_active === false || !item.Active) return false;
        const statusStr = String(item.Status || item.status || "").trim().toLowerCase();
        if (["deactive", "inactive", "deactivated", "disabled"].includes(statusStr)) return false;

        // Admin approval check
        if (item.Admin_Approval !== true || statusStr === "pending") return false;

        // Listing expiration check
        if (!item.Valid_Upto) return false;
        const vu = String(item.Valid_Upto).trim().split("T")[0];
        if (vu < todayStr) return false;

        const sType = (item.Service_Type || "").trim().toLowerCase();
        const sName = (item.Service_Name || "").trim().toLowerCase();
        if (activeCatSet.size > 0 && !activeCatSet.has(sType) && !activeCatSet.has(sName)) {
          return false;
        }

        return true;
      });
      setServicesList(validServices);

      // 1. Active states from backend States model
      if (Array.isArray(statesData)) {
        setStatesList(statesData.filter((s) => s.Active !== false && s.is_active !== false));
      }

      // 1b. Active NearDist records from NearDist model
      if (Array.isArray(rawNearDist)) {
        setNearDistMasterList(rawNearDist.filter((n) => n.Active !== false && n.is_active !== false));
      }

      // 2. Save raw castes data for dynamic filtering by Religion & State
      const activeCastesData = Array.isArray(castesData)
        ? castesData.filter((c) => c.Active !== false && c.is_active !== false)
        : [];
      setRawCastesData(activeCastesData);

      // Parse castes from Caste model (Caste_Name JSONField) + candidates for fallback
      const parsedCastes = [];
      if (Array.isArray(castesData)) {
        castesData.forEach((item) => {
          if (item.Active === false || item.is_active === false) return;
          if (Array.isArray(item.Caste_Name)) {
            item.Caste_Name.forEach((c) => {
              if (c && typeof c === "string" && c.trim()) parsedCastes.push(c.trim());
            });
          } else if (typeof item.Caste_Name === "string" && item.Caste_Name.trim()) {
            try {
              const arr = JSON.parse(item.Caste_Name);
              if (Array.isArray(arr)) {
                arr.forEach((c) => {
                  if (c && typeof c === "string" && c.trim()) parsedCastes.push(c.trim());
                });
              } else if (typeof arr === "string" && arr.trim()) {
                parsedCastes.push(arr.trim());
              }
            } catch {
              parsedCastes.push(item.Caste_Name.trim());
            }
          } else if (item.caste || item.Caste) {
            const c = (item.caste || item.Caste).trim();
            if (c) parsedCastes.push(c);
          }
        });
      }
      if (Array.isArray(userdata)) {
        userdata.forEach((u) => {
          const c = (u.caste || u.Caste || "").trim();
          if (c) parsedCastes.push(c);
        });
      }

      // 3. Parse Religions from backend Religion model + defaults
      const parsedReligions = [];
      if (Array.isArray(rawReligions)) {
        rawReligions.forEach((item) => {
          if (item.Active === false || item.is_active === false) return;
          const rName = (item.Religion_Name || item.religion_name || item.name || item.Religion || "").trim();
          if (rName) parsedReligions.push(rName);
        });
      }
      ["Hindu", "Jain", "Sikh", "Buddhist", "Muslim", "Christian"].forEach((r) => {
        if (!parsedReligions.includes(r)) parsedReligions.push(r);
      });
      setReligionsList(Array.from(new Set(parsedReligions)).filter(Boolean));

      // 4. Parse Languages from backend Language model + defaults
      const parsedLanguages = [];
      if (Array.isArray(rawLanguages)) {
        rawLanguages.forEach((item) => {
          if (item.Active === false || item.is_active === false) return;
          const lName = (item.Language || item.language || item.name || "").trim();
          if (lName) parsedLanguages.push(lName);
        });
      }
      [
        "Hindi", "English", "Chhattisgarhi", "Marathi", "Punjabi", "Gujarati",
        "Bengali", "Odia", "Telugu", "Tamil", "Kannada", "Malayalam", "Bhojpuri", "Marwari"
      ].forEach((l) => {
        if (!parsedLanguages.includes(l)) parsedLanguages.push(l);
      });
      setLanguagesList(Array.from(new Set(parsedLanguages)).filter(Boolean));

      // 4b. Parse Colors / Complexions from backend Color model + polite standard choices
      const politeColorMap = {
        Fair: "Fair (गोरा)",
        "Very Fair": "Very Fair (अत्यंत गोरा)",
        Wheatish: "Wheatish (गेहुंआ)",
        "Wheatish Medium": "Wheatish Medium (सांवला)",
        Dark: "Dark (सांवला / गहरा)",
      };
      const parsedColors = [];
      if (Array.isArray(rawColors) && rawColors.length > 0) {
        rawColors.forEach((item) => {
          if (item.Active === false || item.is_active === false) return;
          const cName = (item.Color || item.color || item.name || "").trim();
          if (cName) {
            parsedColors.push({
              value: cName,
              label: politeColorMap[cName] || cName,
            });
          }
        });
      }
      if (parsedColors.length === 0) {
        Object.entries(politeColorMap).forEach(([val, label]) => {
          parsedColors.push({ value: val, label });
        });
      }
      setColorsList(parsedColors);

      // 5. Parse professions from Profession model + candidates
      const parsedProfessions = [];
      if (Array.isArray(rawProfessions)) {
        rawProfessions.forEach((item) => {
          if (item.Active === false || item.is_active === false) return;
          const p = item.Profession_Name || item.profession_name || item.name || item.Profession || item.profession;
          if (p && typeof p === "string" && p.trim()) {
            parsedProfessions.push(p.trim());
          }
        });
      }
      if (Array.isArray(userdata)) {
        userdata.forEach((u) => {
          const p = (u.profession || u.Profession || u.job_title || "").trim();
          if (p) parsedProfessions.push(p);
        });
      }
      if (parsedProfessions.length === 0) {
        parsedProfessions.push(
          "Software Engineer / IT",
          "Govt. Employee / Civil Services",
          "Business / Entrepreneur",
          "Doctor / Healthcare",
          "Banking / Finance / CA",
          "Teacher / Professor",
          "Private Sector / Corporate",
          "Lawyer / Legal",
          "Civil / Mechanical Engineer"
        );
      }
      const uniqueProfessions = Array.from(new Set(parsedProfessions)).filter(Boolean).sort((a, b) => a.localeCompare(b));
      setProfessionsList(uniqueProfessions);

      // 2. All active candidates from User_Data model (excluding self)
      const parsedCandidateArray = Array.isArray(userdata)
        ? userdata
        : (userdata && Array.isArray(userdata.results) ? userdata.results : []);
      setAllCandidates(
        parsedCandidateArray.filter((u) => isCandidateProfileAvailable(u, user_id))
      );

      // 3. Wishlist from Wish_List model
      if (Array.isArray(rawWishlist)) {
        setWishlistItems(rawWishlist);
        const ids = rawWishlist
          .filter((w) => w.Status !== "Rejected" && w.is_shortlisted !== false)
          .map((w) => String(w.Wish_User_id || w.wish_user_id));
        setWishlistIds(ids);
      }
      if (Array.isArray(rawIncomingWishlist)) {
        setIncomingWishlistItems(rawIncomingWishlist);
      }
      if (Array.isArray(rawApprovedWishlist)) {
        setApprovedWishlistItems(rawApprovedWishlist);
      }

      // 4. Plans strictly from backend Plans model (no hardcoded fallback)
      if (Array.isArray(rawPlans)) {
        setPlansList(rawPlans.filter((p) => p.Active !== false));
      } else {
        setPlansList([]);
      }

      // 5. Transactions from User_Transactions model
      if (Array.isArray(rawTxns)) {
        const userTxns = rawTxns.filter(
          (t) => String(t.User_id || t.user_id) === String(user_id) || !t.User_id
        );
        userTxns.sort(
          (a, b) =>
            new Date(b.Create_date || b.created_at || 0) -
            new Date(a.Create_date || a.created_at || 0)
        );
        setTransactionsList(userTxns);
      }

      // 5b. Help tickets from Help model
      if (Array.isArray(rawHelpTickets)) {
        setHelpTickets(rawHelpTickets);
      } else {
        setHelpTickets([]);
      }

      // Determine who added this user (Staff vs Admin)
      let resolvedSupportTargets = rawSupportTargets && rawSupportTargets.has_staff ? rawSupportTargets : null;
      if (!resolvedSupportTargets || !resolvedSupportTargets.has_staff) {
        const refCode = Number(
          (Array.isArray(USerResponse) ? USerResponse.find((u) => String(u.id) === String(user_id))?.Refered_By : 0) ||
          (Array.isArray(userdata) ? userdata.find((i) => String(i.User_id) === String(user_id))?.Refer : 0) ||
          0
        );
        if (refCode && Array.isArray(USerResponse)) {
          const referrerStaff = USerResponse.find(
            (u) =>
              (Number(u.Reference_Code) === refCode || Number(u.id) === refCode) &&
              String(u.Role).toLowerCase() === "staff"
          );
          if (referrerStaff) {
            const staffDetails = Array.isArray(rawStaffData)
              ? rawStaffData.find(
                  (s) =>
                    String(s.Staff_id || s.staff_id) === String(referrerStaff.id) ||
                    Number(s.Refer) === refCode
                )
              : null;
            resolvedSupportTargets = {
              has_staff: true,
              added_by_type: "staff",
              staff: {
                id: referrerStaff.id,
                Reference_Code: referrerStaff.Reference_Code,
                name: staffDetails?.Full_Name || referrerStaff.username || "Assigned Staff Counselor",
                contact: staffDetails?.WP_Contact || referrerStaff.Contact || "",
                email: staffDetails?.Email || "",
              },
              admin: rawSupportTargets?.admin || { name: "Vaivaheek Manch Head Office Admin" },
            };
          }
        }
      }

      if (resolvedSupportTargets && resolvedSupportTargets.has_staff) {
        setSupportTargets(resolvedSupportTargets);
        setSelectedHelpTarget("staff");
      } else {
        const adminUserObj = Array.isArray(USerResponse)
          ? USerResponse.find(
              (u) => ["admin", "superadmin"].includes(String(u.Role).toLowerCase()) || u.is_superuser
            )
          : null;
        setSupportTargets({
          has_staff: false,
          added_by_type: "admin",
          staff: null,
          admin: {
            id: adminUserObj?.id || rawSupportTargets?.admin?.id,
            Reference_Code: adminUserObj?.Reference_Code || rawSupportTargets?.admin?.Reference_Code,
            name: rawSupportTargets?.admin?.name || "Vaivaheek Manch Head Office Admin",
            contact: adminUserObj?.Contact || rawSupportTargets?.admin?.contact || "",
          },
        });
        setSelectedHelpTarget("admin");
      }

      // 6. User Profile (User_Data & User models)
      const filteruser = Array.isArray(userdata)
        ? userdata.filter((i) => String(i.User_id) === String(user_id))
        : [];
      const logedUser = Array.isArray(USerResponse)
        ? USerResponse.filter((i) => String(i.id) === String(user_id))
        : [];

      const rawUserGender =
        filteruser[0]?.gender ||
        filteruser[0]?.Gender ||
        logedUser[0]?.gender ||
        localStorage.getItem("user_gender") ||
        localStorage.getItem("gender") ||
        "";
      const rawUserCaste =
        filteruser[0]?.caste ||
        filteruser[0]?.Caste ||
        "";

      const combinedUser = {
        ...(logedUser[0] || {}),
        ...(filteruser[0] || {}),
        gender: rawUserGender,
        Gender: rawUserGender,
        caste: rawUserCaste,
        Caste: rawUserCaste,
      };

      setData([combinedUser]);

      const isProfileDone = Boolean(
        filteruser.length > 0 &&
        (filteruser[0]?.Full_Name || filteruser[0]?.firstname || filteruser[0]?.first_name) &&
        (filteruser[0]?.Gender || filteruser[0]?.gender)
      );
      setHasCompletedProfile(isProfileDone);

      const activeVal = filteruser[0]?.Active !== undefined
        ? filteruser[0]?.Active
        : (filteruser[0]?.is_active !== undefined ? filteruser[0]?.is_active : true);
      setIsProfileActive(activeVal !== false);

      // Populate district list for edit form and set initial State in filter fields from user_data
      const userState = combinedUser.state || combinedUser.State;
      const userDist = combinedUser.district || combinedUser.District;
      if (userState && Array.isArray(statesData)) {
        const matchState = statesData.find(
          (s) => (s.state || s.State || "").toLowerCase() === userState.toLowerCase()
        );
        if (matchState) {
          const rawDist = matchState.disttrict || matchState.district || matchState.districts || matchState.Districts || [];
          const dists = Array.isArray(rawDist) ? [...rawDist] : [];
          if (userDist && !dists.includes(userDist)) {
            dists.unshift(userDist);
          }
          setDistrictList(dists);

          const resolvedState = matchState.state || matchState.State || userState;

          // Set state field from user_data (only state fill; district remains "all" and is based on state)
          setMatchStateFilter(resolvedState);
          setMatchDistrictsList(dists);
          setMatchDistrictFilter("all");
        } else {
          if (userDist) {
            setDistrictList([userDist]);
          }
          setMatchStateFilter(userState);
          setMatchDistrictFilter("all");
        }
      } else if (userDist) {
        setDistrictList([userDist]);
      }

      // Default service district filter to user's district from user_data
      if (userDist) {
        setServiceDistrictFilter(userDist);
      } else {
        setServiceDistrictFilter("all");
      }

    } catch (err) {
      console.error("UserPanel load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/UserLogin/");
      return;
    }
    Get();

    // Inject Razorpay script for plans payment
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dynamic handlers for cascade selections (State -> District & State/Religion -> Caste)
  const handleFormStateChange = (val) => {
    setFormSelectedState(val || "");
    form.setFieldsValue({ district: undefined, caste: undefined });
    setInternalNearDist([]);
    if (!val) {
      setDistrictList([]);
      setFormFilteredCastes(computeCastesForForm(formSelectedReligion, "", rawCastesData, ""));
      return;
    }
    const matched = statesList.find(
      (s) => (s.state || s.State || "").toLowerCase() === String(val).toLowerCase()
    );
    const rawDist = matched ? (matched.disttrict || matched.district || matched.Districts || matched.districts || []) : [];
    const dists = Array.isArray(rawDist) ? [...rawDist] : [];
    setDistrictList(dists);

    // Recompute castes strictly for (religion, state) from backend
    const currentRel = form.getFieldValue("religion") || formSelectedReligion || "Hindu";
    setFormFilteredCastes(computeCastesForForm(currentRel, val, rawCastesData, ""));
  };

  const handleFormDistrictChange = async (distVal) => {
    form.setFieldsValue({ district: distVal });
    if (!distVal) {
      setInternalNearDist([]);
      return;
    }
    const currentState = form.getFieldValue("state") || formSelectedState || "";
    let nearby = [];

    // 1. Fetch NearDist directly from backend API for the selected district
    try {
      const res = await NearDistGet({ district: distVal, state: currentState });
      if (Array.isArray(res) && res.length > 0) {
        const matched = res.find(
          (nd) => (nd.District || nd.district || "").trim().toLowerCase() === String(distVal).trim().toLowerCase()
        ) || res[0];
        const rawList = matched.Neardist || matched.neardist || [];
        if (Array.isArray(rawList)) {
          nearby = rawList;
        } else if (typeof rawList === "string") {
          try {
            nearby = JSON.parse(rawList);
          } catch {
            nearby = rawList.split(",").map((x) => x.trim()).filter(Boolean);
          }
        }
      }
    } catch (e) {
      console.warn("Backend NearDist query error:", e);
    }

    // 2. Check cached nearDistMasterList from backend if query didn't return
    if ((!nearby || nearby.length === 0) && Array.isArray(nearDistMasterList) && nearDistMasterList.length > 0) {
      let matchedNear = nearDistMasterList.find(
        (nd) =>
          (nd.District || nd.district || "").trim().toLowerCase() === String(distVal).trim().toLowerCase() &&
          (!currentState || (nd.State || nd.state || "").trim().toLowerCase() === String(currentState).trim().toLowerCase())
      );
      if (!matchedNear) {
        matchedNear = nearDistMasterList.find(
          (nd) => (nd.District || nd.district || "").trim().toLowerCase() === String(distVal).trim().toLowerCase()
        );
      }
      if (matchedNear) {
        const rawList = matchedNear.Neardist || matchedNear.neardist || [];
        if (Array.isArray(rawList)) {
          nearby = rawList;
        } else if (typeof rawList === "string") {
          try {
            nearby = JSON.parse(rawList);
          } catch {
            nearby = rawList.split(",").map((x) => x.trim()).filter(Boolean);
          }
        }
      }
    }

    // 3. Fallback to other districts in current state from States_With_Districts model
    if ((!nearby || nearby.length === 0) && currentState && statesList.length > 0) {
      const matchedState = statesList.find(
        (s) => (s.state || s.State || "").trim().toLowerCase() === String(currentState).trim().toLowerCase()
      );
      if (matchedState) {
        const stateDists =
          matchedState.disttrict || matchedState.district || matchedState.Districts || matchedState.districts || [];
        if (Array.isArray(stateDists)) {
          nearby = stateDists
            .filter((d) => String(d).trim().toLowerCase() !== String(distVal).trim().toLowerCase())
            .slice(0, 10);
        }
      }
    }

    const cleanList = Array.from(new Set((Array.isArray(nearby) ? nearby : []).map((d) => String(d).trim()).filter(Boolean)));
    setInternalNearDist(cleanList);
  };

  const handleDobChange = (dobVal) => {
    form.setFieldsValue({ dob: dobVal });
    if (!dobVal) return;
    const birthDate = new Date(dobVal);
    if (!Number.isNaN(birthDate.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age >= 18 && age <= 120) {
        form.setFieldsValue({ age });
      }
    }
  };

  const handleFormReligionChange = (val) => {
    setFormSelectedReligion(val || "Hindu");
    form.setFieldsValue({ caste: undefined });
    const currentState = form.getFieldValue("state") || formSelectedState || "";
    setFormFilteredCastes(computeCastesForForm(val, currentState, rawCastesData, ""));
  };

  const handleJobTypeChange = (val) => {
    setFormJobType(val || "Private");
    form.setFieldsValue({ job_type: val });
    if (val === "Not Working") {
      form.setFieldsValue({ salary: 0 });
    }
  };

  // Synchronize edit profile form values only when the Edit tab is active and form is mounted
  useEffect(() => {
    if (activeTab === "edit" && data && data[0]) {
      const combinedUser = data[0];
      const rawUserGender = String(combinedUser.gender || combinedUser.Gender || "").trim();
      const normalizedGender =
        rawUserGender.toLowerCase() === "male"
          ? "Male"
          : rawUserGender.toLowerCase() === "female"
          ? "Female"
          : rawUserGender || undefined;
      const rawUserCaste = (combinedUser.caste || combinedUser.Caste || "").trim();
      const userState = combinedUser.state || combinedUser.State || "";
      const userDist = combinedUser.district || combinedUser.District || "";
      const userRel = combinedUser.religion || combinedUser.Religion || "Hindu";
      const userJobType = combinedUser.job_type || combinedUser.Job_type || "Private";

      setFormSelectedState(userState);
      setFormSelectedReligion(userRel);
      setFormJobType(userJobType);

      // Recompute filtered castes based on user's current religion & state from backend
      const computedCastes = computeCastesForForm(userRel, userState, rawCastesData, rawUserCaste);
      setFormFilteredCastes(computedCastes);

      // Ensure districtList contains user's current district and state districts
      if (userState && statesList.length > 0) {
        const matchState = statesList.find(
          (s) => (s.state || s.State || "").toLowerCase() === userState.toLowerCase()
        );
        if (matchState) {
          const rawDist = matchState.disttrict || matchState.district || matchState.Districts || matchState.districts || [];
          const dists = Array.isArray(rawDist) ? [...rawDist] : [];
          if (userDist && !dists.includes(userDist)) dists.unshift(userDist);
          setDistrictList(dists);
        } else if (userDist) {
          setDistrictList([userDist]);
        }
      }

      const formattedDob = parseToDateInput(combinedUser.dob || combinedUser.DOB);
      let derivedAge = combinedUser.age || combinedUser.Age || undefined;
      if (!derivedAge && formattedDob) {
        const bDate = new Date(formattedDob);
        if (!Number.isNaN(bDate.getTime())) {
          const today = new Date();
          let calculated = today.getFullYear() - bDate.getFullYear();
          const m = today.getMonth() - bDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) calculated--;
          if (calculated >= 18 && calculated <= 120) derivedAge = calculated;
        }
      }

      const rawUserNear = Array.isArray(combinedUser.nearestdist)
        ? combinedUser.nearestdist
        : (Array.isArray(combinedUser.Nearestdist) ? combinedUser.Nearestdist : []);
      if (rawUserNear.length > 0) {
        setInternalNearDist(rawUserNear);
      } else if (userDist && nearDistMasterList.length > 0) {
        const matchedNear = nearDistMasterList.find(
          (nd) => (nd.District || nd.district || "").toLowerCase() === userDist.toLowerCase()
        );
        if (matchedNear) {
          const rawList = matchedNear.Neardist || matchedNear.neardist || [];
          setInternalNearDist(Array.isArray(rawList) ? rawList : (typeof rawList === "string" ? JSON.parse(rawList) : []));
        }
      }

      try {
        form.setFieldsValue({
          ...combinedUser,
          firstname: combinedUser.firstname || combinedUser.Full_Name || combinedUser.first_name || "",
          gender: normalizedGender,
          caste: rawUserCaste || undefined,
          gotra: combinedUser.gotra || combinedUser.Gotra || undefined,
          dob: formattedDob,
          age: derivedAge,
          height: combinedUser.height || combinedUser.Height || undefined,
          weight: combinedUser.weight || combinedUser.Weight || undefined,
          color: combinedUser.color || combinedUser.Color || combinedUser.complexion || combinedUser.Complexion || undefined,
          qualification: combinedUser.qualification || combinedUser.Qualification || combinedUser.course || undefined,
          profession: combinedUser.profession || combinedUser.Profession || combinedUser.job_title || undefined,
          job_type: combinedUser.job_type || combinedUser.Job_type || undefined,
          salary: combinedUser.salary || combinedUser.Salary || undefined,
          father_name: combinedUser.father_name || combinedUser.Father_name || undefined,
          father_age: combinedUser.father_age || combinedUser.Father_Age || undefined,
          father_profession: combinedUser.father_profession || combinedUser.Father_Profession || undefined,
          mother_name: combinedUser.mother_name || combinedUser.Mother_name || undefined,
          mother_age: combinedUser.mother_age || combinedUser.Mother_Age || undefined,
          mother_profession: combinedUser.mother_profession || combinedUser.Mother_Profession || undefined,
          brothers: combinedUser.brothers || combinedUser.Brothers || "0",
          brothers_marrige: combinedUser.brothers_marrige || combinedUser.Brothers_marrige || "0",
          sisters: combinedUser.sisters || combinedUser.Sisters || "0",
          sisters_marrige: combinedUser.sisters_marrige || combinedUser.Sisters_marrige || "0",
          house: combinedUser.house || combinedUser.House || "Self",
          religion: userRel,
          marrige_status: combinedUser.marrige_status || combinedUser.Marrige_status || "Unmarried",
          manglik: combinedUser.manglik !== undefined ? combinedUser.manglik : (combinedUser.Manglik !== undefined ? combinedUser.Manglik : false),
          disability: combinedUser.disability !== undefined ? combinedUser.disability : (combinedUser.Disability !== undefined ? combinedUser.Disability : false),
          vegeterian: combinedUser.vegeterian || combinedUser.Vegeterian || "Vegeterian",
          mother_tongue: combinedUser.mother_tongue || combinedUser.Mother_tongue || "Hindi",
          state: userState || undefined,
          district: userDist || undefined,
          city: combinedUser.city || combinedUser.City || undefined,
          country: combinedUser.country || combinedUser.Country || "India",
          full_address: combinedUser.full_address || combinedUser.Full_Address || undefined,
          contact: combinedUser.contact || combinedUser.WP_Contact || combinedUser.Contact || undefined,
          wp_contact_relation: combinedUser.wp_contact_relation || combinedUser.WP_Contact_Relation || (combinedUser.Wp_Contact_Name && ["Self", "Father", "Mother", "Brother", "Sister", "Guardian", "Relative"].includes(combinedUser.Wp_Contact_Name) ? combinedUser.Wp_Contact_Name : "Self"),
          wp_contact_name: combinedUser.wp_contact_name || (combinedUser.Wp_Contact_Name && !/^\d+$/.test(combinedUser.Wp_Contact_Name) && !["Self", "Father", "Mother", "Brother", "Sister", "Guardian", "Relative"].includes(combinedUser.Wp_Contact_Name) ? combinedUser.Wp_Contact_Name : undefined),
          alt_contact: combinedUser.alt_contact || combinedUser.Alt_Contact || undefined,
          alt_contact_relation: combinedUser.alt_contact_relation || combinedUser.Alt_Contact_Relation || (combinedUser.Alt_Contact_Name && ["Self", "Father", "Mother", "Brother", "Sister", "Guardian", "Relative"].includes(combinedUser.Alt_Contact_Name) ? combinedUser.Alt_Contact_Name : "Father"),
          alt_contact_name: combinedUser.alt_contact_name || (combinedUser.Alt_Contact_Name && !/^\d+$/.test(combinedUser.Alt_Contact_Name) && !["Self", "Father", "Mother", "Brother", "Sister", "Guardian", "Relative"].includes(combinedUser.Alt_Contact_Name) ? combinedUser.Alt_Contact_Name : undefined),
          email: combinedUser.email || combinedUser.Email || undefined,
        });
      } catch (e) {
        console.warn("Form fields sync warning:", e);
      }
    }
  }, [activeTab, data, form, statesList, rawCastesData, nearDistMasterList]);

  // -------------------------------------------------------------
  // Profile Picture Upload
  // -------------------------------------------------------------
  const Upload_pic = async () => {
    if (!file || !(file instanceof File)) return;
    try {
      message.loading({ content: "Uploading profile image...", key: "upload" });
      const picUpdate = new FormData();
      picUpdate.append("pic", file);
      picUpdate.append("Profile_Pic", file);

      await UserDataUpdate(user_id, picUpdate);
      await UserRegUpdate(user_id, picUpdate);

      message.success({ content: "Profile image updated successfully!", key: "upload" });
      setFile(null);
      Get();
    } catch (error) {
      console.error(error);
      message.error({ content: "Image upload failed", key: "upload" });
    }
  };

  useEffect(() => {
    if (file) {
      Upload_pic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // -------------------------------------------------------------
  // Edit Profile Update Handler (Maps all User_Data model fields)
  // -------------------------------------------------------------
  const handleProfileSave = async (values) => {
    setIsLoading(true);
    try {
      let calculatedAge = null;
      if (values.age !== undefined && values.age !== null && values.age !== "" && !Number.isNaN(Number(values.age))) {
        calculatedAge = Number(values.age);
      } else if (values.dob) {
        const birthDate = new Date(values.dob);
        if (!Number.isNaN(birthDate.getTime())) {
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          if (age >= 18 && age <= 100) {
            calculatedAge = age;
          }
        }
      }

      const currentUser = data?.[0] || {};

      // 1. Sync User registration model (clean JSON object)
      const userUpdate = {
        first_name: values.firstname || currentUser.firstname || currentUser.Full_Name || "",
      };
      if (values.email) userUpdate.email = values.email;
      if (values.contact && values.contact !== currentUser.Contact && values.contact !== currentUser.contact) {
        userUpdate.Contact = values.contact;
      }

      // 2. Sync User_Data model with all extra fields
      const formData = new FormData();
      formData.append("User_id", user_id);
      formData.append("username", currentUser.username || currentUser.contact || "");
      formData.append("Full_Name", values.firstname || currentUser.firstname || "");
      formData.append("firstname", values.firstname || currentUser.firstname || "");

      const finalAge = calculatedAge || currentUser.Age || currentUser.age;
      if (finalAge !== undefined && finalAge !== null && finalAge !== "" && !Number.isNaN(Number(finalAge))) {
        formData.append("Age", String(Math.round(Number(finalAge))));
      }

      if (values.dob) {
        formData.append("DOB", String(values.dob));
      }
      if (values.contact) {
        formData.append("WP_Contact", String(values.contact));
        formData.append("contact", String(values.contact));
      }
      if (values.wp_contact_relation) {
        formData.append("WP_Contact_Relation", String(values.wp_contact_relation));
      }
      if (values.alt_contact) {
        formData.append("Alt_Contact", String(values.alt_contact));
      }
      if (values.alt_contact_relation) {
        formData.append("Alt_Contact_Relation", String(values.alt_contact_relation));
      }
      if (values.email) {
        formData.append("Email", String(values.email));
      }
      if (values.gender) {
        formData.append("Gender", String(values.gender));
        formData.append("gender", String(values.gender));
        localStorage.setItem("user_gender", values.gender);
      }
      if (values.caste) {
        formData.append("Caste", String(values.caste));
        formData.append("caste", String(values.caste));
      }
      if (values.gotra) {
        formData.append("Gotra", String(values.gotra).trim());
        formData.append("gotra", String(values.gotra).trim());
      }
      if (values.religion) formData.append("Religion", String(values.religion));
      if (values.state) formData.append("State", String(values.state));
      if (values.district) formData.append("District", String(values.district));
      if (values.city) formData.append("City", String(values.city));
      if (values.full_address) formData.append("Full_Address", String(values.full_address));
      if (values.qualification) formData.append("Qualification", String(values.qualification));
      if (values.profession) formData.append("Profession", String(values.profession));
      if (values.job_type) formData.append("Job_type", String(values.job_type));

      if (values.job_type === "Not Working" || formJobType === "Not Working") {
        formData.append("Salary", "0");
      } else if (values.salary !== undefined && values.salary !== null && values.salary !== "" && !Number.isNaN(Number(values.salary))) {
        formData.append("Salary", String(Math.round(Number(values.salary))));
      }
      if (values.height !== undefined && values.height !== null && values.height !== "" && !Number.isNaN(Number(values.height))) {
        formData.append("Height", String(Number(values.height)));
      }
      if (values.weight !== undefined && values.weight !== null && values.weight !== "" && !Number.isNaN(Number(values.weight))) {
        formData.append("Weight", String(Number(values.weight)));
      }
      if (values.color) {
        formData.append("Color", String(values.color));
      }
      if (values.mother_tongue) formData.append("Mother_tongue", String(values.mother_tongue));
      if (values.marrige_status) formData.append("Marrige_status", String(values.marrige_status));
      if (values.manglik !== undefined) formData.append("Manglik", values.manglik ? "true" : "false");
      if (values.vegeterian) formData.append("Vegeterian", String(values.vegeterian));
      if (values.house) formData.append("House", String(values.house));
      if (values.father_name) formData.append("Father_name", String(values.father_name));
      if (values.father_age !== undefined && values.father_age !== null && values.father_age !== "" && !Number.isNaN(Number(values.father_age))) {
        formData.append("Father_Age", String(Math.round(Number(values.father_age))));
      }
      if (values.father_profession) formData.append("Father_Profession", String(values.father_profession));
      if (values.mother_name) formData.append("Mother_name", String(values.mother_name));
      if (values.mother_age !== undefined && values.mother_age !== null && values.mother_age !== "" && !Number.isNaN(Number(values.mother_age))) {
        formData.append("Mother_Age", String(Math.round(Number(values.mother_age))));
      }
      if (values.mother_profession) formData.append("Mother_Profession", String(values.mother_profession));
      if (values.brothers) formData.append("Brothers", String(values.brothers));
      if (values.brothers_marrige) formData.append("Brothers_marrige", String(values.brothers_marrige));
      if (values.sisters) formData.append("Sisters", String(values.sisters));
      if (values.sisters_marrige) formData.append("Sisters_marrige", String(values.sisters_marrige));
      formData.append("Country", String(values.country || "India"));
      formData.append("Disability", values.disability ? "true" : "false");
      const candidateSelfName = values.firstname || currentUser.Full_Name || currentUser.firstname || "";
      if (values.wp_contact_relation === "Self" || !values.wp_contact_relation) {
        formData.append("Wp_Contact_Name", candidateSelfName);
      } else if (values.wp_contact_name && String(values.wp_contact_name).trim()) {
        formData.append("Wp_Contact_Name", String(values.wp_contact_name).trim());
      } else if (values.wp_contact_relation === "Father" && values.father_name) {
        formData.append("Wp_Contact_Name", String(values.father_name).trim());
      } else if (values.wp_contact_relation === "Mother" && values.mother_name) {
        formData.append("Wp_Contact_Name", String(values.mother_name).trim());
      } else {
        formData.append("Wp_Contact_Name", String(values.wp_contact_relation));
      }

      if (values.alt_contact_relation === "Self") {
        formData.append("Alt_Contact_Name", candidateSelfName);
      } else if (values.alt_contact_name && String(values.alt_contact_name).trim()) {
        formData.append("Alt_Contact_Name", String(values.alt_contact_name).trim());
      } else if (values.alt_contact_relation === "Father" && values.father_name) {
        formData.append("Alt_Contact_Name", String(values.father_name).trim());
      } else if (values.alt_contact_relation === "Mother" && values.mother_name) {
        formData.append("Alt_Contact_Name", String(values.mother_name).trim());
      } else {
        formData.append("Alt_Contact_Name", String(values.alt_contact_relation || "Father"));
      }
      // Nearestdist: auto select near dist in Nearestdist user_data field list format
      let finalNearDist = internalNearDist;
      if ((!finalNearDist || finalNearDist.length === 0) && values.district) {
        let matchedNear = nearDistMasterList.find(
          (nd) =>
            (nd.District || nd.district || "").trim().toLowerCase() === String(values.district).trim().toLowerCase() &&
            (!values.state || (nd.State || nd.state || "").trim().toLowerCase() === String(values.state).trim().toLowerCase())
        );
        if (!matchedNear) {
          matchedNear = nearDistMasterList.find(
            (nd) => (nd.District || nd.district || "").trim().toLowerCase() === String(values.district).trim().toLowerCase()
          );
        }
        if (matchedNear) {
          const rawList = matchedNear.Neardist || matchedNear.neardist || [];
          if (Array.isArray(rawList)) {
            finalNearDist = rawList;
          } else if (typeof rawList === "string") {
            try {
              finalNearDist = JSON.parse(rawList);
            } catch {
              finalNearDist = rawList.split(",").map((x) => x.trim()).filter(Boolean);
            }
          }
        } else if (values.state) {
          const matchedState = statesList.find(
            (s) => (s.state || s.State || "").trim().toLowerCase() === String(values.state).trim().toLowerCase()
          );
          if (matchedState) {
            const stateDists = matchedState.disttrict || matchedState.district || matchedState.Districts || matchedState.districts || [];
            if (Array.isArray(stateDists)) {
              finalNearDist = stateDists.filter((d) => String(d).trim().toLowerCase() !== String(values.district).trim().toLowerCase()).slice(0, 10);
            }
          }
        }
      }
      const cleanNearDistList = Array.from(
        new Set(
          (Array.isArray(finalNearDist) && finalNearDist.length > 0 ? finalNearDist : (currentUser.Nearestdist || currentUser.nearestdist || []))
            .map((d) => String(d).trim())
            .filter(Boolean)
        )
      );
      formData.append("Nearestdist", JSON.stringify(cleanNearDistList));

      // Accept_Profiles: handled internally without extra form field
      const currentAccept = Array.isArray(currentUser.Accept_Profiles)
        ? currentUser.Accept_Profiles
        : (Array.isArray(currentUser.accept_profiles) ? currentUser.accept_profiles : ["Open to compatible profiles"]);
      formData.append("Accept_Profiles", JSON.stringify(currentAccept));
      formData.append("Active", isProfileActive ? "true" : "false");

      await UserRegUpdate(user_id, userUpdate).catch(() => {});
      const res = await UserDataUpdate(user_id, formData);

      if (res && res.error) {
        message.error("Failed to update profile: " + (typeof res.error === "string" ? res.error : JSON.stringify(res.error)));
      } else {
        message.success("Profile details saved successfully!");
        await Get();
        switchTab("profile");
      }
    } catch (err) {
      console.error(err);
      message.error("Error saving profile details.");
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Activate / Deactivate Self Matrimonial Profile
  // -------------------------------------------------------------
  const handleToggleProfileActive = async (targetStatus) => {
    if (!hasCompletedProfile) {
      message.warning("⚠️ Please complete your profile details first before activating/deactivating.");
      switchTab("edit");
      return;
    }
    const profileId = user_id;
    setStatusToggleLoading(true);
    try {
      const res = await UserDataToggleActive(profileId, targetStatus);
      if (res) {
        setIsProfileActive(targetStatus);
        setIsStatusModalOpen(false);
        message.success(
          targetStatus
            ? "🎉 Profile activated! Your matrimonial biodata is now visible to candidates."
            : "⏸️ Profile deactivated. Your matrimonial biodata is now private and hidden."
        );
        await Get();
      }
    } catch (err) {
      console.error("Toggle profile status error:", err);
      message.error("Failed to update profile visibility status. Please try again.");
    } finally {
      setStatusToggleLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Shortlist / Wishlist Toggle
  // -------------------------------------------------------------
  const hasActiveMembership = () => {
    if (localStorage.getItem("is_staff") === "true" || localStorage.getItem("is_superuser") === "true") {
      return true;
    }
    const validUpto = data?.[0]?.Valid_Upto || data?.[0]?.valid_upto || user?.Valid_Upto || user?.valid_upto;
    if (validUpto) {
      const vuStr = String(validUpto).trim().split("T")[0];
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (vuStr && vuStr >= todayStr) {
        return true;
      }
    }
    return false;
  };

  const approvedPartnerIds = useMemo(() => {
    if (!Array.isArray(approvedWishlistItems)) return new Set();
    const set = new Set();
    approvedWishlistItems.forEach((item) => {
      const u1 = String(item.User_id || item.user_id || "");
      const u2 = String(item.Wish_User_id || item.wish_user_id || "");
      const currentIdStr = String(user_id || "");
      if (u1 && u1 !== currentIdStr) set.add(u1);
      if (u2 && u2 !== currentIdStr) set.add(u2);
    });
    return set;
  }, [approvedWishlistItems, user_id]);

  const checkPartnerApproved = (candidate) => {
    if (!candidate) return false;
    const cid = String(candidate.User_id || candidate.id || "");
    if (approvedPartnerIds.has(cid)) return true;
    if (
      Array.isArray(candidate.Accept_Profiles) &&
      candidate.Accept_Profiles.map(String).includes(String(user_id))
    ) {
      return true;
    }
    return false;
  };

  const getIncomingRequestForCandidate = (candidate) => {
    if (!candidate || !Array.isArray(incomingWishlistItems) || incomingWishlistItems.length === 0) return null;
    const cid = String(candidate.User_id || candidate.id || "");
    if (candidate.wishlistId) {
      const byId = incomingWishlistItems.find((item) => String(item.id) === String(candidate.wishlistId));
      if (byId) return byId;
    }
    if (cid) {
      const byUser = incomingWishlistItems.find(
        (item) => String(item.User_id || item.user_id) === cid
      );
      if (byUser) return byUser;
    }
    return null;
  };

  const getSensitiveAccessStatus = (candidate) => {
    // Self check: when previewing own profile, always allow full access
    const candIdStr = String(candidate?.User_id || candidate?.id || "");
    if (candIdStr && String(user_id) === candIdStr) {
      return {
        allowed: true,
        reason: "SELF",
        label: "👤 My Profile",
        help: "This is your own profile.",
      };
    }

    // Rule 1: Deactivated profile cannot see candidate contact or full address even if they have an active plan
    if (!isProfileActive) {
      return {
        allowed: false,
        reason: "RESTRICTED",
        label: "🔒 Access Restricted",
        help: "Access Restricted: Activate your profile in Profile Settings to unlock partner contact numbers and full address.",
      };
    }

    // Rule 2: Active subscription is strictly required to send requests or view contact / full address
    const hasPlan = hasActiveMembership();
    if (!hasPlan) {
      return {
        allowed: false,
        reason: "NO_PLAN",
        label: "👑 Membership Plan Required",
        help: "Active membership subscription required. Please activate a plan to send connection requests and view candidate contact numbers and full address.",
      };
    }

    // Rule 3: Mutual connection approval check
    const isApproved = checkPartnerApproved(candidate);
    if (!isApproved) {
      const incomingReq = getIncomingRequestForCandidate(candidate);
      if (incomingReq) {
        const candName = candidate?.firstname || candidate?.Full_Name || candidate?.first_name || "Partner";
        return {
          allowed: false,
          reason: "INCOMING_PENDING",
          incomingReqId: incomingReq.id,
          label: "🔒 Approve Profile to Reveal Contact",
          help: `To view contact details and address, approve ${candName}'s profile request first.`,
        };
      }

      return {
        allowed: false,
        reason: "NOT_APPROVED",
        label: "🔒 Partner Approval Required",
        help: "Partner approval required. Once the candidate approves your connection request, contact and address details are revealed.",
      };
    }

    if (candidate && candidate.can_view_sensitive_details === false) {
      const incomingReq = getIncomingRequestForCandidate(candidate);
      if (incomingReq) {
        const candName = candidate?.firstname || candidate?.Full_Name || candidate?.first_name || "Partner";
        return {
          allowed: false,
          reason: "INCOMING_PENDING",
          incomingReqId: incomingReq.id,
          label: "🔒 Approve Profile to Reveal Contact",
          help: `To view contact details and address, approve ${candName}'s profile request first.`,
        };
      }

      return {
        allowed: false,
        reason: "NOT_APPROVED",
        label: "🔒 Partner Approval Required",
        help: "Partner approval required to reveal contact and full address details.",
      };
    }

    return {
      allowed: true,
      reason: "ALLOWED",
      label: "Unlocked",
      help: "",
    };
  };

  const handleSensitiveClick = (candidate, actionName = "Contact / Details") => {
    const status = getSensitiveAccessStatus(candidate);
    const candName = candidate?.firstname || candidate?.Full_Name || candidate?.first_name || "Candidate";

    if (status.reason === "RESTRICTED") {
      message.warning(
        `🔒 Access Restricted: Partner contact details and full residential address are restricted while your profile is deactivated. Please activate your profile in Profile Settings to unlock.`
      );
      setIsStatusModalOpen(true);
      return;
    }

    if (status.reason === "INCOMING_PENDING") {
      message.info(
        `🔒 Connection Request Received: To view contact details and full address, please approve ${candName}'s profile request first.`
      );
      return;
    }

    if (status.reason === "NOT_APPROVED") {
      message.info(
        `🔒 Partner Approval Required: Contact details and full address are unlocked once ${candName} approves your connection request.`
      );
      return;
    }

    if (status.reason === "NO_PLAN") {
      handleRequirePlan(actionName, candName);
      return;
    }
  };

  const handleRequirePlan = (actionName = "this action", candidateName = "") => {
    message.warning(
      `🔒 Premium Plan Required: Please activate a membership plan to ${
        actionName === "WhatsApp"
          ? "chat directly on WhatsApp"
          : actionName === "Contact / Call"
          ? "view and call candidate contact numbers"
          : actionName === "Send Request"
          ? "send connection requests"
          : "access candidate details"
      }${candidateName ? ` with ${candidateName}` : ""}.`
    );
    if (isBiodataOpen) {
      setIsBiodataOpen(false);
    }
    switchTab("plans");
  };

  // Shortlist candidate profile (Allowed even when profile is deactivated)
  const toggleWishlist = async (candidateUserId) => {
    if (!hasCompletedProfile) {
      message.warning("⚠️ Please complete your profile details first to shortlist candidates.");
      switchTab("edit");
      return;
    }

    const candIdStr = String(candidateUserId);
    const existingRequest = Array.isArray(wishlistItems)
      ? wishlistItems.find(
          (w) => String(w.Wish_User_id || w.wish_user_id) === candIdStr
        )
      : null;
    const isWishlisted = wishlistIds.includes(candIdStr);

    try {
      if (isWishlisted) {
        if (existingRequest?.id) {
          await WishListRemove(existingRequest.id);
          setWishlistIds((prev) => prev.filter((id) => id !== candIdStr));
          setWishlistItems((prev) =>
            prev.filter((w) => w.id !== existingRequest.id)
          );
          if (existingRequest.Status === "Approved") {
            message.success(
              "Removed from shortlisted profiles. Approved connection preserved in Approved section."
            );
          } else {
            message.success("Removed from shortlisted profiles");
          }
        }
      } else {
        const res = await WishListPost({
          Wish_User_id: candidateUserId,
        });
        if (res && res.id) {
          setWishlistIds((prev) => Array.from(new Set([...prev, candIdStr])));
          setWishlistItems((prev) => [
            ...prev.filter((w) => w.id !== res.id),
            res,
          ]);
          message.success("Profile saved to your shortlist (No request sent. Press \"Send Request\" to connect).");
        }
      }
    } catch (err) {
      message.error("Unable to update shortlist");
    }
  };

  // Send Connection Request (Restricted if profile is deactivated; requires active membership)
  const handleSendRequest = async (candidateUserId, candidateName = "") => {
    if (!hasCompletedProfile) {
      message.warning("⚠️ Please complete your profile details first to connect with candidates.");
      switchTab("edit");
      return;
    }
    if (!isProfileActive) {
      message.warning(
        `🔒 Request Restricted: You cannot send connection requests while your profile is deactivated. Please activate your profile in Profile Settings.`
      );
      setIsStatusModalOpen(true);
      return;
    }
    if (!hasActiveMembership()) {
      handleRequirePlan("Send Request", candidateName);
      return;
    }

    const candIdStr = String(candidateUserId);
    const existing = Array.isArray(wishlistItems)
      ? wishlistItems.find((w) => String(w.Wish_User_id || w.wish_user_id) === candIdStr)
      : null;

    if (existing?.Status === "Approved") {
      message.info("This connection has already been approved!");
      return;
    }
    if (existing?.Status === "Pending") {
      message.info("Connection request is already sent and pending candidate approval.");
      return;
    }

    try {
      let res;
      if (existing?.id) {
        try {
          res = await WishListRequest(existing.id);
        } catch (subErr) {
          // If specific wishlist row not found or stale, fallback to direct request
          res = await WishListDirectRequest({ Wish_User_id: candidateUserId });
        }
      } else {
        res = await WishListDirectRequest({ Wish_User_id: candidateUserId });
      }
      if (res && res.id) {
        message.success(`🎉 Connection request sent to ${candidateName || "candidate"}!`);
        setWishlistIds((prev) => Array.from(new Set([...prev, candIdStr])));
        setWishlistItems((prev) => [...prev.filter((w) => w.id !== res.id), res]);
      }
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.detail || "Unable to send connection request. Please try again.");
    }
  };


  const handleWishlistResponse = async (requestId, responseStatus) => {
    const res = await WishListUpdate(requestId, { Status: responseStatus });
    if (!res?.id) return;

    setIncomingWishlistItems((prev) => prev.filter((item) => item.id !== requestId));
    if (responseStatus === "Approved") {
      setApprovedWishlistItems((prev) => [...(Array.isArray(prev) ? prev : []), res]);
      try {
        const [rawApproved, rawUsers] = await Promise.all([
          WishListApprovedGet().catch(() => null),
          UserDataGetwt().catch(() => null),
        ]);
        if (Array.isArray(rawApproved)) {
          setApprovedWishlistItems(rawApproved);
        }
        if (Array.isArray(rawUsers)) {
          setAllCandidates(
            rawUsers.filter((u) => isCandidateProfileAvailable(u, user_id))
          );
        }
      } catch (e) {
        console.log("Error syncing approved items:", e);
      }
    } else {
      // Disapproved / Rejected: Remove from approved list and re-sync
      setApprovedWishlistItems((prev) =>
        Array.isArray(prev) ? prev.filter((item) => item.id !== requestId) : []
      );
      try {
        const [rawApproved, rawUsers, rawWishlist] = await Promise.all([
          WishListApprovedGet().catch(() => null),
          UserDataGetwt().catch(() => null),
          WishListGet().catch(() => null),
        ]);
        if (Array.isArray(rawApproved)) {
          setApprovedWishlistItems(rawApproved);
        }
        if (Array.isArray(rawWishlist)) {
          setWishlistItems(rawWishlist);
        }
        if (Array.isArray(rawUsers)) {
          setAllCandidates(
            rawUsers.filter((u) => isCandidateProfileAvailable(u, user_id))
          );
        }
      } catch (e) {
        console.log("Error syncing items after disapprove:", e);
      }
    }

    if (selectedMatch) {
      const sId = String(selectedMatch.User_id || selectedMatch.id || "");
      const rUser = String(res.User_id || res.user_id || "");
      const rWish = String(res.Wish_User_id || res.wish_user_id || "");
      if (sId && (sId === rUser || sId === rWish)) {
        try {
          const fresh = await UserDataGetwt(sId);
          if (fresh && (fresh.id || fresh.User_id)) {
            setSelectedMatch(fresh);
          }
        } catch (e) {
          console.log("Could not refresh candidate biodata:", e);
        }
      }
    }

    message.success(
      responseStatus === "Approved"
        ? "Profile request approved! Contact details and full address are now unlocked."
        : "Approval removed / profile disapproved. Contact details and address have been locked."
    );
  };

  const handleDisapprove = (requestId, candidateName) => {
    if (!requestId) {
      message.error("Could not find the approved connection request ID to remove from approval.");
      return;
    }

    Modal.confirm({
      title: "Remove from Approval?",
      icon: <ExclamationCircleOutlined style={{ color: "#e11d48" }} />,
      content: (
        <div>
          <p style={{ fontSize: "14px", color: "#1e293b", margin: "6px 0 10px" }}>
            Are you sure you want to remove approval for <b>{candidateName || "this partner"}</b>?
          </p>
          <p style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.5", margin: 0 }}>
            This will revoke the connection approval for both sides, remove this profile from the <b>Approved Connections</b> section, and immediately re-lock sensitive contact numbers and full address.
          </p>
        </div>
      ),
      okText: "Yes, Remove from Approval",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      onOk: async () => {
        await handleWishlistResponse(requestId, "Rejected");
        if (isBiodataOpen) {
          setIsBiodataOpen(false);
        }
      },
    });
  };

  // -------------------------------------------------------------
  // Razorpay Checkout for Live Plans (Syncs with Plans & User_Transactions)
  // -------------------------------------------------------------
  const handleBuyPlan = async (plan) => {
    setBuyingPlanId(plan.id || plan.Plan);
    try {
      const planPrice = plan.Amount || plan.price || 100;
      const planName = plan.Plan || plan.title || "Membership Plan";

      let res;
      try {
        res = await fetch(`${baseurl}create-order/`, {
          method: "POST",
          body: new URLSearchParams({ amount: planPrice }),
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
      } catch (netErr) {
        setBuyingPlanId(null);
        console.error("Order creation network error:", netErr);
        return message.error("Cannot connect to payment server. Please verify your connection.");
      }

      if (!res.ok) {
        setBuyingPlanId(null);
        return message.error("Server error creating payment order. Status: " + res.status);
      }

      const order = await res.json();

      if (!order.id) {
        setBuyingPlanId(null);
        return message.error("Error creating payment order!");
      }

      const options = {
        key: order.key || "rzp_test_TmLM4pKiwrBfmy",
        amount: order.amount,
        currency: order.currency || "INR",
        order_id: order.id,
        name: "Vaivaheek Manch Matrimonial",
        description: `${planName} Subscription`,
        modal: {
          ondismiss: () => {
            setBuyingPlanId(null);
            message.info("Payment window closed. You can also use '⚡ Instant Test / Dummy Pay'.");
          },
        },
        handler: async (response) => {
          try {
            const vPayload = {
              ...response,
              user_id: user_id,
              User_id: user_id,
              plan: planName,
              Plan: planName,
              amount: planPrice,
              Amount: planPrice,
            };
            const vRes = await fetch(`${baseurl}verify-payment/`, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams(vPayload),
            });
            const vResult = await vRes.json();

            if (vResult.status === "Payment verified") {
              message.success(`🎉 ${planName} activated successfully!`);
              await Get();
              switchTab("transactions");
            } else {
              message.error("Payment verification failed: " + (vResult.error || ""));
            }
          } catch (e) {
            console.error(e);
            message.error("Error during payment verification.");
          } finally {
            setBuyingPlanId(null);
          }
        },
        prefill: {
          name: user?.firstname || user?.Full_Name || user?.username || "Matrimony Member",
          email: user?.email || user?.Email || "user@matrimony.com",
          contact: user?.contact || user?.WP_Contact || "9876543210",
        },
        theme: { color: "#e11d48" },
      };

      const razor = new window.Razorpay(options);
      razor.on("payment.failed", () => {
        setBuyingPlanId(null);
        message.warning("Payment cancelled. You can use '⚡ Instant Test / Dummy Pay' to simulate activation.");
      });
      razor.open();
    } catch (err) {
      console.error(err);
      message.error("Payment gateway initialization failed.");
    } finally {
      setBuyingPlanId(null);
    }
  };

  const handleDummyTestPayment = async (plan) => {
    const dummyKey = `dummy_${plan.id || plan.Plan}`;
    setBuyingPlanId(dummyKey);
    try {
      const planPrice = plan.Amount || plan.price || 100;
      const planName = plan.Plan || plan.title || "Membership Plan";
      const dummyOrderId = `order_dummy_${Date.now()}`;
      const dummyPaymentId = `pay_test_dummy_${Date.now()}`;
      const dummySignature = "dummy_test_success";

      const vPayload = {
        razorpay_order_id: dummyOrderId,
        razorpay_payment_id: dummyPaymentId,
        razorpay_signature: dummySignature,
        user_id: user_id,
        User_id: user_id,
        plan: planName,
        Plan: planName,
        amount: planPrice,
        Amount: planPrice,
      };

      const vRes = await fetch(`${baseurl}verify-payment/`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(vPayload),
      });
      const vResult = await vRes.json();

      if (vResult.status === "Payment verified") {
        message.success(`🎉 Test Payment Successful! ${planName} activated.`);
        await Get();
        switchTab("transactions");
      } else {
        message.error("Payment test failed: " + (vResult.error || ""));
      }
    } catch (e) {
      console.error(e);
      message.error("Error executing dummy payment test.");
    } finally {
      setBuyingPlanId(null);
    }
  };

  // -------------------------------------------------------------
  // Help & Support Desk Handlers (Help model)
  // -------------------------------------------------------------
  const handleHelpSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = helpQuestion.trim();
    if (!trimmed) {
      return message.warning("Please enter your question or issue description.");
    }

    setIsSubmittingHelp(true);
    try {
      const targetRole = supportTargets.has_staff ? selectedHelpTarget : "admin";
      const payload = {
        Question: trimmed,
        User_Role: "user",
        target: targetRole,
        Role: targetRole,
        User_id: user_id,
      };
      if (targetRole === "staff" && supportTargets.staff?.id) {
        payload.Target_User_id = supportTargets.staff.id;
        payload.Target_User = supportTargets.staff.id;
      } else if (supportTargets.admin?.id) {
        payload.Target_User_id = supportTargets.admin.id;
        payload.Target_User = supportTargets.admin.id;
      }

      const res = await HelpPost(payload);
      if (res && (res.id || res.Question)) {
        message.success(
          targetRole === "staff"
            ? `Your question has been sent to your assigned Staff Counselor (${supportTargets.staff?.name || "Staff"})!`
            : "Your question has been sent directly to Head Office Admin Support!"
        );
        setHelpQuestion("");
        const fresh = await HelpGet().catch(() => []);
        if (Array.isArray(fresh)) {
          setHelpTickets(fresh);
        }
      }
    } catch (err) {
      console.error("Error submitting help request:", err);
      message.error("Failed to submit help request.");
    } finally {
      setIsSubmittingHelp(false);
    }
  };

  const paginatedHelpTickets = useMemo(() => {
    let list = Array.isArray(helpTickets) ? helpTickets : [];
    if (helpFilter === "answered") {
      list = list.filter((t) => t.is_answered || (t.Answer && t.Answer.trim()));
    } else if (helpFilter === "pending") {
      list = list.filter((t) => !t.is_answered && (!t.Answer || !t.Answer.trim()));
    }
    const start = (helpPage - 1) * helpPageSize;
    return list.slice(start, start + helpPageSize);
  }, [helpTickets, helpFilter, helpPage, helpPageSize]);

  const totalFilteredHelpCount = useMemo(() => {
    let list = Array.isArray(helpTickets) ? helpTickets : [];
    if (helpFilter === "answered") {
      return list.filter((t) => t.is_answered || (t.Answer && t.Answer.trim())).length;
    } else if (helpFilter === "pending") {
      return list.filter((t) => !t.is_answered && (!t.Answer || !t.Answer.trim())).length;
    }
    return list.length;
  }, [helpTickets, helpFilter]);

  // -------------------------------------------------------------
  // User Profile Metrics & Normalization
  // -------------------------------------------------------------
  const user = data[0] || {};
  const displayCaste = user.caste || user.Caste || "";
  const membershipStatus = useMemo(() => {
    const validUpto = user.Valid_Upto || user.valid_upto;
    if (!validUpto) {
      return { isActive: false, validUntil: null, remainingLabel: "No active plan" };
    }

    const expiry = new Date(`${String(validUpto).slice(0, 10)}T23:59:59`);
    if (Number.isNaN(expiry.getTime())) {
      return { isActive: false, validUntil: null, remainingLabel: "No active plan" };
    }

    const millisecondsRemaining = expiry.getTime() - Date.now();
    const isActive = millisecondsRemaining >= 0;
    const daysLeft = Math.max(0, Math.ceil(millisecondsRemaining / 86400000));

    return {
      isActive,
      validUntil: formatDate(expiry),
      remainingLabel: isActive
        ? daysLeft === 0
          ? "Expires today"
          : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
        : "Plan expired",
    };
  }, [user.Valid_Upto, user.valid_upto]);
  const avatarUrl = getMediaUrl(
    user.pic || user.Profile_Pic,
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
  );

  // Calculate Profile Completion %
  const checkFields = [
    user.firstname || user.Full_Name,
    user.pic || user.Profile_Pic,
    user.dob || user.DOB,
    user.gender || user.Gender,
    user.caste || user.Caste,
    user.state || user.State,
    user.district || user.District,
    user.qualification || user.Qualification || user.course,
    user.profession || user.Profession || user.job_title,
    user.contact || user.WP_Contact,
    user.father_name || user.Father_name,
    user.mother_name || user.Mother_name,
  ];
  const filledCount = checkFields.filter(Boolean).length;
  const completionPercentage = Math.round((filledCount / checkFields.length) * 100);

  // Normalizer for gender matching
  const normalizeGender = (g) => {
    if (!g) return "";
    const s = String(g).trim().toLowerCase();
    if (
      s.includes("female") ||
      s.includes("bride") ||
      s === "f" ||
      s.includes("woman") ||
      s.includes("girl") ||
      s === "kanya" ||
      s === "mahila" ||
      s === "vadhu"
    ) {
      return "female";
    }
    if (
      s.includes("male") ||
      s.includes("groom") ||
      s === "m" ||
      s.includes("man") ||
      s.includes("boy") ||
      s === "var" ||
      s === "purush"
    ) {
      return "male";
    }
    return "";
  };

  const normalizeCaste = (c) => {
    if (!c) return "";
    let s = String(c).trim().toLowerCase().replace(/[\s\-_]/g, "");
    if (s.includes("brahm") || s.includes("bramh")) {
      return "brahmin";
    }
    if (s.length > 4 && s.endsWith("s")) {
      s = s.slice(0, -1);
    }
    return s;
  };

  const userCaste = (user.caste || user.Caste || "").trim().toLowerCase();

  // Detect logged-in user's gender
  const detectedUserGender = normalizeGender(
    user.gender ||
      user.Gender ||
      localStorage.getItem("user_gender") ||
      localStorage.getItem("gender") ||
      ""
  );

  // Opposite gender target
  const targetOppositeGender =
    detectedUserGender === "male"
      ? "female"
      : detectedUserGender === "female"
      ? "male"
      : "female";

  // -------------------------------------------------------------
  // TAB 1: STRICT CASTE & OPPOSITE GENDER MATCHES
  // -------------------------------------------------------------
  const matchCasteProfiles = useMemo(() => {
    if (!userCaste) return [];
    const normUserCaste = normalizeCaste(userCaste);

    return allCandidates.filter((candidate) => {
      // 1. Exclude self, inactive, pending, or expired profiles
      if (!isCandidateProfileAvailable(candidate, user_id)) return false;

      // 3. STRICT CASTE MATCH: compare direct or normalized community name (e.g. Bramhin <-> Brahmin)
      const candCaste = (candidate.caste || candidate.Caste || "").trim().toLowerCase();
      const normCandCaste = normalizeCaste(candCaste);
      if (!candCaste || (candCaste !== userCaste && normCandCaste !== normUserCaste)) {
        return false;
      }

      // 4. STRICT OPPOSITE GENDER FILTER:
      const candGender = normalizeGender(candidate.gender || candidate.Gender || "");
      if (targetOppositeGender && candGender !== targetOppositeGender) {
        return false;
      }

      return true;
    });
  }, [allCandidates, userCaste, targetOppositeGender, user_id]);

  // Sub-filtered list for Community Matches tab
  const displayedMatches = useMemo(() => {
    return matchCasteProfiles.filter((cand) => {
      // 1. Keyword search (Name, city, district, profession, qualification, subcaste/gotra)
      if (matchSearch.trim()) {
        const q = matchSearch.toLowerCase().trim();
        const name = (cand.firstname || cand.Full_Name || cand.first_name || "").toLowerCase();
        const city = (cand.city || cand.City || cand.district || cand.District || "").toLowerCase();
        const prof = (cand.profession || cand.job_title || cand.Profession || "").toLowerCase();
        const qual = (cand.qualification || cand.Qualification || cand.course || "").toLowerCase();
        const gotra = (cand.gotra || cand.Gotra || "").toLowerCase();
        if (!name.includes(q) && !city.includes(q) && !prof.includes(q) && !qual.includes(q) && !gotra.includes(q)) {
          return false;
        }
      }

      // 2. Age filter
      if (matchAgeFilter !== "all") {
        const a = Number(cand.age || cand.Age);
        if (a) {
          if (matchAgeFilter === "18-24" && (a < 18 || a > 24)) return false;
          if (matchAgeFilter === "25-29" && (a < 25 || a > 29)) return false;
          if (matchAgeFilter === "30-34" && (a < 30 || a > 34)) return false;
          if (matchAgeFilter === "35-39" && (a < 35 || a > 39)) return false;
          if (matchAgeFilter === "40+" && a < 40) return false;
        }
      }

      // 3. Height filter (cm)
      if (matchHeightFilter !== "all") {
        const rawH = String(cand.height || cand.Height || "");
        const h = Number(rawH.replace(/[^0-9.]/g, ""));
        if (h) {
          if (matchHeightFilter === "below-152" && h >= 152) return false;
          if (matchHeightFilter === "152-160" && (h < 152 || h > 160)) return false;
          if (matchHeightFilter === "161-170" && (h < 161 || h > 170)) return false;
          if (matchHeightFilter === "171-183" && (h < 171 || h > 183)) return false;
          if (matchHeightFilter === "183+" && h < 183) return false;
        }
      }

      // 4. Marital Status
      if (matchMaritalFilter !== "all") {
        const ms = (cand.marrige_status || cand.Marrige_status || "").toLowerCase();
        if (matchMaritalFilter === "unmarried" && !ms.includes("unmarried") && !ms.includes("never")) return false;
        if (matchMaritalFilter === "divorced" && !ms.includes("divorce")) return false;
        if (matchMaritalFilter === "widowed" && !ms.includes("widow")) return false;
        if (matchMaritalFilter === "awaiting" && !ms.includes("await")) return false;
      }

      // 5. Qualification
      if (matchQualFilter !== "all") {
        const q = (cand.qualification || cand.Qualification || cand.course || "").toLowerCase();
        if (matchQualFilter === "mca") {
          if (!q.includes("mca") && !q.includes("tech") && !q.includes("bca") && !q.includes("cs") && !q.includes("it")) return false;
        } else if (matchQualFilter === "master") {
          if (!q.includes("master") && !q.includes("mba") && !q.includes("msc") && !q.includes("mtech") && !q.includes("mca") && !q.includes("ma") && !q.includes("m.")) return false;
        } else if (matchQualFilter === "bachelor") {
          if (!q.includes("bachelor") && !q.includes("btech") && !q.includes("bca") && !q.includes("bsc") && !q.includes("ba") && !q.includes("bcom") && !q.includes("b.")) return false;
        } else if (matchQualFilter === "doctor") {
          if (!q.includes("mbbs") && !q.includes("md") && !q.includes("ms") && !q.includes("bds") && !q.includes("doctor")) return false;
        } else if (matchQualFilter === "ca") {
          if (!q.includes("ca") && !q.includes("cs") && !q.includes("icwa") && !q.includes("cfa")) return false;
        } else if (matchQualFilter === "phd") {
          if (!q.includes("phd") && !q.includes("doctorate")) return false;
        } else {
          if (!q.includes(matchQualFilter.toLowerCase())) return false;
        }
      }

      // 6. Profession
      if (matchProfFilter !== "all") {
        const p = (cand.profession || cand.Profession || cand.job_title || "").toLowerCase();
        if (matchProfFilter === "software") {
          if (!p.includes("software") && !p.includes("developer") && !p.includes("engineer") && !p.includes("it") && !p.includes("tech") && !p.includes("sw")) return false;
        } else if (matchProfFilter === "govt") {
          if (!p.includes("govt") && !p.includes("government") && !p.includes("civil") && !p.includes("psu") && !p.includes("officer")) return false;
        } else if (matchProfFilter === "business") {
          if (!p.includes("business") && !p.includes("entrepreneur") && !p.includes("self") && !p.includes("trader") && !p.includes("owner")) return false;
        } else if (matchProfFilter === "doctor") {
          if (!p.includes("doctor") && !p.includes("medical") && !p.includes("physician") && !p.includes("surgeon")) return false;
        } else if (matchProfFilter === "bank") {
          if (!p.includes("bank") && !p.includes("finance") && !p.includes("accountant") && !p.includes("ca")) return false;
        } else if (matchProfFilter === "teacher") {
          if (!p.includes("teach") && !p.includes("professor") && !p.includes("lecturer") && !p.includes("faculty")) return false;
        } else if (matchProfFilter === "private") {
          if (!p.includes("private") && !p.includes("corporate") && !p.includes("executive") && !p.includes("manager")) return false;
        } else {
          if (!p.includes(matchProfFilter.toLowerCase())) return false;
        }
      }

      // 7. Monthly Income
      if (matchIncomeFilter !== "all") {
        const salNum = Number(String(cand.salary || cand.Salary || "0").replace(/[^0-9]/g, ""));
        const minSal = Number(matchIncomeFilter);
        if (salNum < minSal) return false;
      }

      // 8. Manglik
      if (matchManglikFilter !== "all") {
        const isM = cand.manglik !== undefined ? Boolean(cand.manglik) : String(cand.Manglik || "").toLowerCase().includes("yes");
        if (matchManglikFilter === "non-manglik" && isM) return false;
        if (matchManglikFilter === "manglik" && !isM) return false;
      }

      // 9. Diet
      if (matchDietFilter !== "all") {
        const diet = (cand.vegeterian || cand.Vegeterian || "").toLowerCase();
        if (matchDietFilter === "vegetarian" && !diet.includes("veg") && !diet.includes("shakahari")) return false;
        if (matchDietFilter === "non-vegetarian" && !diet.includes("non")) return false;
      }

      // 10. State
      if (matchStateFilter !== "all" && (cand.state || cand.State)) {
        if ((cand.state || cand.State).toLowerCase() !== matchStateFilter.toLowerCase()) return false;
      }

      // 11. District
      if (matchDistrictFilter !== "all") {
        const d = (cand.district || cand.District || cand.city || cand.City || "").toLowerCase();
        if (!d.includes(matchDistrictFilter.toLowerCase())) return false;
      }

      // 12. Gotra
      if (matchSubcasteFilter.trim()) {
        const sc = (cand.gotra || cand.Gotra || "").toLowerCase();
        if (!sc.includes(matchSubcasteFilter.toLowerCase().trim())) return false;
      }

      return true;
    });
  }, [
    matchCasteProfiles,
    matchSearch,
    matchAgeFilter,
    matchHeightFilter,
    matchMaritalFilter,
    matchQualFilter,
    matchProfFilter,
    matchIncomeFilter,
    matchManglikFilter,
    matchDietFilter,
    matchStateFilter,
    matchDistrictFilter,
    matchSubcasteFilter,
  ]);

  const activeFilterCount = useMemo(() => {
    return [
      matchAgeFilter !== "all",
      matchHeightFilter !== "all",
      matchMaritalFilter !== "all",
      matchQualFilter !== "all",
      matchProfFilter !== "all",
      matchIncomeFilter !== "all",
      matchManglikFilter !== "all",
      matchDietFilter !== "all",
      matchStateFilter !== "all",
      matchDistrictFilter !== "all",
      matchSubcasteFilter.trim() !== "",
    ].filter(Boolean).length;
  }, [
    matchAgeFilter,
    matchHeightFilter,
    matchMaritalFilter,
    matchQualFilter,
    matchProfFilter,
    matchIncomeFilter,
    matchManglikFilter,
    matchDietFilter,
    matchStateFilter,
    matchDistrictFilter,
    matchSubcasteFilter,
  ]);

  // -------------------------------------------------------------
  // TAB 3: SHORTLISTED PROFILES
  // -------------------------------------------------------------
  const shortlistedCandidates = useMemo(() => {
    return wishlistItems
      .filter((item) => item.is_shortlisted !== false && item.Status !== "Rejected")
      .map((item) => {
        const candidateId = String(item.Wish_User_id || item.wish_user_id);
        const candidate = allCandidates.find(
          (cand) => String(cand.User_id || cand.id) === candidateId
        );
        return candidate
          ? { ...candidate, wishlistId: item.id, wishlistStatus: item.Status }
          : null;
      })
      .filter(Boolean);
  }, [allCandidates, wishlistItems]);

  const incomingRequestCandidates = useMemo(() => {
    return incomingWishlistItems
      .map((item) => {
        const candidateId = String(item.User_id || item.user_id);
        const candidate = allCandidates.find(
          (cand) => String(cand.User_id || cand.id) === candidateId
        );
        return candidate
          ? { ...candidate, wishlistId: item.id, wishlistStatus: item.Status }
          : null;
      })
      .filter(Boolean);
  }, [allCandidates, incomingWishlistItems]);

  const approvedCandidates = useMemo(() => {
    return approvedWishlistItems
      .map((item) => {
        const candidateId = String(
          String(item.User_id || item.user_id) === String(user_id)
            ? item.Wish_User_id || item.wish_user_id
            : item.User_id || item.user_id
        );
        const candidate = allCandidates.find(
          (cand) => String(cand.User_id || cand.id) === candidateId
        );
        return candidate
          ? { ...candidate, wishlistId: item.id, wishlistStatus: item.Status }
          : null;
      })
      .filter(Boolean);
  }, [allCandidates, approvedWishlistItems, user_id]);

  // -------------------------------------------------------------
  // Paginated Data Slices (10 to 15 items at a time)
  // -------------------------------------------------------------
  const paginatedMatches = useMemo(() => {
    const start = (matchesPage - 1) * matchesPageSize;
    return displayedMatches.slice(start, start + matchesPageSize);
  }, [displayedMatches, matchesPage, matchesPageSize]);

  const paginatedShortlist = useMemo(() => {
    const start = (shortlistPage - 1) * shortlistPageSize;
    return shortlistedCandidates.slice(start, start + shortlistPageSize);
  }, [shortlistedCandidates, shortlistPage, shortlistPageSize]);

  const paginatedIncomingRequests = useMemo(() => {
    const start = (requestsPage - 1) * requestsPageSize;
    return incomingRequestCandidates.slice(start, start + requestsPageSize);
  }, [incomingRequestCandidates, requestsPage, requestsPageSize]);

  const paginatedApproved = useMemo(() => {
    const start = (approvedPage - 1) * approvedPageSize;
    return approvedCandidates.slice(start, start + approvedPageSize);
  }, [approvedCandidates, approvedPage, approvedPageSize]);

  const paginatedTxns = useMemo(() => {
    const start = (transactionsPage - 1) * transactionsPageSize;
    return transactionsList.slice(start, start + transactionsPageSize);
  }, [transactionsList, transactionsPage, transactionsPageSize]);

  // -------------------------------------------------------------
  // Helper: Candidate Card Renderer
  // -------------------------------------------------------------
  const renderCandidateCard = (cand, options = {}) => {
    const { hideShortlist = false, requestActions = null } = options;
    const candId = cand.User_id || cand.id;
    const candPic = getMediaUrl(
      cand.pic || cand.Profile_Pic,
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80"
    );

    const isWishlisted = wishlistIds.includes(String(candId));
    const existingReq = Array.isArray(wishlistItems)
      ? wishlistItems.find((w) => String(w.Wish_User_id || w.wish_user_id) === String(candId))
      : null;
    const isApproved = existingReq?.Status === "Approved" || approvedPartnerIds.has(String(candId));
    const isPending = existingReq?.Status === "Pending";
    const incomingReq = getIncomingRequestForCandidate(cand);
    const isIncoming = Boolean(incomingReq);
    const candCaste = cand.caste || cand.Caste || "Community";
    const candName = cand.firstname || cand.Full_Name || cand.first_name || "Candidate";
    const candAge = cand.age || cand.Age;
    const candDistrict = cand.district || cand.District || "";
    const candCity = cand.city || cand.City || "";
    const candState = cand.state || cand.State || "";
    const candProf = cand.profession || cand.Profession || cand.job_title;
    const candQual = cand.qualification || cand.Qualification || cand.course || "";
    const candContact = cand.contact || cand.WP_Contact || cand.Alt_Contact;
    const candContactInfo = getContactRelationDisplay(
      cand.wp_contact_relation || cand.WP_Contact_Relation,
      cand.wp_contact_name || cand.Wp_Contact_Name,
      candContact,
      candName,
      cand.father_name || cand.Father_name,
      cand.mother_name || cand.Mother_name
    );
    const candAddress = cand.full_address || cand.Full_Address || "";
    const accessStatus = getSensitiveAccessStatus(cand);
    const canViewSensitive = accessStatus.allowed;
    const hasContactAccess = Boolean(canViewSensitive && candContact);
    const isSameCaste = userCaste && (candCaste.toLowerCase() === userCaste || normalizeCaste(candCaste) === normalizeCaste(userCaste));

    const cardUniqueKey = options.cardKey || (cand.wishlistId ? `req-${cand.wishlistId}` : `cand-${candId}`);
    return (
      <Col xs={24} sm={12} lg={8} key={cardUniqueKey}>
        <div className="up-cand-card" id={`profile-card-${candId}`}>
          {/* Candidate Image & Badges */}
          <div className="up-cand-img-wrap" style={{ cursor: "pointer" }} onClick={() => openCandidateBiodata(cand)}>
            <Image
              src={candPic}
              alt={candName}
              className="up-cand-img"
              width="100%"
              height="100%"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", cursor: "pointer" }}
              preview={{
                mask: null,
              }}
              fallback="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80"
            />

            {/* Same Caste Match Badge */}
            {isSameCaste && (
              <span
                style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  background: "linear-gradient(135deg, #e11d48, #be123c)",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: "800",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  boxShadow: "0 4px 12px rgba(225, 29, 72, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                💍 {candCaste} Match
              </span>
            )}

            {isWishlisted && (
              <span
                style={{
                  position: "absolute",
                  top: isSameCaste ? "46px" : "12px",
                  left: "12px",
                  background: "#e0e7ff",
                  color: "#3730a3",
                  fontSize: "11px",
                  fontWeight: "800",
                  padding: "4px 10px",
                  borderRadius: "20px",
                }}
              >
                Shortlisted
              </span>
            )}

            {/* Heart Shortlist Button */}
            {!hideShortlist && <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(candId);
              }}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.92)",
                backdropFilter: "blur(6px)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                color: isWishlisted ? "#e11d48" : "#94a3b8",
                fontSize: "18px",
                transition: "all 0.2s ease",
              }}
              title={isWishlisted ? "Remove from shortlist" : "Add to shortlist"}
            >
              {isWishlisted ? <HeartFilled /> : <HeartOutlined />}
            </button>}

            {/* Bottom Bar on photo */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
                padding: "24px 14px 10px",
                color: "#ffffff",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: "800",
                    color: "#ffffff",
                    letterSpacing: "-0.3px",
                  }}
                >
                  {candName}
                </h3>
                {candAge && (
                  <span style={{ fontSize: "14px", fontWeight: "700", opacity: 0.9 }}>
                    , {candAge} yrs{cand.height || cand.Height ? ` • ${cand.height || cand.Height} cm` : ""}
                  </span>
                )}
              </div>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "12px",
                  color: "#fecdd3",
                  fontWeight: "600",
                }}
              >
                {candCaste} {cand.gotra || cand.Gotra ? `• Gotra: ${cand.gotra || cand.Gotra}` : ""}
              </p>
            </div>
          </div>

          {/* Details Body */}
          <div className="up-cand-body">
            <div className="up-cand-details-list">
              {/* Full Address (City and Street Address hidden until partner approves) */}
              <div className="up-cand-info-row">
                <EnvironmentOutlined className="up-cand-info-icon" style={{ color: "#e11d48" }} />
                <div>
                  <span style={{ fontWeight: "700", color: "#1e293b" }}>Full Address: </span>
                  {canViewSensitive ? (
                    <span style={{ color: "#334155", fontWeight: "600" }}>
                      {candAddress ? candAddress : [candCity, candDistrict, candState].filter(Boolean).join(", ")}
                    </span>
                  ) : (
                    <span>
                      <span style={{ color: "#64748b" }}>
                        {[candDistrict, candState].filter(Boolean).join(", ") || "India"} •{" "}
                      </span>
                      <span
                        style={{
                          color: accessStatus.reason === "RESTRICTED" ? "#b45309" : "#e11d48",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                        onClick={() => handleSensitiveClick(cand, "view full address")}
                        title={accessStatus.help}
                      >
                        {accessStatus.label}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Contact / WhatsApp Number */}
              <div className="up-cand-info-row">
                <WhatsAppOutlined className="up-cand-info-icon" style={{ color: "#25d366" }} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: "700", color: "#1e293b" }}>Contact / WP: </span>
                    {canViewSensitive ? (
                      candContact ? (
                        <>
                          <span style={{ color: "#0f766e", fontWeight: "800", letterSpacing: "0.2px" }}>
                            +91 {candContact}
                          </span>
                          <Tag
                            color={candContactInfo.relation === "Self" ? "green" : "blue"}
                            style={{ borderRadius: "6px", fontSize: "11px", fontWeight: "700", margin: 0 }}
                          >
                            {candContactInfo.relation === "Self"
                              ? `Self (${candContactInfo.personName || candName})`
                              : `${candContactInfo.relation}${candContactInfo.personName ? ` (${candContactInfo.personName})` : ""}`}
                          </Tag>
                        </>
                      ) : (
                        <span style={{ color: "#64748b", fontStyle: "italic" }}>
                          Contact not specified
                        </span>
                      )
                    ) : (
                      <span
                        style={{
                          color: accessStatus.reason === "RESTRICTED" ? "#b45309" : "#e11d48",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                        onClick={() => handleSensitiveClick(cand, "Contact / WhatsApp")}
                        title={accessStatus.help}
                      >
                        {accessStatus.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {candQual && (
                <div className="up-cand-info-row">
                  <BookOutlined className="up-cand-info-icon" style={{ color: "#e11d48" }} />
                  <span>{candQual}</span>
                </div>
              )}

              {candProf && (
                <div className="up-cand-info-row">
                  <CrownOutlined className="up-cand-info-icon" style={{ color: "#e11d48" }} />
                  <span>
                    {candProf}
                    {(cand.job_type !== "Not Working" && cand.Job_type !== "Not Working" && (cand.salary || cand.Salary)) ? ` (₹${cand.salary || cand.Salary}/mo)` : ""}
                  </span>
                </div>
              )}

              {cand.marrige_status && (
                <div className="up-cand-info-row">
                  <SafetyCertificateOutlined className="up-cand-info-icon" style={{ color: "#e11d48" }} />
                  <span>{cand.marrige_status}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {requestActions && (
              <div style={{ marginBottom: "12px" }}>{requestActions}</div>
            )}
            <div className="up-action-grid">
              {/* 1. Biodata Button */}
              <Button
                type="default"
                icon={<EyeOutlined />}
                onClick={() => openCandidateBiodata(cand)}
                style={{
                  borderRadius: "14px",
                  borderColor: "#fecdd3",
                  color: "#be123c",
                  fontWeight: "700",
                  background: "#fff1f2",
                  height: "38px",
                }}
              >
                Biodata
              </Button>

              {/* 2. Connection Request Button (Restricted if Profile Deactivated) */}
              {!isProfileActive ? (
                <Button
                  type="default"
                  icon={<LockOutlined style={{ color: "#d97706" }} />}
                  onClick={() => {
                    message.warning(
                      "🔒 Request Restricted: You cannot send connection requests while your profile is deactivated. Please activate your profile in Profile Settings."
                    );
                    setIsStatusModalOpen(true);
                  }}
                  style={{
                    borderRadius: "14px",
                    height: "38px",
                    fontWeight: "700",
                    borderColor: "#fde68a",
                    color: "#b45309",
                    background: "#fffbeb",
                    fontSize: "12px",
                    padding: "0 6px",
                  }}
                >
                  🔒 Restricted
                </Button>
              ) : isApproved ? (
                <div style={{ display: "flex", gap: "4px", width: "100%", minWidth: 0 }}>
                  <Button
                    type="default"
                    icon={<CheckCircleOutlined style={{ color: "#059669" }} />}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      borderRadius: "14px",
                      height: "38px",
                      fontWeight: "700",
                      background: "#ecfdf5",
                      borderColor: "#a7f3d0",
                      color: "#059669",
                      padding: "0 4px",
                      fontSize: "11px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    Connected
                  </Button>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => {
                      const approvedItem = Array.isArray(approvedWishlistItems)
                        ? approvedWishlistItems.find(
                            (item) =>
                              String(item.User_id || item.user_id) === String(candId) ||
                              String(item.Wish_User_id || item.wish_user_id) === String(candId)
                          )
                        : null;
                      const reqId = cand.wishlistId || approvedItem?.id;
                      handleDisapprove(reqId, candName);
                    }}
                    title="Remove from Approval"
                    style={{
                      borderRadius: "14px",
                      height: "38px",
                      fontWeight: "700",
                      background: "#fff1f2",
                      borderColor: "#fecaca",
                      color: "#be123c",
                      padding: "0 6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : isIncoming ? (
                requestActions ? (
                  <Button
                    type="default"
                    icon={<HeartFilled style={{ color: "#2563eb" }} />}
                    onClick={() => openCandidateBiodata(cand)}
                    style={{
                      borderRadius: "14px",
                      height: "38px",
                      fontWeight: "700",
                      background: "#eff6ff",
                      borderColor: "#bfdbfe",
                      color: "#1d4ed8",
                      fontSize: "11.5px",
                      padding: "0 4px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    Request Received
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleWishlistResponse(incomingReq.id, "Approved")}
                    style={{
                      borderRadius: "14px",
                      height: "38px",
                      fontWeight: "700",
                      background: "linear-gradient(135deg, #059669, #047857)",
                      borderColor: "#059669",
                      color: "#ffffff",
                      fontSize: "12px",
                      padding: "0 6px",
                    }}
                  >
                    Approve
                  </Button>
                )
              ) : hasActiveMembership() ? (
                <Button
                  type={isPending ? "default" : "primary"}
                  icon={isPending ? <CheckCircleOutlined style={{ color: "#059669" }} /> : <HeartOutlined />}
                  onClick={() => handleSendRequest(candId, candName)}
                  style={{
                    borderRadius: "14px",
                    height: "38px",
                    fontWeight: "700",
                    background: isPending ? "#ecfdf5" : "linear-gradient(135deg, #e11d48, #be123c)",
                    borderColor: isPending ? "#a7f3d0" : "transparent",
                    color: isPending ? "#059669" : "#ffffff",
                    fontSize: "12px",
                    padding: "0 4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {isPending ? "Requested" : "Send Request"}
                </Button>
              ) : (
                <Button
                  type="default"
                  icon={<LockOutlined style={{ color: "#be123c" }} />}
                  onClick={() => handleRequirePlan("Send Request", candName)}
                  style={{
                    borderRadius: "14px",
                    height: "38px",
                    fontWeight: "700",
                    borderColor: "#fecdd3",
                    color: "#be123c",
                    background: "#ffffff",
                    fontSize: "12px",
                    padding: "0 4px",
                  }}
                >
                  🔒 Request
                </Button>
              )}

              {/* 3. WhatsApp Button */}
              {hasContactAccess ? (
                <a
                  href={`https://wa.me/91${candContact}?text=${encodeURIComponent(
                    `Hello ${candName}! I noticed your matrimonial profile on Vaivaheek Manch under our ${candCaste} community.`
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
                    borderRadius: "14px",
                    fontWeight: "700",
                    fontSize: "13px",
                    textDecoration: "none",
                    height: "38px",
                    boxShadow: "0 3px 10px rgba(37, 211, 102, 0.25)",
                  }}
                >
                  <WhatsAppOutlined /> WhatsApp
                </a>
              ) : (
                <Button
                  onClick={() => handleSensitiveClick(cand, "WhatsApp")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    background: "#ffffff",
                    color: accessStatus.reason === "RESTRICTED" ? "#b45309" : "#15803d",
                    borderColor: accessStatus.reason === "RESTRICTED" ? "#fde68a" : "#bbf7d0",
                    borderRadius: "14px",
                    fontWeight: "700",
                    fontSize: "13px",
                    height: "38px",
                  }}
                >
                  <LockOutlined style={{ color: accessStatus.reason === "RESTRICTED" ? "#b45309" : "#e11d48" }} /> WhatsApp
                </Button>
              )}

              {/* 4. Contact / Call Button */}
              {hasContactAccess ? (
                <a
                  href={`tel:${candContact}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    background: "#0284c7",
                    color: "#ffffff",
                    borderRadius: "14px",
                    fontWeight: "700",
                    fontSize: "13px",
                    textDecoration: "none",
                    height: "38px",
                    boxShadow: "0 3px 10px rgba(2, 132, 199, 0.25)",
                  }}
                >
                  <PhoneOutlined /> Call
                </a>
              ) : (
                <Button
                  onClick={() => handleSensitiveClick(cand, "Contact / Call")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    background: "#ffffff",
                    color: accessStatus.reason === "RESTRICTED" ? "#b45309" : "#0369a1",
                    borderColor: accessStatus.reason === "RESTRICTED" ? "#fde68a" : "#bae6fd",
                    borderRadius: "14px",
                    fontWeight: "700",
                    fontSize: "13px",
                    height: "38px",
                  }}
                >
                  <LockOutlined style={{ color: accessStatus.reason === "RESTRICTED" ? "#b45309" : "#e11d48" }} /> Contact
                </Button>
              )}
            </div>
          </div>
        </div>
      </Col>
    );
  };

  // -------------------------------------------------------------
  // Wedding Services Filter & Handlers
  // -------------------------------------------------------------
  const filteredServices = useMemo(() => {
    return servicesList.filter((s) => {
      // 1. Category filter
      if (serviceCategoryFilter && serviceCategoryFilter !== "all") {
        const catLower = serviceCategoryFilter.trim().toLowerCase();
        const sType = (s.Service_Type || "").trim().toLowerCase();
        const sName = (s.Service_Name || "").trim().toLowerCase();
        if (sType !== catLower && !sName.includes(catLower)) {
          return false;
        }
      }

      // 2. District filter (Default is user district)
      if (serviceDistrictFilter && serviceDistrictFilter !== "all") {
        const targetLower = serviceDistrictFilter.trim().toLowerCase();
        let matchesDistrict = false;

        // Direct district match
        if (s.District && s.District.trim().toLowerCase() === targetLower) {
          matchesDistrict = true;
        }

        // Available_Zone check
        let zones = s.Available_Zone;
        if (typeof zones === "string") {
          try {
            zones = JSON.parse(zones);
          } catch {
            zones = zones.split(",").map((z) => z.trim());
          }
        }
        if (Array.isArray(zones)) {
          const hasZone = zones.some((z) => {
            if (!z || typeof z !== "string") return false;
            const zLower = z.trim().toLowerCase();
            return zLower === "all" || zLower === targetLower;
          });
          if (hasZone) matchesDistrict = true;
        }

        if (!matchesDistrict) return false;
      }

      // 3. Search query filter
      if (serviceSearch && serviceSearch.trim()) {
        const q = serviceSearch.trim().toLowerCase();
        const sName = (s.Service_Name || "").toLowerCase();
        const sDesc = (s.Service_Description || "").toLowerCase();
        const sType = (s.Service_Type || "").toLowerCase();
        const sCity = (s.City || "").toLowerCase();
        const sDist = (s.District || "").toLowerCase();
        const sAddr = (s.Full_Address || "").toLowerCase();
        const matches =
          sName.includes(q) ||
          sDesc.includes(q) ||
          sType.includes(q) ||
          sCity.includes(q) ||
          sDist.includes(q) ||
          sAddr.includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [servicesList, serviceCategoryFilter, serviceDistrictFilter, serviceSearch]);

  // Group services divided based on service category following the Services model sequence
  const servicesGroupedByCategory = useMemo(() => {
    // 1. Sort service categories strictly by Services model ID sequence
    const sortedCats = [...(serviceCategories || [])].sort(
      (a, b) => (Number(a.id) || 0) - (Number(b.id) || 0)
    );

    const groups = [];
    const assignedIds = new Set();

    // 2. Iterate through each category in Services model sequence
    sortedCats.forEach((cat, index) => {
      const catName = cat.Service_Type || cat.Service_Name || "";
      const catLower = catName.trim().toLowerCase();

      // If user filtered by a specific category (not 'all'), only include that category
      if (serviceCategoryFilter && serviceCategoryFilter !== "all") {
        if (catLower !== serviceCategoryFilter.trim().toLowerCase()) {
          return;
        }
      }

      const matched = filteredServices.filter((s) => {
        const sType = (s.Service_Type || "").trim().toLowerCase();
        const sName = (s.Service_Name || "").trim().toLowerCase();
        return sType === catLower || sName.includes(catLower);
      });

      if (matched.length > 0) {
        matched.forEach((s) => assignedIds.add(s.id));
        groups.push({
          category: cat,
          catId: cat.id !== undefined ? cat.id : index + 1,
          catName: catName,
          icon: getServiceCategoryIcon(catName),
          services: matched,
        });
      }
    });

    // 3. Catch any services that may not match defined master categories
    const remaining = filteredServices.filter((s) => !assignedIds.has(s.id));
    if (remaining.length > 0) {
      if (serviceCategoryFilter === "all" || serviceCategoryFilter.toLowerCase().includes("other")) {
        groups.push({
          category: { id: 9999, Service_Name: "Other Services", Service_Type: "Other Services" },
          catId: 9999,
          catName: "Other Wedding Services",
          icon: "🌟",
          services: remaining,
        });
      }
    }

    return groups;
  }, [filteredServices, serviceCategories, serviceCategoryFilter]);

  const handleWhatsAppService = (s) => {
    const contact = String(s.WP_Contact || s.Alt_Contact || "").replace(/\D/g, "");
    if (!contact) {
      message.warning("Vendor contact number is not available.");
      return;
    }
    const phone = contact.length === 10 ? `91${contact}` : contact;
    const userDist = user.district || user.District || "";
    const text = encodeURIComponent(
      `Namaste ${s.Service_Name || "Partner"},\nI found your ${s.Service_Type || "wedding"} service on Vaivaheek Manch. I would like to inquire about booking & availability for a wedding event${userDist ? ` in ${userDist}` : ""}.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  const handleCallService = (s) => {
    const contact = String(s.WP_Contact || s.Alt_Contact || "").replace(/\D/g, "");
    if (!contact) {
      message.warning("Contact number not available.");
      return;
    }
    window.open(`tel:${contact}`, "_self");
  };

  // -------------------------------------------------------------
  // Navigation Menu Definitions
  // -------------------------------------------------------------
  const navItems = [
    {
      key: "matches",
      label: user.caste ? `${user.caste} Matches` : "Community Matches",
      icon: <HeartFilled style={{ color: "#e11d48" }} />,
      badge: null,
      category: "Matchmaking",
    },
    {
      key: "shortlist",
      label: "Shortlisted",
      icon: <HeartOutlined />,
      badge: null,
      category: "Matchmaking",
    },
    {
      key: "requests",
      label: "Profile Requests",
      icon: <TeamOutlined />,
      badge: incomingWishlistItems.length || null,
      category: "Matchmaking",
    },
    {
      key: "approved",
      label: "Approved Matches",
      icon: <CheckCircleOutlined style={{ color: "#059669" }} />,
      badge: null,
      category: "Matchmaking",
    },
    {
      key: "services",
      label: "Wedding Services",
      icon: <ShopOutlined style={{ color: "#7c3aed" }} />,
      badge: null,
      category: "Wedding Services",
    },
    {
      key: "plans",
      label: "Membership Plans",
      icon: <CrownOutlined style={{ color: "#d97706" }} />,
      badge: null,
      category: "Billing & Plans",
    },
    {
      key: "transactions",
      label: "Transactions",
      icon: <HistoryOutlined />,
      badge: null,
      category: "Billing & Plans",
    },
    {
      key: "profile",
      label: "My Profile",
      icon: <UserOutlined />,
      badge: null,
      category: "My Account",
    },
    {
      key: "edit",
      label: "Edit Profile",
      icon: <EditOutlined />,
      badge: null,
      category: "My Account",
    },
    {
      key: "security",
      label: "Security Settings",
      icon: <LockOutlined />,
      badge: null,
      category: "My Account",
    },
    {
      key: "help",
      label: "Help & Support",
      icon: <CustomerServiceOutlined style={{ color: "#2563eb" }} />,
      badge: unseenHelpCount > 0 ? unseenHelpCount : null,
      category: "My Account",
    },
  ];

  // -------------------------------------------------------------
  // RENDER MAIN USER PANEL
  // -------------------------------------------------------------
  return (
    <div className="up-container">
      {/* ============================================================== */}
      {/* 1. DESKTOP SIDEBAR NAVIGATION */}
      {/* ============================================================== */}
      <aside className="up-sidebar">
        {/* Brand Header */}
        <div className="up-sidebar-header">
          <div className="up-brand-logo">💍</div>
          <div className="up-brand-info">
            <h3 style={{ fontSize: "19px", fontWeight: "900", letterSpacing: "-0.3px", color: "#881337" }}>वैवाहिक मंच</h3>
            <p style={{ fontSize: "10.5px", fontWeight: "700", letterSpacing: "0.8px", color: "#be123c", textTransform: "uppercase" }}>Vaivaheek Manch</p>
          </div>
        </div>

        {/* User Mini Profile */}
        <div className="up-sidebar-user">
          <div className="up-user-avatar-wrap" style={{ cursor: "pointer" }}>
            <Image
              src={avatarUrl}
              alt="Avatar"
              width={52}
              height={52}
              style={{ width: "52px", height: "52px", objectFit: "cover", objectPosition: "center top", borderRadius: "50%", cursor: "pointer" }}
              preview={{
                mask: null,
              }}
              fallback="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
            />
          </div>
          <div className="up-user-meta">
            <div className="up-user-name">
              {user.firstname || user.Full_Name || "Member"}
            </div>
            <div className="up-user-caste">
              {user.caste || "Caste Not Set"}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              ID: #{user_id || "---"}
            </div>
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div className="up-progress-wrap">
          <div className="up-progress-labels">
            <span>Profile Strength</span>
            <span style={{ color: completionPercentage > 75 ? "#059669" : "#d97706" }}>
              {completionPercentage}%
            </span>
          </div>
          <Progress
            percent={completionPercentage}
            size="small"
            strokeColor={{
              "0%": "#f43f5e",
              "100%": "#e11d48",
            }}
            showInfo={false}
          />
        </div>

        {/* Navigation List */}
        <div className="up-nav-list">
          {["Matchmaking", "Wedding Services", "Billing & Plans", "My Account"].map((cat) => (
            <div key={cat}>
              <div className="up-nav-category">{cat}</div>
              {navItems
                .filter((item) => item.category === cat)
                .map((item) => (
                  <div
                    key={item.key}
                    className={`up-nav-item ${activeTab === item.key ? "active" : ""}`}
                    onClick={() => switchTab(item.key)}
                  >
                    <span className="up-nav-icon">{item.icon}</span>
                    <span className="up-nav-text">{item.label}</span>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className="up-nav-badge">{item.badge}</span>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="up-sidebar-footer">
          <button
            type="button"
            className="up-home-btn"
            onClick={() => navigate("/")}
          >
            <HomeOutlined /> Homepage
          </button>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={() => {
              localStorage.clear();
              navigate("/UserLogin/");
            }}
            style={{
              color: "#e11d48",
              fontWeight: "700",
              textAlign: "left",
              justifyContent: "flex-start",
              borderRadius: "10px",
              background: "#fff1f2",
            }}
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MOBILE APP HEADER (App-friendly view) */}
      {/* ============================================================== */}
      <header className="up-mobile-header">
        <div className="up-mobile-header-left">
          <button
            className="up-menu-btn"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open Navigation Drawer"
          >
            <MenuOutlined />
            {incomingWishlistItems.length > 0 && <span className="up-menu-btn-dot" />}
          </button>
          <div className="up-mobile-brand">
            <span style={{ fontSize: "20px" }}>💍</span>
            <div>
              <h2 className="up-mobile-brand-title">वैवाहिक मंच</h2>
              <span className="up-mobile-brand-sub">
                {displayCaste ? `${displayCaste} Sangam` : "Vaivaheek Manch"}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <span
            onClick={() => switchTab("plans")}
            style={{
              fontSize: "11px",
              fontWeight: "800",
              padding: "4px 9px",
              borderRadius: "14px",
              background: membershipStatus.isActive ? "#ecfdf5" : "#fff1f2",
              color: membershipStatus.isActive ? "#059669" : "#be123c",
              border: `1.5px solid ${membershipStatus.isActive ? "#a7f3d0" : "#fecdd3"}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            }}
          >
            {membershipStatus.isActive ? "👑 VIP" : "👑 Plan"}
          </span>

          <div
            onClick={() => switchTab("profile")}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid #e11d48",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(225, 29, 72, 0.22)",
              flexShrink: 0,
            }}
          >
            <img
              src={avatarUrl}
              alt="Avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
            />
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 3. MOBILE SLIDE-OUT DRAWER */}
      {/* ============================================================== */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>💍</span>
            <div>
              <div style={{ fontWeight: "900", color: "#881337", fontSize: "16px", lineHeight: "1.2" }}>वैवाहिक मंच</div>
              <div style={{ fontSize: "9.5px", color: "#be123c", fontWeight: "700", letterSpacing: "1px" }}>VAIVAHEEK MANCH MATRIMONIAL</div>
            </div>
          </div>
        }
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        styles={{ body: { padding: "12px 14px 36px" } }}
      >
        {/* Middle Vertical Close Arrow Button (Mobile Drawer) */}
        <button
          type="button"
          className="up-drawer-close-btn"
          onClick={() => setMobileDrawerOpen(false)}
          title="Close Side Menu"
          aria-label="Close Side Menu"
        >
          <LeftOutlined />
        </button>
        <div className="up-sidebar-user" style={{ margin: "0 0 16px 0" }}>
          <div className="up-user-avatar-wrap">
            <img src={avatarUrl} alt="Avatar" />
          </div>
          <div className="up-user-meta">
            <div className="up-user-name">{user.firstname || user.Full_Name || "Member"}</div>
            <div className="up-user-caste">{user.caste || "Caste Not Set"}</div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>ID: #{user_id}</div>
          </div>
        </div>



        <div className="up-nav-list" style={{ padding: 0 }}>
          {navItems.map((item) => (
            <div
              key={item.key}
              className={`up-nav-item ${activeTab === item.key ? "active" : ""}`}
              onClick={() => switchTab(item.key)}
            >
              <span className="up-nav-icon">{item.icon}</span>
              <span className="up-nav-text">{item.label}</span>
              {item.badge !== null && (
                <span className="up-nav-badge">{item.badge}</span>
              )}
            </div>
          ))}
        </div>

        <Divider style={{ margin: "16px 0" }} />
        <button
          type="button"
          className="up-home-btn"
          style={{ marginBottom: 10 }}
          onClick={() => {
            setMobileDrawerOpen(false);
            navigate("/");
          }}
        >
          <HomeOutlined /> Homepage
        </button>
        <Button
          danger
          block
          icon={<LogoutOutlined />}
          onClick={() => {
            localStorage.clear();
            navigate("/UserLogin/");
          }}
          style={{ borderRadius: "12px", fontWeight: "700" }}
        >
          Logout
        </Button>
      </Drawer>

      {/* ============================================================== */}
      {/* 4. MAIN CONTENT AREA */}
      {/* ============================================================== */}
      <main className="up-main">
        {/* Profile Completion Alert Banner */}
        {!hasCompletedProfile && (
          <div
            style={{
              background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
              border: "2px solid #fecdd3",
              borderRadius: "20px",
              padding: "18px 24px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
              flexWrap: "wrap",
              boxShadow: "0 6px 20px rgba(225, 29, 72, 0.12)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: "280px", flex: 1 }}>
              <span style={{ fontSize: "36px" }}>📝</span>
              <div>
                <div style={{ fontWeight: "900", color: "#881337", fontSize: "16px", marginBottom: "4px" }}>
                  Complete Your Matrimonial Profile Required
                </div>
                <div style={{ color: "#64748b", fontSize: "13.5px", lineHeight: "1.5" }}>
                  To view compatible partner profiles, check detailed biodatas, shortlist candidates, and connect with brides & grooms, completing your matrimonial biodata profile is mandatory.
                </div>
              </div>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<EditOutlined />}
              onClick={() => switchTab("edit")}
              style={{
                borderRadius: "24px",
                background: "linear-gradient(135deg, #e11d48, #be123c)",
                borderColor: "#e11d48",
                fontWeight: "800",
                fontSize: "14px",
                padding: "0 28px",
                height: "44px",
                boxShadow: "0 6px 18px rgba(225, 29, 72, 0.35)",
              }}
            >
              Complete My Profile Now
            </Button>
          </div>
        )}

        {/* Profile Restricted Alert Banner */}
        {hasCompletedProfile && !isProfileActive && (
          <div
            style={{
              background: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)",
              border: "2px solid #fde047",
              borderRadius: "20px",
              padding: "16px 24px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
              flexWrap: "wrap",
              boxShadow: "0 6px 20px rgba(234, 179, 8, 0.12)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: "280px", flex: 1 }}>
              <span style={{ fontSize: "36px" }}>🔒</span>
              <div>
                <div style={{ fontWeight: "900", color: "#854d0e", fontSize: "16px", marginBottom: "4px" }}>
                  🔒 Profile Restricted (Currently Deactivated)
                </div>
                <div style={{ color: "#713f12", fontSize: "13.5px", lineHeight: "1.5" }}>
                  Your profile is restricted and private. You can shortlist candidates, but sending connection requests and viewing partner contact details are restricted until you activate your profile.
                </div>
              </div>
            </div>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => setIsStatusModalOpen(true)}
              style={{
                borderRadius: "24px",
                background: "linear-gradient(135deg, #16a34a, #15803d)",
                borderColor: "#16a34a",
                fontWeight: "800",
                fontSize: "14px",
                padding: "0 28px",
                height: "44px",
                boxShadow: "0 6px 18px rgba(22, 163, 74, 0.35)",
              }}
            >
              Activate Profile Now
            </Button>
          </div>
        )}

        {/* ============================================================ */}
        {/* STANDALONE BIODATA COMPONENT VIEW (NOT INSIDE CARD)          */}
        {/* ============================================================ */}
        {isBiodataOpen && selectedMatch ? (
          <UserBiodataModal
            open={isBiodataOpen}
            onClose={closeCandidateBiodata}
            candidate={selectedMatch}
            user={user}
            user_id={user_id}
            baseurl={baseurl}
            allCandidates={allCandidates && allCandidates.length > 0 ? allCandidates : data}
            servicesList={servicesList}
            serviceCategories={serviceCategories}
            wishlistIds={wishlistIds}
            approvedWishlistItems={approvedWishlistItems}
            incomingWishlistItems={incomingWishlistItems}
            toggleWishlist={toggleWishlist}
            handleSendRequest={handleSendRequest}
            handleWishlistResponse={handleWishlistResponse}
            handleSensitiveClick={handleSensitiveClick}
            getSensitiveAccessStatus={getSensitiveAccessStatus}
            getContactRelationDisplay={getContactRelationDisplay}
            switchTab={switchTab}
            setIsStatusModalOpen={setIsStatusModalOpen}
            onSelectCandidate={(newCand) => {
              setSelectedMatch(newCand);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectService={(service) => {
              openServiceBiodata(service, selectedMatch);
            }}
          />
        ) : (
          <>
{/* ============================================================ */}
        {/* TAB A: CASTE MATCHES (Strict Caste + Strict Opposite Gender) */}
        {/* ============================================================ */}
        {activeTab === "matches" && (
          <div>
            {/* Quick Filter Horizontal Scrollable Chips (Mobile Application Feel) */}
            <div className="up-filter-chips-bar">
              <button
                type="button"
                className={`up-filter-chip ${matchAgeFilter === "all" && matchProfFilter === "all" && matchDietFilter === "all" && matchIncomeFilter === "all" ? "active" : ""}`}
                onClick={() => {
                  setMatchAgeFilter("all");
                  setMatchProfFilter("all");
                  setMatchDietFilter("all");
                  setMatchIncomeFilter("all");
                  setMatchQualFilter("all");
                  setMatchManglikFilter("all");
                }}
              >
                ✨ All Matches
              </button>
              <button
                type="button"
                className={`up-filter-chip ${matchAgeFilter === "18-24" ? "active" : ""}`}
                onClick={() => setMatchAgeFilter(matchAgeFilter === "18-24" ? "all" : "18-24")}
              >
                🎂 18-24 Yrs
              </button>
              <button
                type="button"
                className={`up-filter-chip ${matchAgeFilter === "25-29" ? "active" : ""}`}
                onClick={() => setMatchAgeFilter(matchAgeFilter === "25-29" ? "all" : "25-29")}
              >
                🎂 25-29 Yrs
              </button>
              <button
                type="button"
                className={`up-filter-chip ${matchAgeFilter === "30-34" ? "active" : ""}`}
                onClick={() => setMatchAgeFilter(matchAgeFilter === "30-34" ? "all" : "30-34")}
              >
                🎂 30-34 Yrs
              </button>
              <button
                type="button"
                className={`up-filter-chip ${matchProfFilter === "software" ? "active" : ""}`}
                onClick={() => setMatchProfFilter(matchProfFilter === "software" ? "all" : "software")}
              >
                💻 Software / IT
              </button>
              <button
                type="button"
                className={`up-filter-chip ${matchProfFilter === "govt" ? "active" : ""}`}
                onClick={() => setMatchProfFilter(matchProfFilter === "govt" ? "all" : "govt")}
              >
                🏛️ Govt Job
              </button>
              <button
                type="button"
                className={`up-filter-chip ${matchDietFilter === "vegetarian" ? "active" : ""}`}
                onClick={() => setMatchDietFilter(matchDietFilter === "vegetarian" ? "all" : "vegetarian")}
              >
                🥗 Vegetarian
              </button>
              <button
                type="button"
                className={`up-filter-chip ${matchManglikFilter === "non-manglik" ? "active" : ""}`}
                onClick={() => setMatchManglikFilter(matchManglikFilter === "non-manglik" ? "all" : "non-manglik")}
              >
                🕉️ Non-Manglik
              </button>
              <button
                type="button"
                className={`up-filter-chip ${matchIncomeFilter === "50000" ? "active" : ""}`}
                onClick={() => setMatchIncomeFilter(matchIncomeFilter === "50000" ? "all" : "50000")}
              >
                💰 ₹50k+/mo
              </button>
              <button
                type="button"
                className={`up-filter-chip ${matchIncomeFilter === "100000" ? "active" : ""}`}
                onClick={() => setMatchIncomeFilter(matchIncomeFilter === "100000" ? "all" : "100000")}
              >
                💎 ₹1L+/mo
              </button>
            </div>

            {/* Quick Search Input + Filter Toggle */}
            <div style={{ marginBottom: "16px" }}>
              <Row gutter={[10, 10]} align="middle">
                <Col flex="auto">
                  <Input
                    prefix={<SearchOutlined style={{ color: "#e11d48" }} />}
                    placeholder={`Search within ${displayCaste || "community"} (name, city, profession, gotra)...`}
                    value={matchSearch}
                    onChange={(e) => setMatchSearch(e.target.value)}
                    allowClear
                    style={{ borderRadius: "14px", padding: "8px 14px" }}
                  />
                </Col>
                <Col flex="none">
                  <Button
                    onClick={() => setMobileFiltersOpen((prev) => !prev)}
                    style={{
                      borderRadius: "14px",
                      height: "40px",
                      fontWeight: "700",
                      borderColor: activeFilterCount > 0 ? "#e11d48" : "#cbd5e1",
                      background: activeFilterCount > 0 ? "#fff1f2" : "#ffffff",
                      color: activeFilterCount > 0 ? "#e11d48" : "#475569",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <FilterOutlined />
                    <span>{mobileFiltersOpen ? "Hide Filters" : "Filters"}</span>
                    {activeFilterCount > 0 && (
                      <span className="up-filter-count-badge">{activeFilterCount}</span>
                    )}
                  </Button>
                </Col>
              </Row>
            </div>

            {/* Comprehensive Search & Filter Section (Collapsible on mobile phone, always visible on desktop) */}
            <div className={`up-filter-panel ${mobileFiltersOpen ? "up-filters-open" : "up-filters-collapsed"}`} style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <SearchOutlined style={{ color: "#e11d48", fontSize: "18px" }} />
                  <span style={{ fontWeight: "800", color: "#881337", fontSize: "16px" }}>
                    Filter Criteria ({activeFilterCount} applied)
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#64748b" }}>
                    Showing <strong style={{ color: "#be123c" }}>{displayedMatches.length}</strong> of {matchCasteProfiles.length} verified profiles
                  </span>
                  <Button
                    size="small"
                    onClick={() => {
                      setMatchSearch("");
                      setMatchAgeFilter("all");
                      setMatchHeightFilter("all");
                      setMatchMaritalFilter("all");
                      setMatchQualFilter("all");
                      setMatchProfFilter("all");
                      setMatchIncomeFilter("all");
                      setMatchManglikFilter("all");
                      setMatchDietFilter("all");
                      setMatchStateFilter("all");
                      setMatchDistrictFilter("all");
                      setMatchDistrictsList([]);
                      setMatchSubcasteFilter("");
                    }}
                    style={{ borderRadius: "12px", fontWeight: "700" }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>

              <Row gutter={[14, 14]}>
                {/* 1. Keyword (Name, profession, city, education) */}
                <Col xs={24} md={8}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "4px", display: "block" }}>
                    Search Keyword
                  </label>
                  <Input
                    prefix={<SearchOutlined style={{ color: "#e11d48" }} />}
                    placeholder="Search by name, city, profession, qualification..."
                    value={matchSearch}
                    onChange={(e) => setMatchSearch(e.target.value)}
                    allowClear
                    style={{ borderRadius: "12px", padding: "7px 12px" }}
                  />
                </Col>

                {/* 2. Age Range */}
                <Col xs={12} sm={8} md={4}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "4px", display: "block" }}>
                    Age Range
                  </label>
                  <Select
                    value={matchAgeFilter}
                    onChange={setMatchAgeFilter}
                    style={{ width: "100%", borderRadius: "12px" }}
                  >
                    <Option value="all">All Ages</Option>
                    <Option value="18-24">18 - 24 Years</Option>
                    <Option value="25-29">25 - 29 Years</Option>
                    <Option value="30-34">30 - 34 Years</Option>
                    <Option value="35-39">35 - 39 Years</Option>
                    <Option value="40+">40+ Years</Option>
                  </Select>
                </Col>

                {/* 3. Height Range */}
                <Col xs={12} sm={8} md={4}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "4px", display: "block" }}>
                    Height Range
                  </label>
                  <Select
                    value={matchHeightFilter}
                    onChange={setMatchHeightFilter}
                    style={{ width: "100%", borderRadius: "12px" }}
                  >
                    <Option value="all">All Heights</Option>
                    <Option value="below-152">Below 5'0" (&lt;152 cm)</Option>
                    <Option value="152-160">5'0" - 5'3" (152-160 cm)</Option>
                    <Option value="161-170">5'4" - 5'7" (161-170 cm)</Option>
                    <Option value="171-183">5'8" - 6'0" (171-183 cm)</Option>
                    <Option value="183+">6'0"+ (&gt;183 cm)</Option>
                  </Select>
                </Col>

                {/* 4. Marital Status */}
                <Col xs={12} sm={8} md={4}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "4px", display: "block" }}>
                    Marital Status
                  </label>
                  <Select
                    value={matchMaritalFilter}
                    onChange={setMatchMaritalFilter}
                    style={{ width: "100%", borderRadius: "12px" }}
                  >
                    <Option value="all">Any Status</Option>
                    <Option value="unmarried">Never Married / Unmarried</Option>
                    <Option value="divorced">Divorced</Option>
                    <Option value="widowed">Widowed</Option>
                    <Option value="awaiting">Awaiting Divorce</Option>
                  </Select>
                </Col>

                {/* 5. Education / Qualification */}
                <Col xs={12} sm={8} md={4}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "4px", display: "block" }}>
                    Qualification
                  </label>
                  <Select
                    value={matchQualFilter}
                    onChange={setMatchQualFilter}
                    style={{ width: "100%", borderRadius: "12px" }}
                  >
                    <Option value="all">Any Qualification</Option>
                    <Option value="master">Post Graduate / Master</Option>
                    <Option value="bachelor">Graduate / Bachelor</Option>
                    <Option value="mca">MCA / B.Tech / IT</Option>
                    <Option value="doctor">Medical / MBBS / MD</Option>
                    <Option value="ca">CA / CS / Finance</Option>
                    <Option value="phd">Doctorate / Ph.D</Option>
                  </Select>
                </Col>

                {/* 6. Profession / Occupation (From Backend Model) */}
                <Col xs={12} sm={8} md={4}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "4px", display: "block" }}>
                    Profession
                  </label>
                  <Select
                    showSearch
                    value={matchProfFilter}
                    onChange={setMatchProfFilter}
                    style={{ width: "100%", borderRadius: "12px" }}
                    placeholder="All Professions"
                    filterOption={(input, option) =>
                      String(option.children || "").toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    <Option value="all">Any Profession</Option>
                    {professionsList.map((pName) => (
                      <Option key={pName} value={pName}>
                        {pName}
                      </Option>
                    ))}
                  </Select>
                </Col>

                {/* 7. Monthly Income */}
                <Col xs={12} sm={8} md={4}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "4px", display: "block" }}>
                    Monthly Income
                  </label>
                  <Select
                    value={matchIncomeFilter}
                    onChange={setMatchIncomeFilter}
                    style={{ width: "100%", borderRadius: "12px" }}
                  >
                    <Option value="all">Any Income</Option>
                    <Option value="25000">₹25,000+ / mo</Option>
                    <Option value="50000">₹50,000+ / mo</Option>
                    <Option value="75000">₹75,000+ / mo</Option>
                    <Option value="100000">₹1,00,000+ / mo</Option>
                    <Option value="200000">₹2,00,000+ / mo</Option>
                  </Select>
                </Col>

                {/* 8. Manglik / Kundali */}
                <Col xs={12} sm={8} md={4}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "4px", display: "block" }}>
                    Manglik / Kundali
                  </label>
                  <Select
                    value={matchManglikFilter}
                    onChange={setMatchManglikFilter}
                    style={{ width: "100%", borderRadius: "12px" }}
                  >
                    <Option value="all">Doesn't Matter</Option>
                    <Option value="non-manglik">Non-Manglik Only</Option>
                    <Option value="manglik">Manglik Only</Option>
                  </Select>
                </Col>

                {/* 9. Diet Preference */}
                <Col xs={12} sm={8} md={4}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "4px", display: "block" }}>
                    Diet / Lifestyle
                  </label>
                  <Select
                    value={matchDietFilter}
                    onChange={setMatchDietFilter}
                    style={{ width: "100%", borderRadius: "12px" }}
                  >
                    <Option value="all">Any Diet</Option>
                    <Option value="vegetarian">Vegetarian Only</Option>
                    <Option value="non-vegetarian">Non-Vegetarian</Option>
                  </Select>
                </Col>

                {/* 10. State Dropdown */}
                <Col xs={12} sm={8} md={4}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "4px", display: "block" }}>
                    State
                  </label>
                  <Select
                    showSearch
                    value={matchStateFilter}
                    onChange={(val) => {
                      setMatchStateFilter(val);
                      setMatchDistrictFilter("all");
                      if (val === "all") {
                        setMatchDistrictsList([]);
                      } else {
                        const matched = statesList.find(
                          (s) => (s.state || s.State || "").toLowerCase() === val.toLowerCase()
                        );
                        if (matched) {
                          const rawDist = matched.disttrict || matched.district || matched.districts || matched.Districts || [];
                          setMatchDistrictsList(Array.isArray(rawDist) ? rawDist : []);
                        } else {
                          setMatchDistrictsList([]);
                        }
                      }
                    }}
                    style={{ width: "100%", borderRadius: "12px" }}
                  >
                    <Option value="all">All States</Option>
                    {statesList.map((s, idx) => (
                      <Option key={idx} value={s.state || s.State}>
                        {s.state || s.State}
                      </Option>
                    ))}
                  </Select>
                </Col>

                {/* 11. District Dropdown */}
                <Col xs={12} sm={8} md={4}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "4px", display: "block" }}>
                    District / City
                  </label>
                  <Select
                    showSearch
                    value={matchDistrictFilter}
                    onChange={setMatchDistrictFilter}
                    style={{ width: "100%", borderRadius: "12px" }}
                    placeholder="All Districts"
                    filterOption={(input, option) =>
                      String(option.children || "").toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    <Option value="all">
                      {matchStateFilter && matchStateFilter !== "all" ? `All Districts (${matchStateFilter})` : "All Districts"}
                    </Option>
                    {(matchDistrictsList.length > 0 ? matchDistrictsList : (matchStateFilter === "all" ? allDistrictsList : [])).map((d, idx) => (
                      <Option key={idx} value={d}>
                        {d}
                      </Option>
                    ))}
                  </Select>
                </Col>

                {/* 12. Gotra Filter */}
                <Col xs={12} sm={8} md={4}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "4px", display: "block" }}>
                    Gotra (गोत्र)
                  </label>
                  <Input
                    placeholder="e.g. Kashyap, Shandilya..."
                    value={matchSubcasteFilter}
                    onChange={(e) => setMatchSubcasteFilter(e.target.value)}
                    allowClear
                    style={{ borderRadius: "12px", padding: "7px 12px" }}
                  />
                </Col>
              </Row>
            </div>

            {/* Profiles Grid */}
            {isLoading ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <Spin size="large" tip="Finding verified same-caste opposite-gender profiles..." />
              </div>
            ) : !hasCompletedProfile ? (
              <Card
                variant="borderless"
                style={{
                  borderRadius: "24px",
                  padding: "60px 24px",
                  textAlign: "center",
                  border: "2px dashed #fecdd3",
                  background: "#ffffff",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.04)",
                  margin: "16px 0",
                }}
              >
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>🔒</div>
                <h2 style={{ color: "#881337", fontWeight: "900", fontSize: "24px", margin: "0 0 12px" }}>
                  Complete Your Profile to View Partner Matches
                </h2>
                <p style={{ color: "#64748b", maxWidth: "580px", margin: "0 auto 24px", fontSize: "15px", lineHeight: "1.6" }}>
                  Adding your matrimonial biodata (Name, Gender, Caste, Education, Address, etc.) is required before viewing partner matches, reading full biodatas, and shortlisting candidates.
                </p>
                <Button
                  type="primary"
                  size="large"
                  icon={<EditOutlined />}
                  onClick={() => switchTab("edit")}
                  style={{
                    height: "48px",
                    padding: "0 36px",
                    borderRadius: "24px",
                    fontWeight: "800",
                    fontSize: "15px",
                    background: "linear-gradient(135deg, #e11d48, #be123c)",
                    boxShadow: "0 8px 24px rgba(225, 29, 72, 0.35)",
                  }}
                >
                  Complete Profile / Add Biodata
                </Button>
              </Card>
            ) : displayedMatches.length === 0 ? (
              <Card
                variant="borderless"
                style={{
                  borderRadius: "24px",
                  textAlign: "center",
                  padding: "50px 20px",
                  background: "#ffffff",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                }}
              >
                <Empty
                  description={
                    <div>
                      <h3 style={{ color: "#881337", fontWeight: "800", margin: "14px 0 6px" }}>
                        No Matches Found
                      </h3>
                      <p style={{ color: "#64748b", maxWidth: "420px", margin: "0 auto" }}>
                        {user.caste
                          ? `We couldn't find any ${targetOppositeGender === "female" ? "Female" : "Male"} profiles registered under ${user.caste} matching your current filters.`
                          : "Please set your caste in your profile to view compatible matrimonial matches."}
                      </p>
                    </div>
                  }
                />
              </Card>
            ) : (
              <>
                <Row gutter={[20, 24]}>
                  {paginatedMatches.map((cand) => renderCandidateCard(cand))}
                </Row>
                {displayedMatches.length > matchesPageSize && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "32px", marginBottom: "16px" }}>
                    <Pagination
                      current={matchesPage}
                      pageSize={matchesPageSize}
                      total={displayedMatches.length}
                      pageSizeOptions={["10", "12", "15"]}
                      showSizeChanger
                      showQuickJumper
                      showTotal={(total, range) => `Showing ${range[0]}-${range[1]} of ${total} Profiles (10-15 per page)`}
                      onChange={(page, pageSize) => {
                        setMatchesPage(page);
                        setMatchesPageSize(pageSize);
                        window.scrollTo({ top: 320, behavior: "smooth" });
                      }}
                      style={{
                        background: "#ffffff",
                        padding: "12px 24px",
                        borderRadius: "16px",
                        boxShadow: "0 4px 20px rgba(225, 29, 72, 0.08)",
                        border: "1.5px solid #ffe4e6",
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB S: WEDDING & EVENT SERVICES (Service_Data & Services) */}
        {/* ============================================================ */}
        {activeTab === "services" && (
          isServiceBiodataOpen && selectedService ? (
            <ServiceBiodataModal
              open={isServiceBiodataOpen}
              onClose={closeServiceBiodata}
              service={selectedService}
              user={user}
              user_id={user_id}
              baseurl={baseurl}
              servicesList={servicesList}
              serviceCategories={serviceCategories}
              onSelectService={(newService) => {
                setSelectedService(newService);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              returnToCandidate={serviceOpenedFromCandidate}
              onBackToCandidate={backFromServiceToCandidate}
            />
          ) : (
            <div>
              {/* 1. Hero Header Banner */}
            <div className="up-services-hero">
              <div className="up-services-hero-top">
                <div>
                  <div className="up-services-hero-badge">
                    <ShopOutlined /> Verified Wedding Vendors & Services
                  </div>
                  <h2 className="up-services-hero-title">
                    विवाह एवं आयोजन सेवाएं (Wedding & Event Services)
                  </h2>
                  <p className="up-services-hero-subtitle">
                    Connect directly with trusted wedding partners — DJs, Photographers, Caterers, Venues, Decorators & more for your special celebrations.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Tag
                    color="purple"
                    style={{
                      padding: "8px 14px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: "700",
                      background: "rgba(255, 255, 255, 0.95)",
                      color: "#4f46e5",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    🎉 {servicesList.length} Active Services
                  </Tag>
                  {(user.district || user.District) && (
                    <Tag
                      color="green"
                      style={{
                        padding: "8px 14px",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: "700",
                        background: "rgba(255, 255, 255, 0.95)",
                        color: "#059669",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      }}
                    >
                      📍 My District: {user.district || user.District}
                    </Tag>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Filter Bar & Categories */}
            <div className="up-services-filter-box">
              {/* Category Pills */}
              <div className="up-services-cat-pills">
                <div
                  className={`up-cat-pill ${serviceCategoryFilter === "all" ? "active" : ""}`}
                  onClick={() => setServiceCategoryFilter("all")}
                >
                  <ShopOutlined /> All Categories ({servicesList.length})
                </div>
                {serviceCategories.map((cat) => {
                  const catName = cat.Service_Type || cat.Service_Name;
                  const catCount = servicesList.filter(
                    (s) => (s.Service_Type || "").toLowerCase() === (catName || "").toLowerCase()
                  ).length;
                  return (
                    <div
                      key={cat.id || catName}
                      className={`up-cat-pill ${serviceCategoryFilter.toLowerCase() === catName.toLowerCase() ? "active" : ""}`}
                      onClick={() => setServiceCategoryFilter(catName)}
                    >
                      <span>{getServiceCategoryIcon(catName)} {catName}</span>
                      <span style={{ opacity: 0.85, fontSize: "11px" }}>({catCount})</span>
                    </div>
                  );
                })}
              </div>

              {/* District & Search Controls */}
              <Row gutter={[12, 12]} align="middle">
                <Col xs={24} sm={12} md={8}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                      📍 Location / District Filter:
                    </label>
                    <Select
                      value={serviceDistrictFilter}
                      onChange={(val) => setServiceDistrictFilter(val)}
                      style={{ width: "100%" }}
                      size="large"
                      showSearch
                      optionFilterProp="children"
                    >
                      {(user.district || user.District) && (
                        <Option value={user.district || user.District}>
                          📍 My District: {user.district || user.District} (Default)
                        </Option>
                      )}
                      <Option value="all">🌐 All Districts (सभी जिले)</Option>
                      {allDistrictsList
                        .filter((d) => d && d !== (user.district || user.District))
                        .map((dist) => (
                          <Option key={dist} value={dist}>
                            {dist}
                          </Option>
                        ))}
                    </Select>
                  </div>
                </Col>

                <Col xs={24} sm={12} md={10}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                      🔍 Search Services:
                    </label>
                    <Input
                      placeholder="Search DJ, Photography, Caterer, City..."
                      prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      allowClear
                      size="large"
                      style={{ borderRadius: "12px" }}
                    />
                  </div>
                </Col>

                <Col xs={24} sm={24} md={6} style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                  <Button
                    onClick={() => {
                      setServiceCategoryFilter("all");
                      setServiceDistrictFilter(user.district || user.District || "all");
                      setServiceSearch("");
                    }}
                    icon={<ReloadOutlined />}
                    size="large"
                    style={{ borderRadius: "12px", width: "100%", fontWeight: "700", color: "#475569" }}
                  >
                    Reset Filter
                  </Button>
                </Col>
              </Row>

              {/* Active Filter Notice */}
              <div
                style={{
                  marginTop: "12px",
                  padding: "8px 12px",
                  background: "#f1f5f9",
                  borderRadius: "10px",
                  fontSize: "12px",
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "6px",
                }}
              >
                <div>
                  <strong>Showing:</strong> {filteredServices.length} {filteredServices.length === 1 ? "service" : "services"}
                  {serviceDistrictFilter && serviceDistrictFilter !== "all" && (
                    <span> available in <strong>{serviceDistrictFilter}</strong></span>
                  )}
                  {serviceCategoryFilter && serviceCategoryFilter !== "all" && (
                    <span> in <strong>{serviceCategoryFilter}</strong> category</span>
                  )}
                  {serviceDistrictFilter && serviceDistrictFilter === (user.district || user.District) && (
                    <span style={{ color: "#059669", fontWeight: "700", marginLeft: "6px" }}>(Default: Your District)</span>
                  )}
                </div>
                {serviceDistrictFilter !== "all" && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setServiceDistrictFilter("all")}
                    style={{ padding: 0, fontWeight: "700", color: "#4f46e5", height: "auto" }}
                  >
                    View All Districts ({servicesList.length}) →
                  </Button>
                )}
              </div>
            </div>

            {/* 3. Services Divided By Category Based on Services Model Sequence */}
            {filteredServices.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "20px",
                  padding: "48px 24px",
                  textAlign: "center",
                  border: "1.5px dashed #cbd5e1",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                }}
              >
                <Empty
                  description={
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
                        No Services Found Matching Your Filter
                      </div>
                      <div style={{ fontSize: "13px", color: "#64748b", maxWidth: "450px", margin: "0 auto 16px" }}>
                        {serviceDistrictFilter !== "all"
                          ? `Currently no registered partners in "${serviceDistrictFilter}". Click below to see all available services.`
                          : "Try searching with different keywords or selecting 'All Categories'."}
                      </div>
                      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                        <Button
                          type="primary"
                          onClick={() => {
                            setServiceCategoryFilter("all");
                            setServiceDistrictFilter("all");
                            setServiceSearch("");
                          }}
                          style={{
                            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                            borderColor: "transparent",
                            borderRadius: "12px",
                            fontWeight: "700",
                            height: "40px",
                          }}
                        >
                          Explore All Districts ({servicesList.length} Services)
                        </Button>
                      </div>
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="up-services-sections-container">
                {servicesGroupedByCategory.map((group, groupIdx) => (
                  <div key={group.catId || group.catName} className="up-services-category-block">
                    {/* Category Divider Header */}
                    <div className="up-services-category-header">
                      <div className="up-services-category-title-wrap">
                        <span className="up-services-category-seq-chip">
                          #{groupIdx + 1}
                        </span>
                        <h3 className="up-services-category-title">
                          <span style={{ fontSize: "22px" }}>{group.icon}</span>
                          <span>{group.catName}</span>
                        </h3>
                        <span className="up-services-category-count-badge">
                          {group.services.length} {group.services.length === 1 ? "Partner" : "Partners"}
                        </span>
                      </div>

                      {serviceCategoryFilter === "all" && (
                        <Button
                          size="small"
                          onClick={() => setServiceCategoryFilter(group.catName)}
                          style={{
                            borderRadius: "10px",
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "#4f46e5",
                            borderColor: "#c7d2fe",
                            background: "#f5f3ff",
                          }}
                        >
                          Focus Category →
                        </Button>
                      )}
                    </div>

                    {/* Services Grid for This Category */}
                    <div className="up-services-grid">
                      {group.services.map((service) => {
                        const sPic = getMediaUrl(service.Picture, null);

                        const rawZones = service.Available_Zone;
                        let parsedZones = [];
                        if (Array.isArray(rawZones)) parsedZones = rawZones;
                        else if (typeof rawZones === "string") {
                          try { parsedZones = JSON.parse(rawZones); } catch { parsedZones = rawZones.split(",").map((z) => z.trim()); }
                        }

                        const coversUserDist = (user.district || user.District) && (
                          (service.District && service.District.toLowerCase() === (user.district || user.District).toLowerCase()) ||
                          parsedZones.some((z) => String(z).toLowerCase() === "all" || String(z).toLowerCase() === (user.district || user.District).toLowerCase())
                        );

                        return (
                          <div
                            key={service.id}
                            className="up-service-card"
                            onClick={() => openServiceBiodata(service)}
                            style={{ cursor: "pointer" }}
                          >
                            {/* Thumbnail with overlay badges */}
                            <div className="up-service-card-img-wrap">
                              {sPic ? (
                                <img src={sPic} alt={service.Service_Name} className="up-service-card-img" />
                              ) : (
                                <div style={{ textAlign: "center", color: "#ffffff" }}>
                                  <ShopOutlined style={{ fontSize: "48px", opacity: 0.85 }} />
                                  <div style={{ fontSize: "12px", fontWeight: "700", marginTop: "4px" }}>
                                    {service.Service_Type || "Wedding Service"}
                                  </div>
                                </div>
                              )}
                              <span className="up-service-type-badge">
                                {group.icon} {service.Service_Type || "Service"}
                              </span>
                              <span className="up-service-verified-badge">
                                <CheckCircleFilled /> Verified
                              </span>
                              {service.Service_Price && (
                                <span className="up-service-price-pill">
                                  ₹{Number(service.Service_Price).toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>

                            {/* Card Body */}
                            <div className="up-service-card-body">
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                                <h3 className="up-service-card-title">{service.Service_Name || "Service Partner"}</h3>
                                {coversUserDist && (
                                  <Tag color="cyan" style={{ fontSize: "10px", fontWeight: "800", borderRadius: "6px", margin: 0 }}>
                                    📍 In Your City
                                  </Tag>
                                )}
                              </div>

                              <p className="up-service-card-desc">
                                {service.Service_Description || "Professional wedding and ceremony service provider on Vaivaheek Manch."}
                              </p>

                              <div className="up-service-card-meta">
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <EnvironmentOutlined style={{ color: "#e11d48" }} />
                                  <span style={{ fontWeight: "600" }}>
                                    {service.City || service.District || "Location on Request"}{service.State ? `, ${service.State}` : ""}
                                  </span>
                                </div>
                                <div style={{ fontSize: "11px", color: "#64748b" }}>
                                  {parsedZones.includes("All")
                                    ? "🌐 Available in All Districts & Cities"
                                    : `📌 Covers: ${parsedZones.slice(0, 3).join(", ")}${parsedZones.length > 3 ? ` +${parsedZones.length - 3} more` : ""}`}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="up-service-card-actions">
                                <Button
                                  className="up-service-wa-btn"
                                  icon={<WhatsAppOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWhatsAppService(service);
                                  }}
                                >
                                  WhatsApp
                                </Button>
                                <Button
                                  className="up-service-call-btn"
                                  icon={<PhoneOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCallService(service);
                                  }}
                                >
                                  Call Now
                                </Button>
                                <Button
                                  className="up-service-details-btn"
                                  icon={<EyeOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openServiceBiodata(service);
                                  }}
                                >
                                  View Service Biodata →
                                </Button>
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
          )
        )}

        {/* ============================================================ */}
        {/* TAB C: MEMBERSHIP PLANS (Backend Plans Model + Razorpay) */}
        {/* ============================================================ */}
        {activeTab === "plans" && (
          <div>
            {/* Header Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)",
                borderRadius: "22px",
                padding: "24px 28px",
                border: "1.5px solid #fef3c7",
                boxShadow: "0 10px 30px rgba(217, 119, 6, 0.08)",
                marginBottom: "24px",
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
                    fontSize: "24px",
                    fontWeight: "900",
                    color: "#92400e",
                    letterSpacing: "-0.5px",
                  }}
                >
                  👑 Membership & Contact Unlock Plans
                </h2>
                <p style={{ margin: "6px 0 0", color: "#78350f", fontSize: "14px" }}>
                  Fetched directly from backend database. Choose a plan to unlock verified candidate WhatsApp and phone numbers.
                </p>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  padding: "10px 16px",
                  borderRadius: "16px",
                  border: "1px solid #fde68a",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <CalendarOutlined style={{ fontSize: "20px", color: membershipStatus.isActive ? "#059669" : "#d97706" }} />
                <div>
                  <div style={{ fontSize: "11px", color: "#92400e", fontWeight: "700" }}>
                    {membershipStatus.isActive ? "Membership active" : "Membership status"}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#78350f" }}>
                    {membershipStatus.validUntil ? `Valid until ${membershipStatus.validUntil}` : "Choose a membership plan"}
                  </div>
                </div>
                <Tag color={membershipStatus.isActive ? "success" : "warning"} style={{ margin: 0, fontWeight: "700", borderRadius: "12px" }}>
                  {membershipStatus.remainingLabel}
                </Tag>
              </div>
            </div>

            {/* Plans Grid */}
            <Row gutter={[24, 24]}>
              {plansList.map((plan, idx) => {
                const planName = plan.Plan || plan.title || "Membership Plan";
                const amount = plan.Amount || plan.price || 100;
                const discount = plan.Discount_Amount || 0;
                const validity =
                  typeof plan.Validity === "number" || (!isNaN(Number(plan.Validity)) && plan.Validity !== null && plan.Validity !== "")
                    ? `${plan.Validity} Days`
                    : (plan.Validity || "30 Days");
                const msg = plan.Msg || "Full access to verified matrimonial candidates with direct contact details.";
                const isPopular = idx === 1;

                return (
                  <Col xs={24} md={8} key={plan.id || idx}>
                    <Card
                      variant="borderless"
                      style={{
                        borderRadius: "24px",
                        boxShadow: isPopular
                          ? "0 16px 36px rgba(225, 29, 72, 0.16)"
                          : "0 10px 24px rgba(0, 0, 0, 0.05)",
                        border: isPopular ? "2px solid #e11d48" : "1.5px solid #f1f5f9",
                        background: "#ffffff",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      styles={{
                        body: {
                          padding: "28px 24px",
                          display: "flex",
                          flexDirection: "column",
                          flex: 1,
                        },
                      }}
                    >
                      {isPopular && (
                        <div
                          style={{
                            position: "absolute",
                            top: "16px",
                            right: "-32px",
                            background: "linear-gradient(135deg, #e11d48, #be123c)",
                            color: "#ffffff",
                            padding: "4px 38px",
                            transform: "rotate(45deg)",
                            fontSize: "11px",
                            fontWeight: "800",
                            letterSpacing: "0.5px",
                            boxShadow: "0 4px 10px rgba(225, 29, 72, 0.3)",
                          }}
                        >
                          POPULAR
                        </div>
                      )}

                      <div style={{ marginBottom: "16px" }}>
                        <span
                          style={{
                            background: isPopular ? "#ffe4e6" : "#f1f5f9",
                            color: isPopular ? "#be123c" : "#475569",
                            fontWeight: "800",
                            fontSize: "12px",
                            padding: "4px 12px",
                            borderRadius: "16px",
                          }}
                        >
                          {plan.Type || "Membership"}
                        </span>
                        <h3
                          style={{
                            margin: "12px 0 6px",
                            fontSize: "22px",
                            fontWeight: "900",
                            color: "#1e293b",
                          }}
                        >
                          {planName}
                        </h3>
                        <p style={{ color: "#64748b", fontSize: "13px", margin: 0, minHeight: "38px" }}>
                          {msg}
                        </p>
                      </div>

                      <div
                        style={{
                          margin: "16px 0 20px",
                          padding: "16px",
                          background: "#fff8f9",
                          borderRadius: "16px",
                          border: "1px dashed #fecdd3",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                          <span style={{ fontSize: "32px", fontWeight: "900", color: "#881337" }}>
                            ₹{amount}
                          </span>
                          {discount > 0 && (
                            <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: "15px" }}>
                              ₹{amount + discount}
                            </span>
                          )}
                          <span style={{ color: "#64748b", fontSize: "13px", fontWeight: "600" }}>
                            / {validity}
                          </span>
                        </div>
                        {discount > 0 && (
                          <div style={{ fontSize: "12px", color: "#059669", fontWeight: "700", marginTop: "4px" }}>
                            Save ₹{discount} with instant discount
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                        {[
                          "Unlimited community profiles browsing",
                          "Verified WhatsApp & phone numbers",
                          "Astrological & Horoscope matching",
                          "100% genuine candidate biodatas",
                          "Instant activation via Razorpay",
                        ].map((feature, fIdx) => (
                          <div key={fIdx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                            <CheckCircleOutlined style={{ color: "#059669", fontSize: "15px" }} />
                            <span style={{ color: "#334155" }}>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        type="primary"
                        size="large"
                        loading={buyingPlanId === (plan.id || plan.Plan)}
                        onClick={() => handleBuyPlan(plan)}
                        style={{
                          borderRadius: "16px",
                          background: isPopular
                            ? "linear-gradient(135deg, #e11d48, #be123c)"
                            : "linear-gradient(135deg, #0284c7, #0369a1)",
                          fontWeight: "800",
                          height: "46px",
                          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.12)",
                        }}
                      >
                        Activate via Razorpay
                      </Button>

                      <Button
                        size="middle"
                        loading={buyingPlanId === `dummy_${plan.id || plan.Plan}`}
                        onClick={() => handleDummyTestPayment(plan)}
                        style={{
                          marginTop: "10px",
                          borderRadius: "14px",
                          border: "1.5px dashed #f59e0b",
                          background: "#fffbeb",
                          color: "#b45309",
                          fontWeight: "700",
                          height: "40px",
                        }}
                      >
                        ⚡ Instant Dummy / Test Pay
                      </Button>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB D: TRANSACTION DETAILS (Backend User_Transactions Model) */}
        {/* ============================================================ */}
        {activeTab === "transactions" && (
          <div>
            {/* Header Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
                borderRadius: "22px",
                padding: "24px 28px",
                border: "1.5px solid #dbeafe",
                boxShadow: "0 10px 30px rgba(37, 99, 235, 0.06)",
                marginBottom: "24px",
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
                    fontSize: "24px",
                    fontWeight: "900",
                    color: "#1e40af",
                    letterSpacing: "-0.5px",
                  }}
                >
                  💳 Transaction Ledger & Invoices
                </h2>
                <p style={{ margin: "6px 0 0", color: "#3b82f6", fontSize: "14px" }}>
                  All verified payment records and membership transactions.
                </p>
              </div>

              <Button
                type="primary"
                icon={<CrownOutlined />}
                onClick={() => switchTab("plans")}
                style={{
                  borderRadius: "18px",
                  background: "linear-gradient(135deg, #2563eb, #1d4f91)",
                  fontWeight: "700",
                }}
              >
                Upgrade Membership
              </Button>
            </div>

            {/* Metrics Row */}
            <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
              <Col xs={12} sm={8}>
                <div style={{ background: "#ffffff", padding: "18px", borderRadius: "18px", border: "1px solid #f1f5f9" }}>
                  <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Total Transactions</div>
                  <div style={{ fontSize: "24px", fontWeight: "900", color: "#1e293b", marginTop: "4px" }}>
                    {transactionsList.length}
                  </div>
                </div>
              </Col>
              <Col xs={12} sm={8}>
                <div style={{ background: "#ffffff", padding: "18px", borderRadius: "18px", border: "1px solid #f1f5f9" }}>
                  <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Total Paid</div>
                  <div style={{ fontSize: "24px", fontWeight: "900", color: "#059669", marginTop: "4px" }}>
                    ₹{transactionsList.reduce((acc, t) => acc + Number(t.Amount || t.amount || 0), 0)}
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ background: "#ffffff", padding: "18px", borderRadius: "18px", border: "1px solid #f1f5f9" }}>
                  <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "700" }}>Active Status</div>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: "#be123c", marginTop: "4px" }}>
                    {membershipStatus.isActive ? "Premium Member" : "Free Tier"}
                  </div>
                </div>
              </Col>
            </Row>

            {/* Transaction List Cards */}
            {transactionsList.length === 0 ? (
              <Card variant="borderless" style={{ borderRadius: "20px", textAlign: "center", padding: "50px 20px" }}>
                <Empty description="No transactions found on your account. Activate a membership plan to unlock candidate contacts." />
                <Button
                  type="primary"
                  onClick={() => switchTab("plans")}
                  style={{ marginTop: "16px", borderRadius: "16px" }}
                >
                  View Membership Plans
                </Button>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {paginatedTxns.map((txn, idx) => {
                  const txnId = txn.id || `TXN-${1000 + idx}`;
                  const planName = txn.Plan || txn.plan || "Membership Recharge";
                  const amount = txn.Amount || txn.amount || 0;
                  const date = formatDate(txn.Create_date || txn.created_at) || "Recent";
                  const status = txn.status || "Success";

                  return (
                    <div
                      key={txn.id || idx}
                      style={{
                        background: "#ffffff",
                        borderRadius: "18px",
                        padding: "18px 22px",
                        border: "1px solid #f1f5f9",
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "14px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "14px",
                            background: status.toLowerCase() === "success" ? "#ecfdf5" : "#fff1f2",
                            color: status.toLowerCase() === "success" ? "#059669" : "#e11d48",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                          }}
                        >
                          💳
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>
                              {planName}
                            </h4>
                            <Tag
                              color={status.toLowerCase() === "success" ? "success" : "error"}
                              style={{ borderRadius: "10px", fontWeight: "700" }}
                            >
                              {status}
                            </Tag>
                          </div>
                          <div style={{ color: "#64748b", fontSize: "12.5px", marginTop: "3px" }}>
                            Ref: #{txnId} • Date: {date}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "18px", fontWeight: "900", color: "#1e293b" }}>
                            ₹{amount}
                          </div>
                          <div style={{ fontSize: "11px", color: "#059669", fontWeight: "700" }}>
                            Online Payment
                          </div>
                        </div>

                        <Button
                          icon={<FileTextOutlined />}
                          onClick={() => {
                            setSelectedTxn(txn);
                            setIsReceiptOpen(true);
                          }}
                          style={{ borderRadius: "12px", fontWeight: "700" }}
                        >
                          Invoice
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {transactionsList.length > transactionsPageSize && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
                    <Pagination
                      current={transactionsPage}
                      pageSize={transactionsPageSize}
                      total={transactionsList.length}
                      pageSizeOptions={["10", "15"]}
                      showSizeChanger
                      showTotal={(total, range) => `Showing ${range[0]}-${range[1]} of ${total} Transactions`}
                      onChange={(page, pageSize) => {
                        setTransactionsPage(page);
                        setTransactionsPageSize(pageSize);
                      }}
                      style={{
                        background: "#ffffff",
                        padding: "10px 20px",
                        borderRadius: "14px",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
                        border: "1px solid #f1f5f9",
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB E: SHORTLISTED PROFILES (Wish_List Model) */}
        {/* ============================================================ */}
        {activeTab === "shortlist" && (
          <div>
            <div
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)",
                borderRadius: "22px",
                padding: "24px 28px",
                border: "1.5px solid rgba(225, 29, 72, 0.15)",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: "900",
                  color: "#881337",
                }}
              >
                ❤️ Your Shortlisted Profiles
              </h2>
              <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "14px" }}>
                Profiles you have shortlisted for quick contact and review.
              </p>
            </div>

            {!hasCompletedProfile ? (
              <Card
                variant="borderless"
                style={{
                  borderRadius: "24px",
                  padding: "60px 24px",
                  textAlign: "center",
                  border: "2px dashed #fecdd3",
                  background: "#ffffff",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.04)",
                  margin: "16px 0",
                }}
              >
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>🔒</div>
                <h2 style={{ color: "#881337", fontWeight: "900", fontSize: "24px", margin: "0 0 12px" }}>
                  Complete Your Profile to View Shortlisted Profiles
                </h2>
                <p style={{ color: "#64748b", maxWidth: "580px", margin: "0 auto 24px", fontSize: "15px", lineHeight: "1.6" }}>
                  Adding your matrimonial biodata is required before shortlisting candidates and viewing partner connections.
                </p>
                <Button
                  type="primary"
                  size="large"
                  icon={<EditOutlined />}
                  onClick={() => switchTab("edit")}
                  style={{
                    height: "48px",
                    padding: "0 36px",
                    borderRadius: "24px",
                    fontWeight: "800",
                    fontSize: "15px",
                    background: "linear-gradient(135deg, #e11d48, #be123c)",
                    boxShadow: "0 8px 24px rgba(225, 29, 72, 0.35)",
                  }}
                >
                  Complete Profile / Add Biodata
                </Button>
              </Card>
            ) : shortlistedCandidates.length === 0 ? (
              <Card variant="borderless" style={{ borderRadius: "20px", textAlign: "center", padding: "50px 20px" }}>
                <Empty description="You have not shortlisted any profiles yet. Browse Caste Matches or Search to send a profile request." />
                <Button
                  type="primary"
                  onClick={() => switchTab("matches")}
                  style={{ marginTop: "16px", borderRadius: "16px" }}
                >
                  Explore Matches
                </Button>
              </Card>
            ) : (
              <>
                <Row gutter={[20, 24]}>
                  {paginatedShortlist.map((cand) => renderCandidateCard(cand))}
                </Row>
                {shortlistedCandidates.length > shortlistPageSize && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "32px", marginBottom: "16px" }}>
                    <Pagination
                      current={shortlistPage}
                      pageSize={shortlistPageSize}
                      total={shortlistedCandidates.length}
                      pageSizeOptions={["10", "12", "15"]}
                      showSizeChanger
                      showTotal={(total, range) => `Showing ${range[0]}-${range[1]} of ${total} Shortlisted Profiles (10-15 per page)`}
                      onChange={(page, pageSize) => {
                        setShortlistPage(page);
                        setShortlistPageSize(pageSize);
                        window.scrollTo({ top: 320, behavior: "smooth" });
                      }}
                      style={{
                        background: "#ffffff",
                        padding: "12px 24px",
                        borderRadius: "16px",
                        boxShadow: "0 4px 20px rgba(225, 29, 72, 0.08)",
                        border: "1.5px solid #ffe4e6",
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB F: RECEIVED PROFILE REQUESTS */}
        {/* ============================================================ */}
        {activeTab === "requests" && (
          <div>
            <div
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
                borderRadius: "22px",
                padding: "20px 24px",
                border: "1.5px solid rgba(59, 130, 246, 0.16)",
                marginBottom: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "900", color: "#1d4ed8" }}>
                  Profile Requests
                </h2>
                <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "14px" }}>
                  Review incoming connection requests. Approve a profile to unlock their contact number.
                </p>
              </div>
              <Button
                icon={<ReloadOutlined />}
                onClick={Get}
                style={{ borderRadius: "16px", fontWeight: "700", height: "38px" }}
              >
                Refresh
              </Button>
            </div>

            {!hasCompletedProfile ? (
              <Card
                variant="borderless"
                style={{
                  borderRadius: "24px",
                  padding: "60px 24px",
                  textAlign: "center",
                  border: "2px dashed #bfdbfe",
                  background: "#ffffff",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.04)",
                  margin: "16px 0",
                }}
              >
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>🔒</div>
                <h2 style={{ color: "#1d4ed8", fontWeight: "900", fontSize: "24px", margin: "0 0 12px" }}>
                  Complete Your Profile to Manage Partner Requests
                </h2>
                <p style={{ color: "#64748b", maxWidth: "580px", margin: "0 auto 24px", fontSize: "15px", lineHeight: "1.6" }}>
                  Adding your matrimonial biodata is required before sending or approving connection requests.
                </p>
                <Button
                  type="primary"
                  size="large"
                  icon={<EditOutlined />}
                  onClick={() => switchTab("edit")}
                  style={{
                    height: "48px",
                    padding: "0 36px",
                    borderRadius: "24px",
                    fontWeight: "800",
                    fontSize: "15px",
                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    boxShadow: "0 8px 24px rgba(37, 99, 235, 0.35)",
                  }}
                >
                  Complete Profile / Add Biodata
                </Button>
              </Card>
            ) : incomingRequestCandidates.length === 0 ? (
              <Card variant="borderless" style={{ borderRadius: "20px", textAlign: "center", padding: "50px 20px" }}>
                <Empty description="You have no pending profile requests." />
              </Card>
            ) : (
              <>
                <Row gutter={[20, 24]}>
                  {paginatedIncomingRequests.map((cand) =>
                    renderCandidateCard(cand, {
                      hideShortlist: true,
                      requestActions: (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleWishlistResponse(cand.wishlistId, "Approved")}
                            style={{ flex: 1, borderRadius: "12px", background: "#059669" }}
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleWishlistResponse(cand.wishlistId, "Rejected")}
                            style={{ flex: 1, borderRadius: "12px", color: "#b91c1c", borderColor: "#fecaca" }}
                          >
                            Decline
                          </Button>
                        </div>
                      ),
                    })
                  )}
                </Row>
                {incomingRequestCandidates.length > requestsPageSize && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "32px", marginBottom: "16px" }}>
                    <Pagination
                      current={requestsPage}
                      pageSize={requestsPageSize}
                      total={incomingRequestCandidates.length}
                      pageSizeOptions={["10", "12", "15"]}
                      showSizeChanger
                      showTotal={(total, range) => `Showing ${range[0]}-${range[1]} of ${total} Requests`}
                      onChange={(page, pageSize) => {
                        setRequestsPage(page);
                        setRequestsPageSize(pageSize);
                        window.scrollTo({ top: 320, behavior: "smooth" });
                      }}
                      style={{
                        background: "#ffffff",
                        padding: "12px 24px",
                        borderRadius: "16px",
                        boxShadow: "0 4px 20px rgba(59, 130, 246, 0.08)",
                        border: "1.5px solid #dbeafe",
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB G: APPROVED MATCHES */}
        {/* ============================================================ */}
        {activeTab === "approved" && (
          <div>
            <div
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)",
                borderRadius: "22px",
                padding: "20px 24px",
                border: "1.5px solid rgba(5, 150, 105, 0.18)",
                marginBottom: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "900", color: "#047857" }}>
                  <CheckCircleOutlined /> Approved Matches
                </h2>
                <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "14px" }}>
                  These are the profiles connected after a partner approved the request.
                </p>
              </div>
              <Button
                icon={<ReloadOutlined />}
                onClick={Get}
                style={{ borderRadius: "16px", fontWeight: "700", height: "38px" }}
              >
                Refresh
              </Button>
            </div>

            {!hasCompletedProfile ? (
              <Card
                variant="borderless"
                style={{
                  borderRadius: "24px",
                  padding: "60px 24px",
                  textAlign: "center",
                  border: "2px dashed #a7f3d0",
                  background: "#ffffff",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.04)",
                  margin: "16px 0",
                }}
              >
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>🔒</div>
                <h2 style={{ color: "#047857", fontWeight: "900", fontSize: "24px", margin: "0 0 12px" }}>
                  Complete Your Profile to View Approved Matches
                </h2>
                <p style={{ color: "#64748b", maxWidth: "580px", margin: "0 auto 24px", fontSize: "15px", lineHeight: "1.6" }}>
                  Adding your matrimonial biodata is required before accessing approved partner profiles.
                </p>
                <Button
                  type="primary"
                  size="large"
                  icon={<EditOutlined />}
                  onClick={() => switchTab("edit")}
                  style={{
                    height: "48px",
                    padding: "0 36px",
                    borderRadius: "24px",
                    fontWeight: "800",
                    fontSize: "15px",
                    background: "linear-gradient(135deg, #059669, #047857)",
                    boxShadow: "0 8px 24px rgba(5, 150, 105, 0.35)",
                  }}
                >
                  Complete Profile / Add Biodata
                </Button>
              </Card>
            ) : approvedCandidates.length === 0 ? (
              <Card variant="borderless" style={{ borderRadius: "20px", textAlign: "center", padding: "50px 20px" }}>
                <Empty description="No profile request has been approved yet." />
              </Card>
            ) : (
              <>
                <Row gutter={[20, 24]}>
                  {paginatedApproved.map((cand) => {
                    const candId = cand.User_id || cand.id;
                    const reqId =
                      cand.wishlistId ||
                      (Array.isArray(approvedWishlistItems)
                        ? approvedWishlistItems.find(
                            (item) =>
                              String(item.User_id || item.user_id) === String(candId) ||
                              String(item.Wish_User_id || item.wish_user_id) === String(candId)
                          )?.id
                        : null);

                    return renderCandidateCard(cand, {
                      hideShortlist: false,
                      requestActions: (
                        <Button
                          danger
                          icon={<CloseCircleOutlined />}
                          onClick={() =>
                            handleDisapprove(
                              reqId,
                              cand.firstname || cand.Full_Name || cand.first_name || "Partner"
                            )
                          }
                          style={{
                            width: "100%",
                            borderRadius: "12px",
                            fontWeight: "700",
                            background: "#fff1f2",
                            borderColor: "#fecaca",
                            color: "#be123c",
                            height: "38px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          Remove from Approval
                        </Button>
                      ),
                    });
                  })}
                </Row>
                {approvedCandidates.length > approvedPageSize && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "32px", marginBottom: "16px" }}>
                    <Pagination
                      current={approvedPage}
                      pageSize={approvedPageSize}
                      total={approvedCandidates.length}
                      pageSizeOptions={["10", "12", "15"]}
                      showSizeChanger
                      showTotal={(total, range) => `Showing ${range[0]}-${range[1]} of ${total} Approved Profiles (10-15 per page)`}
                      onChange={(page, pageSize) => {
                        setApprovedPage(page);
                        setApprovedPageSize(pageSize);
                        window.scrollTo({ top: 320, behavior: "smooth" });
                      }}
                      style={{
                        background: "#ffffff",
                        padding: "12px 24px",
                        borderRadius: "16px",
                        boxShadow: "0 4px 20px rgba(5, 150, 105, 0.08)",
                        border: "1.5px solid #a7f3d0",
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB F: SELF PROFILE VIEW (Full Showroom with Completion Score) */}
        {/* ============================================================ */}
        {activeTab === "profile" && (
          <div>
            {/* Hero Profile Card (Mobile-Optimized) */}
            <Card
              variant="borderless"
              className="up-profile-hero-card"
              styles={{ body: { padding: "20px" } }}
            >
              <div className="up-profile-hero-top" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                <div className="up-profile-identity-wrap" style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <div
                    className="up-profile-avatar-box"
                    style={{
                      position: "relative",
                      width: "84px",
                      height: "84px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "3px solid #e11d48",
                      boxShadow: "0 6px 20px rgba(225, 29, 72, 0.22)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#fff1f2",
                      flexShrink: 0,
                    }}
                  >
                    <Image
                      src={avatarUrl}
                      alt="Avatar"
                      width={84}
                      height={84}
                      style={{ width: "84px", height: "84px", objectFit: "cover", objectPosition: "center top", borderRadius: "50%", cursor: "pointer" }}
                      preview={{
                        mask: (
                          <div style={{ fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", gap: 3, color: "#ffffff" }}>
                            <EyeOutlined /> View
                          </div>
                        ),
                      }}
                      fallback="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
                    />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "900", color: "#881337", lineHeight: 1.2 }}>
                        {user.firstname || user.Full_Name || "Member Profile"}
                      </h2>
                      <Tag color="magenta" style={{ borderRadius: "14px", fontWeight: "800", margin: 0, fontSize: 11 }}>
                        {user.gender || user.Gender || "Candidate"}
                      </Tag>
                    </div>

                    <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "600", marginTop: "4px" }}>
                      {user.caste ? `${user.caste} • ` : ""}
                      {user.city || user.district || "India"}
                      {user.dob ? ` • Age: ${user.age || user.Age || "—"} yrs` : ""}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                      <Tag color="volcano" style={{ borderRadius: "6px", fontWeight: "800", margin: 0, fontSize: 11 }}>
                        ID: #{user_id}
                      </Tag>
                      <Tag
                        color={isProfileActive ? "green" : "red"}
                        style={{ borderRadius: "6px", fontWeight: "800", margin: 0, fontSize: 11 }}
                      >
                        {isProfileActive ? "🟢 Active Biodata" : "🔴 Deactivated"}
                      </Tag>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons (Structured & Tap-Friendly on Mobile) */}
                <div className="up-profile-quick-actions">
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => switchTab("edit")}
                    style={{
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, #e11d48, #be123c)",
                      fontWeight: "700",
                      height: "40px",
                      boxShadow: "0 4px 12px rgba(225, 29, 72, 0.2)",
                    }}
                  >
                    Edit Profile &amp; Photos
                  </Button>

                  <Button
                    icon={<IdcardOutlined />}
                    onClick={() => {
                      setSelectedMatch({ ...user, id: user_id, User_id: user_id });
                      setIsBiodataOpen(true);
                    }}
                    style={{
                      borderRadius: "14px",
                      borderColor: "#fda4af",
                      color: "#be123c",
                      background: "#fff1f2",
                      fontWeight: "700",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 8px rgba(225, 29, 72, 0.08)",
                    }}
                  >
                    Preview Biodata
                  </Button>

                  <Button
                    className="up-full-btn"
                    onClick={() => setIsStatusModalOpen(true)}
                    style={{
                      borderRadius: "14px",
                      fontWeight: "700",
                      height: "40px",
                      borderColor: isProfileActive ? "#86efac" : "#fca5a5",
                      color: isProfileActive ? "#15803d" : "#b91c1c",
                      background: isProfileActive ? "#f0fdf4" : "#fef2f2",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>{isProfileActive ? "🟢" : "🔴"}</span>
                    {isProfileActive ? "Active (Change)" : "Deactivated (Activate)"}
                  </Button>
                </div>
              </div>

              {/* Mobile Quick Summary Stats Bar */}
              <div className="up-profile-quick-stats">
                <div className="up-profile-stat-box">
                  <span className="up-profile-stat-label">Age</span>
                  <span className="up-profile-stat-val">{user.age || user.Age || "—"} yrs</span>
                </div>
                <div className="up-profile-stat-box">
                  <span className="up-profile-stat-label">Height</span>
                  <span className="up-profile-stat-val">{user.height || user.Height ? `${user.height || user.Height} cm` : "—"}</span>
                </div>
                <div className="up-profile-stat-box">
                  <span className="up-profile-stat-label">Caste</span>
                  <span className="up-profile-stat-val">{user.caste || user.Caste || "—"}</span>
                </div>
                <div className="up-profile-stat-box">
                  <span className="up-profile-stat-label">Native / City</span>
                  <span className="up-profile-stat-val">{user.city || user.City || user.district || "India"}</span>
                </div>
              </div>

              {/* Completion Progress Strip */}
              <div
                style={{
                  marginTop: "18px",
                  padding: "14px 16px",
                  background: "#fff1f2",
                  borderRadius: "16px",
                  border: "1px dashed #fecdd3",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontWeight: "800", color: "#881337", fontSize: "13px" }}>
                    Profile Completeness Score
                  </span>
                  <span style={{ fontWeight: "900", color: "#be123c", fontSize: "13.5px" }}>
                    {completionPercentage}% Complete
                  </span>
                </div>
                <Progress
                  percent={completionPercentage}
                  strokeColor={{ "0%": "#f43f5e", "100%": "#e11d48" }}
                  showInfo={false}
                />
                <div style={{ fontSize: "11.5px", color: "#9f1239", marginTop: "6px", fontWeight: "600" }}>
                  {completionPercentage < 100
                    ? "💡 Complete career, family, and astrological details for genuine match responses."
                    : "🌟 Your profile is 100% complete and highly visible to potential life partners!"}
                </div>
              </div>
            </Card>

            {/* Mobile Category Navigation Pills Bar */}
            <div className="up-profile-tabs-bar">
              {[
                { key: "all", label: "🌟 All Sections" },
                { key: "personal", label: "👤 Personal" },
                { key: "community", label: "🕉️ Community" },
                { key: "career", label: "💼 Career" },
                { key: "family", label: "👨‍👩‍👦 Family" },
                { key: "contact", label: "📍 Contact" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`up-profile-tab-pill ${activeProfileSection === tab.key ? "active" : ""}`}
                  onClick={() => setActiveProfileSection(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Profile Field Details Grid (Structured, Responsive Cards) */}
            <Row gutter={[16, 16]}>
              {/* Section 1: Basic & Personal */}
              {(activeProfileSection === "all" || activeProfileSection === "personal") && (
                <Col xs={24} md={12}>
                  <Card
                    title={
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#881337", fontWeight: "800", fontSize: "14px" }}>👤 Personal &amp; Basic Details</span>
                        <Button type="link" size="small" onClick={() => switchTab("edit")} style={{ padding: 0, color: "#e11d48", fontWeight: 700, fontSize: "12px" }}>
                          Edit &gt;
                        </Button>
                      </div>
                    }
                    variant="borderless"
                    className="up-profile-section-card"
                    styles={{ body: { padding: "14px 18px" } }}
                  >
                    {[
                      ["Full Name", user.firstname || user.Full_Name],
                      ["Gender", user.gender || user.Gender],
                      ["Date of Birth", formatDate(user.dob || user.DOB)],
                      ["Age", user.age || user.Age ? `${user.age || user.Age} yrs` : null],
                      ["Marital Status", user.marrige_status || user.Marrige_status || "Never Married"],
                      ["Height", user.height || user.Height ? `${user.height || user.Height} cm` : null],
                      ["Weight", user.weight || user.Weight ? `${user.weight || user.Weight} kg` : null],
                      ["Complexion (रंग / वर्ण)", user.color || user.Color],
                      ["Mother Tongue", user.mother_tongue || user.Mother_tongue || "Hindi"],
                      ["Physical Disability", user.disability || user.Disability ? "Yes (दिव्यांग)" : "Normal (सामान्य)"],
                    ].map(([label, val]) => (
                      <div key={label} className="up-profile-field-row">
                        <span className="up-profile-field-label">{label}:</span>
                        <span className="up-profile-field-value">{val || "—"}</span>
                      </div>
                    ))}
                  </Card>
                </Col>
              )}

              {/* Section 2: Religion & Astrological */}
              {(activeProfileSection === "all" || activeProfileSection === "community") && (
                <Col xs={24} md={12}>
                  <Card
                    title={
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#881337", fontWeight: "800", fontSize: "14px" }}>🕉️ Community &amp; Horoscope</span>
                        <Button type="link" size="small" onClick={() => switchTab("edit")} style={{ padding: 0, color: "#e11d48", fontWeight: 700, fontSize: "12px" }}>
                          Edit &gt;
                        </Button>
                      </div>
                    }
                    variant="borderless"
                    className="up-profile-section-card"
                    styles={{ body: { padding: "14px 18px" } }}
                  >
                    {[
                      ["Religion", user.religion || user.Religion || "Hindu"],
                      ["Caste", user.caste || user.Caste],
                      ["Gotra (गोत्र)", user.gotra || user.Gotra],
                      ["Manglik Status", user.manglik || user.Manglik ? "🔴 Manglik (मांगलिक)" : "🟢 Non-Manglik"],
                      ["Diet Preference", user.vegeterian || user.Vegeterian || "Vegetarian"],
                      ["House Ownership", user.house || user.House || "Self Owned"],
                    ].map(([label, val]) => (
                      <div key={label} className="up-profile-field-row">
                        <span className="up-profile-field-label">{label}:</span>
                        <span className="up-profile-field-value">{val || "—"}</span>
                      </div>
                    ))}
                  </Card>
                </Col>
              )}

              {/* Section 3: Education & Career */}
              {(activeProfileSection === "all" || activeProfileSection === "career") && (
                <Col xs={24} md={12}>
                  <Card
                    title={
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#881337", fontWeight: "800", fontSize: "14px" }}>💼 Education &amp; Career</span>
                        <Button type="link" size="small" onClick={() => switchTab("edit")} style={{ padding: 0, color: "#e11d48", fontWeight: 700, fontSize: "12px" }}>
                          Edit &gt;
                        </Button>
                      </div>
                    }
                    variant="borderless"
                    className="up-profile-section-card"
                    styles={{ body: { padding: "14px 18px" } }}
                  >
                    {[
                      ["Highest Education", user.qualification || user.Qualification || user.course],
                      ["Profession / Job", user.profession || user.Profession || user.job_title],
                      ["Employment Type", user.job_type || user.Job_type || "Private Sector"],
                      ["Monthly Income", (user.job_type === "Not Working" || user.Job_type === "Not Working") ? "Not Applicable" : (user.salary || user.Salary ? `₹${Number(user.salary || user.Salary).toLocaleString("en-IN")}/mo` : "Confidential")],
                    ].map(([label, val]) => (
                      <div key={label} className="up-profile-field-row">
                        <span className="up-profile-field-label">{label}:</span>
                        <span className="up-profile-field-value">{val || "—"}</span>
                      </div>
                    ))}
                  </Card>
                </Col>
              )}

              {/* Section 4: Family Details */}
              {(activeProfileSection === "all" || activeProfileSection === "family") && (
                <Col xs={24} md={12}>
                  <Card
                    title={
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#881337", fontWeight: "800", fontSize: "14px" }}>👨‍👩‍👦 Family Background</span>
                        <Button type="link" size="small" onClick={() => switchTab("edit")} style={{ padding: 0, color: "#e11d48", fontWeight: 700, fontSize: "12px" }}>
                          Edit &gt;
                        </Button>
                      </div>
                    }
                    variant="borderless"
                    className="up-profile-section-card"
                    styles={{ body: { padding: "14px 18px" } }}
                  >
                    {[
                      ["Father's Name", user.father_name || user.Father_name],
                      ["Father's Age", user.father_age || user.Father_Age ? `${user.father_age || user.Father_Age} yrs` : null],
                      ["Father's Profession", user.father_profession || user.Father_Profession],
                      ["Mother's Name", user.mother_name || user.Mother_name],
                      ["Mother's Age", user.mother_age || user.Mother_Age ? `${user.mother_age || user.Mother_Age} yrs` : null],
                      ["Mother's Profession", user.mother_profession || user.Mother_Profession],
                      ["Brothers", `${user.brothers || user.Brothers || "0"} (Married: ${user.brothers_marrige || user.Brothers_marrige || "0"})`],
                      ["Sisters", `${user.sisters || user.Sisters || "0"} (Married: ${user.sisters_marrige || user.Sisters_marrige || "0"})`],
                    ].map(([label, val]) => (
                      <div key={label} className="up-profile-field-row">
                        <span className="up-profile-field-label">{label}:</span>
                        <span className="up-profile-field-value">{val || "—"}</span>
                      </div>
                    ))}
                  </Card>
                </Col>
              )}

              {/* Section 5: Location & Contact */}
              {(activeProfileSection === "all" || activeProfileSection === "contact") && (
                <Col xs={24} md={activeProfileSection === "contact" ? 24 : 12}>
                  <Card
                    title={
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#881337", fontWeight: "800", fontSize: "14px" }}>📍 Location &amp; Contact Details</span>
                        <Button type="link" size="small" onClick={() => switchTab("edit")} style={{ padding: 0, color: "#e11d48", fontWeight: 700, fontSize: "12px" }}>
                          Edit &gt;
                        </Button>
                      </div>
                    }
                    variant="borderless"
                    className="up-profile-section-card"
                    styles={{ body: { padding: "14px 18px" } }}
                  >
                    <div className="up-profile-field-row">
                      <span className="up-profile-field-label">State &amp; District:</span>
                      <span className="up-profile-field-value">{user.state || user.State || "—"}, {user.district || user.District || "—"}</span>
                    </div>

                    <div className="up-profile-field-row">
                      <span className="up-profile-field-label">City / Native:</span>
                      <span className="up-profile-field-value">{user.city || user.City || "—"}</span>
                    </div>

                    <div className="up-profile-field-row">
                      <span className="up-profile-field-label">Full Address:</span>
                      <span className="up-profile-field-value">{user.full_address || user.Full_Address || "—"}</span>
                    </div>

                    <div className="up-profile-field-row">
                      <span className="up-profile-field-label">WhatsApp Contact:</span>
                      <div style={{ textAlign: "right" }}>
                        {(() => {
                          const ph = user.contact || user.WP_Contact;
                          const info = getContactRelationDisplay(
                            user.wp_contact_relation || user.WP_Contact_Relation,
                            user.wp_contact_name || user.Wp_Contact_Name,
                            ph,
                            user.Full_Name || user.firstname,
                            user.father_name || user.Father_name,
                            user.mother_name || user.Mother_name
                          );
                          return ph ? (
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                                <strong style={{ color: "#059669" }}>+91 {ph}</strong>
                                <a
                                  href={`https://wa.me/91${ph.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "#25d366", fontSize: "14px" }}
                                  title="Chat on WhatsApp"
                                >
                                  <WhatsAppOutlined />
                                </a>
                              </div>
                              <Tag color={info.relation === "Self" ? "green" : "blue"} style={{ margin: "2px 0 0", borderRadius: 4, fontSize: 10 }}>
                                {info.relationLabel}
                              </Tag>
                            </div>
                          ) : (
                            <span>—</span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="up-profile-field-row">
                      <span className="up-profile-field-label">Alternate Contact:</span>
                      <div style={{ textAlign: "right" }}>
                        {(() => {
                          const altPh = user.alt_contact || user.Alt_Contact;
                          const altInfo = getContactRelationDisplay(
                            user.alt_contact_relation || user.Alt_Contact_Relation,
                            user.alt_contact_name || user.Alt_Contact_Name,
                            altPh,
                            user.Full_Name || user.firstname,
                            user.father_name || user.Father_name,
                            user.mother_name || user.Mother_name
                          );
                          return altPh ? (
                            <div>
                              <strong style={{ color: "#0284c7" }}>+91 {altPh}</strong>
                              <Tag color="cyan" style={{ margin: "2px 0 0 6px", borderRadius: 4, fontSize: 10 }}>
                                {altInfo.relationLabel}
                              </Tag>
                            </div>
                          ) : (
                            <span>—</span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="up-profile-field-row">
                      <span className="up-profile-field-label">Email Address:</span>
                      <span className="up-profile-field-value">{user.email || user.Email || "—"}</span>
                    </div>
                  </Card>
                </Col>
              )}
            </Row>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB G: EDIT PROFILE (Extra Options & Dynamic Backend Models) */}
        {/* ============================================================ */}
        {activeTab === "edit" && (
          <Spin spinning={isLoading} tip="Saving changes to database...">
            <Card variant="borderless" className="up-edit-card">
              <div className="up-edit-header">
                <div className="up-edit-title-wrap">
                  <h2>✏️ Edit Matrimonial Profile</h2>
                  <p>Keep your profile details up to date to get verified partner matches.</p>
                </div>

                <div className="up-edit-header-actions">
                  <Button onClick={() => switchTab("profile")} style={{ borderRadius: "12px" }}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    form="profileEditForm"
                    loading={isLoading}
                    icon={<CheckCircleOutlined />}
                    style={{
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #e11d48, #be123c)",
                      fontWeight: "700",
                      boxShadow: "0 4px 14px rgba(225, 29, 72, 0.25)",
                    }}
                  >
                    Save Profile
                  </Button>
                </div>
              </div>

              {/* Profile Visibility & Status Banner */}
              <div className={`up-edit-status-box ${isProfileActive ? "up-edit-status-active" : "up-edit-status-inactive"}`}>
                <div className="up-edit-status-info">
                  <span className="up-edit-status-dot">{isProfileActive ? "🟢" : "🔴"}</span>
                  <div>
                    <div className="up-edit-status-title" style={{ color: isProfileActive ? "#166534" : "#991b1b" }}>
                      Profile Status: {isProfileActive ? "Active (Visible)" : "Deactivated (Hidden)"}
                    </div>
                    <div className="up-edit-status-sub" style={{ color: isProfileActive ? "#15803d" : "#b91c1c" }}>
                      {isProfileActive
                        ? "Visible to eligible candidates in searches and matches."
                        : "Hidden from other members. Your biodata will not appear in searches."}
                    </div>
                  </div>
                </div>

                <Switch
                  checked={isProfileActive}
                  loading={statusToggleLoading}
                  onChange={() => {
                    if (hasCompletedProfile) {
                      setIsStatusModalOpen(true);
                    } else {
                      message.warning("Please complete your profile details first before changing visibility status.");
                    }
                  }}
                  checkedChildren="Active"
                  unCheckedChildren="Hidden"
                />
              </div>

              {/* Photo Upload Box */}
              <div className="up-edit-photo-box">
                <div className="up-edit-avatar-wrap">
                  <img src={avatarUrl} alt="Avatar" className="up-edit-avatar-img" />
                </div>
                <div className="up-edit-photo-info">
                  <h4>Profile Photo</h4>
                  <p>Upload a recent portrait photo for authentic verification.</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <Upload
                      beforeUpload={(file) => {
                        setFile(file);
                        return false;
                      }}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button icon={<UploadOutlined />} style={{ borderRadius: "12px", height: "36px", fontSize: "13px" }}>
                        Choose Photo
                      </Button>
                    </Upload>
                    {file && (
                      <Tag color="success" style={{ margin: 0, borderRadius: "8px" }}>
                        ✓ {file.name}
                      </Tag>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <Form
                id="profileEditForm"
                form={form}
                layout="vertical"
                className="up-edit-form"
                onFinish={handleProfileSave}
                onFinishFailed={(errorInfo) => {
                  message.error("Please fill all required fields highlighted in red.");
                  if (errorInfo.errorFields.length > 0) {
                    form.scrollToField(errorInfo.errorFields[0].name, { behavior: "smooth", block: "center" });
                  }
                }}
                scrollToFirstError={{ behavior: "smooth", block: "center" }}
              >
                {/* 1. Identity & Astrological Details */}
                <div className="up-edit-section-heading">
                  👤 1. Identity & Astrological Details (व्यक्तिगत एवं जन्म विवरण)
                </div>
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="firstname" label="Full Name (पूरा नाम)" rules={[{ required: true, message: "Full Name is required" }]}>
                      <Input placeholder="Enter your full name" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item name="gender" label="Gender (वर / वधू)" rules={[{ required: true, message: "Gender is required" }]}>
                      <Select placeholder="Select gender">
                        <Option value="Male">Male (वर)</Option>
                        <Option value="Female">Female (वधू)</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item name="dob" label="Date of Birth (जन्म तिथि)" rules={[{ required: true, message: "Date of Birth is required" }]}>
                      <Input type="date" onChange={(e) => handleDobChange(e.target.value)} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item name="age" label="Age in Years (आयु)" tooltip="Auto-calculated from Date of Birth">
                      <Input type="number" placeholder="Auto-calculated from DOB" style={{ background: "#f8fafc" }} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item name="marrige_status" label="Marital Status (वैवाहिक स्थिति)" initialValue="Unmarried">
                      <Select placeholder="Select marital status">
                        <Option value="Unmarried">Never Married / Unmarried</Option>
                        <Option value="Divorced">Divorced</Option>
                        <Option value="Widowed">Widowed</Option>
                        <Option value="Awaiting Divorce">Awaiting Divorce</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item name="mother_tongue" label="Mother Tongue (मातृभाषा)">
                      <Select
                        placeholder="Select mother tongue"
                        showSearch
                        filterOption={(input, option) =>
                          String(option?.children || "").toLowerCase().includes(input.toLowerCase())
                        }
                      >
                        {languagesList.map((lang, idx) => (
                          <Option key={idx} value={lang}>{lang}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item name="manglik" label="Manglik Status (मांगलिक दोष)">
                      <Select placeholder="Select Manglik status">
                        <Option value={false}>Non-Manglik</Option>
                        <Option value={true}>Manglik</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {/* 2. State, Religion & Community */}
                <div className="up-edit-section-heading">
                  🕉️ 2. State, Religion & Community (राज्य, धर्म एवं जाति)
                </div>

                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12} md={6}>
                    <Form.Item name="state" label="State (गृह राज्य)" rules={[{ required: true, message: "State is required" }]}>
                      <Select
                        placeholder="Select State"
                        showSearch
                        onChange={handleFormStateChange}
                        filterOption={(input, option) =>
                          String(option?.children || "").toLowerCase().includes(input.toLowerCase())
                        }
                      >
                        {statesList.map((s, idx) => {
                          const sName = s.state || s.State;
                          return <Option key={idx} value={sName}>{sName}</Option>;
                        })}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} md={6}>
                    <Form.Item name="religion" label="Religion (धर्म)" rules={[{ required: true, message: "Religion is required" }]} initialValue="Hindu">
                      <Select
                        placeholder="Select Religion"
                        showSearch
                        onChange={handleFormReligionChange}
                        filterOption={(input, option) =>
                          String(option?.children || "").toLowerCase().includes(input.toLowerCase())
                        }
                      >
                        {religionsList.map((r, idx) => (
                          <Option key={idx} value={r}>{r}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} md={6}>
                    <Form.Item
                      name="caste"
                      label="Caste / Community (जाति)"
                      rules={[{ required: true, message: "Caste is required" }]}
                    >
                      <Input
                        readOnly
                        placeholder="Registered Caste"
                        style={{
                          background: "#f8fafc",
                          color: "#1e293b",
                          fontWeight: "700",
                          border: "1.5px solid #e2e8f0",
                          cursor: "not-allowed",
                        }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} md={6}>
                    <Form.Item name="gotra" label="Gotra (गोत्र)">
                      <Input placeholder="Enter Gotra (e.g. Kashyap)" />
                    </Form.Item>
                  </Col>
                </Row>

                {/* 3. Education, Career & Income */}
                <div className="up-edit-section-heading">
                  💼 3. Education, Career & Income (शिक्षा, व्यवसाय एवं आय)
                </div>
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="qualification" label="Highest Qualification (उच्चतम शिक्षा)">
                      <Input placeholder="e.g. B.Tech, MBA, MBBS, MCA, B.Com, M.Sc" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item name="profession" label="Profession / Job Title (व्यवसाय / पद)">
                      <AutoComplete
                        options={professionsList.map((p) => ({ value: p }))}
                        filterOption={(input, option) =>
                          String(option?.value || "").toLowerCase().includes(input.toLowerCase())
                        }
                        placeholder="Select or enter your profession"
                        style={{ width: "100%" }}
                      >
                        <Input />
                      </AutoComplete>
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={formJobType === "Not Working" ? 24 : 12}>
                    <Form.Item name="job_type" label="Employment Sector (रोजगार का प्रकार)">
                      <Select placeholder="Select Sector" onChange={handleJobTypeChange}>
                        <Option value="Private">Private Company</Option>
                        <Option value="Government">Government / PSU</Option>
                        <Option value="Business">Self Employed / Business</Option>
                        <Option value="Not Working">Not Working</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  {formJobType !== "Not Working" && (
                    <Col xs={24} sm={12}>
                      <Form.Item name="salary" label="Monthly In-Hand Salary (मासिक आय ₹ में)">
                        <Input type="number" placeholder="e.g. 75000" />
                      </Form.Item>
                    </Col>
                  )}
                </Row>

                {/* 4. Physical Attributes & Lifestyle */}
                <div className="up-edit-section-heading">
                  🩺 4. Physical Attributes & Lifestyle (शारीरिक विवरण एवं जीवनशैली)
                </div>
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="height" label="Height (ऊंचाई - in cm)">
                      <Input type="number" placeholder="e.g. 172" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="weight" label="Weight (वजन - in kg)">
                      <Input type="number" placeholder="e.g. 68" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="color" label="Complexion (रंग / वर्ण)">
                      <Select placeholder="Select Complexion" allowClear showSearch>
                        {colorsList.map((c, idx) => (
                          <Option key={idx} value={c.value || c}>{c.label || c}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="disability" label="Physical Disability (शारीरिक स्थिति)" initialValue={false}>
                      <Select placeholder="Select disability status">
                        <Option value={false}>None / Normal (सामान्य)</Option>
                        <Option value={true}>Yes / Differently Abled (दिव्यांग)</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="vegeterian" label="Diet Preference (खान-पान)" initialValue="Vegeterian">
                      <Select placeholder="Select Diet">
                        <Option value="Vegeterian">Vegetarian (शाकाहारी)</Option>
                        <Option value="Non-Vegeterian">Non-Vegetarian (मांसाहारी)</Option>
                        <Option value="Both">Both / Flexible (दोनों)</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="house" label="House Ownership (आवास प्रकार)" initialValue="Self">
                      <Select placeholder="Select House">
                        <Option value="Self">Owned / Self (स्वयं का)</Option>
                        <Option value="Rental">Rented (किराये का)</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {/* 5. Family Background */}
                <div className="up-edit-section-heading">
                  👨‍👩‍👧‍👦 5. Family Background (पारिवारिक पृष्ठभूमि)
                </div>
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={8}>
                    <Form.Item name="father_name" label="Father's Name (पिता का नाम)">
                      <Input placeholder="Father's full name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="father_age" label="Father's Age (पिता की आयु)">
                      <Input type="number" placeholder="e.g. 58" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="father_profession" label="Father's Profession (पिता का व्यवसाय)">
                      <Input placeholder="e.g. Businessman, Retired Officer" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={8}>
                    <Form.Item name="mother_name" label="Mother's Name (माता का नाम)">
                      <Input placeholder="Mother's full name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="mother_age" label="Mother's Age (माता की आयु)">
                      <Input type="number" placeholder="e.g. 54" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="mother_profession" label="Mother's Profession (माता का व्यवसाय)">
                      <Input placeholder="e.g. Homemaker, Teacher, Doctor" />
                    </Form.Item>
                  </Col>

                  <Col xs={12} sm={6}>
                    <Form.Item name="brothers" label="Total Brothers (कुल भाई)">
                      <Select placeholder="Brothers">
                        {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((n) => (
                          <Option key={n} value={n}>{n}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Form.Item name="brothers_marrige" label="Married Brothers (विवाहित भाई)">
                      <Select placeholder="Married">
                        {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((n) => (
                          <Option key={n} value={n}>{n}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Form.Item name="sisters" label="Total Sisters (कुल बहनें)">
                      <Select placeholder="Sisters">
                        {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((n) => (
                          <Option key={n} value={n}>{n}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Form.Item name="sisters_marrige" label="Married Sisters (विवाहित बहनें)">
                      <Select placeholder="Married">
                        {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((n) => (
                          <Option key={n} value={n}>{n}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {/* 6. Location & Residential Address */}
                <div className="up-edit-section-heading">
                  📍 6. Residential Location (निवास स्थान)
                </div>
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="district" label="District (गृह जिला)" rules={[{ required: true, message: "District is required" }]}>
                      <Select
                        placeholder={districtList.length > 0 ? "Select District" : "Select State first"}
                        showSearch
                        onChange={handleFormDistrictChange}
                        filterOption={(input, option) =>
                          String(option?.children || "").toLowerCase().includes(input.toLowerCase())
                        }
                      >
                        {districtList.map((d, idx) => (
                          <Option key={idx} value={d}>{d}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item name="city" label="City / Town / Village (शहर / ग्राम)">
                      <Input placeholder="Enter your city or native place" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item name="country" label="Country (देश)" initialValue="India">
                      <Input placeholder="e.g. India" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item name="full_address" label="Full Address (स्थायी पता)">
                      <Input placeholder="House no, street, locality, landmark" />
                    </Form.Item>
                  </Col>
                </Row>

                {/* 7. Contact Details & Notification Settings */}
                <div className="up-edit-section-heading">
                  📞 7. Contact Details (संपर्क विवरण)
                </div>
                <Row gutter={[12, 12]}>
                  {/* WhatsApp Primary Contact Number */}
                  <Col xs={24} sm={12} md={isWpSelf ? 12 : 8}>
                    <Form.Item
                      name="contact"
                      label="WhatsApp Contact Number (व्हाट्सएप नंबर)"
                      rules={[
                        { required: true, message: "WhatsApp Contact is required" },
                        { pattern: /^\d{10}$/, message: "Please enter a valid 10-digit mobile number" }
                      ]}
                    >
                      <Input placeholder="10-digit mobile number" maxLength={10} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} md={isWpSelf ? 12 : 8}>
                    <Form.Item name="wp_contact_relation" label="Number Belongs To (यह नंबर किसका है)" initialValue="Self">
                      <Select placeholder="Select Relation">
                        <Option value="Self">Self (कैंडिडेट स्वयं)</Option>
                        <Option value="Father">Father (पिताजी)</Option>
                        <Option value="Mother">Mother (माताजी)</Option>
                        <Option value="Brother">Brother (भाई)</Option>
                        <Option value="Sister">Sister (बहन)</Option>
                        <Option value="Guardian">Guardian (अभिभावक)</Option>
                        <Option value="Relative">Relative (रिश्तेदार)</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  {/* If NOT Self, show Contact Person Name input */}
                  {!isWpSelf && (
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        name="wp_contact_name"
                        label={`Contact Person Name (${selectedWpRelation} का नाम)`}
                      >
                        <Input placeholder={`Enter name of ${selectedWpRelation}`} />
                      </Form.Item>
                    </Col>
                  )}

                  {/* Alternate Contact Number */}
                  <Col xs={24} sm={12} md={isAltSelf ? 12 : 8}>
                    <Form.Item
                      name="alt_contact"
                      label="Alternate Contact Number (वैकल्पिक नंबर)"
                      rules={[
                        { pattern: /^\d{10}$/, message: "Please enter a valid 10-digit mobile number" }
                      ]}
                    >
                      <Input placeholder="10-digit alternate mobile number" maxLength={10} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} md={isAltSelf ? 12 : 8}>
                    <Form.Item name="alt_contact_relation" label="Alternate Belongs To (वैकल्पिक नंबर किसका है)" initialValue="Father">
                      <Select placeholder="Select Relation">
                        <Option value="Self">Self (कैंडिडेट स्वयं)</Option>
                        <Option value="Father">Father (पिताजी)</Option>
                        <Option value="Mother">Mother (माताजी)</Option>
                        <Option value="Brother">Brother (भाई)</Option>
                        <Option value="Sister">Sister (बहन)</Option>
                        <Option value="Guardian">Guardian (अभिभावक)</Option>
                        <Option value="Relative">Relative (रिश्तेदार)</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  {/* If NOT Self, show Alternate Person Name input */}
                  {!isAltSelf && (
                    <Col xs={24} sm={12} md={8}>
                      <Form.Item
                        name="alt_contact_name"
                        label={`Alternate Person Name (${selectedAltRelation} का नाम)`}
                      >
                        <Input placeholder={`Enter name of ${selectedAltRelation}`} />
                      </Form.Item>
                    </Col>
                  )}

                  <Col xs={24} sm={24}>
                    <Form.Item
                      name="email"
                      label="Email Address (ईमेल पता)"
                      extra={
                        <span className="up-edit-field-tip">
                          🔔 Enter active email to receive match and interest alerts.
                        </span>
                      }
                    >
                      <Input type="email" placeholder="email@example.com" />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Submit Buttons & Action Bar */}
                <div className="up-edit-actions-bar">
                  <Button onClick={() => switchTab("profile")} size="large" style={{ borderRadius: "12px", fontWeight: "600" }}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={isLoading}
                    icon={<CheckCircleOutlined />}
                    style={{
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #e11d48, #be123c)",
                      fontWeight: "800",
                      boxShadow: "0 6px 20px rgba(225, 29, 72, 0.35)",
                    }}
                  >
                    Save Profile
                  </Button>
                </div>
              </Form>
            </Card>
          </Spin>
        )}

        {/* ============================================================ */}
        {/* TAB H: SECURITY SETTINGS */}
        {/* ============================================================ */}
        {activeTab === "security" && (
          <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "22px" }}>
            {/* Matrimonial Profile Privacy & Status Card */}
            <Card
              variant="borderless"
              style={{
                borderRadius: "24px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
                border: "1.5px solid rgba(225, 29, 72, 0.12)",
                background: "#ffffff",
              }}
              styles={{ body: { padding: "28px" } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "22px" }}>🛡️</span>
                <h2 style={{ margin: 0, color: "#881337", fontWeight: "800", fontSize: "20px" }}>
                  Matrimonial Profile Privacy & Status
                </h2>
              </div>
              <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: "13.5px" }}>
                Control whether other candidates can find, view, and send requests to your matrimonial profile.
              </p>

              <div
                style={{
                  background: isProfileActive ? "#f0fdf4" : "#fef2f2",
                  borderRadius: "18px",
                  padding: "18px 20px",
                  border: `1.5px solid ${isProfileActive ? "#86efac" : "#fca5a5"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: "800", color: isProfileActive ? "#166534" : "#991b1b", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>{isProfileActive ? "🟢" : "🔴"}</span>
                    Status: {isProfileActive ? "Active (Visible to Candidates)" : "Deactivated (Private & Hidden)"}
                  </div>
                  <div style={{ color: isProfileActive ? "#15803d" : "#b91c1c", fontSize: "13px", marginTop: "4px" }}>
                    {isProfileActive
                      ? "Your biodata is active. Other candidates can search and connect with you."
                      : "Your biodata is deactivated. Other candidates cannot discover or view your profile."}
                  </div>
                </div>

                <Button
                  danger={isProfileActive}
                  type={isProfileActive ? "default" : "primary"}
                  onClick={() => {
                    if (hasCompletedProfile) {
                      setIsStatusModalOpen(true);
                    } else {
                      message.warning("Please complete your profile details first before changing visibility status.");
                    }
                  }}
                  style={{
                    borderRadius: "14px",
                    fontWeight: "700",
                    height: "40px",
                    background: isProfileActive ? undefined : "linear-gradient(135deg, #16a34a, #15803d)",
                    borderColor: isProfileActive ? undefined : "#16a34a",
                  }}
                >
                  {isProfileActive ? "Deactivate Profile" : "Activate Profile"}
                </Button>
              </div>
            </Card>

            {/* Password Card */}
            <Card
              variant="borderless"
              style={{
                borderRadius: "24px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
                background: "#ffffff",
              }}
              styles={{ body: { padding: "28px" } }}
            >
              <h2 style={{ margin: "0 0 6px", color: "#881337", fontWeight: "800", fontSize: "20px" }}>
                🔒 Password & Security
              </h2>
              <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: "13.5px" }}>
                Keep your matrimonial account secure with a strong password.
              </p>

              <Form
                form={securityForm}
                layout="vertical"
                onFinish={async (values) => {
                  if (values.new_password !== values.confirm_password) {
                    return message.error("New passwords do not match!");
                  }
                  try {
                    await UserUpdate(user_id, { password: values.new_password });
                    message.success("Password updated successfully!");
                    securityForm.resetFields();
                  } catch {
                    message.error("Failed to update password");
                  }
                }}
              >
                <Form.Item
                  name="new_password"
                  label="New Password"
                  rules={[{ required: true, min: 6, message: "Min 6 characters required" }]}
                >
                  <Input.Password placeholder="Enter new password" style={{ borderRadius: "12px" }} />
                </Form.Item>

                <Form.Item
                  name="confirm_password"
                  label="Confirm New Password"
                  rules={[{ required: true, message: "Please confirm password" }]}
                >
                  <Input.Password placeholder="Re-enter new password" style={{ borderRadius: "12px" }} />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  style={{
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #e11d48, #be123c)",
                    fontWeight: "700",
                    height: "44px",
                    marginTop: "12px",
                  }}
                >
                  Update Password
                </Button>
              </Form>
            </Card>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB G: HELP & MEMBER SUPPORT DESK */}
        {/* ============================================================ */}
        {activeTab === "help" && (
          <div>
            {/* Simple Clean Header */}
            <div className="up-help-hero">
              <div>
                <h2 className="up-help-hero-title">
                  <CustomerServiceOutlined /> Help & Support
                </h2>
                <p className="up-help-hero-desc">
                  Have questions or need assistance with your profile? Submit your question below.
                </p>
              </div>

              {supportTargets.has_staff && supportTargets.staff?.contact && (
                <a
                  href={`https://wa.me/91${supportTargets.staff.contact}?text=${encodeURIComponent(
                    `Hello ${supportTargets.staff.name}, I am ${user.firstname || user.Full_Name || "a member"} (#ID: ${user_id}) from Vaivaheek Manch. I need assistance with my profile.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    icon={<WhatsAppOutlined />}
                    style={{
                      borderRadius: "14px",
                      background: "#25d366",
                      borderColor: "#25d366",
                      color: "#ffffff",
                      fontWeight: "700",
                      height: "38px",
                      boxShadow: "0 4px 12px rgba(37, 211, 102, 0.25)",
                    }}
                  >
                    WhatsApp ({supportTargets.staff.name})
                  </Button>
                </a>
              )}
            </div>

            {/* Simple Query Input Card */}
            <Card variant="borderless" className="up-help-card">
              <h3 style={{ margin: "0 0 14px", color: "#1e293b", fontWeight: "800", fontSize: "16px" }}>
                Ask a Question
              </h3>

              <div className="up-help-target-box" style={{ marginBottom: "14px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>
                  Send Question To:
                </span>
                {supportTargets.has_staff && supportTargets.staff?.id ? (
                  <Radio.Group
                    className="up-help-target-group"
                    value={selectedHelpTarget}
                    onChange={(e) => setSelectedHelpTarget(e.target.value)}
                  >
                    <Radio.Button value="staff" style={{ borderRadius: "10px", fontWeight: "700" }}>
                      👤 Assigned Counselor ({supportTargets.staff?.name || "Staff"})
                    </Radio.Button>
                    <Radio.Button value="admin" style={{ borderRadius: "10px", fontWeight: "700" }}>
                      👑 Central Admin Office
                    </Radio.Button>
                  </Radio.Group>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontWeight: 700, color: "#475569" }}>
                    👑 Central Admin Office (Direct Registration)
                  </span>
                )}
              </div>

              <Input.TextArea
                value={helpQuestion}
                onChange={(e) => setHelpQuestion(e.target.value)}
                rows={3}
                maxLength={500}
                showCount
                placeholder="Type your question or query here..."
                style={{
                  borderRadius: "12px",
                  padding: "10px 12px",
                  fontSize: "14px",
                  borderColor: "#cbd5e1",
                  marginBottom: "14px",
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={isSubmittingHelp}
                  onClick={handleHelpSubmit}
                  className="up-help-submit-btn"
                >
                  Submit Question
                </Button>
              </div>
            </Card>

            {/* History of Help Requests */}
            <div>
              <div className="up-help-filter-row">
                <h3 style={{ margin: 0, color: "#1e293b", fontWeight: "800", fontSize: "17px" }}>
                  My Questions & Replies
                </h3>

                <div className="up-help-filter-buttons">
                  {[
                    { key: "all", label: `All (${helpTickets.length})` },
                    { key: "answered", label: `Answered (${helpTickets.filter((t) => t.is_answered || (t.Answer && t.Answer.trim())).length})` },
                    { key: "pending", label: `Pending (${helpTickets.filter((t) => !t.is_answered && (!t.Answer || !t.Answer.trim())).length})` },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => {
                        setHelpFilter(f.key);
                        setHelpPage(1);
                      }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "10px",
                        fontSize: "12.5px",
                        fontWeight: "700",
                        cursor: "pointer",
                        border: helpFilter === f.key ? "1.5px solid #e11d48" : "1.5px solid #e2e8f0",
                        background: helpFilter === f.key ? "#fff1f2" : "#ffffff",
                        color: helpFilter === f.key ? "#be123c" : "#64748b",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {paginatedHelpTickets.length === 0 ? (
                <Card variant="borderless" style={{ borderRadius: "18px", textAlign: "center", padding: "40px 20px" }}>
                  <Empty description="No questions found." />
                </Card>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {paginatedHelpTickets.map((ticket) => {
                    const hasAnswer = Boolean(ticket.is_answered || (ticket.Answer && ticket.Answer.trim()));
                    const isStaffTarget = ticket.Role === "staff" || ticket.target_role === "staff";
                    const assignedTargetName = ticket.target_name || (isStaffTarget ? (supportTargets.staff?.name || "Staff Counselor") : "Admin Support");

                    return (
                      <div key={ticket.id} className="up-ticket-card">
                        {/* Header */}
                        <div className="up-ticket-header">
                          <div className="up-ticket-tags">
                            <span style={{ fontWeight: "700", color: "#64748b", fontSize: "12px" }}>
                              #HLP-{ticket.id}
                            </span>
                            <Tag color={isStaffTarget ? "blue" : "purple"}>
                              To: {assignedTargetName}
                            </Tag>
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                              📅 Raised: {formatDateTime(ticket.created_date || ticket.Create_date)}
                            </span>
                          </div>

                          {hasAnswer ? (
                            <Tag color="success" icon={<CheckOutlined style={{ marginRight: "3px" }} />}>
                              Answered ✅
                            </Tag>
                          ) : (
                            <Tag color="warning" icon={<ClockCircleOutlined style={{ marginRight: "3px" }} />}>
                              Pending ⏳
                            </Tag>
                          )}
                        </div>

                        {/* Question */}
                        <div style={{ marginBottom: hasAnswer ? "12px" : "4px" }}>
                          <div className="up-ticket-q">
                            Q: {ticket.Question}
                          </div>
                        </div>

                        {/* Answer Box */}
                        {hasAnswer ? (
                          <div className="up-ticket-reply">
                            <div style={{ fontSize: "12px", fontWeight: "700", color: "#15803d", marginBottom: "3px" }}>
                              Reply:
                            </div>
                            <div style={{ fontSize: "13.5px", color: "#166534", lineHeight: "1.5", whiteSpace: "pre-line" }}>
                              {ticket.Answer}
                            </div>
                            {ticket.updated_date && (
                              <div style={{ marginTop: 4, fontSize: "11px", color: "#047857" }}>
                                🕒 Replied: {formatDateTime(ticket.updated_date)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ color: "#d97706", fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <ClockCircleOutlined /> Awaiting response...
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {totalFilteredHelpCount > helpPageSize && (
                    <div style={{ display: "flex", justifyContent: "center", marginTop: "18px" }}>
                      <Pagination
                        current={helpPage}
                        pageSize={helpPageSize}
                        total={totalFilteredHelpCount}
                        showSizeChanger={false}
                        onChange={(page) => setHelpPage(page)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
          </>
        )}
      </main>

      {/* ============================================================== */}
      {/* 5. MOBILE APP BOTTOM NAVIGATION BAR (Sticky 5 Icons) */}
      {/* ============================================================== */}
      <nav className="up-mobile-bottom-nav">
        <button
          className={`up-bottom-nav-btn ${activeTab === "matches" ? "active" : ""}`}
          onClick={() => switchTab("matches")}
        >
          <span className="up-bottom-icon">
            <HeartFilled />
          </span>
          <span>Matches</span>
        </button>



        <button
          className={`up-bottom-nav-btn ${activeTab === "shortlist" ? "active" : ""}`}
          onClick={() => switchTab("shortlist")}
        >
          <span className="up-bottom-icon">
            <HeartOutlined />
          </span>
          <span>Shortlist</span>
        </button>

        <button
          className={`up-bottom-nav-btn ${activeTab === "services" ? "active" : ""}`}
          onClick={() => switchTab("services")}
        >
          <span className="up-bottom-icon">
            <ShopOutlined style={{ color: activeTab === "services" ? "#7c3aed" : undefined }} />
          </span>
          <span>Services</span>
        </button>

        <button
          className={`up-bottom-nav-btn ${activeTab === "plans" ? "active" : ""}`}
          onClick={() => switchTab("plans")}
        >
          <span className="up-bottom-icon">
            <CrownOutlined style={{ color: "#d97706" }} />
          </span>
          <span>Plans</span>
        </button>

        <button
          className={`up-bottom-nav-btn ${activeTab === "profile" || activeTab === "edit" ? "active" : ""}`}
          onClick={() => switchTab("profile")}
        >
          <span className="up-bottom-icon">
            <UserOutlined />
          </span>
          <span>Profile</span>
        </button>
      </nav>

      {/* ============================================================== */}
      {/* 7. TRANSACTION RECEIPT / INVOICE MODAL */}
      {/* ============================================================== */}
      <Modal
        title={null}
        open={isReceiptOpen}
        onCancel={() => {
          setIsReceiptOpen(false);
          setSelectedTxn(null);
        }}
        footer={null}
        width={540}
        centered
      >
        {selectedTxn && (
          <div style={{ padding: "10px" }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "36px" }}>💍</span>
              <h3 style={{ margin: "6px 0 2px", color: "#881337", fontWeight: "900" }}>
                Vaivaheek Manch Matrimonial
              </h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>
                Official Payment Receipt & Tax Invoice
              </p>
            </div>

            <Divider style={{ margin: "14px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "6px 0" }}>
              <span style={{ color: "#64748b" }}>Receipt / Txn ID:</span>
              <strong>#{selectedTxn.id || "TXN-101"}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "6px 0" }}>
              <span style={{ color: "#64748b" }}>Transaction Date:</span>
              <strong>{formatDate(selectedTxn.Create_date || selectedTxn.created_at) || "Recent"}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "6px 0" }}>
              <span style={{ color: "#64748b" }}>Purchased Plan:</span>
              <strong style={{ color: "#e11d48" }}>{selectedTxn.Plan || selectedTxn.plan}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "6px 0" }}>
              <span style={{ color: "#64748b" }}>Status:</span>
              <Tag color="success">Paid & Verified</Tag>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", padding: "12px 0", borderTop: "1.5px dashed #e2e8f0", marginTop: "10px" }}>
              <strong style={{ color: "#1e293b" }}>Total Amount Paid:</strong>
              <strong style={{ color: "#059669", fontSize: "18px" }}>₹{selectedTxn.Amount || selectedTxn.amount}</strong>
            </div>

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button type="primary" onClick={() => setIsReceiptOpen(false)} style={{ borderRadius: "12px", minWidth: "100px" }}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* 8. PROFILE VISIBILITY (ACTIVATE / DEACTIVATE) CONFIRMATION MODAL */}
      {/* ============================================================== */}
      <Modal
        title={null}
        open={isStatusModalOpen}
        onCancel={() => setIsStatusModalOpen(false)}
        footer={null}
        centered
        width={480}
      >
        <div style={{ padding: "16px 8px", textAlign: "center" }}>
          <div style={{ fontSize: "52px", marginBottom: "12px" }}>
            {isProfileActive ? "⏸️" : "✨"}
          </div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "900",
              color: isProfileActive ? "#be123c" : "#059669",
              margin: "0 0 10px",
            }}
          >
            {isProfileActive
              ? "Deactivate Your Matrimonial Profile?"
              : "Activate Your Matrimonial Profile?"}
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px" }}>
            {isProfileActive
              ? "When deactivated, your biodata will be hidden from matches. You can still shortlist profiles, but sending connection requests and viewing candidate contact numbers or full residential addresses will be restricted even if you have an active membership plan. You can reactivate anytime."
              : "When activated, your biodata will become visible to compatible matches, allowing brides & grooms to view and send connection requests."}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Button
              onClick={() => setIsStatusModalOpen(false)}
              style={{ borderRadius: "14px", height: "42px", padding: "0 22px", fontWeight: "600" }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={statusToggleLoading}
              onClick={() => handleToggleProfileActive(!isProfileActive)}
              danger={isProfileActive}
              style={{
                borderRadius: "14px",
                height: "42px",
                padding: "0 24px",
                fontWeight: "700",
                background: isProfileActive ? undefined : "linear-gradient(135deg, #16a34a, #15803d)",
                borderColor: isProfileActive ? undefined : "#16a34a",
              }}
            >
              {isProfileActive ? "Yes, Deactivate Profile" : "Yes, Activate Profile"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================== */}
      {/* WEDDING SERVICE DETAILS MODAL */}
      {/* ============================================================== */}
      <Modal
        title={
          selectedService ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShopOutlined style={{ color: "#7c3aed", fontSize: "20px" }} />
              <div>
                <div style={{ fontWeight: "800", fontSize: "17px", color: "#0f172a" }}>
                  {selectedService.Service_Name || "Service Partner"}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                  Category: {selectedService.Service_Type || "Wedding Vendor"}
                </div>
              </div>
            </div>
          ) : "Service Details"
        }
        open={isServiceModalOpen}
        onCancel={() => {
          setIsServiceModalOpen(false);
          setSelectedService(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsServiceModalOpen(false);
              setSelectedService(null);
            }}
            style={{ borderRadius: "12px" }}
          >
            Close
          </Button>,
          selectedService && (
            <Button
              key="call"
              className="up-service-call-btn"
              icon={<PhoneOutlined />}
              onClick={() => handleCallService(selectedService)}
              style={{ borderRadius: "12px" }}
            >
              Call Vendor
            </Button>
          ),
          selectedService && (
            <Button
              key="wa"
              className="up-service-wa-btn"
              icon={<WhatsAppOutlined />}
              onClick={() => handleWhatsAppService(selectedService)}
              style={{ borderRadius: "12px" }}
            >
              WhatsApp Inquiry
            </Button>
          ),
        ]}
        width={650}
        styles={{ body: { padding: "16px 20px" } }}
      >
        {selectedService && (
          <div>
            {/* Image Banner */}
            {selectedService.Picture && (
              <div style={{ width: "100%", maxHeight: "280px", overflow: "hidden", borderRadius: "16px", marginBottom: "16px", background: "#f1f5f9" }}>
                <Image
                  src={getMediaUrl(selectedService.Picture)}
                  alt={selectedService.Service_Name}
                  style={{ width: "100%", maxHeight: "280px", objectFit: "cover", borderRadius: "16px" }}
                />
              </div>
            )}

            {/* Badges Row */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
              <Tag color="purple" style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "8px", fontWeight: "700" }}>
                🎯 {selectedService.Service_Type || "Vendor"}
              </Tag>
              <Tag color="green" style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "8px", fontWeight: "700" }}>
                ✓ Verified Partner
              </Tag>
              {selectedService.Service_Price && (
                <Tag color="gold" style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "8px", fontWeight: "800" }}>
                  💰 ₹{Number(selectedService.Service_Price).toLocaleString("en-IN")}
                </Tag>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
                About This Service:
              </div>
              <div style={{ fontSize: "13.5px", color: "#475569", lineHeight: "1.6", background: "#f8fafc", padding: "12px 14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                {selectedService.Service_Description || "Professional wedding and ceremony service provider on Vaivaheek Manch."}
              </div>
            </div>

            {/* Location & Contact Info */}
            <Row gutter={[12, 12]} style={{ marginBottom: "16px" }}>
              <Col xs={24} sm={12}>
                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", height: "100%" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>
                    📍 BASE LOCATION & ADDRESS
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                    {selectedService.City || selectedService.District}, {selectedService.State || "India"}
                  </div>
                  {selectedService.Full_Address && (
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      {selectedService.Full_Address}
                    </div>
                  )}
                </div>
              </Col>

              <Col xs={24} sm={12}>
                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", height: "100%" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "4px" }}>
                    📞 CONTACT NUMBERS
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                    WhatsApp: {selectedService.WP_Contact || "—"}
                  </div>
                  {selectedService.Alt_Contact && (
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      Alt Phone: {selectedService.Alt_Contact}
                    </div>
                  )}
                </div>
              </Col>
            </Row>

            {/* Available Zones / Districts */}
            <div>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
                Covered Districts & Booking Zones:
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", maxHeight: "120px", overflowY: "auto", padding: "6px 0" }}>
                {(() => {
                  let zones = selectedService.Available_Zone;
                  if (typeof zones === "string") {
                    try { zones = JSON.parse(zones); } catch { zones = zones.split(",").map((z) => z.trim()); }
                  }
                  if (!Array.isArray(zones) || zones.length === 0) {
                    return <Tag>{selectedService.District || "Local City"}</Tag>;
                  }
                  return zones.map((z, idx) => {
                    const isUserDist = (user.district || user.District) && String(z).toLowerCase() === String(user.district || user.District).toLowerCase();
                    return (
                      <Tag
                        key={idx}
                        color={isUserDist ? "green" : (z === "All" ? "purple" : "default")}
                        style={{ fontSize: "11px", borderRadius: "6px", fontWeight: isUserDist ? "800" : "500" }}
                      >
                        {isUserDist ? `📍 ${z} (Your District)` : z}
                      </Tag>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default UserPanel;
