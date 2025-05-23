import React, { useState } from 'react'
import PageTitle from '../components/common/PageTitle'
import StatusMessageWrapper from '../components/common/StatusMessageWrapper'
import Button from '../components/common/Button'
import { useAuth } from '../context/auth-context'
import { hasAccess } from '../utils/permissions'
import { useLocation, useNavigate } from 'react-router-dom'
import InputText from '../components/common/InputText'
import { BRAND_TREASURY_DOCUMENTS, CONTENT_TYPE_DOCUMENTS, LANGUAGES, ZONES } from "../utils/constants";
import { snakeToCapitalCase } from '../utils/convertCase'
import { FiUploadCloud } from 'react-icons/fi'


const BrandTreasuryCreate = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(location.state?.successMessage || "");



    const [file, setFile] = useState(null);
    const [products, setProducts] = useState([]);
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);

    const [formData, setFormData] = useState({
        title: "",
        documentType: "",
        contentType: "",
      
        language: "",
        product: "",
        brand: "",
        model: "",
        comment: ""
    });
    const [uploadProgress, setUploadProgress] = useState(0);
    const [message, setMessage] = useState("");
    const [uploading, setUploading] = useState(false);

    const handleChange = ()=>{

    }
    const handleProductChange = ()=>{

    }
    const handleFileChange = ()=>{

    }
    const handleBrandChange = ()=>{

    }
    const uploadFile = ()=>{

    }


    return (
        <div className="p-5 sm:p-5">
            {/* Header Section */}
            <div className="flex justify-between items-center pb-4">
                <PageTitle>Brand Treasury Add</PageTitle>
                <StatusMessageWrapper loading={loading} success={success} error={error} />
                {hasAccess(user?.role, ['marketing_manager', 'admin', 'zonal_marketing_manager']) && (
                    <Button variant='outline' width="auto" onClick={() => navigate('/brand-treasury')}>
                        Back
                    </Button>
                )}
            </div>
            <div className="">
            <div className="flex gap-10">
                <div className="flex flex-col gap-4  bg-white border border-blue-300/60 rounded-xl p-6  shadow-md relative w-xl">
                    <div className="flex flex-col gap-0">
                        <InputText name={'title'} value={formData.title} label={'Document Title'} handleOnChange={handleChange} />

                    </div>
                    <div>
                        <label>Content Type</label>

                        <select name="contentType" value={formData.contentType} onChange={handleChange} className="block w-full mt-1 border rounded-md p-2">
                            <option value="">Select</option>
                            {Object.values(CONTENT_TYPE_DOCUMENTS).map((doc) => (
                                <option key={doc} value={doc.toLowerCase()}>{snakeToCapitalCase(doc)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Document Type</label>

                        <select name="documentType" value={formData.documentType} onChange={handleChange} className="block w-full mt-1 border rounded-md p-2">
                            <option value="">Select</option>
                            {Object.values(BRAND_TREASURY_DOCUMENTS).map((doc) => (
                                <option key={doc} value={doc.toLowerCase()}>{snakeToCapitalCase(doc)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full h-full object-cover bg-gray-800 rounded-md justify-center items-center flex flex-col py-2 px-6" >
                        {uploading && (
                            <FileIcon mimeType={document?.mimeType} size={50} className="text-gray-600  text-5xl" />
                        )}
                        <div className="text-white flex flex-col items-center justify-center w-full">
                            <label htmlFor="thumbnailUpload" className=" text-white flex flex-col justify-center items-center mt-4 border-b border-gray-600 pb-2 cursor-pointer w-full " >
                                <FiUploadCloud size={24} />
                                {file ? (
                                    <div className="mt-2 text-base text-gray-600 w-full">
                                        <p><strong></strong> {file.name}</p>
                                        <div className="flex justify-between">
                                            <p><strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
                                            <p><strong>Type:</strong> {file.type}</p>
                                        </div>
                                    </div>
                                ) : 'Select Upload '}
                            </label>
                            <input type="file" id="thumbnailUpload" onChange={handleFileChange} hidden className="mt-3" />

                            {uploadProgress > 0 && (
                                <div className="w-full ">

                                    <p className="mt-2 text-sm font-semibold mb-2">Uploading: {uploadProgress}%</p>
                                    <div style={{ width: "100%" }} className="bg-gray-200/20 rounded-2xl py-1 block px-1">
                                        <div
                                            className="bg-blue-500 h-1 rounded-2xl"
                                            style={{
                                                width: `${uploadProgress}%`,

                                                transition: "width 0.3s ease"
                                            }}></div>
                                    </div>
                                </div>
                            )
                            }
                        </div>
                    </div>

                </div>
                <div className="flex flex-col gap-4  bg-white border border-blue-300/60 rounded-xl p-6  shadow-md relative w-xl w-full">
                    {/* <div className="flex gap-6">
                        <div className="w-full">

                            <label>Zone</label>
                            <select name="zone" value={formData.zone} onChange={handleChange} className="block w-full mt-1 border rounded-md p-2">
                                <option value="">Select Zone</option>
                                {Object.keys(ZONES).map((zone) => (
                                    <option key={zone} value={zone}>{zone}</option>
                                ))}
                            </select>
                        </div>
                        {formData.zone && (
                            <div className="w-full">
                                <label>State</label>
                                <select name="state" value={formData.state} onChange={handleChange} className="block w-full mt-1 border rounded-md p-2">
                                    <option value="">Select State</option>
                                    {ZONES[formData.zone].map((state) => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div> */}
                    <div>
                        <label>Language</label>
                        <div className="grid grid-cols-4 gap-2 mt-1">
                            {LANGUAGES.map((lang) => (
                                <label key={lang} className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="language"
                                        value={lang}
                                        checked={formData.language === lang}
                                        onChange={handleChange}
                                    />
                                    <span>{lang}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className='flex flex-col gap-1 w-full'>
                        <label>Product</label>
                        <select
                            className="w-full border border-gray-400 rounded-md py-1 px-2"
                            name="product"
                            value={formData.product}
                            onChange={handleProductChange}
                        >
                            <option value="">Select Product</option>
                            {products.map((product) => (
                                <option key={product._id} value={product._id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Brand</label>
                        <select name="brand" value={formData.brand} onChange={handleBrandChange} className="w-full border p-2 rounded-md" disabled={!formData.product}>
                            <option value="">Select Brand</option>
                            {brands.map((brand) => (
                                <option key={brand._id} value={brand._id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Model</label>
                        <select name="model" value={formData.model} onChange={handleChange} className="w-full border p-2 rounded-md" disabled={!formData.brand}>
                            <option value="">Select Model</option>
                            {models.map((model) => (
                                <option key={model._id} value={model._id}>
                                    {model.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Comments</label>
                        <textarea name="comment" value={formData.comment} onChange={handleChange} className="w-full  border p-2 rounded-md" />
                    </div>
                </div>
            </div>
            <div>


            </div>
            <div>





                <div className="w-full">

                </div>



            </div>
            <div></div>




            <button
                onClick={uploadFile}
                disabled={uploading}
                className={`mt-4 px-4 py-2 rounded-md w-full ${uploading ? "bg-gray-400" : "bg-green-600 text-white"}`}
            >
                {uploading ? "Uploading..." : "Upload"}
            </button>
            {message && <p className={`mt-2 text-sm ${message.includes("failed") ? "text-red-500" : "text-green-500"}`}>{message}</p>}



        </div>
        </div>
    )

}

export default BrandTreasuryCreate