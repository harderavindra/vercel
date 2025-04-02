import React, { useEffect, useState, useCallback } from "react";
import { addNewBrand, addNewModelCategory, deleteBrand, deleteModelCategory, fetchAllProducts, fetchBrandByProductId, fetchModelCategoriesByBrand } from "../api/masterDataApi";
import Button from "../components/common/Button";
import { FiPlus, FiX } from "react-icons/fi";

const MasterDataPage = () => {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);

  const [isAddingBrand, setIsAddingBrand] = useState(false)
  const [isAddingModel, setIsAddingModel] = useState(false)
  const labelStyle = "py-2 px-4 rounded-md border flex gap-3 items-center";
  const defaultStyle = "bg-white border-gray-300";
  const selectedStyle = "bg-red-500 text-white border-red-500";

  // Fetch Brands by Product ID
  const getBrandsById = useCallback(async (productId) => {
    if (!productId) return;

    setError("");
    setBrands([]);
    setLoading(true);

    try {
      const brandData = await fetchBrandByProductId(productId);
      setBrands(brandData);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);
  // Fetch Brands by Product ID
  const getModelsById = useCallback(async (brandId) => {
    if (!brandId) return;

    setError("");
    setModels([]);
    setLoading(true);

    console.log('modelData')
    try {
      const modelData = await fetchModelCategoriesByBrand(brandId);
      console.log('modelData')
      setModels(modelData);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong Get Model");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch All Products on Component Mount
  useEffect(() => {
    const getAllProducts = async () => {
      setLoading(true);
      try {
        const data = await fetchAllProducts();
        setProducts(data);
        if (data.length > 0) {
          setSelectedProduct(data[0]._id);
          getBrandsById(data[0]._id);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    getAllProducts();
  }, [getBrandsById]);

  // Add New Brand
  const addBrand = async () => {
    if (!selectedProduct) {
      setError("Please select a product first.");
      return;
    }
    if (!newBrand.trim()) {
      setError("Brand name cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      await addNewBrand({ name: newBrand, product: selectedProduct });
      setNewBrand("");
      getBrandsById(selectedProduct); // Refresh the brands list after adding
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
      setIsAddingBrand(false)
    }
  };
  // Add New Brand
  const addModel = async () => {
    if (!selectedBrand) {
      setError("Please select a product first.");
      return;
    }
    if (!newModel.trim()) {
      setError("Brand name cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      await addNewModelCategory({ name: newModel, brand: selectedBrand });
      console.log(selectedBrand)
      setNewModel("");
      getModelsById(selectedBrand); // Refresh the brands list after adding
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
      setIsAddingBrand(false)
    }
  };
  const removeBrand = async (brandId) => {
    if (!window.confirm("Are you sure you want to delete this brand?")) return;

    setLoading(true);
    try {
      await deleteBrand(brandId);
      getBrandsById(selectedProduct); // Refresh brands after deletion
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  const removeModel = async (modelId) => {
    if (!window.confirm("Are you sure you want to delete this brand?")) return;

    setLoading(true);
    try {
      await deleteModelCategory(modelId);
      getModelsById(selectedBrand); // Refresh brands after deletion
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8  p-10">
      <div className="flex  gap-6 p-8 bg-white  border border-blue-300/60 rounded-xl  shadow-md items-center justify-between">
        <h2 className="font-semibold text-lg min-w-1/5">Product Category</h2>
        <div className="flex gap-4 w-full">
          {products.map((product) => (
            <span
              key={product._id}
              className={`${selectedProduct === product._id ? selectedStyle : defaultStyle} ${labelStyle} cursor-pointer`}
              onClick={() => {
                setSelectedProduct(product._id);
                getBrandsById(product._id);
              }}
            >
              {product.name}
            </span>
          ))}
        </div>
        <div></div>
      </div>
      <div className="flex  gap-6 p-8 bg-white  border border-blue-300/60 rounded-xl  shadow-md items-center justify-between">
        <h2 className="font-semibold text-lg min-w-1/5">Brand Category</h2>
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-4">
            {loading ? (
              <p>Loading brands...</p>
            ) : brands.length > 0 ? (
              brands.map((brand) => (
                <div key={brand._id}
                  className={`${selectedBrand === brand._id ? selectedStyle : defaultStyle} ${labelStyle} cursor-pointer`}
                  onClick={() => {
                    setSelectedBrand(brand._id);
                    getModelsById(brand._id);
                  }}>
                  {brand.name}
                  <span onClick={() => removeBrand(brand._id)}
                  ><FiX />
                  </span>
                </div>
              ))
            ) : (
              <p>No brands available.</p>
            )}
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12">
              {
                !isAddingBrand && (
                  <Button onClick={() => { setIsAddingBrand(!isAddingBrand) }}><FiPlus /></Button>

                )
              }
            </div>
            {isAddingBrand && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="Enter new brand"
                  className="border border-gray-300 px-4 py-2 rounded-md"
                />
                <button onClick={addBrand} className="bg-red-500 text-white px-4 py-2 rounded-md">
                  Add Brand
                </button>
                <button className="bg-white border border-gray-400 text-gray-800 px-4 py-2 rounded-md"
                  onClick={() => setIsAddingBrand(false)}
                ><FiX /></button>

              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex  gap-6 p-8 bg-white  border border-blue-300/60 rounded-xl  shadow-md items-center justify-between">
        <h2 className="font-semibold text-lg min-w-1/5">Model Category</h2>
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-4">        
            {loading ? (
              <p>Loading model...</p>
            ) : models.length > 0 ? (
              models.map((model) => (
                <div key={model._id} className={`${labelStyle} ${defaultStyle}`}  >
                  {model.name}
                  <span onClick={() => removeModel(model._id)}
                  ><FiX />
                  </span>
                </div>
              ))
            ) : (
              <p>No Model available.</p>
            )
          }
        
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12">
              {
                !isAddingModel && (
                  <Button onClick={() => { setIsAddingModel(!isAddingBrand) }}><FiPlus /></Button>

                )
              }
            </div>
            {
              isAddingModel && (

                <div className="flex gap-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      placeholder="Enter new model"
                      className="border border-gray-300 px-4 py-2 rounded-md"
                    />
                    <button onClick={addModel} className="bg-red-500 text-white px-4 py-2 rounded-md">
                      Add Model
                    </button>
                  </div>
                  <button className="bg-white border border-gray-400 text-gray-800 px-4 py-2 rounded-md"
                    onClick={() => setIsAddingModel(false)}
                  ><FiX /></button>
                </div>
              )}
          </div>
        </div>
      </div>
      {/* Error Message */}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default MasterDataPage;
