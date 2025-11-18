import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

export const MINIO_BUCKET = process.env.MINIO_BUCKET || "user-files";

export const s3Client = new S3Client({
  forcePathStyle: true, // required for MinIO
  region: "us-east-1",
  endpoint: process.env.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
});

// --- Ensure bucket exists ---
async function ensureBucketExists() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: MINIO_BUCKET }));
    console.log(`☁️ Bucket "${MINIO_BUCKET}" already exists`);
  } catch {
    await s3Client.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }));
    console.log(`🪣 Created bucket "${MINIO_BUCKET}"`);
  }
}

// Run once at startup
ensureBucketExists().catch((err) => {
  console.error("❌ Failed to ensure MinIO bucket:", err.message);
});
// src/config/minio.js
// import {
//   S3Client,
//   CreateBucketCommand,
//   HeadBucketCommand,
// } from "@aws-sdk/client-s3";

// export const MINIO_BUCKET = process.env.MINIO_BUCKET || "user-files";

// // --- CLEAN & SAFE ENDPOINT FIX ---
// let rawEndpoint = process.env.MINIO_ENDPOINT;

// // remove trailing slashes
// if (rawEndpoint.endsWith("/")) {
//   rawEndpoint = rawEndpoint.slice(0, -1);
// }

// // LOG IT (important!)
// console.log("👉 MINIO_ENDPOINT FROM ENV =", rawEndpoint);

// const endpointUrl = new URL(rawEndpoint);

// export const s3Client = new S3Client({
//   region: "us-east-1",
//   forcePathStyle: true,
//   endpoint: endpointUrl,
//   credentials: {
//     accessKeyId: process.env.MINIO_ACCESS_KEY,
//     secretAccessKey: process.env.MINIO_SECRET_KEY,
//   },
// });

// // --- Ensure bucket exists ---
// async function ensureBucketExists() {
//   try {
//     await s3Client.send(new HeadBucketCommand({ Bucket: MINIO_BUCKET }));
//     console.log(`☁️ Bucket "${MINIO_BUCKET}" already exists`);
//   } catch (err) {
//     console.log("⚠️ Bucket not found, creating…");
//     await s3Client.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }));
//     console.log(`🪣 Created bucket "${MINIO_BUCKET}"`);
//   }
// }

// ensureBucketExists().catch((err) => {
//   console.error("❌ Failed to ensure MinIO bucket:", err.message);
// });
