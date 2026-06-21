import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-config";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/signup", "/login", "/help", "/site-policy", "/data-use-policy"],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/client/",
          "/api/",
          "/register",
          "/account/",
          "/verify-email",
          "/forgot-password",
          "/reset-password",
          "/contact",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
