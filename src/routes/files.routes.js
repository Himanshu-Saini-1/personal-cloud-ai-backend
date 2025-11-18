import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  listFiles,
  createFolder,
  listChildren,
  renameNode,
  deleteNode,
  uploadEncrypted,
  downloadEncrypted,
  getRawEncryptedFile,
} from "../controllers/files.controller.js";
import { shareFile } from "../controllers/share.controller.js";

const r = Router();

r.get("/", auth, listFiles);
r.post("/folders", auth, createFolder);
r.get("/children", auth, listChildren);
r.patch("/:id/rename", auth, renameNode);
r.delete("/:id", auth, deleteNode);

r.post("/upload", auth, uploadEncrypted);
r.get("/download/:id", auth, downloadEncrypted);
r.post("/share", auth, shareFile);
r.get("/raw/:id", auth, getRawEncryptedFile);

export default r;
