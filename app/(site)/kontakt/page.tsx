import type { Metadata } from "next";
import { ContactDetails } from "@/components/site/ContactDetails";
import { InquiryForm } from "@/components/site/InquiryForm";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHeader } from "@/components/site/PageHeader";
import { breadcrumbJsonLd } from "@/lib/seo";
import { getSiteSettings } from "@/lib/vehicles/queries";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const where = [s.street_address, s.city].filter(Boolean).join(", ");
  return {
    title: "Kontakt i lokacija",
    description: `Kontakt ${s.business_name}${where ? `, ${where}` : ""}${s.phone ? `. Telefon ${s.phone}` : ""}. Pošaljite upit ili dogovorite posjet salonu.`,
    alternates: { canonical: "/kontakt" },
  };
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Početna", path: "/" }, { name: "Kontakt", path: "/kontakt" }])} />
      <PageHeader
        title="Kontakt"
        description="Nazovite nas, pošaljite upit ili dođite u salon. Posjet možete dogovoriti u terminu koji vama odgovara."
        crumbs={[{ name: "Početna", href: "/" }, { name: "Kontakt" }]}
      />
      <section className="wrap grid gap-12 py-14 lg:grid-cols-2 lg:gap-20 lg:py-20">
        <ContactDetails settings={settings} tone="light" />
        <div className="rounded-sm border border-line bg-surface p-6 sm:p-8">
          <h2 className="text-xl" style={{ fontStretch: "110%" }}>Pošaljite upit</h2>
          <p className="mb-6 mt-2 text-[0.9375rem] text-ink-muted">Dovoljna je vaša email adresa. Napišite što vas zanima i javit ćemo vam se.</p>
          <InquiryForm />
        </div>
      </section>
    </>
  );
}
