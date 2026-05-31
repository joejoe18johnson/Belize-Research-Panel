import { NextRequest, NextResponse } from "next/server";
import {
  enrichSocialPreview,
  resolveSocialProfileUrl,
  type SocialPlatform,
} from "@/lib/social-profile";

const PLATFORMS = new Set<SocialPlatform>(["instagram", "facebook", "tiktok"]);

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "en-US,en;q=0.9",
};

export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get("platform") as SocialPlatform | null;
  const value = request.nextUrl.searchParams.get("value") ?? "";

  if (!platform || !PLATFORMS.has(platform)) {
    return NextResponse.json({ error: "Invalid platform." }, { status: 400 });
  }

  const base = resolveSocialProfileUrl(platform, value);
  if (!base) {
    return NextResponse.json({ error: "Enter a valid username or profile link." }, { status: 400 });
  }

  try {
    const response = await fetch(base.profileUrl, {
      headers: FETCH_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return NextResponse.json({
        ...base,
        message: "We couldn't load a live preview. Please double-check your handle or link.",
      });
    }

    const html = await response.text();
    const preview = enrichSocialPreview(base, html);
    return NextResponse.json(preview);
  } catch {
    return NextResponse.json({
      ...base,
      message: "We couldn't load a live preview. Please double-check your handle or link.",
    });
  }
}
