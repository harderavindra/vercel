// Brand & Model master on top of the EXISTING old-app collections.
// ProductCategory / BrandCategory / ModelCategory are imported as-is and never changed here;
// Jobs, BrandTreasury and Documents reference them by _id, so renames keep the same _id
// and deletes are refused while anything still references the item.
import mongoose from 'mongoose';
import ProductCategory from '../models/ProductCategory.js';
import BrandCategory from '../models/BrandCategory.js';
import ModelCategory from '../models/ModelCategory.js';
import Job from '../models/JobModel.js';
import BrandTreasury from '../models/BrandTreasury.js';
import Document from '../models/documentModel.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nameRegex = (name) => ({ $regex: `^${escapeRegex(name)}$`, $options: 'i' });
const cleanName = (v) => (typeof v === 'string' ? v.trim() : '');
const isId = (v) => typeof v === 'string' && mongoose.Types.ObjectId.isValid(v);

const handleError = (res, error, fallback) => {
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  // BrandCategory.name has a unique index across ALL products (old schema)
  if (error.code === 11000) return res.status(400).json({ message: 'This name is already used by another brand' });
  console.error(fallback, error);
  return res.status(500).json({ message: fallback });
};

// Counts everything that references a brand or model (field = 'brand' | 'model')
const countReferences = async (field, id) => {
  const [jobs, treasury, documents] = await Promise.all([
    Job.countDocuments({ $or: [{ [field]: id }, { [`items.${field}`]: id }] }),
    BrandTreasury.countDocuments({ [field]: id }),
    Document.countDocuments({ [field]: id }),
  ]);
  return { jobs, brandTreasury: treasury, documents, total: jobs + treasury + documents };
};

const describeReferences = (refs) =>
  [
    refs.jobs && `${refs.jobs} artwork job(s)`,
    refs.brandTreasury && `${refs.brandTreasury} brand treasury item(s)`,
    refs.documents && `${refs.documents} document(s)`,
  ].filter(Boolean).join(', ');

// GET /api/masters/catalog → [{ _id, name, category, brands: [{ _id, name, models: [{ _id, name }] }] }]
export const getCatalog = async (req, res) => {
  try {
    const [products, brands, models] = await Promise.all([
      ProductCategory.find({}, 'name category').sort({ _id: 1 }).lean(),
      BrandCategory.find({}, 'name product').sort({ _id: 1 }).lean(),
      ModelCategory.find({}, 'name brand').sort({ _id: 1 }).lean(),
    ]);

    const modelsByBrand = new Map();
    for (const m of models) {
      const key = String(m.brand);
      if (!modelsByBrand.has(key)) modelsByBrand.set(key, []);
      modelsByBrand.get(key).push({ _id: m._id, name: m.name });
    }
    const brandsByProduct = new Map();
    for (const b of brands) {
      const key = String(b.product);
      if (!brandsByProduct.has(key)) brandsByProduct.set(key, []);
      brandsByProduct.get(key).push({ _id: b._id, name: b.name, models: modelsByBrand.get(String(b._id)) || [] });
    }

    res.status(200).json(
      products.map((p) => ({ _id: p._id, name: p.name, category: p.category, brands: brandsByProduct.get(String(p._id)) || [] }))
    );
  } catch (error) {
    handleError(res, error, 'Failed to fetch catalog');
  }
};

// ---------- Brands ----------

// Returns an error message if `name` can't be used for a brand in `productId` (excluding `exceptId`)
const brandNameProblem = async (name, productId, exceptId) => {
  const notSelf = exceptId ? { _id: { $ne: exceptId } } : {};
  const sameProduct = await BrandCategory.findOne({ ...notSelf, product: productId, name: nameRegex(name) }).lean();
  if (sameProduct) return `"${sameProduct.name}" already exists in this product`;
  // The old schema has a unique index on brand name across all products
  const elsewhere = await BrandCategory.findOne({ ...notSelf, name }).populate('product', 'name').lean();
  if (elsewhere) return `"${name}" is already a brand under ${elsewhere.product?.name || 'another product'}`;
  return null;
};

