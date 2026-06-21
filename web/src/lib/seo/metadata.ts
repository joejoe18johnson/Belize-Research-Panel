import type { Metadata } from "next";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_TAGLINE,
  TWITTER_HANDLE,
  absoluteUrl,
  getSiteUrl,
} from "./site-config";

export const PRIVATE_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
  },
};

export const PUBLIC_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

export interface PageMetadataInput {
  title: string;
  description?: string;
  path?: string;
  robots?: Metadata["robots"];
  openGraphType?: "website" | "article";
  keywords?: string[];
  noIndex?: boolean;
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const description = input.description?.trim() || DEFAULT_DESCRIPTION;
  const canonicalPath = input.path ?? "/";
  const canonical = absoluteUrl(canonicalPath);
  const robots = input.noIndex ? PRIVATE_ROBOTS : (input.robots ?? PUBLIC_ROBOTS);
  const ogImageUrl = absoluteUrl(DEFAULT_OG_IMAGE.url);

  const metadata: Metadata = {
    title: input.title,
    description,
    keywords: input.keywords,
    alternates: {
      canonical,
    },
    robots,
    openGraph: {
      type: input.openGraphType ?? "website",
      locale: "en_BZ",
      url: canonical,
      siteName: SITE_NAME,
      title: input.title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: DEFAULT_OG_IMAGE.width,
          height: DEFAULT_OG_IMAGE.height,
          alt: DEFAULT_OG_IMAGE.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description,
      images: [ogImageUrl],
      ...(TWITTER_HANDLE ? { site: TWITTER_HANDLE, creator: TWITTER_HANDLE } : {}),
    },
  };

  return metadata;
}

export function rootMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const ogImageUrl = absoluteUrl(DEFAULT_OG_IMAGE.url);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${SITE_NAME} — ${SITE_TAGLINE}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "research",
    keywords: [
      "Belize research panel",
      "paid surveys Belize",
      "market research Belize",
      "public opinion polling Belize",
      "panelist rewards",
      "Belize civic research",
    ],
    alternates: {
      canonical: siteUrl,
    },
    robots: PUBLIC_ROBOTS,
    openGraph: {
      type: "website",
      locale: "en_BZ",
      url: siteUrl,
      siteName: SITE_NAME,
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: DEFAULT_DESCRIPTION,
      images: [
        {
          url: ogImageUrl,
          width: DEFAULT_OG_IMAGE.width,
          height: DEFAULT_OG_IMAGE.height,
          alt: DEFAULT_OG_IMAGE.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: DEFAULT_DESCRIPTION,
      images: [ogImageUrl],
      ...(TWITTER_HANDLE ? { site: TWITTER_HANDLE, creator: TWITTER_HANDLE } : {}),
    },
    icons: {
      icon: [{ url: "/images/BRP-Logo-01.png", type: "image/png" }],
      apple: [{ url: "/images/BRP-Logo-01.png", type: "image/png" }],
    },
  };
}

export function privateAreaMetadata(title: string): Metadata {
  return buildPageMetadata({
    title,
    description: `${SITE_NAME} member area.`,
    noIndex: true,
  });
}
