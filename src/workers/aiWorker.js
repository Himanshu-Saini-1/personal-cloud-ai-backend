import { Worker } from "../config/redis.js";
import { aiQueue } from "../services/queue.js";
import { analyzeFile } from "../services/aiService.js";
import { File } from "../models/File.js";

console.log("🧠 AI Worker starting...");

new Worker(aiQueue.name, async (job) => {
  const { fileId, filePath, mimeType } = job.data;
  const analysis = await analyzeFile({ filePath, mimeType });

  await File.findByIdAndUpdate(
    fileId,
    {
      $set: {
        aiTags: analysis.aiTags || [],
        summary: analysis.summary || null,
        ocrText: analysis.ocrText || null,
      },
    },
    { new: true }
  );

  return { ok: true };
});
