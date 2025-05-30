import React, { useEffect, useState } from 'react';
import axios from 'axios';
import InputText from '../components/common/InputText';
import { LANGUAGES, CONTENT_TYPE_DOCUMENTS, BRAND_TREASURY_DOCUMENTS } from "../utils/constants";
import SelectField from '../components/common/SelectField';
import { fetchAllProducts, fetchBrandByProductId, fetchModelCategoriesByBrand } from "../api/masterDataApi";
import Button from '../components/common/Button';
import StatusMessageWrapper from '../components/common/StatusMessageWrapper';
import PageTitle from '../components/common/PageTitle';
import { useLocation, useNavigate } from 'react-router-dom';

const BrandTreasuryUploader = () => {
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [thumbnailInput, setThumbnailInput] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    contentType: "",
    documentType: "",
    language: "",
    product: "",
    brand: "",
    model: "",
    comment: "",
    attachment: '',
    thumbnailUrls: []
  });

  useEffect(() => {
    const getProducts = async () => {
      try {
        const data = await fetchAllProducts();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    getProducts();
    setSuccess(location.state?.successMessage || "");
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProductChange = async (e) => {
    handleChange(e);
    const productId = e.target.value;
    setFormData((prev) => ({ ...prev, product: productId, brand: "", model: "" }));
    setBrands([]);
    setModels([]);

    if (productId) {
      try {
        const brandData = await fetchBrandByProductId(productId);
        setBrands(brandData);
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    }
  };

  const handleBrandChange = async (e) => {
    handleChange(e);
    const brandId = e.target.value;
    setFormData((prev) => ({ ...prev, brand: brandId, model: "" }));
    setModels([]);

    if (brandId) {
      try {
        const modelData = await fetchModelCategoriesByBrand(brandId);
        setModels(modelData);
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    }
  };

  const handleAddThumbnail = () => {
    if (thumbnailInput.trim() !== "") {
      setFormData((prev) => ({
        ...prev,
        thumbnailUrls: [...prev.thumbnailUrls, thumbnailInput.trim()]
      }));
      setThumbnailInput("");
    }
  };

  const handleRemoveThumbnail = (index) => {
    setFormData((prev) => ({
      ...prev,
      thumbnailUrls: prev.thumbnailUrls.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.contentType) newErrors.contentType = "Content Type is required";
    if (!formData.documentType) newErrors.documentType = "Document Type is required";
    if (!formData.language) newErrors.language = "Language is required";
    if (!formData.product) newErrors.product = "Product is required";
    if (!formData.brand) newErrors.brand = "Brand is required";
    if (!formData.model) newErrors.model = "Model is required";
    if (!formData.attachment.trim()) newErrors.attachment = "Attachment is required";
      // Validate thumbnailUrls: ensure at least one non-empty URL is present
  if (!formData.thumbnailUrls || formData.thumbnailUrls.length === 0) {
    newErrors.thumbnailUrls = "At least one Thumbnail URL is required";
  } else if (formData.thumbnailUrls.some(url => !url.trim())) {
    newErrors.thumbnailUrls = "Thumbnail URLs cannot be empty";
  }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!validateForm()) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/brand-treasury/uploader`,
        formData,
        { withCredentials: true }
      );

      if (response.status === 201) {
        setSuccess("Brand Treasury uploaded successfully!");
        setFormData({
          title: "",
          contentType: "",
          documentType: "",
          language: "",
          product: "",
          brand: "",
          model: "",
          comment: "",
          attachment: '',
          thumbnailUrls: []
        });
        setErrors({});
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred while uploading");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container p-10'>
      <div className="flex justify-between items-center pb-4">
        <PageTitle>Add with URLs - Brand Treasury</PageTitle>

        <StatusMessageWrapper loading={loading} success={success} error={error} />
        <Button variant="outline" width="auto" onClick={() => navigate('/brand-treasury')}>Back</Button>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='rounded-xl border border-gray-200 bg-white p-10 space-y-4'>
          <div className='flex '>
            <div className='flex gap-4 flex-wrap w-full pr-20'>
              <div className='flex gap-5 w-full'>
                <InputText
                  name="title"
                  label="Title"
                  value={formData.title}
                  handleOnChange={handleChange}
                  placeholder="Job Title"
                  error={errors.title}
                />
              </div>

              <div className='flex gap-5 w-full'>
                <SelectField label="Content Type" name="contentType" value={formData.contentType} onChange={handleChange} options={CONTENT_TYPE_DOCUMENTS} error={errors.contentType} />
                <SelectField label="Document Type" name="documentType" value={formData.documentType} onChange={handleChange} options={BRAND_TREASURY_DOCUMENTS} error={errors.documentType} />
                <SelectField label="Language" name="language" value={formData.language} onChange={handleChange} options={LANGUAGES} error={errors.language} />
              </div>

              <div className='flex gap-5 w-full'>
                <div className='flex flex-col gap-1 w-full'>
                  <label>Product</label>
                  <select name="product" value={formData.product} onChange={handleProductChange} className={`w-full border rounded-md py-2 px-2 capitalize ${errors.product && 'border-red-500'}`}>
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>{product.name}</option>
                    ))}
                  </select>
                  {errors.product && <p className="text-red-500 text-sm">{errors.product}</p>}
                </div>
                <div className='flex flex-col gap-1 w-full'>
                  <label>Brand</label>
                  <select name="brand" value={formData.brand} onChange={handleBrandChange} className={`w-full border rounded-md p-2 capitalize ${errors.brand && 'border-red-500'}`} disabled={!formData.product}>
                    <option value="">Select Brand</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>{brand.name}</option>
                    ))}
                  </select>
                  {errors.brand && <p className="text-red-500 text-sm">{errors.brand}</p>}
                </div>
                <div className='flex flex-col gap-1 w-full'>
                  <label>Model</label>
                  <select name="model" value={formData.model} onChange={handleChange} className={`w-full border rounded-md p-2 capitalize ${errors.model && 'border-red-500'}`} disabled={!formData.brand}>
                    <option value="">Select Model</option>
                    {models.map((model) => (
                      <option key={model._id} value={model._id}>{model.name}</option>
                    ))}
                  </select>
                  {errors.model && <p className="text-red-500 text-sm">{errors.model}</p>}
                </div>
              </div>
            </div>

            <div className='flex w-full flex-col gap-4 max-w-full'>
              <InputText name="attachment" label="Attachment" value={formData.attachment} handleOnChange={handleChange} placeholder="Attachment" error={errors.attachment} />

              {/* Thumbnail URLs */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold">Thumbnail URLs (Multiple)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Thumbnail URL"
                    value={thumbnailInput}
                    onChange={(e) => setThumbnailInput(e.target.value)}
                    className="border border-gray-400 rounded-md p-2 w-full"
                  />
                  <button type="button" onClick={handleAddThumbnail} className="bg-blue-500 text-white px-4 rounded-md">
                    Add
                  </button>
                </div>
                <ul className="list-none space-y-1 w-full">
                  {formData.thumbnailUrls.map((url, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md overflow-hidden">
                      <div className="flex items-center gap-2 w-full">
                        <span className="truncate w-full text-sm text-gray-700">{url}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveThumbnail(index)}
                        className="text-red-600 hover:underline text-sm ml-2"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Submitting..." : "Submit"}</Button>
      </form>
    </div>
  );
};

export default BrandTreasuryUploader;
