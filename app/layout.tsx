import type { Metadata, Viewport } from "next";
import { indexingAllowed, siteUrl } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Auto Centar DEA – provjerena vozila u Zenici",
    template: "%s | Auto Centar DEA",
  },
  description:
    "Auto Centar DEA, Zenica: provjerena rabljena i premium vozila, probna vožnja, zamjena uz besplatnu procjenu te osiguranje i registracija na jednom mjestu.",
  applicationName: "Auto Centar DEA",
  robots: indexingAllowed()
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: "hr_BA",
    siteName: "Auto Centar DEA",
    images: [{ url: "/images/salon-audi-r8.jpg", width: 1434, height: 1600, alt: "Salon Auto Centra DEA u Zenici" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#111315",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <head>
        <link rel="preload" href="/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
