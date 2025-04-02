import axios from "axios";
const API_baseURL = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/users`;

export const fetchUsers = async (page = 1, limit = 10, role = "", designation = "", search = "") => {
  const response = await axios.get(`${API_baseURL}`, {
    params: { page, limit, role, designation, search }, // Removed `userType`
    withCredentials: true,
  });
  return response.data;
};

export const fetchUserById = async (id) => {
  const response = await axios.get(`${API_baseURL}/${id}`, {
    withCredentials: true,
  });
  return response.data;
}

export const updateUserById = async (id, updatedFields) => {
  try {
    const response = await axios.put(`${API_baseURL}/${id}`, updatedFields, {
      withCredentials: true,
    });

    return response.data; // Axios automatically throws errors for non-2xx responses
  } catch (error) {
    console.error("API error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to update user");
  }
}

export const deleteUser = async (userId) => {
  console.log('delete')
  try {
  return await axios.delete(`${API_baseURL}/${userId}`, {
    withCredentials: true,
  })
  } catch (error) {
    console.error("Delete user Error:", error.response?.data || error.message);
    throw error.response?.data?.message || "Failed to delete user"; // Throw meaningful error
  }
}

export const resetPassword = async (userId, newPassword) => {
  try {
    console.log('API Request: Reset Password');
    const response = await axios.put(`${API_baseURL}/${userId}/reset-password`, { newPassword }, {
      withCredentials: true,
    });
    
    return response.data; // Return success response
  } catch (error) {
    console.error("Reset Password Error:", error.response?.data || error.message);
    throw error.response?.data?.message || "Failed to reset password"; // Throw meaningful error
  }
};

export const registerUser = async (userData) => {
  try{
    
    const response = await axios.post(`${API_baseURL}/register`,  userData , {
      withCredentials: true,
    });
    return response.data;


  }catch(error){
    console.error("Reset Password Error:", error.response?.data || error.message);
    throw error.response?.data?.message || "Failed to reset password"; // Throw meaningful error

  }
}

export const uploadProfilePic = async (userId, file, onUploadProgress) => {


      try {
        const formData = new FormData();
        formData.append("profilePic", file);

        const response = await axios.post(
            `${API_baseURL}/uploadProfilePic/${userId}`, 
            formData,
            {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress, // Tracks upload progress
            }
        );

        return response.data; // Expected { success: true, profilePic: "URL" }
    } catch (error) {
        console.error("Upload Error:", error);
        return { success: false, message: error.response?.data?.message || "Upload failed" };
    }

};
