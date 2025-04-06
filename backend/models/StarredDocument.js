import mongoose from "mongoose";

const StarredSchema = new mongoose.Schema({
    
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
  }, { timestamps: true });
  
  export default mongoose.model("StarredDocument", StarredSchema);
  