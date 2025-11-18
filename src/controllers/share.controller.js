// share controller snippet (can live inside files.controller.js)
import { File } from "../models/File.js";
import { User } from "../models/User.js";

/**
 * POST /api/files/share
 * body: { fileId, forUid, wrappedDek }   // wrappedDek is base64 string
 * auth protected (req.user.uid must equal ownerUid OR you allow owner only)
 */
export async function shareFile(req, res) {
  try {
    const ownerUid = req.user?.uid;
    const { fileId, forUid, wrappedDek } = req.body;
    if (!ownerUid) return res.status(401).json({ error: "Unauthorized" });
    if (!fileId || !forUid || !wrappedDek)
      return res.status(400).json({ error: "Missing params" });

    // check file exists and caller is owner (or allowed)
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ error: "File not found" });
    if (file.ownerUid !== ownerUid)
      return res.status(403).json({ error: "Only owner can share" });

    // optional: verify target user exists
    const u = await User.findOne({ uid: forUid }).select("uid pubKey");
    if (!u || !u.pubKey)
      return res
        .status(404)
        .json({ error: "Recipient not found or has no pubKey" });

    // append wrapped DEK entry
    file.dekWrapped = file.dekWrapped || [];
    // allow multiple entries for different users (or replace existing for same forUid)
    const exists = file.dekWrapped.find((e) => e.forUid === forUid);
    if (exists) {
      exists.wrapped = wrappedDek; // update
    } else {
      file.dekWrapped.push({ forUid, wrapped: wrappedDek });
    }

    await file.save();
    return res.json({ ok: true, fileId: file._id });
  } catch (err) {
    console.error("shareFile failed:", err.stack || err);
    return res
      .status(500)
      .json({ error: "Server error", details: err.message });
  }
}
