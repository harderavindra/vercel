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
