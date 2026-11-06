import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Modal,
  Spin,
  Row,
  Col,
  Empty,
  Typography,
} from "antd";
import {
  SearchOutlined,
  PrinterOutlined,
  FileTextOutlined,
  CrownOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import { UserTransactionsGet, UserDataGetwt, UserRegGet } from "../../Api/CoreApi";
import UserNav from "./UserNav";

const { Text, Title } = Typography;
const { Option } = Select;

const formatDate = (dateVal) => {
  if (!dateVal) return "";
  try {
    const s = String(dateVal).trim();
    const ymd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymd) return `${ymd[3].padStart(2, "0")}-${ymd[2].padStart(2, "0")}-${ymd[1]}`;
    const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
    if (dmy) return `${dmy[1].padStart(2, "0")}-${dmy[2].padStart(2, "0")}-${dmy[3]}`;
    const dt = new Date(dateVal);
    if (!Number.isNaN(dt.getTime())) {
      const day = String(dt.getDate()).padStart(2, "0");
      const month = String(dt.getMonth() + 1).padStart(2, "0");
      return `${day}-${month}-${dt.getFullYear()}`;
    }
    return s.slice(0, 10);
  } catch {
    return String(dateVal).slice(0, 10);
  }
};

const User_Transactions = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filteredTxns, setFilteredTxns] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Receipt Modal
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/UserLogin/");
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txns, uData, rData] = await Promise.all([
        UserTransactionsGet(userId).catch(() => []),
        UserDataGetwt().catch(() => []),
        UserRegGet().catch(() => []),
      ]);

      // Filter txns strictly for current user
      const rawList = Array.isArray(txns)
        ? txns.filter(
            (t) =>
              String(t.User_id || t.user_id) === String(userId) ||
              !t.User_id // fallback if backend already filtered
          )
        : [];

      // Sort newest first
      rawList.sort((a, b) => new Date(b.Create_date || b.created_at || 0) - new Date(a.Create_date || a.created_at || 0));

      setTransactions(rawList);
      setFilteredTxns(rawList);

      const foundU = Array.isArray(uData)
        ? uData.find((i) => String(i.User_id) === String(userId))
        : null;
      const foundR = Array.isArray(rData)
        ? rData.find((i) => String(i.id) === String(userId))
        : null;
      setUserProfile({ ...(foundR || {}), ...(foundU || {}) });
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter effect
  useEffect(() => {
    let list = [...transactions];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (t) =>
          String(t.id).includes(q) ||
          String(t.Plan || t.plan || t.type || "").toLowerCase().includes(q) ||
          String(t.Amount || t.amount || "").includes(q)
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((t) => {
        const s = String(t.status || "").toLowerCase();
        if (statusFilter === "success") return s === "success" || s === "done" || s === "approved";
        if (statusFilter === "pending") return s === "pending";
        if (statusFilter === "failed") return s === "failed" || s === "cancelled";
        return true;
      });
    }

    if (sortBy === "highest") {
      list.sort((a, b) => (Number(b.Amount || b.amount) || 0) - (Number(a.Amount || a.amount) || 0));
    } else if (sortBy === "lowest") {
      list.sort((a, b) => (Number(a.Amount || a.amount) || 0) - (Number(b.Amount || b.amount) || 0));
    } else {
      list.sort((a, b) => new Date(b.Create_date || 0) - new Date(a.Create_date || 0));
    }

    setFilteredTxns(list);
  }, [searchTerm, statusFilter, sortBy, transactions]);

  // Summary Metrics
  const totalSpent = transactions
    .filter((t) => {
      const s = String(t.status || "").toLowerCase();
      return s === "success" || s === "done" || s === "approved";
    })
    .reduce((sum, t) => sum + (Number(t.Amount || t.amount) || 0), 0);

  const successfulTxnCount = transactions.filter((t) => {
    const s = String(t.status || "").toLowerCase();
    return s === "success" || s === "done" || s === "approved";
  }).length;

  const latestTxn = transactions[0] || null;

  const renderStatusTag = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "success" || s === "done" || s === "approved") {
      return (
        <Tag
          icon={<CheckCircleOutlined />}
          style={{
            background: "#ecfdf5",
            color: "#059669",
            borderColor: "#a7f3d0",
            borderRadius: "12px",
            padding: "3px 10px",
            fontWeight: "700",
            fontSize: "12px",
          }}
        >
          Completed
        </Tag>
      );
    }
    if (s === "pending") {
      return (
        <Tag
          icon={<ClockCircleOutlined />}
          style={{
            background: "#fffbeb",
            color: "#d97706",
            borderColor: "#fde68a",
            borderRadius: "12px",
            padding: "3px 10px",
            fontWeight: "700",
            fontSize: "12px",
          }}
        >
          Pending
        </Tag>
      );
    }
    return (
      <Tag
        icon={<CloseCircleOutlined />}
        style={{
          background: "#fff1f2",
          color: "#e11d48",
          borderColor: "#fecdd3",
          borderRadius: "12px",
          padding: "3px 10px",
          fontWeight: "700",
          fontSize: "12px",
        }}
      >
        Failed
      </Tag>
    );
  };

  const columns = [
    {
      title: "Transaction ID",
      key: "id",
      render: (_, record) => (
        <div>
          <span
            style={{
              fontWeight: "700",
              color: "#881337",
              fontFamily: "monospace",
              fontSize: "14px",
            }}
          >
            #TXN-{String(record.id || "").padStart(5, "0")}
          </span>
          <div style={{ fontSize: "11.5px", color: "#94a3b8" }}>
            {formatDate(record.Create_date) || "Recent"}
          </div>
        </div>
      ),
    },
    {
      title: "Plan / Description",
      key: "plan",
      render: (_, record) => {
        const planName = record.Plan || record.plan || record.type || "Membership Plan";
        const isGold = planName.toLowerCase().includes("gold");
        const isPlatinum = planName.toLowerCase().includes("plat");

        return (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: isGold ? "#fef3c7" : isPlatinum ? "#e0e7ff" : "#ffe4e6",
                color: isGold ? "#d97706" : isPlatinum ? "#4338ca" : "#e11d48",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
              }}
            >
              <CrownOutlined />
            </div>
            <div>
              <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "14px" }}>
                {planName}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Matrimony Premium Service
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Amount",
      key: "amount",
      render: (_, record) => (
        <span
          style={{
            fontWeight: "800",
            fontSize: "15px",
            color: "#0f172a",
          }}
        >
          ₹ {record.Amount || record.amount || 0}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => renderStatusTag(record.status),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="default"
          icon={<FileTextOutlined />}
          size="small"
          onClick={() => {
            setSelectedTxn(record);
            setIsReceiptOpen(true);
          }}
          style={{
            borderRadius: "16px",
            borderColor: "#fecdd3",
            color: "#be123c",
            fontWeight: "600",
            background: "#fff1f2",
          }}
        >
          Receipt
        </Button>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff8f9",
        paddingTop: "40px",
        paddingBottom: "80px",
      }}
    >
      {/* Shared Matrimony User Panel Header */}
      <UserNav activeTab="transactions" userProfile={userProfile} />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px" }}>
        {/* KPI Summary Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col xs={24} sm={12} md={6}>
            <Card
              variant="borderless"
              style={{
                borderRadius: "20px",
                boxShadow: "0 8px 24px rgba(225, 29, 72, 0.06)",
                border: "1px solid rgba(225, 29, 72, 0.1)",
                background: "linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#9f1239", textTransform: "uppercase" }}>
                    Total Recharges
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "800", color: "#881337", marginTop: "4px" }}>
                    ₹ {totalSpent}
                  </div>
                </div>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "14px",
                    background: "#ffe4e6",
                    color: "#e11d48",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  <WalletOutlined />
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              variant="borderless"
              style={{
                borderRadius: "20px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.04)",
                border: "1px solid rgba(225, 29, 72, 0.1)",
                background: "#ffffff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    Successful Plans
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
                    {successfulTxnCount}
                  </div>
                </div>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "14px",
                    background: "#ecfdf5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  <CheckCircleOutlined />
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              variant="borderless"
              style={{
                borderRadius: "20px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.04)",
                border: "1px solid rgba(225, 29, 72, 0.1)",
                background: "#ffffff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    Last Payment
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginTop: "8px" }}>
                    {latestTxn?.Create_date
                      ? formatDate(latestTxn.Create_date)
                      : "No record"}
                  </div>
                </div>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "14px",
                    background: "#fef3c7",
                    color: "#d97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  <CreditCardOutlined />
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              variant="borderless"
              style={{
                borderRadius: "20px",
                boxShadow: "0 8px 24px rgba(225, 29, 72, 0.06)",
                border: "1px solid rgba(225, 29, 72, 0.1)",
                background: "linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#9f1239", textTransform: "uppercase" }}>
                    Membership
                  </div>
                  <div style={{ fontSize: "17px", fontWeight: "800", color: "#be123c", marginTop: "6px" }}>
                    {successfulTxnCount > 0 ? "Premium Member" : "Free Explorer"}
                  </div>
                </div>
                <Link
                  to="/UserRecharge"
                  style={{
                    padding: "6px 14px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #e11d48, #be123c)",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "700",
                    textDecoration: "none",
                  }}
                >
                  + Add Plan
                </Link>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Transactions Table Card */}
        <Card
          variant="borderless"
          style={{
            borderRadius: "24px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
            border: "1px solid rgba(225, 29, 72, 0.1)",
            overflow: "hidden",
          }}
        >
          {/* Header & Filter Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
              marginBottom: "20px",
              paddingBottom: "16px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div>
              <Title level={4} style={{ margin: 0, color: "#881337", fontWeight: "800" }}>
                💳 Billing & Transaction History
              </Title>
              <Text type="secondary" style={{ fontSize: "13px" }}>
                Detailed ledger of all subscriptions, recharges, and receipts.
              </Text>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <Input
                prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                placeholder="Search plan or TXN ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "220px", borderRadius: "18px" }}
                allowClear
              />

              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: "130px" }}
                dropdownStyle={{ borderRadius: "12px" }}
              >
                <Option value="all">All Status</Option>
                <Option value="success">Completed</Option>
                <Option value="pending">Pending</Option>
                <Option value="failed">Failed</Option>
              </Select>

              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: "140px" }}
                dropdownStyle={{ borderRadius: "12px" }}
              >
                <Option value="newest">Newest First</Option>
                <Option value="highest">Highest Amount</Option>
                <Option value="lowest">Lowest Amount</Option>
              </Select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <Spin size="large" tip="Loading transactions..." />
            </div>
          ) : filteredTxns.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div style={{ padding: "20px 0" }}>
                  <p style={{ color: "#64748b", fontSize: "15px", fontWeight: "600", margin: "0 0 14px" }}>
                    No transaction records found
                  </p>
                  <Link
                    to="/UserRecharge"
                    style={{
                      display: "inline-block",
                      background: "linear-gradient(135deg, #e11d48, #be123c)",
                      color: "#ffffff",
                      padding: "10px 24px",
                      borderRadius: "24px",
                      fontWeight: "700",
                      fontSize: "14px",
                      textDecoration: "none",
                      boxShadow: "0 4px 14px rgba(225, 29, 72, 0.25)",
                    }}
                  >
                    View Membership Plans
                  </Link>
                </div>
              }
            />
          ) : (
            <Table
              dataSource={filteredTxns}
              columns={columns}
              rowKey={(r) => r.id || Math.random()}
              pagination={{ pageSize: 8, responsive: true }}
              scroll={{ x: 600 }}
            />
          )}
        </Card>
      </div>

      {/* Printable Receipt / Tax Invoice Modal */}
      <Modal
        open={isReceiptOpen}
        onCancel={() => setIsReceiptOpen(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setIsReceiptOpen(false)}
            style={{
              borderRadius: "16px",
              background: "linear-gradient(135deg, #e11d48, #be123c)",
              borderColor: "#e11d48",
              padding: "0 24px",
            }}
          >
            Close
          </Button>,
        ]}
        width={580}
        centered
      >
        {selectedTxn && (
          <div
            id="matrimony-invoice"
            style={{
              padding: "16px 8px",
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            }}
          >
            {/* Invoice Header */}
            <div
              style={{
                textAlign: "center",
                borderBottom: "2px dashed #fecdd3",
                paddingBottom: "18px",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  margin: "0 0 4px",
                  color: "#be123c",
                  fontWeight: "800",
                  letterSpacing: "-0.5px",
                }}
              >
                Vaivaheek Manch Matrimonial Services
              </h2>
              <div style={{ color: "#64748b", fontSize: "12.5px" }}>
                Official Membership Payment Receipt & Tax Invoice
              </div>
              <div
                style={{
                  display: "inline-block",
                  background: "#fff1f2",
                  color: "#e11d48",
                  padding: "4px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700",
                  marginTop: "8px",
                }}
              >
                Receipt Ref: #TXN-{String(selectedTxn.id || "").padStart(6, "0")}
              </div>
            </div>

            {/* Member & Order Info */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "20px",
                fontSize: "13.5px",
              }}
            >
              <div>
                <span style={{ color: "#94a3b8", display: "block" }}>Billed To:</span>
                <strong style={{ color: "#0f172a" }}>
                  {userProfile?.firstname || userProfile?.first_name || "Valued Member"}
                </strong>
                <div style={{ color: "#64748b", fontSize: "12.5px" }}>
                  Matrimony ID: #{userId || "---"}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ color: "#94a3b8", display: "block" }}>Payment Date:</span>
                <strong style={{ color: "#0f172a" }}>
                  {selectedTxn.Create_date
                    ? formatDate(selectedTxn.Create_date)
                    : "Confirmed"}
                </strong>
                <div style={{ marginTop: "4px" }}>{renderStatusTag(selectedTxn.status)}</div>
              </div>
            </div>

            {/* Line Items Table */}
            <div
              style={{
                background: "#f8fafc",
                borderRadius: "14px",
                padding: "16px",
                border: "1px solid #e2e8f0",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "700",
                  borderBottom: "1px solid #cbd5e1",
                  paddingBottom: "8px",
                  marginBottom: "10px",
                  fontSize: "13px",
                  color: "#475569",
                }}
              >
                <span>Description</span>
                <span>Amount</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  marginBottom: "8px",
                  color: "#1e293b",
                }}
              >
                <span>
                  {selectedTxn.Plan || selectedTxn.plan || selectedTxn.type || "Membership Plan"}
                </span>
                <span style={{ fontWeight: "700" }}>₹ {selectedTxn.Amount || selectedTxn.amount || 0}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12.5px",
                  color: "#64748b",
                  marginBottom: "12px",
                }}
              >
                <span>GST / Taxes (Included)</span>
                <span>₹ 0.00</span>
              </div>

              <div
                style={{
                  borderTop: "1.5px dashed #cbd5e1",
                  paddingTop: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "800",
                  fontSize: "16px",
                  color: "#be123c",
                }}
              >
                <span>Total Paid:</span>
                <span>₹ {selectedTxn.Amount || selectedTxn.amount || 0}</span>
              </div>
            </div>

            {/* Verified Footer */}
            <div
              style={{
                textAlign: "center",
                color: "#94a3b8",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <SafetyCertificateOutlined style={{ color: "#059669" }} />
              Verified Matrimony Digital Transaction Record.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default User_Transactions;
