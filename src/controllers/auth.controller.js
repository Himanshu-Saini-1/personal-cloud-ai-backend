import admin from "../config/firebaseAdmin.js";
import { User } from "../models/User.js";

export async function lookupByEmail(req, res) {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Missing email" });
    const user = await User.findOne({ email }).select("uid email pubKey");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ uid: user.uid, email: user.email, pubKey: user.pubKey });
  } catch (err) {
    console.error("lookupByEmail failed:", err.stack || err);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function publishPubKey(req, res) {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: "Unauthorized" });

  const { pubKey, encryptedPrivateKey, privateKeyIv, email, name } = req.body;
  if (!pubKey || !encryptedPrivateKey || !privateKeyIv) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const u = await User.findOneAndUpdate(
      { uid },
      {
        uid,
        email: email || req.user.email || null,
        name: name || req.user.name || null,
        pubKey,
        encryptedPrivateKey,
        privateKeyIv,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ ok: true, uid: u.uid });
  } catch (err) {
    console.error("publishPubKey failed:", err);
    return res
      .status(500)
      .json({ error: "Server error", details: err.message });
  }
}

export async function saveKeys(req, res) {
  try {
    const uid = req.user.uid;
    const { encryptedPrivateKey } = req.body;

    if (!encryptedPrivateKey)
      return res.status(400).json({ error: "Missing encryptedPrivateKey" });

    const updated = await User.findOneAndUpdate(
      { uid },
      { encryptedPrivateKey },
      { upsert: true, new: true }
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("saveKeys error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
// --- Retrieve another user's public key ---
export async function getKeys(req, res) {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: "Unauthorized" });

  try {
    const u = await User.findOne({ uid }).select(
      "pubKey encryptedPrivateKey privateKeyIv"
    );
    if (!u)
      return res.json({
        pubKey: null,
        encryptedPrivateKey: null,
        privateKeyIv: null,
      });

    return res.json({
      pubKey: u.pubKey || null,
      encryptedPrivateKey: u.encryptedPrivateKey || null,
      privateKeyIv: u.privateKeyIv || null,
    });
  } catch (err) {
    console.error("getKeys failed:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function getPubKeyByUid(req, res) {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ pubKey: user.pubKey || null });
  } catch (err) {
    console.error("getPubKeyByUid error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function me(req, res) {
  res.json({ uid: req.user.uid, email: req.user.email });
}
export async function signup(req, res) {
  try {
    const { idToken, name } = req.body;

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    res.json({
      message: "Signup successful",
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: name,
      },
    });
  } catch (e) {
    res.status(500).json({ error: "Signup failed", details: e.message });
  }
}

export async function login(req, res) {
  try {
    const { idToken } = req.body;

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    res.json({
      message: "Login successful",
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
      },
    });
  } catch (e) {
    res.status(500).json({ error: "Login failed", details: e.message });
  }
}

export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      email: user.email,
      uid: user.uid,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch profile", details: err.message });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const userId = req.user.uid;

    await admin.auth().deleteUser(userId);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete user", details: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const resetLink = await admin.auth().generatePasswordResetLink(email);

    return res.json({
      message: "Password reset link generated",
      resetLink,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error generating password reset link",
      error: error.message,
    });
  }
};

export const verifyToken = async (req, res) => {
  const idToken = req.headers.authorization?.split(" ")[1];
  if (!idToken) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return res.json({ uid: decodedToken.uid, email: decodedToken.email });
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
