import mongoose from 'mongoose';

// Simple key → list-of-strings settings (e.g. hpSegments, offerTypes, agencyStatuses)
const SettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    values: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Setting', SettingSchema);
