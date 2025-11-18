import { Router } from "express";
import { lookupByEmail } from "../controllers/auth.controller.js";
import {
  signup,
  login,
  getProfile,
  deleteProfile,
  forgotPassword,
  verifyToken,
  publishPubKey,
  getPubKeyByUid,
  me,
  getKeys,
  saveKeys,
} from "../controllers/auth.controller.js";
import { auth } from "../middleware/auth.js";

const r = Router();
r.post("/signup", signup);
r.post("/login", login);

r.get("/profile", auth, getProfile);
r.delete("/profile", auth, deleteProfile);
r.post("/forgot-password", forgotPassword);
r.get("/verify", verifyToken);
r.post("/pubkey", auth, publishPubKey);
r.get("/keys", auth, getKeys);
r.post("/keys", auth, saveKeys);
// r.get("/:uid/pubkey", auth, getPubKey);
r.get("/pubkey/:uid", auth, getPubKeyByUid);

r.get("/me", auth, me);
r.get("/lookup", auth, lookupByEmail);
export default r;
