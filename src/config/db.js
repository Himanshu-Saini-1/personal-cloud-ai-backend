import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGO_URI, { dbName: "personal_cloud_ai" });
  console.log("✅ MongoDB connected");
}
