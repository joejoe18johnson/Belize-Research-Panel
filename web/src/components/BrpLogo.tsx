import Image from "next/image";
import Link from "next/link";

/** Logo for light backgrounds (dashboard, auth, registration). */
export const LOGO_LIGHT_BG_SRC = "/BRP-Logo-01.png";
/** Logo for dark backgrounds (marketing home hero). */
export const LOGO_DARK_BG_SRC = "/BRP-Logo.png";

export type BrpLogoVariant = "light" | "dark";

const LOGO_DIMENSIONS: Record<BrpLogoVariant, { width: number; height: number }> = {
  light: { width: 2800, height: 477 },
  dark: { width: 1024, height: 174 },
};

function logoSrc(variant: BrpLogoVariant): string {
  return variant === "dark" ? LOGO_DARK_BG_SRC : LOGO_LIGHT_BG_SRC;
}

export function BrpLogo({
  variant = "light",
  src,
  className = "",
  priority = false,
}: {
  /** `light` = light page background; `dark` = dark page background */
  variant?: BrpLogoVariant;
  /** Optional explicit logo file (e.g. `/BRP-Logo.png` on the home page). */
  src?: string;
  className?: string;
  priority?: boolean;
}) {
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
    <Link href={href} className={`inline-flex shrink-0 items-center ${className}`.trim()}>
      <BrpLogo variant={variant} src={src} priority={priority} className={logoClassName} />
    </Link>
  );
}
