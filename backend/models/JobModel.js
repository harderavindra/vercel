import mongoose from "mongoose";


// const DECISION_STATUS = ["Created", "Request Approved", "Assigned", "Artwork Approved", "Rejected", "Resubmitted"];

// Subdocument Schema for Status History
const StatusHistorySchema = new mongoose.Schema({
  status: { type: String,  required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
  comment: { type: String },
  attachment: { type: String }// File URLs
});

// Subdocument Schema for Decision History
const DecisionHistorySchema = new mongoose.Schema({
  status: { type: String,  required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
  comment: { type: String },
  attachment: {type: String }
});

// Main Job Schema
const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"], // Only these values allowed
      required: true,
      lowercase: true, // Ensures stored value is always lowercase
    },
    typeOfArtwork: { type: String, required: true },
    offerType: { type: String, required: true },
    zone: { type: String, required: true },
    state: { type: String, required: true },
    language: [{ type: String, required: true }],
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', required: false },
    brand: {type: mongoose.Schema.Types.ObjectId, ref: 'BrandCategory', required: false  },
    model: {type: mongoose.Schema.Types.ObjectId, ref: 'ModelCategory', required: false },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
        brand: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandCategory', required: true },
        model: { type: mongoose.Schema.Types.ObjectId, ref: 'ModelCategory', required: true },
      }
    ],

    attachment:{},
    offerDetails: { type: String },
    otherDetails: { type: String },
    createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // User assigned to the job

    // Using separate collections for tracking status & decisions
    statusHistory: [StatusHistorySchema],
    decisionHistory: [DecisionHistorySchema],
    dueDate: { type: Date, required: true }, 

    finalStatus: { type: String,  default: "pending" }
  },
  { timestamps: true }
);

// Indexing for faster queries
jobSchema.index({ finalStatus: 1 });
jobSchema.index({ assignedTo: 1 });

const Job = mongoose.model("Job", jobSchema);
export default Job;