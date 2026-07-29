import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dotNext = path.join(projectRoot, ".next");

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function isJunction(target) {
  if (process.platform !== "win32" || !existsSync(target)) return false;
  try {
    const output = execSync(`cmd /c dir /AL "${path.dirname(target)}"`, {
      encoding: "utf8",
    });
    return output.includes(`<JUNCTION>     ${path.basename(target)}`);
  } catch {
    return false;
  }
}

function quarantineNextDir(target) {
  if (!existsSync(target)) return true;
  const backup = `${target}.bak.${Date.now()}`;
  try {
    if (process.platform === "win32") {
      execSync(`cmd /c move "${target}" "${backup}"`, { stdio: "pipe" });
    } else {
      execSync(`mv "${target}" "${backup}"`, { stdio: "pipe" });
    }
    console.log(`Moved locked cache ${target} -> ${backup}`);
    return true;
  } catch {
    return false;
  }
}

function removeWithRobocopy(target) {
  const emptyDir = path.join(os.tmpdir(), `next-clean-${Date.now()}`);
  mkdirSync(emptyDir, { recursive: true });
  try {
    execSync(`cmd /c robocopy "${emptyDir}" "${target}" /MIR /NFL /NDL /NJH /NJS /NC /NS`, {
      stdio: "pipe",
    });
    execSync(`cmd /c rmdir /s /q "${target}"`, { stdio: "pipe" });
    rmSync(emptyDir, { recursive: true, force: true });
    return !existsSync(target);
  } catch {
    try {
      rmSync(emptyDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
    return !existsSync(target);
  }
}

function removeNextDir(target, { retries = 4 } = {}) {
  if (!existsSync(target)) return true;

  if (isJunction(target)) {
    try {
      execSync(`cmd /c rmdir "${target}"`, { stdio: "pipe" });
      console.log(`Removed junction ${target}`);
      return !existsSync(target);
    } catch {
      return quarantineNextDir(target);
    }
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (process.platform === "win32") {
        execSync(`cmd /c rmdir /s /q "${target}"`, { stdio: "pipe" });
      } else {
        rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 });
      }

      if (!existsSync(target)) {
        console.log(`Removed ${target}`);
        return true;
      }
    } catch {
      if (attempt === retries && process.platform === "win32") {
        if (removeWithRobocopy(target)) {
          console.log(`Removed ${target} (robocopy)`);
          return true;
        }
        return quarantineNextDir(target);
      }
      sleep(500 * attempt);
    }
  }

  return !existsSync(target);
}

function cleanNextDir(target) {
  if (!existsSync(target)) return true;

  // OneDrive often locks individual files — renaming the folder is more reliable than delete.
  if (process.platform === "win32" && /OneDrive/i.test(target)) {
    if (quarantineNextDir(target)) return true;
  }

  if (removeNextDir(target)) return true;
  return quarantineNextDir(target);
}

const legacyExternal = path.join(
  process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"),
  "deep-hr-match",
  ".next"
);

let hadFailure = false;
for (const dir of [legacyExternal, dotNext]) {
  if (!cleanNextDir(dir)) {
    hadFailure = true;
  }
}

if (hadFailure) {
  console.warn(
    "Some cache folders are still locked. Close all dev terminals, pause OneDrive sync, then run: npm run clean"
  );
  process.exitCode = 1;
} else {
  console.log("Next.js cache cleared.");
}
