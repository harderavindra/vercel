import mongoose from 'mongoose';
import { STATUS_KEYS, MAX_ITEMS, MAX_FEATURES, MONTH_PATTERN, validPrice } from '../constants/campaignV2Workflow.js';

// Campaigns v2: a NEW module next to the old Campaign model (collection 'campaigns_v2').
const { ObjectId } = mongoose.Schema.Types;
const hasDuplicates = (values) => new Set(values.map(String)).size !== values.length;

// One brand section of an offer. brandName/modelName are snapshots so old offers keep
// their wording even if the master is renamed later.
const ItemSchema = new mongoose.Schema(
  {
    brand: { type: ObjectId, ref: 'BrandCategory' },
    model: { type: ObjectId, ref: 'ModelCategory' },
    brandName: { type: String, trim: true },
    modelName: { type: String, trim: true },
    hp: { type: String, trim: true },
    type: { type: String, trim: true }, // offer type (Settings → offerTypes)
    offerPrice: { type: Number, validate: { validator: (v) => v == null || validPrice(v), message: 'Offer price must be 6–9 digits' } },
    crossingPrice: { type: Number, validate: { validator: (v) => v == null || validPrice(v), message: 'Crossing price must be 6–9 digits' } },
    features: {
      type: [{ type: ObjectId, ref: 'OfferFeature' }],
      validate: { validator: (v) => !v || v.length <= MAX_FEATURES, message: `A brand section can have at most ${MAX_FEATURES} features` },
    },
    details: { type: String, trim: true },
    remarks: { type: String, trim: true }, // for the Brand Manager
  },
  { _id: false }
);

const ArtworkSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    fileName: { type: String },
    type: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: ObjectId, ref: 'User' },
  },
  { _id: false }
);

const ArtworkCommentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    by: { type: ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
    fileName: { type: String }, // the artwork file the comment refers to
  },
  { _id: false }
);

const OfferSchema = new mongoose.Schema({
  serial: { type: Number, required: true }, // from the 'offerV2' counter; unique within the campaign (checked below)
  code: { type: String, trim: true },       // e.g. Z1-OCT26-00012, fixed when the offer is created
  state: { type: String, required: true, trim: true },
  languages: { type: [String], default: [] }, // Language codes
  items: {
    type: [ItemSchema],
    validate: [
      { validator: (v) => Array.isArray(v) && v.length >= 1 && v.length <= MAX_ITEMS, message: `An offer needs 1 to ${MAX_ITEMS} brand sections` },
      { validator: (v) => !hasDuplicates((v || []).map((i) => i.brand).filter(Boolean)), message: 'Each brand section of an offer must be a different brand' },
    ],
  },
  artwork: { type: ArtworkSchema, default: null },
  artworkComments: { type: [ArtworkCommentSchema], default: [] },
  creativeLink: { type: String, trim: true, default: '' },
  landingPage: { type: String, trim: true, default: '' },
});

// Per-state decision (offers by the Brand Manager, content by the Zonal Manager)
const ApprovalSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    remark: { type: String, trim: true },
    by: { type: ObjectId, ref: 'User' },
    at: { type: Date },
  },
  { _id: false }
);

const HistorySchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    by: { type: ObjectId, ref: 'User' },
    role: { type: String },
    event: { type: String, required: true },
    note: { type: String },
    remark: { type: String },
  },
  { _id: false }
);

const CampaignV2Schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    zone: { type: String, required: true, trim: true },
    month: { type: String, required: true, match: [MONTH_PATTERN, 'Month must be YYYY-MM'] },
    status: { type: String, enum: STATUS_KEYS, default: 'draft' },
    createdBy: { type: ObjectId, ref: 'User' },
    agency: { type: ObjectId, ref: 'User', default: null },
    agencyStatus: { type: String, trim: true, default: '' },
    handedTo: [{ type: ObjectId, ref: 'User' }],
    approvals: { type: Map, of: ApprovalSchema, default: {} },        // keyed by state name
    contentApprovals: { type: Map, of: ApprovalSchema, default: {} }, // keyed by state name
    offers: {
      type: [OfferSchema],
      default: [],
      // serials come from the global 'offerV2' counter, so they are also unique within the campaign
      validate: { validator: (v) => !hasDuplicates((v || []).map((o) => o.serial)), message: 'An offer serial is used twice in this campaign' },
    },
    history: { type: [HistorySchema], default: [] },
  },
  { timestamps: true, collection: 'campaigns_v2' }
);

CampaignV2Schema.index({ zone: 1, month: 1 });
CampaignV2Schema.index({ status: 1 });
CampaignV2Schema.index({ agency: 1 });
CampaignV2Schema.index({ handedTo: 1 });
CampaignV2Schema.index({ 'offers.serial': 1 });

export default mongoose.model('CampaignV2', CampaignV2Schema);
