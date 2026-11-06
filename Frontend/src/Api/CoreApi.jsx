import { message } from "antd";
import API from "./Api";

// Get the latest token whenever a function runs
const getToken = () => localStorage.getItem("access_token");

////////////////////////////////////////////////////////////////////////////////
// AUTHENTICATION
////////////////////////////////////////////////////////////////////////////////

export const UserRegisterPost = async (values) => {
    const response = await API.post("register/", values, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Registration Failed");
    });

    return response ? response.data : {};
};

export const UserLogin = async (values) => {
    try {
        const response = await API.post("login/", values, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response && response.data) {
            const data = response.data;

            if (data.access) {
                localStorage.setItem("access_token", data.access);
            }

            if (data.refresh) {
                localStorage.setItem("refresh_token", data.refresh);
            }

            return data;
        }

        return {};
    } catch (err) {
        const errorMsg =
            err.response?.data?.error ||
            err.response?.data?.detail ||
            err.response?.data?.message ||
            "Invalid mobile number or password.";
        message.error(errorMsg);
        return { error: errorMsg };
    }
};

export const AdminGet = async () => {
    try {
        const response = await API.get("users/?role=admin");
        return response?.data ? response.data : [];
    } catch {
        return [];
    }
};

export const UserRegGet = async () => {
    const token = getToken();
    const config = {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    };
    const response = await API.get("users/", config).catch(() => {
        return { data: [] };
    });

    return response?.data ? response.data : [];
};

export const UserRegUpdate = async (id, value) => {
    const isFormData = typeof FormData !== "undefined" && value instanceof FormData;
    const headers = {
        Authorization: `Bearer ${getToken()}`,
    };
    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }
    try {
        const response = await API.put(`users/${id}/`, value, { headers });
        return response ? response.data : {};
    } catch (err) {
        console.warn("User update warning:", err?.response?.data);
        return { error: err?.response?.data || "Update User Failed" };
    }
};

export const RefreshToken = async () => {
    const response = await API.post(
        "token/refresh/",
        {
            refresh: localStorage.getItem("refresh_token"),
        },
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    ).catch((err) => {
        message.error(err.response?.data?.detail || "Token Refresh Failed");
    });

    if (response?.data?.access) {
        localStorage.setItem("access_token", response.data.access);
    }

    return response ? response.data : {};
};

////////////////////////////////////////////////////////////////////////////////
// USERS
////////////////////////////////////////////////////////////////////////////////

export const UserPost = async (values) => {
    const response = await API.post("users/", values, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "User Creation Failed");
    });

    return response ? response.data : {};
};

export const UserGet = async () => {
    const response = await API.get("users/", {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Get Users Failed");
    });

    return response ? response.data : {};
};

export const UserUpdate = async (id, value) => {
    const response = await API.put(`users/${id}/`, value, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Update User Failed");
    });

    return response ? response.data : {};
};

export const UserRemove = async (id) => {
    const response = await API.delete(`users/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete User Failed");
    });

    return response ? response.data : {};
};

////////////////////////////////////////////////////////////////////////////////
// USER DATA
////////////////////////////////////////////////////////////////////////////////

export const UserDataPost = async (values) => {
    const response = await API.post("user-data/", values, {
        headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "User Data Creation Failed");
    });

    return response ? response.data : {};
};

export const UserDataGet = async (params = {}) => {
    const response = await API.get("user-data/", {
        params,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Get User Data Failed");
    });

    return response ? response.data : {};
};

export const UserDataGetwt = async (params = {}) => {
    const token = getToken();
    const isId = typeof params === "string" || typeof params === "number";
    const url = isId ? `user-data/${params}/` : "user-data/";
    const queryParams = isId ? {} : params;
    try {
        const response = await API.get(url, {
            params: queryParams,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        return response?.data ? response.data : (isId ? null : []);
    } catch {
        return isId ? null : [];
    }
};

export const UserDataUpdate = async (id, value) => {
    const isFormData = typeof FormData !== "undefined" && value instanceof FormData;
    const headers = {
        Authorization: `Bearer ${getToken()}`,
    };
    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }
    try {
        const response = await API.put(`user-data/${id}/`, value, { headers });
        return response?.data ? response.data : {};
    } catch (err) {
        console.error("UserDataUpdate error:", err);
        const detail = err.response?.data;
        const msg = typeof detail === "object"
            ? Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ")
            : (detail?.detail || "Update User Data Failed");
        return { error: msg || detail || "Update User Data Failed" };
    }
};

export const UserData_Array_Update = async (id, value) => {
    const response = await API.put(`user-data/${id}/`, value, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Update User Data Failed");
    });

    return response ? response.data : {};
};

export const UserDataToggleActive = async (id, isActive) => {
    const response = await API.put(
        `user-data/${id}/`,
        { Active: Boolean(isActive) },
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
        }
    ).catch((err) => {
        message.error(err.response?.data?.detail || err.response?.data?.error || "Failed to update profile status");
    });

    return response ? response.data : null;
};

export const UserDataRemove = async (id) => {
    const response = await API.delete(`user-data/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete User Data Failed");
    });

    return response ? response.data : {};
};

