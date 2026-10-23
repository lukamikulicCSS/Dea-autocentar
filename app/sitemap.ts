import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getIndexableVehicles, getSiteSettings } from "@/lib/vehicles/queries";

export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings();
  const vehicles = await getIndexableVehicles(settings);
  const latest = vehicles[0]?.updated_at ? new Date(vehicles[0].updated_at) : new Date();
  return [
    { url: absoluteUrl("/"), lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/vozila"), lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/premium"), lastModified: latest, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/u-dolasku"), lastModified: latest, changeFrequency: "daily", priority: 0.7 },
    { url: absoluteUrl("/o-nama"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/kontakt"), changeFrequency: "monthly", priority: 0.6 },
    ...vehicles.map((v) => ({
      url: absoluteUrl(`/vozila/${v.slug}`),
      lastModified: new Date(v.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
