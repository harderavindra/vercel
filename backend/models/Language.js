import mongoose from 'mongoose';

// Languages an offer can be created in. `code` is a short internal id (e.g. 'hi')
// that other masters (zone states, offer feature translations) store.
// Never hard-deleted: "delete" sets active:false so existing references keep working.
const LanguageSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Language', LanguageSchema);