////////////////////////////////////////////////////////////////////////////////
// USER TRANSACTIONS
////////////////////////////////////////////////////////////////////////////////

export const UserTransactionsPost = async (values) => {
    const response = await API.post("user-transactions/", values, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Transaction Creation Failed");
    });

    return response ? response.data : {};
};

export const UserTransactionsGet = async (userIdOrParams, maybeParams = {}) => {
    let url = "user-transactions/";
    let params = {};
    if (typeof userIdOrParams === "object" && userIdOrParams !== null) {
        params = userIdOrParams;
    } else if (userIdOrParams) {
        params = { user_id: userIdOrParams, ...maybeParams };
    } else {
        params = maybeParams;
    }
    const response = await API.get(url, {
        params,
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Get Transactions Failed");
    });

    return response?.data ? response.data : [];
};

export const UserTotalRevenueGet = async () => {
    const response = await API.get("user-transactions/", {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch(() => {
        return { data: [] };
    });

    return response?.data ? response.data : [];
};

export const UserTotalRevenuePost = async (values) => {
    return await UserTransactionsPost(values);
};

export const AdminTotalRevenuePost = async (values) => {
    return await UserTransactionsPost(values);
};

export const UserTransactionsUpdate = async (id, value) => {
    const response = await API.put(`user-transactions/${id}/`, value, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Update Transaction Failed");
    });

    return response ? response.data : {};
};

export const UserTransactionsRemove = async (id) => {
    const response = await API.delete(`user-transactions/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete Transaction Failed");
    });

    return response ? response.data : {};
};

////////////////////////////////////////////////////////////////////////////////
// WISH LIST
////////////////////////////////////////////////////////////////////////////////

export const WishListPost = async (values) => {
    const response = await API.post("wish-list/", values, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Add To Wishlist Failed");
    });

    return response ? response.data : {};
};

export const WishListGet = async (userIdOrParams = {}, maybeParams = {}) => {
    let params = {};
    if (typeof userIdOrParams === "object" && userIdOrParams !== null) {
        params = userIdOrParams;
    } else if (userIdOrParams) {
        params = { user_id: userIdOrParams, ...maybeParams };
    } else {
        params = maybeParams;
    }

    try {
        const response = await API.get("wish-list/", {
            params,
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.data?.results)
            ? response.data.results
            : [];
    } catch (err) {
        console.warn("Get Wishlist Failed:", err);
        const detail = err.response?.data?.detail || err.response?.data?.error;
        if (detail && err.response?.status !== 401) {
            message.error(detail);
        }
        return [];
    }
};

export const WishListIncomingGet = async () => {
    const response = await API.get("wish-list/incoming/", {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Get profile requests failed");
    });

    return response?.data ? response.data : [];
};

export const WishListApprovedGet = async () => {
    const response = await API.get("wish-list/approved/", {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Get approved profiles failed");
    });

    return response?.data ? response.data : [];
};

export const WishListUpdate = async (id, value) => {
    const response = await API.patch(`wish-list/${id}/respond/`, value, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(
            err.response?.data?.detail ||
            err.response?.data?.Status?.[0] ||
            "Update wishlist failed"
        );
    });

    return response ? response.data : {};
};

export const WishListRequest = async (id) => {
    const response = await API.patch(`wish-list/${id}/request/`, {}, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Send profile request failed");
    });

    return response ? response.data : {};
};

export const WishListDirectRequest = async (values) => {
    const response = await API.post("wish-list/request/", values, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Send profile request failed");
    });

    return response ? response.data : {};
};

export const WishListRemove = async (id, params = {}) => {
    const response = await API.delete(`wish-list/${id}/`, {
        params,
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Remove Wishlist Failed");
    });

    return response ? response.data : {};
};

////////////////////////////////////////////////////////////////////////////////
// STAFF DATA
////////////////////////////////////////////////////////////////////////////////

export const StaffDataPost = async (values) => {
    const response = await API.post("staff-data/", values, {
        headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Staff Creation Failed");
    });

    return response ? response.data : {};
};

export const StaffDataGet = async (staffIdOrParams = {}, maybeParams = {}) => {
    let params = {};
    if (typeof staffIdOrParams === "object" && staffIdOrParams !== null) {
        params = staffIdOrParams;
    } else if (staffIdOrParams) {
        params = { staff_id: staffIdOrParams, ...maybeParams };
    } else {
        params = maybeParams;
    }

    try {
        const response = await API.get("staff-data/", {
            params,
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return response?.data ? response.data : [];
    } catch (err) {
        console.warn("Get Staff Failed:", err);
        const detail = err.response?.data?.detail || err.response?.data?.error;
        if (detail && err.response?.status !== 401) {
            message.error(detail);
        }
        return [];
    }
};

export const StaffDataUpdate = async (id, value) => {
    const response = await API.put(`staff-data/${id}/`, value, {
        headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Update Staff Failed");
    });

    return response ? response.data : {};
};

export const StaffDataRemove = async (id) => {
    const response = await API.delete(`staff-data/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete Staff Failed");
    });

    return response ? response.data : {};
};

