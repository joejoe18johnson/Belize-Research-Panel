import type { SocialPlatform } from "@/lib/social-profile";

function FacebookGlyph({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 4.99 3.63 9.13 8.38 9.93v-7.02H7.9v-2.91h2.34V9.84c0-2.31 1.37-3.59 3.48-3.59.99 0 2.03.18 2.03.18v2.23h-1.14c-1.13 0-1.48.7-1.48 1.42v1.71h2.52l-.4 2.91h-2.12V22c4.75-.8 8.38-4.94 8.38-9.93Z" />
    </svg>
  );
}

function InstagramGlyph({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 1.8A3.7 3.7 0 0 0 3.8 7.5v9a3.7 3.7 0 0 0 3.7 3.7h9a3.7 3.7 0 0 0 3.7-3.7v-9a3.7 3.7 0 0 0-3.7-3.7h-9Zm9.75 1.35a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3ZM12 7.2A4.8 4.8 0 1 1 12 16.8 4.8 4.8 0 0 1 12 7.2Zm0 1.8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  );
}

function TikTokGlyph({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.28 6.34 6.34 0 0 0 9.5 21.62a6.34 6.34 0 0 0 6.34-6.34V8.66a8.2 8.2 0 0 0 4.8 1.53V6.74a4.85 4.85 0 0 1-1.05-.05Z" />
    </svg>
  );
}

const PLATFORM_STYLES: Record<SocialPlatform, string> = {
  facebook: "bg-[#1877F2] text-white",
  instagram: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white",
  tiktok: "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
};

export function SocialPlatformIcon({
  platform,
  className = "h-12 w-12",
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  const glyphClass = "h-6 w-6";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full ${PLATFORM_STYLES[platform]} ${className}`}
      aria-hidden="true"
    >
      {platform === "facebook" ? <FacebookGlyph className={glyphClass} /> : null}
      {platform === "instagram" ? <InstagramGlyph className={glyphClass} /> : null}
      {platform === "tiktok" ? <TikTokGlyph className={glyphClass} /> : null}
    </div>
  );
}
