import mongoose from 'mongoose';

// Campaigns v2 product categories (CatalogProduct) (e.g. Tractor, Implement).
// Separate from the old ProductCategory used by /masterdata, Jobs and Brand Treasury:
// copied from it once (same _id), then managed independently in Masters → Brand & Model.
const CatalogProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true, collection: 'campaign_products' }
);

export default mongoose.model('CatalogProduct', CatalogProductSchema);
