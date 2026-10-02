import type { Metadata, Viewport } from "next";
import { brand } from "@/config/brand";
import { uiFontVariables } from "@/styles/fonts";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${brand.name} · ${brand.tagline}`,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  openGraph: {
    title: `${brand.name} · ${brand.tagline}`,
    description: brand.description,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#060609",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={uiFontVariables}>
      <body className="min-h-dvh font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
