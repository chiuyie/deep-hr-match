import { execSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const isSyncedFolder = /OneDrive/i.test(projectRoot);
const useWebpack = process.argv.includes("--webpack");
const shouldClean = process.argv.includes("--clean");

function stopDevServers() {
  if (process.platform !== "win32") return;
  try {
    execSync(
      'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000,3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"',
      { stdio: "pipe" }
    );
  } catch {
    // No listeners on those ports.
  }
}

async function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: "inherit",
      shell: true,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

if (shouldClean) {
  stopDevServers();
  await new Promise((resolve) => setTimeout(resolve, 1500));
  try {
    await run("node", ["scripts/clean-next.mjs"]);
  } catch {
    console.warn(
      "Cache cleanup had issues. Close other dev terminals, pause OneDrive sync, then run: npm run clean"
    );
  }
}

const nextArgs = ["dev"];
if (useWebpack) {
  nextArgs.push("--webpack");
}

await run("npx", ["next", ...nextArgs]);
