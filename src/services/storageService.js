import { s3Client } from "../config/minio.js";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Unified service wrapper around the MinIO S3 client.
 * Handles upload, download (with presigned URLs) and delete.
 * Works with both MinIO and AWS S3.
 */

export const storageService = {
  /**
   * Upload (PUT) an object to a bucket
   * @param {string} bucket  - Bucket name
   * @param {string} key     - Object key (path inside bucket)
   * @param {Buffer|Uint8Array|string} buffer - File contents
   * @param {string} [contentType]
   */
  async putObject(
    bucket,
    key,
    buffer,
    contentType = "application/octet-stream"
  ) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );
      console.log(`☁️  Uploaded to MinIO: ${bucket}/${key}`);
      return true;
    } catch (err) {
      console.error("❌ MinIO upload failed:", err.message);
      throw err;
    }
  },

  /**
   * Get (download) an object from the bucket.
   * Returns the raw stream.  Prefer presigned URLs for the frontend.
   */
  async getObject(bucket, key) {
    try {
      const response = await s3Client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
      );
      return response.Body;
    } catch (err) {
      console.error("❌ MinIO getObject failed:", err.message);
      throw err;
    }
  },

  /**
   * Generate a presigned URL valid for `expiresIn` seconds.
   * @param {string} bucket
   * @param {string} key
   * @param {number} expiresIn
   * @returns {Promise<string>}
   */
  async getPresignedUrl(bucket, key, expiresIn = 60) {
    try {
      const url = await getSignedUrl(
        s3Client,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn }
      );
      return url;
    } catch (err) {
      console.error("❌ Failed to generate presigned URL:", err.message);
      throw err;
    }
  },

  /**
   * Delete an object from the bucket.
   * @param {string} bucket
   * @param {string} key
   */
  async deleteObject(bucket, key) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: key })
      );
      console.log(`🗑️  Deleted ${bucket}/${key}`);
      return true;
    } catch (err) {
      console.error("❌ MinIO deleteObject failed:", err.message);
      throw err;
    }
  },

  /**
   * Check if an object exists in the bucket.
   * Returns true/false.
   */
  async exists(bucket, key) {
    try {
      await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return true;
    } catch (err) {
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404)
        return false;
      console.error("❌ MinIO headObject failed:", err.message);
      throw err;
    }
  },
};
