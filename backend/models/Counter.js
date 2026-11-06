import mongoose from 'mongoose';

// Named counters for numbers that must never repeat (e.g. Campaigns v2 offer serials: _id 'offerV2').
const CounterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export default mongoose.model('Counter', CounterSchema);
