import mongoose from 'mongoose';

const ProductCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, trim: true },
  category: { type: String, required: true } // e.g., Tractor, Implement
});

export default  mongoose.model('ProductCategory', ProductCategorySchema);