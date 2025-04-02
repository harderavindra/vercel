import mongoose from "mongoose";

// Enum for job statuses and decisions
const JOB_STATUS = ["Inprogress", "Hold", "Submited"];
const DECISION_STATUS = ["Created", "Approved", "Assigned", "Completed", "Rejected", "Resubmitted"];
// const DECISION_STATUS = ["Created", "Request Approved", "Assigned", "Artwork Approved", "Rejected", "Resubmitted"];

// Subdocument Schema for Status History
const StatusHistorySchema = new mongoose.Schema({
  status: { type: String, enum: JOB_STATUS, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
  comment: { type: String },
  attachment: { type: String }// File URLs
});

// Subdocument Schema for Decision History
const DecisionHistorySchema = new mongoose.Schema({
  status: { type: String, enum: DECISION_STATUS, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
  comment: { type: String },
  attachment: {type: String }
});

// Main Job Schema
const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"], // Only these values allowed
      required: true,
      lowercase: true, // Ensures stored value is always lowercase
    },
    offerType: { type: String, required: true },
    zone: { type: String, required: true },
    state: { type: String, required: true },
    language: { type: String, required: true },
    product: { type: String, required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    attachment:{},
    offerDetails: { type: String },
    otherDetails: { type: String },
    createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // User assigned to the job

    // Using separate collections for tracking status & decisions
    statusHistory: [StatusHistorySchema],
    decisionHistory: [DecisionHistorySchema],
    dueDate: { type: Date, required: true }, 

    finalStatus: { type: String, enum: ["Created", "Approved", "Assigned", "Completed", "Rejected", "Resubmitted","Inprogress", "Hold", "Submited","Pending"], default: "Pending" }
  },
  { timestamps: true }
);

// Indexing for faster queries
jobSchema.index({ finalStatus: 1 });
jobSchema.index({ assignedTo: 1 });

const Job = mongoose.model("Job", jobSchema);
export default Job;