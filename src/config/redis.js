import pkg from "bullmq";
import IORedis from "ioredis";
import { env } from "./env.js";
const { Queue, Worker } = pkg;
export const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export function createQueue(name) {
  const queue = new Queue(name, { connection });
  return queue;
}

export { Queue, Worker };
