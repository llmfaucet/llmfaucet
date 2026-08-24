import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf8");

const worker = read("src/index.ts");
const metrics = read("src/lib/public-metrics.ts");
const preferences = read("src/preferences.ts");

for (const route of [
  "/api/public/github",
  "/api/public/metrics",
  "/account/preferences",
  "/account/onboarding/complete",
  "/account/onboarding/dismiss",
  "/account/onboarding/replay",
]) {
  if (!worker.includes(route)) throw new Error(`Missing route contract: ${route}`);
}

for (const token of ["public:github:repository", "public:metrics", "GITHUB_PUBLIC_READ_TOKEN"]) {
  if (!metrics.includes(token)) throw new Error(`Missing metrics contract: ${token}`);
}

for (const token of ["user_preferences", "default_model_selector", "onboarding_completed_at"]) {
  if (!preferences.includes(token)) throw new Error(`Missing preferences contract: ${token}`);
}

const migration = read("migrations/0008_user_preferences.sql");
if (!migration.includes("CREATE TABLE IF NOT EXISTS user_preferences")) {
  throw new Error("User preferences migration is missing");
}

console.log("product component contracts: ok");
