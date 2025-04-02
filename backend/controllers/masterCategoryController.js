import ProductCategory  from '../models/ProductCategory.js'
import BrandCategory  from '../models/BrandCategory.js'
import ModelCategory  from '../models/ModelCategory.js'

// Product Controllers
export const createProductCategory = async (req, res) => {
  try {
    const { name, description, category } = req.body;

    const productCategory = new ProductCategory({ name, description, category });
    await productCategory.save();

    res.status(201).json({ message: 'Product created successfully', data: productCategory });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllProductCategoreis = async (req, res) => {
  try {
    const productCategories = await ProductCategory.find();
    res.status(200).json({ data: productCategories });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Brand Controllers
export const createBrandCategory = async (req, res) => {
  try {
    const { name, product } = req.body;

    const brandCategory = new BrandCategory({ name, product });
    await brandCategory.save();

    res.status(201).json({ message: 'Brand created successfully', data: brandCategory });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getBrandCategoriesByProductId = async (req, res) => {
    try {
      const { productId } = req.params;
  
      // Find all BrandCategories with the given product ID
      const brandCategories = await BrandCategory.find({ product: productId }).populate('product', 'name');
      console.log(brandCategories.le)  
      if (brandCategories.length === 0) {
        return res.status(404).json({ message: 'No BrandCategories found for the given Product ID' });
      }
  
      res.status(200).json({ data: brandCategories });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  export const deleteBrand = async (req, res) => {
    try {
      const { brandId } = req.params;
  
      const brand = await BrandCategory.findById(brandId);
      if (!brand) {
        return res.status(404).json({ message: "Brand not found" });
      }
  
      await BrandCategory.findByIdAndDelete(brandId);
      res.status(200).json({ message: "Brand deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting brand", error: error.message });
    }
  };
// Model Controllers
export const createModelCategory = async (req, res) => {
  try {
    const { name, brand } = req.body;

    const modelCategory = new ModelCategory({ name, brand });
    await modelCategory.save();

    res.status(201).json({ message: 'Model created successfully', data: modelCategory });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getModelCategoriesByBrand = async (req, res) => {
  console.log('Model Controllers')
  try {
    const { brandId } = req.params;
    const modelCategories = await ModelCategory.find({ brand: brandId });

    if (!modelCategories.length) {
      return res.status(404).json({ message: "No model categories found for this brand." });
    }

    res.status(200).json(modelCategories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const addModelCategory = async (req, res) => {
  try {
    const { name, brand } = req.body;
    if (!name || !brand) {
      return res.status(400).json({ message: "Model category name and brand ID are required." });
    }
    
    const newModelCategory = new ModelCategory({ name, brand });
    await newModelCategory.save();
    
    res.status(201).json({ message: 'Model created successfully', data: newModelCategory });
    console.log(brand+'////New/2//'+newModelCategory)

  } catch (error) {
    res.status(500).json({ message: "Error adding model category", error: error.message });
  }
};
export const deleteModelCategory = async (req, res) => {
  try {
    const { modelCategoryId } = req.params;

    const modelCategory = await ModelCategory.findById(modelCategoryId);
    if (!modelCategory) {
      return res.status(404).json({ message: "Model category not found" });
    }

    await ModelCategory.findByIdAndDelete(modelCategoryId);
    res.status(200).json({ message: "Model category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting model category", error: error.message });
  }
};
