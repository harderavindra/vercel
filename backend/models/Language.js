import mongoose from 'mongoose';

// Languages an offer can be created in. `code` is a short internal id (e.g. 'hi')
// that other masters (zone states, offer feature translations) store.
const LanguageSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Language', LanguageSchema);
