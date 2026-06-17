#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../src");

const SKIP_DIRS = new Set(["node_modules", ".next"]);
const SKIP_FILES = new Set([
  path.join(ROOT, "lib/brand.ts"),
  path.join(ROOT, "lib/site-alerts.ts"),
  path.join(ROOT, "lib/site-controls.ts"),
  path.join(ROOT, "components/registration/form-ui.tsx"),
  path.join(ROOT, "components/home/HomePageClient.tsx"),
  path.join(ROOT, "components/auth/AuthPageShell.tsx"),
  path.join(ROOT, "components/SiteFooter.tsx"),
  path.join(ROOT, "components/shared/ViewLayoutToggle.tsx"),
  path.join(ROOT, "components/shared/SiteSelect.tsx"),
]);

/** Whole Tailwind tokens mapped to light + dark pairs. */
const REPLACEMENTS = [
  ["bg-white", "bg-white dark:bg-zinc-900"],
  ["bg-zinc-50", "bg-zinc-50 dark:bg-zinc-950"],
  ["bg-zinc-100", "bg-zinc-100 dark:bg-zinc-800"],
  ["border-zinc-100", "border-zinc-100 dark:border-zinc-800"],
  ["border-zinc-200", "border-zinc-200 dark:border-zinc-800"],
  ["border-teal-100", "border-teal-100 dark:border-teal-900/60"],
  ["text-zinc-900", "text-zinc-900 dark:text-zinc-100"],
  ["text-zinc-800", "text-zinc-800 dark:text-zinc-200"],
  ["text-zinc-700", "text-zinc-700 dark:text-zinc-300"],
  ["text-zinc-600", "text-zinc-600 dark:text-zinc-400"],
  ["text-zinc-500", "text-zinc-500 dark:text-zinc-400"],
  ["text-zinc-400", "text-zinc-400 dark:text-zinc-500"],
  ["text-teal-950", "text-teal-950 dark:text-teal-100"],
  ["text-teal-900", "text-teal-900 dark:text-teal-100"],
  ["text-teal-800", "text-teal-800 dark:text-teal-200"],
  ["hover:bg-zinc-50", "hover:bg-zinc-50 dark:hover:bg-zinc-800"],
  ["hover:bg-teal-50", "hover:bg-teal-50 dark:hover:bg-teal-900/40"],
  ["hover:border-teal-300", "hover:border-teal-300 dark:hover:border-teal-700"],
  ["disabled:bg-zinc-50", "disabled:bg-zinc-50 dark:disabled:bg-zinc-900"],
  ["ring-teal-200", "ring-teal-200 dark:ring-teal-900"],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function expandContent(content) {
  let next = content;
  for (const [token, pair] of REPLACEMENTS) {
    const darkToken = pair.split(" ").find((part) => part.startsWith("dark:"));
    if (!darkToken) continue;
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b(?!\\/)(?!\\s+${darkToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "g");
    next = next.replace(re, pair);
  }
  return next;
}

let changed = 0;
for (const file of walk(ROOT)) {
  if (SKIP_FILES.has(file)) continue;
  if (file.includes(`${path.sep}components${path.sep}theme${path.sep}`)) continue;
  const original = fs.readFileSync(file, "utf8");
  const updated = expandContent(original);
  if (updated !== original) {
    fs.writeFileSync(file, updated);
    changed += 1;
    console.log(path.relative(ROOT, file));
  }
}

console.log(`Updated ${changed} files.`);