////////////////////////////////////////////////////////////////////////////////
// STAFF TRANSACTIONS
////////////////////////////////////////////////////////////////////////////////

export const StaffTransactionsPost = async (values) => {
    const response = await API.post("staff-transactions/", values, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Staff Transaction Failed");
    });

    return response ? response.data : {};
};

export const StaffTransactionsGet = async (staffIdOrParams = {}, maybeParams = {}) => {
    let params = {};
    if (typeof staffIdOrParams === "object" && staffIdOrParams !== null) {
        params = staffIdOrParams;
    } else if (staffIdOrParams) {
        params = { staff_id: staffIdOrParams, ...maybeParams };
    } else {
        params = maybeParams;
    }

    try {
        const response = await API.get("staff-transactions/", {
            params,
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.data?.results)
            ? response.data.results
            : [];
    } catch (err) {
        console.warn("Get Staff Transactions Failed:", err);
        const detail = err.response?.data?.detail || err.response?.data?.error;
        if (detail && err.response?.status !== 401) {
            message.error(detail);
        }
        return [];
    }
};

export const StaffTransactionsUpdate = async (id, value) => {
    try {
        const response = await API.patch(`staff-transactions/${id}/`, value, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return response ? response.data : {};
    } catch (patchErr) {
        try {
            const putRes = await API.put(`staff-transactions/${id}/`, value, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
            });
            return putRes ? putRes.data : {};
        } catch (err) {
            const errData = err.response?.data || patchErr.response?.data;
            let errorMsg = "Update Staff Transaction Failed";
            if (errData) {
                if (typeof errData === "string") {
                    errorMsg = errData;
                } else if (errData.error) {
                    errorMsg = errData.error;
                } else if (errData.detail) {
                    errorMsg = errData.detail;
                } else if (typeof errData === "object") {
                    errorMsg = Object.entries(errData)
                        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                        .join(" | ");
                }
            }
            message.error(errorMsg);
            throw err;
        }
    }
};

export const StaffTransactionsRemove = async (id) => {
    const response = await API.delete(`staff-transactions/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete Staff Transaction Failed");
    });

    return response ? response.data : {};
};

export const StaffCommissionGet = async () => {
    const response = await API.get("staff-commission/?active=true", {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch(() => null);

    return response?.data ? response.data : [];
};

////////////////////////////////////////////////////////////////////////////////
// SERVICE USERS
////////////////////////////////////////////////////////////////////////////////

export const ServiceUsersPost = async (values) => {
    const isFormData = typeof FormData !== "undefined" && values instanceof FormData;
    const headers = {
        Authorization: `Bearer ${getToken()}`,
    };
    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }
    try {
        const response = await API.post("service-users/", values, { headers });
        return response ? response.data : {};
    } catch (err) {
        message.error(err.response?.data?.detail || "Service User Creation Failed");
        return {};
    }
};

export const ServiceUsersGet = async (params = {}) => {
    try {
        const response = await API.get("service-users/", {
            params,
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return response ? response.data : [];
    } catch (err) {
        message.error(err.response?.data?.detail || "Get Service Users Failed");
        return [];
    }
};

export const ServiceUsersUpdate = async (id, value) => {
    const isFormData = typeof FormData !== "undefined" && value instanceof FormData;
    const headers = {
        Authorization: `Bearer ${getToken()}`,
    };
    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }
    try {
        const response = await API.put(`service-users/${id}/`, value, { headers });
        return response ? response.data : {};
    } catch (err) {
        message.error(err.response?.data?.detail || "Update Service User Failed");
        return {};
    }
};

export const ServiceUsersRemove = async (id) => {
    const response = await API.delete(`service-users/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete Service User Failed");
    });

    return response ? response.data : {};
};

