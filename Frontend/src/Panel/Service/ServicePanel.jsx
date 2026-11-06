import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  Select,
  Spin,
  message,
  Tag,
  Modal,
  Drawer,
  Alert,
  Divider,
  Switch,
  InputNumber,
} from "antd";
import {
  LeftOutlined,
  RightOutlined,
  HomeOutlined,
  ShopOutlined,
  AppstoreOutlined,
  WalletOutlined,
  EnvironmentOutlined,
  CustomerServiceOutlined,
  LogoutOutlined,
  UploadOutlined,
  CopyOutlined,
  WhatsAppOutlined,
  PhoneOutlined,
  CheckCircleFilled,
  MenuOutlined,
  ShareAltOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SafetyCertificateFilled,
  SearchOutlined,
  ThunderboltFilled,
  CheckOutlined,
  ExclamationCircleOutlined,
  MinusOutlined,
  SyncOutlined,
  SendOutlined,
  StopOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ServiceUsersGet,
  ServiceUsersPost,
  ServiceUsersUpdate,
  ServiceUsersRemove,
  ServiceTransactionsGet,
  ServiceTransactionsPost,
  ServiceGet,
  ServiceChargeGet,
  User_StateGet,
  HelpGet,
  HelpPost,
} from "../../Api/CoreApi";
import "./ServicePanel.css";

const { Option } = Select;

const S3_MEDIA_BASE_URL = "https://risteybucket.s3.ap-south-1.amazonaws.com/";

// Media URL formatter via S3
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

// Parse date string into YYYY-MM-DD
const parseToISODate = (dateVal) => {
  if (!dateVal) return null;
  try {
    const s = String(dateVal).trim().split("T")[0];
    // Case 1: YYYY-MM-DD or YYYY/MM/DD
    const ymd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (ymd) {
      return `${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`;
    }
    // Case 2: DD-MM-YYYY or DD/MM/YYYY
    const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmy) {
      return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
    }
    // Case 3: Parse with Date object
    const dt = new Date(dateVal);
    if (!Number.isNaN(dt.getTime())) {
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, "0");
      const day = String(dt.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return null;
  } catch {
    return null;
  }
};

// Format Date YYYY-MM-DD to DD-MM-YYYY
const formatDate = (dateVal) => {
  if (!dateVal) return "Not Activated";
  const iso = parseToISODate(dateVal);
  if (iso) {
    const [year, month, day] = iso.split("-");
    return `${day}-${month}-${year}`;
  }
  return String(dateVal);
};

// Check if a service's Valid_Upto date is present and has NOT passed/exited the current local date
const isServiceDateValid = (dateVal) => {
  const iso = parseToISODate(dateVal);
  if (!iso) return false;
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;
    // If iso < todayStr, the validity has expired
    return iso >= todayStr;
  } catch {
    return false;
  }
};

// Check if a service has Admin_Approval (true, "true", 1)
const isAdminApproved = (svc) => {
  if (!svc) return false;
  return (
    svc.Admin_Approval === true ||
    svc.Admin_Approval === "true" ||
    svc.Admin_Approval === "True" ||
    svc.Admin_Approval === 1
  );
};

// A service is truly Live only if it has Admin_Approval AND is marked Active AND its validity date has not passed current date
const isServiceLive = (svc) => {
  return isAdminApproved(svc) && Boolean(svc?.Active) && isServiceDateValid(svc?.Valid_Upto);
};

// Format Date & Time DD-MM-YYYY HH:mm A
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

