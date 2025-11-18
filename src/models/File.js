import mongoose from "mongoose";

const SharingSchema = new mongoose.Schema(
  {
    toUid: { type: String, required: true },

    wrappedDekForRecipient: { type: String, required: true },
    alg: { type: String, default: "AES-GCM" },
    keyWrapAlg: { type: String, default: "RSA-OAEP-256" },
  },
  { _id: false }
);

const FileSchema = new mongoose.Schema(
  {
    ownerUid: { type: String, index: true, required: true },

    isFolder: { type: Boolean, default: false },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null,
    },

    storagePath: {
      type: String,
      required: function () {
        return !this.isFolder;
      },
    },
    nameEnc: { type: String, required: true },
    nameIv: { type: String, required: true },

    isEncrypted: { type: Boolean, default: true },
    dekWrapped: [
      {
        forUid: { type: String, required: true },
        wrapped: { type: String, required: true },
      },
    ],
    dekWrapAlg: { type: String, default: "AES-KW" },
    contentIv: { type: String },
    contentTag: { type: String },

    sizeBytes: { type: Number, default: 0 },
    mimeTypeStored: { type: String, default: "application/octet-stream" },
    sha256: { type: String },

    shares: { type: [SharingSchema], default: [] },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    keyVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const File = mongoose.model("File", FileSchema);