// POST /api/masters/brands  body: { name, product }
export const createBrand = async (req, res) => {
  const name = cleanName(req.body?.name);
  const { product } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Brand name is required' });
  if (!isId(product)) return res.status(400).json({ message: 'A valid product id is required' });
  try {
    if (!(await ProductCategory.exists({ _id: product }))) return res.status(404).json({ message: 'Product not found' });
    const problem = await brandNameProblem(name, product);
    if (problem) return res.status(400).json({ message: problem });
    const brand = await BrandCategory.create({ name, product });
    res.status(201).json({ _id: brand._id, name: brand.name, product: brand.product, models: [] });
  } catch (error) {
    handleError(res, error, 'Failed to create brand');
  }
};

// PUT /api/masters/brands/:id  body: { name }  (rename, same _id)
export const renameBrand = async (req, res) => {
  const name = cleanName(req.body?.name);
  if (!name) return res.status(400).json({ message: 'Brand name is required' });
  try {
    const brand = await BrandCategory.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    const problem = await brandNameProblem(name, brand.product, brand._id);
    if (problem) return res.status(400).json({ message: problem });
    brand.name = name;
    await brand.save();
    res.status(200).json({ _id: brand._id, name: brand.name, product: brand.product });
  } catch (error) {
    handleError(res, error, 'Failed to rename brand');
  }
};

// DELETE /api/masters/brands/:id  → 409 if referenced anywhere or if it still has models
export const deleteBrand = async (req, res) => {
  try {
    const brand = await BrandCategory.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });

    const refs = await countReferences('brand', brand._id);
    if (refs.total) {
      return res.status(409).json({ message: `"${brand.name}" is used by ${describeReferences(refs)} and cannot be deleted.`, references: refs });
    }
    const models = await ModelCategory.countDocuments({ brand: brand._id });
    if (models) {
      return res.status(409).json({ message: `"${brand.name}" has ${models} model(s). Delete its models first.`, models });
    }

    await BrandCategory.deleteOne({ _id: brand._id });
    res.status(200).json({ message: 'Brand deleted', _id: brand._id });
  } catch (error) {
    handleError(res, error, 'Failed to delete brand');
  }
};

// ---------- Models ----------

const modelNameProblem = async (name, brandId, exceptId) => {
  const notSelf = exceptId ? { _id: { $ne: exceptId } } : {};
  const same = await ModelCategory.findOne({ ...notSelf, brand: brandId, name: nameRegex(name) }).lean();
  return same ? `"${same.name}" already exists for this brand` : null;
};

// POST /api/masters/models  body: { name, brand }
export const createModel = async (req, res) => {
  const name = cleanName(req.body?.name);
  const { brand } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Model name is required' });
  if (!isId(brand)) return res.status(400).json({ message: 'A valid brand id is required' });
  try {
    if (!(await BrandCategory.exists({ _id: brand }))) return res.status(404).json({ message: 'Brand not found' });
    const problem = await modelNameProblem(name, brand);
    if (problem) return res.status(400).json({ message: problem });
    const model = await ModelCategory.create({ name, brand });
    res.status(201).json({ _id: model._id, name: model.name, brand: model.brand });
  } catch (error) {
    handleError(res, error, 'Failed to create model');
  }
};

// PUT /api/masters/models/:id  body: { name }  (rename, same _id)
export const renameModel = async (req, res) => {
  const name = cleanName(req.body?.name);
  if (!name) return res.status(400).json({ message: 'Model name is required' });
  try {
    const model = await ModelCategory.findById(req.params.id);
    if (!model) return res.status(404).json({ message: 'Model not found' });
    const problem = await modelNameProblem(name, model.brand, model._id);
    if (problem) return res.status(400).json({ message: problem });
    model.name = name;
    await model.save();
    res.status(200).json({ _id: model._id, name: model.name, brand: model.brand });
  } catch (error) {
    handleError(res, error, 'Failed to rename model');
  }
};

// DELETE /api/masters/models/:id  → 409 if referenced anywhere
export const deleteModel = async (req, res) => {
  try {
    const model = await ModelCategory.findById(req.params.id);
    if (!model) return res.status(404).json({ message: 'Model not found' });

    const refs = await countReferences('model', model._id);
    if (refs.total) {
      return res.status(409).json({ message: `"${model.name}" is used by ${describeReferences(refs)} and cannot be deleted.`, references: refs });
    }

    await ModelCategory.deleteOne({ _id: model._id });
    res.status(200).json({ message: 'Model deleted', _id: model._id });
  } catch (error) {
    handleError(res, error, 'Failed to delete model');
  }
};
