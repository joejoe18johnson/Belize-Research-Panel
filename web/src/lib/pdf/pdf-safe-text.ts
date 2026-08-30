/** Characters Helvetica / WinAnsi can draw beyond ASCII and Latin-1. */
const WINANSI_EXTRAS = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152,
  0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a,
  0x0153, 0x017e, 0x0178,
]);

const CHAR_REPLACEMENTS: Record<string, string> = {
  "\u2192": " to ",
  "\u2190": " from ",
  "\u21d2": " to ",
  "\u21d0": " from ",
  "\u2794": " to ",
  "\u279c": " to ",
  "\u00d7": "x",
  "\u00f7": "/",
  "\u2264": "<=",
  "\u2265": ">=",
  "\u00b1": "+/-",
  "\u2212": "-",
  "\u2011": "-",
  "\u221e": "inf",
  "\u2022": "-",
  "\u00b7": "-",
  "\u00a0": " ",
  "\u202f": " ",
  "\u2007": " ",
  "\u2009": " ",
  "\u200a": " ",
  "\u200b": "",
  "\u2060": "",
  "\ufeff": "",
};

function isWinAnsiCode(code: number): boolean {
  if (code >= 0x20 && code <= 0x7e) return true;
  if (code >= 0xa0 && code <= 0xff) return true;
  return WINANSI_EXTRAS.has(code);
}

/** Strip or replace characters that crash pdf-lib Helvetica (WinAnsi) drawing. */
export function pdfSafeText(value: unknown): string {
  const raw = String(value ?? "")
    .replace(/\r\n|\r|\n/g, " ")
    .replace(/\t/g, " ");

  let out = "";
  for (const char of raw) {
    if (CHAR_REPLACEMENTS[char] !== undefined) {
      out += CHAR_REPLACEMENTS[char];
      continue;
    }
    const code = char.codePointAt(0) ?? 0;
    if (isWinAnsiCode(code)) {
      out += char;
      continue;
    }
    out += code > 0x7e ? "?" : "";
  }

  return out.replace(/[ ]{2,}/g, " ").trim();
}
