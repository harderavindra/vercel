import mongoose from 'mongoose';

// Campaigns v2 models. Separate from the old ModelCategory (see CatalogProduct.js).
// hpSegments: the HP segments this model comes in (values from Settings → HP Segments);
// empty = not set, the offer form then allows every segment.
const CatalogModelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogBrand', required: true, index: true },
    hpSegments: { type: [{ type: String, trim: true }], default: [] },
  },
  { timestamps: true, collection: 'campaign_models' }
);

export default mongoose.model('CatalogModel', CatalogModelSchema);
