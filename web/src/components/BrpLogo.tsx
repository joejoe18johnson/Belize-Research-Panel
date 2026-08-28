import Image from "next/image";
import Link from "next/link";
import { PUBLIC_IMAGES } from "@/lib/public-images";

/** Text logo for faster loads during testing. Set NEXT_PUBLIC_USE_TEXT_LOGO=false to restore images. */
export const USE_TEXT_LOGO = process.env.NEXT_PUBLIC_USE_TEXT_LOGO !== "false";

/** Logo for light backgrounds (dashboard, auth, registration). */
export const LOGO_LIGHT_BG_SRC = PUBLIC_IMAGES.logoLight;
/** Logo for dark backgrounds (marketing home hero). */
export const LOGO_DARK_BG_SRC = PUBLIC_IMAGES.logoDark;

export type BrpLogoVariant = "light" | "dark";

const LOGO_DIMENSIONS: Record<BrpLogoVariant, { width: number; height: number }> = {
  light: { width: 2800, height: 477 },
  dark: { width: 1024, height: 174 },
};

function logoSrc(variant: BrpLogoVariant): string {
  return variant === "dark" ? LOGO_DARK_BG_SRC : LOGO_LIGHT_BG_SRC;
}

const INITIALS_SIZE_CLASS = {
  xs: "h-7 min-w-7 px-1 text-[9px]",
  sm: "h-8 min-w-8 px-1 text-[10px]",
  md: "h-10 min-w-10 px-1.5 text-xs",
  lg: "h-12 min-w-12 px-1.5 text-sm",
} as const;

/** Default campaign/survey mark when no custom logo is uploaded. */
export function BrpInitialsMark({
  size = "md",
  className = "",
}: {
  size?: keyof typeof INITIALS_SIZE_CLASS;
  className?: string;
}) {
  return (
    <span
      aria-label="Belize Research Panel"
      className={`inline-flex items-center justify-center rounded-lg bg-teal-700 font-bold tracking-[0.12em] text-white ${INITIALS_SIZE_CLASS[size]} ${className}`.trim()}
    >
      BRP
    </span>
  );
}

export function BrpLogoText({
  variant = "light",
  className = "",
}: {
  variant?: BrpLogoVariant;
  className?: string;
}) {
  const isDark = variant === "dark";

  return (
    <span
      className={`inline-flex max-w-[12.5rem] flex-wrap items-baseline gap-x-1 text-[0.8125rem] font-bold leading-tight tracking-tight sm:max-w-none sm:text-base ${className}`.trim()}
      aria-label="Belize Research Panel"
    >
      <span className={isDark ? "text-teal-200" : "text-teal-700 dark:text-teal-300"}>Belize</span>
      <span className={isDark ? "text-white" : "text-teal-950 dark:text-teal-100"}>Research Panel</span>
    </span>
  );
}

export function BrpLogo({
  variant = "light",
  src,
  className = "",
  priority = false,
}: {
  /** `light` = light page background; `dark` = dark page background */
  variant?: BrpLogoVariant;
  /** Optional explicit logo file (e.g. `/images/BRP-Logo.png` on the home page). */
  src?: string;
  className?: string;
  priority?: boolean;
}) {
  if (USE_TEXT_LOGO) {
    return <BrpLogoText variant={variant} className={className} />;
  }

  if (variant === "light") {
    const lightDimensions = LOGO_DIMENSIONS.light;
    const darkDimensions = LOGO_DIMENSIONS.dark;
    const imageClass = `h-8 w-auto max-w-[min(100vw-8rem,11rem)] bg-transparent sm:h-10 sm:max-w-none ${className}`.trim();

    return (
      <>
        <Image
          src={src ?? LOGO_LIGHT_BG_SRC}
          alt="Belize Research Panel"
          width={lightDimensions.width}
          height={lightDimensions.height}
          priority={priority}
          sizes="(max-width: 640px) 9rem, 11rem"
          className={`${imageClass} dark:hidden`}
        />
        <Image
          src={LOGO_DARK_BG_SRC}
          alt=""
          aria-hidden
          width={darkDimensions.width}
          height={darkDimensions.height}
          sizes="(max-width: 640px) 9rem, 11rem"
          className={`${imageClass} hidden dark:inline-block`}
        />
      </>
    );
  }

  const resolvedSrc = src ?? logoSrc(variant);
  const dimensions = src === LOGO_DARK_BG_SRC || (!src && variant === "dark")
    ? LOGO_DIMENSIONS.dark
    : LOGO_DIMENSIONS.light;
  const { width, height } = dimensions;

  return (
    <Image
      src={resolvedSrc}
      alt="Belize Research Panel"
      width={width}
      height={height}
      priority={priority}
      sizes="(max-width: 640px) 9rem, 11rem"
      className={`h-8 w-auto max-w-[min(100vw-8rem,11rem)] bg-transparent sm:h-10 sm:max-w-none ${className}`.trim()}
    />
  );
}

export function BrpLogoLink({
  href = "/",
  variant = "light",
  src,
  className = "",
  logoClassName = "",
  priority = false,
}: {
  href?: string;
  variant?: BrpLogoVariant;
  src?: string;
  className?: string;
  logoClassName?: string;
  priority?: boolean;
}) {
  return (
    <Link href={href} className={`shrink-0 ${className}`.trim()}>
      <span className="inline-flex items-center">
        <BrpLogo
          variant={variant}
          src={src}
          priority={USE_TEXT_LOGO ? false : priority}
          className={logoClassName}
        />
      </span>
    </Link>
  );
}
