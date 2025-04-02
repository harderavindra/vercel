import axios from "axios";
const API_baseURL = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/master/`;

export const fetchAllProducts = async () => {
    const response = await axios.get(`${API_baseURL}prodcut-category`, { withCredentials: true });
    return response.data?.data || []
}

export const fetchBrandByProductId = async (id) => {
    const response = await axios.get(`${API_baseURL}brand-categories/product/${id}`, {
      withCredentials: true,
    });
    return response.data?.data || []
  }
  
export const addNewBrand = async (updatedFields) => {
    const response = await axios.post(`${API_baseURL}brand-category`,updatedFields, {
      withCredentials: true,
    });
    return response.data;
  }

  export const deleteBrand = async (brandId) => {
    const response = await axios.delete(`${API_baseURL}brand-category/${brandId}`, {
      withCredentials: true,
    });
    return response.data;
  };
  export const addNewModelCategory = async (modelCategory) => {
    console.log(modelCategory+'///////////')
    const response = await axios.post(`${API_baseURL}model-category/`, modelCategory, { withCredentials: true });
    return response.data;
  };
  export const fetchModelCategoriesByBrand = async (brandId) => {
    const response = await axios.get(`${API_baseURL}model-category/${brandId}`);
    console.log(response.data+'brandiD');
    return response.data;
  };
  export const deleteModelCategory = async (modelCategoryId) => {
    console.log(modelCategoryId)
    const response = await axios.delete(`${API_baseURL}model-category/${modelCategoryId}`);
    return response.data;
  };  