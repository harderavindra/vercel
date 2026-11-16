import mongoose from 'mongoose';

// Campaigns v2 brands. Separate from the old BrandCategory (see CatalogProduct.js).
// Names are unique per product (case-insensitive), checked in catalogController.
const CatalogBrandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogProduct', required: true, index: true },
  },
  { timestamps: true, collection: 'campaign_brands' }
);

export default mongoose.model('CatalogBrand', CatalogBrandSchema);
