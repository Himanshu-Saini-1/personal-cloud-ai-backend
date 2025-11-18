import { createQueue } from "../config/redis.js";

export const aiQueue = createQueue("ai-analyze");

export async function enqueueAIAnalysis(payload) {
  // payload: { fileId, filePath, mimeType }
  return aiQueue.add("analyze", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
    removeOnFail: false,
  });
}
