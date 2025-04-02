import express from 'express';

import {createProductCategory,createBrandCategory, getAllProductCategoreis, getBrandCategoriesByProductId, deleteBrand, getModelCategoriesByBrand, addModelCategory, deleteModelCategory} from '../controllers/masterCategoryController.js'

const router = express.Router();

router.post("/prodcut-category", createProductCategory)
router.get ("/prodcut-category", getAllProductCategoreis) 
router.post("/brand-category", createBrandCategory)
router.get("/brand-categories/product/:productId", getBrandCategoriesByProductId)
router.delete("/brand-category/:brandId", deleteBrand);      
router.get("/model-category/:brandId", getModelCategoriesByBrand);  // Get model categories by brand ID
router.post("/model-category/", addModelCategory);                  // Add a new model category
router.delete("/model-category/:modelCategoryId", deleteModelCategory); // Delete a model category

export default router;
