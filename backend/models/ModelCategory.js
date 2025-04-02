import mongoose from 'mongoose';

const ModelCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true }
});

export default  mongoose.model('ModelCategory', ModelCategorySchema);