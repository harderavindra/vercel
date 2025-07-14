import mongoose from "mongoose";

// Subdocument Schema for Status History
const StatusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
  comment: { type: String },
  attachment: { type: String } // URL or file reference
});

// Subdocument Schema for Decision History
const DecisionHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
  comment: { type: String },
  attachment: { type: String } // URL or file reference
});

// Main Champaign Schema
const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },


    typeOfCampaign: { type: String, required: true }, // Replaces 'typeOfArtwork'
    campaignDetails: { type: String }, // Replaces 'otherDetails'

    attachment: {}, // You can define this explicitly if needed
    offerDetails: { type: String },
    zone: { type: String },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    designAssignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    publishAssignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
designAssignedAt: Date,
  publishAssignedAt: Date,
    statusHistory: [StatusHistorySchema],
    decisionHistory: [DecisionHistorySchema],

    dueDate: { type: Date, required: true },

    finalStatus: { type: String, default: "pending" }
  },
  { timestamps: true }
);

// Indexes for optimized queries
campaignSchema.index({ finalStatus: 1 });
campaignSchema.index({ assignedTo: 1 });

// Export model
const Campaign = mongoose.model("Campaign", campaignSchema);
export default Campaign;
