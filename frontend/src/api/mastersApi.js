import axios from "axios";
const API_baseURL = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/masters`;

// ---- Settings lists ----
export const getSettings = async () => {
  const response = await axios.get(`${API_baseURL}/settings`, {
    withCredentials: true,
  });
  return response.data;
};

export const updateSetting = async (key, values) => {
  const response = await axios.put(`${API_baseURL}/settings/${key}`, { values }, {
    withCredentials: true,
  });
  return response.data;
};

// ---- Languages ----
// all=true also returns inactive (removed) languages
export const getLanguages = async (all = false) => {
  const response = await axios.get(`${API_baseURL}/languages`, {
    params: all ? { all: 1 } : {},
    withCredentials: true,
  });
  return response.data;
};

// code is optional; the server generates one from the name
export const addLanguage = async (name, code) => {
  const response = await axios.post(`${API_baseURL}/languages`, code ? { name, code } : { name }, {
    withCredentials: true,
  });
  return response.data;
};

// updates: { name?, active? }. Removing a language is { active: false } (never hard-deleted)
export const updateLanguage = async (id, updates) => {
  const response = await axios.put(`${API_baseURL}/languages/${id}`, updates, {
    withCredentials: true,
  });
  return response.data;
};

export const loadDefaultLanguages = async () => {
  const response = await axios.post(`${API_baseURL}/languages/defaults`, {}, {
    withCredentials: true,
  });
  return response.data;
};

// ---- Zones & States ----
export const getZones = async () => {
  const response = await axios.get(`${API_baseURL}/zones`, { withCredentials: true });
  return response.data;
};

export const createZone = async (name) => {
  const response = await axios.post(`${API_baseURL}/zones`, { name }, { withCredentials: true });
  return response.data;
};

export const updateZone = async (id, updates) => {
  const response = await axios.put(`${API_baseURL}/zones/${id}`, updates, { withCredentials: true });
  return response.data;
};

export const deleteZone = async (id) => {
  const response = await axios.delete(`${API_baseURL}/zones/${id}`, { withCredentials: true });
  return response.data;
};

// state: { name, languages? } → returns the updated zone
export const addState = async (zoneId, state) => {
  const response = await axios.post(`${API_baseURL}/zones/${zoneId}/states`, state, { withCredentials: true });
  return response.data;
};

// updates: { name?, languages? } (languages order matters: first = default) → returns the updated zone
export const updateState = async (zoneId, stateName, updates) => {
  const response = await axios.put(`${API_baseURL}/zones/${zoneId}/states/${encodeURIComponent(stateName)}`, updates, {
    withCredentials: true,
  });
  return response.data;
};

// → returns the updated zone
export const deleteState = async (zoneId, stateName) => {
  const response = await axios.delete(`${API_baseURL}/zones/${zoneId}/states/${encodeURIComponent(stateName)}`, {
    withCredentials: true,
  });
  return response.data;
};

export const loadDefaultZones = async () => {
  const response = await axios.post(`${API_baseURL}/zones/defaults`, {}, { withCredentials: true });
  return response.data;
};

// ---- Brand & Model (existing product/brand/model categories) ----
// → [{ _id, name, category, brands: [{ _id, name, models: [{ _id, name }] }] }]
export const getCatalog = async () => {
  const response = await axios.get(`${API_baseURL}/catalog`, { withCredentials: true });
  return response.data;
};

export const createBrand = async (name, product) => {
  const response = await axios.post(`${API_baseURL}/brands`, { name, product }, { withCredentials: true });
  return response.data;
};

export const renameBrand = async (id, name) => {
  const response = await axios.put(`${API_baseURL}/brands/${id}`, { name }, { withCredentials: true });
  return response.data;
};

export const deleteBrand = async (id) => {
  const response = await axios.delete(`${API_baseURL}/brands/${id}`, { withCredentials: true });
  return response.data;
};

export const createModel = async (name, brand) => {
  const response = await axios.post(`${API_baseURL}/models`, { name, brand }, { withCredentials: true });
  return response.data;
};

export const renameModel = async (id, name) => {
  const response = await axios.put(`${API_baseURL}/models/${id}`, { name }, { withCredentials: true });
  return response.data;
};

export const deleteModel = async (id) => {
  const response = await axios.delete(`${API_baseURL}/models/${id}`, { withCredentials: true });
  return response.data;
};
