import mongoose from 'mongoose';

const BrandCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', required: true }
});

export default mongoose.model('BrandCategory', BrandCategorySchema);