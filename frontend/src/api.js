import axios from "axios";


const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});



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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        console.warn("Unauthorized request - token may have expired.");
      }
    }
    return Promise.reject(error);
  }
);

const buildUrl = (path) => (path.startsWith("/") ? path : `/${path}`);

const get = (path, config) => api.get(buildUrl(path), config);
const post = (path, data, config) => api.post(buildUrl(path), data, config);
const put = (path, data, config) => api.put(buildUrl(path), data, config);
const remove = (path, config) => api.delete(buildUrl(path), config);

export const customersAPI = {
  list: () => get("/customers/"),
  get: (id) => get(`/customers/${id}`),
  create: (payload) => post("/customers/", payload),
  update: (id, payload, config) => put(`/customers/${id}`, payload, config),
  remove: (id) => remove(`/customers/${id}`),
};

export const workflowAPI = {
  get: (customerId) => get(`/customers/${customerId}/workflow`),
  save: (customerId, section, payload) => put(`/customers/${customerId}/workflow`, { section, payload }),
};

export const siteVisitAPI = {
  get: (customerId) => get(`/site-visits/${customerId}`, { validateStatus: (status) => status < 500 }),
  save: (id, payload, config) => id ? put(`/site-visits/${id}`, payload, config) : post("/site-visits/", payload, config),
};

export const mnreAPI = {
  get: (customerId) => get(`/mnre/${customerId}`),
  save: (customerId, payload, config) => post(`/mnre/${customerId}`, payload, config),
  getInstallation: (customerId) => get(`/mnre/installation/${customerId}`, { validateStatus: (status) => status < 500 }),
  saveInstallation: (customerId, payload, config) => payload?.id ? put(`/mnre/installation/${customerId}`, payload, config) : post(`/mnre/installation/${customerId}`, payload, config),
};

export const loanAPI = {
  get: (customerId) => get(`/loans/${customerId}`),
  save: (customerId, payload, config) => post(`/loans/${customerId}`, payload, config),
};

export const paymentAPI = {
  get: (customerId) => get(`/payments/${customerId}`),
  save: (customerId, payload, isUpdate, config) => isUpdate ? put(`/payments/${customerId}`, payload, config) : post(`/payments/${customerId}`, payload, config),
};

export const ksebAPI = {
  get: (customerId) => get(`/kseb/${customerId}`),
  save: (customerId, payload, config) => post(`/kseb/${customerId}`, payload, config),
};

export const ksebRegistrationAPI = {
  get: (customerId) => get(`/kseb/registration/${customerId}`),
  save: (customerId, payload, isUpdate, config) => isUpdate ? put(`/kseb/registration/${customerId}`, payload, config) : post(`/kseb/registration/${customerId}`, payload, config),
};

export const dcrAPI = {
  get: (customerId) => get(`/kseb/dcr/${customerId}`),
  save: (customerId, payload, isUpdate, config) => isUpdate ? put(`/kseb/dcr/${customerId}`, payload, config) : post(`/kseb/dcr/${customerId}`, payload, config),
};

export const materialDeliveryAPI = {
  get: (customerId) => get(`/material-deliveries/${customerId}`, { validateStatus: (status) => status < 500 }),
  save: (customerId, payload, config) => payload?.id ? put(`/material-deliveries/${customerId}`, payload, config) : post(`/material-deliveries/${customerId}`, payload, config),
};

export const installationAPI = {
  get: (customerId) => get(`/installations/${customerId}`, { validateStatus: (status) => status < 500 }),
  save: (customerId, payload, config) => post(`/installations/${customerId}`, payload, config),
};

export const serviceAPI = {
  // Get all services for a customer
  getServices: (projectId) => get(`/services/project/${projectId}`),
  
  // Create a new service
  createService: (projectId, formData) => 
    post(`/services/${projectId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  
  // Update a service
  updateService: (serviceId, formData) => 
    put(`/services/${serviceId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  
  // Delete a service
  deleteService: (serviceId) => remove(`/services/${serviceId}`)
};

export default api;