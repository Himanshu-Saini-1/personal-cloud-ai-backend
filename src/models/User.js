import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, unique: true, required: true },
    email: { type: String, required: true },
    name: { type: String },
    pubKey: { type: String },
    encryptedPrivateKey: { type: String },
    privateKeyIv: { type: String },
  },
  { timestamps: true }
);

// hash password only if it's present
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model("User", userSchema);
