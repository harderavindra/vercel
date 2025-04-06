import axios from "axios";
const API_baseURL = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/brand-treasury`;



export const fetchBrandTreasury = async () => {
    const response = await axios.get(API_baseURL, { withCredentials: true });
    return response.data;

}
export const fetchBrandTreasuryList = async (page = 1, limit = 10, documentType = "", starred = false, myDocuments = false, search = "") => {
    try {
        console.log(myDocuments + '///////////')
        const response = await axios.get(API_brandURL, { params: { page, limit, documentType, starred, myDocuments: myDocuments.toString(), search }, withCredentials: true });

        return response.data;
    } catch (error) {
        console.error('Error updating starred status:', error);
        throw error; // Rethrow for handling in the component
    }

}
export const updateStar = async (documentId) => {
    try {
        const response = await axios.patch(`${API_baseURL}/star/${documentId}`, {}, { withCredentials: true });
        return response.data; // Ensure the response contains the updated `isStarred` status
    } catch (error) {
        console.error('Error updating starred status:', error);
        throw error; // Rethrow for handling in the component
    }
};
export const addBrandTreasury = async (brandData) => {
    try {
        const response = await axios.post(API_baseURL, brandData, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error("Add Brand Treasury  Error:", error.response?.data || error.message);
        throw error.response?.data?.message || "Failed to add Brand Treasury "; // Throw meaningful error
    }


}

export const deleteBrandTreasury = async (id) => {
    return await axios.delete(`${API_brandURL}/${id}`);
};