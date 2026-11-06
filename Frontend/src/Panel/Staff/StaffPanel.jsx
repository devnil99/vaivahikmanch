import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  Row,
  Col,
  Select,
  Spin,
  message,
  Tag,
  Modal,
  Switch,
  Radio,
  Drawer,
  Divider,
  Pagination,
  Image,
} from "antd";
import {
  LeftOutlined,
  RightOutlined,
  IdcardFilled,
  IdcardOutlined,
  PrinterOutlined,
  UserAddOutlined,
  TeamOutlined,
  WalletOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  UploadOutlined,
  LogoutOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  PhoneOutlined,
  LockOutlined,
  CheckOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  SafetyCertificateFilled,
  KeyOutlined,
  HistoryOutlined,
  CustomerServiceOutlined,
  WhatsAppOutlined,
  SearchOutlined,
  SendOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  MenuOutlined,
  HomeOutlined,
  EditOutlined,
  ShareAltOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  FilterOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../../Api/Api";
import {
  StaffDataGet,
  StaffDataPost,
  StaffDataUpdate,
  StaffTransactionsGet,
  StaffTransactionsPost,
  StaffTransactionsUpdate,
  StaffCommissionGet,
  HelpGet,
  HelpPost,
  HelpUpdate,
  UserUpdate,
  UserDataToggleActive,
  User_StateGet,
  User_CasteGet,
  ProfessionGet,
  ReligionGet,
  LanguageGet,
  ColorGet,
} from "../../Api/CoreApi";
import "./StaffPanel.css";

const { Option } = Select;

const S3_MEDIA_BASE_URL = "https://risteybucket.s3.ap-south-1.amazonaws.com/";

// Helper to format media URLs via S3
const getMediaUrl = (path) => {
  if (!path) return "";
  if (typeof path !== "string") return "";
  const trimmed = path.trim();
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
  } catch {
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


function StaffPanel() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Authentication & Staff User details
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("user_id");
  const storedContact = localStorage.getItem("contact") || "";
  const storedUsername = localStorage.getItem("username") || "";
  const storedRefCode = localStorage.getItem("ref_code") || "";
  const storedAmount = localStorage.getItem("amount") || 0;

  // Active navigation tab (dashboard, profile, adduser, myusers, withdrawal, transactions, help)
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  // Sync tab with URL query parameter (?tab=...)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      ["dashboard", "profile", "adduser", "myusers", "usersearch", "withdrawal", "wallet", "transactions", "help"].includes(tab)
    ) {
      setActiveTab(["wallet", "withdrawal"].includes(tab) ? "transactions" : tab);
    }
  }, [searchParams]);

  const switchTab = (tabKey) => {
    const target = ["wallet", "withdrawal"].includes(tabKey) ? "transactions" : tabKey;
    setActiveTab(target);
    setSearchParams({ tab: target });
    setMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Loading states
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Staff Data & Verification State
  const [staffProfile, setStaffProfile] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [activeCommissionRate, setActiveCommissionRate] = useState(null);

  // Reference Code & Wallet Balance
  const [refCode, setRefCode] = useState(storedRefCode);
  const [walletAmount, setWalletAmount] = useState(Number(storedAmount) || 0);

  // Dropdown reference datasets
  const [statesList, setStatesList] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [casteList, setCasteList] = useState([]);
  const [professionList, setProfessionList] = useState([]);
  const [religionList, setReligionList] = useState([]);
  const [languageList, setLanguageList] = useState([]);
  const [colorList, setColorList] = useState([]);

  // Added Users state
  const [myAddedUsers, setMyAddedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchText, setUserSearchText] = useState("");
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);

  // Form instances
  const [profileForm] = Form.useForm();
  const [candidateProfileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Password Modal State (Points to User Model)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Platform Users & Comprehensive User Search State
  const [allPlatformUsers, setAllPlatformUsers] = useState([]);
  const [loadingSearchUsers, setLoadingSearchUsers] = useState(false);
  const [searchScope, setSearchScope] = useState("all"); // "all" | "my"
  const [candidateSearchKeyword, setCandidateSearchKeyword] = useState("");
  const [candidateGenderFilter, setCandidateGenderFilter] = useState("all");
  const [candidateCasteFilter, setCandidateCasteFilter] = useState("all");
  const [candidateReligionFilter, setCandidateReligionFilter] = useState("all");
  const [candidateStateFilter, setCandidateStateFilter] = useState("all");
  const [candidateDistrictFilter, setCandidateDistrictFilter] = useState("all");
  const [candidateAgeFilter, setCandidateAgeFilter] = useState("all");
  const [candidateMaritalFilter, setCandidateMaritalFilter] = useState("all");
  const [candidateDietFilter, setCandidateDietFilter] = useState("all");
  const [candidateManglikFilter, setCandidateManglikFilter] = useState("all");
  const [candidateProfessionFilter, setCandidateProfessionFilter] = useState("all");
  const [candidateActiveFilter, setCandidateActiveFilter] = useState("all");
  const [hasExecutedSearch, setHasExecutedSearch] = useState(true);
  const [searchPage, setSearchPage] = useState(1);
  const [searchPageSize, setSearchPageSize] = useState(12);

  // File upload state for staff profile
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [adharFile, setAdharFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [passbookFile, setPassbookFile] = useState(null);

  // Candidate Stepped Registration (mirrors UserRegister flow with SMS OTP)
  const [candidateStep, setCandidateStep] = useState(0);
  const [candPhone, setCandPhone] = useState("");
  const [candPhoneError, setCandPhoneError] = useState("");
  const [candOtp, setCandOtp] = useState(Array(6).fill(""));
  const [candOtpError, setCandOtpError] = useState("");
  const [candPassword, setCandPassword] = useState("");
  const [candConfirmPassword, setCandConfirmPassword] = useState("");
  const [candShowPass, setCandShowPass] = useState(false);
  const [candShowConfirmPass, setCandShowConfirmPass] = useState(false);
  const [candPasswordError, setCandPasswordError] = useState("");
  const [candCountdown, setCandCountdown] = useState(120);
  const [candCanResend, setCandCanResend] = useState(false);
  const [candLoading, setCandLoading] = useState(false);
  const [candidateCreatedUser, setCandidateCreatedUser] = useState(null);
  const [candProfilePicFile, setCandProfilePicFile] = useState(null);
  const [candidateDistricts, setCandidateDistricts] = useState([]);

  const candOtpRefs = useRef([]);
  const candTimerRef = useRef(null);

  // Financials & Transactions
  const [transactionsList, setTransactionsList] = useState([]);
  const [txFilter, setTxFilter] = useState("all");
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [withdrawPayoutMode, setWithdrawPayoutMode] = useState("upi");
  const [withdrawUpi, setWithdrawUpi] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  // Admin Payout Review States
  const [adminActionModalVisible, setAdminActionModalVisible] = useState(false);
  const [adminActionType, setAdminActionType] = useState("approve"); // "approve" | "reject" | "update_msg"
  const [selectedAdminTxn, setSelectedAdminTxn] = useState(null);
  const [adminTxnMsg, setAdminTxnMsg] = useState("");
  const [submittingAdminAction, setSubmittingAdminAction] = useState(false);

  // Help & Support System (Using Help model with Role="staff")
  const [helpQueries, setHelpQueries] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [submittingHelp, setSubmittingHelp] = useState(false);
  const [selectedHelpItem, setSelectedHelpItem] = useState(null);
  const [counselorReplyText, setCounselorReplyText] = useState("");
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Matrimonial Biodata View Modal State (Matching UserPanel full view)
  const [biodataModalVisible, setBiodataModalVisible] = useState(false);
  const [selectedBiodataUser, setSelectedBiodataUser] = useState(null);

  // Staff account active & approval status
  const isApprovedStaff = Boolean(staffProfile && staffProfile.is_approved && staffProfile.Active !== false);
  const isDeactivated = !isApprovedStaff;

  // Authentication Protection
  useEffect(() => {
    if (!token) {
      message.error("Session expired. Please log in.");
      navigate("/StaffLogin");
      return;
    }
    if (role && !["staff", "admin", "superadmin"].includes(role.toLowerCase())) {
      message.error("Access restricted: Staff authorization required.");
      navigate("/UserPanel");
    }
  }, [token, role, navigate]);

  // OTP Countdown Timer
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

  const formatCountdown = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Data Fetching
  const fetchStaffData = useCallback(async () => {
    try {
      const res = await StaffDataGet();
      const staffList = Array.isArray(res) ? res : res?.data || [];
      const myStaff = staffList.find(
        (s) =>
          String(s.Staff_id) === String(userId) ||
          String(s.Staff_id?.id) === String(userId)
      );

      if (myStaff) {
        setStaffProfile(myStaff);
        setHasProfile(true);
        setWalletAmount(Number(myStaff.Amount) || 0);
        localStorage.setItem("amount", String(myStaff.Amount || 0));

        if (myStaff.Refer && String(myStaff.Refer) !== String(refCode)) {
          setRefCode(String(myStaff.Refer));
          localStorage.setItem("ref_code", String(myStaff.Refer));
        }

        if (myStaff.UPI_ID) {
          setWithdrawUpi(myStaff.UPI_ID);
        }
      } else {
        setHasProfile(false);
      }
    } catch (err) {
      console.warn("Could not fetch staff profile:", err);
    }
  }, [userId, refCode]);

  // Sync profile form values when profile tab/form is mounted
  useEffect(() => {
    if (activeTab === "profile" && (!hasProfile || isEditingProfile) && staffProfile) {
      profileForm.setFieldsValue({
        Full_Name: staffProfile.Full_Name || "",
        WP_Contact: staffProfile.WP_Contact || "",
        Age: staffProfile.Age || "",
        Full_Address: staffProfile.Full_Address || "",
        District: staffProfile.District || "",
        State: staffProfile.State || "",
        City: staffProfile.City || "",
        Country: staffProfile.Country || "India",
        Email: staffProfile.Email || "",
        Adhar_Number: staffProfile.Adhar_Number || "",
        PAN_Number: staffProfile.PAN_Number || "",
        Bank_Name: staffProfile.Bank_Name || "",
        Bank_Account_Number: staffProfile.Bank_Account_Number || "",
        Bank_IFSC_Code: staffProfile.Bank_IFSC_Code || "",
        Bank_Account_Holder_Name: staffProfile.Bank_Account_Holder_Name || "",
        UPI_ID: staffProfile.UPI_ID || "",
      });
    }
  }, [activeTab, hasProfile, isEditingProfile, staffProfile, profileForm]);

  const fetchStaffUserAccount = useCallback(async () => {
    try {
      const res = await API.get(`users/${userId}/`);
      const u = res?.data || {};
      if (u.Reference_Code && String(u.Reference_Code) !== String(refCode)) {
        setRefCode(String(u.Reference_Code));
        localStorage.setItem("ref_code", String(u.Reference_Code));
      }
      if (u.Amount !== undefined) {
        setWalletAmount(Number(u.Amount) || 0);
      }
    } catch {
      // Fallback
    }
  }, [userId, refCode]);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await StaffTransactionsGet(userId ? { staff_id: userId } : {});
      const list = Array.isArray(res) ? res : res?.data || [];
      const isStaffUser = !String(role || localStorage.getItem("role") || "").toLowerCase().includes("admin");
      let userTx = list;
      if (!isStaffUser && userId) {
        userTx = list.filter(
          (t) =>
            String(t.Staff_id) === String(userId) ||
            String(t.Staff_id?.id) === String(userId)
        );
      } else if (userId && list.length > 0 && list.some((t) => String(t.Staff_id) === String(userId) || String(t.Staff_id?.id) === String(userId))) {
        userTx = list.filter(
          (t) =>
            String(t.Staff_id) === String(userId) ||
            String(t.Staff_id?.id) === String(userId)
        );
      }
      setTransactionsList(userTx);
    } catch (err) {
      console.warn("Could not fetch transactions:", err);
    }
  }, [userId, role]);

  const fetchHelpQueries = useCallback(async () => {
    try {
      const res = await HelpGet();
      const list = Array.isArray(res) ? res : res?.data || [];
      setHelpQueries(list);
    } catch (err) {
      console.warn("Could not fetch help tickets:", err);
    }
  }, []);

  const fetchAddedUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const effectiveCode = String(refCode || storedRefCode).trim();
      const [usersRes, userDataRes] = await Promise.all([
        API.get(effectiveCode ? `users/?role=user&Refered_By=${effectiveCode}` : "users/?role=user").catch(() => ({ data: [] })),
        API.get(effectiveCode ? `user-data/?refered_by=${effectiveCode}` : "user-data/").catch(() => ({ data: [] })),
      ]);

      const allUsers = Array.isArray(usersRes?.data) ? usersRes.data : [];
      const allProfiles = Array.isArray(userDataRes?.data) ? userDataRes.data : [];

      const candidateMap = new Map();

      // 1. Process all referred candidates from User model
      allUsers.forEach((u) => {
        const uId = String(u.id || "");
        if (!uId) return;
        candidateMap.set(uId, {
          ...u,
          id: uId,
          first_name: u.first_name || "",
          Refered_By: u.Refered_By || effectiveCode,
          profile: null,
        });
      });

      // 2. Attach or add biodata profiles from user_data model
      allProfiles.forEach((p) => {
        const uAcc = p.user_account || {};
        const uId = String(uAcc.id || p.User_id?.id || p.User_id || "");
        if (!uId) return;

        const existing = candidateMap.get(uId);
        if (existing) {
          candidateMap.set(uId, {
            ...existing,
            first_name: p.Full_Name || existing.first_name || uAcc.first_name || "",
            is_active: uAcc.is_active !== undefined ? uAcc.is_active : existing.is_active,
            Refered_By: uAcc.Refered_By || existing.Refered_By || effectiveCode,
            profile: p,
          });
        } else {
          candidateMap.set(uId, {
            id: uId,
            username: uAcc.username || "",
            first_name: p.Full_Name || uAcc.first_name || "",
            is_active: uAcc.is_active !== undefined ? uAcc.is_active : (p.Active !== false),
            Refered_By: uAcc.Refered_By || effectiveCode,
            date_joined: uAcc.date_joined || p.Create_date,
            profile: p,
          });
        }
      });

      setMyAddedUsers(Array.from(candidateMap.values()));
    } catch (err) {
      console.warn("Could not fetch referred members:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, [refCode, storedRefCode]);

  const fetchAllSearchUsers = useCallback(async () => {
    setLoadingSearchUsers(true);
    try {
      const [usersRes, userDataRes] = await Promise.all([
        API.get("users/?role=user&scope=all").catch(() => ({ data: [] })),
        API.get("user-data/?scope=all").catch(() => ({ data: [] })),
      ]);

      const allUsers = Array.isArray(usersRes?.data) ? usersRes.data : [];
      const allProfiles = Array.isArray(userDataRes?.data) ? userDataRes.data : [];

      const candidateMap = new Map();

      // 1. Process all biodata profiles retrieved
      allProfiles.forEach((p) => {
        const uAcc = p.user_account || {};
        const uId = String(uAcc.id || p.User_id?.id || p.User_id || "");
        if (!uId) return;

        candidateMap.set(uId, {
          id: uId,
          username: uAcc.username || uAcc.Contact || p.WP_Contact || "",
          Contact: uAcc.Contact || p.WP_Contact || "",
          first_name: uAcc.first_name || p.Full_Name || "",
          is_active: uAcc.is_active !== undefined ? uAcc.is_active : true,
          Refered_By: uAcc.Refered_By || p.Refer || "",
          date_joined: uAcc.date_joined || p.Create_date,
          profile: p,
        });
      });

      // 2. Enrich biodata profiles with registered user account details
      allUsers.forEach((u) => {
        const uId = String(u.id || "");
        if (!uId) return;
        const existing = candidateMap.get(uId);
        if (existing) {
          candidateMap.set(uId, {
            ...u,
            is_active: u.is_active !== undefined ? u.is_active : existing.is_active,
            Contact: u.Contact || existing.Contact,
            first_name: u.first_name || existing.first_name,
            profile: existing.profile,
          });
        }
      });

      setAllPlatformUsers(Array.from(candidateMap.values()));
    } catch (err) {
      console.warn("Could not fetch platform candidates:", err);
    } finally {
      setLoadingSearchUsers(false);
    }
  }, []);

  const searchCandidateDistricts = useMemo(() => {
    if (!candidateStateFilter || candidateStateFilter === "all") return [];
    const found = statesList.find(
      (s) => (s.State || s.state) === candidateStateFilter
    );
    return found?.Districts || found?.districts || [];
  }, [candidateStateFilter, statesList]);

  // Combined list of all districts across all states and candidates so district filtering is never restricted
  const allStaffDistrictsList = useMemo(() => {
    const set = new Set();
    if (Array.isArray(statesList)) {
      statesList.forEach((s) => {
        const rawDist = s.Districts || s.districts || s.disttrict || s.district || [];
        if (Array.isArray(rawDist)) {
          rawDist.forEach((d) => {
            if (d && typeof d === "string" && d.trim()) set.add(d.trim());
          });
        }
      });
    }
    if (Array.isArray(allPlatformUsers)) {
      allPlatformUsers.forEach((u) => {
        const d = (u.profile?.District || u.District || "").trim();
        if (d) set.add(d);
      });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [statesList, allPlatformUsers]);

  // Clean datasets
  const cleanReligions = useMemo(() => {
    const s = new Set();
    religionList.forEach((r) => {
      const val = r.Religion_Name || r.Religion;
      if (val) s.add(String(val).trim());
    });
    return Array.from(s);
  }, [religionList]);

  const cleanCastes = useMemo(() => {
    const s = new Set();
    casteList.forEach((item) => {
      if (Array.isArray(item.Caste_Name)) {
        item.Caste_Name.forEach((c) => c && s.add(String(c).trim()));
      } else if (typeof item.Caste_Name === "string" && item.Caste_Name.trim()) {
        try {
          const arr = JSON.parse(item.Caste_Name);
          if (Array.isArray(arr)) {
            arr.forEach((c) => c && s.add(String(c).trim()));
          } else {
            s.add(item.Caste_Name.trim());
          }
        } catch {
          s.add(item.Caste_Name.trim());
        }
      } else if (item.caste || item.Caste) {
        s.add(String(item.caste || item.Caste).trim());
      }
    });
    return Array.from(s);
  }, [casteList]);

  const cleanProfessions = useMemo(() => {
    const s = new Set();
    professionList.forEach((p) => {
      const val = p.Profession_Name || p.Profession;
      if (val) s.add(String(val).trim());
    });
    return Array.from(s);
  }, [professionList]);

  const cleanLanguages = useMemo(() => {
    const s = new Set();
    languageList.forEach((l) => {
      const val = l.Language || l.Language_Name;
      if (val) s.add(String(val).trim());
    });
    return Array.from(s);
  }, [languageList]);

  const cleanColors = useMemo(() => {
    const s = new Set();
    colorList.forEach((c) => {
      const val = c.Color || c.Color_Name;
      if (val) s.add(String(val).trim());
    });
    return Array.from(s);
  }, [colorList]);

  // Dynamic Castes filtered strictly based on selected State
  const filteredSearchCastes = useMemo(() => {
    if (!candidateStateFilter || candidateStateFilter === "all") {
      return cleanCastes;
    }
    const normState = candidateStateFilter.trim().toLowerCase();
    const s = new Set();
    casteList.forEach((item) => {
      if (item.Active === false || item.is_active === false) return;
      const itemState = String(item.State || item.state || "").trim().toLowerCase();
      if (itemState === normState || !itemState || itemState === "none" || itemState === "all") {
        if (Array.isArray(item.Caste_Name)) {
          item.Caste_Name.forEach((c) => c && s.add(String(c).trim()));
        } else if (typeof item.Caste_Name === "string" && item.Caste_Name.trim()) {
          try {
            const arr = JSON.parse(item.Caste_Name);
            if (Array.isArray(arr)) {
              arr.forEach((c) => c && s.add(String(c).trim()));
            } else {
              s.add(item.Caste_Name.trim());
            }
          } catch {
            s.add(item.Caste_Name.trim());
          }
        } else if (item.caste || item.Caste) {
          s.add(String(item.caste || item.Caste).trim());
        }
      }
    });
    const arr = Array.from(s).sort((a, b) => a.localeCompare(b));
    return arr.length > 0 ? arr : cleanCastes;
  }, [candidateStateFilter, casteList, cleanCastes]);

  // Fetch state-specific castes from backend when candidateStateFilter changes
  useEffect(() => {
    if (candidateStateFilter && candidateStateFilter !== "all") {
      User_CasteGet({ state: candidateStateFilter.trim() })
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            setCasteList((prev) => {
              const prevIds = new Set(prev.map((c) => c.id));
              const newItems = res.filter((c) => !prevIds.has(c.id));
              return newItems.length > 0 ? [...prev, ...newItems] : prev;
            });
          }
        })
        .catch(() => {});
    }
  }, [candidateStateFilter]);

  const handleResetSearchFilters = () => {
    setCandidateSearchKeyword("");
    setCandidateGenderFilter("all");
    setCandidateCasteFilter("all");
    setCandidateReligionFilter("all");
    setCandidateStateFilter("all");
    setCandidateDistrictFilter("all");
    setCandidateAgeFilter("all");
    setCandidateMaritalFilter("all");
    setCandidateDietFilter("all");
    setCandidateManglikFilter("all");
    setCandidateProfessionFilter("all");
    setCandidateActiveFilter("all");
    setSearchPage(1);
    setHasExecutedSearch(true);
  };

  const filteredSearchCandidates = useMemo(() => {
    const baseList = searchScope === "my" ? myAddedUsers : allPlatformUsers;
    return baseList.filter((u) => {
      // In search section, only show candidates who have a valid matrimonial biodata
      if (!u.profile) return false;
      const prof = u.profile;
      const name = (prof.Full_Name || u.first_name || "").toLowerCase();
      const contact = String(u.Contact || u.username || prof.WP_Contact || "").toLowerCase();
      const idStr = String(u.id || "").toLowerCase();
      const city = String(prof.City || "").toLowerCase();
      const gotra = String(prof.Gotra || "").toLowerCase();
      const caste = String(prof.Caste || "").toLowerCase();
      const profText = String(prof.Profession || "").toLowerCase();
      const qual = String(prof.Qualification || "").toLowerCase();
      const stateName = String(prof.State || "").toLowerCase();

      // Keyword search
      if (candidateSearchKeyword.trim()) {
        const q = candidateSearchKeyword.toLowerCase().trim();
        const matchesQ =
          name.includes(q) ||
          contact.includes(q) ||
          idStr.includes(q) ||
          city.includes(q) ||
          gotra.includes(q) ||
          caste.includes(q) ||
          profText.includes(q) ||
          qual.includes(q) ||
          stateName.includes(q);
        if (!matchesQ) return false;
      }

      // Gender filter
      if (candidateGenderFilter !== "all") {
        const g = String(prof.Gender || "").toLowerCase();
        if (candidateGenderFilter.toLowerCase() !== g) return false;
      }

      // Caste filter
      if (candidateCasteFilter !== "all") {
        if (String(prof.Caste || "").toLowerCase() !== candidateCasteFilter.toLowerCase()) {
          return false;
        }
      }

      // Religion filter
      if (candidateReligionFilter !== "all") {
        if (String(prof.Religion || "").toLowerCase() !== candidateReligionFilter.toLowerCase()) {
          return false;
        }
      }

      // State filter
      if (candidateStateFilter !== "all") {
        if (String(prof.State || "").toLowerCase() !== candidateStateFilter.toLowerCase()) {
          return false;
        }
      }

      // District filter
      if (candidateDistrictFilter !== "all") {
        const d = String(prof.District || prof.district || "").toLowerCase();
        if (!d.includes(candidateDistrictFilter.toLowerCase())) {
          return false;
        }
      }

      // Age Range filter
      if (candidateAgeFilter !== "all") {
        const age = Number(prof.Age);
        if (!age) return false;
        if (candidateAgeFilter === "18-25" && (age < 18 || age > 25)) return false;
        if (candidateAgeFilter === "26-30" && (age < 26 || age > 30)) return false;
        if (candidateAgeFilter === "31-35" && (age < 31 || age > 35)) return false;
        if (candidateAgeFilter === "36-45" && (age < 36 || age > 45)) return false;
        if (candidateAgeFilter === "45+" && age < 45) return false;
      }

      // Marital status filter
      if (candidateMaritalFilter !== "all") {
        const m = String(prof.Marrige_status || "").toLowerCase();
        if (!m.includes(candidateMaritalFilter.toLowerCase())) return false;
      }

      // Diet filter
      if (candidateDietFilter !== "all") {
        if (String(prof.Vegeterian || "").toLowerCase() !== candidateDietFilter.toLowerCase()) {
          return false;
        }
      }

      // Manglik filter
      if (candidateManglikFilter !== "all") {
        const isManglik = Boolean(prof.Manglik);
        if (candidateManglikFilter === "manglik" && !isManglik) return false;
        if (candidateManglikFilter === "non-manglik" && isManglik) return false;
      }

      // Active status filter (user_data model)
      if (candidateActiveFilter !== "all") {
        const isActive = prof.Active !== false;
        if (candidateActiveFilter === "active" && !isActive) return false;
        if (candidateActiveFilter === "deactivated" && isActive) return false;
      }

      // Profession filter
      if (candidateProfessionFilter !== "all") {
        if (!String(prof.Profession || "").toLowerCase().includes(candidateProfessionFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [
    searchScope,
    myAddedUsers,
    allPlatformUsers,
    candidateSearchKeyword,
    candidateGenderFilter,
    candidateCasteFilter,
    candidateReligionFilter,
    candidateStateFilter,
    candidateDistrictFilter,
    candidateAgeFilter,
    candidateMaritalFilter,
    candidateDietFilter,
    candidateManglikFilter,
    candidateActiveFilter,
    candidateProfessionFilter,
  ]);

  const activeSearchFilterCount = useMemo(() => {
    let count = 0;
    if (candidateSearchKeyword.trim()) count++;
    if (candidateGenderFilter !== "all") count++;
    if (candidateCasteFilter !== "all") count++;
    if (candidateReligionFilter !== "all") count++;
    if (candidateStateFilter !== "all") count++;
    if (candidateDistrictFilter !== "all") count++;
    if (candidateAgeFilter !== "all") count++;
    if (candidateMaritalFilter !== "all") count++;
    if (candidateDietFilter !== "all") count++;
    if (candidateManglikFilter !== "all") count++;
    if (candidateActiveFilter !== "all") count++;
    if (candidateProfessionFilter !== "all") count++;
    return count;
  }, [
    candidateSearchKeyword,
    candidateGenderFilter,
    candidateCasteFilter,
    candidateReligionFilter,
    candidateStateFilter,
    candidateDistrictFilter,
    candidateAgeFilter,
    candidateMaritalFilter,
    candidateDietFilter,
    candidateManglikFilter,
    candidateActiveFilter,
    candidateProfessionFilter,
  ]);

  const paginatedSearchCandidates = useMemo(() => {
    const start = (searchPage - 1) * searchPageSize;
    return filteredSearchCandidates.slice(start, start + searchPageSize);
  }, [filteredSearchCandidates, searchPage, searchPageSize]);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [st, ca, pr, re, la, co, comm] = await Promise.all([
        User_StateGet().catch(() => []),
        User_CasteGet().catch(() => []),
        ProfessionGet().catch(() => []),
        ReligionGet().catch(() => []),
        LanguageGet().catch(() => []),
        ColorGet().catch(() => []),
        StaffCommissionGet().catch(() => null),
      ]);

      setStatesList(Array.isArray(st) ? st.filter((s) => s.Active !== false) : []);
      setCasteList(Array.isArray(ca) ? ca.filter((c) => c.Active !== false) : []);
      setProfessionList(Array.isArray(pr) ? pr.filter((p) => p.Active !== false) : []);
      setReligionList(Array.isArray(re) ? re.filter((r) => r.Active !== false) : []);
      setLanguageList(Array.isArray(la) ? la.filter((l) => l.Active !== false) : []);
      setColorList(Array.isArray(co) ? co.filter((c) => c.Active !== false) : []);

      if (comm && typeof comm === "object") {
        const rate = comm.Amount || comm.amount;
        if (rate) setActiveCommissionRate(rate);
      }
    } catch (err) {
      console.warn("Could not load dropdown datasets:", err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchStaffData(),
        fetchStaffUserAccount(),
        fetchReferenceData(),
        fetchTransactions(),
        fetchHelpQueries(),
        fetchAllSearchUsers(),
      ]);
      setLoading(false);
    };
    init();
  }, [
    fetchStaffData,
    fetchStaffUserAccount,
    fetchReferenceData,
    fetchTransactions,
    fetchHelpQueries,
    fetchAllSearchUsers,
  ]);

  useEffect(() => {
    fetchAddedUsers();
  }, [refCode, fetchAddedUsers]);

  useEffect(() => {
    fetchAllSearchUsers();
  }, [fetchAllSearchUsers]);

  // Live refresh of wallet and payout transactions whenever activeTab becomes transactions, withdrawal, or dashboard
  useEffect(() => {
    if (activeTab === "transactions" || activeTab === "withdrawal" || activeTab === "dashboard") {
      fetchTransactions();
      fetchStaffData();
    }
  }, [activeTab, fetchTransactions, fetchStaffData]);

  // Staff Profile Submission Handler
  const handleProfileSubmit = async (values) => {
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append("Staff_id", userId);
      formData.append("Full_Name", values.Full_Name || "");
      formData.append("WP_Contact", values.WP_Contact || "");
      formData.append("Age", values.Age ? parseInt(values.Age, 10) : "");
      formData.append("Full_Address", values.Full_Address || "");
      formData.append("District", values.District || "");
      formData.append("State", values.State || "");
      formData.append("City", values.City || "");
      formData.append("Country", values.Country || "India");
      formData.append("Email", values.Email || "");
      formData.append("Adhar_Number", values.Adhar_Number || "");
      formData.append("PAN_Number", values.PAN_Number || "");
      formData.append("Bank_Name", values.Bank_Name || "");
      formData.append("Bank_Account_Number", values.Bank_Account_Number || "");
      formData.append("Bank_IFSC_Code", values.Bank_IFSC_Code || "");
      formData.append("Bank_Account_Holder_Name", values.Bank_Account_Holder_Name || "");
      formData.append("UPI_ID", values.UPI_ID || "");

      if (profilePicFile) formData.append("Profile_Pic", profilePicFile);
      if (adharFile) formData.append("Adhar_Image", adharFile);
      if (panFile) formData.append("PAN_Image", panFile);
      if (passbookFile) formData.append("Bank_Passbook_Image", passbookFile);

      if (hasProfile && staffProfile?.id) {
        await StaffDataUpdate(staffProfile.id, formData);
        message.success("Profile saved successfully. Admin approval pending.");
      } else {
        await StaffDataPost(formData);
        message.success("Staff profile submitted for Admin review.");
      }

      setIsEditingProfile(false);
      await fetchStaffData();
    } catch (err) {
      console.error("Profile save error:", err);
      message.error(err.response?.data?.detail || "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Candidate Registration Flow with OTP
  const handleCandSendOTP = async (e) => {
    if (e) e.preventDefault();
    setCandPhoneError("");

    if (!isApprovedStaff) {
      message.warning("Admin approval pending. You can onboard members once approved.");
      return;
    }

    const cleanPhone = String(candPhone || "").trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      setCandPhoneError("Enter a valid 10-digit mobile number.");
      return;
    }

    setCandLoading(true);
    try {
      await API.post("send-otp/", { Contact: cleanPhone });
      message.success(`OTP sent to +91 ${cleanPhone}`);
      setCandidateStep(1);
      startCandCountdown();
      setTimeout(() => candOtpRefs.current[0]?.focus(), 120);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.Contact?.[0] ||
        "Failed to send OTP.";
      setCandPhoneError(msg);
      message.error(msg);
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
      [...pasted].forEach((ch, i) => (updated[i] = ch));
      setCandOtp(updated);
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
      message.success("OTP resent successfully.");
      startCandCountdown();
      setTimeout(() => candOtpRefs.current[0]?.focus(), 100);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to resend OTP.";
      message.error(msg);
    } finally {
      setCandLoading(false);
    }
  };

  const handleCandVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = candOtp.join("");
    setCandOtpError("");

    if (fullOtp.length < 6) {
      setCandOtpError("Enter the complete 6-digit OTP.");
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
      message.success("Mobile verified. Set candidate password.");

      const defaultPass = "Vm@" + candPhone.trim().slice(-4);
      if (!candPassword) {
        setCandPassword(defaultPass);
        setCandConfirmPassword(defaultPass);
      }
      setCandidateStep(2);
    } catch (err) {
      const msg = err.response?.data?.error || "Invalid OTP code.";
      setCandOtpError(msg);
      message.error(msg);
    } finally {
      setCandLoading(false);
    }
  };

  const handleCandCreateAccount = async (e) => {
    if (e) e.preventDefault();
    setCandPasswordError("");

    if (!candPassword) {
      setCandPasswordError("Password is required.");
      return;
    }
    if (candPassword.length < 8) {
      setCandPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (candPassword !== candConfirmPassword) {
      setCandPasswordError("Passwords do not match.");
      return;
    }

    const fullOtp = candOtp.join("");
    setCandLoading(true);
    try {
      const effectiveCode = (refCode || storedRefCode || "").trim();
      const res = await API.post("verify-otp/", {
        Contact: candPhone.trim(),
        OTP: fullOtp,
        password: candPassword,
        Refered_By: effectiveCode || undefined,
        Role: "user",
      });

      const userObj = res?.data?.user || res?.data || {};
      setCandidateCreatedUser(userObj);
      message.success("Candidate account created.");

      setCandidateStep(3);
      fetchAddedUsers();
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Failed to create candidate account.";
      setCandPasswordError(msg);
      message.error(msg);
    } finally {
      setCandLoading(false);
    }
  };

  const handleCandProfileSubmit = async (values) => {
    if (!candidateCreatedUser?.id) {
      message.error("Candidate account reference missing.");
      return;
    }

    setCandLoading(true);
    try {
      const formData = new FormData();
      formData.append("User_id", candidateCreatedUser.id);
      formData.append("Full_Name", values.Full_Name || "");
      formData.append("Gender", values.Gender || "Male");
      if (values.DOB) formData.append("DOB", values.DOB);
      if (values.Age) formData.append("Age", parseInt(values.Age, 10));
      formData.append("Marrige_status", values.Marrige_status || "Never Married");
      formData.append("Vegeterian", values.Vegeterian || "Vegeterian");
      formData.append("Religion", values.Religion || "");
      formData.append("Caste", values.Caste || "");
      formData.append("Gotra", values.Gotra || "");
      formData.append("Mother_tongue", values.Mother_tongue || "");
      formData.append("Height", values.Height || "");
      formData.append("Color", values.Color || "");
      formData.append("Qualification", values.Qualification || "");
      formData.append("Profession", values.Profession || "");
      if (values.Salary) formData.append("Salary", parseInt(values.Salary, 10));
      formData.append("WP_Contact", values.WP_Contact || candPhone.trim());
      formData.append("State", values.State || "");
      formData.append("District", values.District || "");
      formData.append("City", values.City || "");
      formData.append("Full_Address", values.Full_Address || "");
      formData.append("Active", "true");

      if (candProfilePicFile) {
        formData.append("Profile_Pic", candProfilePicFile);
      }

      await API.post("user-data/", formData);
      message.success("Candidate biodata saved.");

      handleResetAddUser();
      fetchAddedUsers();
      fetchStaffData();
      fetchTransactions();
      switchTab("myusers");
    } catch (err) {
      console.error("Biodata submission error:", err);
      message.error(err.response?.data?.detail || "Failed to save biodata.");
    } finally {
      setCandLoading(false);
    }
  };

  const handleSkipProfile = () => {
    message.info("Candidate account registered. Biodata can be filled later from 'My Members'.");
    handleResetAddUser();
    fetchAddedUsers();
    switchTab("myusers");
  };

  const handleOpenBiodataModal = async (u) => {
    if (!u) return;
    setSelectedBiodataUser(u);
    setBiodataModalVisible(true);
    try {
      const profId = u.profile?.id || u.profile_id || u.user_data_id;
      if (profId) {
        const res = await API.get(`user-data/${profId}/`).catch(() => null);
        if (res && res.data) {
          setSelectedBiodataUser((prev) => ({
            ...(prev || {}),
            profile: { ...(prev?.profile || {}), ...res.data },
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch fresh candidate biodata from backend:", err);
    }
  };

  // Sync candidate biodata form WP_Contact when candidate Step 3 is mounted
  useEffect(() => {
    if (candidateStep === 3 && candPhone) {
      candidateProfileForm.setFieldsValue({
        WP_Contact: candPhone.trim(),
      });
    }
  }, [candidateStep, candPhone, candidateProfileForm]);

  const handleResetAddUser = () => {
    setCandidateStep(0);
    setCandPhone("");
    setCandPhoneError("");
    setCandOtp(Array(6).fill(""));
    setCandOtpError("");
    setCandPassword("");
    setCandConfirmPassword("");
    setCandPasswordError("");
    setCandidateCreatedUser(null);
    setCandProfilePicFile(null);
    if (candidateStep === 3) {
      candidateProfileForm.resetFields();
    }
    if (candTimerRef.current) clearInterval(candTimerRef.current);
  };

  const handleCandidateStateSelect = (stateName) => {
    const found = statesList.find((s) => s.State === stateName);
    setCandidateDistricts(found?.Districts || []);
    candidateProfileForm.setFieldsValue({ District: undefined });
  };


  // Withdrawal Submission Handler (Simplified - No bank selection needed)
  const handleWithdrawSubmit = async () => {
    if (!isApprovedStaff) {
      message.warning("Admin approval pending. Withdrawals are temporarily unavailable.");
      return;
    }

    const amt = parseInt(withdrawAmount, 10);
    if (!amt || amt <= 0) {
      message.error("Please enter a valid withdrawal amount.");
      return;
    }
    if (amt > walletAmount) {
      message.error(`Insufficient balance. Available: ₹${walletAmount}`);
      return;
    }
    if (amt < 100) {
      message.warning("Minimum withdrawal amount is ₹100.");
      return;
    }

    setWithdrawing(true);
    try {
      const res = await StaffTransactionsPost({
        Staff_id: userId,
        Amount: amt,
        Type: "Withdrawal",
        Status: "Pending",
        Msg: withdrawNote ? withdrawNote.trim() : `Withdrawal request of ₹${amt} submitted to Admin.`,
      });

      if (res && !res.error) {
        message.success(`Withdrawal request of ₹${amt} submitted to Admin for approval.`);
        const remaining =
          res.remaining_amount !== undefined
            ? res.remaining_amount
            : Math.max(0, walletAmount - amt);
        setWalletAmount(remaining);
        localStorage.setItem("amount", String(remaining));
        setWithdrawModalVisible(false);
        setWithdrawAmount("");
        setWithdrawNote("");
        fetchTransactions();
        fetchStaffData();
      } else {
        const err = res?.error || "Withdrawal request failed.";
        message.error(typeof err === "string" ? err : JSON.stringify(err));
      }
    } catch (err) {
      console.error("Withdraw error:", err);
      message.error(err.response?.data?.error || "Failed to submit withdrawal request.");
    } finally {
      setWithdrawing(false);
    }
  };

  // Admin Payout Review Handlers (Approve / Reject with auto-refund / Update Msg)
  const handleOpenAdminAction = (txn, actionType) => {
    setSelectedAdminTxn(txn);
    setAdminActionType(actionType);
    setAdminTxnMsg(txn.Msg || "");
    setAdminActionModalVisible(true);
  };

  const handleConfirmAdminAction = async () => {
    if (!selectedAdminTxn) return;
    setSubmittingAdminAction(true);
    try {
      let newStatus = selectedAdminTxn.Status;
      if (adminActionType === "approve") {
        newStatus = "Approved";
      } else if (adminActionType === "reject") {
        newStatus = "Rejected";
      }
      const payload = {
        Status: newStatus,
        Msg: adminTxnMsg.trim(),
      };
      const res = await StaffTransactionsUpdate(selectedAdminTxn.id, payload);
      if (res && res.error) {
        message.error(res.error || "Action failed.");
      } else {
        message.success(
          adminActionType === "approve"
            ? `Withdrawal of ₹${selectedAdminTxn.Amount} approved successfully!`
            : adminActionType === "reject"
            ? `Withdrawal rejected and ₹${selectedAdminTxn.Amount} refunded to staff wallet.`
            : "Transaction details updated successfully!"
        );
        setAdminActionModalVisible(false);
        setSelectedAdminTxn(null);
        setAdminTxnMsg("");
        fetchTransactions();
        fetchStaffData();
      }
    } catch (err) {
      console.error("Admin action error:", err);
      message.error("Failed to process transaction review.");
    } finally {
      setSubmittingAdminAction(false);
    }
  };

  // Candidate State & DOB helper handlers
  const handleCandidateDobChange = (dobValue) => {
    if (!dobValue) return;
    const bDate = new Date(dobValue);
    if (!Number.isNaN(bDate.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - bDate.getFullYear();
      const m = today.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
        age--;
      }
      if (age >= 18 && age <= 100) {
        candidateProfileForm.setFieldsValue({ Age: age });
      }
    }
  };

  // Dedicated Password Modal Handlers (Points to User Model)
  const handleOpenPasswordModal = (userObj) => {
    setPasswordTargetUser(userObj);
    setPasswordModalVisible(true);
  };

  const handleSaveUserPassword = async (values) => {
    if (!passwordTargetUser?.id) return;
    if (values.new_password !== values.confirm_password) {
      message.error("New password and confirmation do not match!");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await UserUpdate(passwordTargetUser.id, {
        password: values.new_password.trim(),
      });
      if (res && res.error) {
        message.error(res.error || "Failed to update user password.");
      } else {
        message.success(
          `Password for candidate #${passwordTargetUser.id} updated successfully!`
        );
        setPasswordModalVisible(false);
        setPasswordTargetUser(null);
      }
    } catch (err) {
      console.error("Password update error:", err);
      message.error(err.response?.data?.detail || "Failed to update user password.");
    } finally {
      setSavingPassword(false);
    }
  };




  // Single Deactivate / Activate Button Handler
  const handleToggleCandidateActive = async (userObj, makeActive) => {
    const profId = userObj.profile?.id;
    if (!profId) {
      message.warning("Candidate does not have a matrimonial biodata profile to activate or deactivate.");
      return;
    }
    try {
      await UserDataToggleActive(profId, makeActive);
      message.success(
        `Candidate #${userObj.id} profile is now ${makeActive ? "Active 🟢" : "Deactivated 🔴"}`
      );
      // Immediately reflect in UI state
      setMyAddedUsers((prev) =>
        prev.map((item) =>
          item.id === userObj.id
            ? { ...item, profile: item.profile ? { ...item.profile, Active: makeActive } : item.profile }
            : item
        )
      );
      setAllPlatformUsers((prev) =>
        prev.map((item) =>
          item.id === userObj.id
            ? { ...item, profile: item.profile ? { ...item.profile, Active: makeActive } : item.profile }
            : item
        )
      );
      if (selectedBiodataUser && selectedBiodataUser.id === userObj.id) {
        setSelectedBiodataUser((prev) => ({
          ...prev,
          profile: prev?.profile ? { ...prev.profile, Active: makeActive } : prev?.profile,
        }));
      }
      if (selectedUserDetail && selectedUserDetail.id === userObj.id) {
        setSelectedUserDetail((prev) => ({
          ...prev,
          profile: prev?.profile ? { ...prev.profile, Active: makeActive } : prev?.profile,
        }));
      }
      fetchAddedUsers();
      fetchAllSearchUsers();
    } catch (err) {
      console.error("Toggle error:", err);
      message.error("Failed to toggle profile status.");
    }
  };

  // Help & Support Inquiry (Using Help model with Role="staff")
  const handleSendHelpQuery = async () => {
    if (!newQuestion.trim()) {
      message.warning("Please enter your inquiry.");
      return;
    }
    setSubmittingHelp(true);
    try {
      await HelpPost({
        Question: newQuestion.trim(),
        User_Role: "staff",
        Role: "staff",
        User_id: userId,
      });
      message.success("Inquiry submitted to Admin.");
      setNewQuestion("");
      fetchHelpQueries();
    } catch (err) {
      console.error("Help submit error:", err);
      message.error("Failed to submit inquiry.");
    } finally {
      setSubmittingHelp(false);
    }
  };

  const handleSendCounselorReply = async () => {
    if (!selectedHelpItem?.id || !counselorReplyText.trim()) {
      message.warning("Please enter your reply.");
      return;
    }
    setSendingReply(true);
    try {
      await HelpUpdate(selectedHelpItem.id, {
        Answer: counselorReplyText.trim(),
        Reply_By: userId,
      });
      message.success("Reply sent to candidate.");
      setReplyModalVisible(false);
      setSelectedHelpItem(null);
      setCounselorReplyText("");
      fetchHelpQueries();
    } catch (err) {
      console.error("Reply error:", err);
      message.error("Failed to send reply.");
    } finally {
      setSendingReply(false);
    }
  };

  const handleLogout = () => {
    Modal.confirm({
      title: "Confirm Logout",
      icon: <ExclamationCircleOutlined style={{ color: "#ef4444" }} />,
      content: "Are you sure you want to log out of the Staff Portal?",
      okText: "Yes, Logout",
      okType: "danger",
      cancelText: "Cancel",
      onOk() {
        localStorage.clear();
        message.success("Logged out successfully.");
        navigate("/StaffLogin");
      },
    });
  };

  const copyRawReferralCode = () => {
    if (!refCode) return;
    navigator.clipboard.writeText(refCode);
    setCopiedCode(true);
    message.success(`Staff Code ${refCode} copied.`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyReferralLink = () => {
    if (!refCode) return;
    const link = `${window.location.origin}/UserRegister/${refCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    message.success("Registration link copied.");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareReferralWhatsApp = () => {
    if (!refCode) return;
    const link = `${window.location.origin}/UserRegister/${refCode}`;
    const text = `नमस्कार! वैवाहिक मंच (Vaivaheek Manch) पर अपना निःशुल्क विवाह प्रोफाइल बनाएं या अपने मनपसंद जीवनसाथी की तलाश करें।\n\nसीधे रजिस्टर करने के लिए यहाँ क्लिक करें:\n🔗 ${link}\n\nया रजिस्ट्रेशन के समय मेरा स्टाफ कोड दर्ज करें: *${refCode}*`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Filtered lists
  const filteredAddedUsers = useMemo(() => {
    if (!userSearchText.trim()) return myAddedUsers;
    const query = userSearchText.toLowerCase();
    return myAddedUsers.filter((u) => {
      const uId = String(u.id || "");
      const phone = String(u.Contact || u.username || "").toLowerCase();
      const name = String(u.profile?.Full_Name || u.first_name || "").toLowerCase();
      const city = String(u.profile?.City || "").toLowerCase();
      return (
        uId.includes(query) ||
        phone.includes(query) ||
        name.includes(query) ||
        city.includes(query)
      );
    });
  }, [myAddedUsers, userSearchText]);

  const filteredTransactions = useMemo(() => {
    if (txFilter === "commission") {
      return transactionsList.filter(
        (t) => (t.Type || "").toLowerCase() === "commission"
      );
    }
    if (txFilter === "withdrawal") {
      return transactionsList.filter(
        (t) => (t.Type || "").toLowerCase() === "withdrawal"
      );
    }
    return transactionsList;
  }, [transactionsList, txFilter]);

  const withdrawalsList = useMemo(() => {
    return transactionsList.filter(
      (t) => (t.Type || "").toLowerCase() === "withdrawal"
    );
  }, [transactionsList]);

  // Help tickets split: Staff raised to admin vs Candidates assigned to counselor
  const staffAdminTickets = useMemo(() => {
    return helpQueries.filter(
      (h) =>
        String(h.User_id) === String(userId) ||
        String(h.User_id?.id) === String(userId)
    );
  }, [helpQueries, userId]);

  const candidateInquiries = useMemo(() => {
    return helpQueries.filter((h) => {
      const isNotSelf =
        String(h.User_id) !== String(userId) &&
        String(h.User_id?.id) !== String(userId);
      if (!isNotSelf) return false;
      return (
        String(h.Target_User) === String(userId) ||
        String(h.Target_User?.id) === String(userId) ||
        String(h.Reply_By) === String(userId) ||
        String(h.Reply_By?.id) === String(userId) ||
        (h.Role || "").toLowerCase() === "staff" ||
        !h.Target_User
      );
    });
  }, [helpQueries, userId]);

  const pendingCandidateInquiriesCount = useMemo(() => {
    return candidateInquiries.filter((q) => !q.Answer).length;
  }, [candidateInquiries]);

  // Track seen Help & Support items for staff (unseen count only in side menu)
  const [seenStaffHelpIds, setSeenStaffHelpIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`stp_seen_help_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const unseenStaffHelpCount = useMemo(() => {
    // 1. Unanswered candidate inquiries not yet seen by staff
    const unseenCandidate = candidateInquiries.filter(
      (q) => !q.Answer && !seenStaffHelpIds.includes(String(q.id))
    ).length;

    // 2. Admin answers to staff's own tickets not yet seen by staff
    const unseenAdminReplies = staffAdminTickets.filter(
      (h) => h.Answer && h.Answer.trim() && !seenStaffHelpIds.includes(String(h.id))
    ).length;

    return unseenCandidate + unseenAdminReplies;
  }, [candidateInquiries, staffAdminTickets, seenStaffHelpIds]);

  // When staff opens or is on Help & Support tab, mark current items as seen
  useEffect(() => {
    if (activeTab === "help") {
      const activePendingCandidateIds = candidateInquiries
        .filter((q) => !q.Answer)
        .map((q) => String(q.id));
      const activeAnsweredStaffIds = staffAdminTickets
        .filter((h) => h.Answer && h.Answer.trim())
        .map((h) => String(h.id));

      const allActiveIds = [...activePendingCandidateIds, ...activeAnsweredStaffIds];
      if (allActiveIds.length > 0) {
        setSeenStaffHelpIds((prev) => {
          const merged = Array.from(new Set([...prev, ...allActiveIds]));
          if (merged.length !== prev.length) {
            try {
              localStorage.setItem(
                `stp_seen_help_${userId}`,
                JSON.stringify(merged)
              );
            } catch (e) {
              console.error("Failed to save seen staff tickets:", e);
            }
            return merged;
          }
          return prev;
        });
      }
    }
  }, [activeTab, candidateInquiries, staffAdminTickets, userId]);

  const totalCommissionEarned = useMemo(() => {
    return transactionsList
      .filter((t) => (t.Type || "").toLowerCase() === "commission")
      .reduce((sum, t) => sum + (Number(t.Amount) || 0), 0);
  }, [transactionsList]);

  const totalWithdrawn = useMemo(() => {
    return transactionsList
      .filter(
        (t) =>
          (t.Type || "").toLowerCase() === "withdrawal" &&
          (t.Status || "").toLowerCase() !== "rejected" &&
          (t.Status || "").toLowerCase() !== "failed"
      )
      .reduce((sum, t) => sum + (Number(t.Amount) || 0), 0);
  }, [transactionsList]);

  const avatarUrl = staffProfile?.Profile_Pic
    ? getMediaUrl(staffProfile.Profile_Pic)
    : "";

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#f8fafc",
          gap: 16,
        }}
      >
        <Spin size="large" />
        <span style={{ fontSize: 15, fontWeight: 700, color: "#064e3b" }}>
          Loading Staff Portal...
        </span>
      </div>
    );
  }

  // Navigation Items Definition
  const navItems = [
    {
      category: "Overview",
      items: [
        {
          key: "dashboard",
          label: "Dashboard",
          icon: <HomeOutlined />,
        },
      ],
    },
    {
      category: "Staff Management",
      items: [
        {
          key: "profile",
          label: "Profile & KYC",
          icon: <IdcardFilled />,
          badge: null,
        },
        {
          key: "adduser",
          label: "Add Member (OTP)",
          icon: <UserAddOutlined />,
          badge: null,
        },
        {
          key: "myusers",
          label: "My Members",
          icon: <TeamOutlined />,
          badge: null,
        },
        {
          key: "usersearch",
          label: "User Search",
          icon: <SearchOutlined />,
          badge: null,
        },
      ],
    },
    {
      category: "Financials",
      items: [
        {
          key: "transactions",
          label: "Payout & Transactions",
          icon: <WalletOutlined />,
          badge: null,
        },
      ],
    },
    {
      category: "Support",
      items: [
        {
          key: "help",
          label: "Help & Support",
          icon: <CustomerServiceOutlined />,
          badge: unseenStaffHelpCount > 0 ? String(unseenStaffHelpCount) : null,
        },
      ],
    },
  ];

  return (
    <div className="stp-container">
      {/* ============================================================== */}
      {/* 1. DESKTOP SIDEBAR */}
      {/* ============================================================== */}
      <aside className="stp-sidebar">
        {/* Brand Header */}
        <div className="stp-sidebar-header">
          <div className="stp-brand-logo">
            <IdcardFilled />
          </div>
          <div className="stp-brand-info">
            <h3>वैवाहिक मंच</h3>
            <p>Staff Portal</p>
          </div>
        </div>

        {/* Staff User Card */}
        <div className="stp-sidebar-user">
          <div className="stp-user-avatar-wrap">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <IdcardFilled />
            )}
          </div>
          <div className="stp-user-meta">
            <div className="stp-user-name">
              {staffProfile?.Full_Name || storedUsername || "Staff Counselor"}
            </div>
            <div className="stp-user-caste">
              Staff Code: <strong>{refCode || "—"}</strong>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="stp-nav-list">
          {navItems.map((group) => (
            <div key={group.category}>
              <div className="stp-nav-category">{group.category}</div>
              {group.items.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <div
                    key={item.key}
                    className={`stp-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => switchTab(item.key)}
                  >
                    <span className="stp-nav-icon">{item.icon}</span>
                    <span className="stp-nav-text">{item.label}</span>
                    {item.badge && (
                      <span className="stp-nav-badge">{item.badge}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="stp-sidebar-footer">
          {refCode && !isDeactivated && (
            <Button
              type="text"
              icon={<ShareAltOutlined />}
              onClick={() => setShareModalVisible(true)}
              style={{
                color: "#059669",
                fontWeight: "700",
                textAlign: "left",
                justifyContent: "flex-start",
                borderRadius: "10px",
              }}
            >
              Share Referral Link
            </Button>
          )}
          <button
            type="button"
            className="stp-home-btn"
            onClick={() => navigate("/")}
          >
            <HomeOutlined /> Homepage
          </button>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{
              color: "#ef4444",
              fontWeight: "700",
              textAlign: "left",
              justifyContent: "flex-start",
              borderRadius: "10px",
            }}
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* 2. MOBILE TOP HEADER (Matches ServicePanel Architecture)        */}
      {/* ============================================================== */}
      <header className="stp-mobile-header">
        <div className="stp-mobile-brand">
          <div className="stp-mobile-logo-badge">
            <IdcardFilled />
          </div>
          <div>
            <div className="stp-mobile-title">वैवाहिक मंच</div>
            <div className="stp-mobile-subtitle">Staff Counselor</div>
          </div>
        </div>
        <div className="stp-mobile-actions">
          <button
            type="button"
            className="stp-mobile-wallet-btn"
            onClick={() => switchTab("withdrawal")}
            title="Wallet Balance"
          >
            <WalletOutlined /> ₹{walletAmount}
          </button>
          {refCode && !isDeactivated && (
            <button
              type="button"
              className="stp-mobile-menu-btn"
              onClick={() => setShareModalVisible(true)}
              title="Share Referral Link"
            >
              <ShareAltOutlined />
            </button>
          )}
          <button
            type="button"
            className="stp-mobile-menu-btn"
            onClick={() => setMobileDrawerOpen(true)}
            title="Open Menu"
          >
            <MenuOutlined />
            {candidateInquiries.filter((q) => !q.Answer).length > 0 && (
              <span className="stp-mobile-menu-dot" />
            )}
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 3. MOBILE SLIDE-OUT DRAWER */}
      {/* ============================================================== */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>💼</span>
            <div>
              <div style={{ fontWeight: "900", color: "#064e3b", fontSize: "15px", lineHeight: "1.2" }}>
                वैवाहिक मंच
              </div>
              <div style={{ fontSize: "9px", color: "#059669", fontWeight: "700", letterSpacing: "0.8px" }}>
                STAFF PORTAL
              </div>
            </div>
          </div>
        }
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        styles={{ body: { padding: "12px 14px" } }}
      >
        {/* Middle Vertical Close Arrow Button (Mobile Drawer) */}
        <button
          type="button"
          className="stp-drawer-close-btn"
          onClick={() => setMobileDrawerOpen(false)}
          title="Close Side Menu"
          aria-label="Close Side Menu"
        >
          <LeftOutlined />
        </button>
        <div className="stp-sidebar-user" style={{ margin: "0 0 12px" }}>
          <div className="stp-user-avatar-wrap">
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" /> : <IdcardFilled />}
          </div>
          <div className="stp-user-meta">
            <div className="stp-user-name">
              {staffProfile?.Full_Name || storedUsername || "Staff Counselor"}
            </div>
            <div className="stp-user-caste">
              Staff Code: <strong>{refCode || "—"}</strong>
            </div>
          </div>
        </div>



        <div className="stp-nav-list" style={{ padding: 0 }}>
          {navItems.map((group) => (
            <div key={group.category}>
              <div className="stp-nav-category">{group.category}</div>
              {group.items.map((item) => (
                <div
                  key={item.key}
                  className={`stp-nav-item ${activeTab === item.key ? "active" : ""}`}
                  onClick={() => switchTab(item.key)}
                >
                  <span className="stp-nav-icon">{item.icon}</span>
                  <span className="stp-nav-text">{item.label}</span>
                  {item.badge && <span className="stp-nav-badge">{item.badge}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>

        <Divider style={{ margin: "16px 0 12px" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {refCode && !isDeactivated && (
            <Button
              type="text"
              icon={<ShareAltOutlined />}
              onClick={() => {
                setMobileDrawerOpen(false);
                setShareModalVisible(true);
              }}
              style={{
                color: "#059669",
                fontWeight: "700",
                textAlign: "left",
                justifyContent: "flex-start",
              }}
            >
              Share Referral Link
            </Button>
          )}
          <button
            type="button"
            className="stp-home-btn"
            style={{ marginBottom: 4 }}
            onClick={() => {
              setMobileDrawerOpen(false);
              navigate("/");
            }}
          >
            <HomeOutlined /> Homepage
          </button>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{
              color: "#ef4444",
              fontWeight: "700",
              textAlign: "left",
              justifyContent: "flex-start",
            }}
          >
            Logout
          </Button>
        </div>
      </Drawer>

      {/* ============================================================== */}
      {/* 4. MAIN CONTENT AREA */}
      {/* ============================================================== */}
      <main className="stp-main">
        {/* Top Executive Staff Banner */}
        <section className="stp-top-banner">
          <div className="stp-top-banner-row">
            <div className="stp-top-banner-left">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="stp-top-avatar" />
              ) : (
                <div className="stp-top-avatar">
                  <IdcardFilled />
                </div>
              )}
              <div>
                <h1 className="stp-top-name">
                  {staffProfile?.Full_Name || storedUsername || "Staff Counselor"}
                  {isApprovedStaff && (
                    <SafetyCertificateFilled
                      style={{ color: "#34d399", fontSize: 18 }}
                      title="Verified Staff Member"
                    />
                  )}
                </h1>
                <div className="stp-top-sub-pills">
                  {isApprovedStaff ? (
                    <span className="stp-top-sub-pill" style={{ background: "rgba(16, 185, 129, 0.25)", borderColor: "#10b981" }}>
                      <CheckCircleFilled /> Active &amp; Approved 🟢
                    </span>
                  ) : (
                    <span className="stp-top-sub-pill" style={{ background: "rgba(245, 158, 11, 0.25)", borderColor: "#f59e0b" }}>
                      <ClockCircleFilled /> Admin Approval Pending
                    </span>
                  )}

                  <span className="stp-top-sub-pill">
                    <PhoneOutlined /> +91 {storedContact}
                  </span>
                  {refCode && (
                    <span className="stp-top-sub-pill">
                      <KeyOutlined /> Code: <strong>{refCode}</strong>
                    </span>
                  )}
                  {activeCommissionRate && isApprovedStaff && (
                    <span
                      className="stp-top-sub-pill"
                      style={{ background: "#f59e0b", borderColor: "#d97706" }}
                    >
                      💰 ₹{activeCommissionRate} / Member Onboarding
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="stp-top-stats">
              <div
                className="stp-top-stat-card"
                onClick={() => switchTab("myusers")}
                title="View added members"
              >
                <div className="stp-top-stat-val">{myAddedUsers.length}</div>
                <div className="stp-top-stat-lbl">Members Added</div>
              </div>
              <div
                className="stp-top-stat-card"
                onClick={() => switchTab("withdrawal")}
                title="View wallet & payout"
              >
                <div className="stp-top-stat-val">₹{walletAmount}</div>
                <div className="stp-top-stat-lbl">Wallet Balance</div>
              </div>
              <div
                className="stp-top-stat-card"
                onClick={() => switchTab("transactions")}
                title="View transactions"
              >
                <div className="stp-top-stat-val">{transactionsList.length}</div>
                <div className="stp-top-stat-lbl">Transactions</div>
              </div>
            </div>
          </div>

          {/* Referral Sharing Strip */}
          {refCode && !isDeactivated && (
            <div className="stp-ref-share-strip">
              <div className="stp-ref-code-box">
                <span className="stp-ref-code-label">Staff Code:</span>
                <span className="stp-ref-code-text">{refCode}</span>
              </div>
              <div className="stp-ref-share-buttons">
                <button
                  type="button"
                  className="stp-share-btn"
                  onClick={copyRawReferralCode}
                  title="Copy staff code"
                >
                  {copiedCode ? <CheckOutlined /> : <CopyOutlined />}{" "}
                  {copiedCode ? "Copied" : "Copy Code"}
                </button>
                <button
                  type="button"
                  className="stp-share-btn"
                  onClick={copyReferralLink}
                  title="Copy candidate registration URL"
                >
                  {copiedLink ? <CheckOutlined /> : <CopyOutlined />}{" "}
                  {copiedLink ? "Copied" : "Copy Link"}
                </button>
                <button
                  type="button"
                  className="stp-share-btn"
                  onClick={() => setShareModalVisible(true)}
                  title="Share referral link options"
                >
                  <ShareAltOutlined /> Share Link
                </button>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Register on Vaivaheek Manch Matrimony with my staff code ${refCode}: ${window.location.origin}/UserRegister/${refCode}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="stp-share-btn-wa"
                  title="Share on WhatsApp"
                >
                  <WhatsAppOutlined /> WhatsApp
                </a>
              </div>
            </div>
          )}
        </section>

        {/* ============================================================== */}
        {/* TAB 0: DASHBOARD (Professional, Easy Overview) */}
        {/* ============================================================== */}
        {activeTab === "dashboard" && (
          <div>
            {/* Top Stat Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 22 }}>
              <Col xs={24} sm={12} lg={8}>
                <div
                  className="stp-card"
                  style={{
                    padding: "18px 20px",
                    background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)",
                    border: "1.5px solid #a7f3d0",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                  onClick={() => switchTab("transactions")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#047857", textTransform: "uppercase" }}>
                        Wallet Balance
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: "#065f46", margin: "6px 0 2px" }}>
                        ₹{walletAmount}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#059669", fontWeight: 600 }}>
                        Referral earnings ready for payout
                      </div>
                    </div>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "#10b981",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                      }}
                    >
                      <WalletOutlined />
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      size="small"
                      type="primary"
                      className="stp-btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        switchTab("transactions");
                      }}
                    >
                      Withdraw Payout <ArrowRightOutlined />
                    </Button>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <div
                  className="stp-card"
                  style={{
                    padding: "18px 20px",
                    background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)",
                    border: "1.5px solid #bfdbfe",
                    cursor: "pointer",
                  }}
                  onClick={() => switchTab("myusers")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>
                        Members Managed
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: "#1e40af", margin: "6px 0 2px" }}>
                        {myAddedUsers.length}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#2563eb", fontWeight: 600 }}>
                        Referred candidates onboarded
                      </div>
                    </div>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "#3b82f6",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                      }}
                    >
                      <TeamOutlined />
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <Button
                      size="small"
                      icon={<SearchOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        switchTab("usersearch");
                      }}
                    >
                      User Search
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      style={{ background: "#2563eb", borderColor: "#2563eb" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        switchTab("adduser");
                      }}
                    >
                      Add Member <UserAddOutlined />
                    </Button>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <div
                  className="stp-card"
                  style={{
                    padding: "18px 20px",
                    background: pendingCandidateInquiriesCount > 0
                      ? "linear-gradient(135deg, #fdf2f8 0%, #ffffff 100%)"
                      : "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
                    border: pendingCandidateInquiriesCount > 0 ? "1.5px solid #fbcfe8" : "1.5px solid #bbf7d0",
                    cursor: "pointer",
                  }}
                  onClick={() => switchTab("help")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: pendingCandidateInquiriesCount > 0 ? "#be185d" : "#047857",
                          textTransform: "uppercase",
                        }}
                      >
                        Help &amp; Inquiries
                      </div>
                      <div
                        style={{
                          fontSize: 26,
                          fontWeight: 900,
                          color: pendingCandidateInquiriesCount > 0 ? "#9d174d" : "#065f46",
                          margin: "6px 0 2px",
                        }}
                      >
                        {pendingCandidateInquiriesCount}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: pendingCandidateInquiriesCount > 0 ? "#db2777" : "#059669",
                          fontWeight: 600,
                        }}
                      >
                        {pendingCandidateInquiriesCount > 0
                          ? `${pendingCandidateInquiriesCount} ticket${pendingCandidateInquiriesCount === 1 ? "" : "s"} require reply`
                          : `0 pending (${candidateInquiries.length} total resolved)`}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: pendingCandidateInquiriesCount > 0 ? "#ec4899" : "#10b981",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                      }}
                    >
                      <CustomerServiceOutlined />
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        switchTab("help");
                      }}
                    >
                      Open Desk <SendOutlined />
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Quick Actions Grid */}
            <div className="stp-card" style={{ marginBottom: 22 }}>
              <div className="stp-card-header" style={{ marginBottom: 16 }}>
                <div>
                  <h3 className="stp-card-title">⚡ Quick Actions &amp; Navigation</h3>
                  <p className="stp-card-desc">Direct access to manage staff workflow, candidates, and financial payouts.</p>
                </div>
              </div>
              <div className="stp-action-grid">
                <div className="stp-action-card" onClick={() => switchTab("adduser")}>
                  <div className="stp-action-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
                    <UserAddOutlined />
                  </div>
                  <div>
                    <div className="stp-action-title">Add New User</div>
                    <div className="stp-action-desc">Register candidate via mobile OTP &amp; setup initial profile</div>
                  </div>
                </div>

                <div className="stp-action-card" onClick={() => switchTab("myusers")}>
                  <div className="stp-action-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                    <TeamOutlined />
                  </div>
                  <div>
                    <div className="stp-action-title">Manage Members</div>
                    <div className="stp-action-desc">View registered candidate biodatas and manage access</div>
                  </div>
                </div>

                <div className="stp-action-card" onClick={() => switchTab("withdrawal")}>
                  <div className="stp-action-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                    <WalletOutlined />
                  </div>
                  <div>
                    <div className="stp-action-title">Request Withdrawal</div>
                    <div className="stp-action-desc">Withdraw referral earnings to your verified Bank or UPI</div>
                  </div>
                </div>

                <div className="stp-action-card" onClick={() => switchTab("transactions")}>
                  <div className="stp-action-icon" style={{ background: "#f3e8ff", color: "#7c3aed" }}>
                    <HistoryOutlined />
                  </div>
                  <div>
                    <div className="stp-action-title">Transaction Details</div>
                    <div className="stp-action-desc">Check payout statuses, history, and commission statements</div>
                  </div>
                </div>

                <div className="stp-action-card" onClick={() => switchTab("profile")}>
                  <div className="stp-action-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>
                    <IdcardFilled />
                  </div>
                  <div>
                    <div className="stp-action-title">Staff Profile &amp; KYC</div>
                    <div className="stp-action-desc">View details, Aadhaar, PAN, Bank credentials or submit updates</div>
                  </div>
                </div>

                <div className="stp-action-card" onClick={() => switchTab("help")}>
                  <div className="stp-action-icon" style={{ background: "#fce7f3", color: "#db2777" }}>
                    <CustomerServiceOutlined />
                  </div>
                  <div>
                    <div className="stp-action-title">Help &amp; Support Desk</div>
                    <div className="stp-action-desc">Contact Admin team or respond to candidate matrimonial inquiries</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Referral Link Card */}
            {refCode && !isDeactivated && (
              <div
                className="stp-card"
                style={{
                  marginBottom: 22,
                  background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
                  color: "#ffffff",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                  }}
                >
                  <div style={{ maxWidth: 540 }}>
                    <span
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                      }}
                    >
                      🔗 Referral Program
                    </span>
                    <h3 style={{ color: "#ffffff", fontSize: 20, fontWeight: 900, margin: "8px 0 4px" }}>
                      Share Your Staff Referral Link
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                      When brides and grooms register using your staff link or enter code <strong>{refCode}</strong>, they are automatically linked to your account and earn you ₹{activeCommissionRate || "—"} commission.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button
                      size="large"
                      style={{
                        background: "#ffffff",
                        color: "#065f46",
                        fontWeight: 800,
                        border: "none",
                        borderRadius: 12,
                      }}
                      icon={copiedLink ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={copyReferralLink}
                    >
                      {copiedLink ? "Link Copied!" : "Copy Register Link"}
                    </Button>
                    <Button
                      size="large"
                      style={{
                        background: "#25D366",
                        color: "#ffffff",
                        fontWeight: 800,
                        border: "none",
                        borderRadius: 12,
                      }}
                      icon={<WhatsAppOutlined />}
                      onClick={shareReferralWhatsApp}
                    >
                      Share WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Row: Recent Members and Recent Transactions */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <div className="stp-card" style={{ height: "100%" }}>
                  <div className="stp-card-header" style={{ marginBottom: 12 }}>
                    <div>
                      <h3 className="stp-card-title">👥 Recently Added Members</h3>
                      <p className="stp-card-desc">Last candidates onboarded with your code</p>
                    </div>
                    <Button type="link" onClick={() => switchTab("myusers")}>
                      View All ({myAddedUsers.length})
                    </Button>
                  </div>

                  {myAddedUsers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "28px 10px", color: "#64748b" }}>
                      No members registered yet.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {myAddedUsers.slice(0, 4).map((u) => {
                        const prof = u.profile;
                        const isFemale = prof?.Gender === "Female";
                        const candName = prof?.Full_Name || u.first_name || u.Contact || "Member";
                        const candPhoto = prof?.Profile_Pic ? getMediaUrl(prof.Profile_Pic) : "";
                        return (
                          <div
                            key={u.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "10px 14px",
                              background: "#f8fafc",
                              borderRadius: 12,
                              border: "1px solid #e2e8f0",
                              gap: 10,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                              <div
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: 10,
                                  background: isFemale ? "#fce7f3" : "#e0f2fe",
                                  color: isFemale ? "#db2777" : "#0284c7",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 800,
                                  fontSize: 14,
                                  overflow: "hidden",
                                  flexShrink: 0,
                                }}
                              >
                                {candPhoto ? (
                                  <img
                                    src={candPhoto}
                                    alt={candName}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
                                  />
                                ) : (
                                  candName.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    fontSize: 13.5,
                                    color: "#0f172a",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {candName}{" "}
                                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>#{u.id}</span>
                                </div>
                                <div style={{ fontSize: 11.5, color: "#64748b" }}>
                                  📍 {[prof?.City, prof?.State].filter(Boolean).join(", ") || "India"}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                              <Tag color={prof?.Active !== false ? "green" : "red"} style={{ margin: 0, fontSize: 11 }}>
                                {prof?.Active !== false ? "Active 🟢" : "Deactivated 🔴"}
                              </Tag>
                              <Button
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => handleOpenBiodataModal(u)}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Col>

              <Col xs={24} lg={12}>
                <div className="stp-card" style={{ height: "100%" }}>
                  <div className="stp-card-header" style={{ marginBottom: 12 }}>
                    <div>
                      <h3 className="stp-card-title">📜 Recent Transactions</h3>
                      <p className="stp-card-desc">Latest financial activity</p>
                    </div>
                    <Button type="link" onClick={() => switchTab("transactions")}>
                      View All ({transactionsList.length})
                    </Button>
                  </div>

                  {transactionsList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "28px 10px", color: "#64748b" }}>
                      No transactions recorded yet.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {transactionsList.slice(0, 4).map((tx) => (
                        <div
                          key={tx.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 14px",
                            background: "#f8fafc",
                            borderRadius: 10,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13.5, color: "#0f172a" }}>
                              {tx.Type || "Payout"}
                            </div>
                            <div style={{ fontSize: 11.5, color: "#64748b" }}>
                              {tx.Create_date ? new Date(tx.Create_date).toLocaleDateString() : "Recent"}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: tx.Type === "Commission" ? "#059669" : "#0f172a" }}>
                              {tx.Type === "Commission" ? "+₹" : "₹"}{String(tx.Amount || "").replace(/^-/, "")}
                            </div>
                            {(() => {
                              const st = (tx.Status || "").toLowerCase();
                              const isApp = ["approved", "success"].includes(st);
                              const isRej = ["rejected", "failed"].includes(st);
                              return (
                                <Tag
                                  color={isApp ? "green" : isRej ? "red" : "gold"}
                                  style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}
                                >
                                  {isApp ? "Paid ✓" : isRej ? "Rejected ✕" : "Pending ⏳"}
                                </Tag>
                              );
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: STAFF PROFILE & KYC */}
        {/* ============================================================== */}
        {activeTab === "profile" && (
          <div>
            {!isEditingProfile && staffProfile ? (
              /* Profile Details View (Read-Only with Update Button) */
              <div className="stp-card">
                <div
                  className="stp-card-header"
                  style={{
                    borderBottom: "1.5px solid #e2e8f0",
                    paddingBottom: 16,
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <h2 className="stp-card-title">
                      <IdcardFilled style={{ color: "#059669" }} /> Staff Profile Details
                    </h2>
                    <p className="stp-card-desc">
                      Review your official staff credentials, KYC records, and payout bank details.
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {isApprovedStaff ? (
                      <Tag color="green" style={{ padding: "5px 12px", fontWeight: 800 }}>
                        <CheckCircleFilled /> Account Active 🟢
                      </Tag>
                    ) : (
                      <Tag color="gold" style={{ padding: "5px 12px", fontWeight: 800 }}>
                        <ClockCircleFilled /> Admin Approval Pending
                      </Tag>
                    )}
                    <Button
                      type="primary"
                      className="stp-btn-primary"
                      icon={<EditOutlined />}
                      onClick={() => setIsEditingProfile(true)}
                    >
                      Update Profile
                    </Button>
                  </div>
                </div>

                {/* Profile Header Card */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    background: "#f8fafc",
                    padding: "16px 20px",
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    marginBottom: 22,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid #059669",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#059669",
                      color: "#fff",
                      fontSize: 28,
                      flexShrink: 0,
                    }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Staff" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                    ) : (
                      <IdcardFilled />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>
                      {staffProfile.Full_Name || "Staff Member"}
                    </div>
                    <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>
                      📞 +91 {staffProfile.WP_Contact || storedContact} • 📧 {staffProfile.Email || "No email registered"}
                    </div>
                  </div>
                  <div>
                    <Tag color="cyan" style={{ fontSize: 13, padding: "4px 10px", fontWeight: 700 }}>
                      Staff Code: {refCode || "—"}
                    </Tag>
                  </div>
                </div>

                {/* 1. Personal & Residential Details */}
                <div className="stp-section-tag">1. Personal &amp; Residential Details</div>
                <div className="stp-detail-grid">
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">Full Name</div>
                    <div className="stp-detail-val">{staffProfile.Full_Name || "—"}</div>
                  </div>
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">Age</div>
                    <div className="stp-detail-val">{staffProfile.Age ? `${staffProfile.Age} Years` : "—"}</div>
                  </div>
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">WhatsApp / Mobile</div>
                    <div className="stp-detail-val">+91 {staffProfile.WP_Contact || "—"}</div>
                  </div>
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">Email</div>
                    <div className="stp-detail-val">{staffProfile.Email || "—"}</div>
                  </div>
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">City</div>
                    <div className="stp-detail-val">{staffProfile.City || "—"}</div>
                  </div>
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">District</div>
                    <div className="stp-detail-val">{staffProfile.District || "—"}</div>
                  </div>
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">State</div>
                    <div className="stp-detail-val">{staffProfile.State || "—"}</div>
                  </div>
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">Country</div>
                    <div className="stp-detail-val">{staffProfile.Country || "India"}</div>
                  </div>
                  <div className="stp-detail-item" style={{ gridColumn: "1 / -1" }}>
                    <div className="stp-detail-lbl">Full Residential Address</div>
                    <div className="stp-detail-val">{staffProfile.Full_Address || "—"}</div>
                  </div>
                </div>

                {/* 2. KYC Verification Documents */}
                <div className="stp-section-tag" style={{ marginTop: 24 }}>2. KYC &amp; Verification Documents</div>
                <div className="stp-detail-grid">
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">Aadhaar Card Number</div>
                    <div className="stp-detail-val">{staffProfile.Adhar_Number || "—"}</div>
                  </div>
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">Aadhaar Document</div>
                    <div className="stp-detail-val">
                      {staffProfile.Adhar_Image ? (
                        <a
                          href={getMediaUrl(staffProfile.Adhar_Image)}
                          target="_blank"
                          rel="noreferrer"
                          className="stp-doc-pill"
                        >
                          <EyeOutlined /> View Aadhaar Card
                        </a>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>Not Uploaded</span>
                      )}
                    </div>
                  </div>
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">PAN Card Number</div>
                    <div className="stp-detail-val">{staffProfile.PAN_Number || "—"}</div>
                  </div>
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">PAN Document</div>
                    <div className="stp-detail-val">
                      {staffProfile.PAN_Image ? (
                        <a
                          href={getMediaUrl(staffProfile.PAN_Image)}
                          target="_blank"
                          rel="noreferrer"
                          className="stp-doc-pill"
                        >
                          <EyeOutlined /> View PAN Card
                        </a>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>Not Uploaded</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Banking & Payout Details */}
                <div className="stp-section-tag" style={{ marginTop: 24 }}>3. Banking &amp; Payout Details</div>
                <div className="stp-detail-grid">
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">Bank Name</div>
                    <div className="stp-detail-val">{staffProfile.Bank_Name || "—"}</div>
                  </div>
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">Bank Account Number</div>
                    <div className="stp-detail-val">{staffProfile.Bank_Account_Number || "—"}</div>
                  </div>
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">Bank IFSC Code</div>
                    <div className="stp-detail-val">{staffProfile.Bank_IFSC_Code || "—"}</div>
                  </div>
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">Account Holder Name</div>
                    <div className="stp-detail-val">{staffProfile.Bank_Account_Holder_Name || "—"}</div>
                  </div>
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">UPI ID (VPA)</div>
                    <div className="stp-detail-val">{staffProfile.UPI_ID || "—"}</div>
                  </div>
                  <div className="stp-detail-item">
                    <div className="stp-detail-lbl">Bank Passbook / Cheque</div>
                    <div className="stp-detail-val">
                      {staffProfile.Bank_Passbook_Image ? (
                        <a
                          href={getMediaUrl(staffProfile.Bank_Passbook_Image)}
                          target="_blank"
                          rel="noreferrer"
                          className="stp-doc-pill"
                        >
                          <EyeOutlined /> View Passbook
                        </a>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>Not Uploaded</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    type="primary"
                    className="stp-btn-primary"
                    icon={<EditOutlined />}
                    size="large"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    Update Profile &amp; KYC
                  </Button>
                </div>
              </div>
            ) : (
              /* Profile Edit / Create Form */
              <div className="stp-card">
                <div className="stp-card-header">
                  <div>
                    <h2 className="stp-card-title">
                      <IdcardFilled style={{ color: "#059669" }} /> {hasProfile ? "Update Staff Profile & KYC" : "Complete Staff Profile & KYC"}
                    </h2>
                    <p className="stp-card-desc">
                      Maintain your official staff identity, residential address, KYC verification documents, and payout account.
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {hasProfile && (
                      <Button onClick={() => setIsEditingProfile(false)}>
                        Back to View Details
                      </Button>
                    )}
                    {isApprovedStaff ? (
                      <Tag color="green" style={{ padding: "5px 12px", fontWeight: 800 }}>
                        <CheckCircleFilled /> Account Active 🟢
                      </Tag>
                    ) : (
                      <Tag color="gold" style={{ padding: "5px 12px", fontWeight: 800 }}>
                        <ClockCircleFilled /> Admin Approval Pending
                      </Tag>
                    )}
                  </div>
                </div>

                <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleProfileSubmit}
              requiredMark="optional"
              initialValues={
                staffProfile
                  ? {
                      Full_Name: staffProfile.Full_Name || "",
                      WP_Contact: staffProfile.WP_Contact || "",
                      Age: staffProfile.Age || "",
                      Full_Address: staffProfile.Full_Address || "",
                      District: staffProfile.District || "",
                      State: staffProfile.State || "",
                      City: staffProfile.City || "",
                      Country: staffProfile.Country || "India",
                      Email: staffProfile.Email || "",
                      Adhar_Number: staffProfile.Adhar_Number || "",
                      PAN_Number: staffProfile.PAN_Number || "",
                      Bank_Name: staffProfile.Bank_Name || "",
                      Bank_Account_Number: staffProfile.Bank_Account_Number || "",
                      Bank_IFSC_Code: staffProfile.Bank_IFSC_Code || "",
                      Bank_Account_Holder_Name: staffProfile.Bank_Account_Holder_Name || "",
                      UPI_ID: staffProfile.UPI_ID || "",
                    }
                  : undefined
              }
            >
              <div className="stp-section-tag">1. Personal &amp; Contact Details</div>
              <Row gutter={16}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="Staff Full Name"
                    name="Full_Name"
                    rules={[{ required: true, message: "Enter your full name." }]}
                  >
                    <Input placeholder="Full Name" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="WhatsApp / Mobile Number"
                    name="WP_Contact"
                    rules={[{ required: true, message: "Enter 10-digit contact." }]}
                  >
                    <Input placeholder="10-digit mobile number" maxLength={10} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="Email Address" name="Email">
                    <Input placeholder="Email address" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="Age (Years)" name="Age">
                    <Input type="number" placeholder="Age" min={18} max={90} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="Staff Photo">
                    <Upload
                      beforeUpload={(file) => {
                        setProfilePicFile(file);
                        return false;
                      }}
                      maxCount={1}
                      listType="picture"
                    >
                      <Button icon={<UploadOutlined />}>Upload Photo</Button>
                    </Upload>
                    {staffProfile?.Profile_Pic && (
                      <div style={{ marginTop: 4, fontSize: 12 }}>
                        <a
                          href={getMediaUrl(staffProfile.Profile_Pic)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#059669", fontWeight: 700 }}
                        >
                          <EyeOutlined /> View Current Photo
                        </a>
                      </div>
                    )}
                  </Form.Item>
                </Col>
              </Row>

              <div className="stp-section-tag" style={{ marginTop: 12 }}>
                2. Residential Address
              </div>
              <Row gutter={16}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="State"
                    name="State"
                    rules={[{ required: true, message: "Select state." }]}
                  >
                    <Select
                      placeholder="Select State"
                      showSearch
                      allowClear
                      onChange={(stateName) => {
                        const found = statesList.find((s) => s.State === stateName);
                        setAvailableDistricts(found?.Districts || []);
                        profileForm.setFieldsValue({ District: undefined });
                      }}
                    >
                      {statesList.map((st) => (
                        <Option key={st.id || st.State} value={st.State}>
                          {st.State}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="District"
                    name="District"
                    rules={[{ required: true, message: "Select district." }]}
                  >
                    {(availableDistricts && availableDistricts.length > 0 ? availableDistricts : allStaffDistrictsList).length > 0 ? (
                      <Select placeholder="Select District" showSearch allowClear>
                        {(availableDistricts && availableDistricts.length > 0 ? availableDistricts : allStaffDistrictsList).map((d) => (
                          <Option key={d} value={d}>
                            {d}
                          </Option>
                        ))}
                      </Select>
                    ) : (
                      <Input placeholder="Enter District" />
                    )}
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="City / Town"
                    name="City"
                    rules={[{ required: true, message: "Enter city." }]}
                  >
                    <Input placeholder="City or Town" />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="Full Postal Address"
                    name="Full_Address"
                    rules={[{ required: true, message: "Enter address." }]}
                  >
                    <Input.TextArea rows={2} placeholder="Street, Landmark, PIN Code" />
                  </Form.Item>
                </Col>
              </Row>

              <div className="stp-section-tag" style={{ marginTop: 12 }}>
                3. Identity &amp; KYC Verification
              </div>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Aadhaar Number (12 Digits)"
                    name="Adhar_Number"
                    rules={[{ required: true, message: "Enter 12-digit Aadhaar." }]}
                  >
                    <Input placeholder="12-digit Aadhaar" maxLength={12} />
                  </Form.Item>
                  <Form.Item label="Aadhaar Document">
                    <Upload
                      beforeUpload={(file) => {
                        setAdharFile(file);
                        return false;
                      }}
                      maxCount={1}
                    >
                      <Button icon={<UploadOutlined />}>Upload Aadhaar</Button>
                    </Upload>
                    {staffProfile?.Adhar_Image && (
                      <div style={{ marginTop: 4, fontSize: 12 }}>
                        <a
                          href={getMediaUrl(staffProfile.Adhar_Image)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#059669", fontWeight: 700 }}
                        >
                          <EyeOutlined /> View Current Aadhaar
                        </a>
                      </div>
                    )}
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="PAN Number (10 Characters)"
                    name="PAN_Number"
                    rules={[{ required: true, message: "Enter 10-character PAN." }]}
                  >
                    <Input
                      placeholder="10-character PAN"
                      maxLength={10}
                      style={{ textTransform: "uppercase" }}
                    />
                  </Form.Item>
                  <Form.Item label="PAN Card Document">
                    <Upload
                      beforeUpload={(file) => {
                        setPanFile(file);
                        return false;
                      }}
                      maxCount={1}
                    >
                      <Button icon={<UploadOutlined />}>Upload PAN</Button>
                    </Upload>
                    {staffProfile?.PAN_Image && (
                      <div style={{ marginTop: 4, fontSize: 12 }}>
                        <a
                          href={getMediaUrl(staffProfile.PAN_Image)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#059669", fontWeight: 700 }}
                        >
                          <EyeOutlined /> View Current PAN
                        </a>
                      </div>
                    )}
                  </Form.Item>
                </Col>
              </Row>

              <div className="stp-section-tag" style={{ marginTop: 12 }}>
                4. Bank Account &amp; UPI Payout Details
              </div>
              <Row gutter={16}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="Bank Name" name="Bank_Name">
                    <Input placeholder="e.g. SBI / HDFC" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="Account Number" name="Bank_Account_Number">
                    <Input placeholder="Bank Account Number" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="IFSC Code" name="Bank_IFSC_Code">
                    <Input placeholder="e.g. SBIN0001234" style={{ textTransform: "uppercase" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="Account Holder Name" name="Bank_Account_Holder_Name">
                    <Input placeholder="Name on Passbook" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="UPI ID (VPA)" name="UPI_ID">
                    <Input placeholder="e.g. name@okhdfcbank" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="Passbook / Cheque Document">
                    <Upload
                      beforeUpload={(file) => {
                        setPassbookFile(file);
                        return false;
                      }}
                      maxCount={1}
                    >
                      <Button icon={<UploadOutlined />}>Upload Passbook</Button>
                    </Upload>
                    {staffProfile?.Bank_Passbook_Image && (
                      <div style={{ marginTop: 4, fontSize: 12 }}>
                        <a
                          href={getMediaUrl(staffProfile.Bank_Passbook_Image)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#059669", fontWeight: 700 }}
                        >
                          <EyeOutlined /> View Passbook
                        </a>
                      </div>
                    )}
                  </Form.Item>
                </Col>
              </Row>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
                    {hasProfile && (
                      <Button size="large" onClick={() => setIsEditingProfile(false)}>
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="primary"
                      htmlType="submit"
                      className="stp-btn-primary"
                      loading={savingProfile}
                      icon={<FileDoneOutlined />}
                      size="large"
                    >
                      Save Profile &amp; KYC
                    </Button>
                  </div>
                </Form>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ADD NEW MEMBER (Stepped OTP Process like UserRegister) */}
        {/* ============================================================== */}
        {activeTab === "adduser" && (
          <div className="stp-card">
            <div className="stp-card-header">
              <div>
                <h2 className="stp-card-title">
                  <UserAddOutlined style={{ color: "#059669" }} /> Add Member (Candidate Registration)
                </h2>
                <p className="stp-card-desc">
                  Register new matrimonial candidates with SMS OTP verification. Attributed to your staff referral code <strong>{refCode}</strong>.
                </p>
              </div>
            </div>

            {/* If pending admin approval */}
            {!isApprovedStaff ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  background: "#fffbeb",
                  borderRadius: 16,
                  border: "1.5px solid #fde68a",
                }}
              >
                <ClockCircleFilled style={{ fontSize: 44, color: "#d97706", marginBottom: 12 }} />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#92400e", margin: "0 0 6px" }}>
                  Admin Approval Pending
                </h3>
                <p style={{ fontSize: 13.5, color: "#78350f", maxWidth: 460, margin: "0 auto 20px" }}>
                  Your staff account is currently pending admin approval. You will be able to onboard members once verified by Admin.
                </p>
                <Button
                  type="primary"
                  onClick={() => switchTab("help")}
                  size="large"
                  icon={<CustomerServiceOutlined />}
                  style={{ background: "#d97706", borderColor: "#d97706" }}
                >
                  Contact Support
                </Button>
              </div>
            ) : (
              <div>
                {/* Stepped Progress Bar */}
                <div className="stp-otp-step-header">
                  <div className="stp-step-indicators">
                    {[
                      { step: 0, title: "1. Mobile" },
                      { step: 1, title: "2. Verify OTP" },
                      { step: 2, title: "3. Password" },
                      { step: 3, title: "4. Biodata" },
                    ].map((s) => (
                      <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div
                          className={`stp-step-dot ${
                            candidateStep === s.step
                              ? "active"
                              : candidateStep > s.step
                              ? "completed"
                              : ""
                          }`}
                        >
                          {candidateStep > s.step ? <CheckOutlined /> : s.step + 1}
                        </div>
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: candidateStep === s.step ? 800 : 600,
                            color: candidateStep === s.step ? "#064e3b" : "#64748b",
                          }}
                        >
                          {s.title}
                        </span>
                        {s.step < 3 && <span style={{ color: "#cbd5e1", margin: "0 4px" }}>—</span>}
                      </div>
                    ))}
                  </div>
                  <div>
                    <Button size="small" onClick={handleResetAddUser}>
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Step 0: Mobile Number */}
                {candidateStep === 0 && (
                  <div style={{ maxWidth: 460, margin: "20px auto 36px" }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
                      Step 1: Enter Candidate Mobile Number
                    </h3>
                    <p style={{ fontSize: 13, color: "#64748b", marginBottom: 18 }}>
                      A 6-digit SMS verification code will be sent to the candidate.
                    </p>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                        Candidate Mobile Number (10 Digits) *
                      </label>
                      <Input
                        size="large"
                        prefix={<span style={{ fontWeight: 800, color: "#64748b" }}>+91</span>}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        value={candPhone}
                        onChange={(e) => {
                          setCandPhone(e.target.value.replace(/\D/g, ""));
                          setCandPhoneError("");
                        }}
                        onPressEnter={handleCandSendOTP}
                        style={{ borderRadius: 12 }}
                      />
                      {candPhoneError && (
                        <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4, fontWeight: 600 }}>
                          {candPhoneError}
                        </div>
                      )}
                    </div>

                    <Button
                      type="primary"
                      className="stp-btn-primary"
                      size="large"
                      block
                      loading={candLoading}
                      onClick={handleCandSendOTP}
                      disabled={candPhone.length !== 10}
                    >
                      Send Verification OTP <ArrowRightOutlined />
                    </Button>
                  </div>
                )}

                {/* Step 1: 6-Digit OTP */}
                {candidateStep === 1 && (
                  <div style={{ maxWidth: 460, margin: "20px auto 36px", textAlign: "center" }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
                      Step 2: Enter 6-Digit Verification Code
                    </h3>
                    <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
                      Code sent to candidate: <strong>+91 {candPhone}</strong>
                    </p>

                    <div className="stp-otp-boxes" onPaste={handleCandOtpPaste}>
                      {candOtp.map((val, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (candOtpRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className="stp-otp-input"
                          value={val}
                          onChange={(e) => handleCandOtpChange(e.target.value, idx)}
                          onKeyDown={(e) => handleCandOtpKeyDown(e.target.value, idx)}
                        />
                      ))}
                    </div>

                    {candOtpError && (
                      <div style={{ color: "#ef4444", fontSize: 12.5, marginBottom: 10, fontWeight: 700 }}>
                        {candOtpError}
                      </div>
                    )}

                    <div style={{ marginBottom: 18, fontSize: 13, color: "#64748b" }}>
                      {candCanResend ? (
                        <Button type="link" onClick={handleCandResendOTP} style={{ fontWeight: 700 }}>
                          Resend OTP Code
                        </Button>
                      ) : (
                        <span>
                          Resend in <strong>{formatCountdown(candCountdown)}</strong>
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <Button
                        size="large"
                        onClick={() => {
                          if (candTimerRef.current) clearInterval(candTimerRef.current);
                          setCandidateStep(0);
                        }}
                        style={{ flex: 1, borderRadius: 10 }}
                      >
                        <ArrowLeftOutlined /> Back
                      </Button>
                      <Button
                        type="primary"
                        className="stp-btn-primary"
                        size="large"
                        loading={candLoading}
                        onClick={handleCandVerifyOTP}
                        style={{ flex: 2 }}
                      >
                        Verify OTP <ArrowRightOutlined />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Password */}
                {candidateStep === 2 && (
                  <div style={{ maxWidth: 460, margin: "20px auto 36px" }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
                      Step 3: Set Candidate Password
                    </h3>
                    <p style={{ fontSize: 13, color: "#64748b", marginBottom: 18 }}>
                      Create password for candidate to log in.
                    </p>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                        Candidate Password *
                      </label>
                      <Input
                        size="large"
                        type={candShowPass ? "text" : "password"}
                        placeholder="Minimum 8 characters"
                        value={candPassword}
                        onChange={(e) => setCandPassword(e.target.value)}
                        suffix={
                          <span
                            onClick={() => setCandShowPass(!candShowPass)}
                            style={{ cursor: "pointer" }}
                          >
                            {candShowPass ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                          </span>
                        }
                        style={{ borderRadius: 10 }}
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                        Confirm Password *
                      </label>
                      <Input
                        size="large"
                        type={candShowConfirmPass ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={candConfirmPassword}
                        onChange={(e) => setCandConfirmPassword(e.target.value)}
                        suffix={
                          <span
                            onClick={() => setCandShowConfirmPass(!candShowConfirmPass)}
                            style={{ cursor: "pointer" }}
                          >
                            {candShowConfirmPass ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                          </span>
                        }
                        style={{ borderRadius: 10 }}
                      />
                      {candPasswordError && (
                        <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4, fontWeight: 600 }}>
                          {candPasswordError}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <Button
                        size="large"
                        onClick={() => setCandidateStep(1)}
                        style={{ flex: 1, borderRadius: 10 }}
                      >
                        <ArrowLeftOutlined /> Back
                      </Button>
                      <Button
                        type="primary"
                        className="stp-btn-primary"
                        size="large"
                        loading={candLoading}
                        onClick={handleCandCreateAccount}
                        style={{ flex: 2 }}
                      >
                        Create Account &amp; Proceed <ArrowRightOutlined />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Biodata */}
                {candidateStep === 3 && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 18,
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                          Step 4: Candidate Biodata
                        </h3>
                        <p style={{ fontSize: 12.5, color: "#64748b", margin: "2px 0 0" }}>
                          ID: #{candidateCreatedUser?.id} • Mobile: +91 {candPhone}
                        </p>
                      </div>
                      <Button onClick={handleSkipProfile}>Skip Biodata (Fill Later)</Button>
                    </div>

                    <Form
                      form={candidateProfileForm}
                      layout="vertical"
                      onFinish={handleCandProfileSubmit}
                      initialValues={{
                        WP_Contact: candPhone ? candPhone.trim() : "",
                      }}
                    >
                      <div className="stp-section-tag">1. Personal Details</div>
                      <Row gutter={16}>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Candidate Name"
                            name="Full_Name"
                            rules={[{ required: true, message: "Enter name." }]}
                          >
                            <Input placeholder="Full Name" />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Gender"
                            name="Gender"
                            rules={[{ required: true, message: "Select gender." }]}
                            initialValue="Male"
                          >
                            <Select placeholder="Gender">
                              <Option value="Male">Male (Groom)</Option>
                              <Option value="Female">Female (Bride)</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="Date of Birth" name="DOB">
                            <Input type="date" />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="Age (Years)" name="Age">
                            <Input type="number" placeholder="Age" />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Marital Status"
                            name="Marrige_status"
                            initialValue="Never Married"
                          >
                            <Select placeholder="Marital status">
                              <Option value="Never Married">Never Married</Option>
                              <Option value="Divorced">Divorced</Option>
                              <Option value="Widowed">Widowed</Option>
                              <Option value="Awaiting Divorce">Awaiting Divorce</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <Form.Item
                            label="Diet"
                            name="Vegeterian"
                            initialValue="Vegeterian"
                          >
                            <Select placeholder="Diet">
                              <Option value="Vegeterian">Vegetarian</Option>
                              <Option value="Non-Vegeterian">Non-Vegetarian</Option>
                              <Option value="Both">Both / Eggetarian</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="Candidate Photo">
                            <Upload
                              beforeUpload={(file) => {
                                setCandProfilePicFile(file);
                                return false;
                              }}
                              maxCount={1}
                              listType="picture"
                            >
                              <Button icon={<UploadOutlined />}>Select Photo</Button>
                            </Upload>
                          </Form.Item>
                        </Col>
                      </Row>

                      <div className="stp-section-tag" style={{ marginTop: 10 }}>
                        2. Community &amp; Horoscope
                      </div>
                      <Row gutter={16}>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="Religion" name="Religion">
                            <Select placeholder="Select Religion" showSearch allowClear>
                              {cleanReligions.map((r) => (
                                <Option key={r} value={r}>
                                  {r}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="Caste" name="Caste">
                            <Select placeholder="Select Caste" showSearch allowClear>
                              {cleanCastes.map((c) => (
                                <Option key={c} value={c}>
                                  {c}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="Gotra" name="Gotra">
                            <Input placeholder="Gotra" />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="Mother Tongue" name="Mother_tongue">
                            <Select placeholder="Language" showSearch allowClear>
                              {cleanLanguages.map((l) => (
                                <Option key={l} value={l}>
                                  {l}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="Height" name="Height">
                            <Input placeholder="e.g. 5 ft 8 in" />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="Complexion / Tone" name="Color">
                            <Select placeholder="Tone" showSearch allowClear>
                              {cleanColors.map((cl) => (
                                <Option key={cl} value={cl}>
                                  {cl}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <div className="stp-section-tag" style={{ marginTop: 10 }}>
                        3. Career &amp; Location
                      </div>
                      <Row gutter={16}>
                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="Highest Education" name="Qualification">
                            <Input placeholder="e.g. B.Tech / MBA" />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="Profession" name="Profession">
                            <Select placeholder="Select Profession" showSearch allowClear>
                              {cleanProfessions.map((p) => (
                                <Option key={p} value={p}>
                                  {p}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="Annual Salary (INR)" name="Salary">
                            <Input type="number" placeholder="Salary" />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="State" name="State">
                            <Select
                              placeholder="Select State"
                              showSearch
                              allowClear
                              onChange={handleCandidateStateSelect}
                            >
                              {statesList.map((st) => (
                                <Option key={st.id || st.State} value={st.State}>
                                  {st.State}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="District" name="District">
                            {(candidateDistricts && candidateDistricts.length > 0 ? candidateDistricts : allStaffDistrictsList).length > 0 ? (
                              <Select placeholder="Select District" showSearch allowClear>
                                {(candidateDistricts && candidateDistricts.length > 0 ? candidateDistricts : allStaffDistrictsList).map((d) => (
                                  <Option key={d} value={d}>
                                    {d}
                                  </Option>
                                ))}
                              </Select>
                            ) : (
                              <Input placeholder="District" />
                            )}
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={8}>
                          <Form.Item label="City / Town" name="City">
                            <Input placeholder="City" />
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={24} md={16}>
                          <Form.Item label="Address" name="Full_Address">
                            <Input.TextArea rows={2} placeholder="Full address" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
                        <Button onClick={handleSkipProfile}>Skip</Button>
                        <Button
                          type="primary"
                          htmlType="submit"
                          className="stp-btn-primary"
                          loading={candLoading}
                          size="large"
                        >
                          Save Biodata &amp; Finish
                        </Button>
                      </div>
                    </Form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: MY ADDED MEMBERS */}
        {/* ============================================================== */}
        {activeTab === "myusers" && (
          <div className="stp-card">
            <div className="stp-card-header">
              <div>
                <h2 className="stp-card-title">
                  <TeamOutlined style={{ color: "#059669" }} /> My Members ({myAddedUsers.length})
                </h2>
                <p className="stp-card-desc">
                  Candidates registered with your staff referral code <strong>{refCode}</strong>.
                </p>
              </div>
              {!isDeactivated && (
                <div>
                  <Button
                    type="primary"
                    className="stp-btn-primary"
                    icon={<UserAddOutlined />}
                    onClick={() => switchTab("adduser")}
                  >
                    Add Member
                  </Button>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <Input
                size="large"
                prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                placeholder="Search candidates by ID (#102), Name, Phone, or City..."
                value={userSearchText}
                onChange={(e) => setUserSearchText(e.target.value)}
                allowClear
                style={{ borderRadius: 12 }}
              />
            </div>

            {loadingUsers ? (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <Spin size="large" />
              </div>
            ) : filteredAddedUsers.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "44px 20px",
                  background: "#f8fafc",
                  borderRadius: 16,
                  border: "1px dashed #cbd5e1",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  No Members Found
                </h3>
                <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 14px" }}>
                  {userSearchText
                    ? "No members match your search."
                    : "No candidates registered under your code yet."}
                </p>
                {!isDeactivated && (
                  <Button
                    type="primary"
                    className="stp-btn-primary"
                    icon={<UserAddOutlined />}
                    onClick={() => switchTab("adduser")}
                  >
                    Add Member
                  </Button>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredAddedUsers.map((u) => {
                  const prof = u.profile;
                  const isFemale = prof?.Gender === "Female";
                  const candidateName = prof?.Full_Name || u.first_name || u.Contact || "Candidate";
                  const candPhoto = prof?.Profile_Pic ? getMediaUrl(prof.Profile_Pic) : "";

                  return (
                    <div key={u.id} className="stp-member-card">
                      <div className="stp-member-card-body">
                        {/* Member Avatar */}
                        <div className={`stp-member-avatar ${isFemale ? "female" : "male"}`}>
                          {candPhoto ? (
                            <img
                              src={candPhoto}
                              alt={candidateName}
                            />
                          ) : (
                            candidateName.charAt(0).toUpperCase()
                          )}
                        </div>

                        {/* Member Details */}
                        <div className="stp-member-info">
                          <div className="stp-member-header-row">
                            <h4 className="stp-member-name">
                              {candidateName}
                            </h4>
                            <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 700 }}>#{u.id}</Tag>
                            {prof?.Gender && (
                              <Tag color={isFemale ? "magenta" : "blue"} style={{ borderRadius: 6, fontWeight: 700 }}>
                                {prof.Gender}
                              </Tag>
                            )}
                            {prof?.Manglik && <Tag color="volcano" style={{ borderRadius: 6, fontWeight: 700 }}>Manglik 🔴</Tag>}
                            <Tag color={prof?.Active !== false ? "green" : "red"} style={{ borderRadius: 6, fontWeight: 700 }}>
                              {prof?.Active !== false ? "Active 🟢" : "Deactivated 🔴"}
                            </Tag>
                            {!prof && (
                              <Tag color="gold" style={{ borderRadius: 6, fontWeight: 700 }}>
                                Biodata Incomplete ⚠️
                              </Tag>
                            )}
                          </div>

                          {/* Member Information Chips */}
                          <div className="stp-member-chips">
                            {prof?.Age && <span className="stp-chip">🎂 {prof.Age} Yrs</span>}
                            {prof?.Religion && (
                              <span className="stp-chip">
                                🕉️ {prof.Religion}{prof.Caste ? ` (${prof.Caste})` : ""}
                              </span>
                            )}
                            {prof?.Gotra && <span className="stp-chip">📜 Gotra: {prof.Gotra}</span>}
                            {(prof?.City || prof?.State) && (
                              <span className="stp-chip">
                                📍 {[prof.City, prof.State].filter(Boolean).join(", ")}
                              </span>
                            )}
                            {prof?.Profession && <span className="stp-chip">💼 {prof.Profession}</span>}
                            {prof?.Marrige_status && <span className="stp-chip">💍 {prof.Marrige_status}</span>}
                            <span className="stp-chip stp-chip-protected">
                              🔒 Contact Protected
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Controls */}
                      <div className="stp-member-card-actions">
                        <Button
                          type="primary"
                          size="small"
                          icon={<FileTextOutlined />}
                          className="stp-btn-view-biodata"
                          onClick={() => handleOpenBiodataModal(u)}
                        >
                          View Biodata
                        </Button>
                        {prof && (
                          <Button
                            size="small"
                            danger={prof.Active !== false}
                            style={
                              prof.Active === false
                                ? { borderColor: "#16a34a", color: "#16a34a", fontWeight: 700, borderRadius: 10 }
                                : { fontWeight: 700, borderRadius: 10 }
                            }
                            onClick={() => handleToggleCandidateActive(u, prof.Active === false)}
                          >
                            {prof.Active !== false ? "Deactivate" : "Activate"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: USER SEARCH & CANDIDATE DIRECTORY */}
        {/* ============================================================== */}
        {activeTab === "usersearch" && (
          <div>
            {/* Header & Scope Card */}
            <div className="stp-card" style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <h3 className="stp-card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <SearchOutlined style={{ color: "#2563eb" }} /> User Search &amp; Candidate Directory
                  </h3>
                  <p className="stp-card-desc" style={{ marginTop: 2 }}>
                    Search and view candidate matrimonial biodatas across the platform.
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {/* Scope Selector */}
                  <Radio.Group
                    value={searchScope}
                    onChange={(e) => setSearchScope(e.target.value)}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="all">
                      🌐 All Candidates ({allPlatformUsers.length})
                    </Radio.Button>
                    <Radio.Button value="my">
                      👥 My Members ({myAddedUsers.length})
                    </Radio.Button>
                  </Radio.Group>

                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      fetchAllSearchUsers();
                      fetchAddedUsers();
                    }}
                    title="Refresh Candidate List"
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Keyword Search Input */}
              <div style={{ marginTop: 14 }}>
                <Input
                  size="large"
                  prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                  placeholder="Search by Name, Candidate ID, Phone (+91), Gotra, Profession, City, or State..."
                  value={candidateSearchKeyword}
                  onChange={(e) => setCandidateSearchKeyword(e.target.value)}
                  onPressEnter={() => {
                    setHasExecutedSearch(true);
                    setSearchPage(1);
                  }}
                  allowClear
                  style={{ borderRadius: 10 }}
                />
              </div>

              {/* Quick Filter Chips */}
              <div className="stp-filter-chips-bar" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className={`stp-filter-chip ${
                    candidateGenderFilter === "all" &&
                    candidateActiveFilter === "all" &&
                    candidateManglikFilter === "all"
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setCandidateGenderFilter("all");
                    setCandidateActiveFilter("all");
                    setCandidateManglikFilter("all");
                  }}
                >
                  All ({filteredSearchCandidates.length})
                </button>
                <button
                  type="button"
                  className={`stp-filter-chip ${candidateGenderFilter === "Female" ? "active" : ""}`}
                  onClick={() =>
                    setCandidateGenderFilter((prev) => (prev === "Female" ? "all" : "Female"))
                  }
                >
                  👰 Brides (Female)
                </button>
                <button
                  type="button"
                  className={`stp-filter-chip ${candidateGenderFilter === "Male" ? "active" : ""}`}
                  onClick={() =>
                    setCandidateGenderFilter((prev) => (prev === "Male" ? "all" : "Male"))
                  }
                >
                  🤵 Grooms (Male)
                </button>
                <button
                  type="button"
                  className={`stp-filter-chip ${candidateActiveFilter === "active" ? "active" : ""}`}
                  onClick={() =>
                    setCandidateActiveFilter((prev) => (prev === "active" ? "all" : "active"))
                  }
                >
                  Active 🟢
                </button>
                <button
                  type="button"
                  className={`stp-filter-chip ${candidateActiveFilter === "deactivated" ? "active" : ""}`}
                  onClick={() =>
                    setCandidateActiveFilter((prev) => (prev === "deactivated" ? "all" : "deactivated"))
                  }
                >
                  Deactivated 🔴
                </button>
                <button
                  type="button"
                  className={`stp-filter-chip ${candidateManglikFilter === "manglik" ? "active" : ""}`}
                  onClick={() =>
                    setCandidateManglikFilter((prev) => (prev === "manglik" ? "all" : "manglik"))
                  }
                >
                  Manglik 🔴
                </button>
                <button
                  type="button"
                  className={`stp-filter-chip ${candidateManglikFilter === "non-manglik" ? "active" : ""}`}
                  onClick={() =>
                    setCandidateManglikFilter((prev) => (prev === "non-manglik" ? "all" : "non-manglik"))
                  }
                >
                  Non-Manglik 🟢
                </button>
              </div>

              {/* Advanced Filter Row */}
              <div
                style={{
                  marginTop: 14,
                  padding: "12px 14px",
                  background: "#f8fafc",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>
                    <FilterOutlined /> Advanced Biodata Filters
                  </span>
                  {activeSearchFilterCount > 0 && (
                    <Button
                      size="small"
                      type="link"
                      danger
                      onClick={handleResetSearchFilters}
                      style={{ padding: 0, height: "auto" }}
                    >
                      Reset All Filters ({activeSearchFilterCount})
                    </Button>
                  )}
                </div>

                <Row gutter={[10, 10]}>
                  <Col xs={12} sm={8} md={6} lg={4}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                      Gender
                    </label>
                    <Select
                      style={{ width: "100%" }}
                      value={candidateGenderFilter}
                      onChange={(val) => setCandidateGenderFilter(val)}
                    >
                      <Option value="all">All Genders</Option>
                      <Option value="Male">Male (Groom)</Option>
                      <Option value="Female">Female (Bride)</Option>
                    </Select>
                  </Col>

                  <Col xs={12} sm={8} md={6} lg={4}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                      Religion
                    </label>
                    <Select
                      style={{ width: "100%" }}
                      value={candidateReligionFilter}
                      onChange={(val) => setCandidateReligionFilter(val)}
                      showSearch
                    >
                      <Option value="all">All Religions</Option>
                      {cleanReligions.map((r) => (
                        <Option key={r} value={r}>
                          {r}
                        </Option>
                      ))}
                    </Select>
                  </Col>

                  <Col xs={12} sm={8} md={6} lg={4}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                      State
                    </label>
                    <Select
                      style={{ width: "100%" }}
                      value={candidateStateFilter}
                      onChange={(val) => {
                        setCandidateStateFilter(val);
                        setCandidateDistrictFilter("all");
                        setCandidateCasteFilter("all");
                      }}
                      showSearch
                    >
                      <Option value="all">All States</Option>
                      {statesList.map((st) => (
                        <Option key={st.id || st.State} value={st.State}>
                          {st.State}
                        </Option>
                      ))}
                    </Select>
                  </Col>

                  <Col xs={12} sm={8} md={6} lg={4}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                      District
                    </label>
                    <Select
                      style={{ width: "100%" }}
                      value={candidateDistrictFilter}
                      onChange={(val) => setCandidateDistrictFilter(val)}
                      showSearch
                      placeholder="All Districts"
                    >
                      <Option value="all">All Districts</Option>
                      {(searchCandidateDistricts.length > 0 ? searchCandidateDistricts : allStaffDistrictsList).map((d) => (
                        <Option key={d} value={d}>
                          {d}
                        </Option>
                      ))}
                    </Select>
                  </Col>

                  <Col xs={12} sm={8} md={6} lg={4}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                      Caste {candidateStateFilter !== "all" ? `(${candidateStateFilter})` : ""}
                    </label>
                    <Select
                      style={{ width: "100%" }}
                      value={candidateCasteFilter}
                      onChange={(val) => setCandidateCasteFilter(val)}
                      showSearch
                    >
                      <Option value="all">
                        {candidateStateFilter === "all" ? "All Castes" : `All Castes in ${candidateStateFilter}`}
                      </Option>
                      {filteredSearchCastes.map((c) => (
                        <Option key={c} value={c}>
                          {c}
                        </Option>
                      ))}
                    </Select>
                  </Col>

                  <Col xs={12} sm={8} md={6} lg={4}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                      Age Group
                    </label>
                    <Select
                      style={{ width: "100%" }}
                      value={candidateAgeFilter}
                      onChange={(val) => setCandidateAgeFilter(val)}
                    >
                      <Option value="all">Any Age</Option>
                      <Option value="18-25">18 - 25 Years</Option>
                      <Option value="26-30">26 - 30 Years</Option>
                      <Option value="31-35">31 - 35 Years</Option>
                      <Option value="36-45">36 - 45 Years</Option>
                      <Option value="45+">45+ Years</Option>
                    </Select>
                  </Col>

                  <Col xs={12} sm={8} md={6} lg={4}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                      Marital Status
                    </label>
                    <Select
                      style={{ width: "100%" }}
                      value={candidateMaritalFilter}
                      onChange={(val) => setCandidateMaritalFilter(val)}
                    >
                      <Option value="all">All Marital Statuses</Option>
                      <Option value="Never Married">Never Married</Option>
                      <Option value="Divorced">Divorced</Option>
                      <Option value="Widowed">Widowed</Option>
                      <Option value="Awaiting Divorce">Awaiting Divorce</Option>
                    </Select>
                  </Col>

                  <Col xs={12} sm={8} md={6} lg={4}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                      Diet / Food Habit
                    </label>
                    <Select
                      style={{ width: "100%" }}
                      value={candidateDietFilter}
                      onChange={(val) => setCandidateDietFilter(val)}
                    >
                      <Option value="all">Any Diet</Option>
                      <Option value="Vegeterian">Vegetarian</Option>
                      <Option value="Non-Vegeterian">Non-Vegetarian</Option>
                      <Option value="Both">Both / Eggetarian</Option>
                    </Select>
                  </Col>

                  <Col xs={12} sm={8} md={6} lg={4}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                      Manglik Dosha
                    </label>
                    <Select
                      style={{ width: "100%" }}
                      value={candidateManglikFilter}
                      onChange={(val) => setCandidateManglikFilter(val)}
                    >
                      <Option value="all">Any Horoscope</Option>
                      <Option value="manglik">Manglik Only</Option>
                      <Option value="non-manglik">Non-Manglik</Option>
                    </Select>
                  </Col>

                  <Col xs={12} sm={8} md={6} lg={4}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                      Profession
                    </label>
                    <Select
                      style={{ width: "100%" }}
                      value={candidateProfessionFilter}
                      onChange={(val) => setCandidateProfessionFilter(val)}
                      showSearch
                    >
                      <Option value="all">All Professions</Option>
                      {cleanProfessions.map((p) => (
                        <Option key={p} value={p}>
                          {p}
                        </Option>
                      ))}
                    </Select>
                  </Col>

                  <Col xs={12} sm={8} md={6} lg={4}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>
                      Active Status
                    </label>
                    <Select
                      style={{ width: "100%" }}
                      value={candidateActiveFilter}
                      onChange={(val) => setCandidateActiveFilter(val)}
                    >
                      <Option value="all">All (Active &amp; Deactivated)</Option>
                      <Option value="active">Active Only 🟢</Option>
                      <Option value="deactivated">Deactivated Only 🔴</Option>
                    </Select>
                  </Col>
                </Row>

                <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<SearchOutlined />}
                    className="stp-btn-primary"
                    onClick={() => {
                      setHasExecutedSearch(true);
                      setSearchPage(1);
                    }}
                    style={{ fontWeight: 700, borderRadius: 10, minWidth: 160 }}
                  >
                    Search Candidates
                  </Button>
                  <Button
                    size="large"
                    icon={<ClearOutlined />}
                    onClick={handleResetSearchFilters}
                    style={{ fontWeight: 600, borderRadius: 10 }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>

            {!hasExecutedSearch ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "54px 20px",
                  background: "#ffffff",
                  borderRadius: 16,
                  border: "1.5px dashed #cbd5e1",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ fontSize: 44, marginBottom: 10 }}>🔍</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Search Matrimonial Profiles
                </h3>
                <p style={{ color: "#64748b", fontSize: 13.5, marginTop: 6, maxWidth: 460, marginInline: "auto" }}>
                  Set your desired search criteria or keywords above and click <strong>Search Candidates</strong> to discover matching verified platform biodatas.
                </p>
                <div style={{ marginTop: 18 }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<SearchOutlined />}
                    className="stp-btn-primary"
                    onClick={() => {
                      setHasExecutedSearch(true);
                      setSearchPage(1);
                    }}
                    style={{ fontWeight: 700, borderRadius: 10, paddingInline: 28 }}
                  >
                    Search Candidates Now
                  </Button>
                </div>
              </div>
            ) : (
              <div>

            {/* Results Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
                padding: "0 4px",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
                Found {filteredSearchCandidates.length}{" "}
                {filteredSearchCandidates.length === 1 ? "candidate" : "candidates"}{" "}
                <span style={{ fontWeight: 400, color: "#64748b" }}>
                  ({searchScope === "all" ? "across platform" : "in your registered members"})
                </span>
              </div>
            </div>

            {/* Candidate Results Grid */}
            {loadingSearchUsers ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Spin size="large" />
                <div style={{ marginTop: 14, color: "#64748b", fontWeight: 600 }}>
                  Loading candidate profiles...
                </div>
              </div>
            ) : filteredSearchCandidates.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "#fff",
                  borderRadius: 14,
                  border: "1.5px dashed #cbd5e1",
                }}
              >
                <UserOutlined style={{ fontSize: 44, color: "#94a3b8", marginBottom: 12 }} />
                <h4 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>
                  No Candidates Found
                </h4>
                <p style={{ color: "#64748b", fontSize: 13, marginTop: 6, maxWidth: 420, marginInline: "auto" }}>
                  No candidate profiles matched your search or filters. Try clearing some filters or switching to Platform scope.
                </p>
                <div style={{ marginTop: 16 }}>
                  <Button type="primary" onClick={handleResetSearchFilters}>
                    Reset All Filters
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {paginatedSearchCandidates.map((u) => {
                  const prof = u.profile;
                  const isFemale = prof?.Gender === "Female";
                  const candidateName = prof?.Full_Name || u.first_name || u.Contact || "Candidate";

                  const candPhoto = prof?.Profile_Pic ? getMediaUrl(prof.Profile_Pic) : "";
                  const effectiveCode = String(refCode || staffProfile?.Refer || storedRefCode).trim();
                  const isReferred = effectiveCode && (String(prof?.Refer).trim() === effectiveCode || String(u.Refered_By).trim() === effectiveCode);

                  return (
                    <div key={u.id} className="stp-member-card">
                      <div className="stp-member-card-body">
                        {/* Member Avatar */}
                        <div className={`stp-member-avatar ${isFemale ? "female" : "male"}`}>
                          {candPhoto ? (
                            <img
                              src={candPhoto}
                              alt={candidateName}
                            />
                          ) : (
                            candidateName.charAt(0).toUpperCase()
                          )}
                        </div>

                        {/* Candidate Information */}
                        <div className="stp-member-info">
                          <div className="stp-member-header-row">
                            <h4 className="stp-member-name">
                              {candidateName}
                            </h4>
                            <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 700 }}>#{u.id}</Tag>
                            {prof?.Gender && (
                              <Tag color={isFemale ? "magenta" : "blue"} style={{ borderRadius: 6, fontWeight: 700 }}>
                                {prof.Gender}
                              </Tag>
                            )}
                            {prof?.Manglik && <Tag color="volcano" style={{ borderRadius: 6, fontWeight: 700 }}>Manglik 🔴</Tag>}
                            {isReferred && (
                              <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700 }}>
                                👥 My Member
                              </Tag>
                            )}
                            <Tag color={prof?.Active !== false ? "green" : "red"} style={{ borderRadius: 6, fontWeight: 700 }}>
                              {prof?.Active !== false ? "Active 🟢" : "Deactivated 🔴"}
                            </Tag>
                          </div>

                          {/* Attribute Badges */}
                          <div className="stp-member-chips">
                            {prof?.Age && <span className="stp-chip">🎂 {prof.Age} Yrs</span>}
                            {prof?.Religion && (
                              <span className="stp-chip">
                                🕉️ {prof.Religion}{prof.Caste ? ` (${prof.Caste})` : ""}
                              </span>
                            )}
                            {prof?.Gotra && <span className="stp-chip">📜 Gotra: {prof.Gotra}</span>}
                            {(prof?.City || prof?.State) && (
                              <span className="stp-chip">
                                📍 {[prof.City, prof.State].filter(Boolean).join(", ")}
                              </span>
                            )}
                            {prof?.Profession && <span className="stp-chip">💼 {prof.Profession}</span>}
                            {prof?.Marrige_status && <span className="stp-chip">💍 {prof.Marrige_status}</span>}
                            <span className="stp-chip stp-chip-protected">
                              🔒 Contact Protected
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Search candidate card footer: profile status & actions */}
                      <div className="stp-member-card-actions">
                        <Button
                          type="primary"
                          size="small"
                          icon={<FileTextOutlined />}
                          className="stp-btn-view-biodata"
                          onClick={() => handleOpenBiodataModal(u)}
                        >
                          View Biodata
                        </Button>
                        {isReferred && prof && (
                          <Button
                            size="small"
                            danger={prof.Active !== false}
                            style={
                              prof.Active === false
                                ? { borderColor: "#16a34a", color: "#16a34a", fontWeight: 700, borderRadius: 10 }
                                : { fontWeight: 700, borderRadius: 10 }
                            }
                            onClick={() => handleToggleCandidateActive(u, prof.Active === false)}
                          >
                            {prof.Active !== false ? "Deactivate" : "Activate"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Pagination Controls */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: 16,
                    padding: "16px 0",
                  }}
                >
                  <Pagination
                    current={searchPage}
                    pageSize={searchPageSize}
                    total={filteredSearchCandidates.length}
                    onChange={(p, ps) => {
                      setSearchPage(p);
                      setSearchPageSize(ps);
                    }}
                    showSizeChanger
                    pageSizeOptions={["10", "20", "50"]}
                    showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} candidates`}
                  />
                </div>
              </div>
            )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* COMBINED TAB: PAYOUT & TRANSACTIONS */}
        {/* ============================================================== */}
        {(activeTab === "transactions" || activeTab === "withdrawal") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            {/* 1. Overview Financial Stats (Simple 3-card grid) */}
            <Row gutter={[14, 14]}>
              <Col xs={24} sm={8}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)",
                    border: "1.5px solid #a7f3d0",
                    borderRadius: 16,
                    padding: "16px 18px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#065f46", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Available Balance
                    </span>
                    <span style={{ fontSize: 18 }}>💳</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#064e3b", marginTop: 6 }}>
                    ₹{walletAmount}
                  </div>
                  <div style={{ fontSize: 12, color: "#059669", marginTop: 4, fontWeight: 600 }}>
                    Ready for withdrawal
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={8}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)",
                    border: "1.5px solid #bfdbfe",
                    borderRadius: 16,
                    padding: "16px 18px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#1e40af", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Total Earned
                    </span>
                    <span style={{ fontSize: 18 }}>💰</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#1e3a8a", marginTop: 6 }}>
                    ₹{totalCommissionEarned}
                  </div>
                  <div style={{ fontSize: 12, color: "#2563eb", marginTop: 4, fontWeight: 600 }}>
                    Referral commissions
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={8}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)",
                    border: "1.5px solid #fecdd3",
                    borderRadius: 16,
                    padding: "16px 18px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#9f1239", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Total Withdrawn
                    </span>
                    <span style={{ fontSize: 18 }}>📤</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#be123c", marginTop: 6 }}>
                    ₹{totalWithdrawn}
                  </div>
                  <div style={{ fontSize: 12, color: "#e11d48", marginTop: 4, fontWeight: 600 }}>
                    Paid &amp; requested payouts
                  </div>
                </div>
              </Col>
            </Row>

            {/* 2. Simple & Easy Request Payout Card */}
            <div
              style={{
                background: "#ffffff",
                border: "1.5px solid #e2e8f0",
                borderRadius: 16,
                padding: "20px 22px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                    <WalletOutlined style={{ color: "#d97706" }} /> Request Payout
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
                    Transfer your earned balance directly to your bank account or UPI.
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Tag
                    color={isApprovedStaff ? "green" : "gold"}
                    style={{ fontWeight: 700, padding: "3px 10px", borderRadius: 8, margin: 0 }}
                  >
                    {isApprovedStaff ? "KYC Verified 🟢" : "Approval Pending 🟡"}
                  </Tag>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => switchTab("profile")}
                    style={{ padding: 0, fontWeight: 700, fontSize: 12 }}
                  >
                    Edit Bank Details &gt;
                  </Button>
                </div>
              </div>

              {!isApprovedStaff ? (
                <div
                  style={{
                    padding: "16px 20px",
                    background: "#fffbeb",
                    borderRadius: 12,
                    border: "1px solid #fde68a",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <ClockCircleFilled style={{ fontSize: 24, color: "#d97706", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#92400e" }}>
                      Staff KYC Under Review
                    </div>
                    <div style={{ fontSize: 12.5, color: "#78350f", marginTop: 2 }}>
                      Withdrawals will unlock automatically once your staff account is verified by Admin.
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Account Destination Pill */}
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 12.5,
                      color: "#334155",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>Payout To:</span>
                    {staffProfile?.Bank_Name ? (
                      <span>
                        🏦 <strong>{staffProfile.Bank_Name}</strong> (A/C: {staffProfile.Bank_Account_Number ? `••••${String(staffProfile.Bank_Account_Number).slice(-4)}` : "••••"} • IFSC: {staffProfile.Bank_IFSC_Code})
                      </span>
                    ) : staffProfile?.UPI_ID ? (
                      <span>📱 UPI: <strong>{staffProfile.UPI_ID}</strong></span>
                    ) : (
                      <span style={{ color: "#d97706" }}>Configured in Profile KYC</span>
                    )}
                    {staffProfile?.UPI_ID && staffProfile?.Bank_Name && (
                      <span style={{ color: "#64748b" }}>• UPI: {staffProfile.UPI_ID}</span>
                    )}
                  </div>

                  {/* Amount Input with Quick Chips & Submit Button */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                        Enter Amount (Min ₹100)
                      </label>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {[100, 500, 1000].map((quick) => (
                          <button
                            key={quick}
                            type="button"
                            className="stp-quick-chip"
                            onClick={() => setWithdrawAmount(String(Math.min(quick, walletAmount)))}
                            disabled={walletAmount < quick}
                            style={{
                              padding: "2px 10px",
                              borderRadius: 14,
                              border: "1px solid #cbd5e1",
                              background: withdrawAmount === String(quick) ? "#0f172a" : "#f8fafc",
                              color: withdrawAmount === String(quick) ? "#ffffff" : "#334155",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: walletAmount >= quick ? "pointer" : "not-allowed",
                            }}
                          >
                            ₹{quick}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="stp-quick-chip"
                          onClick={() => setWithdrawAmount(String(walletAmount))}
                          disabled={walletAmount <= 0}
                          style={{
                            padding: "2px 10px",
                            borderRadius: 14,
                            border: "1px solid #cbd5e1",
                            background: withdrawAmount === String(walletAmount) && walletAmount > 0 ? "#0f172a" : "#f8fafc",
                            color: withdrawAmount === String(walletAmount) && walletAmount > 0 ? "#ffffff" : "#334155",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: walletAmount > 0 ? "pointer" : "not-allowed",
                          }}
                        >
                          All (₹{walletAmount})
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Input
                        type="number"
                        size="large"
                        placeholder="e.g. 500"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        style={{ flex: 1, minWidth: 160, borderRadius: 12 }}
                      />
                      <Button
                        type="primary"
                        size="large"
                        loading={withdrawing}
                        onClick={handleWithdrawSubmit}
                        disabled={walletAmount < 100 || !withdrawAmount || Number(withdrawAmount) < 100}
                        style={{
                          borderRadius: 12,
                          fontWeight: 800,
                          padding: "0 28px",
                          background: "linear-gradient(135deg, #d97706, #b45309)",
                          borderColor: "#d97706",
                        }}
                      >
                        Request Payout {withdrawAmount && Number(withdrawAmount) >= 100 ? `(₹${withdrawAmount})` : ""}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. ADMIN REVIEW DESK (Visible if current user is Admin / Superadmin) */}
            {(() => {
              const isAdmin = String(role || localStorage.getItem("role") || "").toLowerCase().includes("admin");
              const pendingWithdrawals = transactionsList.filter(
                (t) => (t.Type || "").toLowerCase() === "withdrawal" && (t.Status || "").toLowerCase() === "pending"
              );
              if (!isAdmin || pendingWithdrawals.length === 0) return null;

              return (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1.5px solid #86efac",
                    borderRadius: 16,
                    padding: "18px 20px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#166534", display: "flex", alignItems: "center", gap: 8 }}>
                        👑 Admin Payout Approvals ({pendingWithdrawals.length} Pending)
                      </h3>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#15803d" }}>
                        Approve to record UTR or reject to automatically refund staff wallet.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {pendingWithdrawals.map((tx) => (
                      <div
                        key={tx.id}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #bbf7d0",
                          borderRadius: 12,
                          padding: "12px 16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 800, fontSize: 13.5, color: "#0f172a" }}>
                              {tx.staff_name || `Staff #${tx.Staff_id}`}
                            </span>
                            {tx.staff_contact && (
                              <Tag color="cyan" style={{ margin: 0, borderRadius: 6 }}>📞 {tx.staff_contact}</Tag>
                            )}
                            <Tag color="gold" style={{ fontWeight: 700, margin: 0, borderRadius: 6 }}>
                              ⏳ Pending
                            </Tag>
                          </div>
                          <div style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>
                            {tx.staff_bank_name ? (
                              <span>
                                Bank: <strong>{tx.staff_bank_name}</strong> | A/C: <strong>{tx.staff_bank_account}</strong> | IFSC: <strong>{tx.staff_bank_ifsc}</strong>
                              </span>
                            ) : tx.staff_upi_id ? (
                              <span>UPI: <strong>{tx.staff_upi_id}</strong></span>
                            ) : (
                              <span>Payout to registered profile KYC</span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ fontSize: 17, fontWeight: 900, color: "#0f172a" }}>
                            ₹{tx.Amount}
                          </div>
                          <Button
                            type="primary"
                            size="small"
                            style={{ background: "#16a34a", borderColor: "#16a34a", fontWeight: 700, borderRadius: 8 }}
                            onClick={() => handleOpenAdminAction(tx, "approve")}
                          >
                            Approve
                          </Button>
                          <Button
                            danger
                            size="small"
                            style={{ fontWeight: 700, borderRadius: 8 }}
                            onClick={() => handleOpenAdminAction(tx, "reject")}
                          >
                            Reject &amp; Refund
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 3.1 DEDICATED WITHDRAWAL REQUESTS TRACKER (For Staff Counselor) */}
            {withdrawalsList.length > 0 && (
              <div
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 16,
                  padding: "18px 20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📤</span>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                      My Payout &amp; Withdrawal Requests ({withdrawalsList.length})
                    </h4>
                  </div>
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      fetchTransactions();
                      fetchStaffData();
                      message.success("Payout status refreshed");
                    }}
                    style={{ borderRadius: 8, fontSize: 12, fontWeight: 600 }}
                  >
                    Refresh Status
                  </Button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {withdrawalsList.slice(0, 5).map((w) => {
                    const isApproved = ["approved", "success"].includes((w.Status || "").toLowerCase());
                    const isRejected = ["rejected", "failed"].includes((w.Status || "").toLowerCase());

                    return (
                      <div
                        key={w.id}
                        style={{
                          padding: "12px 16px",
                          borderRadius: 12,
                          background: isApproved ? "#f0fdf4" : isRejected ? "#fef2f2" : "#fffbeb",
                          border: `1.5px solid ${isApproved ? "#86efac" : isRejected ? "#fca5a5" : "#fde68a"}`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 10,
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
                              ₹{Number(w.Amount || 0).toLocaleString("en-IN")}
                            </span>
                            <Tag
                              color={isApproved ? "success" : isRejected ? "error" : "gold"}
                              style={{ fontWeight: 800, borderRadius: 6, margin: 0, padding: "2px 8px" }}
                            >
                              {isApproved ? "✓ Paid & Transferred" : isRejected ? "✕ Rejected & Refunded" : "⏳ Pending Admin Approval"}
                            </Tag>
                            <span style={{ fontSize: 11, color: "#64748b" }}>
                              Ref: #TXN-{w.id}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                            {w.Msg || (isApproved ? "Payout approved and transferred to registered account" : isRejected ? "Withdrawal declined by Admin" : "Awaiting admin disbursement")}
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                            Requested on: {w.Create_date ? new Date(w.Create_date).toLocaleDateString() : "Recent"}
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: isApproved ? "#15803d" : isRejected ? "#b91c1c" : "#b45309" }}>
                            {isApproved ? "Disbursed 🟢" : isRejected ? "Refunded to Wallet 🔴" : "In Progress 🟡"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Unified Activity & Transaction History */}
            <div
              style={{
                background: "#ffffff",
                border: "1.5px solid #e2e8f0",
                borderRadius: 16,
                padding: "20px 22px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                    <HistoryOutlined style={{ color: "#059669" }} /> Transaction History ({filteredTransactions.length})
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
                    Record of your referral earnings and withdrawals.
                  </p>
                </div>

                {/* Filter Pills */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[
                    { key: "all", label: "All" },
                    { key: "commission", label: "Commissions (+)" },
                    { key: "withdrawal", label: "Withdrawals (-)" },
                  ].map((t) => (
                    <Button
                      key={t.key}
                      type={txFilter === t.key ? "primary" : "default"}
                      onClick={() => setTxFilter(t.key)}
                      size="small"
                      style={{
                        borderRadius: 20,
                        fontWeight: 700,
                        fontSize: 12,
                        background: txFilter === t.key ? "#0f172a" : "#f8fafc",
                        borderColor: txFilter === t.key ? "#0f172a" : "#cbd5e1",
                        color: txFilter === t.key ? "#ffffff" : "#475569",
                      }}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 0", color: "#64748b" }}>
                  <HistoryOutlined style={{ fontSize: 32, color: "#cbd5e1", marginBottom: 8 }} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>No transactions found</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredTransactions.map((tx, idx) => {
                    const isCommission = (tx.Type || "").toLowerCase() === "commission";
                    const isPending = (tx.Status || "").toLowerCase() === "pending";
                    const isApproved = ["approved", "success"].includes((tx.Status || "").toLowerCase());
                    const isRejected = (tx.Status || "").toLowerCase() === "rejected";
                    const isAdmin = String(role || localStorage.getItem("role") || "").toLowerCase().includes("admin");

                    return (
                      <div
                        key={tx.id || idx}
                        style={{
                          background: "#ffffff",
                          border: isPending
                            ? "1.5px solid #fde68a"
                            : isRejected
                            ? "1.5px solid #fecdd3"
                            : "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: "14px 18px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {/* Circular Status Icon */}
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              background: isCommission || isApproved ? "#ecfdf5" : isPending ? "#fef3c7" : isRejected ? "#fee2e2" : "#f1f5f9",
                              color: isCommission || isApproved ? "#059669" : isPending ? "#d97706" : isRejected ? "#dc2626" : "#475569",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 16,
                              fontWeight: 900,
                              flexShrink: 0,
                            }}
                          >
                            {isCommission ? "↗" : isPending ? "⏳" : isRejected ? "✕" : isApproved ? "✓" : "₹"}
                          </div>

                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <strong style={{ fontSize: 14, color: "#0f172a" }}>
                                {tx.Msg || (isCommission ? "Referral Commission Earned" : "Payout Withdrawal")}
                              </strong>
                              <Tag
                                color={
                                  isCommission
                                    ? "green"
                                    : isPending
                                    ? "gold"
                                    : isApproved
                                    ? "green"
                                    : isRejected
                                    ? "red"
                                    : "default"
                                }
                                style={{ fontWeight: 700, borderRadius: 6, margin: 0, fontSize: 11 }}
                              >
                                {isCommission
                                  ? "Credited 🟢"
                                  : isPending
                                  ? "Pending Review ⏳"
                                  : isApproved
                                  ? "Paid 🟢"
                                  : isRejected
                                  ? "Refunded 🔴"
                                  : tx.Status || "Success"}
                              </Tag>
                            </div>

                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                              {formatDate(tx.Create_date) || "Recent"} • #{tx.id ? `TXN-${tx.id}` : idx + 1}
                              {tx.staff_name && isAdmin && (
                                <span> • Staff: <strong>{tx.staff_name}</strong></span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ textAlign: "right" }}>
                            <div
                              style={{
                                fontSize: 17,
                                fontWeight: 900,
                                color: isCommission ? "#16a34a" : isRejected ? "#94a3b8" : "#0f172a",
                              }}
                            >
                              {isCommission ? `+₹${tx.Amount}` : `₹${String(tx.Amount || "").replace(/^-/, "")}`}
                            </div>
                            <div style={{ fontSize: 11, color: isRejected ? "#dc2626" : "#64748b", fontWeight: 600 }}>
                              {isCommission ? "Earned" : isRejected ? "Refunded" : isPending ? "Processing" : "Completed"}
                            </div>
                          </div>

                          {/* Admin Edit Details Button on Approved/Pending Transactions */}
                          {isAdmin && !isCommission && (
                            <Button
                              size="small"
                              onClick={() => handleOpenAdminAction(tx, "update_msg")}
                              title="Update transaction details / UTR note"
                              style={{ borderRadius: 8, fontSize: 11 }}
                            >
                              Edit Note
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}


        {/* ============================================================== */}
        {/* TAB 6: HELP & SUPPORT (Always Accessible, Role="staff") */}
        {/* ============================================================== */}
        {activeTab === "help" && (
          <div>
            <div className="stp-card">
              <div className="stp-card-header">
                <div>
                  <h2 className="stp-card-title">
                    <CustomerServiceOutlined style={{ color: "#059669" }} /> Help &amp; Support
                  </h2>
                  <p className="stp-card-desc">
                    Submit your inquiries directly to the Administration Team for prompt assistance.
                  </p>
                </div>
                <div>
                  <Tag color="purple" style={{ padding: "4px 10px", fontWeight: 800 }}>
                    <IdcardFilled /> Counselor Support Desk
                  </Tag>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Question / Inquiry for Administration Team *
                </label>
                <Input.TextArea
                  rows={3}
                  placeholder="Type your question or request..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  style={{ borderRadius: 10 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="primary"
                  className="stp-btn-primary stp-help-submit-btn"
                  loading={submittingHelp}
                  onClick={handleSendHelpQuery}
                  icon={<SendOutlined />}
                >
                  Submit Inquiry
                </Button>
              </div>

              {/* Staff Tickets */}
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 10, color: "#0f172a" }}>
                  Your Tickets ({staffAdminTickets.length})
                </h3>

                {staffAdminTickets.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "16px 0", color: "#64748b" }}>
                    No tickets submitted yet.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {staffAdminTickets.map((h, i) => (
                      <div key={h.id || i} className="stp-ticket-card">
                        <div className="stp-ticket-header">
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <Tag color="blue" style={{ fontWeight: 600 }}>
                              To: {h.target_name || "Admin Support"}
                            </Tag>
                            <span style={{ fontSize: 11.5, color: "#94a3b8" }}>Ticket #{h.id}</span>
                          </div>
                          <Tag color={h.Answer ? "green" : "gold"}>
                            {h.Answer ? "Answered ✅" : "Under Review ⏳"}
                          </Tag>
                        </div>

                        <div className="stp-ticket-q">Q: {h.Question}</div>
                        <div style={{ fontSize: 11.5, color: "#64748b" }}>
                          📅 Raised: {formatDateTime(h.created_date || h.Create_date)}
                        </div>

                        {h.Answer && (
                          <div className="stp-ticket-admin-reply">
                            <div><strong>Admin Response:</strong> {h.Answer}</div>
                            {h.updated_date && (
                              <div style={{ marginTop: 4, fontSize: 11, color: "#047857" }}>
                                🕒 Replied: {formatDateTime(h.updated_date)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Candidate Inquiries for Counselor */}
            <div className="stp-card">
              <div className="stp-card-header">
                <div>
                  <h3 className="stp-card-title">
                    <CustomerServiceOutlined style={{ color: "#d97706" }} /> Candidate Inquiries ({candidateInquiries.length})
                  </h3>
                </div>
              </div>

              {candidateInquiries.length === 0 ? (
                <div style={{ textAlign: "center", padding: "16px 0", color: "#64748b" }}>
                  No candidate inquiries assigned to you.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {candidateInquiries.map((h, i) => (
                    <div key={h.id || i} className="stp-ticket-card">
                      <div className="stp-ticket-header">
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <Tag color="blue">{h.sender_name || `Candidate #${h.User_id?.id || h.User_id}`}</Tag>
                          <span style={{ fontSize: 11.5, color: "#94a3b8" }}>Ticket #{h.id}</span>
                        </div>
                        <Tag color={h.Answer ? "green" : "volcano"}>
                          {h.Answer ? "Replied ✅" : "Awaiting Reply ⏳"}
                        </Tag>
                      </div>

                      <div className="stp-ticket-q">Q: {h.Question}</div>
                      <div style={{ fontSize: 11.5, color: "#64748b" }}>
                        📅 Raised: {formatDateTime(h.created_date || h.Create_date)}
                      </div>

                      {h.Answer ? (
                        <div className="stp-ticket-admin-reply">
                          <div><strong>Your Reply:</strong> {h.Answer}</div>
                          {h.updated_date && (
                            <div style={{ marginTop: 4, fontSize: 11, color: "#047857" }}>
                              🕒 Replied: {formatDateTime(h.updated_date)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                          <Button
                            type="primary"
                            className="stp-btn-primary"
                            size="small"
                            onClick={() => {
                              setSelectedHelpItem(h);
                              setCounselorReplyText("");
                              setReplyModalVisible(true);
                            }}
                          >
                            Reply
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* 5. MOBILE APP BOTTOM NAVIGATION BAR (Phone Application View) */}
      {/* ============================================================== */}
      <nav className="stp-bottom-nav">
        <button
          type="button"
          className={`stp-bottom-nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => switchTab("dashboard")}
        >
          <span className="stp-bottom-icon">
            <HomeOutlined />
          </span>
          <span>Home</span>
        </button>

        <button
          type="button"
          className={`stp-bottom-nav-btn ${activeTab === "adduser" ? "active" : ""}`}
          onClick={() => switchTab("adduser")}
        >
          <span className="stp-bottom-icon">
            <UserAddOutlined />
          </span>
          <span>Add</span>
        </button>

        <button
          type="button"
          className={`stp-bottom-nav-btn ${activeTab === "myusers" ? "active" : ""}`}
          onClick={() => switchTab("myusers")}
        >
          <span className="stp-bottom-icon">
            <TeamOutlined />
          </span>
          <span>Members</span>
          {myAddedUsers.length > 0 && (
            <span className="stp-bottom-badge">{myAddedUsers.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`stp-bottom-nav-btn ${activeTab === "usersearch" ? "active" : ""}`}
          onClick={() => switchTab("usersearch")}
        >
          <span className="stp-bottom-icon">
            <SearchOutlined />
          </span>
          <span>Search</span>
        </button>

        <button
          type="button"
          className={`stp-bottom-nav-btn ${activeTab === "transactions" || activeTab === "withdrawal" ? "active" : ""}`}
          onClick={() => switchTab("transactions")}
        >
          <span className="stp-bottom-icon">
            <WalletOutlined />
          </span>
          <span>Payout</span>
        </button>

        <button
          type="button"
          className={`stp-bottom-nav-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => switchTab("profile")}
        >
          <span className="stp-bottom-icon">
            <IdcardFilled />
          </span>
          <span>Profile</span>
        </button>
      </nav>

      {/* ============================================================== */}
      {/* 6. MODALS */}
      {/* ============================================================== */}

      {/* Share Referral Link Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShareAltOutlined style={{ color: "#059669" }} />
            <span>Share Staff Referral Link</span>
          </div>
        }
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setShareModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="wa"
            type="primary"
            style={{ background: "#25D366", borderColor: "#25D366" }}
            icon={<WhatsAppOutlined />}
            onClick={shareReferralWhatsApp}
          >
            Share on WhatsApp
          </Button>,
        ]}
      >
        <div style={{ padding: "8px 0" }}>
          <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, marginBottom: 16 }}>
            Share your staff link with prospective candidates and families. When they register using your link, they are automatically linked to your staff account and you receive referral payout upon approval.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>
              STAFF REFERRAL CODE
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                readOnly
                value={refCode || "No Code Assigned"}
                style={{ fontWeight: 800, fontSize: 16, letterSpacing: 1 }}
              />
              <Button
                type="primary"
                className="stp-btn-primary"
                icon={copiedCode ? <CheckOutlined /> : <CopyOutlined />}
                onClick={copyRawReferralCode}
              >
                {copiedCode ? "Copied" : "Copy Code"}
              </Button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>
              COMPLETE REGISTRATION URL
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                readOnly
                value={`${window.location.origin}/UserRegister/${refCode}`}
                style={{ fontSize: 13 }}
              />
              <Button
                type="primary"
                className="stp-btn-primary"
                icon={copiedLink ? <CheckOutlined /> : <CopyOutlined />}
                onClick={copyReferralLink}
              >
                {copiedLink ? "Copied" : "Copy Link"}
              </Button>
            </div>
          </div>

          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 12,
              color: "#166534",
              lineHeight: 1.5,
            }}
          >
            <strong>💡 WhatsApp Tip:</strong> Click &quot;Share on WhatsApp&quot; to send an invitation in Hindi directly to prospective brides, grooms, or community matrimony WhatsApp groups!
          </div>
        </div>
      </Modal>

      {/* Withdrawal Request Modal (Simplified) */}
      <Modal
        title="💸 Request Withdrawal"
        open={withdrawModalVisible}
        onCancel={() => setWithdrawModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setWithdrawModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            className="stp-btn-gold"
            loading={withdrawing}
            onClick={handleWithdrawSubmit}
            disabled={walletAmount < 100 || !isApprovedStaff}
          >
            Submit Request
          </Button>,
        ]}
      >
        <div>
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: 12,
              padding: "12px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#065f46", textTransform: "uppercase", fontWeight: 700 }}>
                Available Balance
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#065f46" }}>
                ₹{walletAmount}
              </div>
            </div>
            <Tag color="green">Eligible</Tag>
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 14,
              fontSize: 12,
              color: "#475569",
            }}
          >
            <div><strong>Registered Payout Info:</strong></div>
            <div>Bank: {staffProfile?.Bank_Name || "Configured in Profile"} {staffProfile?.Bank_Account_Number ? `(A/C: ${staffProfile.Bank_Account_Number})` : ""}</div>
            {staffProfile?.UPI_ID && <div>UPI: {staffProfile.UPI_ID}</div>}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700 }}>
                Amount (₹) *
              </label>
              <div className="stp-quick-chip-group" style={{ margin: 0 }}>
                {[100, 500, 1000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    className="stp-quick-chip"
                    onClick={() => setWithdrawAmount(String(Math.min(quick, walletAmount)))}
                    disabled={walletAmount < quick}
                  >
                    ₹{quick}
                  </button>
                ))}
                <button
                  type="button"
                  className="stp-quick-chip"
                  onClick={() => setWithdrawAmount(String(walletAmount))}
                  disabled={walletAmount <= 0}
                >
                  All
                </button>
              </div>
            </div>
            <Input
              type="number"
              size="large"
              placeholder="Min ₹100"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              style={{ borderRadius: 10 }}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
              Note / Reference (Optional)
            </label>
            <Input
              placeholder="e.g. Regular commission payout"
              value={withdrawNote}
              onChange={(e) => setWithdrawNote(e.target.value)}
              style={{ borderRadius: 10 }}
            />
          </div>
        </div>
      </Modal>

      {/* Admin Payout Action Modal (Approve / Reject / Update Txn Msg) */}
      <Modal
        title={
          adminActionType === "approve"
            ? `✅ Approve Withdrawal #TXN-${selectedAdminTxn?.id} (₹${selectedAdminTxn?.Amount})`
            : adminActionType === "reject"
            ? `❌ Reject Withdrawal #TXN-${selectedAdminTxn?.id} (₹${selectedAdminTxn?.Amount})`
            : `📝 Update Transaction Details #TXN-${selectedAdminTxn?.id}`
        }
        open={adminActionModalVisible}
        onCancel={() => {
          setAdminActionModalVisible(false);
          setSelectedAdminTxn(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setAdminActionModalVisible(false);
              setSelectedAdminTxn(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger={adminActionType === "reject"}
            style={
              adminActionType === "approve"
                ? { background: "#16a34a", borderColor: "#16a34a", fontWeight: 700 }
                : { fontWeight: 700 }
            }
            loading={submittingAdminAction}
            onClick={handleConfirmAdminAction}
          >
            {adminActionType === "approve"
              ? "Confirm & Approve"
              : adminActionType === "reject"
              ? "Confirm & Refund to Wallet"
              : "Save Details"}
          </Button>,
        ]}
      >
        <div>
          {adminActionType === "reject" ? (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecdd3",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 14,
                fontSize: 13,
                color: "#991b1b",
              }}
            >
              ⚠️ <strong>Auto-Refund Notice:</strong> Rejecting this request will immediately return <strong>₹{selectedAdminTxn?.Amount}</strong> back into the staff member&apos;s wallet balance.
            </div>
          ) : adminActionType === "approve" ? (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 14,
                fontSize: 13,
                color: "#166534",
              }}
            >
              ✅ <strong>Approval Notice:</strong> This will mark the withdrawal of <strong>₹{selectedAdminTxn?.Amount}</strong> as Approved. The amount remains deducted from staff account.
            </div>
          ) : null}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
              {adminActionType === "approve" || adminActionType === "update_msg"
                ? "Transaction Details / UTR Number (Visible to Staff)"
                : "Rejection Reason (Visible to Staff)"}
            </label>
            <Input.TextArea
              rows={3}
              placeholder={
                adminActionType === "approve" || adminActionType === "update_msg"
                  ? "e.g. IMPS Ref #92837482, sent to HDFC A/C 9988 on 20-Oct-2026"
                  : "e.g. Bank IFSC code does not match account name. Please update KYC in profile."
              }
              value={adminTxnMsg}
              onChange={(e) => setAdminTxnMsg(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </div>
        </div>
      </Modal>

      {/* Counselor Reply Modal */}
      <Modal
        title={`Reply to Inquiry #${selectedHelpItem?.id}`}
        open={replyModalVisible}
        onCancel={() => {
          setReplyModalVisible(false);
          setSelectedHelpItem(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setReplyModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="reply"
            type="primary"
            className="stp-btn-primary"
            loading={sendingReply}
            onClick={handleSendCounselorReply}
          >
            Send Reply
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 14 }}>
          <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: 8, marginBottom: 12 }}>
            <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 700 }}>Question:</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", marginTop: 2 }}>
              {selectedHelpItem?.Question}
            </div>
          </div>
          <Input.TextArea
            rows={4}
            placeholder="Type your reply here..."
            value={counselorReplyText}
            onChange={(e) => setCounselorReplyText(e.target.value)}
          />
        </div>
      </Modal>

      {/* Full Matrimonial Biodata View Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
            <FileTextOutlined style={{ color: "#059669", fontSize: 18 }} />
            <span>Candidate Matrimonial Biodata</span>
          </div>
        }
        open={biodataModalVisible}
        onCancel={() => {
          setBiodataModalVisible(false);
          setSelectedBiodataUser(null);
        }}
        footer={null}
        width={780}
        centered
        className="stp-biodata-modal-wrap"
        style={{ maxWidth: "calc(100vw - 16px)" }}
        styles={{ body: { padding: "20px 22px", maxHeight: "85vh", overflowY: "auto" } }}
      >
        {selectedBiodataUser && (() => {
          const u = selectedBiodataUser;
          const m = u.profile || {};
          const candId = u.id || m.User_id?.id || m.User_id || "";
          const candName = m.Full_Name || u.first_name || (candId ? `Candidate #${candId}` : "Candidate");
          const candGender = m.Gender || "Candidate";
          const isFemale = candGender === "Female";
          const candCaste = m.Caste || "";
          const candGotra = m.Gotra || "";
          const candReligion = m.Religion || "Hindu";
          const candAge = m.Age;
          const candDob = m.DOB ? String(m.DOB).slice(0, 10) : "";
          const candHeight = m.Height || "";
          const candWeight = m.Weight || "";
          const candColor = m.Color || "";
          const candMarital = m.Marrige_status || "Never Married";
          const candMotherTongue = m.Mother_tongue || "Hindi";
          const candDisability = m.Disability !== undefined ? (m.Disability ? "Yes (Physically Challenged)" : "None") : "None";
          const candManglik = m.Manglik !== undefined ? (m.Manglik ? "Yes (Manglik)" : "No (Non-Manglik)") : "No (Non-Manglik)";
          const candDiet = m.Vegeterian || "Vegetarian";
          const candQual = m.Qualification || "";
          const candProf = m.Profession || "";
          const candJobType = m.Job_type || "Private";
          const candSalary = m.Salary;
          const candFatherName = m.Father_name || "";
          const candFatherAge = m.Father_Age || "";
          const candFatherProf = m.Father_Profession || "";
          const candMotherName = m.Mother_name || "";
          const candMotherAge = m.Mother_Age || "";
          const candMotherProf = m.Mother_Profession || "Homemaker";
          const candBrothers = m.Brothers !== undefined && m.Brothers !== null ? String(m.Brothers) : "0";
          const candBrothersMarried = m.Brothers_marrige !== undefined && m.Brothers_marrige !== null ? String(m.Brothers_marrige) : "0";
          const candSisters = m.Sisters !== undefined && m.Sisters !== null ? String(m.Sisters) : "0";
          const candSistersMarried = m.Sisters_marrige !== undefined && m.Sisters_marrige !== null ? String(m.Sisters_marrige) : "0";
          const candHouse = m.House || "Self Owned";
          const candCity = m.City || "";
          const candDistrict = m.District || "";
          const candState = m.State || "";
          const candCountry = m.Country || "India";
          const candPic = m.Profile_Pic
            ? getMediaUrl(m.Profile_Pic)
            : "";

          const candRefer = m.Refer || u.Refered_By || "";
          const candCreateDate = m.Create_date || u.date_joined || "";
          const effectiveCode = String(refCode || staffProfile?.Refer || storedRefCode).trim();
          const isReferredByMe = effectiveCode && (String(candRefer).trim() === effectiveCode || String(u.Refered_By).trim() === effectiveCode);
          const hasProfile = Boolean(u.profile);

          return (
            <div className="stp-printable-biodata stp-biodata-view">
              {!hasProfile && (
                <div className="stp-biodata-alert-warn no-print">
                  <ClockCircleFilled style={{ fontSize: 22, color: "#d97706", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 800, color: "#92400e", fontSize: 13.5 }}>
                      Matrimonial Profile Incomplete
                    </div>
                    <div style={{ color: "#78350f", fontSize: 12, marginTop: 2 }}>
                      This candidate is registered under referral code <strong>#{candRefer || refCode}</strong>, but has not completed their matrimonial biodata yet.
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Identity Card */}
              <div className="stp-biodata-profile-head">
                <div className="stp-biodata-avatar-wrap">
                  {candPic ? (
                    <Image
                      src={candPic}
                      alt={candName}
                      width={92}
                      height={92}
                      style={{ width: 92, height: 92, objectFit: "cover", objectPosition: "center top", borderRadius: 16 }}
                      preview={{
                        mask: (
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: 3 }}>
                            <EyeOutlined /> View
                          </div>
                        ),
                      }}
                      fallback="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                    />
                  ) : (
                    <div className={`stp-biodata-avatar-placeholder ${isFemale ? "female" : "male"}`}>
                      {candName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="stp-biodata-info-wrap">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <h2 className="stp-biodata-candidate-name">{candName}</h2>
                    <Tag color="cyan" style={{ fontWeight: 700, borderRadius: 8 }}>#{candId}</Tag>
                    {candGender && (
                      <Tag color={isFemale ? "magenta" : "blue"} style={{ fontWeight: 700, borderRadius: 8 }}>
                        {candGender}
                      </Tag>
                    )}
                    {m.Manglik && <Tag color="volcano" style={{ fontWeight: 700, borderRadius: 8 }}>Manglik 🔴</Tag>}
                    {isReferredByMe && (
                      <Tag color="purple" style={{ fontWeight: 700, borderRadius: 8 }}>👥 My Member</Tag>
                    )}
                    <Tag color={m.Active !== false ? "green" : "red"} style={{ fontWeight: 700, borderRadius: 8 }}>
                      {m.Active !== false ? "Active 🟢" : "Deactivated 🔴"}
                    </Tag>
                  </div>

                  <div className="stp-biodata-subtext">
                    {[candCaste, candGotra ? `Gotra: ${candGotra}` : "", candReligion].filter(Boolean).join(" • ")}
                  </div>
                  <div className="stp-biodata-location">
                    📍 {[candCity, candDistrict, candState, candCountry].filter(Boolean).join(", ") || "India"}
                  </div>
                  <div className="stp-confidential-badge">
                    <LockOutlined /> Confidential Profile • Phone &amp; Street Address Protected
                  </div>
                </div>
              </div>

              {/* Biodata Organized Detail Sections */}
              <div className="stp-biodata-sections">
                
                {/* 1. Personal & Physical Details */}
                <div className="stp-biodata-card">
                  <h4 className="stp-biodata-card-title">
                    <span>👤</span> 1. Personal &amp; Physical Details (व्यक्तिगत एवं शारीरिक विवरण)
                  </h4>
                  <div className="stp-biodata-grid">
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Full Name:</span>
                      <strong className="stp-biodata-val">{candName}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Gender:</span>
                      <strong className="stp-biodata-val">{candGender}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Date of Birth:</span>
                      <strong className="stp-biodata-val">{formatDate(candDob) || "Not specified"}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Age:</span>
                      <strong className="stp-biodata-val">{candAge ? `${candAge} Yrs` : "N/A"}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Height:</span>
                      <strong className="stp-biodata-val">
                        {candHeight ? (String(candHeight).includes("cm") || String(candHeight).includes("ft") ? candHeight : `${candHeight} cm`) : "Not specified"}
                      </strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Weight:</span>
                      <strong className="stp-biodata-val">{candWeight ? `${candWeight} kg` : "Not specified"}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Complexion (रंग / वर्ण):</span>
                      <strong className="stp-biodata-val">{candColor || "Not specified"}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Marital Status:</span>
                      <strong className="stp-biodata-val">{candMarital}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Mother Tongue:</span>
                      <strong className="stp-biodata-val">{candMotherTongue}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Physical Disability:</span>
                      <strong className="stp-biodata-val">{candDisability}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Community & Horoscope Details */}
                <div className="stp-biodata-card">
                  <h4 className="stp-biodata-card-title">
                    <span>🕉️</span> 2. Community &amp; Horoscope Details (धार्मिक एवं कुंडली विवरण)
                  </h4>
                  <div className="stp-biodata-grid">
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Religion:</span>
                      <strong className="stp-biodata-val">{candReligion}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Caste:</span>
                      <strong className="stp-biodata-val" style={{ color: "#059669" }}>{candCaste || "Not specified"}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Gotra (गोत्र):</span>
                      <strong className="stp-biodata-val">{candGotra || "Not specified"}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Manglik Status:</span>
                      <strong className="stp-biodata-val">{candManglik}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Diet Preference:</span>
                      <strong className="stp-biodata-val">{candDiet}</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Education & Career */}
                <div className="stp-biodata-card">
                  <h4 className="stp-biodata-card-title">
                    <span>💼</span> 3. Education &amp; Career (शिक्षा एवं व्यवसाय)
                  </h4>
                  <div className="stp-biodata-grid">
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Highest Qualification:</span>
                      <strong className="stp-biodata-val">{candQual || "Not specified"}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Profession / Designation:</span>
                      <strong className="stp-biodata-val">{candProf || "Not specified"}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Employment Type:</span>
                      <strong className="stp-biodata-val">{candJobType || "Private"}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Monthly Income:</span>
                      <strong className="stp-biodata-val" style={{ color: "#0f766e" }}>
                        {candJobType === "Not Working" || Number(candSalary) === 0 ? "Not Applicable (Not Working)" : (candSalary ? `₹${Number(candSalary).toLocaleString("en-IN")}/month` : "Not specified")}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 4. Family Background */}
                <div className="stp-biodata-card">
                  <h4 className="stp-biodata-card-title">
                    <span>👨‍👩‍👦</span> 4. Family Background (पारिवारिक पृष्ठभूमि)
                  </h4>
                  <div className="stp-biodata-grid">
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Father&apos;s Name:</span>
                      <strong className="stp-biodata-val">
                        {candFatherName || "Not specified"} {candFatherAge ? `(Age: ${candFatherAge} yrs)` : ""}
                      </strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Father&apos;s Profession:</span>
                      <strong className="stp-biodata-val">{candFatherProf || "Not specified"}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Mother&apos;s Name:</span>
                      <strong className="stp-biodata-val">
                        {candMotherName || "Not specified"} {candMotherAge ? `(Age: ${candMotherAge} yrs)` : ""}
                      </strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Mother&apos;s Profession:</span>
                      <strong className="stp-biodata-val">{candMotherProf || "Homemaker"}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Brothers:</span>
                      <strong className="stp-biodata-val">
                        {candBrothers} brother{candBrothers === "1" ? "" : "s"} ({candBrothersMarried} married)
                      </strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Sisters:</span>
                      <strong className="stp-biodata-val">
                        {candSisters} sister{candSisters === "1" ? "" : "s"} ({candSistersMarried} married)
                      </strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">House Ownership:</span>
                      <strong className="stp-biodata-val">{candHouse}</strong>
                    </div>
                  </div>
                </div>

                {/* 5. Location Details (Clean without redundant boxes) */}
                <div className="stp-biodata-card">
                  <h4 className="stp-biodata-card-title">
                    <span>📍</span> 5. Location Details (निवास स्थान)
                  </h4>
                  <div className="stp-biodata-grid">
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">City / Native:</span>
                      <strong className="stp-biodata-val">{candCity || "Not specified"}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">District:</span>
                      <strong className="stp-biodata-val">{candDistrict || "Not specified"}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">State:</span>
                      <strong className="stp-biodata-val">{candState || "Not specified"}</strong>
                    </div>
                    <div className="stp-biodata-field">
                      <span className="stp-biodata-label">Country:</span>
                      <strong className="stp-biodata-val">{candCountry}</strong>
                    </div>
                  </div>
                </div>

                {/* 6. Referral & Registration Details */}
                {(candRefer || candCreateDate) && (
                  <div className="stp-biodata-card">
                    <h4 className="stp-biodata-card-title">
                      <span>🤝</span> 6. Referral &amp; Registration Details (पंजीकरण विवरण)
                    </h4>
                    <div className="stp-biodata-grid">
                      {candRefer && (
                        <div className="stp-biodata-field">
                          <span className="stp-biodata-label">Member Referral Code:</span>
                          <strong className="stp-biodata-val" style={{ color: "#059669" }}>#{candRefer}</strong>
                        </div>
                      )}
                      {candCreateDate && (
                        <div className="stp-biodata-field">
                          <span className="stp-biodata-label">Profile Registered On:</span>
                          <strong className="stp-biodata-val">{formatDate(candCreateDate)}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Actions Toolbar */}
              <div className="stp-biodata-footer no-print">
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {u.profile?.id && (
                    <Button
                      danger={m.Active !== false}
                      style={
                        m.Active === false
                          ? { borderColor: "#16a34a", color: "#16a34a", fontWeight: 700, borderRadius: 10 }
                          : { fontWeight: 700, borderRadius: 10 }
                      }
                      onClick={() => handleToggleCandidateActive(u, m.Active === false)}
                    >
                      {m.Active !== false ? "Deactivate Profile" : "Activate Profile"}
                    </Button>
                  )}
                </div>

                <Button
                  onClick={() => {
                    setBiodataModalVisible(false);
                    setSelectedBiodataUser(null);
                  }}
                  style={{
                    borderRadius: 10,
                    fontWeight: 700,
                    height: 38,
                    padding: "0 20px",
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    color: "#334155",
                  }}
                >
                  Close Biodata
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Edit Candidate Password Modal (Points directly to User model) */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LockOutlined style={{ color: "#d97706" }} />
            <span>
              Edit Password - Candidate #{passwordTargetUser?.id} (
              {passwordTargetUser?.profile?.Full_Name ||
                passwordTargetUser?.first_name ||
                passwordTargetUser?.Contact ||
                "Candidate"}
              )
            </span>
          </div>
        }
        open={passwordModalVisible}
        destroyOnClose={true}
        onCancel={() => {
          setPasswordModalVisible(false);
          setPasswordTargetUser(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setPasswordModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            className="stp-btn-primary"
            loading={savingPassword}
            onClick={() => passwordForm.submit()}
          >
            Update Password
          </Button>,
        ]}
      >
        <Form form={passwordForm} layout="vertical" onFinish={handleSaveUserPassword}>
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 12.5,
              color: "#1e40af",
            }}
          >
            🔒 This updates the login password for candidate username / mobile:{" "}
            <strong>+91 {passwordTargetUser?.Contact || passwordTargetUser?.username}</strong>.
          </div>
          <Form.Item
            label="New Password"
            name="new_password"
            rules={[
              { required: true, message: "Please enter a new password" },
              { min: 4, message: "Password must be at least 4 characters" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" />
          </Form.Item>
          <Form.Item
            label="Confirm New Password"
            name="confirm_password"
            dependencies={["new_password"]}
            rules={[
              { required: true, message: "Please confirm new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new_password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default StaffPanel;
