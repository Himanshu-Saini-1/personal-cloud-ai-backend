import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

async function main() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`🚀 API listening on ${env.PORT}`);
  });
}

main().catch((e) => {
  console.error("Fatal startup error:", e);
  process.exit(1);
});