function ServicePanel() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Authentication & Session data
  const token = localStorage.getItem("access_token");
  const role = (localStorage.getItem("role") || "").toLowerCase().trim();
  const userId = localStorage.getItem("user_id");
  const storedContact = localStorage.getItem("contact") || "";
  const storedUsername = localStorage.getItem("username") || "";

  // Active navigation tab
  const [activeTab, setActiveTab] = useState("dashboard");
  const [serviceStatusFilter, setServiceStatusFilter] = useState("all"); // "all" | "active" | "deactive"
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  // Sync tab with URL (?tab=...)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      [
        "dashboard",
        "myservices",
        "addservice",
        "transactions",
        "help",
      ].includes(tab)
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const switchTab = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
    setMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Clickable Stat Card navigation handler
  const handleStatCardClick = (target) => {
    if (target === "transactions") {
      setTxFilterStatus("all");
      switchTab("transactions");
    } else {
      setServiceStatusFilter(target);
      switchTab("myservices");
    }
  };

  // State data
  const [loading, setLoading] = useState(true);
  const [savingService, setSavingService] = useState(false);
  const [recharging, setRecharging] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Help & Support Tickets (Role: Service)
  const [helpTickets, setHelpTickets] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [submittingHelp, setSubmittingHelp] = useState(false);

  // Track seen Help & Support ticket answers (unseen count only in side menu)
  const [seenHelpIds, setSeenHelpIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`sp_seen_help_answers_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const unseenHelpCount = useMemo(() => {
    if (!Array.isArray(helpTickets)) return 0;
    return helpTickets.filter(
      (h) => h.Answer && h.Answer.trim() && !seenHelpIds.includes(String(h.id))
    ).length;
  }, [helpTickets, seenHelpIds]);

  // When user opens or is on Help & Support tab, mark answered tickets as seen
  useEffect(() => {
    if (activeTab === "help" && Array.isArray(helpTickets) && helpTickets.length > 0) {
      const answeredIds = helpTickets
        .filter((h) => h.Answer && h.Answer.trim())
        .map((h) => String(h.id));

      if (answeredIds.length > 0) {
        setSeenHelpIds((prev) => {
          const merged = Array.from(new Set([...prev, ...answeredIds]));
          if (merged.length !== prev.length) {
            try {
              localStorage.setItem(
                `sp_seen_help_answers_${userId}`,
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
  }, [activeTab, helpTickets, userId]);

  // Multiple Services/Businesses added by this service partner
  const [myServices, setMyServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  // Inherited values from Services model
  const [inheritedServices, setInheritedServices] = useState([]);

  // Charges / Plans from Service_Charge model
  const [chargePlans, setChargePlans] = useState([]);

  // Transactions list
  const [transactions, setTransactions] = useState([]);

  // Dropdown reference data
  const [statesList, setStatesList] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);

  // Forms
  const [serviceForm] = Form.useForm();
  const [selectedServiceForRecharge, setSelectedServiceForRecharge] = useState(null);

  // Dedicated Card Recharge Modal
  const [cardRechargeModalVisible, setCardRechargeModalVisible] = useState(false);
  const [cardRechargeService, setCardRechargeService] = useState(null);
  const [rechargeMonths, setRechargeMonths] = useState(1);

  // Picture upload
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState("");

  // Coverage Zones state for current service
  const [zonesList, setZonesList] = useState([]);
  const [newZoneInput, setNewZoneInput] = useState("");

  // Transaction filters
  const [txFilterStatus, setTxFilterStatus] = useState("all");
  const [txSearchText, setTxSearchText] = useState("");

  // Role Protection
  useEffect(() => {
    if (!token) {
      navigate("/ServiceLogin");
      return;
    }
    if (role && role !== "service") {
      message.info("Redirected based on your account role.");
      if (role === "staff") {
        navigate("/StaffPanel");
      } else {
        navigate("/UserPanel");
      }
    }
  }, [token, role, navigate]);

  // Load all initial data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        serviceUsersRes,
        servicesRes,
        chargePlansRes,
        transactionsRes,
        statesRes,
        helpRes,
      ] = await Promise.allSettled([
        ServiceUsersGet(userId ? { Service_id: userId, scope: "service_panel" } : { scope: "service_panel" }),
        ServiceGet(),
        ServiceChargeGet(),
        ServiceTransactionsGet(),
        User_StateGet(),
        HelpGet(),
      ]);

      // 1. Process States & Districts
      if (statesRes.status === "fulfilled" && Array.isArray(statesRes.value)) {
        setStatesList(statesRes.value);
      }

      // 2. Process Inherited Services from Services Model
      if (servicesRes.status === "fulfilled") {
        const rawServices = Array.isArray(servicesRes.value)
          ? servicesRes.value
          : servicesRes.value?.results || [];
        setInheritedServices(rawServices);
      }

      // 3. Process Charge Plans from Service_Charge Model
      if (chargePlansRes.status === "fulfilled") {
        const rawPlans = Array.isArray(chargePlansRes.value)
          ? chargePlansRes.value
          : chargePlansRes.value?.results || [];
        setChargePlans(rawPlans);
      }

      // 4. Process Service_Data models (Filter for current User)
      let userServices = [];
      if (serviceUsersRes.status === "fulfilled") {
        const rawList = Array.isArray(serviceUsersRes.value)
          ? serviceUsersRes.value
          : serviceUsersRes.value?.results || [];

        // Match by Service_id == userId (can have multiple services)
        userServices = rawList.filter((item) => {
          const sid = item.Service_id?.id || item.Service_id;
          return String(sid) === String(userId);
        });

        // Fallback match by contact if needed
        if (userServices.length === 0 && storedContact) {
          userServices = rawList.filter(
            (item) =>
              String(item.WP_Contact || "").includes(storedContact) ||
              String(item.Alt_Contact || "").includes(storedContact)
          );
        }

        // If backend returned scoped list for this authenticated service user, use rawList
        if (userServices.length === 0 && rawList.length > 0) {
          userServices = rawList;
        }
      }
      setMyServices(userServices);

      // Pre-select first service for recharge if available
      if (userServices.length > 0 && !selectedServiceForRecharge) {
        setSelectedServiceForRecharge(userServices[0].id);
      }

      // 5. Process Transactions
      if (transactionsRes.status === "fulfilled") {
        const rawTxs = Array.isArray(transactionsRes.value)
          ? transactionsRes.value
          : transactionsRes.value?.results || [];

        // Filter transactions for this user's services or user_id
        const userSvcIds = userServices.map((s) => String(s.id));
        const filteredTxs = rawTxs.filter(
          (tx) =>
            String(tx.User_id) === String(userId) ||
            userSvcIds.includes(String(tx.Service_id))
        );
        setTransactions(filteredTxs);
      }

      // 6. Process Help Tickets
      if (helpRes.status === "fulfilled") {
        const rawHelp = Array.isArray(helpRes.value)
          ? helpRes.value
          : helpRes.value?.results || [];
        setHelpTickets(rawHelp);
      }
    } catch (err) {
      console.error("Error loading service partner data:", err);
      message.error("Unable to load service partner portal data.");
    } finally {
      setLoading(false);
    }
  }, [userId, storedContact, selectedServiceForRecharge]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Helper: Parse Nearby Districts array/JSON
  // Handle State Change -> Update Available Districts & clear District/Available_Zone
  const handleStateChange = (selectedState) => {
    serviceForm.setFieldsValue({ District: undefined, Available_Zone: [] });
    setZonesList([]);
    const stObj = statesList.find((s) => s.State === selectedState);
    const dists = Array.isArray(stObj?.Districts) ? stObj.Districts : [];
    setAvailableDistricts(dists);
  };

  // Handle District Change -> Set primary district in form
  const handleDistrictChange = (selectedDistrict) => {
    serviceForm.setFieldsValue({ District: selectedDistrict });
  };

  // Handle Available_Zone selection from multi-select
  const handleAvailableZoneChange = (values) => {
    // If "All" was just selected
    if (values.includes("All") && !zonesList.includes("All")) {
      const allSelected = Array.from(new Set(["All", ...availableDistricts]));
      setZonesList(allSelected);
      serviceForm.setFieldsValue({ Available_Zone: allSelected });
      return;
    }
    // If "All" was deselected
    if (!values.includes("All") && zonesList.includes("All")) {
      const filtered = values.filter((v) => v !== "All");
      setZonesList(filtered);
      serviceForm.setFieldsValue({ Available_Zone: filtered });
      return;
    }
    setZonesList(values);
    serviceForm.setFieldsValue({ Available_Zone: values });
  };

  // Quick Action: Select All Districts of the current state
  const handleSelectAllDistricts = () => {
    if (availableDistricts.length === 0) {
      message.warning("Please select a State first to view districts.");
      return;
    }
    const allSelected = Array.from(new Set(["All", ...availableDistricts]));
    setZonesList(allSelected);
    serviceForm.setFieldsValue({ Available_Zone: allSelected });
    message.success(`All ${availableDistricts.length} districts of state selected for coverage.`);
  };

  // Quick Action: Clear all coverage districts
  const handleClearAllDistricts = () => {
    setZonesList([]);
    serviceForm.setFieldsValue({ Available_Zone: [] });
  };

  // Quick Action: Toggle individual district in/out of Available_Zone
  const handleToggleDistrictZone = (distName) => {
    if (distName === "All") {
      if (zonesList.includes("All")) {
        handleClearAllDistricts();
      } else {
        handleSelectAllDistricts();
      }
      return;
    }

    let updated;
    if (zonesList.includes(distName)) {
      updated = zonesList.filter((z) => z !== distName && z !== "All");
    } else {
      updated = [...zonesList.filter((z) => z !== "All"), distName];
      if (availableDistricts.length > 0 && availableDistricts.every((d) => updated.includes(d))) {
        updated = ["All", ...updated];
      }
    }
    setZonesList(updated);
    serviceForm.setFieldsValue({ Available_Zone: updated });
  };

  // Open Modal to Add New Business
  const handleOpenAddServiceModal = () => {
    setEditingService(null);
    setProfilePicFile(null);
    setProfilePicPreview("");
    setZonesList([]);
    setAvailableDistricts([]);
    serviceForm.resetFields();
    serviceForm.setFieldsValue({
      WP_Contact: (storedContact || "").toString().replace(/\D/g, "").slice(0, 10),
      Alt_Contact: "",
      Service_Name: "",
      Service_Type: inheritedServices[0]?.Service_Name || undefined,
      Country: "India",
      Available_Zone: [],
    });
    setIsServiceModalOpen(true);
  };

  // Open Modal to Edit Existing Business
  const handleOpenEditServiceModal = (serviceItem) => {
    setEditingService(serviceItem);
    setProfilePicFile(null);
    setProfilePicPreview(
      serviceItem.Picture ? getMediaUrl(serviceItem.Picture) : ""
    );

    const initialZones = Array.isArray(serviceItem.Available_Zone)
      ? serviceItem.Available_Zone
      : typeof serviceItem.Available_Zone === "string"
      ? serviceItem.Available_Zone.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    setZonesList(initialZones);

    // Populate districts for service state
    if (serviceItem.State) {
      const stObj = statesList.find((s) => s.State === serviceItem.State);
      setAvailableDistricts(Array.isArray(stObj?.Districts) ? stObj.Districts : []);
    } else {
      setAvailableDistricts([]);
    }

    serviceForm.setFieldsValue({
      Service_Name: serviceItem.Service_Name || "",
      Service_Type: serviceItem.Service_Type || undefined,
      Service_Price: serviceItem.Service_Price || "",
      Service_Description: serviceItem.Service_Description || "",
      WP_Contact: (serviceItem.WP_Contact || storedContact || "")
        .toString()
        .replace(/\D/g, "")
        .slice(0, 10),
      Alt_Contact: (serviceItem.Alt_Contact || "")
        .toString()
        .replace(/\D/g, "")
        .slice(0, 10),
      State: serviceItem.State || "",
      District: serviceItem.District || "",
      City: serviceItem.City || "",
      Full_Address: serviceItem.Full_Address || "",
      Available_Zone: initialZones,
    });
    setIsServiceModalOpen(true);
  };

  // Save Service (Create or Update)
  const handleSaveService = async (values) => {
    // Strictly validate 10-digit phone numbers
    const wpClean = (values.WP_Contact || "").toString().replace(/\D/g, "");
    if (!wpClean || wpClean.length !== 10) {
      message.error("WhatsApp contact number must be exactly 10 digits.");
      return;
    }

    const altRaw = (values.Alt_Contact || "").toString().trim();
    const altClean = altRaw ? altRaw.replace(/\D/g, "") : "";
    if (altRaw && altClean.length !== 10) {
      message.error("Alternate phone number must be exactly 10 digits.");
      return;
    }

    setSavingService(true);
    try {
      const formData = new FormData();
      formData.append("Service_id", userId);
      formData.append("Service_Name", values.Service_Name || "");
      formData.append("Service_Type", values.Service_Type || "");
      if (values.Service_Price !== undefined && values.Service_Price !== null) {
        formData.append("Service_Price", String(values.Service_Price));
      }
      formData.append("Service_Description", values.Service_Description || "");
      formData.append("WP_Contact", wpClean);
      formData.append("Alt_Contact", altClean);
      formData.append("State", values.State || "");
      formData.append("District", values.District || "");
      formData.append("City", values.City || "");
      formData.append("Full_Address", values.Full_Address || "");
      formData.append("Available_Zone", JSON.stringify(zonesList));

      if (profilePicFile) {
        formData.append("Picture", profilePicFile);
      }

      if (editingService?.id) {
        // Update existing service
        await ServiceUsersUpdate(editingService.id, formData);
        message.success("✅ Business details updated successfully!");
      } else {
        // Add new service: first time business submission pending Admin approval
        formData.append("Admin_Approval", "false");
        formData.append("Active", "false");
        await ServiceUsersPost(formData);
        message.success(
          "🎉 Business service registered successfully! Your listing has been submitted for Admin Review."
        );
      }

      setIsServiceModalOpen(false);
      serviceForm.resetFields();
      fetchAllData();
    } catch (err) {
      console.error("Save service error:", err);
      let errMsg = "Failed to save service. Please verify your inputs.";
      if (err?.response?.data) {
        const d = err.response.data;
        if (typeof d === "string") errMsg = d;
        else if (d.detail) errMsg = d.detail;
        else if (d.message) errMsg = d.message;
        else if (typeof d === "object") {
          const firstVal = Object.values(d)[0];
          if (Array.isArray(firstVal)) errMsg = firstVal.join(" ");
          else if (typeof firstVal === "string") errMsg = firstVal;
        }
      }
      message.error(errMsg);
    } finally {
      setSavingService(false);
    }
  };

  // Delete Service
  const handleDeleteService = (serviceId) => {
    Modal.confirm({
      title: "Delete Business Listing?",
      icon: <ExclamationCircleOutlined style={{ color: "#dc2626" }} />,
      content:
        "Are you sure you want to delete this business service? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await ServiceUsersRemove(serviceId);
          message.success("Business service deleted.");
          setMyServices((prev) => prev.filter((s) => s.id !== serviceId));
        } catch {
          message.error("Failed to delete business service.");
        }
      },
    });
  };

  // Add Zone Tag
  const handleAddZone = () => {
    const trimmed = newZoneInput.trim();
    if (!trimmed) return;
    if (zonesList.includes(trimmed)) {
      message.info("Coverage zone already added.");
      return;
    }
    const updated = [...zonesList, trimmed];
    setZonesList(updated);
    setNewZoneInput("");
  };

  // Filter Service_Charge plans based on specific Service's Service_Type
  const getPlansForService = useCallback(
    (serviceItem) => {
      if (!serviceItem) return chargePlans;
      const targetType = (serviceItem.Service_Type || "").toLowerCase().trim();
      const targetName = (serviceItem.Service_Name || "").toLowerCase().trim();

      const matched = chargePlans.filter((plan) => {
        const pName = (plan.service_name || "").toLowerCase().trim();
        const pType = (plan.service_type_name || "").toLowerCase().trim();
        return (
          (pName && (pName === targetType || pName === targetName)) ||
          (pType && (pType === targetType || pType === targetName)) ||
          String(plan.Service_Type) === String(serviceItem.Service_Type)
        );
      });

      return matched;
    },
    [chargePlans]
  );

  // Helper: calculate new expiration date given current Valid_Upto and months to add
  const calculateExtendedDate = (currentValidUpto, monthsToAdd) => {
    const now = new Date();
    const isFuture = currentValidUpto && new Date(currentValidUpto) > now;
    // If currently valid, extend from current expiry date; otherwise activate from today
    const base = isFuture ? new Date(currentValidUpto) : new Date();
    const newDate = new Date(base);
    newDate.setMonth(newDate.getMonth() + Number(monthsToAdd || 1));

    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, "0");
    const dd = String(newDate.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper: get base monthly charge rate for a service (default ₹500 if not found)
  const getMonthlyRateForService = useCallback(
    (serviceItem) => {
      if (!serviceItem) return 500;
      const applicablePlans = getPlansForService(serviceItem);
      if (applicablePlans.length > 0) {
        const p = applicablePlans[0];
        const val = Number(p.Validity) || 1;
        const amt = Number(p.Amount) || 500;
        return Math.max(1, Math.round(amt / val));
      }
      if (chargePlans.length > 0) {
        const p = chargePlans[0];
        const val = Number(p.Validity) || 1;
        const amt = Number(p.Amount) || 500;
        return Math.max(1, Math.round(amt / val));
      }
      return 500; // standard base rate ₹500/month
    },
    [getPlansForService, chargePlans]
  );

  // Toggle Active / Deactive for a service by the service user
  const handleToggleServiceActive = async (svc, newActiveState) => {
    try {
      const approved = isAdminApproved(svc);
      const isDateValid = isServiceDateValid(svc.Valid_Upto);

      if (!approved && newActiveState) {
        message.warning(
          `"${svc.Service_Name}" is pending Admin Approval. Once approved by administration, it will become live!`
        );
        return;
      }

      // Optimistic local state update
      setMyServices((prev) =>
        prev.map((s) => (s.id === svc.id ? { ...s, Active: newActiveState } : s))
      );

      await ServiceUsersUpdate(svc.id, {
        Active: newActiveState,
      });

      if (newActiveState) {
        if (isDateValid) {
          message.success(`🟢 "${svc.Service_Name}" is now Active & Live for clients!`);
        } else {
          message.warning(
            `"${svc.Service_Name}" is marked Active, but its validity expired on ${formatDate(
              svc.Valid_Upto
            )}. Please recharge plan to make it visible to clients.`
          );
        }
      } else {
        message.info(`⚪ "${svc.Service_Name}" is deactivated and hidden from search.`);
      }
      fetchAllData();
    } catch (err) {
      console.error("Toggle Active error:", err);
      const errMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to update service status. Please try again.";
      message.error(errMsg);
      fetchAllData();
    }
  };

  // RECHARGE / PAYMENT FLOW
  // Open dedicated card recharge modal for a service
  const handleOpenCardRechargeModal = (serviceItem) => {
    setCardRechargeService(serviceItem);
    setSelectedServiceForRecharge(serviceItem.id);
    setRechargeMonths(1);
    setCardRechargeModalVisible(true);
  };

  // Direct confirmation of Card Recharge with extended months
  const handleConfirmCardRecharge = async (serviceItem, months, totalAmount, newValidUpto) => {
    if (!serviceItem?.id) {
      message.error("Selected service not found.");
      return;
    }

    setRecharging(true);
    try {
      // 1. Record Transaction and atomically update Valid_Upto & Active on backend
      await ServiceTransactionsPost({
        User_id: userId,
        Service_id: serviceItem.id,
        Amount: totalAmount,
        Status: "Success",
        Valid_Upto: newValidUpto,
      });

      // 2. Update service with new Valid_Upto AND set Active = true AND Admin_Approval = true
      await ServiceUsersUpdate(serviceItem.id, {
        Valid_Upto: newValidUpto,
        Active: true,
        Admin_Approval: true,
      });

      message.success(
        `🎉 Recharge Successful! Validity extended by ${months} month(s) until ${formatDate(
          newValidUpto
        )}. Your listing is now Active and Live!`
      );

      setCardRechargeModalVisible(false);
      fetchAllData();
    } catch (err) {
      console.error("Recharge failed:", err);
      const errMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Recharge transaction could not be processed. Please try again.";
      message.error(errMsg);
    } finally {
      setRecharging(false);
    }
  };

  // Service Registration Link & Share helpers (Direct link without refer code)
  const serviceRegistrationUrl = useMemo(() => {
    return `${window.location.origin}/ServiceRegister`;
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(serviceRegistrationUrl);
    setCopiedLink(true);
    message.success("Service Registration link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `नमस्कार! वैवाहिक मंच (Vaivaheek Manch) पर सर्विस पार्टनर के रूप में रजिस्टर करें और अपना बिजनेस जोड़ें:\n🔗 ${serviceRegistrationUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Help & Support Queries (Using Help model with Role="service")
  const fetchHelpQueries = useCallback(async () => {
    try {
      const res = await HelpGet();
      const list = Array.isArray(res) ? res : res?.data || [];
      setHelpTickets(list);
    } catch (err) {
      console.warn("Could not fetch help tickets:", err);
    }
  }, []);

  const handleSendHelpQuery = async () => {
    if (!newQuestion.trim()) {
      message.warning("Please enter your inquiry.");
      return;
    }
    setSubmittingHelp(true);
    try {
      await HelpPost({
        Question: newQuestion.trim(),
        User_Role: "service",
        Role: "service",
        User_id: userId,
      });
      message.success("Inquiry submitted to Administration Team.");
      setNewQuestion("");
      fetchHelpQueries();
    } catch (err) {
      console.error("Help submit error:", err);
      message.error("Failed to submit inquiry.");
    } finally {
      setSubmittingHelp(false);
    }
  };

  // Logout
  const handleLogout = () => {
    Modal.confirm({
      title: "Logout from Service Portal?",
      content: "Are you sure you want to end your current session?",
      okText: "Logout",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        localStorage.clear();
        message.success("Logged out successfully.");
        navigate("/");
      },
    });
  };

  // Calculated Stats
  const activeServicesCount = useMemo(() => {
    return myServices.filter((s) => isServiceLive(s)).length;
  }, [myServices]);

  const pendingServicesCount = useMemo(() => {
    return myServices.filter((s) => !isAdminApproved(s)).length;
  }, [myServices]);

  const expiredServicesCount = useMemo(() => {
    return myServices.filter((s) => isAdminApproved(s) && !isServiceDateValid(s.Valid_Upto)).length;
  }, [myServices]);

  const inactiveServicesCount = useMemo(() => {
    return myServices.filter((s) => !Boolean(s.Active)).length;
  }, [myServices]);



  const displayedMyServices = useMemo(() => {
    if (serviceStatusFilter === "active") {
      return myServices.filter((s) => isServiceLive(s));
    }
    if (serviceStatusFilter === "pending") {
      return myServices.filter((s) => !isAdminApproved(s));
    }
    if (serviceStatusFilter === "expired") {
      return myServices.filter((s) => isAdminApproved(s) && !isServiceDateValid(s.Valid_Upto));
    }
    if (serviceStatusFilter === "deactivated" || serviceStatusFilter === "inactive") {
      return myServices.filter((s) => !Boolean(s.Active));
    }
    if (serviceStatusFilter === "deactive") {
      return myServices.filter((s) => !isServiceLive(s));
    }
    return myServices;
  }, [myServices, serviceStatusFilter]);

  const totalSpentRecharge = useMemo(() => {
    return transactions
      .filter((t) => (t.Status || "").toLowerCase() === "success")
      .reduce((sum, t) => sum + (Number(t.Amount) || 0), 0);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchStatus =
        txFilterStatus === "all" ||
        (tx.Status || "").toLowerCase() === txFilterStatus.toLowerCase();
      const s = myServices.find((item) => String(item.id) === String(tx.Service_id));
      const sTitle = tx.service_title || s?.Service_Name || "";
      const sType = tx.service_type || s?.Service_Type || "";
      const matchSearch =
        !txSearchText ||
        String(tx.id || "").includes(txSearchText) ||
        String(tx.Service_id || "").includes(txSearchText) ||
        sTitle.toLowerCase().includes(txSearchText.toLowerCase()) ||
        sType.toLowerCase().includes(txSearchText.toLowerCase()) ||
        String(tx.Amount || "").includes(txSearchText);
      return matchStatus && matchSearch;
    });
  }, [transactions, txFilterStatus, txSearchText, myServices]);

  // Loading spinner
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          gap: 16,
        }}
      >
        <Spin size="large" />
        <span style={{ color: "#4f46e5", fontWeight: 700, fontSize: 15 }}>
          Loading Service Partner Portal...
        </span>
      </div>
    );
  }

  // Navigation Items
  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: <ShopOutlined /> },
    {
      key: "myservices",
      label: "Manage Added Services",
      icon: <AppstoreOutlined />,
    },
    {
      key: "transactions",
      label: "Transactions History",
      icon: <WalletOutlined />,
    },
    {
      key: "help",
      label: "Help & Support",
      icon: <CustomerServiceOutlined />,
      badge: unseenHelpCount > 0 ? unseenHelpCount : undefined,
    },
  ];

  return (
    <div className="sp-container">
      {/* ============================================================== */}
      {/* DESKTOP SIDEBAR                                                */}
      {/* ============================================================== */}
      <aside className="sp-sidebar">
        {/* Brand */}
        <div className="sp-sidebar-header">
          <div className="sp-brand-logo">
            <ShopOutlined />
          </div>
          <div className="sp-brand-info">
            <h3>वैवाहिक मंच</h3>
            <p>Service Partner Portal</p>
          </div>
        </div>

        {/* Partner Info Card */}
        <div className="sp-sidebar-user">
          <div className="sp-sidebar-avatar">
            <ShopOutlined />
          </div>
          <div className="sp-sidebar-meta">
            <p className="sp-sidebar-name">{storedUsername || "Service Partner"}</p>
            <span className="sp-sidebar-role">
              <SafetyCertificateFilled style={{ color: "#4f46e5" }} /> Verified Account
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sp-nav">
          <span className="sp-nav-label">Navigation Menu</span>
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`sp-nav-item ${activeTab === item.key ? "active" : ""}`}
              onClick={() => switchTab(item.key)}
            >
              <span className="sp-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="sp-nav-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="sp-sidebar-footer">
          <button
            type="button"
            className="sp-btn-gold"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => setShareModalVisible(true)}
          >
            <ShareAltOutlined /> Share Registration Link
          </button>
          <button
            type="button"
            className="sp-home-btn"
            onClick={() => navigate("/")}
          >
            <HomeOutlined /> Homepage
          </button>
          <button
            type="button"
            className="sp-logout-btn"
            onClick={handleLogout}
          >
            <LogoutOutlined /> Logout
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MOBILE TOP HEADER                                              */}
      {/* ============================================================== */}
      <header className="sp-mobile-header">
        <div className="sp-mobile-brand">
          <div className="sp-mobile-logo-badge">
            <ShopOutlined />
          </div>
          <div>
            <div className="sp-mobile-title">वैवाहिक मंच</div>
            <div className="sp-mobile-subtitle">Service Partner</div>
          </div>
        </div>
        <div className="sp-mobile-actions">
          <button
            type="button"
            className="sp-mobile-menu-btn"
            onClick={() => setShareModalVisible(true)}
            title="Share Registration Link"
          >
            <ShareAltOutlined />
          </button>
          <button
            type="button"
            className="sp-mobile-menu-btn"
            onClick={() => setMobileDrawerOpen(true)}
            title="Open Menu"
          >
            <MenuOutlined />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <Drawer
        title="Service Partner Menu"
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        width={280}
      >
        {/* Middle Vertical Close Arrow Button (Mobile Drawer) */}
        <button
          type="button"
          className="sp-drawer-close-btn"
          onClick={() => setMobileDrawerOpen(false)}
          title="Close Side Menu"
          aria-label="Close Side Menu"
        >
          <LeftOutlined />
        </button>
        <div style={{ paddingBottom: 16, borderBottom: "1px solid #f1f5f9", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="sp-sidebar-avatar">
              <ShopOutlined />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>
                {storedUsername || "Service Partner"}
              </div>
              <div style={{ fontSize: 11, color: "#4f46e5", fontWeight: 700 }}>
                {myServices.length} Added Services
              </div>
            </div>
          </div>
        </div>



        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`sp-nav-item ${activeTab === item.key ? "active" : ""}`}
              onClick={() => switchTab(item.key)}
            >
              <span className="sp-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="sp-nav-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <Divider />
        <button
          type="button"
          className="sp-btn-gold"
          style={{ width: "100%", justifyContent: "center", marginBottom: 10 }}
          onClick={() => {
            setMobileDrawerOpen(false);
            setShareModalVisible(true);
          }}
        >
          <ShareAltOutlined /> Share Registration Link
        </button>
        <button
          type="button"
          className="sp-home-btn"
          style={{ width: "100%", justifyContent: "center", marginBottom: 10 }}
          onClick={() => {
            setMobileDrawerOpen(false);
            navigate("/");
          }}
        >
          <HomeOutlined /> Homepage
        </button>
        <button
          type="button"
          className="sp-logout-btn"
          onClick={handleLogout}
        >
          <LogoutOutlined /> Logout
        </button>
      </Drawer>

      {/* ============================================================== */}
      {/* MAIN CONTENT AREA                                              */}
      {/* ============================================================== */}
      <main className="sp-main">
        {/* ============================================================ */}
        {/* TAB 1: DASHBOARD OVERVIEW                                    */}
        {/* ============================================================ */}
        {activeTab === "dashboard" && (
          <div>
            {/* Hero Banner */}
            <div className="sp-hero-card">
              <div className="sp-hero-top">
                <div>
                  <span className="sp-hero-badge">
                    <SafetyCertificateFilled /> Verified Service Provider Hub
                  </span>
                  <h1 className="sp-hero-title">
                    Welcome, {storedUsername || "Service Partner"}!
                  </h1>
                  <p className="sp-hero-desc">
                    Manage all your wedding services (Photography, Catering, Mandap, DJ, Makeup, etc.),
                    track recharge validity, and activate your businesses on Vaivaheek Manch.
                  </p>
                </div>
              </div>

              <div className="sp-hero-actions">
                <button
                  type="button"
                  className="sp-btn-gold"
                  onClick={handleOpenAddServiceModal}
                >
                  <PlusOutlined /> + Add New Business Service
                </button>
                <button
                  type="button"
                  className="sp-btn-outline-white"
                  onClick={() => switchTab("myservices")}
                >
                  <AppstoreOutlined /> Manage Added Services ({myServices.length})
                </button>
                <button
                  type="button"
                  className="sp-btn-outline-white"
                  onClick={() => switchTab("transactions")}
                >
                  <WalletOutlined /> Recharge &amp; Payment History
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="sp-stats-grid">
              <div
                className="sp-stat-card"
                onClick={() => handleStatCardClick("all")}
                role="button"
                tabIndex={0}
                title="Click to view all added business services"
              >
                <div className="sp-stat-icon-wrap sp-stat-icon-indigo">
                  <ShopOutlined />
                </div>
                <div className="sp-stat-info">
                  <p className="sp-stat-label">Total Services</p>
                  <h3 className="sp-stat-value">{myServices.length}</h3>
                  <span className="sp-stat-sub">All listings &rarr;</span>
                </div>
              </div>

              <div
                className="sp-stat-card"
                onClick={() => handleStatCardClick("active")}
                role="button"
                tabIndex={0}
                title="Click to view active & live services"
              >
                <div className="sp-stat-icon-wrap sp-stat-icon-emerald">
                  <CheckCircleFilled />
                </div>
                <div className="sp-stat-info">
                  <p className="sp-stat-label">Active &amp; Live</p>
                  <h3 className="sp-stat-value">{activeServicesCount}</h3>
                  <span className="sp-stat-sub">Visible to Clients &rarr;</span>
                </div>
              </div>

              <div
                className="sp-stat-card"
                onClick={() => handleStatCardClick("pending")}
                role="button"
                tabIndex={0}
                title="Click to view services pending admin approval"
              >
                <div className="sp-stat-icon-wrap sp-stat-icon-gold">
                  <ClockCircleOutlined />
                </div>
                <div className="sp-stat-info">
                  <p className="sp-stat-label">Under Review</p>
                  <h3 className="sp-stat-value">{pendingServicesCount}</h3>
                  <span className="sp-stat-sub">Pending Approval &rarr;</span>
                </div>
              </div>

              <div
                className="sp-stat-card"
                onClick={() => handleStatCardClick("expired")}
                role="button"
                tabIndex={0}
                title="Click to view expired services requiring recharge"
              >
                <div className="sp-stat-icon-wrap sp-stat-icon-rose">
                  <WarningOutlined />
                </div>
                <div className="sp-stat-info">
                  <p className="sp-stat-label">Expired Services</p>
                  <h3 className="sp-stat-value">{expiredServicesCount}</h3>
                  <span className="sp-stat-sub">Recharge required &rarr;</span>
                </div>
              </div>

              <div
                className="sp-stat-card"
                onClick={() => handleStatCardClick("deactivated")}
                role="button"
                tabIndex={0}
                title="Click to view deactivated / hidden services"
              >
                <div className="sp-stat-icon-wrap" style={{ background: "#f1f5f9", color: "#64748b" }}>
                  <StopOutlined />
                </div>
                <div className="sp-stat-info">
                  <p className="sp-stat-label">Deactivated</p>
                  <h3 className="sp-stat-value">{inactiveServicesCount}</h3>
                  <span className="sp-stat-sub">Turned off / hidden &rarr;</span>
                </div>
              </div>

              <div
                className="sp-stat-card"
                onClick={() => handleStatCardClick("transactions")}
                role="button"
                tabIndex={0}
                title="Click to view recharge & payment transactions"
              >
                <div className="sp-stat-icon-wrap sp-stat-icon-rose">
                  <WalletOutlined />
                </div>
                <div className="sp-stat-info">
                  <p className="sp-stat-label">Recharge History</p>
                  <h3 className="sp-stat-value">
                    ₹{totalSpentRecharge.toLocaleString("en-IN")}
                  </h3>
                  <span className="sp-stat-sub">{transactions.length} transactions &rarr;</span>
                </div>
              </div>
            </div>

            {/* Quick Overview: My Added Services */}
            <div className="sp-card">
              <div className="sp-card-header">
                <div>
                  <h3 className="sp-card-title">
                    <AppstoreOutlined style={{ color: "#4f46e5" }} /> Your Registered Services &amp; Businesses
                  </h3>
                  <p className="sp-card-desc">
                    Active services appear in candidate search; deactivated services require admin approval.
                  </p>
                </div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  style={{ background: "#4f46e5", borderRadius: 12, fontWeight: 700 }}
                  onClick={handleOpenAddServiceModal}
                >
                  Add Business
                </Button>
              </div>

              {myServices.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 10px", color: "#94a3b8" }}>
                  <ShopOutlined style={{ fontSize: 44, color: "#cbd5e1", marginBottom: 12 }} />
                  <h4 style={{ margin: 0, fontWeight: 700, color: "#334155" }}>
                    No Business Services Added Yet
                  </h4>
                  <p style={{ margin: "6px 0 16px", fontSize: 13 }}>
                    List your wedding services (Photography, Catering, Decoration, etc.) to start receiving clients.
                  </p>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    style={{ background: "#4f46e5", fontWeight: 700 }}
                    onClick={handleOpenAddServiceModal}
                  >
                    + Add Your First Business Service
                  </Button>
                </div>
              ) : (
                <div className="sp-services-grid">
                  {myServices.map((svc) => {
                    const approved = isAdminApproved(svc);
                    const isPendingApproval = !approved;
                    const isDateValid = isServiceDateValid(svc.Valid_Upto);
                    const isLive = approved && Boolean(svc.Active) && isDateValid;
                    // Expired ONLY when approved by admin, but validity date has passed
                    const isExpired = approved && !isDateValid;

                    return (
                      <div
                        className={`sp-service-card ${isExpired ? "sp-service-card-expired" : isPendingApproval ? "sp-service-card-pending" : ""}`}
                        key={svc.id}
                      >
                        <div className="sp-service-thumb">
                          {svc.Picture ? (
                            <img src={getMediaUrl(svc.Picture)} alt={svc.Service_Name} />
                          ) : (
                            <ShopOutlined style={{ fontSize: 44, color: "#818cf8" }} />
                          )}
                          <div className="sp-service-thumb-badge">
                            <Tag
                              color={isLive ? "green" : isPendingApproval ? "orange" : isExpired ? "error" : "default"}
                              style={{ fontWeight: 800, borderRadius: 12, padding: "2px 10px" }}
                            >
                              {isLive ? "🟢 Live" : isPendingApproval ? "⏳ Under Review" : isExpired ? "⚠️ Expired" : "⚪ Deactive"}
                            </Tag>
                          </div>
                        </div>

                        <div className="sp-service-content">
                          <h4 className="sp-service-title">{svc.Service_Name}</h4>
                          <div style={{ marginBottom: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <Tag color="purple" style={{ fontWeight: 700, borderRadius: 10 }}>
                              {svc.Service_Type || "Wedding Service"}
                            </Tag>
                            <Tag
                              color={isLive ? "success" : isPendingApproval ? "warning" : isExpired ? "error" : "default"}
                              style={{ fontWeight: 700, borderRadius: 10 }}
                            >
                              {isLive ? "✓ Live" : isPendingApproval ? "⏳ Verification Pending" : isExpired ? "⚠️ Expired" : "⚪ Hidden"}
                            </Tag>
                          </div>
                          <p className="sp-service-desc">
                            {svc.Service_Description || "No detailed description provided yet."}
                          </p>

                          <div className="sp-service-meta-row">
                            <span style={{ color: "#64748b" }}>Starting Rate:</span>
                            <strong style={{ color: "#059669", fontSize: 14 }}>
                              ₹{Number(svc.Service_Price || 0).toLocaleString("en-IN")}
                            </strong>
                          </div>

                          <div className="sp-service-meta-row">
                            <span style={{ color: "#64748b" }}>Location:</span>
                            <span style={{ fontWeight: 600 }}>
                              📍 {svc.City || svc.District || svc.State || "India"}
                            </span>
                          </div>

                          <div className="sp-service-meta-row">
                            <span style={{ color: "#64748b" }}>Validity:</span>
                            <strong
                              style={{
                                color: isLive ? "#16a34a" : isPendingApproval ? "#d97706" : isExpired ? "#dc2626" : "#64748b",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <span>
                                📅{" "}
                                {svc.Valid_Upto
                                  ? formatDate(svc.Valid_Upto)
                                  : isPendingApproval
                                  ? "Pending First Activation"
                                  : "Not Activated"}
                              </span>
                              {isPendingApproval ? (
                                <Tag color="warning" style={{ fontSize: 10, padding: "0 6px", lineHeight: "18px", marginLeft: 4, fontWeight: 700 }}>
                                  Under Review
                                </Tag>
                              ) : isExpired ? (
                                <Tag color="error" style={{ fontSize: 10, padding: "0 6px", lineHeight: "18px", marginLeft: 4, fontWeight: 700 }}>
                                  Expired
                                </Tag>
                              ) : null}
                            </strong>
                          </div>

                          {/* Active / Deactive Switch for Service User */}
                          <div
                            className="sp-service-meta-row"
                            style={{
                              alignItems: "center",
                              background: isLive ? "#f0fdf4" : isPendingApproval ? "#fffbeb" : isExpired ? "#fef2f2" : "#f8fafc",
                              padding: "6px 10px",
                              borderRadius: 10,
                              border: isLive ? "1px solid #bbf7d0" : isPendingApproval ? "1.5px solid #fde68a" : isExpired ? "1px solid #fecaca" : "1px solid #e2e8f0",
                              marginTop: 4,
                              marginBottom: 4,
                            }}
                          >
                            <div>
                              <span style={{ color: "#1e1b4b", fontWeight: 700, fontSize: 12.5, display: "block" }}>
                                Service Status:
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: isLive ? "#15803d" : isPendingApproval ? "#b45309" : isExpired ? "#dc2626" : "#64748b",
                                  fontWeight: 600,
                                }}
                              >
                                {isLive
                                  ? "🟢 Live & visible to clients"
                                  : isPendingApproval
                                  ? "⏳ Under Review (First time listing - Pending Admin Approval)"
                                  : isExpired
                                  ? "⚠️ Expired (Recharge to be live)"
                                  : "⚪ Deactivated / Hidden"}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Switch
                                checked={Boolean(svc.Active) && approved}
                                onChange={(checked) => handleToggleServiceActive(svc, checked)}
                                checkedChildren="Active"
                                unCheckedChildren="Deactive"
                                disabled={isPendingApproval}
                                style={{
                                  backgroundColor: (svc.Active && approved) ? "#10b981" : "#cbd5e1",
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 800,
                                  color: (svc.Active && approved) ? "#15803d" : isPendingApproval ? "#b45309" : "#64748b",
                                }}
                              >
                                {(svc.Active && approved) ? "🟢 Active" : isPendingApproval ? "⏳ Pending" : "⚪ Deactive"}
                              </span>
                            </div>
                          </div>

                          <div className="sp-service-footer">
                            <Button
                              type="primary"
                              icon={<ThunderboltFilled />}
                              style={{
                                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                borderColor: "#d97706",
                                fontWeight: 800,
                                borderRadius: 10,
                                boxShadow: "0 2px 8px rgba(245, 158, 11, 0.35)",
                              }}
                              onClick={() => handleOpenCardRechargeModal(svc)}
                            >
                              ⚡ Recharge Plan
                            </Button>

                            <div className="sp-service-actions-group">
                              <Button
                                icon={<EditOutlined />}
                                onClick={() => handleOpenEditServiceModal(svc)}
                              >
                                Edit
                              </Button>
                              <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteService(svc.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: MANAGE ADDED SERVICES                                */}
        {/* ============================================================ */}
        {activeTab === "myservices" && (
          <div className="sp-card">
            <div className="sp-card-header">
              <div>
                <h2 className="sp-card-title">
                  <AppstoreOutlined style={{ color: "#4f46e5" }} /> Manage Added Services &amp; Businesses
                </h2>
                <p className="sp-card-desc">
                  You can register and manage multiple wedding service branches and business types.
                </p>
              </div>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                style={{ background: "#4f46e5", borderRadius: 12, fontWeight: 700 }}
                onClick={handleOpenAddServiceModal}
              >
                + Add Business Service
              </Button>
            </div>

            {myServices.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 10px", color: "#94a3b8" }}>
                <ShopOutlined style={{ fontSize: 50, color: "#cbd5e1", marginBottom: 12 }} />
                <h3 style={{ margin: 0, fontWeight: 800, color: "#334155" }}>
                  No Services Registered Yet
                </h3>
                <p style={{ margin: "8px 0 20px", fontSize: 13.5 }}>
                  Add your wedding service listings to reach prospective clients and grow your business on Vaivaheek Manch.
                </p>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="large"
                  onClick={handleOpenAddServiceModal}
                >
                  Add Business Service Now
                </Button>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 20,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Filter Services:</span>
                  <button
                    type="button"
                    onClick={() => setServiceStatusFilter("all")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: serviceStatusFilter === "all" ? "1.5px solid #4f46e5" : "1.5px solid #e2e8f0",
                      background: serviceStatusFilter === "all" ? "#eef2ff" : "#ffffff",
                      color: serviceStatusFilter === "all" ? "#4f46e5" : "#64748b",
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <ShopOutlined /> All Services ({myServices.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceStatusFilter("active")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: serviceStatusFilter === "active" ? "1.5px solid #16a34a" : "1.5px solid #e2e8f0",
                      background: serviceStatusFilter === "active" ? "#f0fdf4" : "#ffffff",
                      color: serviceStatusFilter === "active" ? "#16a34a" : "#64748b",
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <CheckCircleFilled /> Active &amp; Live ({activeServicesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceStatusFilter("pending")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: serviceStatusFilter === "pending" ? "1.5px solid #d97706" : "1.5px solid #e2e8f0",
                      background: serviceStatusFilter === "pending" ? "#fffbeb" : "#ffffff",
                      color: serviceStatusFilter === "pending" ? "#b45309" : "#64748b",
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <ClockCircleOutlined /> Under Review ({pendingServicesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceStatusFilter("expired")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: serviceStatusFilter === "expired" ? "1.5px solid #dc2626" : "1.5px solid #e2e8f0",
                      background: serviceStatusFilter === "expired" ? "#fef2f2" : "#ffffff",
                      color: serviceStatusFilter === "expired" ? "#dc2626" : "#64748b",
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <WarningOutlined /> Expired ({expiredServicesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceStatusFilter("deactivated")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: serviceStatusFilter === "deactivated" ? "1.5px solid #475569" : "1.5px solid #e2e8f0",
                      background: serviceStatusFilter === "deactivated" ? "#f1f5f9" : "#ffffff",
                      color: serviceStatusFilter === "deactivated" ? "#334155" : "#64748b",
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <StopOutlined /> Deactivated ({inactiveServicesCount})
                  </button>
                </div>

            {displayedMyServices.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 10px", color: "#64748b" }}>
                <StopOutlined style={{ fontSize: 44, color: "#cbd5e1", marginBottom: 12 }} />
                <h4 style={{ margin: 0, fontWeight: 700, color: "#334155" }}>
                  No Services Found Under This Filter
                </h4>
                <p style={{ margin: "6px 0 16px", fontSize: 13 }}>
                  No businesses matched the "{
                    serviceStatusFilter === 'active' ? 'Active & Live' :
                    serviceStatusFilter === 'pending' ? 'Under Review' :
                    serviceStatusFilter === 'expired' ? 'Expired' :
                    serviceStatusFilter === 'deactivated' ? 'Deactivated' :
                    'Selected'
                  }" filter.
                </p>
                <Button onClick={() => setServiceStatusFilter("all")}>
                  View All Services ({myServices.length})
                </Button>
              </div>
            ) : (
              <div className="sp-services-grid">
                {displayedMyServices.map((svc) => {
                  const approved = isAdminApproved(svc);
                  const isPendingApproval = !approved;
                  const isDateValid = isServiceDateValid(svc.Valid_Upto);
                  const isLive = approved && Boolean(svc.Active) && isDateValid;
                  // Expired ONLY when approved by admin, but validity date has passed
                  const isExpired = approved && !isDateValid;

                  return (
                    <div
                      className={`sp-service-card ${isExpired ? "sp-service-card-expired" : isPendingApproval ? "sp-service-card-pending" : ""}`}
                      key={svc.id}
                    >
                      <div className="sp-service-thumb">
                        {svc.Picture ? (
                          <img src={getMediaUrl(svc.Picture)} alt={svc.Service_Name} />
                        ) : (
                          <ShopOutlined style={{ fontSize: 44, color: "#818cf8" }} />
                        )}
                        <div className="sp-service-thumb-badge">
                          <Tag
                            color={isLive ? "green" : isPendingApproval ? "orange" : isExpired ? "error" : "default"}
                            style={{ fontWeight: 800, borderRadius: 12, padding: "2px 10px" }}
                          >
                            {isLive ? "🟢 Live" : isPendingApproval ? "⏳ Under Review" : isExpired ? "⚠️ Expired" : "⚪ Deactive"}
                          </Tag>
                        </div>
                      </div>

                      <div className="sp-service-content">
                        <h4 className="sp-service-title">{svc.Service_Name}</h4>
                        <div style={{ marginBottom: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <Tag color="purple" style={{ fontWeight: 700, borderRadius: 10 }}>
                            {svc.Service_Type || "Wedding Service"}
                          </Tag>
                          <Tag
                            color={isLive ? "success" : isPendingApproval ? "warning" : isExpired ? "error" : "default"}
                            style={{ fontWeight: 700, borderRadius: 10 }}
                          >
                            {isLive ? "✓ Live" : isPendingApproval ? "⏳ Verification Pending" : isExpired ? "⚠️ Expired" : "⚪ Hidden"}
                          </Tag>
                        </div>
                        <p className="sp-service-desc">
                          {svc.Service_Description || "No detailed description provided yet."}
                        </p>

                        <div className="sp-service-meta-row">
                          <span style={{ color: "#64748b" }}>Starting Rate:</span>
                          <strong style={{ color: "#059669", fontSize: 14 }}>
                            ₹{Number(svc.Service_Price || 0).toLocaleString("en-IN")}
                          </strong>
                        </div>

                        <div className="sp-service-meta-row">
                          <span style={{ color: "#64748b" }}>Location:</span>
                          <span style={{ fontWeight: 600 }}>
                            📍 {svc.City || svc.District || svc.State || "India"}
                          </span>
                        </div>

                        <div className="sp-service-meta-row">
                          <span style={{ color: "#64748b" }}>Validity:</span>
                          <strong
                            style={{
                              color: isLive ? "#16a34a" : isPendingApproval ? "#d97706" : isExpired ? "#dc2626" : "#64748b",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <span>
                              📅{" "}
                              {svc.Valid_Upto
                                ? formatDate(svc.Valid_Upto)
                                : isPendingApproval
                                ? "Pending First Activation"
                                : "Not Activated"}
                            </span>
                            {isPendingApproval ? (
                              <Tag color="warning" style={{ fontSize: 10, padding: "0 6px", lineHeight: "18px", marginLeft: 4, fontWeight: 700 }}>
                                Under Review
                              </Tag>
                            ) : isExpired ? (
                              <Tag color="error" style={{ fontSize: 10, padding: "0 6px", lineHeight: "18px", marginLeft: 4, fontWeight: 700 }}>
                                Expired
                              </Tag>
                            ) : null}
                          </strong>
                        </div>

                        {/* Active / Deactive Switch for Service User */}
                        <div
                          className="sp-service-meta-row"
                          style={{
                            alignItems: "center",
                            background: isLive ? "#f0fdf4" : isPendingApproval ? "#fffbeb" : isExpired ? "#fef2f2" : "#f8fafc",
                            padding: "6px 10px",
                            borderRadius: 10,
                            border: isLive ? "1px solid #bbf7d0" : isPendingApproval ? "1.5px solid #fde68a" : isExpired ? "1px solid #fecaca" : "1px solid #e2e8f0",
                            marginTop: 4,
                            marginBottom: 4,
                          }}
                        >
                          <div>
                            <span style={{ color: "#1e1b4b", fontWeight: 700, fontSize: 12.5, display: "block" }}>
                              Service Status:
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: isLive ? "#15803d" : isPendingApproval ? "#b45309" : isExpired ? "#dc2626" : "#64748b",
                                fontWeight: 600,
                              }}
                            >
                              {isLive
                                ? "🟢 Live & visible to clients"
                                : isPendingApproval
                                ? "⏳ Under Review (First time listing - Pending Admin Approval)"
                                : isExpired
                                ? "⚠️ Expired (Recharge to be live)"
                                : "⚪ Deactivated / Hidden"}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Switch
                              checked={Boolean(svc.Active) && approved}
                              onChange={(checked) => handleToggleServiceActive(svc, checked)}
                              checkedChildren="Active"
                              unCheckedChildren="Deactive"
                              disabled={isPendingApproval}
                              style={{
                                backgroundColor: (svc.Active && approved) ? "#10b981" : "#cbd5e1",
                              }}
                            />
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 800,
                                color: (svc.Active && approved) ? "#15803d" : isPendingApproval ? "#b45309" : "#64748b",
                              }}
                            >
                              {(svc.Active && approved) ? "🟢 Active" : isPendingApproval ? "⏳ Pending" : "⚪ Deactive"}
                            </span>
                          </div>
                        </div>

                        <div className="sp-service-footer">
                          <Button
                            type="primary"
                            icon={<ThunderboltFilled />}
                            style={{
                              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                              borderColor: "#d97706",
                              fontWeight: 800,
                              borderRadius: 10,
                              boxShadow: "0 2px 8px rgba(245, 158, 11, 0.35)",
                            }}
                            onClick={() => handleOpenCardRechargeModal(svc)}
                          >
                            ⚡ Recharge Plan
                          </Button>

                          <div className="sp-service-actions-group">
                            <Button
                              icon={<EditOutlined />}
                              onClick={() => handleOpenEditServiceModal(svc)}
                            >
                              Edit
                            </Button>
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteService(svc.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )}


        {/* ============================================================ */}
        {/* TAB 4: TRANSACTIONS & RECHARGE HISTORY                       */}
        {/* ============================================================ */}
        {activeTab === "transactions" && (
          <div className="sp-card">
            <div className="sp-card-header">
              <div>
                <h2 className="sp-card-title">
                  <WalletOutlined style={{ color: "#4f46e5" }} /> Recharge &amp; Client Payment Transactions
                </h2>
                <p className="sp-card-desc">
                  Complete history of your plan renewals, recharges, and payment transactions.
                </p>
              </div>

              {/* Filter controls */}
              <div className="sp-tx-filters">
                <Input
                  placeholder="Search transaction ID"
                  prefix={<SearchOutlined />}
                  value={txSearchText}
                  onChange={(e) => setTxSearchText(e.target.value)}
                  className="sp-tx-search-input"
                />

                <Select
                  value={txFilterStatus}
                  onChange={setTxFilterStatus}
                  className="sp-tx-status-select"
                >
                  <Option value="all">All Status</Option>
                  <Option value="success">Success</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="failed">Failed</Option>
                </Select>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 10px", color: "#94a3b8" }}>
                <WalletOutlined style={{ fontSize: 44, color: "#cbd5e1", marginBottom: 12 }} />
                <h4 style={{ margin: 0, fontWeight: 700 }}>No Transactions Recorded</h4>
                <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                  Your recharge invoices and client booking payments will appear here.
                </p>
              </div>
            ) : (
              <div className="sp-table-responsive">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th style={{ width: 65, textAlign: "center" }}>SN</th>
                      <th>Service Title</th>
                      <th>Service Type</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx, idx) => {
                      const matchedService = myServices.find(
                        (s) => String(s.id) === String(tx.Service_id)
                      );
                      const serviceTitle =
                        tx.service_title ||
                        matchedService?.Service_Name ||
                        `Service #${tx.Service_id}`;
                      const serviceType =
                        tx.service_type ||
                        matchedService?.Service_Type ||
                        "Wedding Service";

                      return (
                        <tr key={tx.id || idx}>
                          <td style={{ textAlign: "center", fontWeight: 700, color: "#64748b" }}>
                            {idx + 1}
                          </td>
                          <td>
                            <strong style={{ color: "#1e1b4b", fontSize: 13.5 }}>
                              {serviceTitle}
                            </strong>
                          </td>
                          <td>
                            <Tag color="purple" style={{ fontWeight: 700, borderRadius: 8 }}>
                              {serviceType}
                            </Tag>
                          </td>
                          <td>
                            <strong style={{ color: "#059669", fontSize: 14 }}>
                              ₹{Number(tx.Amount || 0).toLocaleString("en-IN")}
                            </strong>
                          </td>
                          <td>
                            <span style={{ fontSize: 12.5, color: "#475569", fontWeight: 600 }}>
                              {formatDate(tx.Create_date)}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`sp-badge ${
                                (tx.Status || "").toLowerCase() === "success"
                                  ? "sp-badge-success"
                                  : (tx.Status || "").toLowerCase() === "pending"
                                  ? "sp-badge-pending"
                                  : "sp-badge-failed"
                              }`}
                            >
                              {tx.Status || "Success"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}



        {/* ============================================================ */}
        {/* TAB 5: HELP & SUPPORT DESK (ROLE: SERVICE)                   */}
        {/* ============================================================ */}
        {activeTab === "help" && (
          <div>
            <div className="sp-card">
              <div className="sp-card-header">
                <div>
                  <h2 className="sp-card-title">
                    <CustomerServiceOutlined style={{ color: "#4f46e5" }} /> Help &amp; Support
                  </h2>
                  <p className="sp-card-desc">
                    Submit your inquiries directly to the Administration Team for prompt assistance.
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Question / Inquiry for Administration Team *
                </label>
                <Input.TextArea
                  rows={3}
                  placeholder="Type your question or request regarding business approval, service listing, or recharge..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  style={{ borderRadius: 10 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="primary"
                  className="sp-btn-submit-help"
                  loading={submittingHelp}
                  onClick={handleSendHelpQuery}
                  icon={<SendOutlined />}
                >
                  Submit Inquiry
                </Button>
              </div>

              {/* Service Tickets */}
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 12, color: "#0f172a" }}>
                  Your Tickets ({helpTickets.length})
                </h3>

                {helpTickets.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#64748b", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
                    No tickets submitted yet. Type your inquiry above and submit.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {helpTickets.map((h, i) => (
                      <div key={h.id || i} className="sp-ticket-card">
                        <div className="sp-ticket-header">
                          <div className="sp-ticket-tags">
                            <Tag color="blue" style={{ fontWeight: 600 }}>
                              To: Admin
                            </Tag>
                            <span className="sp-ticket-id">Ticket #{h.id}</span>
                          </div>
                          <Tag color={h.Answer ? "green" : "gold"}>
                            {h.Answer ? "Answered ✅" : "Under Review ⏳"}
                          </Tag>
                        </div>

                        <div className="sp-ticket-q">
                          Q: {h.Question}
                        </div>
                        <div className="sp-ticket-date">
                          📅 Raised: {formatDateTime(h.created_date || h.Create_date)}
                        </div>

                        {h.Answer && (
                          <div className="sp-ticket-reply">
                            <div><strong>Admin Response:</strong> {h.Answer}</div>
                            {h.updated_date && (
                              <div className="sp-ticket-reply-time">
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

          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: ADD / EDIT SERVICE MODAL                              */}
        {/* ============================================================ */}
        <Modal
          title={
            editingService
              ? "Edit Business Service"
              : "Register New Business Service"
          }
          open={isServiceModalOpen}
          onCancel={() => setIsServiceModalOpen(false)}
          footer={null}
          width={760}
        >
          <Form
            form={serviceForm}
            layout="vertical"
            onFinish={handleSaveService}
          >
            {/* Picture Upload */}
            <div style={{ marginBottom: 20 }}>
              <span className="sp-form-label" style={{ marginBottom: 8, display: "block", fontWeight: 700 }}>
                Business Logo / Portfolio Photo
              </span>
              <div className="sp-pic-uploader">
                <div className="sp-pic-preview">
                  {profilePicPreview ? (
                    <img src={profilePicPreview} alt="Logo" />
                  ) : (
                    <ShopOutlined />
                  )}
                </div>
                <div>
                  <Upload
                    beforeUpload={(file) => {
                      setProfilePicFile(file);
                      const reader = new FileReader();
                      reader.onload = (e) => setProfilePicPreview(e.target.result);
                      reader.readAsDataURL(file);
                      return false;
                    }}
                    showUploadList={false}
                    accept="image/*"
                  >
                    <Button icon={<UploadOutlined />} style={{ fontWeight: 700 }}>
                      Choose Photo
                    </Button>
                  </Upload>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
                    Recommended size 600x600 px (JPG/PNG).
                  </p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="sp-form-grid">
              <Form.Item
                label="Business / Agency Name"
                name="Service_Name"
                rules={[{ required: true, message: "Please enter business name" }]}
              >
                <Input placeholder="e.g. Royal Shahi Catering & Decor" className="sp-form-control" />
              </Form.Item>

              <Form.Item
                label="Service Category / Type"
                name="Service_Type"
                rules={[{ required: true, message: "Please select service type" }]}
              >
                <Select
                  placeholder="Select Service Category"
                  className="sp-form-control"
                  style={{ padding: 0 }}
                  showSearch
                  optionFilterProp="children"
                >
                  {inheritedServices.map((svc) => (
                    <Option
                      key={svc.id}
                      value={svc.Service_Name || svc.Service_Type}
                    >
                      {svc.Service_Name} {svc.Service_Type && svc.Service_Type !== svc.Service_Name ? `(${svc.Service_Type})` : ""}
                    </Option>
                  ))}
                  {inheritedServices.length === 0 && (
                    <Option value="General Wedding Service">General Wedding Service</Option>
                  )}
                </Select>
              </Form.Item>

              <Form.Item
                label="Starting Price (₹)"
                name="Service_Price"
                rules={[{ required: true, message: "Please enter starting rate" }]}
              >
                <Input
                  type="number"
                  placeholder="e.g. 15000"
                  prefix="₹"
                  className="sp-form-control"
                />
              </Form.Item>

              <Form.Item
                label="WhatsApp Business Contact (10 Digits)"
                name="WP_Contact"
                rules={[
                  { required: true, message: "Please enter 10-digit WhatsApp mobile number" },
                  { pattern: /^[0-9]{10}$/, message: "WhatsApp number must be exactly 10 digits" },
                ]}
              >
                <Input
                  maxLength={10}
                  placeholder="10-digit mobile number (e.g. 9876543210)"
                  prefix={<WhatsAppOutlined style={{ color: "#059669" }} />}
                  className="sp-form-control"
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "").slice(0, 10);
                    serviceForm.setFieldsValue({ WP_Contact: clean });
                  }}
                />
              </Form.Item>

              <Form.Item
                label="Alternate Phone Number (Optional, 10 Digits)"
                name="Alt_Contact"
                rules={[
                  { pattern: /^[0-9]{10}$/, message: "Alternate phone number must be exactly 10 digits" },
                ]}
              >
                <Input
                  maxLength={10}
                  placeholder="Alternate 10-digit mobile number"
                  prefix={<PhoneOutlined />}
                  className="sp-form-control"
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "").slice(0, 10);
                    serviceForm.setFieldsValue({ Alt_Contact: clean });
                  }}
                />
              </Form.Item>

              {/* State dropdown */}
              <Form.Item
                label="State (राज्य)"
                name="State"
                rules={[{ required: true, message: "Please select state" }]}
              >
                <Select
                  placeholder="Select State"
                  onChange={handleStateChange}
                  className="sp-form-control"
                  style={{ padding: 0 }}
                  showSearch
                  optionFilterProp="children"
                >
                  {statesList.map((st) => (
                    <Option key={st.id || st.State} value={st.State}>
                      {st.State}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Primary District dropdown based on State */}
              <Form.Item
                label="Primary Business District (मुख्य ज़िला)"
                name="District"
                rules={[{ required: true, message: "Please select district" }]}
              >
                <Select
                  placeholder={
                    availableDistricts.length > 0
                      ? "Select Primary District"
                      : "Please select State first"
                  }
                  onChange={handleDistrictChange}
                  className="sp-form-control"
                  style={{ padding: 0 }}
                  showSearch
                  optionFilterProp="children"
                  disabled={availableDistricts.length === 0}
                >
                  {availableDistricts.map((dist) => (
                    <Option key={dist} value={dist}>
                      {dist}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="City / Area" name="City">
                <Input placeholder="e.g. Raipur / Bhilai" className="sp-form-control" />
              </Form.Item>
            </div>

            {/* Coverage Areas (Available_Zone) based on State with 'All' Option */}
            <div style={{ marginBottom: 18, background: "#f8fafc", padding: 16, borderRadius: 14, border: "1.5px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: "#1e1b4b", display: "flex", alignItems: "center", gap: 6 }}>
                    <EnvironmentOutlined style={{ color: "#4f46e5" }} />
                    Service Coverage Districts (Available_Zone):
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Select service coverage districts based on state, or choose <strong>All</strong>.
                  </span>
                </div>

                {availableDistricts.length > 0 && (
                  <div className="sp-zone-actions">
                    <Button
                      size="small"
                      type="primary"
                      style={{ background: "#4f46e5", fontWeight: 700, borderRadius: 8, fontSize: 12 }}
                      onClick={handleSelectAllDistricts}
                    >
                      ✓ Select All Districts ({availableDistricts.length})
                    </Button>
                    {zonesList.length > 0 && (
                      <Button
                        size="small"
                        danger
                        style={{ fontWeight: 700, borderRadius: 8, fontSize: 12 }}
                        onClick={handleClearAllDistricts}
                      >
                        ✕ Clear All
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Multi-Select Dropdown with "All" Option */}
              <div style={{ marginBottom: 12 }}>
                <Select
                  mode="multiple"
                  style={{ width: "100%" }}
                  placeholder={
                    availableDistricts.length > 0
                      ? "Select districts or choose 'All'..."
                      : "Please select a State above to load districts"
                  }
                  value={zonesList}
                  onChange={handleAvailableZoneChange}
                  disabled={availableDistricts.length === 0}
                  showSearch
                  optionFilterProp="children"
                  maxTagCount="responsive"
                >
                  <Option key="All" value="All">
                    🌟 All Districts ({serviceForm.getFieldValue("State") || "State"})
                  </Option>
                  {availableDistricts.map((dist) => (
                    <Option key={dist} value={dist}>
                      {dist}
                    </Option>
                  ))}
                </Select>
              </div>

              {/* Interactive Quick-Click District Chips */}
              {availableDistricts.length > 0 && (
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
                    Quick Click to Toggle Districts:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 130, overflowY: "auto", padding: "4px 0" }}>
                    {/* All Districts Chip */}
                    <Tag
                      color={zonesList.includes("All") ? "gold" : "default"}
                      style={{
                        cursor: "pointer",
                        padding: "4px 12px",
                        borderRadius: 14,
                        fontSize: 12,
                        fontWeight: 800,
                        border: zonesList.includes("All") ? "1.5px solid #d97706" : "1px solid #cbd5e1",
                        background: zonesList.includes("All") ? "#fffbeb" : "#ffffff",
                        color: zonesList.includes("All") ? "#b45309" : "#334155",
                        userSelect: "none",
                      }}
                      onClick={() => handleToggleDistrictZone("All")}
                    >
                      {zonesList.includes("All") ? <CheckOutlined style={{ marginRight: 4 }} /> : <PlusOutlined style={{ marginRight: 4 }} />}
                      🌟 All Districts
                    </Tag>

                    {/* Individual Districts */}
                    {availableDistricts.map((dist) => {
                      const isSelected = zonesList.includes(dist);
                      return (
                        <Tag
                          key={dist}
                          color={isSelected ? "purple" : "default"}
                          style={{
                            cursor: "pointer",
                            padding: "4px 10px",
                            borderRadius: 14,
                            fontSize: 12,
                            fontWeight: 600,
                            border: isSelected ? "1.5px solid #7c3aed" : "1px solid #cbd5e1",
                            background: isSelected ? "#f3e8ff" : "#ffffff",
                            color: isSelected ? "#6b21a8" : "#334155",
                            userSelect: "none",
                          }}
                          onClick={() => handleToggleDistrictZone(dist)}
                        >
                          {isSelected ? <CheckOutlined style={{ marginRight: 4 }} /> : <PlusOutlined style={{ marginRight: 4 }} />}
                          {dist}
                        </Tag>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom town/region input */}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <Input
                  placeholder="Optional: Add custom town, city or region"
                  value={newZoneInput}
                  onChange={(e) => setNewZoneInput(e.target.value)}
                  onPressEnter={(e) => {
                    e.preventDefault();
                    handleAddZone();
                  }}
                  style={{ borderRadius: 8 }}
                />
                <Button onClick={handleAddZone} style={{ fontWeight: 700, borderRadius: 8 }}>
                  + Add
                </Button>
              </div>
            </div>

            <Form.Item label="Full Office Address" name="Full_Address">
              <Input.TextArea
                rows={2}
                placeholder="Street address, landmark, pincode"
                className="sp-form-control"
              />
            </Form.Item>

            <Form.Item
              label="Business Experience &amp; Service Offering Details"
              name="Service_Description"
            >
              <Input.TextArea
                rows={3}
                placeholder="Describe your specializations, menu options, photography gear, past weddings handled..."
                className="sp-form-control"
              />
            </Form.Item>

            <div className="sp-modal-form-actions">
              <Button onClick={() => setIsServiceModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={savingService}
                style={{ background: "#4f46e5", fontWeight: 700 }}
              >
                {editingService ? "Update Business Details" : "Register Business Service"}
              </Button>
            </div>
          </Form>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL: DIRECT CARD RECHARGE & EXTEND MODAL                   */}
        {/* ============================================================ */}
        <Modal
          title={
            cardRechargeService ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 800, color: "#1e1b4b" }}>
                <ThunderboltFilled style={{ color: "#f59e0b" }} />
                Plan Recharge &amp; Extend Validity — {cardRechargeService.Service_Name}
              </span>
            ) : (
              "Recharge Service Plan"
            )
          }
          open={cardRechargeModalVisible}
          onCancel={() => setCardRechargeModalVisible(false)}
          footer={null}
          width={650}
          destroyOnClose
        >
          {cardRechargeService && (() => {
            const monthlyRate = getMonthlyRateForService(cardRechargeService);
            const totalAmount = rechargeMonths * monthlyRate;
            const extendedDate = calculateExtendedDate(cardRechargeService.Valid_Upto, rechargeMonths);
            const isCurrentlyValid = isServiceDateValid(cardRechargeService.Valid_Upto);

            return (
              <div>
                {/* Business Info Banner */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
                    border: "1.5px solid #c7d2fe",
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 18,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 4px", color: "#1e1b4b", fontWeight: 800, fontSize: 18 }}>
                      {cardRechargeService.Service_Name}
                    </h3>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <Tag color="purple" style={{ fontWeight: 700 }}>
                        {cardRechargeService.Service_Type || "Wedding Service"}
                      </Tag>
                      <Tag color="green" style={{ fontWeight: 800 }}>
                        <CheckCircleFilled /> Verified Business
                      </Tag>
                      <Tag color={cardRechargeService.Active ? "success" : "default"} style={{ fontWeight: 800 }}>
                        {cardRechargeService.Active ? "🟢 Active" : "⚪ Deactive"}
                      </Tag>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 12, color: "#64748b", display: "block" }}>
                      Current Validity:
                    </span>
                    <strong
                      style={{
                        fontSize: 14,
                        color: isCurrentlyValid ? "#16a34a" : "#dc2626",
                      }}
                    >
                      📅 {formatDate(cardRechargeService.Valid_Upto)}
                    </strong>
                  </div>
                </div>

                {/* Section: Select / Increase Months */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#1e1b4b" }}>
                      📅 Select Validity Duration (Increase Month):
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", background: "#eef2ff", padding: "3px 10px", borderRadius: 8 }}>
                      Rate: ₹{monthlyRate.toLocaleString("en-IN")} / Month
                    </span>
                  </div>

                  {/* Preset Duration Buttons */}
                  <div className="sp-recharge-preset-grid">
                    {[
                      { mo: 1, label: "1 Month" },
                      { mo: 2, label: "2 Months" },
                      { mo: 3, label: "3 Months" },
                      { mo: 6, label: "6 Months" },
                      { mo: 12, label: "12 Months" },
                    ].map(({ mo, label }) => {
                      const isSel = rechargeMonths === mo;
                      return (
                        <div
                          key={mo}
                          onClick={() => setRechargeMonths(mo)}
                          style={{
                            border: isSel ? "2px solid #4f46e5" : "1.5px solid #e2e8f0",
                            background: isSel ? "#f5f3ff" : "#ffffff",
                            borderRadius: 12,
                            padding: "10px 8px",
                            textAlign: "center",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            boxShadow: isSel ? "0 4px 12px rgba(79, 70, 229, 0.15)" : "none",
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: 13, color: isSel ? "#4f46e5" : "#1e1b4b" }}>
                            {label}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: isSel ? "#059669" : "#64748b", marginTop: 2 }}>
                            ₹{(mo * monthlyRate).toLocaleString("en-IN")}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom Month Stepper / Counter */}
                  <div
                    className="sp-recharge-stepper-wrap"
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: "12px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#334155", display: "block" }}>
                        Custom Month Selection:
                      </span>
                      <span style={{ fontSize: 11.5, color: "#64748b" }}>
                        Increase or decrease validity duration by months
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Button
                        icon={<MinusOutlined />}
                        disabled={rechargeMonths <= 1}
                        onClick={() => setRechargeMonths((prev) => Math.max(1, prev - 1))}
                        style={{ borderRadius: 8, fontWeight: 800 }}
                      />
                      <InputNumber
                        min={1}
                        max={36}
                        value={rechargeMonths}
                        onChange={(val) => setRechargeMonths(Math.max(1, Number(val) || 1))}
                        style={{ width: 68, textAlign: "center", borderRadius: 8, fontWeight: 800 }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1e1b4b" }}>
                        {rechargeMonths === 1 ? "Month" : "Months"}
                      </span>
                      <Button
                        icon={<PlusOutlined />}
                        disabled={rechargeMonths >= 36}
                        onClick={() => setRechargeMonths((prev) => Math.min(36, prev + 1))}
                        style={{ borderRadius: 8, fontWeight: 800 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Extend Option Preview */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
                    border: "1.5px solid #a7f3d0",
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                    <SyncOutlined spin style={{ color: "#059669" }} />
                    <span style={{ fontWeight: 800, fontSize: 13.5, color: "#065f46" }}>
                      Extend Validity Option &amp; Preview:
                    </span>
                    <Tag color="green" style={{ marginLeft: "auto", fontWeight: 800, borderRadius: 8 }}>
                      {isCurrentlyValid ? "🔄 Extends Current Validity" : "🚀 Activates Starting Today"}
                    </Tag>
                  </div>

                  <div
                    className="sp-recharge-preview-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto 1fr",
                      alignItems: "center",
                      gap: 12,
                      background: "#ffffff",
                      padding: "12px 16px",
                      borderRadius: 10,
                      border: "1px solid #d1fae5",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block" }}>
                        CURRENT EXPIRY
                      </span>
                      <strong style={{ fontSize: 13, color: isCurrentlyValid ? "#16a34a" : "#dc2626" }}>
                        📅 {formatDate(cardRechargeService.Valid_Upto)}
                      </strong>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#4f46e5", background: "#eef2ff", padding: "2px 8px", borderRadius: 8 }}>
                        +{rechargeMonths} {rechargeMonths === 1 ? "Mo" : "Mos"}
                      </span>
                      <div style={{ fontSize: 16, color: "#059669", fontWeight: 900 }}>➔</div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block" }}>
                        NEW EXTENDED EXPIRY
                      </span>
                      <strong style={{ fontSize: 14, color: "#059669", fontWeight: 800 }}>
                        📅 {formatDate(extendedDate)}
                      </strong>
                    </div>
                  </div>

                  <div style={{ fontSize: 11.5, color: "#047857", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                    ✓ Recharging will automatically activate your listing and extend validity without losing any remaining days.
                  </div>
                </div>

                {/* Footer Action */}
                <div
                  className="sp-recharge-modal-footer"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 14,
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <div>
                    <span style={{ fontSize: 11.5, color: "#64748b", display: "block" }}>
                      Total Amount Payable:
                    </span>
                    <strong style={{ fontSize: 22, fontWeight: 900, color: "#059669" }}>
                      ₹{totalAmount.toLocaleString("en-IN")}
                    </strong>
                    <span style={{ fontSize: 11, color: "#64748b", marginLeft: 6 }}>
                      ({rechargeMonths} {rechargeMonths === 1 ? "month" : "months"} × ₹{monthlyRate})
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button onClick={() => setCardRechargeModalVisible(false)} size="large">
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      loading={recharging}
                      icon={<ThunderboltFilled />}
                      style={{
                        background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
                        fontWeight: 800,
                        borderRadius: 10,
                        boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
                      }}
                      onClick={() =>
                        handleConfirmCardRecharge(cardRechargeService, rechargeMonths, totalAmount, extendedDate)
                      }
                    >
                      ⚡ Pay ₹{totalAmount.toLocaleString("en-IN")} &amp; Extend Validity (+{rechargeMonths} Mo)
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>

        {/* Modal: Share Service Registration Link Only */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShareAltOutlined style={{ color: "#4f46e5" }} />
              <span>Service Registration Link</span>
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
              style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 700 }}
              icon={<WhatsAppOutlined />}
              onClick={handleShareWhatsApp}
            >
              Share on WhatsApp
            </Button>,
          ]}
        >
          <div style={{ padding: "12px 0" }}>
            <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 16px", lineHeight: 1.5 }}>
              Share this registration link with partners and vendors to register on Vaivaheek Manch:
            </p>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                SERVICE REGISTRATION URL
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <Input
                  readOnly
                  value={serviceRegistrationUrl}
                  style={{
                    fontSize: 13,
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    fontWeight: 600,
                    color: "#1e1b4b",
                  }}
                />
                <Button
                  type="primary"
                  icon={copiedLink ? <CheckOutlined /> : <CopyOutlined />}
                  onClick={handleCopyLink}
                  style={{
                    background: copiedLink ? "#16a34a" : "#4f46e5",
                    borderColor: copiedLink ? "#16a34a" : "#4f46e5",
                    borderRadius: 8,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {copiedLink ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            <Button
              type="primary"
              block
              size="large"
              icon={copiedLink ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopyLink}
              style={{
                background: copiedLink ? "#16a34a" : "#4f46e5",
                borderColor: copiedLink ? "#16a34a" : "#4f46e5",
                borderRadius: 10,
                fontWeight: 700,
              }}
            >
              {copiedLink ? "✓ Registration Link Copied!" : "Copy Service Registration Link"}
            </Button>
          </div>
        </Modal>
      </main>

      {/* ============================================================== */}
      {/* MOBILE BOTTOM NAVIGATION                                       */}
      {/* ============================================================== */}
      <nav className="sp-bottom-nav">
        <button
          type="button"
          className={`sp-bottom-nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => switchTab("dashboard")}
        >
          <ShopOutlined className="sp-bottom-nav-icon" />
          <span>Home</span>
        </button>

        <button
          type="button"
          className={`sp-bottom-nav-btn ${activeTab === "myservices" ? "active" : ""}`}
          onClick={() => switchTab("myservices")}
        >
          <AppstoreOutlined className="sp-bottom-nav-icon" />
          <span>Services</span>
        </button>



        <button
          type="button"
          className={`sp-bottom-nav-btn ${activeTab === "transactions" ? "active" : ""}`}
          onClick={() => switchTab("transactions")}
        >
          <WalletOutlined className="sp-bottom-nav-icon" />
          <span>Orders</span>
        </button>

        <button
          type="button"
          className={`sp-bottom-nav-btn ${activeTab === "help" ? "active" : ""}`}
          onClick={() => switchTab("help")}
        >
          <CustomerServiceOutlined className="sp-bottom-nav-icon" />
          <span>Help</span>
        </button>
      </nav>
    </div>
  );
}

export default ServicePanel;
