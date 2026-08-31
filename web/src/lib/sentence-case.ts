import type { ReactNode } from "react";
import { cleanText } from "./validation";

const MINOR_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "but",
  "or",
  "nor",
  "for",
  "yet",
  "so",
  "as",
  "at",
  "by",
  "in",
  "of",
  "on",
  "to",
  "up",
  "via",
  "vs",
  "per",
  "from",
  "with",
]);

const LEADING_WRAP = `"'“”‘’([{`;
const TRAILING_WRAP = `.,!?;:"'“”‘’)]}`;

function splitAffixes(word: string): { lead: string; core: string; trail: string } {
  let start = 0;
  let end = word.length;
  while (start < end && LEADING_WRAP.includes(word[start] ?? "")) start += 1;
  while (end > start && TRAILING_WRAP.includes(word[end - 1] ?? "")) end -= 1;
  return {
    lead: word.slice(0, start),
    core: word.slice(start, end),
    trail: word.slice(end),
  };
}

function shouldPreserveWord(word: string): boolean {
  if (/^[A-Z]{2,}$/.test(word)) return true;
  if (/[0-9$@/()—–-]/.test(word)) return true;
  return false;
}

function capitalizeCore(word: string): string {
  if (!word) return word;
  if (shouldPreserveWord(word)) return word;

  if (word.includes("'")) {
    const [head, ...tail] = word.split("'");
    return [capitalizeCore(head), ...tail.map((part) => part.toLowerCase())].join("'");
  }

  if (word.includes("-")) {
    return word.split("-").map((part) => capitalizeCore(part)).join("-");
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function capitalizeWord(word: string): string {
  if (!word) return word;
  const { lead, core, trail } = splitAffixes(word);
  if (!core) return word;
  return lead + capitalizeCore(core) + trail;
}

/** Question and form labels: first letter capital, rest kept as written. */
export function formatSentenceCase(value: string): string {
  const cleaned = cleanText(value);
  if (!cleaned) return cleaned;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Headings and labels: title case (keep acronyms, codes, and minor words mid-phrase lowercase). */
export function formatHeadingCase(value: string): string {
  const cleaned = cleanText(value);
  if (!cleaned) return cleaned;

  const words = cleaned.split(/\s+/);
  const lastIndex = words.length - 1;

  return words
    .map((word, index) => {
      const { lead, core, trail } = splitAffixes(word);
      if (!core) return word;
      if (shouldPreserveWord(core)) return word;

      const lower = core.toLowerCase();
      if (index > 0 && index < lastIndex && MINOR_WORDS.has(lower)) {
        return lead + lower + trail;
      }

      return capitalizeWord(word);
    })
    .join(" ");
}

export const formatTitleCase = formatHeadingCase;

/** Site-wide label and body copy — same title-case rules as headings. */
export const formatSiteCase = formatHeadingCase;

export function formatHeadingChildren(children: ReactNode): ReactNode {
  if (typeof children === "string") return formatHeadingCase(children);
  return children;
}

/** Admin console labels, table values, chart rows, and badges. */
export const formatAdminLabel = formatHeadingCase;

export function formatSiteText(children: ReactNode): ReactNode {
  if (typeof children === "string") return formatSiteCase(children);
  if (typeof children === "number" || typeof children === "boolean") return children;
  if (children == null) return children;
  if (Array.isArray(children)) {
    // Mixed fragments lose boundary spaces if each string is trimmed by formatSiteCase.
    return children.map((child) => {
      if (typeof child === "string" || typeof child === "number" || typeof child === "boolean") return child;
      if (child == null) return null;
      return formatSiteText(child);
    });
  }
  return children;
}
