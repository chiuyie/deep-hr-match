import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Starts a production Next server for Playwright with PAYMENTS_MODE=mock.
 * Avoids Next.js "another next dev is already running" lock when :3000 is busy.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const port = process.env.E2E_PORT?.trim() || "3001";
const buildId = path.join(root, ".next", "BUILD_ID");

async function run(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

if (!existsSync(buildId) || process.env.E2E_FORCE_BUILD === "1") {
  console.log("e2e-webserver: building Next app…");
  await run("npx", ["next", "build"]);
}

console.log(`e2e-webserver: starting next start on :${port} (PAYMENTS_MODE=mock)`);
await run("npx", ["next", "start", "--port", port], {
  ...process.env,
  PORT: port,
  PAYMENTS_MODE: "mock",
});
