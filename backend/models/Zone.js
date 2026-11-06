import mongoose from 'mongoose';

// A state inside a zone. `languages` holds Language codes in order:
// the first one is the state's default language.
const StateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    languages: { type: [String], default: [] },
  },
  { _id: false }
);

const ZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    states: { type: [StateSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Zone', ZoneSchema);
