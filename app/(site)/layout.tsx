import { BottomNav } from "@/components/site/BottomNav";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { JsonLd } from "@/components/site/JsonLd";
import { dealerJsonLd, websiteJsonLd } from "@/lib/seo";
import { getSiteSettings } from "@/lib/vehicles/queries";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <div className="pb-nav flex min-h-dvh flex-col">
      <JsonLd data={dealerJsonLd(settings)} />
      <JsonLd data={websiteJsonLd(settings)} />
      <Header settings={settings} />
      <main id="sadrzaj" className="flex-1">
        {children}
      </main>
      <Footer settings={settings} />
      <BottomNav />
    </div>
  );
}
