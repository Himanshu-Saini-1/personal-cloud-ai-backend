import { s3Client, MINIO_BUCKET } from "../config/minio.js";
import multer from "multer";
import { storageService } from "../services/storageService.js";
import { File } from "../models/File.js";
import { v4 as uuid } from "uuid";
import {
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Multer setup (used only if you add multipart uploads later)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB
});

// ========== LIST FILES ==========
export const listFiles = async (req, res) => {
  try {
    const files = await File.find({ ownerUid: req.user.uid })
      .select(
        "_id isFolder parentId ownerUid storagePath nameEnc nameIv contentIv dekWrapped mimeType originalNameHint size createdAt updatedAt"
      )
      .lean();
    res.json(files);
  } catch (e) {
    res.status(500).json({ error: "Failed to list files", details: e.message });
  }
};

// ========== CREATE FOLDER ==========
export const createFolder = async (req, res) => {
  try {
    const { nameEnc, nameIv, parentId = null } = req.body;
    if (!nameEnc || !nameIv)
      return res.status(400).json({ error: "Missing encrypted name or IV" });

    const doc = await File.create({
      ownerUid: req.user.uid,
      isFolder: true,
      parentId,
      nameEnc,
      nameIv,
      storagePath: "",
    });

    res.status(201).json({ id: doc._id });
  } catch (err) {
    console.error("Create folder failed:", err);
    res.status(500).json({ error: "Create folder failed" });
  }
};

// ========== LIST CHILDREN ==========
export const listChildren = async (req, res) => {
  try {
    const { parentId = null } = req.query;
    const items = await File.find({
      ownerUid: req.user.uid,
      parentId: parentId || null,
    }).select("_id isFolder nameEnc nameIv size createdAt updatedAt");
    res.json(items);
  } catch (err) {
    console.error("List children failed:", err);
    res.status(500).json({ error: "List children failed" });
  }
};

// ========== RENAME ==========
export const renameNode = async (req, res) => {
  try {
    const { id } = req.params;
    const { nameEnc, nameIv } = req.body;
    const node = await File.findOne({ _id: id, ownerUid: req.user.uid });
    if (!node) return res.status(404).json({ error: "Not found" });

    node.nameEnc = nameEnc;
    node.nameIv = nameIv;
    await node.save();

    res.json({ message: "Renamed" });
  } catch (err) {
    console.error("Rename failed:", err);
    res.status(500).json({ error: "Rename failed" });
  }
};

// ======================================================
// ========== UPLOAD ENCRYPTED FILE (JSON FORMAT) ========
// ======================================================
export async function uploadEncrypted(req, res) {
  try {
    const ownerUid = req.user.uid;
    const {
      nameEnc,
      nameIv,
      contentIv,
      cipherBase64,
      dekWrappedForOwner,
      mimeType,
      size,
      originalNameHint,
      parentId = null,
    } = req.body;

    // Validate inputs
    if (!cipherBase64 || !contentIv || !nameEnc || !nameIv) {
      return res.status(400).json({ error: "Missing encryption fields" });
    }

    // Decode base64 → buffer
    const buffer = Buffer.from(cipherBase64, "base64");
    const fileKey = `files/${ownerUid}/${Date.now()}_${uuid()}`;

    // Upload to MinIO
    await storageService.putObject(
      process.env.MINIO_BUCKET || "mycloud",
      fileKey,
      buffer
    );

    // Create file record
    const newFile = new File({
      ownerUid,
      isFolder: false,
      parentId: parentId || null,
      storagePath: fileKey,
      nameEnc,
      nameIv,
      isEncrypted: true,
      dekWrapped: dekWrappedForOwner
        ? [{ forUid: ownerUid, wrapped: dekWrappedForOwner }]
        : [],
      contentIv,
      mimeType: mimeType || "application/octet-stream",
      size: size ? Number(size) : buffer.length,
      sha256: null,
      createdAt: new Date(),
    });

    await newFile.save();
    res.status(201).json({ fileId: newFile._id });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
}

export const downloadEncrypted = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await File.findOne({
      _id: id,
      ownerUid: req.user.uid,
      isFolder: false,
    });

    if (!doc) {
      return res.status(404).json({ error: "File not found or access denied" });
    }

    // Check MinIO storage
    try {
      await s3Client.send(
        new HeadObjectCommand({
          Bucket: MINIO_BUCKET,
          Key: doc.storagePath,
        })
      );
    } catch (err) {
      return res.status(410).json({ error: "File missing in MinIO" });
    }

    const url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: MINIO_BUCKET,
        Key: doc.storagePath,
      }),
      { expiresIn: 120 }
    );

    // 🔥 Return ALL required fields for frontend decryption
    res.json({
      // downloadUrl: url,
      fileId: doc._id,
      nameEnc: doc.nameEnc,
      nameIv: doc.nameIv,
      contentIv: doc.contentIv,
      mimeType: doc.mimeType,
      dekWrapped: doc.dekWrapped || [],
      ownerUid: doc.ownerUid,
      originalNameHint: doc.originalNameHint || null,
    });
  } catch (err) {
    console.error("Download failed:", err);
    res.status(500).json({ error: "Download failed", details: err.message });
  }
};

// ========== DELETE FILE / FOLDER ======================

export const deleteNode = async (req, res) => {
  try {
    const { id } = req.params;
    const node = await File.findOne({ _id: id, ownerUid: req.user.uid });
    if (!node) return res.status(404).json({ error: "Not found" });

    // If folder, ensure empty
    if (node.isFolder) {
      const children = await File.find({
        ownerUid: req.user.uid,
        parentId: node._id,
      });
      if (children.length)
        return res.status(400).json({ error: "Folder not empty" });
      await File.deleteOne({ _id: node._id });
      return res.json({ message: "Folder deleted" });
    }

    // If file, delete from MinIO
    if (node.storagePath) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: MINIO_BUCKET,
          Key: node.storagePath,
        })
      );
    }

    await File.deleteOne({ _id: node._id });
    res.json({ message: "File deleted" });
  } catch (err) {
    console.error("Delete failed:", err);
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
};

export const getRawEncryptedFile = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await File.findOne({
      _id: id,
      ownerUid: req.user.uid,
      isFolder: false,
    });

    if (!doc) {
      return res.status(404).json({ error: "File not found or access denied" });
    }

    const command = new GetObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: doc.storagePath,
    });

    const response = await s3Client.send(command);

    res.setHeader("Content-Type", "application/octet-stream");

    response.Body.pipe(res);
  } catch (err) {
    console.error("Raw download failed:", err);
    res.status(500).json({ error: "Failed to download raw encrypted file" });
  }
};
