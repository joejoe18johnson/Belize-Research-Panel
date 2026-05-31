import { NextRequest, NextResponse } from "next/server";
import { isAllowedSocialImageUrl } from "@/lib/social-profile";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !isAllowedSocialImageUrl(url)) {
    return new NextResponse("Invalid image URL.", { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Referer: new URL(url).origin,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return new NextResponse("Image unavailable.", { status: 502 });
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Image unavailable.", { status: 502 });
  }
}
