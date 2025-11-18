import express from "express";
import morgan from "morgan";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import fileRoutes from "./routes/files.routes.js";
import { s3Client, MINIO_BUCKET } from "./config/minio.js";
import { CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://personal-cloud-frontend.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

(async () => {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: MINIO_BUCKET }));
    console.log(`☁️ Bucket "${MINIO_BUCKET}" already exists`);
  } catch {
    await s3Client.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }));
    console.log(`✅ Created new bucket "${MINIO_BUCKET}"`);
  }
})();

export default app;
