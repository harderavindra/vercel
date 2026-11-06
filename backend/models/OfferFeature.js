import mongoose from 'mongoose';

// A feature / customer benefit of a model. `text` maps a Language code to its text:
// 'en' is required; other languages are optional translations.
const OfferFeatureSchema = new mongoose.Schema(
  {
    model: { type: mongoose.Schema.Types.ObjectId, ref: 'ModelCategory', required: true },
    text: { type: Map, of: String, default: {} },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

OfferFeatureSchema.index({ model: 1 });

export default mongoose.model('OfferFeature', OfferFeatureSchema);
