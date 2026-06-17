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

function shouldPreserveWord(word: string): boolean {
  if (/^[A-Z]{2,}$/.test(word)) return true;
  if (/[0-9$@/()—–-]/.test(word)) return true;
  return false;
}

function capitalizeWord(word: string): string {
  if (!word) return word;
  if (shouldPreserveWord(word)) return word;

  if (word.includes("'")) {
    const [head, ...tail] = word.split("'");
    return [capitalizeWord(head), ...tail.map((part) => part.toLowerCase())].join("'");
  }

  if (word.includes("-")) {
    return word.split("-").map((part) => capitalizeWord(part)).join("-");
  }

  const stripped = word.replace(/[.,!?;:]+$/, "");
  const suffix = word.slice(stripped.length);
  if (!stripped) return word;
  if (shouldPreserveWord(stripped)) return word;

  return stripped.charAt(0).toUpperCase() + stripped.slice(1).toLowerCase() + suffix;
}

/** Headings and labels: title case (keep acronyms, codes, and minor words mid-phrase lowercase). */
export function formatHeadingCase(value: string): string {
  const cleaned = cleanText(value);
  if (!cleaned) return cleaned;

  const words = cleaned.split(/\s+/);
  const lastIndex = words.length - 1;

  return words
    .map((word, index) => {
      if (shouldPreserveWord(word)) return word;

      const lower = word.toLowerCase().replace(/[.,!?;:]+$/, "");
      if (index > 0 && index < lastIndex && MINOR_WORDS.has(lower)) {
        return word.toLowerCase();
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
