import mongoose from "mongoose";

const shortUrlSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  originalUrl: { type: String, required: true },
  fileName: { type: String, required: false },
  createdAt: { type: Date, default: Date.now, expires: "30d" } // auto delete after 30 days
});

export default mongoose.model("ShortUrl", shortUrlSchema);
