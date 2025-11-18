import multer from "multer";
import path from "path";
import fs from "fs/promises";

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const userId = req.user?._id?.toString() || "anonymous";
      const base = path.join(process.cwd(), "storage", userId);
      await fs.mkdir(base, { recursive: true });
      cb(null, base);
    } catch (err) {
      cb(err, null);
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({ storage });
