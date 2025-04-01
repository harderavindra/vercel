import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String }, // Profile picture URL
    lastUpdatedAt: { type: Date }, // Timestamp for updates
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Update lastUpdatedAt only if something other than the password is modified
  if (this.isModified() && !this.isModified("password")) {
    this.lastUpdatedAt = new Date();
  }

  next();
});

// Ensure lastUpdatedAt updates on modifications
userSchema.pre("findOneAndUpdate", function (next) {
  this.set({ lastUpdatedAt: new Date() });
  next();
});

// Password comparison method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;