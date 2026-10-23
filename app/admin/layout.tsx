import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Administracija", template: "%s | DEA administracija" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#efefeb]">{children}</div>;
}
