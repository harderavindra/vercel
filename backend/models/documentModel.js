import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  documentType: { type: String, trim: true },
  contentType: { type: String, trim: true },

  zone: { type: String, trim: true },
  state: { type: String, trim: true },
  language: { type: String, trim: true },

  product: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCategory" },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: "BrandCategory" },
  model: { type: mongoose.Schema.Types.ObjectId, ref: "ModelCategory" },

  fileUrl: String,
  status: { type: String, enum: ["uploading", "done", "error"], default: "uploading" },
  originalName: String, // Stores original filename
  mimeType: String, // Stores file type (e.g., PDF, PNG)
  size: Number, // File size in bytes
  storagePath: String, // Path in Google Cloud Storage
  progress: { type: Number, default: 0 }, // Track upload progress
  thumbnailUrls: { type: [String], default: [] }, 
  uploadedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approved: { type: Boolean, default:false },
  approvedBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"  },
  approvedAt: {type: Date },
  comment: { type: String, default: "" },


}, { timestamps: true });

const Document = mongoose.model("Document", documentSchema);
export default Document;
