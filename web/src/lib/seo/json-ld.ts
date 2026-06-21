import type { SupportFaqItem } from "@/lib/support-contact";
import { DEFAULT_DESCRIPTION, SITE_NAME, absoluteUrl, getSiteUrl } from "./site-config";

export type JsonLdObject = Record<string, unknown>;

export function organizationJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl(),
    logo: absoluteUrl("/images/BRP-Logo-01.png"),
    description: DEFAULT_DESCRIPTION,
    areaServed: {
      "@type": "Country",
      name: "Belize",
    },
  };
}

export function webSiteJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: getSiteUrl(),
    description: DEFAULT_DESCRIPTION,
    inLanguage: "en-BZ",
  };
}

export function webPageJsonLd(input: {
  path: string;
  title: string;
  description: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: getSiteUrl(),
    },
  };
}

export function faqPageJsonLd(items: SupportFaqItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
