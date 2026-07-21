import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";
import { ROUTES } from "@/lib/routes";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ROUTES.map((route) => ({
    url: route === "/" ? SITE.url : `${SITE.url}${route}`,
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "yearly",
    priority: route === "/" ? 1 : 0.3,
  }));
}