// Aliases for ServiceData
export const ServiceDataPost = ServiceUsersPost;
export const ServiceDataGet = ServiceUsersGet;
export const ServiceDataUpdate = ServiceUsersUpdate;
export const ServiceDataRemove = ServiceUsersRemove;

////////////////////////////////////////////////////////////////////////////////
// SERVICE TRANSACTIONS
////////////////////////////////////////////////////////////////////////////////

export const ServiceTransactionsPost = async (values) => {
    const response = await API.post("service-transactions/", values, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Service Transaction Failed");
    });

    return response ? response.data : {};
};

export const ServiceTransactionsGet = async (serviceIdOrParams = {}, maybeParams = {}) => {
    let params = {};
    if (typeof serviceIdOrParams === "object" && serviceIdOrParams !== null) {
        params = serviceIdOrParams;
    } else if (serviceIdOrParams) {
        params = { service_id: serviceIdOrParams, ...maybeParams };
    } else {
        params = maybeParams;
    }

    try {
        const response = await API.get("service-transactions/", {
            params,
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.data?.results)
            ? response.data.results
            : [];
    } catch (err) {
        console.warn("Get Service Transactions Failed:", err);
        const detail = err.response?.data?.detail || err.response?.data?.error;
        if (detail && err.response?.status !== 401) {
            message.error(detail);
        }
        return [];
    }
};

export const ServiceTransactionsUpdate = async (id, value) => {
    const response = await API.put(`service-transactions/${id}/`, value, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Update Service Transaction Failed");
    });

    return response ? response.data : {};
};

export const ServiceTransactionsRemove = async (id) => {
    const response = await API.delete(`service-transactions/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete Service Transaction Failed");
    });

    return response ? response.data : {};
};

////////////////////////////////////////////////////////////////////////////////
// SERVICES
////////////////////////////////////////////////////////////////////////////////

export const ServicePost = async (values) => {
    const response = await API.post("services/", values, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Service Creation Failed");
    });

    return response ? response.data : {};
};

export const ServiceGet = async () => {
    const response = await API.get("services/", {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Get Services Failed");
    });

    return response ? response.data : {};
};

export const ServiceUpdate = async (id, value) => {
    const response = await API.put(`services/${id}/`, value, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Update Service Failed");
    });

    return response ? response.data : {};
};

export const Service_Array_Update = async (id, value) => {
    const response = await API.put(`services/${id}/`, value, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Update Service Failed");
    });

    return response ? response.data : {};
};

export const ServiceRemove = async (id) => {
    const response = await API.delete(`services/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete Service Failed");
    });

    return response ? response.data : {};
};

////////////////////////////////////////////////////////////////////////////////
// SERVICE CHARGES
////////////////////////////////////////////////////////////////////////////////

