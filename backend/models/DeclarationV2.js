import mongoose from 'mongoose';
import { DECLARATION_KINDS } from '../constants/declarationsV2.js';

// One state-level declaration (audit record). Insert-only: there are no update or delete routes.
// version = 1 for the first declaration of this kind for the campaign + state, 2 after a resubmission, …
const declarationV2Schema = new mongoose.Schema(
  {
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'CampaignV2', required: true },
    kind: { type: String, enum: DECLARATION_KINDS, required: true },
    state: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' },
    role: { type: String, required: true },
    period: { type: String, default: '' }, // campaign month, YYYY-MM
    version: { type: Number, required: true },
    decision: { type: String, enum: ['submitted', 'approved'], required: true },
    acceptedItems: [String],
    textVersion: { type: Number, required: true },
    textSnapshot: {
      title: String,
      intro: String,
      items: [{ _id: false, id: String, text: String }],
      footer: String,
    },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { collection: 'declarations_v2', versionKey: false }
);

declarationV2Schema.index({ campaign: 1, state: 1, kind: 1, version: -1 });

const DeclarationV2 = mongoose.model('DeclarationV2', declarationV2Schema);
export default DeclarationV2;
