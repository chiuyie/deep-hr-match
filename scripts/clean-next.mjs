import { rmSync, existsSync, lstatSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import os from "os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const dotNext = path.join(projectRoot, ".next");

function removeNextDir(target) {
  if (!existsSync(target)) return;

  if (process.platform === "win32") {
    try {
      const output = execSync(`cmd /c dir /AL "${path.dirname(target)}"`, {
        encoding: "utf8",
      });
      if (output.includes(`<JUNCTION>     ${path.basename(target)}`)) {
        execSync(`cmd /c rmdir "${target}"`, { stdio: "pipe" });
        console.log(`Removed junction ${target}`);
        return;
      }
    } catch {
      // Fall through to recursive delete.
    }
  }

  rmSync(target, { recursive: true, force: true });
  console.log(`Removed ${target}`);
}

removeNextDir(dotNext);

const localNext = path.join(
  process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"),
  "deep-hr-match",
  ".next"
);
removeNextDir(localNext);

console.log("Next.js cache cleared.");
