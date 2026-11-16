// Brand & Model master for Campaigns v2 (Masters → Brand & Model).
// Uses its OWN collections (campaign_products / campaign_brands / campaign_models), separate from the old
// ProductCategory / BrandCategory / ModelCategory used by /masterdata, Jobs, Brand Treasury and Documents.
// The old collections are only READ, once, by importCatalog (copy with the same _ids); nothing here writes to them.
import mongoose from 'mongoose';
import CatalogProduct from '../models/CatalogProduct.js';
import CatalogBrand from '../models/CatalogBrand.js';
import CatalogModel from '../models/CatalogModel.js';
import ProductCategory from '../models/ProductCategory.js'; // read-only (importCatalog)
import BrandCategory from '../models/BrandCategory.js'; // read-only (importCatalog)
import ModelCategory from '../models/ModelCategory.js'; // read-only (importCatalog)
import CampaignV2 from '../models/CampaignV2.js';
import OfferFeature from '../models/OfferFeature.js';
import Setting from '../models/Setting.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nameRegex = (name) => ({ $regex: `^${escapeRegex(name)}$`, $options: 'i' });
const cleanName = (v) => (typeof v === 'string' ? v.trim() : '');
const isId = (v) => typeof v === 'string' && mongoose.Types.ObjectId.isValid(v);

const handleError = (res, error, fallback) => {
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  console.error(fallback, error);
  return res.status(500).json({ message: fallback });
};

// How many Campaigns v2 offers use a brand or model (field = 'brand' | 'model')
const offersUsing = (field, id) => CampaignV2.countDocuments({ [`offers.items.${field}`]: id });

// GET /api/masters/catalog → [{ _id, name, category, brands: [{ _id, name, models: [{ _id, name, hpSegments }] }] }]
// hpSegments: the model's HP segments ([] = not set, every segment allowed)
export const getCatalog = async (req, res) => {
  try {
    const [products, brands, models] = await Promise.all([
      CatalogProduct.find({}, 'name').sort({ _id: 1 }).lean(),
      CatalogBrand.find({}, 'name product').sort({ _id: 1 }).lean(),
      CatalogModel.find({}, 'name brand hpSegments').sort({ _id: 1 }).lean(),
    ]);

    const modelsByBrand = new Map();
    for (const m of models) {
      const key = String(m.brand);
      if (!modelsByBrand.has(key)) modelsByBrand.set(key, []);
      modelsByBrand.get(key).push({ _id: m._id, name: m.name, hpSegments: m.hpSegments || [] });
    }
    const brandsByProduct = new Map();
    for (const b of brands) {
      const key = String(b.product);
      if (!brandsByProduct.has(key)) brandsByProduct.set(key, []);
      brandsByProduct.get(key).push({ _id: b._id, name: b.name, models: modelsByBrand.get(String(b._id)) || [] });
    }

    res.status(200).json(
      products.map((p) => ({ _id: p._id, name: p.name, category: p.name, brands: brandsByProduct.get(String(p._id)) || [] }))
    );
  } catch (error) {
    handleError(res, error, 'Failed to fetch catalog');
  }
};

// POST /api/masters/catalog/import → copy products, brands and models from Master Data (old collections)
// with the SAME _ids, so offers and offer features that point at them keep working.
// Only adds ids not copied yet: never overwrites a campaign item that was renamed, never writes to the old collections.
// Also carries over HP segments saved in the short-lived model_hp_segments collection, if any.
export const importCatalog = async (req, res) => {
  try {
    const [products, brands, models] = await Promise.all([
      ProductCategory.find({}, 'name').lean(),
      BrandCategory.find({}, 'name product').lean(),
      ModelCategory.find({}, 'name brand').lean(),
    ]);
    const hpRows = await mongoose.connection.db.collection('model_hp_segments').find({}, { projection: { model: 1, hpSegments: 1 } }).toArray();
    const hpByModel = new Map(hpRows.map((r) => [String(r.model), r.hpSegments || []]));

    // Skip brands / models whose parent no longer exists in Master Data
    const productIds = new Set(products.map((p) => String(p._id)));
    const keptBrands = brands.filter((b) => productIds.has(String(b.product)));
    const brandIds = new Set(keptBrands.map((b) => String(b._id)));
    const keptModels = models.filter((m) => brandIds.has(String(m.brand)));

    const copy = async (Model, docs) => {
      if (!docs.length) return 0;
      const result = await Model.bulkWrite(
        docs.map((doc) => ({ updateOne: { filter: { _id: doc._id }, update: { $setOnInsert: doc }, upsert: true } })),
        { ordered: false }
      );
      return result.upsertedCount || 0;
    };
    const added = {
      products: await copy(CatalogProduct, products.map((p) => ({ _id: p._id, name: (p.name || '').trim() }))),
      brands: await copy(CatalogBrand, keptBrands.map((b) => ({ _id: b._id, name: (b.name || '').trim(), product: b.product }))),
      models: await copy(CatalogModel, keptModels.map((m) => ({
        _id: m._id, name: (m.name || '').trim(), brand: m.brand, hpSegments: hpByModel.get(String(m._id)) || [],
      }))),
    };
    const total = added.products + added.brands + added.models;
    res.status(200).json({
      message: total
        ? `Copied ${added.products} product(s), ${added.brands} brand(s) and ${added.models} model(s) from Master Data.`
        : 'Everything from Master Data is already copied.',
      added,
    });
  } catch (error) {
    handleError(res, error, 'Failed to copy from Master Data');
  }
};

