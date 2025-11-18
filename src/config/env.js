import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: process.env.PORT || 4000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  SHARE_JWT_SECRET: process.env.SHARE_JWT_SECRET,
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  BASE_URL: process.env.BASE_URL || "http://localhost:4000",
  FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
};
