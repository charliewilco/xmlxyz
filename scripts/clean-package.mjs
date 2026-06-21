import { rm } from "node:fs/promises";
import { join } from "node:path";

const distPath = join(process.cwd(), "dist");

await rm(distPath, { force: true, recursive: true });
console.log(`Removed ${distPath}`);
