import type { MetadataRoute } from "next";
import { URL_SITO } from "@/lib/sito";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/dashboard" },
    sitemap: `${URL_SITO}/sitemap.xml`,
  };
}
