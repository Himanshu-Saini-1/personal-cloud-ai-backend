// This is a stub to keep you moving fast.
// Replace internals with real API calls (Google Vision, Gemini, OpenAI) later.

import fs from "fs/promises";
import path from "path";

export async function analyzeFile({ filePath, mimeType }) {
  // TODO: Plug in real providers based on mimeType:
  // - image/*  -> Google Vision labels + OCR
  // - application/pdf or text/* -> OpenAI/Gemini summarize + keywords
  // - audio/video -> STT (optional)
  // For now, return simple heuristics so UI works end-to-end.

  const ext = path.extname(filePath).toLowerCase();
  const aiTags = new Set();

  if (mimeType?.startsWith("image/")) {
    aiTags.add("image");
    if ([".jpg", ".jpeg", ".png", ".webp", ".heic"].includes(ext))
      aiTags.add("photo");
  }
  if (mimeType?.includes("pdf")) aiTags.add("pdf");
  if (mimeType?.startsWith("text/")) aiTags.add("text");

  // super light "summary" stub:
  const summary = `Auto-tagged as: ${
    [...aiTags].join(", ") || "general file"
  }.`;

  // Optional: for text files, read a little sample
  let ocrText = undefined;
  try {
    if (mimeType?.startsWith("text/")) {
      const buf = await fs.readFile(filePath, "utf8");
      ocrText = buf.slice(0, 1000);
    }
  } catch {}

  return { aiTags: [...aiTags], summary, ocrText };
}
