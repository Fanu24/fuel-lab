import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const wranglerCli = fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url));
const result = spawnSync(
  process.execPath,
  [wranglerCli, "pages", "deploy", "out", "--project-name", "fuelchef", "--branch", "main"],
  {
    stdio: "inherit",
    env: process.env,
  },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