export const PostChargesPost = async (values) => {
    const response = await API.post("service-charges/", values, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Service Charge Creation Failed");
    });

    return response ? response.data : {};
};

export const PostChargesGet = async () => {
    const token = getToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
        const response = await API.get("service-charges/", config);
        return response?.data ? response.data : [];
    } catch (err) {
        message.error(err.response?.data?.detail || "Get Service Charges Failed");
        return [];
    }
};

export const PostChargesUpdate = async (id, value) => {
    const response = await API.put(`service-charges/${id}/`, value, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Update Service Charge Failed");
    });

    return response ? response.data : {};
};

export const PostChargesRemove = async (id) => {
    const response = await API.delete(`service-charges/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete Service Charge Failed");
    });

    return response ? response.data : {};
};

export const ServiceChargeGet = PostChargesGet;
export const ServiceChargePost = PostChargesPost;
export const ServiceChargeUpdate = PostChargesUpdate;
export const ServiceChargeRemove = PostChargesRemove;

////////////////////////////////////////////////////////////////////////////////
// STATES AND DISTRICTS
////////////////////////////////////////////////////////////////////////////////

export const User_StatePost = async (values) => {
    const response = await API.post("states-districts/", values, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "State Creation Failed");
    });

    return response ? response.data : {};
};

export const User_StateGet = async () => {
    const token = getToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
        const response = await API.get("states-districts/", config);
        return response?.data ? response.data : [];
    } catch {
        return [];
    }
};

export const User_StateUpdate = async (id, value) => {
    const response = await API.put(`states-districts/${id}/`, value, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Update State Failed");
    });

    return response ? response.data : {};
};

export const User_StateRemove = async (id) => {
    const response = await API.delete(`states-districts/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete State Failed");
    });

    return response ? response.data : {};
};

export const NearDistrictsGet = async () => {
    const response = await API.get("near-districts/", {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Get Nearby Districts Failed");
    });

    return response ? response.data : {};
};

////////////////////////////////////////////////////////////////////////////////
// CASTES
////////////////////////////////////////////////////////////////////////////////

export const User_CastePost = async (values) => {
    const response = await API.post("castes/", values, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Caste Creation Failed");
    });

    return response ? response.data : {};
};

export const User_CasteGet = async (params) => {
    const token = getToken();
    const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: params || {},
    };
    try {
        const response = await API.get("castes/", config);
        return Array.isArray(response?.data) ? response.data : [];
    } catch {
        return [];
    }
};

export const User_CasteUpdate = async (id, value) => {
    const response = await API.put(`castes/${id}/`, value, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Update Caste Failed");
    });

    return response ? response.data : {};
};

export const User_CasteRemove = async (id) => {
    const response = await API.delete(`castes/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete Caste Failed");
    });

    return response ? response.data : {};
};

////////////////////////////////////////////////////////////////////////////////
// PROFESSIONS
////////////////////////////////////////////////////////////////////////////////

export const ProfessionPost = async (values) => {
    const response = await API.post("professions/", values, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Profession Creation Failed");
    });

    return response ? response.data : {};
};

export const ProfessionGet = async () => {
    const token = getToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
        const response = await API.get("professions/", config);
        return Array.isArray(response?.data) ? response.data : [];
    } catch {
        return [];
    }
};

export const ProfessionUpdate = async (id, value) => {
    const response = await API.put(`professions/${id}/`, value, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Update Profession Failed");
    });

    return response ? response.data : {};
};

export const ProfessionRemove = async (id) => {
    const response = await API.delete(`professions/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete Profession Failed");
    });

    return response ? response.data : {};
};

////////////////////////////////////////////////////////////////////////////////
// RELIGIONS
////////////////////////////////////////////////////////////////////////////////

export const ReligionPost = async (values) => {
    const response = await API.post("religions/", values, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Religion Creation Failed");
    });

    return response ? response.data : {};
};

export const ReligionGet = async () => {
    const token = getToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
        const response = await API.get("religions/", config);
        return Array.isArray(response?.data) ? response.data : [];
    } catch {
        return [];
    }
};

