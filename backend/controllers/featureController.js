import mongoose from 'mongoose';
import OfferFeature from '../models/OfferFeature.js';
import ModelCategory from '../models/ModelCategory.js';
import Language from '../models/Language.js';

const isId = (v) => typeof v === 'string' && mongoose.Types.ObjectId.isValid(v);

// Plain JSON for a feature: text as a plain { code: text } object
const toJson = (f) => {
  const obj = typeof f.toObject === 'function' ? f.toObject({ flattenMaps: true }) : f;
  return { ...obj, text: obj.text instanceof Map ? Object.fromEntries(obj.text) : obj.text || {} };
};

const handleError = (res, error, fallback) => {
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  console.error(fallback, error);
  return res.status(500).json({ message: fallback });
};

// GET /api/masters/features?model=<modelId>  → features of that model, sorted by order
export const getFeatures = async (req, res) => {
  const { model } = req.query;
  if (!isId(model)) return res.status(400).json({ message: 'A valid model id is required' });
  try {
    const features = await OfferFeature.find({ model }).sort({ order: 1, createdAt: 1 }).lean();
    res.status(200).json(features.map(toJson));
  } catch (error) {
    handleError(res, error, 'Failed to fetch features');
  }
};

// POST /api/masters/features  body: { model, en }  → new feature at the end of the list
export const createFeature = async (req, res) => {
  const { model } = req.body || {};
  const en = typeof req.body?.en === 'string' ? req.body.en.trim() : '';
  if (!isId(model)) return res.status(400).json({ message: 'A valid model id is required' });
  if (!en) return res.status(400).json({ message: 'English text is required' });
  try {
    if (!(await ModelCategory.exists({ _id: model }))) return res.status(404).json({ message: 'Model not found' });
    const last = await OfferFeature.findOne({ model }, 'order').sort({ order: -1 }).lean();
    const feature = await OfferFeature.create({ model, text: { en }, order: (last?.order ?? 0) + 1 });
    res.status(201).json(toJson(feature));
  } catch (error) {
    handleError(res, error, 'Failed to create feature');
  }
};

// PUT /api/masters/features/:id  body: { lang, text }
// Sets one language's text. An empty text removes that language; English cannot be emptied.
export const updateFeatureText = async (req, res) => {
  const lang = typeof req.body?.lang === 'string' ? req.body.lang.trim().toLowerCase() : '';
  const { text } = req.body || {};
  if (!lang) return res.status(400).json({ message: 'lang is required' });
  if (text !== undefined && text !== null && typeof text !== 'string') {
    return res.status(400).json({ message: 'text must be a string' });
  }
  const value = typeof text === 'string' ? text.trim() : '';
  if (lang === 'en' && !value) return res.status(400).json({ message: 'English text cannot be empty' });

  try {
    const feature = await OfferFeature.findById(req.params.id);
    if (!feature) return res.status(404).json({ message: 'Feature not found' });

    if (value) {
      // Only active languages can get new text
      const language = await Language.findOne({ code: lang, active: { $ne: false } }).lean();
      if (!language) return res.status(400).json({ message: `Unknown or inactive language: ${lang}` });
      feature.text.set(lang, value);
    } else {
      feature.text.delete(lang);
    }

    await feature.save();
    res.status(200).json(toJson(feature));
  } catch (error) {
    handleError(res, error, 'Failed to update feature');
  }
};

// DELETE /api/masters/features/:id
export const deleteFeature = async (req, res) => {
  try {
    const feature = await OfferFeature.findByIdAndDelete(req.params.id);
    if (!feature) return res.status(404).json({ message: 'Feature not found' });
    res.status(200).json({ message: 'Feature deleted', _id: feature._id });
  } catch (error) {
    handleError(res, error, 'Failed to delete feature');
  }
};
