import mongoose from "mongoose";
import { FILE_TYPES } from "../constants/enums.js";
import ProductCategory from '../models/ProductCategory.js';
import BrandCategory from '../models/BrandCategory.js';
import ModelCategory from '../models/ModelCategory.js';
const BrandTreasurySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    documentType: { type: String, required: false, trim: true },

    // Dropdown Fields
    zone: { type: String, required: false, trim: true },
    state: { type: String, required: false, trim: true },
    language: { type: String, required: false, trim: true },

    contentType: { type: String, required: false, trim: true },
    comment: { type: String, required: false, trim: true },

    // Reference to Product, Brand, and Model
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', required: false },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandCategory', required: false },
    model: { type: mongoose.Schema.Types.ObjectId, ref: 'ModelCategory', required: false },

    description: { type: String, trim: false },
    thumbnailUrls: { type: [String], default: [] },
    // Single Attachment
    attachment: {},
    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    approved: { type: Boolean, default: false },

    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastUpdatedAt: { type: Date }
  },
  { timestamps: true }
);

// Auto-update lastUpdatedAt on modifications
BrandTreasurySchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdatedAt = new Date();
  }
  next();
});

BrandTreasurySchema.pre("findOneAndUpdate", function (next) {
  this.set({ lastUpdatedAt: new Date() });
  next();
});

export default mongoose.model("BrandTreasury", BrandTreasurySchema);