export const ReligionUpdate = async (id, value) => {
    const response = await API.put(`religions/${id}/`, value, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Update Religion Failed");
    });

    return response ? response.data : {};
};

export const ReligionRemove = async (id) => {
    const response = await API.delete(`religions/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete Religion Failed");
    });

    return response ? response.data : {};
};

////////////////////////////////////////////////////////////////////////////////
// LANGUAGES
////////////////////////////////////////////////////////////////////////////////

export const LanguagePost = async (values) => {
    const response = await API.post("languages/", values, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Language Creation Failed");
    });

    return response ? response.data : {};
};

export const LanguageGet = async () => {
    const token = getToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
        const response = await API.get("languages/", config);
        return Array.isArray(response?.data) ? response.data : [];
    } catch {
        return [];
    }
};

export const LanguageUpdate = async (id, value) => {
    const response = await API.put(`languages/${id}/`, value, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Update Language Failed");
    });

    return response ? response.data : {};
};

export const LanguageRemove = async (id) => {
    const response = await API.delete(`languages/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete Language Failed");
    });

    return response ? response.data : {};
};

////////////////////////////////////////////////////////////////////////////////
// COLORS
////////////////////////////////////////////////////////////////////////////////

export const ColorPost = async (values) => {
    const response = await API.post("colors/", values, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Color Creation Failed");
    });
    return response ? response.data : {};
};

export const ColorGet = async () => {
    const token = getToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
        const response = await API.get("colors/", config);
        return Array.isArray(response?.data) ? response.data : [];
    } catch {
        return [];
    }
};

export const ColorUpdate = async (id, value) => {
    const response = await API.put(`colors/${id}/`, value, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Update Color Failed");
    });
    return response ? response.data : {};
};

export const ColorRemove = async (id) => {
    const response = await API.delete(`colors/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete Color Failed");
    });
    return response ? response.data : {};
};

////////////////////////////////////////////////////////////////////////////////
// NEAR DISTRICTS
////////////////////////////////////////////////////////////////////////////////

export const NearDistGet = async (params) => {
    const token = getToken();
    const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: params || {},
    };
    try {
        const response = await API.get("near-districts/", config);
        return Array.isArray(response?.data) ? response.data : [];
    } catch {
        return [];
    }
};

////////////////////////////////////////////////////////////////////////////////
// PLANS
////////////////////////////////////////////////////////////////////////////////

export const PlanPost = async (values) => {
    const response = await API.post("plans/", values, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Plan Creation Failed");
    });

    return response ? response.data : {};
};

export const PlanGet = async (params = {}) => {
    const token = getToken();
    const config = {
        params,
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    };
    try {
        const response = await API.get("plans/", config);
        return response?.data ? (Array.isArray(response.data) ? response.data : [response.data]) : [];
    } catch {
        return [];
    }
};

export const PlanUpdate = async (id, value) => {
    const response = await API.put(`plans/${id}/`, value, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Update Plan Failed");
    });

    return response ? response.data : {};
};

export const PlanRemove = async (id) => {
    const response = await API.delete(`plans/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete Plan Failed");
    });

    return response ? response.data : {};
};

////////////////////////////////////////////////////////////////////////////////
// SUCCESS STORIES
////////////////////////////////////////////////////////////////////////////////

export const SuccessStoriesPost = async (values) => {
    const response = await API.post("success-stories/", values, {
        headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Success Story Creation Failed");
    });

    return response ? response.data : {};
};

export const SuccessStoriesGet = async () => {
    const response = await API.get("success-stories/", {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Get Success Stories Failed");
    });

    return response ? response.data : {};
};

export const SuccessStoriesUpdate = async (id, value) => {
    const response = await API.put(`success-stories/${id}/`, value, {
        headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Update Success Story Failed");
    });

    return response ? response.data : {};
};

