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
