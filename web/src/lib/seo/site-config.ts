import { PUBLIC_IMAGES } from "@/lib/public-images";

export const SITE_NAME = "Belize Research Panel";

export const SITE_TAGLINE = "Earn rewards for sharing your opinions in Belize";

export const DEFAULT_DESCRIPTION =
  "Join the Belize Research Panel — qualified panelists earn rewards for public opinion polling, market research, and governance studies. Redeem points for cash, phone credit, utility credit, and more.";

export const SITE_LOCALE = "en_BZ";

export const TWITTER_HANDLE = process.env.NEXT_PUBLIC_TWITTER_HANDLE?.trim() || undefined;

/** Absolute site origin, no trailing slash. Set NEXT_PUBLIC_SITE_URL in production. */
export function getSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

export const DEFAULT_OG_IMAGE_PATH = PUBLIC_IMAGES.homeHero;

export const DEFAULT_OG_IMAGE = {
  url: DEFAULT_OG_IMAGE_PATH,
  width: 1200,
  height: 630,
  alt: "Belize Research Panel — research participants in Belize",
} as const;

/** Public marketing and policy pages included in the sitemap. */
export const PUBLIC_INDEXABLE_ROUTES: Array<{
  path: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/signup", changeFrequency: "monthly", priority: 0.9 },
  { path: "/login", changeFrequency: "monthly", priority: 0.8 },
  { path: "/help", changeFrequency: "monthly", priority: 0.7 },
  { path: "/site-policy", changeFrequency: "yearly", priority: 0.4 },
  { path: "/data-use-policy", changeFrequency: "yearly", priority: 0.4 },
];
