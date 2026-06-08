import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    "https://solarflow-backend-6yjl.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// =========================
// TOKEN INTERCEPTOR
// =========================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("spm_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

// =========================
// RESPONSE HANDLER
// =========================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized - token expired");
    }
    return Promise.reject(error);
  }
);

// =========================
// HELPERS
// =========================
const buildUrl = (path) => (path.startsWith("/") ? path : `/${path}`);

const get = (path, config) => api.get(buildUrl(path), config);
const post = (path, data, config) => api.post(buildUrl(path), data, config);
const put = (path, data, config) => api.put(buildUrl(path), data, config);
const remove = (path, config) => api.delete(buildUrl(path), config);

// =========================
// CUSTOMERS
// =========================
export const customersAPI = {
  list: () => get("/customers/"),
  get: (id) => get(`/customers/${id}`),
  create: (payload) => post("/customers/", payload),
  update: (id, payload) => put(`/customers/${id}`, payload),
  remove: (id) => remove(`/customers/${id}`),
};

// =========================
// WORKFLOW
// =========================
export const workflowAPI = {
  get: (customerId) => get(`/customers/${customerId}/workflow`),
  save: (customerId, section, payload) =>
    put(`/customers/${customerId}/workflow`, { section, payload }),
};

// =========================
// SITE VISIT (ID BASED)
// =========================
export const siteVisitAPI = {
  // GET site visit by CUSTOMER ID (since each customer has only one site visit)
  get: (customerId) =>
    get(`/site-visits/${customerId}`, {
      validateStatus: (status) => status < 500,
    }),

  // SAVE site visit (uses site visit ID for PUT, or creates new with POST)
  save: (siteVisitId, payload, config) =>
    siteVisitId
      ? put(`/site-visits/${siteVisitId}`, payload, config)
      : post("/site-visits/", payload, config),
};

// =========================
// MNRE (customer-based still OK)
// =========================
export const mnreAPI = {
  get: (customerId) => get(`/mnre/${customerId}`),
  save: (customerId, payload, config) =>
    post(`/mnre/${customerId}`, payload, config),
  getInstallation: (customerId) =>
    get(`/mnre/installation/${customerId}`, {
      validateStatus: (status) => status < 500,
    }),
  saveInstallation: (customerId, payload, config) =>
    payload?.id
      ? put(`/mnre/installation/${customerId}`, payload, config)
      : post(`/mnre/installation/${customerId}`, payload, config),
};

// =========================
// LOANS
// =========================
export const loanAPI = {
  get: (customerId) => get(`/loans/${customerId}`),
  save: (customerId, payload, config) =>
    post(`/loans/${customerId}`, payload, config),
};

// =========================
// PAYMENTS (FIXED - CUSTOMER ID BASED)
// =========================
// =========================
// PAYMENTS (FIXED - CUSTOMER BASED SYSTEM)
// =========================
export const paymentAPI = {
  // GET payment by CUSTOMER ID
  get: (customerId) =>
    get(`/payments/${customerId}`, {
      validateStatus: (status) => status < 500,
    }),

  // CREATE payment (customer_id inside payload)
  create: (payload, config) =>
    post("/payments/", payload, config),

  // UPDATE payment by CUSTOMER ID
  update: (customerId, payload, config) =>
    put(`/payments/${customerId}`, payload, config),

  // OPTIONAL: DELETE payment by CUSTOMER ID
  remove: (customerId) =>
    remove(`/payments/${customerId}`),
};

// =========================
// KSEB
// =========================
export const ksebAPI = {
  get: (customerId) => get(`/kseb/${customerId}`),
  save: (customerId, payload, config) =>
    post(`/kseb/${customerId}`, payload, config),
};

// =========================
// KSEB REGISTRATION
// =========================
export const ksebRegistrationAPI = {
  get: (customerId) => get(`/kseb/registration/${customerId}`),
  save: (customerId, payload, isUpdate, config) =>
    isUpdate
      ? put(`/kseb/registration/${customerId}`, payload, config)
      : post(`/kseb/registration/${customerId}`, payload, config),
};

// =========================
// DCR
// =========================
export const dcrAPI = {
  get: (customerId) => get(`/kseb/dcr/${customerId}`),
  save: (customerId, payload, isUpdate, config) =>
    isUpdate
      ? put(`/kseb/dcr/${customerId}`, payload, config)
      : post(`/kseb/dcr/${customerId}`, payload, config),
};

// =========================
// MATERIAL DELIVERY
// =========================
export const materialDeliveryAPI = {
  get: (customerId) =>
    get(`/material-deliveries/${customerId}`, {
      validateStatus: (status) => status < 500,
    }),

  save: (customerId, payload, config) =>
    payload?.id
      ? put(`/material-deliveries/${customerId}`, payload, config)
      : post(`/material-deliveries/${customerId}`, payload, config),
};

// =========================
// INSTALLATION
// =========================
export const installationAPI = {
  get: (customerId) =>
    get(`/installations/${customerId}`, {
      validateStatus: (status) => status < 500,
    }),

  save: (customerId, payload, config) =>
    post(`/installations/${customerId}`, payload, config),
};

// =========================
// SERVICE
// =========================
export const serviceAPI = {
  getServices: (projectId) => get(`/services/project/${projectId}`),

  createService: (projectId, formData) =>
    post(`/services/${projectId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateService: (serviceId, formData) =>
    put(`/services/${serviceId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deleteService: (serviceId) => remove(`/services/${serviceId}`),
};

export default api;