// ---------- Brands ----------

// Returns an error message if `name` can't be used for a brand in `productId` (excluding `exceptId`)
const brandNameProblem = async (name, productId, exceptId) => {
  const notSelf = exceptId ? { _id: { $ne: exceptId } } : {};
  const same = await CatalogBrand.findOne({ ...notSelf, product: productId, name: nameRegex(name) }).lean();
  return same ? `"${same.name}" already exists in this product` : null;
};

// POST /api/masters/brands  body: { name, product }
export const createBrand = async (req, res) => {
  const name = cleanName(req.body?.name);
  const { product } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Brand name is required' });
  if (!isId(product)) return res.status(400).json({ message: 'A valid product id is required' });
  try {
    if (!(await CatalogProduct.exists({ _id: product }))) return res.status(404).json({ message: 'Product not found' });
    const problem = await brandNameProblem(name, product);
    if (problem) return res.status(400).json({ message: problem });
    const brand = await CatalogBrand.create({ name, product });
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
    const brand = await CatalogBrand.findById(req.params.id);
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

// DELETE /api/masters/brands/:id  → 409 if it still has models or campaign offers use it
export const deleteBrand = async (req, res) => {
  try {
    const brand = await CatalogBrand.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });

    const models = await CatalogModel.countDocuments({ brand: brand._id });
    if (models) {
      return res.status(409).json({ message: `"${brand.name}" has ${models} model(s). Delete its models first.`, models });
    }
    const campaigns = await offersUsing('brand', brand._id);
    if (campaigns) {
      return res.status(409).json({ message: `"${brand.name}" is used by offers in ${campaigns} campaign(s) and cannot be deleted.`, campaigns });
    }

    await CatalogBrand.deleteOne({ _id: brand._id });
    res.status(200).json({ message: 'Brand deleted', _id: brand._id });
  } catch (error) {
    handleError(res, error, 'Failed to delete brand');
  }
};

// ---------- Models ----------

const modelNameProblem = async (name, brandId, exceptId) => {
  const notSelf = exceptId ? { _id: { $ne: exceptId } } : {};
  const same = await CatalogModel.findOne({ ...notSelf, brand: brandId, name: nameRegex(name) }).lean();
  return same ? `"${same.name}" already exists for this brand` : null;
};

// POST /api/masters/models  body: { name, brand }
export const createModel = async (req, res) => {
  const name = cleanName(req.body?.name);
  const { brand } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Model name is required' });
  if (!isId(brand)) return res.status(400).json({ message: 'A valid brand id is required' });
  try {
    if (!(await CatalogBrand.exists({ _id: brand }))) return res.status(404).json({ message: 'Brand not found' });
    const problem = await modelNameProblem(name, brand);
    if (problem) return res.status(400).json({ message: problem });
    const model = await CatalogModel.create({ name, brand });
    res.status(201).json({ _id: model._id, name: model.name, brand: model.brand, hpSegments: [] });
  } catch (error) {
    handleError(res, error, 'Failed to create model');
  }
};

// PUT /api/masters/models/:id  body: { name }  (rename, same _id)
export const renameModel = async (req, res) => {
  const name = cleanName(req.body?.name);
  if (!name) return res.status(400).json({ message: 'Model name is required' });
  try {
    const model = await CatalogModel.findById(req.params.id);
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

// DELETE /api/masters/models/:id  → 409 if campaign offers or offer features use it
export const deleteModel = async (req, res) => {
  try {
    const model = await CatalogModel.findById(req.params.id);
    if (!model) return res.status(404).json({ message: 'Model not found' });

    const campaigns = await offersUsing('model', model._id);
    if (campaigns) {
      return res.status(409).json({ message: `"${model.name}" is used by offers in ${campaigns} campaign(s) and cannot be deleted.`, campaigns });
    }
    const features = await OfferFeature.countDocuments({ model: model._id });
    if (features) {
      return res.status(409).json({ message: `"${model.name}" has ${features} offer feature(s). Delete them in Offer Features first.`, features });
    }

    await CatalogModel.deleteOne({ _id: model._id });
    res.status(200).json({ message: 'Model deleted', _id: model._id });
  } catch (error) {
    handleError(res, error, 'Failed to delete model');
  }
};

// PUT /api/masters/models/:id/hp  body: { hpSegments: string[] }  ([] clears: every segment allowed)
// Each value must be in Settings → HP Segments; saved in Settings order.
export const setModelHpSegments = async (req, res) => {
  const { hpSegments } = req.body || {};
  if (!Array.isArray(hpSegments) || hpSegments.some((v) => typeof v !== 'string')) {
    return res.status(400).json({ message: 'hpSegments must be an array of strings' });
  }
  try {
    const model = await CatalogModel.findById(req.params.id);
    if (!model) return res.status(404).json({ message: 'Model not found' });
    const allowed = (await Setting.findOne({ key: 'hpSegments' }).lean())?.values || [];
    const wanted = [...new Set(hpSegments.map((v) => v.trim()).filter(Boolean))];
    const unknown = wanted.filter((v) => !allowed.includes(v));
    if (unknown.length) return res.status(400).json({ message: `Not in Settings → HP Segments: ${unknown.join(', ')}` });
    model.hpSegments = allowed.filter((v) => wanted.includes(v));
    await model.save();
    res.status(200).json({ _id: model._id, name: model.name, hpSegments: model.hpSegments });
  } catch (error) {
    handleError(res, error, 'Failed to save HP segments');
  }
};