export const SuccessStoriesRemove = async (id) => {
    const response = await API.delete(`success-stories/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete Success Story Failed");
    });

    return response ? response.data : {};
};

////////////////////////////////////////////////////////////////////////////////
// HELP
////////////////////////////////////////////////////////////////////////////////

export const HelpPost = async (values) => {
    const response = await API.post("help/", values, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Help Request Failed");
    });

    return response ? response.data : {};
};

export const HelpGet = async (params = {}) => {
    const response = await API.get("help/", {
        params,
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Get Help Requests Failed");
    });

    return response?.data ? response.data : [];
};

export const HelpTargetsGet = async () => {
    const response = await API.get("help/?info=support_targets", {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch(() => {
        return { data: { has_staff: false, added_by_type: "admin" } };
    });

    return response?.data ? response.data : { has_staff: false, added_by_type: "admin" };
};

export const HelpUpdate = async (id, value) => {
    const response = await API.put(`help/${id}/`, value, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Update Help Request Failed");
    });

    return response ? response.data : {};
};

export const HelpRemove = async (id) => {
    const response = await API.delete(`help/${id}/`, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }).catch((err) => {
        message.error(err.response?.data?.detail || "Delete Help Request Failed");
    });

    return response ? response.data : {};
};

////////////////////////////////////////////////////////////////////////////////
// PLANS
////////////////////////////////////////////////////////////////////////////////

// export const PlanPost = async (values) => {
//     const response = await API.post("plans/", values, {
//         headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${getToken()}`,
//         },
//     }).catch((err) => {
//         message.error(err.response?.data?.detail || "Plan Creation Failed");
//     });

//     return response ? response.data : {};
// };

// export const PlanGet = async (id) => {
//     const token = getToken();
//     const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
//     try {
//         const url = id ? `plans/${id}/` : "plans/";
//         const response = await API.get(url, config);
//         return response?.data ? response.data : [];
//     } catch {
//         return [];
//     }
// };

// export const PlanUpdate = async (id, value) => {
//     const response = await API.put(`plans/${id}/`, value, {
//         headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${getToken()}`,
//         },
//     }).catch((err) => {
//         message.error(err.response?.data?.detail || "Update Plan Failed");
//     });

//     return response ? response.data : {};
// };

// export const PlanRemove = async (id) => {
//     const response = await API.delete(`plans/${id}/`, {
//         headers: {
//             Authorization: `Bearer ${getToken()}`,
//         },
//     }).catch((err) => {
//         message.error(err.response?.data?.detail || "Delete Plan Failed");
//     });

//     return response ? response.data : {};
// };

// Aliases for AdminPanel and other modules
export const PlansGet = PlanGet;
export const PlansPost = PlanPost;
export const PlansUpdate = PlanUpdate;
export const PlansRemove = PlanRemove;

export const ServicesGet = ServiceGet;
export const ServicesPost = ServicePost;
export const ServicesUpdate = ServiceUpdate;
export const ServicesRemove = ServiceRemove;

export const SuccessStoryGet = SuccessStoriesGet;
export const SuccessStoryPost = SuccessStoriesPost;
export const SuccessStoryUpdate = SuccessStoriesUpdate;
export const SuccessStoryRemove = SuccessStoriesRemove;

// Phone OTP API Helpers
export const PhoneOTPGet = async () => {
    const token = getToken();
    try {
        const response = await API.get("phone-otp/", {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return response?.data ? (Array.isArray(response.data) ? response.data : [response.data]) : [];
    } catch {
        return [];
    }
};

export const PhoneOTPRemove = async (id) => {
    const token = getToken();
    try {
        const response = await API.delete(`phone-otp/${id}/`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return response ? response.data : {};
    } catch {
        return {};
    }
};

// Near Districts API Helpers
export const NearDistPost = async (values) => {
    try {
        const response = await API.post("near-districts/", values, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return response ? response.data : {};
    } catch (err) {
        message.error(err.response?.data?.detail || "Save Near District Failed");
        return {};
    }
};

export const NearDistUpdate = async (id, value) => {
    try {
        const response = await API.put(`near-districts/${id}/`, value, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return response ? response.data : {};
    } catch (err) {
        message.error(err.response?.data?.detail || "Update Near District Failed");
        return {};
    }
};

export const NearDistRemove = async (id) => {
    try {
        const response = await API.delete(`near-districts/${id}/`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        return response ? response.data : {};
    } catch (err) {
        message.error(err.response?.data?.detail || "Delete Near District Failed");
        return {};
    }
};


