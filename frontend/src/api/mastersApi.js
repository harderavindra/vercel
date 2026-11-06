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
export const getLanguages = async () => {
  const response = await axios.get(`${API_baseURL}/languages`, {
    withCredentials: true,
  });
  return response.data;
};

export const addLanguage = async (name) => {
  const response = await axios.post(`${API_baseURL}/languages`, { name }, {
    withCredentials: true,
  });
  return response.data;
};

export const deleteLanguage = async (id) => {
  const response = await axios.delete(`${API_baseURL}/languages/${id}`, {
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
