import { rgb, type RGB } from "pdf-lib";

/** Belize Research Panel brand palette (matches site teal theme). */
export const BRP_PDF_COLORS = {
  teal950: rgb(0.016, 0.184, 0.18),
  teal900: rgb(0.075, 0.306, 0.29),
  teal700: rgb(0.059, 0.463, 0.431),
  teal500: rgb(0.078, 0.722, 0.651),
  teal100: rgb(0.8, 0.984, 0.945),
  emerald700: rgb(0.016, 0.373, 0.275),
  white: rgb(1, 1, 1),
  zinc900: rgb(0.094, 0.094, 0.106),
  zinc700: rgb(0.247, 0.247, 0.275),
  zinc500: rgb(0.443, 0.443, 0.478),
  zinc200: rgb(0.898, 0.906, 0.922),
  zinc50: rgb(0.98, 0.98, 0.982),
  amber700: rgb(0.706, 0.325, 0.035),
  red700: rgb(0.733, 0.11, 0.157),
} as const satisfies Record<string, RGB>;

export const BRP_PDF_PAGE = {
  width: 595.28,
  height: 841.89,
  marginX: 48,
  marginTop: 112,
  marginBottom: 64,
  headerHeight: 88,
} as const;
