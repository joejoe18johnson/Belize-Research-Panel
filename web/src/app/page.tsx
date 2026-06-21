import { HomePageClient } from "@/components/home/HomePageClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { DEFAULT_DESCRIPTION } from "@/lib/seo/site-config";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, webPageJsonLd, webSiteJsonLd } from "@/lib/seo/json-ld";

export const metadata = buildPageMetadata({
  title: "Earn rewards for sharing your opinions in Belize",
  description: DEFAULT_DESCRIPTION,
  path: "/",
});

export default function HomePage() {
  const pageTitle = "Belize Research Panel — Earn rewards for sharing your opinions in Belize";

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          webSiteJsonLd(),
          webPageJsonLd({
            path: "/",
            title: pageTitle,
            description: DEFAULT_DESCRIPTION,
          }),
        ]}
      />
      <HomePageClient />
    </>
  );
}
