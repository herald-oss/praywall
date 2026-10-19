// The standalone server (`node .next/standalone/server.js`) doesn't include
// public/ or .next/static by default — without them CSS, JS and icons 404.
import { cpSync, existsSync } from "node:fs";

if (!existsSync(".next/standalone")) {
  console.error("No .next/standalone folder — is output: 'standalone' set?");
  process.exit(1);
}
cpSync("public", ".next/standalone/public", { recursive: true });
cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
console.log("Copied public/ and .next/static into .next/standalone.");
