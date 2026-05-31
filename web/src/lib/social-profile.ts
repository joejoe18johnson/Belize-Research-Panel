export type SocialPlatform = "instagram" | "facebook" | "tiktok";

export interface SocialProfilePreviewResult {
  platform: SocialPlatform;
  handle: string;
  profileUrl: string;
  displayName: string;
  imageUrl: string | null;
  previewAvailable: boolean;
  message?: string;
}

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

export function getSocialPlatformLabel(platform: SocialPlatform): string {
  return PLATFORM_LABELS[platform];
}

function cleanHandle(value: string): string {
  return value.trim().replace(/^@+/, "").replace(/\/+$/, "");
}

function extractFromUrl(value: string, pattern: RegExp): string | null {
  const match = value.match(pattern);
  return match?.[1] ? cleanHandle(match[1]) : null;
}

export function resolveSocialProfileUrl(platform: SocialPlatform, rawValue: string): SocialProfilePreviewResult | null {
  const value = rawValue.trim();
  if (!value) return null;

  if (platform === "instagram") {
    const fromUrl = extractFromUrl(value, /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)/i);
    const handle = cleanHandle(fromUrl ?? value.split(/[/?#]/)[0]);
    if (!handle || !/^[A-Za-z0-9._]{1,30}$/.test(handle)) return null;
    return {
      platform,
      handle,
      profileUrl: `https://www.instagram.com/${handle}/`,
      displayName: handle,
      imageUrl: null,
      previewAvailable: false,
    };
  }

  if (platform === "tiktok") {
    const fromUrl = extractFromUrl(value, /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([A-Za-z0-9._]+)/i);
    const handle = cleanHandle(fromUrl ?? value);
    if (!handle || !/^[A-Za-z0-9._]{2,24}$/.test(handle)) return null;
    return {
      platform,
      handle,
      profileUrl: `https://www.tiktok.com/@${handle}`,
      displayName: handle,
      imageUrl: null,
      previewAvailable: false,
    };
  }

  if (/^https?:\/\//i.test(value) || value.includes("facebook.com") || value.includes("fb.com")) {
    const url = value.startsWith("http") ? value : `https://${value.replace(/^\/\//, "")}`;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, "");
      if (!["facebook.com", "fb.com", "m.facebook.com"].includes(host)) return null;
      const path = parsed.pathname.replace(/\/+$/, "") || "/";
      const segment = path.split("/").filter(Boolean)[0] ?? "profile";
      return {
        platform,
        handle: segment,
        profileUrl: parsed.toString(),
        displayName: segment.replace(/\./g, " "),
        imageUrl: null,
        previewAvailable: false,
      };
    } catch {
      return null;
    }
  }

  const handle = cleanHandle(value);
  if (!handle) return null;
  return {
    platform,
    handle,
    profileUrl: `https://www.facebook.com/${encodeURIComponent(handle)}`,
    displayName: handle,
    imageUrl: null,
    previewAvailable: false,
  };
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function extractMetaContent(html: string, key: string, attr: "property" | "name" = "property"): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${key}["'][^>]*>`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1].trim());
  }
  return null;
}

export function parseSocialDisplayName(platform: SocialPlatform, title: string | null, handle: string): string {
  if (!title) return handle;

  if (platform === "instagram") {
    const match = title.match(/^(.+?)\s*\(@/);
    if (match?.[1]) return match[1].trim();
    return title.replace(/\s*•.*$/u, "").trim() || handle;
  }

  if (platform === "tiktok") {
    const match = title.match(/^(.+?)\s*\(@/);
    if (match?.[1]) return match[1].trim();
    return title.replace(/\s*\|\s*TikTok.*$/i, "").trim() || handle;
  }

  return title.replace(/\s*\|\s*Facebook.*$/i, "").trim() || handle;
}

const ALLOWED_IMAGE_HOSTS = [
  "instagram.com",
  "cdninstagram.com",
  "fbcdn.net",
  "facebook.com",
  "tiktokcdn.com",
  "tiktokcdn-us.com",
  "tiktokcdn-eu.com",
  "muscdn.com",
];

export function isAllowedSocialImageUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return ALLOWED_IMAGE_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

export function enrichSocialPreview(
  base: SocialProfilePreviewResult,
  html: string
): SocialProfilePreviewResult {
  const ogTitle = extractMetaContent(html, "og:title") ?? extractMetaContent(html, "twitter:title", "name");
  const ogImage =
    extractMetaContent(html, "og:image") ??
    extractMetaContent(html, "og:image:url") ??
    extractMetaContent(html, "twitter:image", "name");

  const displayName = parseSocialDisplayName(base.platform, ogTitle, base.handle);
  const imageUrl = ogImage && isAllowedSocialImageUrl(ogImage) ? ogImage : null;

  return {
    ...base,
    displayName,
    imageUrl,
    previewAvailable: Boolean(ogTitle || imageUrl),
    message: ogTitle || imageUrl ? undefined : "We couldn't load a live preview. Please double-check your handle or link.",
  };
}
