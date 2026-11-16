import mongoose from 'mongoose';

// HP segments a model comes in (values from Settings → hpSegments).
// Kept in its own collection so the old ModelCategory model stays unchanged.
// The Campaigns v2 offer form offers only these HP segments for the model; no document = all segments.
const ModelHpSegmentSchema = new mongoose.Schema(
  {
    model: { type: mongoose.Schema.Types.ObjectId, ref: 'ModelCategory', required: true, unique: true },
    hpSegments: { type: [{ type: String, trim: true }], default: [] },
  },
  { timestamps: true, collection: 'model_hp_segments' }
);

export default mongoose.model('ModelHpSegment', ModelHpSegmentSchema);
